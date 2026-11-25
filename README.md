# ORBIS: World Intelligence Engine

A dependency-free (Node 22+, no npm install) world dashboard: 15 modules, interactive 3D globe, markets, events, population model, knowledge graph, scenario projections.

## Run
```bash
cp .env.example .env      # optional keys
node server/index.js      # http://localhost:8090
npm test                  # 19 server tests
ORBIS_OFFLINE=1 node server/index.js   # deterministic demo mode, no network
```

## Data honesty (read this)
Every value carries a status badge: LIVE, RECENT, PERIODIC, ESTIMATE, PROJECTION, DEMO, UNAVAILABLE. Click a badge for provider, frequency, timestamp and licence.
- With network access, ORBIS fetches real provider data (CoinGecko, Frankfurter/ECB, USGS, GDELT, BBC/Al Jazeera RSS, World Bank, Natural Earth; Twelve Data with `TWELVEDATA_KEY`; AI analyst with `ANTHROPIC_API_KEY`).
- Without it, nothing is faked as real: markets are labelled DEMO, events are `[SAMPLE]`, quakes/boundaries are UNAVAILABLE.
- Population/birth/death counters are a **model (ESTIMATE)**, not a live count: no one measures these in real time.
- World Risk shows methodology only; no invented scores.
- **Live connectivity was not testable in the build sandbox.** Provider code is covered by fixture tests against documented formats; verify each provider on your machine (see Data sources panel in the status bar).

See `docs/DATA_SOURCES.md` for sources and licensing, `docs/ARCHITECTURE.md` for structure.
