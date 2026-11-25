// Twelve Data (API key required; free tier is rate-limited). Used for stocks, indices, metals and commodities when TWELVEDATA_KEY is set.
import { fetchJson } from "../http.js";
import { config } from "../config.js";
import * as registry from "../registry.js";
import { asset, meta } from "../models.js";
import { defOf } from "../data/demo.js";
export const ID = "twelvedata";
registry.declare(ID, { name: "Twelve Data", kind: "stocks / metals / commodities", frequency: "real-time to 15 min delayed (plan dependent)", url: "https://twelvedata.com", keyRequired: true });
// ORBIS id -> Twelve Data symbol. Index and commodity coverage depends on your plan; unsupported symbols are skipped and shown as UNAVAILABLE/DEMO.
export const SYMBOLS = { spx: "SPX", ndx: "NDX", dji: "DJI", aapl: "AAPL", msft: "MSFT", nvda: "NVDA", googl: "GOOGL", amzn: "AMZN", tsla: "TSLA", tsm: "TSM", xom: "XOM", jpm: "JPM", lly: "LLY", xau: "XAU/USD", xag: "XAG/USD", xpt: "XPT/USD", xpd: "XPD/USD", wti: "WTI/USD", brent: "XBR/USD", ng: "NG/USD", hg: "HG/USD" };
export const configured = () => !!config.twelvedataKey;

export function parseQuotes(raw, ids) {
  const out = [];
  const entries = raw && raw.symbol && !raw.status ? { [raw.symbol]: raw } : raw || {};
  for (const id of ids) {
    const q = entries[SYMBOLS[id]]; if (!q || q.status === "error" || q.code) continue;
    const price = Number(q.close), pct = Number(q.percent_change), chg = Number(q.change); if (!Number.isFinite(price)) continue;
    const d = defOf(id);
    out.push(asset({ id, symbol: d[1], name: d[2], class: d[3], price, change: Number.isFinite(chg) ? chg : 0, changePct: Number.isFinite(pct) ? pct : 0, currency: d[6], volume: Number(q.volume) || undefined,
      marketStatus: q.is_market_open === true ? "open" : q.is_market_open === false ? "closed" : "unknown", series: [],
      meta: meta({ provider: "Twelve Data", source: "api.twelvedata.com /quote", status: q.is_market_open === false ? "RECENT" : "LIVE", frequency: "per plan (real-time or delayed)", dataType: "market", units: d[6], attribution: "Market data by Twelve Data", updatedAt: q.timestamp ? new Date(q.timestamp * 1000).toISOString() : undefined, note: q.is_market_open === false ? "Market closed: last close shown." : "" }) }));
  }
  return out;
}
export async function fetchQuotes(ids) {
  if (!configured()) { registry.skip(ID, "TWELVEDATA_KEY not set"); throw new Error("TWELVEDATA_KEY not set"); }
  const have = ids.filter((i) => SYMBOLS[i]); if (!have.length) return [];
  const syms = have.map((i) => SYMBOLS[i]).join(",");
  const raw = await fetchJson(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(syms)}&apikey=${config.twelvedataKey}`, { id: ID });
  const out = parseQuotes(raw, have); registry.ok(ID, "LIVE"); return out;
}
const RANGE_PARAMS = { "1H": ["1min", 60], "24H": ["15min", 96], "7D": ["1h", 168], "1M": ["1day", 30], "3M": ["1day", 90], "1Y": ["1week", 52], ALL: ["1month", 120] };
export function parseSeries(raw) {
  if (!raw || !Array.isArray(raw.values)) throw new Error("unexpected time_series response");
  return raw.values.map((v) => ({ t: Date.parse(v.datetime.replace(" ", "T") + "Z"), v: Number(v.close) })).filter((p) => Number.isFinite(p.v) && !isNaN(p.t)).sort((a, b) => a.t - b.t);
}
export async function fetchSeries(id, range) {
  if (!configured()) throw new Error("TWELVEDATA_KEY not set"); const [iv, n] = RANGE_PARAMS[range];
  const raw = await fetchJson(`https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(SYMBOLS[id])}&interval=${iv}&outputsize=${n}&apikey=${config.twelvedataKey}`, { id: ID });
  registry.ok(ID, "LIVE"); return parseSeries(raw);
}
