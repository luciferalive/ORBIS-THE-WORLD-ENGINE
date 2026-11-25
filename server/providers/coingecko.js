// CoinGecko public API (no key; rate-limited ~10-30 calls/min; attribution required). https://www.coingecko.com/en/api
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { asset, meta } from "../models.js";
export const ID = "coingecko";
registry.declare(ID, { name: "CoinGecko", kind: "crypto", frequency: "~1-2 min", url: "https://www.coingecko.com", keyRequired: false });
export const COINS = { btc: "bitcoin", eth: "ethereum", sol: "solana", bnb: "binancecoin", xrp: "ripple", ada: "cardano", doge: "dogecoin" };
const SYMS = { bitcoin: ["btc", "BTC"], ethereum: ["eth", "ETH"], solana: ["sol", "SOL"], binancecoin: ["bnb", "BNB"], ripple: ["xrp", "XRP"], cardano: ["ada", "ADA"], dogecoin: ["doge", "DOGE"] };

export function parseMarkets(raw, now = Date.now()) {
  if (!Array.isArray(raw)) throw new Error("unexpected CoinGecko response");
  return raw.filter((c) => SYMS[c.id] && Number.isFinite(c.current_price)).map((c) => {
    const spark = c.sparkline_in_7d?.price || [], n = spark.length, step = 3600e3;
    const series = spark.map((v, i) => ({ t: now - (n - 1 - i) * step, v }));
    const day = series.length > 1 ? series : [];
    return asset({ id: SYMS[c.id][0], symbol: SYMS[c.id][1], name: c.name, class: "crypto", price: c.current_price, change: c.price_change_24h ?? 0, changePct: c.price_change_percentage_24h ?? 0,
      mcap: c.market_cap, volume: c.total_volume, series: day, seriesRange: "7D", marketStatus: "open 24/7",
      meta: meta({ provider: "CoinGecko", source: "api.coingecko.com /coins/markets", status: "LIVE", frequency: "1-2 minutes", dataType: "market", units: "USD", attribution: "Data provided by CoinGecko", updatedAt: c.last_updated || undefined }) });
  });
}
export async function fetchMarkets() {
  const ids = Object.values(COINS).join(",");
  const raw = await fetchJson(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=24h`, { id: ID });
  const out = parseMarkets(raw); registry.ok(ID, "LIVE"); return out;
}
const DAYS = { "1H": 1, "24H": 1, "7D": 7, "1M": 30, "3M": 90, "1Y": 365, ALL: "max" };
export function parseHistory(raw, range, now = Date.now()) {
  if (!raw || !Array.isArray(raw.prices)) throw new Error("unexpected market_chart response");
  let pts = raw.prices.map(([t, v]) => ({ t, v }));
  if (range === "1H") pts = pts.filter((p) => p.t >= now - 3600e3);
  return pts;
}
export async function fetchHistory(id, range) {
  const cg = COINS[id]; if (!cg) throw new Error("not a CoinGecko asset");
  const raw = await fetchJson(`https://api.coingecko.com/api/v3/coins/${cg}/market_chart?vs_currency=usd&days=${DAYS[range]}`, { id: ID });
  registry.ok(ID, "LIVE"); return parseHistory(raw, range);
}
