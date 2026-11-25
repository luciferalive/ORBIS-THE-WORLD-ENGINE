import { config } from "./config.js";
import * as registry from "./registry.js";
/** fetch JSON/text with timeout and one retry. Respects ORBIS_OFFLINE. */
export async function fetchRaw(url, { id, headers = {}, timeout = config.fetchTimeoutMs, retries = 1, method = "GET", body } = {}) {
  if (config.offline) { const e = new Error("offline mode"); if (id) registry.fail(id, e); throw e; }
  let last;
  for (let i = 0; i <= retries; i++) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeout);
    try {
      const r = await fetch(url, { method, body, signal: ctl.signal, headers: { "User-Agent": "ORBIS/0.1 (world intelligence; contact: local)", Accept: "application/json, text/xml, */*", ...headers } });
      if (!r.ok) throw new Error(`HTTP ${r.status} from ${new URL(url).host}`);
      const text = await r.text(); clearTimeout(t); return text;
    } catch (e) { clearTimeout(t); last = e.name === "AbortError" ? new Error("timeout after " + timeout + "ms") : e; }
  }
  if (id) registry.fail(id, last); throw last;
}
export async function fetchJson(url, opts) { const txt = await fetchRaw(url, opts); try { return JSON.parse(txt); } catch { const e = new Error("invalid JSON from provider"); if (opts?.id) registry.fail(opts.id, e); throw e; } }
