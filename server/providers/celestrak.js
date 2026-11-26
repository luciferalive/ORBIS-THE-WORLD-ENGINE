// CelesTrak GP data (public orbital elements). https://celestrak.org/NORAD/documentation/gp-data-formats.php
// ORBIS shows the CATALOGUE and orbital elements. It does not propagate live positions (needs SGP4), so no position is claimed.
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { meta } from "../models.js";
export const ID = "celestrak";
registry.declare(ID, { name: "CelesTrak", kind: "satellite catalogue", frequency: "element sets updated several times/day", url: "https://celestrak.org", keyRequired: false });
export const GROUPS = ["stations", "visual", "weather", "gps-ops", "science", "starlink"];
const MU = 398600.4418, RE = 6378.137;
export function parseGp(raw, group) {
  if (!Array.isArray(raw)) throw new Error("unexpected CelesTrak response");
  const m = meta({ provider: "CelesTrak", source: "GP element sets (group " + group + ")", status: "RECENT", frequency: "several times per day", dataType: "orbital elements", attribution: "CelesTrak (Dr. T.S. Kelso)", license: "Public; attribution requested", note: "Orbital elements only. Live positions are not computed." });
  return raw.filter((r) => r.OBJECT_NAME && r.NORAD_CAT_ID != null).map((r) => { const n = Number(r.MEAN_MOTION), a = n > 0 ? Math.cbrt(MU / Math.pow((n * 2 * Math.PI) / 86400, 2)) : null; return { name: r.OBJECT_NAME, noradId: r.NORAD_CAT_ID, intlDesignator: r.OBJECT_ID, epoch: r.EPOCH, inclinationDeg: Number(r.INCLINATION), eccentricity: Number(r.ECCENTRICITY), periodMin: n > 0 ? 1440 / n : null, meanAltitudeKm: a ? Math.round(a - RE) : null, group, meta: m }; });
}
export async function fetchGroup(group) { if (!GROUPS.includes(group)) throw new Error("unknown group"); const raw = await fetchJson(`https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=json`, { id: ID }); const o = parseGp(raw, group); registry.ok(ID, "RECENT"); return o; }
