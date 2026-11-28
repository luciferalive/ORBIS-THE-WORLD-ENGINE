# Changelog
## 0.6.0
- Terminal/hacker UI theme (hacker.css), boot sequence, glowing green globe; README rewritten with screenshots (captured in offline demo mode).
## 0.5.0
- SQLite recorder (`node:sqlite`) and scheduler: markets, events, hazards, space weather, climate, aircraft counts. Real statuses only; DEMO/SAMPLE never stored. Off in offline mode or with ORBIS_SCHEDULER=0.
- API: /api/jobs, /api/stored/stats, /api/stored/series, /api/stored/events.
- Globe layers: NASA EONET hazards, launch pads, OpenSky aircraft (partial snapshot), live ISS; clickable markers open a detail panel.
- History "Recorded data" panel; API Center "Collector jobs" panel.
## 0.4.0
- 17 new modules (Atmosphere, Oceans, Marine life, Polar, Astronomy, Technology, Financial Power, Megaprojects, Discovery, Security, Simulations, Universe Clock, Agriculture, Crime, Railways, Roads, Logistics, Maritime), grouped sidebar, 42 modules total.
- Adapters: NOAA GML, GISTEMP, NSIDC, Open-Meteo marine and air quality, ISS, APOD, Exoplanet Archive, GOES X-ray, GBIF, Hacker News, SEC EDGAR; ~40 more World Bank indicators; UN News and NASA RSS.
- Simulation engine (oil shock, supply disruption, FX depreciation, population).
## 0.3.0
- Provider catalogue (~50), API Management Center (registry, health, test connection, custom registration with SSRF guard).
- Adapters: NOAA SWPC, Launch Library 2, NASA NeoWs, CelesTrak, OpenAlex, arXiv, CISA KEV, OpenSky.
- Modules: Space, Science, Cybersecurity, Aviation, API Center; per-module Data Sources panels; Planet adds NASA EONET and Open-Meteo.
## 0.2.0
- Adapters: NASA EONET, Open-Meteo, FRED, World Bank country series. Anomaly detector and alert engine. Geopolitics, Reports, Watchlists, Settings, notifications bell. 19-module shell.
## 0.1.0
- First milestone: server, 15 modules, globe, markets, events, humanity model, signals, graph, forecasts, analyst, tests.
