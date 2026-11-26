// Service layer: the ONLY place that decides live vs demo. The frontend never talks to providers.
import { cached } from "./cache.js";
import { config } from "./config.js";
import * as registry from "./registry.js";
import { meta } from "./models.js";
import { ASSET_IDS, demoAsset, demoSeries, defOf, sampleEvents } from "./data/demo.js";
import { COUNTRIES, CITIES, INDUSTRIES, COMMODITY_FACTS, WORLD_POP, HISTORY, FLAG } from "./data/reference.js";
import * as cg from "./providers/coingecko.js";
import * as fx from "./providers/frankfurter.js";
import * as td from "./providers/twelvedata.js";
import * as usgs from "./providers/usgs.js";
import * as news from "./providers/news.js";
import * as wb from "./providers/worldbank.js";
import * as geo from "./providers/geo.js";
import * as eonet from "./providers/eonet.js";
import * as om from "./providers/openmeteo.js";
import * as fred from "./providers/fred.js";
import * as swpc from "./providers/swpc.js";
import * as launches from "./providers/launches.js";
import * as nasa from "./providers/nasa.js";
import * as celestrak from "./providers/celestrak.js";
import * as openalex from "./providers/openalex.js";
import * as arxiv from "./providers/arxiv.js";
import * as cisa from "./providers/cisa.js";
import * as opensky from "./providers/opensky.js";
import * as climate from "./providers/climate.js";
import * as extras from "./providers/extras.js";
import { simulate, MODELS } from "./intelligence/simulate.js";
import { MEGAPROJECTS, CHOKEPOINTS, METEOR_SHOWERS, AS_OF } from "./data/megaprojects.js";
import { detectAll } from "./intelligence/anomaly.js";
import { evaluate as evalAlerts, validateRule } from "./intelligence/alerts.js";
import { buildSignals, projectCone } from "./intelligence/signals.js";
import { populationScenarios, METHOD } from "./intelligence/forecast.js";
import { buildGraph, neighbourhood } from "./data/graph.js";
import { buildIndex, search } from "./intelligence/search.js";

registry.declare("demo", { name: "ORBIS demo / reference data", kind: "fallback", frequency: "static", url: "", keyRequired: false });
registry.ok("demo", "DEMO");
const safe = async (key, ttl, fn) => { try { const r = await cached(key, ttl, fn); return { ...r, ok: true }; } catch (e) { return { ok: false, error: e.message }; } };

// ---------- markets
export async function getAssets() {
  const live = new Map(); const notes = {};
  const jobs = [
    ["crypto", safe("cg:markets", 60e3, () => cg.fetchMarkets())],
    ["forex", safe("fx:rates", 3600e3, () => fx.fetchRates())],
    ["traditional", td.configured() ? safe("td:quotes", 60e3, () => td.fetchQuotes(ASSET_IDS)) : Promise.resolve({ ok: false, error: "TWELVEDATA_KEY not set" })],
  ];
  for (const [name, p] of jobs) { const r = await p; notes[name] = r.ok ? { ok: true, stale: r.stale || false } : { ok: false, error: r.error }; if (r.ok) for (const a of r.value) { if (a.stale) continue; live.set(a.id, r.stale ? { ...a, meta: { ...a.meta, status: "RECENT", note: "Provider unreachable; showing last good data from " + new Date(r.at).toISOString() } } : a); } }
  if (!td.configured()) registry.skip(td.ID, "TWELVEDATA_KEY not set: stocks, indices, metals and commodities use DEMO data");
  const now = Date.now();
  const assets = ASSET_IDS.map((id) => {
    const l = live.get(id);
    if (l) { if (!l.series.length) { l.series = demoSeries(id, "24H", now); l.seriesDemo = true; } return l; }
    return demoAsset(id, now);
  });
  return { assets, notes };
}
export async function getAsset(id) { const { assets } = await getAssets(); return assets.find((a) => a.id === id) || null; }
export async function getHistory(id, range) {
  if (!defOf(id)) return null;
  const a = await getAsset(id);
  if (a && a.meta.status !== "DEMO") {
    const fetcher = cg.COINS[id] ? () => cg.fetchHistory(id, range) : td.SYMBOLS[id] && td.configured() ? () => td.fetchSeries(id, range) : null;
    if (fetcher) { const r = await safe(`hist:${id}:${range}`, 300e3, fetcher); if (r.ok && r.value.length > 1) return { series: r.value, meta: { ...a.meta, note: "History from " + a.meta.provider + (r.stale ? " (stale cache)" : "") } }; }
    if (a.class === "forex" && a.series.length > 1) return { series: a.series, meta: { ...a.meta, note: "Only ~2 weeks of daily history loaded for forex." } };
  }
  return { series: demoSeries(id, range), meta: demoAsset(id).meta };
}
export async function getSignals() {
  const { assets } = await getAssets();
  const sig = buildSignals(assets);
  const demoCount = assets.filter((a) => a.meta.status === "DEMO").length;
  return { signals: sig, meta: meta({ provider: "ORBIS signal engine", source: "Calculated from asset price series (see explanation on each signal)", status: demoCount === assets.length ? "DEMO" : "ESTIMATE", frequency: "recalculated per request", dataType: "derived signals", note: demoCount ? `${demoCount} of ${assets.length} assets use DEMO series; their signals are labelled DEMO.` : "All inputs are provider data." }) };
}
export async function getForecastAsset(id, steps = 30) {
  const h = await getHistory(id, "3M"); if (!h) return null; const cone = projectCone(h.series, steps); if (!cone) return null;
  const a = defOf(id);
  return { id, name: a[2], history: h.series.slice(-90), cone, meta: meta({ provider: "ORBIS projection", source: "Log-return drift and volatility cone", status: "PROJECTION", frequency: "per request", dataType: "statistical projection", note: "Projection, not a prediction. Optimistic/adverse are the 90th/10th percentile of a random-walk model with constant drift and volatility. Input data status: " + h.meta.status + "." }) };
}

// ---------- events
export async function getEvents() {
  const jobs = [["gdelt", safe("ev:gdelt", 5 * 60e3, news.fetchGdelt)], ["rss", safe("ev:rss", 5 * 60e3, news.fetchRss)], ["usgs", safe("ev:usgs", 60e3, () => usgs.fetchQuakes("2.5_day"))], ["eonet", safe("ev:eonet", 10 * 60e3, eonet.fetchOpen)]];
  let live = []; const feeds = {};
  for (const [n, p] of jobs) { const r = await p; feeds[n] = r.ok ? { ok: true, stale: !!r.stale, count: r.value.length } : { ok: false, error: r.error }; if (r.ok) live = live.concat(r.value); }
  const seen = new Set(); live = live.filter((e) => (seen.has(e.title) ? false : seen.add(e.title)));
  const useSample = live.length === 0;
  const events = (useSample ? sampleEvents() : live).sort((a, b) => b.time.localeCompare(a.time));
  return { events, feeds, sample: useSample };
}
export function filterEvents(events, { category, country, severity, q, sort = "latest" } = {}) {
  let out = events;
  if (category) out = out.filter((e) => e.category === category);
  if (country) out = out.filter((e) => e.countries.includes(country));
  if (severity) out = out.filter((e) => e.severity >= Number(severity));
  if (q) { const s = q.toLowerCase(); out = out.filter((e) => (e.title + " " + e.summary + " " + e.tags.join(" ")).toLowerCase().includes(s)); }
  return sort === "importance" ? [...out].sort((a, b) => b.severity - a.severity || b.time.localeCompare(a.time)) : out;
}
export async function getQuakes() {
  const r = await safe("ev:usgs", 60e3, () => usgs.fetchQuakes("2.5_day"));
  return r.ok ? { quakes: r.value, available: true, stale: !!r.stale, meta: r.value[0]?.meta || null } : { quakes: [], available: false, error: r.error };
}

// ---------- countries & humanity
export async function getCountries() {
  const keys = ["population", "gdp", "gdpGrowth", "inflation"];
  const res = await Promise.all(keys.map((k) => safe("wb:" + k, 24 * 3600e3, () => wb.fetchIndicator(k))));
  const out = COUNTRIES.map((c) => {
    const o = { ...c, flag: FLAG(c.iso2), provenance: {} };
    keys.forEach((k, i) => { const r = res[i]; const hit = r.ok ? r.value.get(c.iso3) : null; if (hit) { o[k] = k === "gdp" || k === "population" ? hit.value : Math.round(hit.value * 10) / 10; o.provenance[k] = { status: "PERIODIC", year: hit.year, source: "World Bank" }; } else o.provenance[k] = { status: "DEMO", year: 2023, source: "Bundled reference snapshot (approximate)" }; });
    return o;
  });
  const live = res.filter((r) => r.ok).length;
  return { countries: out, meta: meta({ provider: live ? "World Bank + bundled snapshot" : "Bundled reference snapshot", source: live ? "World Bank Indicators API (most recent value per country)" : "Hand-entered approximate figures, circa 2023", status: live ? "PERIODIC" : "DEMO", frequency: "annual", dataType: "country indicators", attribution: live ? "World Bank Open Data (CC BY 4.0)" : "None: approximate", note: live ? `${live}/4 indicators loaded; the year of each value is shown per field.` : "Not live. World Bank unreachable or offline, so these approximate snapshot values are shown." }) };
}
export function getHumanity() {
  return { anchor: WORLD_POP.anchor, history: WORLD_POP.history, projection: WORLD_POP.projection, regions: WORLD_POP.regions, urban: WORLD_POP.urban,
    meta: meta({ provider: "ORBIS statistical model", source: "Rounded UN World Population Prospects 2024-style parameters", status: "ESTIMATE", frequency: "model rates applied continuously", dataType: "population estimate", units: "people", attribution: "Approximation of UN DESA World Population Prospects", note: WORLD_POP.anchor.note + " Births and deaths are not live registrations: they are rates applied to elapsed time." }) };
}
export function getForecastPopulation() {
  return { scenarios: populationScenarios(), history: WORLD_POP.history, method: METHOD, meta: meta({ provider: "ORBIS scenario model", source: "Simple compound-growth scenarios", status: "PROJECTION", frequency: "static model", dataType: "population projection", units: "people", note: "Projection, not a fact." }) };
}
export const getHistoryTimeline = () => ({ events: HISTORY, meta: meta({ provider: "ORBIS curated reference", source: "Hand-curated well-established historical milestones", status: "PERIODIC", frequency: "static", dataType: "historical timeline", note: "Curated reference list, not exhaustive. Years before 0 are BCE." }) });
export const getResources = async () => { const { assets } = await getAssets(); return { facts: COMMODITY_FACTS, prices: assets.filter((a) => ["commodity", "metal"].includes(a.class)), meta: meta({ provider: "ORBIS reference", source: "Qualitative producer/consumer lists (bundled) + prices from market feed", status: "DEMO", frequency: "static + market", dataType: "resources", note: "Producer/consumer lists are approximate qualitative rankings, not production statistics. Prices carry their own status." }) }; };

// ---------- graph, search, geo, status
export async function getGraph(focus, opts) {
  const { assets } = await getAssets(); const { events } = await getEvents(); const g = buildGraph(assets, events);
  return focus ? neighbourhood(g, focus, opts) : { nodes: g.nodes.filter((n) => ["country", "industry", "commodity"].includes(n.type)), edges: [] };
}
export async function getSearch(q) {
  const { assets } = await getAssets(); const { events } = await getEvents();
  return search(buildIndex({ countries: COUNTRIES, cities: CITIES, assets, industries: INDUSTRIES, commodities: Object.keys(COMMODITY_FACTS), events }), q);
}
export async function getGeo() { try { const r = await geo.loadCountries(); return { available: true, countries: r.feats, source: r.source }; } catch (e) { return { available: false, error: e.message }; } }
export function getStatus() {
  return { time: new Date().toISOString(), offline: config.offline, sources: registry.list(), configured: { twelvedata: td.configured(), ai: !!config.anthropicKey } };
}
export const getCities = () => ({ cities: CITIES, meta: meta({ provider: "Bundled reference", source: "Approximate metro populations", status: "DEMO", frequency: "static", dataType: "cities", note: "Approximate, hand-entered." }) });

// ---------- hazards, weather, macro series (V2 live environment/economy)
export async function getHazards() {
  const r = await safe("ev:eonet", 10 * 60e3, eonet.fetchOpen);
  return r.ok ? { hazards: r.value, available: true, stale: !!r.stale, meta: r.value[0]?.meta || null } : { hazards: [], available: false, error: r.error };
}
export async function getWeather() {
  const places = CITIES.slice(0, 20).map((c) => ({ name: c.name, iso2: c.iso2, lat: c.lat, lon: c.lon }));
  const r = await safe("om:cities", 15 * 60e3, () => om.fetchCurrent(places));
  return r.ok ? { places: r.value, available: true, stale: !!r.stale, meta: r.value[0]?.meta || null } : { places: [], available: false, error: r.error };
}
export async function getMacro(id) {
  if (!fred.SERIES[id]) return null;
  if (!fred.configured()) return { available: false, id, label: fred.SERIES[id].label, error: "FRED_API_KEY is not configured on the server" };
  const r = await safe("fred:" + id, 3600e3, () => fred.fetchSeries(id));
  return r.ok ? { available: true, stale: !!r.stale, ...r.value } : { available: false, id, label: fred.SERIES[id].label, error: r.error };
}
export const getMacroCatalog = () => ({ configured: fred.configured(), series: Object.entries(fred.SERIES).map(([id, s]) => ({ id, ...s })) });
export async function getCountrySeries(iso2, key) {
  if (!wb.INDICATORS[key]) return null;
  const c = COUNTRIES.find((x) => x.iso2 === String(iso2).toUpperCase()); if (!c) return null;
  const r = await safe(`wb:s:${c.iso2}:${key}`, 24 * 3600e3, () => wb.fetchCountrySeries(c.iso2, key));
  const m = meta({ provider: "World Bank", source: "World Bank Open Data, indicator " + wb.INDICATORS[key], status: r.ok ? "PERIODIC" : "UNAVAILABLE", frequency: "annual (about 1 year lag)", dataType: key, attribution: "World Bank, CC BY 4.0", license: "CC BY 4.0", note: r.ok ? "" : r.error });
  return { country: c.iso2, indicator: key, available: r.ok, points: r.ok ? r.value : [], error: r.ok ? undefined : r.error, meta: m };
}
export const getIndicatorCatalog = () => ({ indicators: Object.keys(wb.INDICATORS) });

// ---------- anomalies and alerts
export async function getAnomalies() {
  const { assets } = await getAssets(); const flags = detectAll(assets);
  return { anomalies: flags, checked: assets.length, meta: meta({ provider: "ORBIS anomaly detector", source: "Modified z-score (median/MAD) of latest log-return per asset", status: assets.every((a) => a.meta.status === "DEMO") ? "DEMO" : "ESTIMATE", frequency: "per request", dataType: "anomalies", note: "Controls: min 30 observations, z>=3.5, move>=0.5%, max 10 flags. Flags are statistical, not causal." }) };
}
export async function evaluateAlertRules(rules) {
  if (!Array.isArray(rules)) return { error: "rules must be an array" };
  const bad = rules.map(validateRule).find(Boolean); if (bad) return { error: bad };
  const [a, e, q] = await Promise.all([getAssets(), getEvents(), getQuakes()]);
  return { triggered: evalAlerts(rules, { assets: a.assets, events: e.events, quakes: q.quakes }), evaluatedAt: new Date().toISOString() };
}

// ---------- space, science, cyber, aviation (V2/V6 live feeds). Each returns {available, ..., error} and never fabricates.
const live = async (key, ttl, fn, name) => { const r = await safe(key, ttl, fn); return r.ok ? { available: true, stale: !!r.stale, [name]: r.value } : { available: false, error: r.error, [name]: [] }; };
export const getLaunches = () => live("ll:upcoming", 15 * 60e3, launches.fetchUpcoming, "launches");
export const getNeo = () => live("nasa:neo", 3600e3, nasa.fetchNeo, "objects");
export async function getSpaceWeather() { const r = await safe("swpc:kp", 10 * 60e3, swpc.fetchKp); return r.ok ? { available: true, ...r.value } : { available: false, error: r.error }; }
export const getSatellites = (g = "stations") => celestrak.GROUPS.includes(g) ? live("ct:" + g, 3600e3, () => celestrak.fetchGroup(g), "satellites") : null;
export const getPublications = (q = "") => live("oa:" + q, 3600e3, () => openalex.fetchRecent(q), "works");
export const getPreprints = (c = "astro-ph") => live("ax:" + c, 3600e3, () => arxiv.fetchRecent(c), "papers");
export const getVulnerabilities = async () => { const r = await live("cisa:kev", 3600e3, cisa.fetchKev, "vulnerabilities"); r.total = r.vulnerabilities.length; r.vulnerabilities = r.vulnerabilities.slice(0, 100); return r; };
export const getAircraft = () => live("os:states", 30e3, opensky.fetchStates, "aircraft");

// ---------- indicator tables (World Bank), climate, oceans, air, astronomy, biodiversity, tech, filings, simulations
export async function getIndicatorTable(keys) {
  keys = [...new Set(keys)].filter((k) => wb.INDICATORS[k]).slice(0, 8); if (!keys.length) return null;
  const res = await Promise.all(keys.map((k) => safe("wb:" + k, 24 * 3600e3, () => wb.fetchIndicator(k))));
  const any = res.some((r) => r.ok);
  const rows = COUNTRIES.map((c) => ({ iso2: c.iso2, name: c.name, flag: FLAG(c.iso2), region: c.region, values: Object.fromEntries(keys.map((k, i) => [k, res[i].ok && res[i].value.get(c.iso3) ? res[i].value.get(c.iso3) : null])) }));
  return { keys, available: any, rows: any ? rows : [], errors: res.map((r, i) => (r.ok ? null : { key: keys[i], error: r.error })).filter(Boolean),
    meta: meta({ provider: "World Bank", source: "World Bank Open Data (" + keys.map((k) => wb.INDICATORS[k]).join(", ") + ")", status: any ? "PERIODIC" : "UNAVAILABLE", frequency: "annual (most recent value per country; years differ)", dataType: "indicators", attribution: "World Bank, CC BY 4.0", license: "CC BY 4.0", note: any ? "Each cell shows its own reference year; countries differ in latest available year." : "World Bank unreachable: no values shown." }) };
}
export async function getClimate() {
  const [co2, ch4, gis, n, sx] = await Promise.all([safe("cl:co2", 24 * 3600e3, climate.fetchCo2), safe("cl:ch4", 24 * 3600e3, climate.fetchCh4), safe("cl:gis", 24 * 3600e3, climate.fetchGistemp), safe("cl:ice:n", 6 * 3600e3, () => climate.fetchSeaIce("north")), safe("cl:ice:s", 6 * 3600e3, () => climate.fetchSeaIce("south"))]);
  const pick = (r) => (r.ok ? { available: true, ...r.value } : { available: false, error: r.error });
  return { co2: pick(co2), ch4: pick(ch4), temperature: pick(gis), seaIceNorth: pick(n), seaIceSouth: pick(sx) };
}
const OCEAN_POINTS = [["North Atlantic", 45, -30], ["South Atlantic", -25, -15], ["North Pacific", 35, -150], ["Equatorial Pacific", 0, -140], ["South Pacific", -35, -120], ["Indian Ocean", -15, 80], ["Southern Ocean", -55, 60], ["Arabian Sea", 15, 65], ["Coral Sea", -18, 155], ["Gulf Stream", 35, -70]].map(([name, lat, lon]) => ({ name, lat, lon }));
export async function getOceans() { const r = await safe("om:marine", 30 * 60e3, () => om.fetchMarine(OCEAN_POINTS)); return r.ok ? { available: true, points: r.value, meta: r.value[0].meta } : { available: false, error: r.error, points: [] }; }
export async function getAirQuality() { const places = CITIES.slice(0, 20).map((c) => ({ name: c.name, iso2: c.iso2, lat: c.lat, lon: c.lon })); const r = await safe("om:air", 30 * 60e3, () => om.fetchAir(places)); return r.ok ? { available: true, places: r.value, meta: r.value[0].meta } : { available: false, error: r.error, places: [] }; }
export async function getIss() { const r = await safe("iss", 5e3, extras.fetchIss); return r.ok ? { available: true, ...r.value } : { available: false, error: r.error }; }
export async function getAstronomy() {
  const [apod, exo, xr, neo] = await Promise.all([safe("apod", 6 * 3600e3, extras.fetchApod), safe("exo", 24 * 3600e3, extras.fetchExoplanets), safe("goes", 5 * 60e3, extras.fetchXray), getNeo()]);
  return { apod: apod.ok ? { available: true, ...apod.value } : { available: false, error: apod.error }, exoplanets: exo.ok ? { available: true, planets: exo.value } : { available: false, error: exo.error, planets: [] }, xray: xr.ok ? { available: true, ...xr.value } : { available: false, error: xr.error }, neo, meteorShowers: { items: METEOR_SHOWERS.map(([name, peak]) => ({ name, peak })), meta: meta({ provider: "ORBIS reference", source: "Annual meteor shower calendar (approximate peak dates)", status: "PERIODIC", frequency: "annual", dataType: "reference", note: "Peaks recur each year; exact timing and moon phase vary. Hand-entered." }) } };
}
export const SPECIES = ["Orcinus orca", "Balaenoptera musculus", "Carcharodon carcharias", "Chelonia mydas", "Mobula birostris", "Megaptera novaeangliae", "Thunnus thynnus", "Architeuthis dux"];
export async function getSpecies(name) { const r = await safe("gbif:" + name, 3600e3, () => extras.fetchGbif(name)); return r.ok ? { available: true, ...r.value } : { available: false, error: r.error }; }
export async function getTechNews() { const r = await safe("hn", 5 * 60e3, extras.fetchHn); return r.ok ? { available: true, stories: r.value } : { available: false, error: r.error, stories: [] }; }
export async function getFiler(key) { if (!extras.FILERS[key]) return null; const r = await safe("edgar:" + key, 3600e3, () => extras.fetchEdgar(key)); return r.ok ? { available: true, key, ...r.value } : { available: false, key, name: extras.FILERS[key][1], error: r.error }; }
export const getFilerList = () => ({ filers: Object.entries(extras.FILERS).map(([key, [cik, name]]) => ({ key, cik, name })) });
export const getMegaprojects = () => ({ projects: MEGAPROJECTS, asOf: AS_OF, meta: meta({ provider: "ORBIS reference", source: "Hand-curated from public project pages", status: "ESTIMATE", frequency: "manual", dataType: "project status (reference)", note: `Statuses are as of ${AS_OF} and change often. Verify with the linked source.` }) });
export const getChokepoints = () => ({ chokepoints: CHOKEPOINTS, meta: meta({ provider: "ORBIS reference", source: "Qualitative description of major maritime chokepoints", status: "ESTIMATE", frequency: "manual", dataType: "reference", note: "No traffic volumes are shown: AIS data needs a licensed provider." }) });
export const getSimulationModels = () => ({ models: Object.entries(MODELS).map(([id, m]) => ({ id, label: m.label, defaults: m.defaults })) });
export const runSimulation = (model, params) => simulate(model, params);
