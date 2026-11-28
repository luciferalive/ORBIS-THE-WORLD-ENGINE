import { fileURLToPath } from "node:url";
// Provider management: merges the static catalogue, runtime health, and admin-registered custom providers.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { lookup } from "node:dns/promises";
import net from "node:net";
import { CATALOGUE, byId } from "./catalogue.js";
import * as registry from "../registry.js";
import { config } from "../config.js";
const FILE = fileURLToPath(new URL("../../data/custom-providers.json", import.meta.url));
const readCustom = () => { try { return JSON.parse(readFileSync(FILE, "utf8")); } catch { return []; } };
const writeCustom = (l) => { mkdirSync(fileURLToPath(new URL("../../data/", import.meta.url)), { recursive: true }); writeFileSync(FILE, JSON.stringify(l, null, 2)); };

export function isPrivateIp(ip) {
  if (net.isIPv4(ip)) { const [a, b] = ip.split(".").map(Number); return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224; }
  if (net.isIPv6(ip)) { const l = ip.toLowerCase(); return l === "::1" || l === "::" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80") || l.startsWith("::ffff:"); }
  return true;
}
/** SSRF guard for admin-supplied URLs: https only, no credentials in URL, public IPs only. */
export async function assertSafeUrl(raw) {
  let u; try { u = new URL(raw); } catch { throw new Error("invalid URL"); }
  if (u.protocol !== "https:") throw new Error("only https URLs are allowed");
  if (u.username || u.password) throw new Error("credentials in URL are not allowed");
  if (u.port && u.port !== "443") throw new Error("only port 443 is allowed");
  if (net.isIP(u.hostname)) { if (isPrivateIp(u.hostname)) throw new Error("private address blocked"); return u; }
  const addrs = await lookup(u.hostname, { all: true }); if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("host resolves to a private address");
  return u;
}
export function status(p) {
  const rt = registry.get(p.id);
  if (p.integration === "catalogued") return "NOT INTEGRATED";
  if (p.keyEnv && !process.env[p.keyEnv] && p.id !== "nasa") return "CONFIGURATION REQUIRED";
  if (config.offline) return "OFFLINE MODE";
  if (!rt || rt.status === "IDLE") return "IDLE";
  if (rt.status === "OK") return rt.failures > 0 && rt.lastError ? "DEGRADED" : "OPERATIONAL";
  if (rt.status === "NOT_CONFIGURED") return "CONFIGURATION REQUIRED";
  return /429|rate/i.test(rt.lastError?.message || "") ? "RATE LIMITED" : /401|403/.test(rt.lastError?.message || "") ? "AUTHENTICATION FAILED" : "DISCONNECTED";
}
export function listProviders() {
  return [...CATALOGUE, ...readCustom().map((c) => ({ ...c, integration: "custom" }))].map((p) => {
    const rt = registry.get(p.id) || {};
    return { id: p.id, name: p.name, org: p.org, category: p.category, integration: p.integration, auth: p.auth, credentialConfigured: p.keyEnv ? !!process.env[p.keyEnv] : null, keyEnv: p.keyEnv || null, docs: p.docs, modules: p.modules, coverage: p.coverage, history: p.history, rate: p.rate, license: p.license, testable: !!p.test || p.integration === "custom",
      status: status(p), lastOk: rt.lastOk || null, lastError: rt.lastError || null, avgMs: rt.avgMs || null, requests: rt.calls || 0, failures: rt.failures || 0, reliability: rt.calls ? Math.round(100 * (1 - rt.failures / rt.calls)) : null, dataStatus: rt.dataStatus || null, frequency: rt.frequency || null };
  });
}
export const requireAdmin = (token) => { if (!config.adminToken) { const e = new Error("CONFIGURATION REQUIRED: set ORBIS_ADMIN_TOKEN in .env to enable provider administration"); e.status = 503; throw e; } if (token !== config.adminToken) { const e = new Error("invalid admin token"); e.status = 401; throw e; } };
/** Server-side connection test. Only catalogue test URLs or admin-registered https URLs; GET only; no redirects; capped body. */
export async function testProvider(id) {
  const p = byId(id) || readCustom().find((c) => c.id === id); if (!p) { const e = new Error("unknown provider"); e.status = 404; throw e; }
  const url = p.test || p.url; if (!url) { const e = new Error("provider has no test endpoint"); e.status = 400; throw e; }
  if (config.offline) return { ok: false, error: "offline mode: no outbound requests", status: "OFFLINE MODE" };
  await assertSafeUrl(url);
  const headers = { "User-Agent": "ORBIS/0.2 provider-test", Accept: "application/json, text/xml, */*" }; if (p.authHeader && p.authEnv && process.env[p.authEnv]) headers[p.authHeader] = process.env[p.authEnv];
  const t0 = Date.now(), ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url, { headers, redirect: "manual", signal: ctl.signal }); const text = (await r.text()).slice(0, 200_000); const ms = Date.now() - t0;
    let shape = "text"; try { const j = JSON.parse(text); shape = Array.isArray(j) ? `JSON array (${j.length})` : "JSON object keys: " + Object.keys(j).slice(0, 12).join(", "); } catch { if (/<rss|<feed/.test(text)) shape = "RSS/Atom XML"; else if (/<\?xml/.test(text)) shape = "XML"; }
    return { ok: r.ok, httpStatus: r.status, ms, contentType: r.headers.get("content-type"), shape, sample: text.slice(0, 1500), note: "Sample is untrusted provider data, shown as plain text only." };
  } catch (e) { return { ok: false, error: e.name === "AbortError" ? "timeout" : e.message }; } finally { clearTimeout(timer); }
}
export async function registerCustom(body) {
  const name = String(body.name || "").trim().slice(0, 80), url = String(body.url || "").trim();
  if (!name) throw new Error("name required"); await assertSafeUrl(url);
  const format = ["json", "rss", "atom", "csv", "xml", "geojson"].includes(body.format) ? body.format : "json";
  const authEnv = body.authEnv ? String(body.authEnv).trim() : ""; if (authEnv && !/^[A-Z][A-Z0-9_]{2,60}$/.test(authEnv)) throw new Error("authEnv must be an environment variable NAME (secrets are never stored in the UI)");
  const id = "custom-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40); const list = readCustom(); if (list.some((x) => x.id === id) || byId(id)) throw new Error("provider already exists");
  const rec = { id, name, org: String(body.org || "").slice(0, 80), category: String(body.category || "custom").slice(0, 40), url, test: url, format, auth: authEnv ? "header from env " + authEnv : "none", authHeader: body.authHeader ? String(body.authHeader).slice(0, 40) : "", authEnv, docs: String(body.docs || "").slice(0, 300), modules: [], coverage: "", history: "", rate: "", license: String(body.license || "verify before use").slice(0, 120), createdAt: new Date().toISOString(), enabled: false };
  list.push(rec); writeCustom(list); return rec;
}
export function removeCustom(id) { const list = readCustom(); const n = list.filter((x) => x.id !== id); if (n.length === list.length) { const e = new Error("custom provider not found"); e.status = 404; throw e; } writeCustom(n); return { removed: id }; }
