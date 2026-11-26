// NASA Open APIs (api.nasa.gov). NeoWs = Near Earth Object Web Service. DEMO_KEY works but is heavily rate limited; set NASA_API_KEY.
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { config } from "../config.js";
import { meta } from "../models.js";
export const ID = "nasa";
registry.declare(ID, { name: "NASA Open APIs (NeoWs)", kind: "astronomy", frequency: "daily", url: "https://api.nasa.gov", keyRequired: true });
export function parseNeo(raw) {
  if (!raw || typeof raw.near_earth_objects !== "object") throw new Error("unexpected NeoWs response");
  const m = meta({ provider: "NASA JPL CNEOS via NeoWs", source: "Near Earth Object Web Service", status: "PERIODIC", frequency: "daily", dataType: "asteroid close approaches", attribution: "NASA/JPL-Caltech", license: "Public domain (NASA)" });
  const out = [];
  for (const list of Object.values(raw.near_earth_objects)) for (const o of list) { const c = o.close_approach_data?.[0]; if (!c) continue; out.push({ id: o.id, name: o.name, hazardous: !!o.is_potentially_hazardous_asteroid, diameterM: o.estimated_diameter?.meters?.estimated_diameter_max ?? null, approach: c.close_approach_date_full || c.close_approach_date, missKm: Number(c.miss_distance?.kilometers), velKmS: Number(c.relative_velocity?.kilometers_per_second), url: o.nasa_jpl_url, meta: m }); }
  return out.sort((a, b) => String(a.approach).localeCompare(String(b.approach)));
}
export async function fetchNeo() {
  const d = new Date(), s = d.toISOString().slice(0, 10), e = new Date(d.getTime() + 6 * 86400e3).toISOString().slice(0, 10);
  const raw = await fetchJson(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${s}&end_date=${e}&api_key=${encodeURIComponent(config.nasaKey)}`, { id: ID }); const o = parseNeo(raw); registry.ok(ID, "PERIODIC"); return o;
}
