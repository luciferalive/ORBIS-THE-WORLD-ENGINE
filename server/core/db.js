// SQLite persistence (node:sqlite, built in; experimental in Node 22). Stores only REAL observations:
// DEMO/SAMPLE values are never written, so history can never contain invented data.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "../config.js";
let db;
export function open(path = config.dbPath) {
  if (db) return db;
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS series (id TEXT NOT NULL, t INTEGER NOT NULL, v REAL NOT NULL, status TEXT NOT NULL, provider TEXT NOT NULL, PRIMARY KEY (id, t));
    CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, time TEXT NOT NULL, category TEXT, severity INTEGER, title TEXT NOT NULL, source TEXT, url TEXT, kind TEXT, lat REAL, lon REAL, status TEXT, provider TEXT, first_seen TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS events_time ON events(time);
    CREATE TABLE IF NOT EXISTS job_runs (id INTEGER PRIMARY KEY AUTOINCREMENT, job TEXT NOT NULL, at TEXT NOT NULL, ok INTEGER NOT NULL, ms INTEGER, rows INTEGER, error TEXT);
    CREATE INDEX IF NOT EXISTS job_runs_job ON job_runs(job, at);`);
  return db;
}
export const close = () => { if (db) { db.close(); db = null; } };
const REAL = new Set(["LIVE", "RECENT", "PERIODIC"]);
/** points: [{id,t(ms),v,status,provider}] -> inserted count. Non-real statuses and non-finite values are rejected. */
export function addPoints(points) {
  const d = open(), st = d.prepare("INSERT OR IGNORE INTO series (id,t,v,status,provider) VALUES (?,?,?,?,?)"); let n = 0;
  d.exec("BEGIN"); try { for (const p of points) { if (!REAL.has(p.status) || !Number.isFinite(p.v) || !Number.isFinite(p.t)) continue; n += Number(st.run(p.id, Math.round(p.t), p.v, p.status, p.provider).changes); } d.exec("COMMIT"); } catch (e) { d.exec("ROLLBACK"); throw e; }
  return n;
}
export function addEvents(events) {
  const d = open(), st = d.prepare("INSERT OR IGNORE INTO events (id,time,category,severity,title,source,url,kind,lat,lon,status,provider,first_seen) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"); let n = 0, now = new Date().toISOString();
  d.exec("BEGIN"); try { for (const e of events) { if (e.kind === "sample" || !REAL.has(e.meta && e.meta.status)) continue; n += Number(st.run(e.id, e.time, e.category || null, e.severity ?? null, e.title, e.source || null, e.url || null, e.kind || null, e.lat ?? null, e.lon ?? null, e.meta.status, e.meta.provider || null, now).changes); } d.exec("COMMIT"); } catch (er) { d.exec("ROLLBACK"); throw er; }
  return n;
}
export const querySeries = (id, from = 0, to = Date.now() + 1e10, limit = 5000) => open().prepare("SELECT t, v, status, provider FROM series WHERE id = ? AND t BETWEEN ? AND ? ORDER BY t ASC LIMIT ?").all(id, from, to, Math.min(limit, 20000));
export const listSeries = () => open().prepare("SELECT id, COUNT(*) AS points, MIN(t) AS first, MAX(t) AS last FROM series GROUP BY id ORDER BY id").all();
export function queryEvents({ from, category, limit = 200 } = {}) { const w = [], a = []; if (from) { w.push("time >= ?"); a.push(from); } if (category) { w.push("category = ?"); a.push(category); } return open().prepare(`SELECT * FROM events ${w.length ? "WHERE " + w.join(" AND ") : ""} ORDER BY time DESC LIMIT ?`).all(...a, Math.min(limit, 1000)); }
export const logRun = (job, ok, ms, rows, error) => open().prepare("INSERT INTO job_runs (job,at,ok,ms,rows,error) VALUES (?,?,?,?,?,?)").run(job, new Date().toISOString(), ok ? 1 : 0, ms, rows ?? 0, error ? String(error).slice(0, 200) : null);
export const lastRuns = (limit = 50) => open().prepare("SELECT * FROM job_runs ORDER BY id DESC LIMIT ?").all(limit);
export function stats() { const d = open(); const one = (q) => d.prepare(q).get(); return { seriesPoints: one("SELECT COUNT(*) c FROM series").c, seriesCount: one("SELECT COUNT(DISTINCT id) c FROM series").c, events: one("SELECT COUNT(*) c FROM events").c, oldestEvent: one("SELECT MIN(time) m FROM events").m, newestPoint: one("SELECT MAX(t) m FROM series").m, jobRuns: one("SELECT COUNT(*) c FROM job_runs").c }; }
export function prune(days = 400) { const cut = Date.now() - days * 86400e3; const d = open(); return Number(d.prepare("DELETE FROM series WHERE t < ?").run(cut).changes) + Number(d.prepare("DELETE FROM job_runs WHERE at < ?").run(new Date(cut).toISOString()).changes); }
