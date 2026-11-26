# Database schema

ORBIS records real observations in a local SQLite file using the built-in `node:sqlite` module (Node 22+, still marked experimental by Node). Default path `data/orbis.db`, override with `ORBIS_DB`. The file is git-ignored.

**Rule:** only observations whose status is LIVE, RECENT or PERIODIC are stored. DEMO and `[SAMPLE]` values, and non-finite numbers, are rejected by `server/core/db.js`.

```sql
series(id TEXT, t INTEGER, v REAL, status TEXT, provider TEXT, PRIMARY KEY (id, t))
events(id TEXT PRIMARY KEY, time TEXT, category TEXT, severity INTEGER, title TEXT, source TEXT, url TEXT,
       kind TEXT, lat REAL, lon REAL, status TEXT, provider TEXT, first_seen INTEGER)
job_runs(id INTEGER PRIMARY KEY, job TEXT, at INTEGER, ok INTEGER, ms INTEGER, rows INTEGER, error TEXT)
```

Recorded series ids: `price:<asset>` (markets), `kp` (space weather), `co2_ppm`, `temp_anomaly_c`, `aircraft_airborne_seen` (a partial OpenSky snapshot count, not total air traffic).

Retention: `prune(days=400)` deletes older rows. Gaps in a series mean the server was off or a provider failed; nothing is interpolated.

Still outside the database: provider cache (`data/cache/`), registered providers (`data/custom-providers.json`), and watchlists, alert rules and notifications (browser localStorage).
