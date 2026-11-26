import test from "node:test";
import assert from "node:assert/strict";
process.env.ORBIS_OFFLINE = "1";
process.env.ORBIS_DB = ":memory:";
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

// ---- V2/V6 adapters
const P = (n) => import("../server/providers/" + n + ".js");
test("SWPC Kp parser (header-row array) and storm level", async () => {
  const { parseKp } = await P("swpc"); const r = parseKp([["time_tag", "Kp", "a_running", "station_count"], ["2026-11-25 00:00:00.000", "2.33", "9", "8"], ["2026-11-25 03:00:00.000", "6.00", "80", "8"]]);
  assert.equal(r.points.length, 2); assert.equal(r.latest.kp, 6); assert.match(r.latest.storm, /G2/); assert.throws(() => parseKp({}));
});
test("Launch Library parser keeps NET as target and skips incomplete rows", async () => {
  const { parseLaunches } = await P("launches"); const o = parseLaunches({ results: [{ id: "a", name: "Falcon 9 | X", net: "2026-12-01T10:00:00Z", status: { name: "Go" }, launch_service_provider: { name: "SpaceX" }, pad: { name: "SLC-40", latitude: "28.5", longitude: "-80.5", location: { name: "Florida" } } }, { id: "b" }] });
  assert.equal(o.length, 1); assert.equal(o[0].provider, "SpaceX"); assert.equal(o[0].lat, 28.5); assert.match(o[0].meta.note, /slip/);
});
test("NeoWs parser flattens by date and sorts", async () => {
  const { parseNeo } = await P("nasa"); const o = parseNeo({ near_earth_objects: { "2026-11-27": [{ id: "1", name: "(2020 AB)", is_potentially_hazardous_asteroid: true, estimated_diameter: { meters: { estimated_diameter_max: 120 } }, close_approach_data: [{ close_approach_date_full: "2026-Nov-27 10:00", miss_distance: { kilometers: "1000000" }, relative_velocity: { kilometers_per_second: "12.5" } }] }], "2026-11-26": [{ id: "2", name: "x", close_approach_data: [{ close_approach_date: "2026-11-26", miss_distance: { kilometers: "5" }, relative_velocity: { kilometers_per_second: "1" } }] }] } });
  assert.equal(o.length, 2); assert.equal(o[0].id, "2"); assert.equal(o[1].hazardous, true); assert.equal(o[1].missKm, 1000000);
});
test("CelesTrak GP parser computes period/altitude from mean motion, no position claimed", async () => {
  const { parseGp } = await P("celestrak"); const o = parseGp([{ OBJECT_NAME: "ISS (ZARYA)", OBJECT_ID: "1998-067A", NORAD_CAT_ID: 25544, EPOCH: "2026-11-25T00:00:00", MEAN_MOTION: 15.5, ECCENTRICITY: 0.0005, INCLINATION: 51.64 }], "stations");
  assert.ok(Math.abs(o[0].periodMin - 92.9) < 0.2); assert.ok(o[0].meanAltitudeKm > 380 && o[0].meanAltitudeKm < 450); assert.match(o[0].meta.note, /not computed/);
});
test("OpenAlex and arXiv parsers; arXiv items flagged PREPRINT", async () => {
  const { parseWorks } = await P("openalex"); const w = parseWorks({ results: [{ id: "https://openalex.org/W1", title: "T", publication_date: "2026-11-01", primary_location: { source: { display_name: "Nature", type: "journal" } }, authorships: [{ author: { display_name: "A" } }], open_access: { is_oa: true }, cited_by_count: 3 }, { id: "x" }] });
  assert.equal(w.length, 1); assert.equal(w[0].peerReviewed, "journal");
  const { parseAtom } = await P("arxiv"); const a = parseAtom('<feed><entry><id>http://arxiv.org/abs/2611.0001v1</id><title>A &amp; B</title><summary> s </summary><published>2026-11-25T00:00:00Z</published><author><name>X Y</name></author><arxiv:primary_category term="astro-ph.CO"/></entry></feed>');
  assert.equal(a[0].title, "A & B"); assert.equal(a[0].status, "PREPRINT"); assert.equal(a[0].category, "astro-ph.CO"); assert.throws(() => parseAtom("nope"));
});
test("CISA KEV parser sorts newest first; OpenSky parser drops grounded and null positions", async () => {
  const { parseKev } = await P("cisa"); const k = parseKev({ vulnerabilities: [{ cveID: "CVE-1", dateAdded: "2026-01-01", knownRansomwareCampaignUse: "Known" }, { cveID: "CVE-2", dateAdded: "2026-02-01" }] });
  assert.equal(k[0].cve, "CVE-2"); assert.equal(k[1].ransomware, true);
  const { parseStates } = await P("opensky"); const s = parseStates({ time: 1790000000, states: [["abc", "UAL1 ", "US", 0, 0, -100, 40, 10000, false, 230, 90], ["def", "", "US", 0, 0, null, null, 0, false], ["ghi", "G", "IN", 0, 0, 77, 28, 0, true]] });
  assert.equal(s.length, 1); assert.equal(s[0].callsign, "UAL1"); assert.match(s[0].meta.note, /volunteer/);
});
test("SSRF guard blocks http, private IPs, credentials, odd ports", async () => {
  const { assertSafeUrl, isPrivateIp } = await import("../server/core/providers.js");
  for (const u of ["http://example.com", "https://127.0.0.1/x", "https://10.0.0.5", "https://user:pw@example.com", "https://example.com:8443", "https://[::1]/", "https://169.254.169.254/latest"]) await assert.rejects(() => assertSafeUrl(u), undefined, u);
  assert.equal(isPrivateIp("8.8.8.8"), false); assert.equal(isPrivateIp("192.168.1.1"), true);
});
test("providers endpoint lists catalogue with honest statuses; admin routes need a token", async () => {
  const r = await route("GET", new URL("http://x/api/providers")); assert.ok(r.providers.length > 40); assert.equal(r.providers.find((p) => p.id === "nvd").status, "NOT INTEGRATED");
  assert.equal(r.providers.find((p) => p.id === "fred").status, "CONFIGURATION REQUIRED"); assert.equal(r.providers.find((p) => p.id === "usgs").status, "OFFLINE MODE");
  await assert.rejects(() => route("POST", new URL("http://x/api/admin/providers"), { name: "x", url: "https://example.com" }, {}), /ORBIS_ADMIN_TOKEN|admin/);
});
test("offline: space/science/cyber/aviation feeds say unavailable instead of inventing data", async () => {
  for (const f of ["getLaunches", "getNeo", "getPublications", "getPreprints", "getVulnerabilities", "getAircraft"]) { const r = await svc[f](); assert.equal(r.available, false, f); }
  assert.equal((await svc.getSpaceWeather()).available, false); assert.equal(svc.getSatellites("bogus"), null);
});

// ---- batch 3 adapters, simulations
test("NOAA GML parser skips comments and missing sentinel values", async () => {
  const { parseGml } = await P("climate"); const rows = Array.from({ length: 14 }, (_, i) => `2025 ${String((i % 12) + 1).padStart(2)} 2025.${i} ${420 + i} ${419 + i} 28 0.3 0.1`).join("\n");
  const o = parseGml("# comment\n" + rows + "\n2025 12 2025.96 -99.99 -99.99 0 0 0\n", { unit: "ppm", label: "CO2" }); assert.equal(o.points.length, 14); assert.equal(o.latest.v, 433); assert.throws(() => parseGml("# only\n", { unit: "ppm", label: "x" }));
});
test("GISTEMP parser: annual J-D anomalies and '***' missing months", async () => {
  const { parseGistemp } = await P("climate"); const o = parseGistemp("Land-Ocean: Global Means\nYear,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,J-D,D-N\n2023,.87,.98,1.20,1.00,.94,1.07,1.20,1.19,1.48,1.34,1.42,1.37,1.17,1.15\n2024,1.27,1.40,1.30,***,***,***,***,***,***,***,***,***,***,***\n");
  assert.equal(o.annual.length, 1); assert.equal(o.annual[0].anomalyC, 1.17); assert.equal(o.latestMonth.v, 1.30);
});
test("NSIDC sea ice parser reads daily extent rows and ignores headers", async () => {
  const { parseSeaIce } = await P("climate"); const rows = Array.from({ length: 40 }, (_, i) => `2025, 1, ${i % 28 + 1}, ${14 + i / 100}, 0, Near-Real-Time`).join("\n"); const o = parseSeaIce("Year, Month, Day, Extent, Missing, Source Data\n YYYY, MM, DD, 10^6 sq km, 10^6 sq km, Source data product web site\n" + rows, "north");
  assert.equal(o.points.length, 40); assert.equal(o.meta.units, "million km²");
});
test("Open-Meteo marine and air parsers", async () => {
  const { parseMarine, parseAir } = await P("openmeteo"); const m = parseMarine([{ latitude: 45, longitude: -30, current: { time: "2026-11-26T10:00", wave_height: 2.1, wave_period: 9, sea_surface_temperature: 14.2 } }], [{ name: "North Atlantic" }]);
  assert.equal(m[0].seaTempC, 14.2); assert.match(m[0].meta.note, /Model output/); const a = parseAir([{ latitude: 28, longitude: 77, current: { time: "2026-11-26T10:00", us_aqi: 180, pm2_5: 90, ozone: 40 } }], [{ name: "Delhi", iso2: "IN" }]); assert.equal(a[0].usAqi, 180); assert.match(a[0].meta.note, /NOT stratospheric/);
});
test("extras: ISS, APOD, exoplanets, X-ray class, GBIF, HN, EDGAR", async () => {
  const x = await P("extras");
  assert.equal(x.parseIss({ latitude: 10, longitude: 20, altitude: 420, velocity: 27600, timestamp: 1790000000, visibility: "daylight" }).lat, 10); assert.throws(() => x.parseIss({}));
  assert.equal(x.parseApod({ title: "T", date: "2026-11-26", media_type: "image", url: "https://x/a.jpg", explanation: "e" }).url, "https://x/a.jpg"); assert.equal(x.parseApod({ title: "T", date: "d", media_type: "video", url: "https://y" }).url, null);
  assert.equal(x.parseExoplanets([{ pl_name: "K2-18 b", hostname: "K2-18", disc_year: 2015, discoverymethod: "Transit", pl_rade: 2.6 }, {}]).length, 1);
  const xr = x.parseXray([{ time_tag: "2026-11-26T10:00:00Z", flux: 2.3e-5, energy: "0.1-0.8nm" }, { time_tag: "2026-11-26T10:00:00Z", flux: 9e-9, energy: "0.05-0.4nm" }]); assert.equal(xr.latest.flareClass, "M2.3"); assert.equal(xr.points.length, 1);
  const g = x.parseGbifOcc({ count: 1000, results: [{ key: 1, decimalLatitude: 10, decimalLongitude: 20, eventDate: "2024-05-01", basisOfRecord: "HUMAN_OBSERVATION" }, { key: 2 }] }, { canonical: "Orcinus orca" }); assert.equal(g.records.length, 1); assert.match(g.meta.note, /NOT real-time/);
  assert.equal(x.parseHn({ hits: [{ objectID: "1", title: "A", points: 5 }, { objectID: "2" }] }).length, 1);
  const e = x.parseEdgar({ cik: 1067983, name: "BERKSHIRE HATHAWAY INC", filings: { recent: { form: ["8-K", "10-Q"], filingDate: ["2026-11-01", "2026-10-01"], accessionNumber: ["0001-26-1", "0001-26-2"], primaryDocument: ["a.htm", "b.htm"] } } }); assert.equal(e.filings[0].form, "8-K"); assert.match(e.filings[0].url, /1067983/); assert.match(e.meta.note, /AUM/);
});
test("simulations are deterministic, bounded, and labelled hypothetical", async () => {
  const { simulate } = await import("../server/intelligence/simulate.js"); const a = simulate("oil_shock", { oilChangePct: 30 }), b = simulate("oil_shock", { oilChangePct: 30 });
  assert.equal(a.outputs.totalCpiPp, b.outputs.totalCpiPp); assert.ok(Math.abs(a.outputs.directCpiPp - 4 * 0.3 * 0.6) < 1e-9); assert.equal(a.kind, "SIMULATION"); assert.equal(a.hypothetical, true);
  assert.ok(simulate("supply_disruption", { shortfallPct: 10, bufferMonths: 99 }).outputs.priceChangePct === 0); assert.ok(simulate("population", { startGrowthPct: 1, endGrowthPct: -1, yearsToEnd: 10, horizonYears: 30 }).outputs.peakYearOffset <= 10);
  assert.throws(() => simulate("nope")); assert.throws(() => simulate("oil_shock", { oilChangePct: "abc" }));
});
test("API: new endpoints respond honestly offline", async () => {
  const U = (p) => new URL("http://x" + p); for (const p of ["/api/climate", "/api/oceans", "/api/airquality", "/api/iss", "/api/astronomy", "/api/technews"]) { const r = await route("GET", U(p)); assert.ok(r, p); }
  assert.equal((await route("GET", U("/api/oceans"))).available, false); assert.equal((await route("GET", U("/api/indicator-table?keys=railKm,roadKm"))).available, false); await assert.rejects(() => route("GET", U("/api/indicator-table?keys=bogus")));
  assert.ok((await route("GET", U("/api/megaprojects"))).projects.length > 10); const s = await route("POST", U("/api/simulate"), { model: "fx_depreciation", params: { depreciationPct: 20 } }); assert.equal(s.hypothetical, true); await assert.rejects(() => route("POST", U("/api/simulate"), { model: "bogus" }));
  assert.equal((await route("GET", U("/api/filers/berkshire"))).available, false); await assert.rejects(() => route("GET", U("/api/filers/bogus")));
});

// ---- persistence + scheduler
const dbm = await import("../server/core/db.js"); const sched = await import("../server/core/scheduler.js");
test("db stores only real observations and dedupes by (id,t)", () => {
  const n = dbm.addPoints([{ id: "price:btc", t: 1000, v: 50000, status: "LIVE", provider: "CoinGecko" }, { id: "price:btc", t: 1000, v: 51000, status: "LIVE", provider: "CoinGecko" }, { id: "price:x", t: 1000, v: 1, status: "DEMO", provider: "demo" }, { id: "price:y", t: 1000, v: NaN, status: "LIVE", provider: "p" }]);
  assert.equal(n, 1); const rows = dbm.querySeries("price:btc"); assert.equal(rows.length, 1); assert.equal(rows[0].v, 50000); assert.equal(dbm.querySeries("price:x").length, 0);
  const e = dbm.addEvents([{ id: "e1", time: "2026-11-26T00:00:00Z", title: "Real", kind: "reported", meta: { status: "RECENT", provider: "BBC" } }, { id: "e2", time: "2026-11-26T00:00:00Z", title: "[SAMPLE]", kind: "sample", meta: { status: "DEMO" } }, { id: "e3", time: "2026-11-26T00:00:00Z", title: "demo", kind: "reported", meta: { status: "DEMO" } }]);
  assert.equal(e, 1); assert.equal(dbm.queryEvents({}).length, 1); assert.equal(dbm.stats().events, 1);
});
test("scheduler: offline never starts; running a job offline records nothing fake", async () => {
  assert.equal(sched.start(), false); const before = dbm.stats().seriesPoints; const s = await sched.runJob(sched.JOBS.find((j) => j.id === "markets")); assert.equal(dbm.stats().seriesPoints, before); assert.equal(s.lastRows, 0);
  const f = await sched.runJob(sched.JOBS.find((j) => j.id === "spaceweather")); assert.ok(f.lastError); assert.ok(sched.status().recent.some((r) => r.job === "spaceweather" && r.ok === 0));
});
test("API: stored endpoints and job status", async () => {
  const U = (p) => new URL("http://x" + p); const st = await route("GET", U("/api/stored/stats")); assert.ok(st.series.some((s) => s.id === "price:btc")); const se = await route("GET", U("/api/stored/series?id=price:btc")); assert.equal(se.count, 1); assert.equal((await route("GET", U("/api/stored/series?id=none"))).meta.status, "UNAVAILABLE");
  assert.equal((await route("GET", U("/api/jobs"))).enabled, false);
});
