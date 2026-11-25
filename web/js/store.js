// Tiny shared state with subscriptions + localStorage persistence (wrapped: storage can be blocked).
const subs = new Set();
const safeGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export const store = {
  selectedCountry: null,
  layers: new Set(safeGet("orbis.layers", ["population", "events"])),
  watchlist: new Set(safeGet("orbis.watch", ["btc", "xau", "spx"])),
  sidebarCollapsed: safeGet("orbis.collapsed", false),
  markets: null, lastMarketsAt: null,
};
export const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export const notify = () => subs.forEach((f) => f());
export const toggleLayer = (id) => { store.layers.has(id) ? store.layers.delete(id) : store.layers.add(id); safeSet("orbis.layers", [...store.layers]); notify(); };
export const toggleWatch = (id) => { store.watchlist.has(id) ? store.watchlist.delete(id) : store.watchlist.add(id); safeSet("orbis.watch", [...store.watchlist]); notify(); };
export const setCollapsed = (v) => { store.sidebarCollapsed = v; safeSet("orbis.collapsed", v); };
