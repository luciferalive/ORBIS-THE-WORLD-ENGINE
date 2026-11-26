# Development status

**Current generation:** V1 foundation complete in a dependency-free stack; V2 (live feeds, alerts, provider registry) partly done; V3 started (anomaly detection, signals).
Last verified: 36 server tests passing; headless browser opens all 25 modules with no console errors (offline mode, desktop and 390 px width).

## Working modules (42; all open without console errors, 43 tests pass)
Real-data modules (when the provider is reachable): Markets, World Live, Geopolitics, Security, Planet (USGS, NASA EONET, Open-Meteo), Atmosphere (NOAA CO2/CH4, NASA temperature, air quality), Oceans (model points), Polar (NSIDC sea ice), Marine life (GBIF records), Space (launches, ISS, Kp, satellites catalogue), Astronomy (APOD, exoplanets, GOES X-ray, asteroids), Aviation (OpenSky), Science, Discovery, Technology, Cybersecurity, Financial Power (SEC filings), plus World Bank indicator modules: Humanity, Economy, Resources, Agriculture, Crime, Railways, Roads, Logistics, Maritime, Civilization.
Computed or reference modules: Overview, Globe, Rise & Fall, Connections (curated graph), History (35 curated entries), Forecast, Simulations (4 transparent models), Universe Clock, Megaprojects (hand-curated, as of 2025-06), World Risk (methodology only), AI Analyst (needs key), Reports, Watchlists, API Center, Settings.

## Connected APIs (code + fixture tests; live behaviour unverified from build sandbox)
CoinGecko, Frankfurter, Twelve Data (key), USGS, NASA EONET, Open-Meteo (weather, marine, air quality), GDELT, RSS (BBC, Al Jazeera, UN News, NASA), World Bank (~60 indicators), FRED (key), NOAA SWPC and GOES, NOAA GML, NASA GISTEMP, NSIDC, Launch Library 2, NASA NeoWs and APOD, NASA Exoplanet Archive, CelesTrak, wheretheiss.at, OpenAlex, arXiv, CISA KEV, OpenSky, GBIF, Hacker News, SEC EDGAR, Natural Earth, Anthropic (key).

## Pending credentials
TWELVEDATA_KEY, FRED_API_KEY, NASA_API_KEY (optional), ANTHROPIC_API_KEY, ORBIS_ADMIN_TOKEN.

## Not built yet (be aware)
- Database: none. State is in-memory/disk cache plus browser localStorage. No users, roles or authentication, so "profile" is local only.
- Data Core persistence, historical storage and backfill, scheduled workers (polling happens on request and every minute in the browser for alerts).
- API Center: no response field mapping, scheduling or enable/disable pipeline for custom providers (registration and testing only).
- Universal entity system and verified-vs-inferred graph relations (graph is a hand-curated reference set).
- Not integrated: stratospheric ozone, ocean currents/tides/acidity/coral, ship (AIS) and train positions, live road traffic, conflict event data (ACLED/UCDP), crime data beyond national homicide rates, SEC holdings tables, sovereign funds, comets/black holes/gravitational waves.
- Globe layers for hazards, aircraft, launches, satellites; conflict, shipping, energy.
- World Risk scores; economic calendar; bonds/ETFs; stock-level market cap and volume.
- Multi-agent AI, investigations, public API, plugins, automation.

## Known limitations
- Reference country/city data is approximate (DEMO) until World Bank data loads.
- Continent outlines are decorative when Natural Earth is unavailable.
- Event severity and category are keyword rules.
- No live provider has been exercised from the build environment.

## Next tasks
1. World Risk with real indicators. 2. Provider field mapping in API Center. 3. Globe layers still planned: conflict, shipping, energy, weather; satellites are not positioned (elements only). 4. Verify live provider behaviour on a networked machine (the build sandbox had no outbound access). Done in 0.5.0: SQLite recorder + scheduler, hazard/launch/aircraft/ISS globe layers.
