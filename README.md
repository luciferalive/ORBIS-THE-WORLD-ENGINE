# ORBIS: World Intelligence Engine

One dashboard for what is happening on Earth and beyond: markets, news, economies, population, natural hazards, space, science, cybersecurity, aviation, history and forecasts. It shows real provider data when it can reach it, and says so plainly when it cannot.

## Quick start
Requires Node 22 or newer. There is nothing to install.

```bash
git clone https://github.com/luciferalive/ORBIS-THE-WORLD-ENGINE.git
cd ORBIS-THE-WORLD-ENGINE
cp .env.example .env        # optional: add API keys
node server/index.js        # open http://localhost:8090
```

Useful commands: `npm test` (43 tests), `ORBIS_OFFLINE=1 node server/index.js` (demo mode, no network), `node scripts/gen-sources-doc.mjs` (regenerate docs/DATA_SOURCES.md).

## What is in it
42 modules in 10 groups: Overview, Globe; Humanity, Civilization, Crime; Economy, Markets, Financial Power, Resources, Agriculture; World Live, Geopolitics, Security, World Risk; Planet, Atmosphere, Oceans, Marine life, Polar; Space, Astronomy; Aviation, Maritime, Railways, Roads, Logistics; Science, Technology, Discovery, Cybersecurity, Megaprojects; Rise & Fall, Connections, History, Forecast, Simulations, Universe Clock, AI Analyst, Reports; Watchlists, API Center, Settings. Press `Ctrl+K` or `/` to search anything.

Features: interactive globe (drag, zoom, country selection, day/night, clickable layers for hazards, launch pads, aircraft and the live ISS), live-or-labelled markets, event feed, anomaly detection, alert rules with in-app notifications, CSV and print-to-PDF reports, a source registry with ~50 providers, and per-module "Data sources" panels. A background collector records real observations (prices, Kp, CO2, events) to a local SQLite file; demo or sample values are never stored. See `DATABASE_SCHEMA.md`.

## How honesty works
Every value carries a status badge, and clicking it shows provider, source, frequency and timestamp.

| Status | Meaning |
|---|---|
| LIVE / RECENT | Provider data, live or recently updated |
| PERIODIC | Published on a schedule (daily to annual) |
| ESTIMATE / PROJECTION | Computed by ORBIS from a stated model, not an observation |
| DEMO | Sample values, never real |
| UNAVAILABLE | Source failed or is not configured |

Births and deaths counters are a **model** (annual rates extrapolated), not a live count. World Risk shows methodology only until real inputs are connected. See `docs/DATA_HONESTY.md` and `DEVELOPMENT_STATUS.md` for exactly what works.

## Configuration
Keys live in `.env` on the server and never reach the browser. See `.env.example`. Without a key, the related feature shows CONFIGURATION REQUIRED.

## Layout
```
server/    providers/ (adapters), core/ (catalogue, provider admin), intelligence/ (signals, anomalies, alerts, forecast),
           services.js (live vs demo decisions), api.js (REST + static files)
web/       index.html, css/, js/ (modules, components, globe, services)
tests/     server tests (fixtures for every parser)
docs/      architecture, data sources, API, security, deployment
```

## Status
Early but working. Live connectivity of each provider is unverified until you run it on a networked machine. See `DEVELOPMENT_STATUS.md` and `ROADMAP.md`.
