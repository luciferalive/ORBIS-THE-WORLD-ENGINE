// TTL cache with stale-on-error. A stale value is returned (and flagged) rather than breaking the UI.
const store = new Map();
export async function cached(key, ttlMs, fn) {
  const hit = store.get(key), now = Date.now();
  if (hit && now - hit.at < ttlMs) return { value: hit.value, stale: false, at: hit.at };
  if (hit && hit.pending) return hit.pending;
  const pending = (async () => {
    try { const value = await fn(); store.set(key, { value, at: Date.now() }); return { value, stale: false, at: Date.now() }; }
    catch (e) { if (hit) { store.set(key, { ...hit, pending: null }); return { value: hit.value, stale: true, at: hit.at, error: e.message }; } store.delete(key); throw e; }
  })();
  if (hit) hit.pending = pending; else store.set(key, { value: undefined, at: 0, pending });
  try { return await pending; } finally { const h = store.get(key); if (h) h.pending = null; }
}
export const clearCache = () => store.clear();
