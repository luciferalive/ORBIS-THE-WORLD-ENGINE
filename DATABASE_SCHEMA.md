# Database schema
No database yet. Current state: in-memory cache with stale-on-error, disk cache in data/cache/, data/custom-providers.json for registered providers, browser localStorage for watchlists, alert rules and notifications. A SQLite (node:sqlite) schema for time series, events and provider logs is the next planned step (see ROADMAP.md).
