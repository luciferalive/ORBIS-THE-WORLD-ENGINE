import test from "node:test";
import assert from "node:assert/strict";
process.env.ORBIS_OFFLINE = "1";
const { route } = await import("../server/api.js");
const { parseMarkets } = await import("../server/providers/coingecko.js");
const { parseTimeseries } = await import("../server/providers/frankfurter.js");
const { parseQuotes, parseSeries } = await import("../server/providers/twelvedata.js");
const { parseQuakes } = await import("../server/providers/usgs.js");
const { parseGdelt, parseRss, classify } = await import("../server/providers/news.js");
const { parseIndicator } = await import("../server/providers/worldbank.js");
const { simplify } = await import("../server/providers/geo.js");
const { analyseSeries, buildSignals, projectCone } = await import("../server/intelligence/signals.js");
const { populationScenarios } = await import("../server/intelligence/forecast.js");
const { STATUS } = await import("../server/models.js");
const get = (p) => route("GET", new URL("http://x" + p), null);

test("offline: every market asset is labelled DEMO, never LIVE", async () => {
  const r = await get("/api/markets"); assert.ok(r.assets.length >= 40);
  for (const a of r.assets) { assert.equal(a.meta.status, "DEMO", a.id); assert.ok(Number.isFinite(a.price) && a.price > 0); assert.ok(STATUS.includes(a.meta.status)); }
});
test("offline: events are SAMPLE placeholders and titled as such; nothing claims to be reported", async () => {
  const r = await get("/api/events"); assert.equal(r.sample, true);
  for (const e of r.events) { assert.equal(e.kind, "sample"); assert.ok(e.title.startsWith("[SAMPLE]")); assert.equal(e.meta.status, "DEMO"); }
});
test("offline: quakes and boundaries report UNAVAILABLE, not fake data", async () => {
  const q = await get("/api/quakes"); assert.equal(q.available, false); assert.deepEqual(q.quakes, []);
  assert.equal((await get("/api/geo/countries")).available, false);
});
test("countries: snapshot is labelled DEMO with per-field provenance", async () => {
  const r = await get("/api/countries"); assert.equal(r.meta.status, "DEMO"); assert.ok(r.countries.length >= 40);
  const us = r.countries.find((c) => c.iso2 === "US"); assert.equal(us.provenance.gdp.status, "DEMO"); assert.equal(us.flag, "🇺🇸");
});
test("humanity is an ESTIMATE with explicit rates", async () => {
  const r = await get("/api/humanity"); assert.equal(r.meta.status, "ESTIMATE"); assert.ok(r.anchor.birthsPerYear > r.anchor.deathsPerYear);
});
test("history endpoint validates range and returns requested number of points", async () => {
  await assert.rejects(get("/api/markets/btc/history?range=BAD"));
  const r = await get("/api/markets/btc/history?range=1Y"); assert.equal(r.series.length, 365);
  await assert.rejects(get("/api/markets/nope/history?range=7D"));
});
test("search finds countries, assets and commodities; empty query returns nothing", async () => {
  assert.ok((await get("/api/search?q=india")).results.some((r) => r.type === "country" && r.id === "IN"));
  assert.ok((await get("/api/search?q=bitcoin")).results.some((r) => r.id === "btc"));
  assert.ok((await get("/api/search?q=lithium")).results.some((r) => r.type === "commodity"));
  assert.equal((await get("/api/search?q=")).results.length, 0);
});
test("graph neighbourhood respects depth and node limit", async () => {
  const g1 = await get("/api/graph?focus=country:IN&depth=1&limit=60"); assert.ok(g1.nodes.every((n) => n.depth <= 1)); assert.ok(g1.nodes.length > 2);
  const g2 = await get("/api/graph?focus=country:IN&depth=3&limit=10"); assert.ok(g2.nodes.length <= 10);
  for (const e of g2.edges) { const ids = new Set(g2.nodes.map((n) => n.id)); assert.ok(ids.has(e.a) && ids.has(e.b)); }
  await assert.rejects(get("/api/graph?focus=country:ZZ"));
});
test("signals are calculated from series and carry DEMO status offline", async () => {
  const r = await get("/api/signals"); assert.equal(r.meta.status, "DEMO");
  for (const list of Object.values(r.signals)) for (const s of list) { assert.equal(s.dataStatus, "DEMO"); assert.ok(s.explanation.length > 10); }
  const s = r.signals.rising; for (let i = 1; i < s.length; i++) assert.ok(s[i - 1].strength >= s[i].strength);
});
test("analyseSeries: pegged series ignored; trend and spike detected", () => {
  assert.equal(analyseSeries(Array.from({ length: 30 }, (_, i) => ({ t: i, v: 3.6725 }))), null);
  const up = analyseSeries(Array.from({ length: 30 }, (_, i) => ({ t: i, v: 100 + i }))); assert.ok(up.total > 28);
  const spike = Array.from({ length: 30 }, (_, i) => ({ t: i, v: 100 + (i % 2) * 0.1 })); spike.push({ t: 30, v: 108 });
  assert.ok(Math.abs(analyseSeries(spike).z) > 5);
});
test("projectCone: bands ordered and widen with horizon", () => {
  const series = Array.from({ length: 60 }, (_, i) => ({ t: i * 86400e3, v: 100 * Math.exp(0.001 * i + 0.01 * Math.sin(i)) }));
  const c = projectCone(series, 20); for (const p of c.points) assert.ok(p.adverse <= p.base && p.base <= p.optimistic);
  assert.ok(c.points[20].optimistic - c.points[20].adverse > c.points[5].optimistic - c.points[5].adverse);
});
test("population scenarios: ordered, start at 2024 value, labelled projection", async () => {
  const s = populationScenarios(); const end = (k) => s[k].points.at(-1).value;
  assert.ok(end("optimistic") > end("base") && end("base") > end("adverse")); assert.equal(s.base.points[0].year, 2024);
  assert.equal((await get("/api/forecast/population")).meta.status, "PROJECTION");
  assert.equal((await get("/api/forecast/asset?id=xau")).meta.status, "PROJECTION");
});
test("analyst: disabled without a key and says so", async () => {
  const r = await route("POST", new URL("http://x/api/analyst/ask"), { question: "hello" }); assert.equal(r.enabled, false);
  await assert.rejects(route("POST", new URL("http://x/api/analyst/ask"), {}));
  const ctx = await get("/api/analyst/context"); assert.ok(ctx.text.includes("DEMO") && ctx.sampleEvents === true);
});
// ---- provider parsers against fixtures that follow the documented response formats
test("CoinGecko parser", () => {
  const raw = [{ id: "bitcoin", name: "Bitcoin", current_price: 100000, price_change_24h: 500, price_change_percentage_24h: 0.5, market_cap: 2e12, total_volume: 3e10, last_updated: "2026-11-25T05:00:00Z", sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 99000 + i) } }, { id: "unknowncoin", current_price: 1 }];
  const out = parseMarkets(raw); assert.equal(out.length, 1); assert.equal(out[0].meta.status, "LIVE"); assert.equal(out[0].series.length, 168); assert.equal(out[0].seriesRange, "7D");
  assert.throws(() => parseMarkets({ error: "rate limit" }));
});
test("Frankfurter parser inverts quotes correctly and marks pegs", () => {
  const raw = { rates: { "2026-11-23": { EUR: 0.92, GBP: 0.79, JPY: 150, CHF: 0.88, INR: 84 }, "2026-11-24": { EUR: 0.9, GBP: 0.8, JPY: 151, CHF: 0.87, INR: 84.5 } } };
  const out = parseTimeseries(raw), eur = out.find((a) => a.id === "eurusd");
  assert.ok(Math.abs(eur.price - 1 / 0.9) < 1e-9); assert.equal(eur.meta.status, "RECENT"); assert.equal(out.find((a) => a.id === "usdjpy").price, 151);
  assert.equal(out.find((a) => a.id === "usdaed").meta.status, "PERIODIC");
});
test("Twelve Data parser: single and batch shapes; market closed becomes RECENT", () => {
  const q = { symbol: "AAPL", close: "230.5", percent_change: "1.2", change: "2.7", is_market_open: false, timestamp: 1790000000 };
  assert.equal(parseQuotes(q, ["aapl"])[0].meta.status, "RECENT");
  const batch = { AAPL: { ...q, is_market_open: true }, MSFT: { status: "error", code: 404 } };
  const out = parseQuotes(batch, ["aapl", "msft"]); assert.equal(out.length, 1); assert.equal(out[0].meta.status, "LIVE");
  assert.deepEqual(parseSeries({ values: [{ datetime: "2026-11-24", close: "2" }, { datetime: "2026-11-23", close: "1" }] }).map((p) => p.v), [1, 2]);
});
test("USGS parser: severity from magnitude, kind measured", () => {
  const raw = { features: [{ id: "us1", properties: { mag: 6.4, place: "10km N of Somewhere", time: 1790000000000, url: "https://x", tsunami: 0 }, geometry: { coordinates: [139.7, 35.6, 25] } }, { id: "bad", properties: { mag: null }, geometry: { coordinates: [0, 0, 0] } }] };
  const out = parseQuakes(raw); assert.equal(out.length, 1); assert.equal(out[0].severity, 4); assert.equal(out[0].kind, "measured"); assert.equal(out[0].lat, 35.6);
});
test("News parsers: GDELT date, RSS CDATA, classification", () => {
  const g = parseGdelt({ articles: [{ url: "https://a.com/1", title: "Central bank raises interest rate again", seendate: "20261125T043000Z", domain: "a.com", sourcecountry: "India" }] });
  assert.equal(g[0].time, "2026-11-25T04:30:00.000Z"); assert.equal(g[0].category, "economics"); assert.equal(g[0].kind, "reported");
  const xml = `<rss><channel><item><title><![CDATA[Earthquake strikes coast &amp; port]]></title><link>https://b.com/x</link><description>Desc</description><pubDate>Tue, 24 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
  const r = parseRss(xml, "BBC News"); assert.equal(r[0].title, "Earthquake strikes coast & port"); assert.equal(r[0].category, "natural_disaster");
  assert.equal(classify("Quiet day in the village"), "society"); assert.throws(() => parseRss("<html/>", "x"));
});
test("World Bank parser keeps the newest value per country; geo simplifier rounds coords", () => {
  const raw = [{ page: 1 }, [{ countryiso3code: "IND", date: "2022", value: 1 }, { countryiso3code: "IND", date: "2023", value: 2 }, { countryiso3code: "IND", date: "2024", value: null }, { countryiso3code: "", date: "2023", value: 5 }]];
  const m = parseIndicator(raw); assert.deepEqual(m.get("IND"), { value: 2, year: 2023 }); assert.equal(m.size, 1);
  const f = simplify({ features: [{ properties: { ISO_A2: "-99", ISO_A2_EH: "FR", ISO_A3: "FRA", NAME: "France" }, geometry: { type: "Polygon", coordinates: [[[2.123456, 48.98765], [3, 49], [2, 50], [2.123456, 48.98765]]] } }] });
  assert.equal(f[0].iso2, "FR"); assert.deepEqual(f[0].polys[0][0][0], [2.12, 48.99]);
});

// ---- V2 providers (fixtures in documented formats)
const { parseEvents: parseEonet } = await import("../server/providers/eonet.js");
const { parseCurrent: parseOm } = await import("../server/providers/openmeteo.js");
const { parseObservations: parseFred } = await import("../server/providers/fred.js");
const { parseSeries: parseWbSeries } = await import("../server/providers/worldbank.js");
const svc = await import("../server/services.js");
test("EONET parser takes latest point geometry and skips events without one", () => {
  const raw = { events: [{ id: "EONET_1", title: "Wildfire X", categories: [{ id: "wildfires", title: "Wildfires" }], geometry: [{ type: "Point", date: "2026-11-20T00:00:00Z", coordinates: [-120, 38] }, { type: "Point", date: "2026-11-22T00:00:00Z", coordinates: [-121, 39] }], closed: null, sources: [{ url: "https://x" }] }, { id: "EONET_2", title: "No geom", categories: [], geometry: [] }] };
  const out = parseEonet(raw); assert.equal(out.length, 1); assert.equal(out[0].lat, 39); assert.equal(out[0].hazard, "wildfire"); assert.equal(out[0].meta.status, "LIVE");
  assert.throws(() => parseEonet({}));
});
test("Open-Meteo parser maps array response to places and is labelled model-based", () => {
  const raw = [{ latitude: 35.7, longitude: 139.7, current: { time: "2026-11-25T05:00", temperature_2m: 12.3, precipitation: 0, wind_speed_10m: 9, weather_code: 1 } }];
  const out = parseOm(raw, [{ name: "Tokyo", iso2: "JP" }]); assert.equal(out[0].place, "Tokyo"); assert.equal(out[0].tempC, 12.3); assert.match(out[0].meta.note, /Model-based/);
  assert.throws(() => parseOm({ error: true }, [{}]));
});
test("FRED parser drops missing '.' values and returns ascending points", () => {
  const raw = { observations: [{ date: "2026-11-24", value: "4.1" }, { date: "2026-11-23", value: "." }, { date: "2026-11-22", value: "4.0" }] };
  const out = parseFred(raw, "DGS10"); assert.deepEqual(out.points.map((p) => p.v), [4.0, 4.1]); assert.equal(out.latest.date, "2026-11-24"); assert.equal(out.meta.status, "PERIODIC");
});
test("World Bank country series parser sorts ascending and drops nulls", () => {
  const raw = [{ page: 1 }, [{ date: "2023", value: 3 }, { date: "2021", value: null }, { date: "2022", value: 2 }]];
  assert.deepEqual(parseWbSeries(raw), [{ year: 2022, value: 2 }, { year: 2023, value: 3 }]);
});
test("offline: hazards, weather unavailable; macro without key is explicit", async () => {
  const hz = await svc.getHazards(); assert.equal(hz.available, false); const w = await svc.getWeather(); assert.equal(w.available, false);
  const m = await svc.getMacro("DGS10"); assert.equal(m.available, false); assert.match(m.error, /FRED_API_KEY/); assert.equal(await svc.getMacro("nope"), null);
});

// ---- anomaly + alerts
const { detect, detectAll } = await import("../server/intelligence/anomaly.js");
const { evaluate: evalAlerts, validateRule } = await import("../server/intelligence/alerts.js");
test("anomaly: spike flagged, calm series not, short series refused with reason", () => {
  const calm = Array.from({ length: 60 }, (_, i) => [i, 100 + Math.sin(i) * 0.3]);
  assert.equal(detect(calm).flagged, false);
  const spike = [...calm, [60, 112]]; const r = detect(spike); assert.equal(r.flagged, true); assert.ok(r.movePct > 5); assert.match(r.reason, /robust standard deviations/);
  assert.equal(detect(calm.slice(0, 10)).flagged, false); assert.match(detect(calm.slice(0, 10)).reason, /not enough/);
  const flat = Array.from({ length: 60 }, (_, i) => [i, 50]); assert.equal(detect([...flat, [60, 50.01]]).flagged, false);
});
test("alerts: validation, thresholds and sample events never trigger", () => {
  assert.ok(validateRule({ id: "a", type: "asset_change", asset: "btc", op: "x", value: 1 })); assert.equal(validateRule({ id: "a", type: "asset_change", asset: "btc", op: ">", value: 1 }), null);
  const ctx = { assets: [{ id: "btc", name: "Bitcoin", price: 100, changePct: 6, meta: { status: "LIVE" } }], events: [{ id: "s1", kind: "sample", severity: 5, category: "war", title: "[SAMPLE]", summary: "", meta: { status: "DEMO" }, time: "2026-01-01T00:00:00Z", source: "x" }, { id: "r1", kind: "reported", severity: 4, category: "war", title: "Real", summary: "", meta: { status: "RECENT" }, time: "2026-01-01T00:00:00Z", source: "BBC" }], quakes: [] };
  const out = evalAlerts([{ id: "r1", type: "asset_change", asset: "btc", op: ">", value: 5 }, { id: "r2", type: "asset_change", asset: "btc", op: "<", value: -5 }, { id: "r3", type: "event", minSeverity: 3 }], ctx);
  assert.deepEqual(out.map((x) => x.ruleId).sort(), ["r1", "r3"]); assert.equal(out.find((x) => x.ruleId === "r3").title, "Real");
});
test("API: anomalies and alert evaluation endpoints", async () => {
  const a = await route("GET", new URL("http://x/api/anomalies")); assert.ok(Array.isArray(a.anomalies));
  const r = await route("POST", new URL("http://x/api/alerts/evaluate"), { rules: [{ id: "t", type: "asset_price", asset: "spx", op: ">", value: 1 }] }); assert.equal(r.triggered.length, 1);
  await assert.rejects(() => route("POST", new URL("http://x/api/alerts/evaluate"), { rules: [{ id: "t", type: "nope" }] }));
});
