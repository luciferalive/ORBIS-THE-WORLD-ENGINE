// Frankfurter (ECB reference rates, no key, daily). https://www.frankfurter.app  AED and QAR are officially pegged to USD (static).
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { asset, meta } from "../models.js";
export const ID = "frankfurter";
registry.declare(ID, { name: "Frankfurter / ECB rates", kind: "forex", frequency: "daily (working days)", url: "https://www.frankfurter.app", keyRequired: false });
const PAIRS = { eurusd: ["EUR", "EUR/USD", "Euro", false], gbpusd: ["GBP", "GBP/USD", "British Pound", false], usdjpy: ["JPY", "USD/JPY", "Japanese Yen", true], usdchf: ["CHF", "USD/CHF", "Swiss Franc", true], usdinr: ["INR", "USD/INR", "Indian Rupee", true] };
const PEGS = { usdaed: ["USD/AED", "UAE Dirham (peg)", 3.6725, "AED"], usdqar: ["USD/QAR", "Qatari Riyal (peg)", 3.64, "QAR"] };

/** raw: timeseries response { rates: { "YYYY-MM-DD": { EUR: x, ... } } } with base USD */
export function parseTimeseries(raw) {
  if (!raw || typeof raw.rates !== "object") throw new Error("unexpected Frankfurter response");
  const days = Object.keys(raw.rates).sort(); if (days.length < 2) throw new Error("not enough Frankfurter history");
  const out = [];
  for (const [id, [cur, sym, name, inverse]] of Object.entries(PAIRS)) {
    const pts = days.filter((d) => raw.rates[d][cur]).map((d) => ({ t: Date.parse(d + "T16:00:00Z"), v: inverse ? raw.rates[d][cur] : 1 / raw.rates[d][cur] }));
    if (pts.length < 2) continue;
    const last = pts[pts.length - 1], prev = pts[pts.length - 2];
    out.push(asset({ id, symbol: sym, name, class: "forex", price: last.v, change: last.v - prev.v, changePct: ((last.v - prev.v) / prev.v) * 100, currency: inverse ? cur : "USD", series: pts, seriesRange: "2W", marketStatus: "daily fixing",
      meta: meta({ provider: "Frankfurter", source: "ECB euro foreign exchange reference rates", status: "RECENT", frequency: "once per working day (~16:00 CET)", dataType: "fx", units: sym, attribution: "European Central Bank reference rates via Frankfurter", updatedAt: new Date(last.t).toISOString(), note: "Daily reference rate, not a live tick." }) }));
  }
  for (const [id, [sym, name, rate, cur]] of Object.entries(PEGS)) {
    const pts = days.map((d) => ({ t: Date.parse(d + "T16:00:00Z"), v: rate }));
    out.push(asset({ id, symbol: sym, name, class: "forex", price: rate, change: 0, changePct: 0, currency: cur, series: pts, seriesRange: "2W", marketStatus: "pegged",
      meta: meta({ provider: "Official peg", source: "Central bank fixed peg to USD", status: "PERIODIC", frequency: "static peg", dataType: "fx", units: sym, attribution: "Official peg rate", note: "Fixed by the central bank; changes only by policy decision." }) }));
  }
  return out;
}
export async function fetchRates() {
  const to = Object.values(PAIRS).map((p) => p[0]).join(",");
  const start = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  const raw = await fetchJson(`https://api.frankfurter.app/${start}..?from=USD&to=${to}`, { id: ID });
  const out = parseTimeseries(raw); registry.ok(ID, "RECENT"); return out;
}
