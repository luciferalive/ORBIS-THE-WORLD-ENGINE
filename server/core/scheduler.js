// Background collectors: poll providers on fixed intervals and persist real observations to SQLite.
// Never runs in offline mode, and a job that fails is logged (job_runs) and retried at its next interval.
import { config } from "../config.js";
import * as db from "./db.js";
import * as svc from "../services.js";
const state = new Map();
export const JOBS = [
  { id: "markets", everyMs: 5 * 60e3, async run() { const { assets } = await svc.getAssets(); return db.addPoints(assets.map((a) => ({ id: "price:" + a.id, t: Math.floor(Date.now() / 300e3) * 300e3, v: a.price, status: a.meta.status, provider: a.meta.provider }))); } },
  { id: "events", everyMs: 10 * 60e3, async run() { const e = await svc.getEvents(); return db.addEvents(e.events); } },
  { id: "hazards", everyMs: 15 * 60e3, async run() { const [h, q] = await Promise.all([svc.getHazards(), svc.getQuakes()]); return db.addEvents([...h.hazards, ...q.quakes].map((x) => ({ ...x, meta: x.meta }))); } },
  { id: "spaceweather", everyMs: 30 * 60e3, async run() { const k = await svc.getSpaceWeather(); if (!k.available) throw new Error(k.error); return db.addPoints(k.points.slice(-8).map((p) => ({ id: "kp", t: Date.parse(p.time), v: p.kp, status: "RECENT", provider: "NOAA SWPC" }))); } },
  { id: "climate", everyMs: 12 * 3600e3, async run() { const c = await svc.getClimate(); let n = 0; if (c.co2.available) n += db.addPoints(c.co2.points.slice(-24).map((p) => ({ id: "co2_ppm", t: p.t, v: p.v, status: "PERIODIC", provider: "NOAA GML" }))); if (c.temperature.available) n += db.addPoints(c.temperature.monthly.slice(-36).map((p) => ({ id: "temp_anomaly_c", t: p.t, v: p.v, status: "PERIODIC", provider: "NASA GISS" }))); return n; } },
  { id: "aircraft", everyMs: 15 * 60e3, async run() { const a = await svc.getAircraft(); if (!a.available) throw new Error(a.error); return db.addPoints([{ id: "aircraft_airborne_seen", t: Math.floor(Date.now() / 900e3) * 900e3, v: a.aircraft.length, status: "LIVE", provider: "OpenSky Network" }]); } },
];
export async function runJob(job) {
  const t0 = Date.now(), s = state.get(job.id) || { runs: 0, failures: 0 };
  try { const rows = await job.run(); db.logRun(job.id, true, Date.now() - t0, rows); Object.assign(s, { lastRun: new Date().toISOString(), lastOk: new Date().toISOString(), lastRows: rows, lastError: null }); s.runs++; }
  catch (e) { db.logRun(job.id, false, Date.now() - t0, 0, e.message); Object.assign(s, { lastRun: new Date().toISOString(), lastError: e.message }); s.runs++; s.failures++; }
  state.set(job.id, s); return s;
}
let timers = [];
export function start() {
  if (config.offline || !config.scheduler) return false; db.open(); stop();
  JOBS.forEach((j, i) => { setTimeout(() => runJob(j), 5000 + i * 3000); const t = setInterval(() => runJob(j), j.everyMs); t.unref(); timers.push(t); }); const p = setInterval(() => db.prune(), 24 * 3600e3); p.unref(); timers.push(p); return true;
}
export const stop = () => { timers.forEach(clearInterval); timers = []; };
export const status = () => ({ enabled: !config.offline && config.scheduler, offline: config.offline, jobs: JOBS.map((j) => ({ id: j.id, everyMinutes: Math.round(j.everyMs / 60e3), ...(state.get(j.id) || { runs: 0, failures: 0 }) })), recent: (() => { try { return db.lastRuns(20); } catch { return []; } })() });
