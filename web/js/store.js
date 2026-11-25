// Tiny shared state with subscriptions + localStorage persistence (wrapped: storage can be blocked).
const subs = new Set();
const safeGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export const store = {
  selectedCountry: null,
  layers: new Set(safeGet("orbis.layers", ["population", "events"])),
  watchlist: new Set(safeGet("orbis.watch", ["btc", "xau", "spx"])),
  countryWatch: new Set(safeGet("orbis.cwatch", [])),
  rules: safeGet("orbis.rules", []),
  notes: safeGet("orbis.notes", []),
  seen: new Set(safeGet("orbis.seen", [])),
  sidebarCollapsed: safeGet("orbis.collapsed", false),
  markets: null, lastMarketsAt: null,
};
export const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export const notify = () => subs.forEach((f) => f());
export const toggleLayer = (id) => { store.layers.has(id) ? store.layers.delete(id) : store.layers.add(id); safeSet("orbis.layers", [...store.layers]); notify(); };
export const toggleWatch = (id) => { store.watchlist.has(id) ? store.watchlist.delete(id) : store.watchlist.add(id); safeSet("orbis.watch", [...store.watchlist]); notify(); };
export const setCollapsed = (v) => { store.sidebarCollapsed = v; safeSet("orbis.collapsed", v); };
export const toggleCountryWatch = (iso) => { store.countryWatch.has(iso) ? store.countryWatch.delete(iso) : store.countryWatch.add(iso); safeSet("orbis.cwatch", [...store.countryWatch]); notify(); };
export const saveRules = () => { safeSet("orbis.rules", store.rules); notify(); };
export const addNotes = (list) => { store.notes = [...list, ...store.notes].slice(0, 200); list.forEach((n) => store.seen.add(n.key)); safeSet("orbis.notes", store.notes); safeSet("orbis.seen", [...store.seen].slice(-1000)); notify(); };
export const markRead = () => { store.notes = store.notes.map((n) => ({ ...n, read: true })); safeSet("orbis.notes", store.notes); notify(); };
export const clearNotes = () => { store.notes = []; safeSet("orbis.notes", []); notify(); };
