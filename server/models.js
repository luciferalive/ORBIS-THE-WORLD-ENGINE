// Standardised models. Everything that leaves the server passes through these helpers.
export const STATUS = ["LIVE", "RECENT", "PERIODIC", "ESTIMATE", "PROJECTION", "DEMO", "UNAVAILABLE"];

/** Source metadata attached to every data set / data point group. */
export function meta({ provider, source, status, frequency, dataType, units = null, attribution = "", note = "", updatedAt = null, license = "" }) {
  if (!STATUS.includes(status)) throw new Error("bad status " + status);
  return { provider, source, status, frequency, dataType, units, attribution, note, license, updatedAt: updatedAt || new Date().toISOString(), fetchedAt: new Date().toISOString() };
}
export const unavailable = (provider, why) => ({ data: null, meta: meta({ provider, source: provider, status: "UNAVAILABLE", frequency: "n/a", dataType: "n/a", note: why }) });

/** @typedef {{id:string,symbol:string,name:string,class:string,price:number,change:number,changePct:number,currency:string,mcap?:number,volume?:number,series:{t:number,v:number}[],marketStatus?:string,meta:object}} Asset */
export function asset(a) {
  const need = ["id", "symbol", "name", "class", "price", "meta"];
  for (const k of need) if (a[k] === undefined || a[k] === null) throw new Error("asset missing " + k);
  if (!Number.isFinite(a.price)) throw new Error("asset price not finite: " + a.id);
  return { currency: "USD", change: 0, changePct: 0, series: [], seriesRange: "24H", ...a };
}
/** @typedef {{id:string,title:string,summary:string,category:string,severity:number,time:string,lat?:number,lon?:number,location?:string,countries:string[],industries:string[],commodities:string[],assets:string[],tags:string[],source:string,url?:string,kind:"reported"|"measured"|"sample",meta:object}} OrbisEvent */
export function event(e) {
  if (!e.id || !e.title || !e.time) throw new Error("event missing field");
  const t = new Date(e.time); if (isNaN(t)) throw new Error("bad event time");
  return { summary: "", category: "society", severity: 1, countries: [], industries: [], commodities: [], assets: [], tags: [], kind: "reported", ...e, time: t.toISOString() };
}
export const CATEGORIES = ["geopolitics", "conflict", "politics", "economics", "markets", "energy", "technology", "ai", "science", "climate", "natural_disaster", "health", "transport", "infrastructure", "industry", "trade", "society"];
