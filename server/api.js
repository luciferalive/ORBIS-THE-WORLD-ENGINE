import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import * as svc from "./services.js";
import * as ai from "./ai.js";
import { RANGES } from "./data/demo.js";

const WEB = fileURLToPath(new URL("../web/", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".otf": "font/otf", ".json": "application/json", ".png": "image/png" };
const SEC = { "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "same-origin", "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'" };
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

export async function route(method, url, body) {
  const p = url.pathname, q = url.searchParams, seg = p.split("/").filter(Boolean);
  if (method === "GET") {
    if (p === "/api/status") return svc.getStatus();
    if (p === "/api/markets") { const r = await svc.getAssets(); return { assets: r.assets.map(({ series, ...a }) => ({ ...a, series: series.map((x) => [x.t, x.v]) })), notes: r.notes, generatedAt: new Date().toISOString() }; }
    if (seg[1] === "markets" && seg[3] === "history" && seg.length === 4) { const range = q.get("range") || "24H"; if (!RANGES[range]) throw new HttpError(400, "range must be one of " + Object.keys(RANGES).join(", ")); const h = await svc.getHistory(seg[2], range); if (!h) throw new HttpError(404, "unknown asset"); return { id: seg[2], range, series: h.series.map((x) => [x.t, x.v]), meta: h.meta }; }
    if (p === "/api/signals") return svc.getSignals();
    if (p === "/api/events") { const r = await svc.getEvents(); const list = svc.filterEvents(r.events, { category: q.get("category"), country: q.get("country"), severity: q.get("severity"), q: q.get("q"), sort: q.get("sort") || "latest" }); return { events: list, total: r.events.length, feeds: r.feeds, sample: r.sample }; }
    if (seg[1] === "events" && seg.length === 3) { const r = await svc.getEvents(); const e = r.events.find((x) => x.id === decodeURIComponent(seg[2])); if (!e) throw new HttpError(404, "event not found"); const related = r.events.filter((x) => x.id !== e.id && (x.category === e.category || x.countries.some((c) => e.countries.includes(c)))).slice(0, 6); return { event: e, related, sample: r.sample }; }
    if (p === "/api/quakes") return svc.getQuakes();
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
      let body = null;
      if (req.method === "POST") { const parts = []; let n = 0; for await (const c of req) { n += c.length; if (n > 32768) throw new HttpError(413, "too large"); parts.push(c); } try { body = JSON.parse(Buffer.concat(parts).toString() || "{}"); } catch { throw new HttpError(400, "invalid JSON"); } }
      send(200, await route(req.method, url, body));
    } catch (e) {
      if (e instanceof HttpError) return send(e.status, { error: e.message });
      console.error("[orbis]", e); send(500, { error: "Internal error: " + String(e.message || e).slice(0, 160) });
    }
  };
}
export const listen = (port = config.port) => new Promise((r) => { const s = createServer(createApp()); s.listen(port, () => r(s)); });
