// DOM helpers, formatting, status badges, drawer, toasts. No frameworks.
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === "class") el.className = v; else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v); else if (k === "html") throw new Error("html attr not allowed");
    else if (k in el && !["list", "form"].includes(k)) { try { el[k] = v; } catch { el.setAttribute(k, v); } } else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}
export const svg = (tag, attrs, ...kids) => { const el = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const [k, v] of Object.entries(attrs || {})) if (v != null) el.setAttribute(k, v); for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(String(kid))); return el; };
export const fill = (el, ...kids) => { el.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false).map((k) => (k.nodeType ? k : document.createTextNode(String(k))))); return el; };
export const $ = (s, r = document) => r.querySelector(s);

export const fmt = {
  num: (n, d = 2) => (Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "n/a"),
  int: (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "n/a"),
  compact: (n) => { if (!Number.isFinite(n)) return "n/a"; const a = Math.abs(n); const u = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]].find(([v]) => a >= v); return u ? (n / u[0]).toFixed(a / u[0] >= 100 ? 0 : 2) + u[1] : n.toFixed(0); },
  usd: (n) => (Number.isFinite(n) ? "$" + fmt.compact(n) : "n/a"),
  price: (n) => (!Number.isFinite(n) ? "n/a" : n >= 1000 ? fmt.num(n, 2) : n >= 10 ? fmt.num(n, 2) : n >= 1 ? fmt.num(n, 3) : fmt.num(n, 4)),
  pct: (n, d = 2) => (Number.isFinite(n) ? (n > 0 ? "+" : "") + n.toFixed(d) + "%" : "n/a"),
  time: (iso) => { const d = new Date(iso); return isNaN(d) ? "n/a" : d.toISOString().slice(11, 19) + " UTC"; },
  datetime: (iso) => { const d = new Date(iso); return isNaN(d) ? "n/a" : d.toISOString().slice(0, 16).replace("T", " ") + " UTC"; },
  ago: (iso) => { const s = (Date.now() - new Date(iso)) / 1000; if (!Number.isFinite(s)) return "n/a"; if (s < 90) return Math.max(0, Math.round(s)) + "s ago"; if (s < 5400) return Math.round(s / 60) + "m ago"; if (s < 129600) return Math.round(s / 3600) + "h ago"; return Math.round(s / 86400) + "d ago"; },
};
export const sign = (n) => (n > 0 ? "pos" : n < 0 ? "neg" : "t2");
export const chg = (pct, d = 2) => h("span", { class: "mono " + sign(pct) }, (pct > 0 ? "▲ " : pct < 0 ? "▼ " : "") + fmt.pct(pct, d));

/** Status badge. Click shows the full source / timestamp / frequency panel. */
export function badge(m, label) {
  if (!m) return h("span", { class: "pill UNAVAILABLE" }, "UNAVAILABLE");
  const b = h("button", { class: "pill " + m.status, title: `${m.status} · ${m.provider} · ${m.frequency}`, "aria-label": "Data source: " + m.status, onclick: (e) => { e.stopPropagation(); e.preventDefault(); sourcePanel(m); } }, label || m.status);
  return b;
}
export function sourcePanel(m) {
  const row = (k, v) => v ? h("div", { class: "stat" }, h("span", null, k), h("span", { class: "mono", style: { textAlign: "right", maxWidth: "65%", wordBreak: "break-word" } }, v)) : null;
  const explain = { LIVE: "Provider data refreshed at a live or near-live frequency.", RECENT: "Recently updated, but not a live tick (e.g. a daily fixing or last close).", PERIODIC: "Published on a fixed schedule (daily/monthly/quarterly/annual). Not live.", ESTIMATE: "Calculated by ORBIS from stated model parameters. Not an observation.", PROJECTION: "A forward-looking model. Not a fact and not a prediction.", DEMO: "Sample or illustrative data for development. NOT real.", UNAVAILABLE: "No current data is available." }[m.status];
  openDrawer("Data source", h("div", null, h("div", { class: "row", style: { marginBottom: "8px" } }, h("span", { class: "pill " + m.status }, m.status)), h("p", { class: "t2" }, explain),
    row("Provider", m.provider), row("Source", m.source), row("Data type", m.dataType), row("Update frequency", m.frequency), row("Units", m.units), row("Last updated", m.updatedAt && fmt.datetime(m.updatedAt)), row("Fetched by server", m.fetchedAt && fmt.datetime(m.fetchedAt)), row("Attribution", m.attribution), row("Licence", m.license), m.note ? h("p", { class: "small t2", style: { marginTop: "10px" } }, m.note) : null));
}
export function openDrawer(title, content, onClose) {
  const d = $("#drawer"); d.hidden = false;
  fill(d, h("div", { class: "dh" }, h("h3", { style: { flex: 1 } }, title), h("button", { onclick: closeDrawer, "aria-label": "Close panel" }, "✕")), h("div", { class: "db" }, content));
  d._onClose = onClose; $(".dh button", d).focus();
}
export function closeDrawer() { const d = $("#drawer"); if (d.hidden) return; d.hidden = true; fill(d); if (d._onClose) d._onClose(); d._onClose = null; }
export function toast(msg, kind = "") { const t = h("div", { class: "toast " + kind }, msg); $("#toasts").append(t); setTimeout(() => t.remove(), kind === "err" ? 6000 : 3500); }
export const state = (title, text, action) => h("div", { class: "state" }, h("b", null, title), text, action ? h("div", { style: { marginTop: "8px" } }, action) : null);
export const loading = () => h("div", { class: "box" }, h("div", { class: "bb", style: { padding: "12px" } }, h("div", { class: "sk" }), h("div", { class: "sk", style: { width: "70%" } }), h("div", { class: "sk", style: { width: "85%" } })));
export const box = (title, body, { right, meta } = {}) => h("section", { class: "box" }, h("div", { class: "bh" }, h("h2", null, title), h("div", { class: "r" }, right, meta ? badge(meta) : null)), h("div", { class: "bb" }, body));
export const sev = (n) => h("span", { class: "sev " + (n >= 4 ? "hi" : ""), title: "Severity " + n + "/5" }, [1, 2, 3, 4, 5].map((i) => h("i", { class: i <= n ? "f" : "" })));
export const banner = (text) => h("div", { class: "banner" }, h("b", null, "⚠"), text);
