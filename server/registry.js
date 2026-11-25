// Tracks health of every data source: what the bottom status bar and Data Sources panel show.
const sources = new Map();
export function declare(id, info) { sources.set(id, { id, status: "IDLE", lastOk: null, lastError: null, calls: 0, failures: 0, ...info }); }
export function ok(id, dataStatus) { const s = sources.get(id); if (!s) return; s.status = "OK"; s.lastOk = new Date().toISOString(); s.calls++; s.dataStatus = dataStatus; s.lastError = null; }
export function fail(id, err) { const s = sources.get(id); if (!s) return; s.status = "ERROR"; s.calls++; s.failures++; s.lastError = { at: new Date().toISOString(), message: String(err?.message || err).slice(0, 200) }; }
export function skip(id, why) { const s = sources.get(id); if (!s) return; s.status = "NOT_CONFIGURED"; s.lastError = { at: new Date().toISOString(), message: why }; }
export const list = () => [...sources.values()];
