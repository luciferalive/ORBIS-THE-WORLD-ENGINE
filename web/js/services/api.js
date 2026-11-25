// The only module that talks to the server. Provides caching, retry and a normalised error type.
const mem = new Map();
export class ApiError extends Error { constructor(msg, status) { super(msg); this.status = status; } }
async function once(path, opts) {
  let r; try { r = await fetch(path, opts); } catch (e) { throw new ApiError("Cannot reach the ORBIS server. Is it running?", 0); }
  let body = null; try { body = await r.json(); } catch {}
  if (!r.ok) throw new ApiError((body && body.error) || "Server error " + r.status, r.status);
  return body;
}
/** GET with TTL cache and one retry on network/5xx. */
export async function get(path, ttl = 0) {
  const hit = mem.get(path); if (ttl && hit && Date.now() - hit.at < ttl) return hit.value;
  let last; for (let i = 0; i < 2; i++) { try { const v = await once(path); mem.set(path, { at: Date.now(), value: v }); return v; } catch (e) { last = e; if (e.status && e.status < 500) break; await new Promise((r) => setTimeout(r, 400)); } }
  if (hit) return { ...hit.value, __stale: true }; throw last;
}
export const post = (path, body) => once(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
export const q = (o) => Object.entries(o).filter(([, v]) => v !== "" && v != null).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
export const api = {
  status: () => get("/api/status"), markets: () => get("/api/markets", 15e3), history: (id, range) => get(`/api/markets/${id}/history?range=${range}`, 60e3),
  signals: () => get("/api/signals", 30e3), events: (o = {}) => get("/api/events?" + q(o), 20e3), event: (id) => get("/api/events/" + encodeURIComponent(id)),
  quakes: () => get("/api/quakes", 60e3), countries: () => get("/api/countries", 600e3), cities: () => get("/api/cities", 600e3), humanity: () => get("/api/humanity", 600e3),
  resources: () => get("/api/resources", 60e3), history_: () => get("/api/history", 600e3), forecastPop: () => get("/api/forecast/population", 600e3), forecastAsset: (id, steps = 30) => get(`/api/forecast/asset?id=${id}&steps=${steps}`, 60e3),
  graph: (o) => get("/api/graph?" + q(o), 30e3), search: (s) => get("/api/search?q=" + encodeURIComponent(s)), geo: () => get("/api/geo/countries", 3600e3),
  hazards: () => get("/api/hazards", 300e3), weather: () => get("/api/weather", 300e3), anomalies: () => get("/api/anomalies", 30e3), macroCatalog: () => get("/api/macro", 600e3), macro: (id) => get("/api/macro/" + id, 600e3), indicator: (iso, key) => get(`/api/indicators/${iso}/${key}`, 3600e3), indicators: () => get("/api/indicators", 3600e3),
  evaluate: (rules) => post("/api/alerts/evaluate", { rules }),
  analystStatus: () => get("/api/analyst/status"), analystContext: () => get("/api/analyst/context"), ask: (question) => post("/api/analyst/ask", { question }),
};
