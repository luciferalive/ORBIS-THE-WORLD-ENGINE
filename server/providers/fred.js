// FRED (St. Louis Fed). Free API key required: https://fred.stlouisfed.org/docs/api/api_key.html . Terms: https://fred.stlouisfed.org/docs/api/terms_of_use.html
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { config } from "../config.js";
import { meta } from "../models.js";
export const ID = "fred";
registry.declare(ID, { name: "FRED", kind: "US macro, rates, commodities", frequency: "daily to monthly by series", url: "https://fred.stlouisfed.org", keyRequired: true });
export const configured = () => !!config.fredKey;
/** id -> label, units, frequency. Series ids are FRED's own. */
export const SERIES = {
  DGS10: { label: "US 10-year Treasury yield", units: "%", freq: "daily" }, DGS2: { label: "US 2-year Treasury yield", units: "%", freq: "daily" }, FEDFUNDS: { label: "Federal funds effective rate", units: "%", freq: "monthly" },
  CPIAUCSL: { label: "US CPI (all urban consumers)", units: "index 1982-84=100", freq: "monthly" }, UNRATE: { label: "US unemployment rate", units: "%", freq: "monthly" }, GDPC1: { label: "US real GDP", units: "bn chained 2017 USD", freq: "quarterly" },
  DCOILWTICO: { label: "WTI crude oil", units: "USD/bbl", freq: "daily" }, DHHNGSP: { label: "Henry Hub natural gas", units: "USD/MMBtu", freq: "daily" }, T10Y2Y: { label: "10y minus 2y yield spread", units: "pp", freq: "daily" }, VIXCLS: { label: "CBOE VIX", units: "index", freq: "daily" },
};
export function parseObservations(raw, id) {
  if (!raw || !Array.isArray(raw.observations)) throw new Error("unexpected FRED response");
  const pts = raw.observations.filter((o) => o.value !== "." && Number.isFinite(Number(o.value))).map((o) => ({ date: o.date, v: Number(o.value) })).reverse(); // ascending
  const s = SERIES[id] || { label: id, units: "", freq: "n/a" };
  return { id, label: s.label, units: s.units, points: pts, latest: pts[pts.length - 1] || null, meta: meta({ provider: "FRED", source: "Federal Reserve Bank of St. Louis (series " + id + ")", status: "PERIODIC", frequency: s.freq, dataType: "macro series", units: s.units, attribution: "Source: FRED, Federal Reserve Bank of St. Louis", license: "Per FRED terms of use; underlying series may carry their own copyright" }) };
}
export async function fetchSeries(id, limit = 120) {
  if (!configured()) { registry.skip(ID, "FRED_API_KEY not set"); throw new Error("FRED_API_KEY not configured"); }
  if (!SERIES[id]) throw new Error("unknown series");
  const raw = await fetchJson(`https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${config.fredKey}&file_type=json&sort_order=desc&limit=${limit}`, { id: ID });
  const out = parseObservations(raw, id); registry.ok(ID, "PERIODIC"); return out;
}
