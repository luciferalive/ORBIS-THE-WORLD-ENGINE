// Country boundaries: Natural Earth 110m (public domain) served from GitHub raw; cached to disk after first success.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fetchRaw } from "../http.js";
import { config } from "../config.js";
import * as registry from "../registry.js";
export const ID = "naturalearth";
registry.declare(ID, { name: "Natural Earth boundaries", kind: "geospatial", frequency: "static", url: "https://www.naturalearthdata.com", keyRequired: false });
const URL_NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const FILE = config.cacheDir + "countries.geojson";
/** Reduce a Natural Earth file to what the globe needs: iso2/iso3/name + rings of [lon,lat] with 2-decimal precision. */
export function simplify(geo) {
  if (!geo || !Array.isArray(geo.features)) throw new Error("not a GeoJSON FeatureCollection");
  const r2 = (n) => Math.round(n * 100) / 100;
  const feats = geo.features.map((f) => {
    const p = f.properties || {}, g = f.geometry; if (!g) return null;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    const iso2 = p.ISO_A2 && p.ISO_A2 !== "-99" ? p.ISO_A2 : p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : null;
    const iso3 = p.ISO_A3 && p.ISO_A3 !== "-99" ? p.ISO_A3 : p.ADM0_A3 || null;
    return { iso2, iso3, name: p.NAME || p.ADMIN || "", polys: polys.map((poly) => poly.map((ring) => ring.map(([x, y]) => [r2(x), r2(y)]))) };
  }).filter((f) => f && f.polys.length);
  return feats;
}
export async function loadCountries() {
  try { return { feats: JSON.parse(await readFile(FILE, "utf8")), source: "disk-cache" }; } catch {}
  const txt = await fetchRaw(URL_NE, { id: ID, timeout: 20000 });
  const feats = simplify(JSON.parse(txt));
  await mkdir(config.cacheDir, { recursive: true }); await writeFile(FILE, JSON.stringify(feats)); registry.ok(ID, "PERIODIC");
  return { feats, source: "download" };
}
