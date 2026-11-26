import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import * as svc from "./services.js";
import * as ai from "./ai.js";
import * as providers from "./core/providers.js";
import * as db from "./core/db.js";
import * as scheduler from "./core/scheduler.js";
import { RANGES } from "./data/demo.js";

const WEB = fileURLToPath(new URL("../web/", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".otf": "font/otf", ".json": "application/json", ".png": "image/png" };
const SEC = { "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "same-origin", "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'" };
const adminHits = new Map();
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

export async function route(method, url, body, headers = {}) {
  const p = url.pathname, q = url.searchParams, seg = p.split("/").filter(Boolean);
  if (method === "GET") {
    if (p === "/api/status") return svc.getStatus();
    if (p === "/api/markets") { const r = await svc.getAssets(); return { assets: r.assets.map(({ series, ...a }) => ({ ...a, series: series.map((x) => [x.t, x.v]) })), notes: r.notes, generatedAt: new Date().toISOString() }; }
    if (seg[1] === "markets" && seg[3] === "history" && seg.length === 4) { const range = q.get("range") || "24H"; if (!RANGES[range]) throw new HttpError(400, "range must be one of " + Object.keys(RANGES).join(", ")); const h = await svc.getHistory(seg[2], range); if (!h) throw new HttpError(404, "unknown asset"); return { id: seg[2], range, series: h.series.map((x) => [x.t, x.v]), meta: h.meta }; }
    if (p === "/api/signals") return svc.getSignals();
    if (p === "/api/events") { const r = await svc.getEvents(); const list = svc.filterEvents(r.events, { category: q.get("category"), country: q.get("country"), severity: q.get("severity"), q: q.get("q"), sort: q.get("sort") || "latest" }); return { events: list, total: r.events.length, feeds: r.feeds, sample: r.sample }; }
    if (seg[1] === "events" && seg.length === 3) { const r = await svc.getEvents(); const e = r.events.find((x) => x.id === decodeURIComponent(seg[2])); if (!e) throw new HttpError(404, "event not found"); const related = r.events.filter((x) => x.id !== e.id && (x.category === e.category || x.countries.some((c) => e.countries.includes(c)))).slice(0, 6); return { event: e, related, sample: r.sample }; }
    if (p === "/api/quakes") return svc.getQuakes();
    if (p === "/api/indicator-table") return (await svc.getIndicatorTable((q.get("keys") || "").split(",").filter(Boolean))) || (() => { throw new HttpError(400, "no valid indicator keys"); })();
    if (p === "/api/climate") return svc.getClimate();
    if (p === "/api/oceans") return svc.getOceans();
    if (p === "/api/airquality") return svc.getAirQuality();
    if (p === "/api/iss") return svc.getIss();
    if (p === "/api/astronomy") return svc.getAstronomy();
    if (p === "/api/species") return q.get("name") ? svc.getSpecies(q.get("name")) : { species: svc.SPECIES };
    if (p === "/api/technews") return svc.getTechNews();
    if (p === "/api/filers") return svc.getFilerList();
    if (p.startsWith("/api/filers/")) return (await svc.getFiler(p.slice(12))) || (() => { throw new HttpError(404, "unknown filer"); })();
    if (p === "/api/megaprojects") return svc.getMegaprojects();
    if (p === "/api/chokepoints") return svc.getChokepoints();
    if (p === "/api/simulate/models") return svc.getSimulationModels();
    if (p === "/api/launches") return svc.getLaunches();
    if (p === "/api/neo") return svc.getNeo();
    if (p === "/api/spaceweather") return svc.getSpaceWeather();
    if (p === "/api/satellites") return svc.getSatellites(q.get("group") || "stations") || (() => { throw new HttpError(400, "unknown group"); })();
    if (p === "/api/publications") return svc.getPublications((q.get("q") || "").slice(0, 100));
    if (p === "/api/preprints") return svc.getPreprints(q.get("cat") || "astro-ph").catch((e) => { throw new HttpError(400, e.message); });
    if (p === "/api/vulnerabilities") return svc.getVulnerabilities();
    if (p === "/api/aircraft") return svc.getAircraft();
    if (p === "/api/jobs") return scheduler.status();
    if (p === "/api/stored/stats") return { ...db.stats(), series: db.listSeries(), note: "Only real observations (LIVE/RECENT/PERIODIC) are stored. DEMO and SAMPLE values are never recorded." };
    if (p === "/api/stored/series") { const id = q.get("id"); if (!id || id.length > 80) throw new HttpError(400, "id required"); const pts = db.querySeries(id, Number(q.get("from")) || 0, Number(q.get("to")) || undefined); return { id, points: pts, count: pts.length, meta: { status: pts.length ? "PERIODIC" : "UNAVAILABLE", provider: "ORBIS recorder", source: "ORBIS SQLite store (collected from providers)", frequency: "per collector interval", dataType: "recorded series", note: pts.length ? "Recorded by ORBIS since collection began; gaps mean the server was off or the provider failed." : "No recorded points for this series yet." } }; }
    if (p === "/api/stored/events") return { events: db.queryEvents({ from: q.get("from") || undefined, category: q.get("category") || undefined, limit: Number(q.get("limit")) || 200 }) };
    if (p === "/api/providers") return { providers: providers.listProviders(), adminEnabled: !!config.adminToken, offline: config.offline, generatedAt: new Date().toISOString() };
    if (p === "/api/anomalies") return svc.getAnomalies();
    if (p === "/api/hazards") return svc.getHazards();
    if (p === "/api/weather") return svc.getWeather();
    if (p === "/api/macro") return svc.getMacroCatalog();
    if (p.startsWith("/api/macro/")) return (await svc.getMacro(decodeURIComponent(p.slice(11)))) || (() => { throw new HttpError(404, "unknown series"); })();
    if (p === "/api/indicators") return svc.getIndicatorCatalog();
    if (p.startsWith("/api/indicators/")) { const [, , , iso, key] = p.split("/"); return (await svc.getCountrySeries(iso, key)) || (() => { throw new HttpError(404, "unknown country or indicator"); })(); }
    if (p === "/api/countries") return svc.getCountries();
    if (p === "/api/cities") return svc.getCities();
    if (p === "/api/humanity") return svc.getHumanity();
    if (p === "/api/resources") return svc.getResources();
    if (p === "/api/history") return svc.getHistoryTimeline();
    if (p === "/api/forecast/population") return svc.getForecastPopulation();
    if (p === "/api/forecast/asset") { const f = await svc.getForecastAsset(q.get("id") || "", Math.min(90, Number(q.get("steps")) || 30)); if (!f) throw new HttpError(404, "no forecast for that asset"); return f; }
    if (p === "/api/graph") return (await svc.getGraph(q.get("focus"), { depth: Math.min(3, Number(q.get("depth")) || 2), limit: Math.min(120, Number(q.get("limit")) || 60), types: q.get("rel") ? q.get("rel").split(",") : null })) || (() => { throw new HttpError(404, "unknown entity"); })();
    if (p === "/api/search") return { results: await svc.getSearch(q.get("q") || "") };
    if (p === "/api/geo/countries") return svc.getGeo();
    if (p === "/api/analyst/status") return { enabled: ai.enabled(), model: ai.enabled() ? config.analystModel : null };
    if (p === "/api/analyst/context") return ai.buildContext();
  }
  if (p.startsWith("/api/admin/")) {
    providers.requireAdmin(headers["x-admin-token"]);
    if (method === "POST" && p === "/api/admin/providers") return providers.registerCustom(body || {});
    const m = p.match(/^\/api\/admin\/providers\/([a-z0-9-]+)(\/test)?$/);
    if (m && method === "POST" && m[2]) return providers.testProvider(m[1]);
    if (m && method === "DELETE" && !m[2]) return providers.removeCustom(m[1]);
    throw new HttpError(404, "unknown admin route");
  }
  if (method === "POST" && p === "/api/simulate") { try { return svc.runSimulation(body && body.model, (body && body.params) || {}); } catch (e) { throw new HttpError(400, e.message); } }
  if (method === "POST" && p === "/api/alerts/evaluate") { const r = await svc.evaluateAlertRules(body && body.rules); if (r.error) throw new HttpError(400, r.error); return r; }
  if (method === "POST" && p === "/api/analyst/ask") { if (!body || typeof body.question !== "string" || !body.question.trim()) throw new HttpError(400, "question required"); const r = await ai.ask(body.question); if (!r.enabled) return { enabled: false, message: "AI Analyst is disabled: no ANTHROPIC_API_KEY configured on the server. No answer was generated." }; return r; }
  throw new HttpError(404, "not found");
}
async function staticFile(res, pathname) {
  let rel = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, ""); if (!rel || rel.endsWith("/")) rel += "index.html";
  if (rel.includes("..")) { res.writeHead(403, SEC); return res.end(); }
  try { const data = await readFile(join(WEB, rel)); res.writeHead(200, { "Content-Type": TYPES[extname(rel)] || "application/octet-stream", "Cache-Control": "no-cache", ...SEC }); res.end(data); }
  catch { res.writeHead(404, { "Content-Type": "text/plain", ...SEC }); res.end("Not found"); }
}
export function createApp() {
  return async (req, res) => {
    const url = new URL(req.url, "http://x");
    if (!url.pathname.startsWith("/api/")) return staticFile(res, url.pathname);
    const send = (s, b) => { res.writeHead(s, { "Content-Type": "application/json", "Cache-Control": "no-store", ...SEC }); res.end(JSON.stringify(b)); };
    try {
      if (url.pathname.startsWith("/api/admin/")) { const k = req.socket.remoteAddress + ":" + Math.floor(Date.now() / 60000); adminHits.set(k, (adminHits.get(k) || 0) + 1); if (adminHits.get(k) > 30) throw new HttpError(429, "too many admin requests"); if (adminHits.size > 500) adminHits.clear(); }
      let body = null;
      if (req.method === "POST") { const parts = []; let n = 0; for await (const c of req) { n += c.length; if (n > 32768) throw new HttpError(413, "too large"); parts.push(c); } try { body = JSON.parse(Buffer.concat(parts).toString() || "{}"); } catch { throw new HttpError(400, "invalid JSON"); } }
      send(200, await route(req.method, url, body, req.headers));
    } catch (e) {
      if (e instanceof HttpError || (e.status >= 400 && e.status < 600)) return send(e.status, { error: e.message });
      if (url.pathname.startsWith("/api/admin/")) return send(400, { error: e.message });
      console.error("[orbis]", e); send(500, { error: "Internal error: " + String(e.message || e).slice(0, 160) });
    }
  };
}
export const listen = (port = config.port) => new Promise((r) => { const s = createServer(createApp()); s.listen(port, () => r(s)); });
