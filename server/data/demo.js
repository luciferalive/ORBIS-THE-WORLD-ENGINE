// DEMO / SAMPLE data. Clearly labelled everywhere it is used. Prices are ILLUSTRATIVE LEVELS, not market data.
import { asset, meta, event } from "../models.js";

const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

export const RANGES = { "1H": [60, 60e3], "24H": [96, 900e3], "7D": [168, 3600e3], "1M": [30, 86400e3], "3M": [90, 86400e3], "1Y": [365, 86400e3], ALL: [520, 7 * 86400e3] };
// [id, symbol, name, class, level, dailyVolPct, currency, extras]
const DEFS = [
  ["spx","SPX","S&P 500","index",6000,0.9,"pts"],["ndx","NDX","Nasdaq 100","index",20800,1.2,"pts"],["dji","DJI","Dow Jones","index",43500,0.8,"pts"],["ftse","UKX","FTSE 100","index",8200,0.8,"pts"],
  ["dax","DAX","DAX","index",19500,1.0,"pts"],["n225","N225","Nikkei 225","index",39000,1.2,"pts"],["nifty","NIFTY","NIFTY 50","index",24000,0.9,"pts"],["sse","SSEC","SSE Composite","index",3300,1.0,"pts"],
  ["aapl","AAPL","Apple","stock",230,1.6,"USD",{ sector: "Technology", mcap: 3.5e12, volume: 4.5e7 }],["msft","MSFT","Microsoft","stock",420,1.5,"USD",{ sector: "Technology", mcap: 3.1e12, volume: 2e7 }],
  ["nvda","NVDA","NVIDIA","stock",140,3.2,"USD",{ sector: "Semiconductors", mcap: 3.4e12, volume: 2.5e8 }],["googl","GOOGL","Alphabet","stock",175,1.7,"USD",{ sector: "Technology", mcap: 2.1e12, volume: 2.4e7 }],
  ["amzn","AMZN","Amazon","stock",200,1.9,"USD",{ sector: "Consumer", mcap: 2.1e12, volume: 3.5e7 }],["tsla","TSLA","Tesla","stock",300,3.6,"USD",{ sector: "Automotive", mcap: 0.95e12, volume: 8e7 }],
  ["tsm","TSM","TSMC","stock",190,2.2,"USD",{ sector: "Semiconductors", mcap: 0.95e12, volume: 1.2e7 }],["xom","XOM","Exxon Mobil","stock",115,1.4,"USD",{ sector: "Energy", mcap: 0.5e12, volume: 1.5e7 }],
  ["jpm","JPM","JPMorgan Chase","stock",230,1.3,"USD",{ sector: "Finance", mcap: 0.65e12, volume: 9e6 }],["lly","LLY","Eli Lilly","stock",800,1.9,"USD",{ sector: "Pharmaceuticals", mcap: 0.75e12, volume: 3e6 }],
  ["btc","BTC","Bitcoin","crypto",95000,3.0,"USD",{ mcap: 1.9e12, volume: 4e10 }],["eth","ETH","Ethereum","crypto",3300,3.8,"USD",{ mcap: 4e11, volume: 2e10 }],["sol","SOL","Solana","crypto",220,5,"USD",{ mcap: 1.0e11, volume: 4e9 }],
  ["bnb","BNB","BNB","crypto",650,3.2,"USD",{ mcap: 9.5e10, volume: 1.5e9 }],["xrp","XRP","XRP","crypto",2.2,5.5,"USD",{ mcap: 1.2e11, volume: 8e9 }],["ada","ADA","Cardano","crypto",0.95,5.5,"USD",{ mcap: 3.3e10, volume: 1.5e9 }],["doge","DOGE","Dogecoin","crypto",0.38,6.5,"USD",{ mcap: 5.5e10, volume: 4e9 }],
  ["eurusd","EUR/USD","Euro","forex",1.08,0.4,"USD"],["gbpusd","GBP/USD","British Pound","forex",1.27,0.45,"USD"],["usdjpy","USD/JPY","Japanese Yen","forex",150,0.5,"JPY"],["usdchf","USD/CHF","Swiss Franc","forex",0.88,0.4,"CHF"],
  ["usdinr","USD/INR","Indian Rupee","forex",84.2,0.15,"INR"],["usdaed","USD/AED","UAE Dirham (peg)","forex",3.6725,0,"AED"],["usdqar","USD/QAR","Qatari Riyal (peg)","forex",3.64,0,"QAR"],
  ["xau","XAU","Gold","metal",2650,0.9,"USD/oz"],["xag","XAG","Silver","metal",31,1.8,"USD/oz"],["xpt","XPT","Platinum","metal",960,1.4,"USD/oz"],["xpd","XPD","Palladium","metal",1000,2.2,"USD/oz"],
  ["wti","WTI","Crude Oil (WTI)","commodity",70,2.0,"USD/bbl"],["brent","BRENT","Crude Oil (Brent)","commodity",74,1.9,"USD/bbl"],["ng","NG","Natural Gas","commodity",2.9,3.5,"USD/MMBtu"],["hg","HG","Copper","commodity",4.2,1.4,"USD/lb"],
  ["alu","ALU","Aluminum","commodity",2600,1.2,"USD/t"],["li","LIT","Lithium carbonate","commodity",10500,1.8,"USD/t"],["u3o8","U3O8","Uranium","commodity",75,1.6,"USD/lb"],["zw","ZW","Wheat","commodity",5.5,1.8,"USD/bu"],["zc","ZC","Corn","commodity",4.3,1.5,"USD/bu"],
];
export const ASSET_IDS = DEFS.map((d) => d[0]);
export const defOf = (id) => DEFS.find((d) => d[0] === id);

export function demoSeries(id, range, now = Date.now()) {
  const d = defOf(id); if (!d) return [];
  const [n, step] = RANGES[range], r = rng(hash(id + range)), [, , , , level, volPct] = d;
  const vol = (volPct / 100) * Math.sqrt(step / 86400e3 > 1 ? step / 86400e3 : step / 86400e3);
  const walk = [0]; for (let i = 1; i < n; i++) walk.push(walk[i - 1] + gauss(r) * vol);
  const end = walk[n - 1];
  return walk.map((w, i) => ({ t: now - (n - 1 - i) * step, v: level * Math.exp(w - end) }));
}
const DEMO_META = (note = "") => meta({ provider: "ORBIS demo generator", source: "Synthetic random walk around illustrative levels", status: "DEMO", frequency: "static (regenerated per request)", dataType: "market", attribution: "None. NOT market data.", note: "DEMO: illustrative values for development. " + note });
export function demoAsset(id, now = Date.now()) {
  const d = defOf(id); const ex = d[7] || {};
  const s = demoSeries(id, "24H", now), first = s[0].v, last = s[s.length - 1].v;
  const pegged = d[5] === 0;
  return asset({ id, symbol: d[1], name: d[2], class: d[3], price: pegged ? d[4] : last, change: pegged ? 0 : last - first, changePct: pegged ? 0 : ((last - first) / first) * 100,
    currency: d[6], mcap: ex.mcap, volume: ex.volume, sector: ex.sector, series: s, marketStatus: "demo", meta: DEMO_META() });
}

// SAMPLE EVENTS. Generic and clearly fictional placeholders: NOT news. Used only when no live feed is reachable.
const SAMPLE_META = meta({ provider: "ORBIS sample set", source: "Bundled placeholders", status: "DEMO", frequency: "static", dataType: "events", attribution: "None. These are NOT real events.", note: "Illustrative placeholders so the interface can be explored offline." });
export function sampleEvents(now = Date.now()) {
  const mk = (i, mins, o) => event({ id: "sample-" + i, time: new Date(now - mins * 60e3).toISOString(), source: "ORBIS sample (not real news)", kind: "sample", meta: SAMPLE_META, ...o, title: "[SAMPLE] " + o.title });
  return [
    mk(1, 12, { title: "Energy ministers hold emergency talks on supply", category: "energy", severity: 3, lat: 24.7, lon: 46.7, location: "Riyadh", countries: ["SA"], commodities: ["Oil"], industries: ["Oil and gas"], summary: "Illustrative placeholder for an energy-policy event.", tags: ["supply", "oil"] }),
    mk(2, 35, { title: "Central bank signals policy shift", category: "economics", severity: 2, lat: 38.9, lon: -77.0, location: "Washington", countries: ["US"], assets: ["spx", "xau"], industries: ["Finance"], summary: "Illustrative placeholder for a monetary-policy event.", tags: ["rates"] }),
    mk(3, 61, { title: "Major earthquake affects coastal region", category: "natural_disaster", severity: 4, lat: 35.7, lon: 139.7, location: "Pacific coast", countries: ["JP"], summary: "Illustrative placeholder for a natural-disaster event.", tags: ["earthquake"] }),
    mk(4, 95, { title: "Semiconductor export rules updated", category: "trade", severity: 3, lat: 25.0, lon: 121.5, location: "Taipei", countries: ["TW", "US", "CN"], industries: ["Semiconductors"], assets: ["nvda", "tsm"], summary: "Illustrative placeholder for a trade-policy event.", tags: ["chips"] }),
    mk(5, 140, { title: "AI data-centre power demand forecast raised", category: "ai", severity: 2, lat: 37.4, lon: -122.1, location: "California", countries: ["US"], industries: ["Technology", "Energy"], commodities: ["Natural gas", "Uranium"], summary: "Illustrative placeholder linking AI and energy demand.", tags: ["ai", "energy"] }),
    mk(6, 200, { title: "Port congestion lengthens shipping times", category: "transport", severity: 2, lat: 1.3, lon: 103.8, location: "Singapore", countries: ["SG"], industries: ["Shipping"], summary: "Illustrative placeholder for a supply-chain event.", tags: ["shipping"] }),
    mk(7, 260, { title: "Heatwave strains regional power grid", category: "climate", severity: 3, lat: 28.6, lon: 77.2, location: "Delhi", countries: ["IN"], commodities: ["Natural gas"], summary: "Illustrative placeholder for a climate-and-energy event.", tags: ["heat"] }),
    mk(8, 330, { title: "Cryptocurrency exchange outage reported", category: "markets", severity: 2, lat: 25.2, lon: 55.3, location: "Dubai", countries: ["AE"], assets: ["btc", "eth"], summary: "Illustrative placeholder for a market-structure event.", tags: ["crypto"] }),
    mk(9, 410, { title: "Diplomatic talks resume between neighbouring states", category: "geopolitics", severity: 3, lat: 50.4, lon: 30.5, location: "Europe", countries: ["UA", "PL"], summary: "Illustrative placeholder for a geopolitical event.", tags: ["diplomacy"] }),
    mk(10, 520, { title: "New battery-materials plant announced", category: "industry", severity: 1, lat: -33.4, lon: -70.6, location: "Santiago", countries: ["CL"], commodities: ["Lithium", "Copper"], industries: ["Mining"], summary: "Illustrative placeholder for an industry event.", tags: ["lithium"] }),
    mk(11, 640, { title: "Health authorities report regional outbreak", category: "health", severity: 3, lat: 6.5, lon: 3.4, location: "West Africa", countries: ["NG"], summary: "Illustrative placeholder for a public-health event.", tags: ["outbreak"] }),
    mk(12, 780, { title: "Grain export corridor disruption concerns", category: "trade", severity: 3, lat: 46.5, lon: 30.7, location: "Black Sea", countries: ["UA", "RU"], commodities: ["Wheat", "Corn"], summary: "Illustrative placeholder for a food-supply event.", tags: ["grain"] }),
  ];
}
export const SAMPLE_QUAKES_META = SAMPLE_META;
