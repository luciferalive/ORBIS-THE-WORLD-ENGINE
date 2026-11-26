# Development status

**Current generation:** V1 foundation complete in a dependency-free stack; V2 (live feeds, alerts, provider registry) partly done; V3 started (anomaly detection, signals).
Last verified: 36 server tests passing; headless browser opens all 25 modules with no console errors (offline mode, desktop and 390 px width).

## Working modules
Overview, Globe, Humanity (model counters), Economy (country comparison), Markets, World Live, Geopolitics (events view), Planet, Resources, Civilization, Rise & Fall, World Risk (methodology only), Connections (reference graph), History (35 curated entries), Forecast (population scenarios, asset cones), AI Analyst (needs key), Reports (CSV/print), Watchlists, Space, Science, Cybersecurity, Aviation, API Center, Settings (alert rules).

## Connected APIs (code + fixture tests; live behaviour unverified from build sandbox)
CoinGecko, Frankfurter, Twelve Data (key), USGS, NASA EONET, Open-Meteo, GDELT, BBC/Al Jazeera RSS, World Bank, FRED (key), NOAA SWPC, Launch Library 2, NASA NeoWs, CelesTrak, OpenAlex, arXiv, CISA KEV, OpenSky, Natural Earth, Anthropic (key).

## Pending credentials
TWELVEDATA_KEY, FRED_API_KEY, NASA_API_KEY (optional), ANTHROPIC_API_KEY, ORBIS_ADMIN_TOKEN.

## Not built yet (be aware)
- Database: none. State is in-memory/disk cache plus browser localStorage. No users, roles or authentication, so "profile" is local only.
- Data Core persistence, historical storage and backfill, scheduled workers (polling happens on request and every minute in the browser for alerts).
- API Center: no response field mapping, scheduling or enable/disable pipeline for custom providers (registration and testing only).
- Universal entity system and verified-vs-inferred graph relations (graph is a hand-curated reference set).
- Modules in the 42-module spec with no implementation: Oceans, Marine Life, Maritime, Railways, Roads, Logistics, Atmosphere, Ozone, Polar, Agriculture, Technology, Megaprojects, Financial Power, Crime, Discovery, Simulations, Universe Clock, Security.
- Globe layers for hazards, aircraft, launches, satellites; conflict, shipping, energy.
- World Risk scores; economic calendar; bonds/ETFs; stock-level market cap and volume.
- Multi-agent AI, investigations, public API, plugins, automation.

## Known limitations
- Reference country/city data is approximate (DEMO) until World Bank data loads.
- Continent outlines are decorative when Natural Earth is unavailable.
- Event severity and category are keyword rules.
- No live provider has been exercised from the build environment.

## Next tasks
1. Add SQLite persistence for time series and events (node:sqlite) and a scheduler. 2. Globe layers for hazards/aircraft/launches. 3. Oceans/Atmosphere/Agriculture via NOAA, Open-Meteo, FAOSTAT. 4. World Risk with real indicators. 5. Provider field mapping in API Center.
