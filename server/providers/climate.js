// Climate & atmosphere series from NOAA GML (CO2, CH4), NASA GISTEMP (global temperature anomaly) and NSIDC (sea ice extent). All public, no key.
import { fetchRaw } from "../http.js";
import * as registry from "../registry.js";
import { meta } from "../models.js";
export const NOAA = "noaa-gml", GIS = "gistemp", NSIDC = "nsidc";
registry.declare(NOAA, { name: "NOAA GML trends", kind: "atmospheric CO2 / CH4", frequency: "monthly", url: "https://gml.noaa.gov/ccgg/trends/", keyRequired: false });
registry.declare(GIS, { name: "NASA GISTEMP", kind: "global temperature anomaly", frequency: "monthly", url: "https://data.giss.nasa.gov/gistemp/", keyRequired: false });
registry.declare(NSIDC, { name: "NSIDC Sea Ice Index", kind: "polar sea ice", frequency: "daily", url: "https://nsidc.org/data/g02135", keyRequired: false });
const num = (x) => Number(x);
/** NOAA GML monthly text: comment lines start with '#'; columns: year month decimal-date average ... Missing is -99.99 / -9.99. */
export function parseGml(text, { unit, label }) {
  if (typeof text !== "string") throw new Error("unexpected NOAA GML response");
  const pts = []; for (const line of text.split("\n")) { if (!line.trim() || line.startsWith("#")) continue; const c = line.trim().split(/\s+/).map(num); if (c.length < 4 || c.some((x, i) => i < 4 && !Number.isFinite(x))) continue; if (c[3] <= -9) continue; pts.push({ t: Date.UTC(c[0], c[1] - 1, 15), v: c[3] }); }
  if (pts.length < 12) throw new Error("no usable NOAA GML rows");
  return { label, unit, points: pts, latest: pts[pts.length - 1], meta: meta({ provider: "NOAA Global Monitoring Laboratory", source: label, status: "PERIODIC", frequency: "monthly", dataType: "atmospheric concentration", units: unit, attribution: "NOAA GML", license: "US Government work (public domain)", note: "Monthly mean; latest month can be provisional." }) };
}
export const fetchCo2 = async () => { const o = parseGml(await fetchRaw("https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt", { id: NOAA }), { unit: "ppm", label: "CO2 at Mauna Loa" }); registry.ok(NOAA, "PERIODIC"); return o; };
export const fetchCh4 = async () => { const o = parseGml(await fetchRaw("https://gml.noaa.gov/webdata/ccgg/trends/ch4/ch4_mm_gl.txt", { id: NOAA }), { unit: "ppb", label: "Global methane" }); registry.ok(NOAA, "PERIODIC"); return o; };
/** GISTEMP CSV: first line is a title; then header 'Year,Jan,...,Dec,J-D,...'; '***' = missing. Anomaly in degrees C vs 1951-1980. */
export function parseGistemp(text) {
  if (typeof text !== "string") throw new Error("unexpected GISTEMP response");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean), hi = lines.findIndex((l) => l.startsWith("Year,")); if (hi < 0) throw new Error("GISTEMP header not found");
  const head = lines[hi].split(","), jd = head.indexOf("J-D"), annual = [], monthly = [];
  for (const l of lines.slice(hi + 1)) { const c = l.split(","), y = num(c[0]); if (!Number.isFinite(y)) continue; if (jd > 0 && Number.isFinite(num(c[jd]))) annual.push({ year: y, anomalyC: num(c[jd]) }); for (let m = 1; m <= 12; m++) { const v = num(c[m]); if (Number.isFinite(v)) monthly.push({ t: Date.UTC(y, m - 1, 15), v }); } }
  if (!annual.length) throw new Error("no GISTEMP rows");
  return { annual, monthly, latestMonth: monthly[monthly.length - 1], meta: meta({ provider: "NASA GISS", source: "GISTEMP v4 Land-Ocean Temperature Index", status: "PERIODIC", frequency: "monthly", dataType: "global temperature anomaly", units: "°C vs 1951-1980", attribution: "NASA Goddard Institute for Space Studies", license: "Public domain (NASA)", note: "Anomaly relative to the 1951-1980 baseline, not absolute temperature." }) };
}
export const fetchGistemp = async () => { const o = parseGistemp(await fetchRaw("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv", { id: GIS })); registry.ok(GIS, "PERIODIC"); return o; };
/** NSIDC daily extent CSV: 'Year, Month, Day, Extent, Missing, Source Data' with two header lines. Extent in million km2. */
export function parseSeaIce(text, hemisphere) {
  if (typeof text !== "string") throw new Error("unexpected NSIDC response");
  const pts = []; for (const l of text.split("\n")) { const c = l.split(",").map((x) => x.trim()); if (c.length < 4) continue; const [y, m, d, e] = c.map(num); if (![y, m, d, e].every(Number.isFinite) || y < 1978) continue; pts.push({ t: Date.UTC(y, m - 1, d), v: e }); }
  if (pts.length < 30) throw new Error("no usable NSIDC rows");
  return { hemisphere, points: pts, latest: pts[pts.length - 1], meta: meta({ provider: "NSIDC / NOAA", source: `Sea Ice Index v3 (${hemisphere})`, status: "RECENT", frequency: "daily (preliminary data, final after revision)", dataType: "sea ice extent", units: "million km²", attribution: "NSIDC Sea Ice Index (NOAA@NSIDC)", license: "Free with citation", note: "Satellite passive-microwave estimate; recent values are preliminary." }) };
}
export const fetchSeaIce = async (h) => { if (!["north", "south"].includes(h)) throw new Error("bad hemisphere"); const code = h === "north" ? "N" : "S"; const o = parseSeaIce(await fetchRaw(`https://noaadata.apps.nsidc.org/NOAA/G02135/${h}/daily/data/${code}_seaice_extent_daily_v3.0.csv`, { id: NSIDC, timeout: 15000 }), h); registry.ok(NSIDC, "RECENT"); return o; };
