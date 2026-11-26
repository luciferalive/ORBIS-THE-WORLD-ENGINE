// NOAA Space Weather Prediction Center: planetary K-index (geomagnetic activity). Public domain, no key.
// https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { meta } from "../models.js";
export const ID = "swpc";
registry.declare(ID, { name: "NOAA SWPC", kind: "space weather", frequency: "3 hours (Kp)", url: "https://www.swpc.noaa.gov", keyRequired: false });
const LEVEL = (kp) => (kp >= 9 ? "G5 extreme" : kp >= 8 ? "G4 severe" : kp >= 7 ? "G3 strong" : kp >= 6 ? "G2 moderate" : kp >= 5 ? "G1 minor" : "quiet to unsettled");
export function parseKp(raw) {
  if (!Array.isArray(raw) || raw.length < 2) throw new Error("unexpected SWPC response");
  const rows = Array.isArray(raw[0]) ? raw.slice(1).map((r) => ({ t: r[0], kp: Number(r[1]) })) : raw.map((r) => ({ t: r.time_tag, kp: Number(r.Kp ?? r.kp_index) }));
  const pts = rows.filter((r) => r.t && Number.isFinite(r.kp)).map((r) => ({ time: new Date(r.t.replace(" ", "T") + (/Z|\+/.test(r.t) ? "" : "Z")).toISOString(), kp: r.kp }));
  if (!pts.length) throw new Error("no Kp values");
  const last = pts[pts.length - 1];
  return { points: pts, latest: { ...last, storm: LEVEL(last.kp) }, meta: meta({ provider: "NOAA SWPC", source: "Planetary K-index", status: "RECENT", frequency: "3 hours", dataType: "geomagnetic index", units: "Kp 0-9", attribution: "NOAA Space Weather Prediction Center", license: "US Government work (public domain)" }) };
}
export async function fetchKp() { const raw = await fetchJson("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", { id: ID }); const o = parseKp(raw); registry.ok(ID, "RECENT"); return o; }
