# REST API
All responses are JSON. Data endpoints include `meta` (provider, source, status, frequency, units, attribution, licence, timestamps) or per-record `meta`. Failures return `{available:false,error}` rather than fabricated data.

GET: `/api/status`, `/api/providers`, `/api/markets`, `/api/markets/:id/history?range=`, `/api/signals`, `/api/anomalies`, `/api/events?category&country&severity&q&sort`, `/api/events/:id`, `/api/quakes`, `/api/hazards`, `/api/weather`, `/api/countries`, `/api/cities`, `/api/indicators`, `/api/indicators/:iso2/:key`, `/api/macro`, `/api/macro/:seriesId`, `/api/humanity`, `/api/resources`, `/api/history`, `/api/forecast/population`, `/api/forecast/asset?id&steps`, `/api/graph?focus&depth&limit&rel`, `/api/search?q`, `/api/geo/countries`, `/api/launches`, `/api/neo`, `/api/spaceweather`, `/api/satellites?group`, `/api/publications?q`, `/api/preprints?cat`, `/api/vulnerabilities`, `/api/aircraft`, `/api/iss`, `/api/jobs` (collector status), `/api/stored/stats`, `/api/stored/series?id&from&to`, `/api/stored/events?from&category&limit` (recorded data; real observations only), `/api/analyst/status`, `/api/analyst/context`.

POST: `/api/alerts/evaluate` `{rules:[...]}`, `/api/analyst/ask` `{question}`.

Admin (header `x-admin-token`): `POST /api/admin/providers`, `POST /api/admin/providers/:id/test`, `DELETE /api/admin/providers/:id`.
