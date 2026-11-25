// World Bank Indicators API (open, no key, annual data with ~1 year lag). https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
export const ID = "worldbank";
registry.declare(ID, { name: "World Bank Indicators", kind: "economy / population", frequency: "annual", url: "https://data.worldbank.org", keyRequired: false });
export const INDICATORS = { population: "SP.POP.TOTL", gdp: "NY.GDP.MKTP.CD", gdpGrowth: "NY.GDP.MKTP.KD.ZG", inflation: "FP.CPI.TOTL.ZG", lifeExpectancy: "SP.DYN.LE00.IN", urbanPct: "SP.URB.TOTL.IN.ZS", birthRate: "SP.DYN.CBRT.IN", deathRate: "SP.DYN.CDRT.IN" };
/** Returns Map iso3 -> { value, year } using the most recent non-empty value. */
export function parseIndicator(raw) {
  if (!Array.isArray(raw) || !Array.isArray(raw[1])) throw new Error("unexpected World Bank response");
  const out = new Map();
  for (const r of raw[1]) { if (r.value === null || r.value === undefined || !r.countryiso3code) continue; const year = Number(r.date); const cur = out.get(r.countryiso3code); if (!cur || year > cur.year) out.set(r.countryiso3code, { value: Number(r.value), year }); }
  return out;
}
export async function fetchIndicator(key) {
  const code = INDICATORS[key]; if (!code) throw new Error("unknown indicator");
  const raw = await fetchJson(`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=400&mrnev=1`, { id: ID });
  const out = parseIndicator(raw); registry.ok(ID, "PERIODIC"); return out;
}
