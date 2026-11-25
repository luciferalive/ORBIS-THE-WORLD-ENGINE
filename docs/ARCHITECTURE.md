# Architecture
providers (`server/providers/*`, normalise to standard models) → `server/services.js` (the only place that decides live vs demo) → `server/api.js` (REST, static web, CSP) → `web/js/services/api.js` → modules (`web/js/modules/*`).
- Every response has `meta` {provider, source, status, frequency, dataType, units, attribution, note, license, updatedAt, fetchedAt}.
- Cache with stale-on-error (`server/cache.js`, disk cache in `data/cache/`), source health registry (`server/registry.js`), `ORBIS_OFFLINE=1` switch.
- Frontend: vanilla ES modules, hash router, own SVG charts, canvas orthographic globe (`web/js/globe`).
- Deviation from the original spec's stack (React/FastAPI): none of npm/pip/CDN were reachable when building, so everything is dependency-free to be runnable and testable. No database yet (memory + disk cache); a schema is only needed once history is persisted.
