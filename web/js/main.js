import { h, fill, $, fmt, badge, closeDrawer, toast, state, openDrawer } from "./components/ui.js";
import { api } from "./services/api.js";
import { store, setCollapsed } from "./store.js";
import * as overview from "./modules/overview.js"; import * as orbis from "./modules/orbis.js"; import * as humanity from "./modules/humanity.js"; import * as economy from "./modules/economy.js";
import * as markets from "./modules/markets.js"; import * as live from "./modules/live.js"; import * as planet from "./modules/planet.js"; import * as resources from "./modules/resources.js";
import * as civilization from "./modules/civilization.js"; import * as risefall from "./modules/risefall.js"; import * as risk from "./modules/risk.js"; import * as connections from "./modules/connections.js";
import * as history from "./modules/history.js"; import * as forecast from "./modules/forecast.js"; import * as analyst from "./modules/analyst.js";

export const MODULES = [
  { id: "overview", n: "01", label: "Overview", m: overview }, { id: "orbis", n: "02", label: "Orbis", m: orbis }, { id: "humanity", n: "03", label: "Humanity", m: humanity },
  { id: "economy", n: "04", label: "Economy", m: economy }, { id: "markets", n: "05", label: "Markets", m: markets }, { id: "live", n: "06", label: "World Live", m: live },
  { id: "planet", n: "07", label: "Planet", m: planet }, { id: "resources", n: "08", label: "Resources", m: resources }, { id: "civilization", n: "09", label: "Civilization", m: civilization },
  { id: "risefall", n: "10", label: "Rise & Fall", m: risefall }, { id: "risk", n: "11", label: "World Risk", m: risk, tag: "METHOD" }, { id: "connections", n: "12", label: "Connections", m: connections },
  { id: "history", n: "13", label: "History", m: history }, { id: "forecast", n: "14", label: "Forecast", m: forecast }, { id: "analyst", n: "15", label: "Analyst", m: analyst },
];
let cleanup = null, token = 0;
const parse = () => { const [, mod = "overview", ...rest] = location.hash.replace(/^#\/?/, "/").split("/"); return { mod: mod || "overview", arg: decodeURIComponent(rest.join("/") || "") }; };

function renderSide() {
  const { mod } = parse(), side = $("#side"); side.classList.toggle("collapsed", store.sidebarCollapsed);
  fill(side, h("div", { class: "brand" }, h("i"), h("span", null, "ORBIS")),
    h("nav", { "aria-label": "Modules" }, MODULES.map((x) => h("a", { class: "nav" + (x.id === mod ? " on" : ""), href: "#/" + x.id, title: x.label, "aria-current": x.id === mod ? "page" : null }, h("span", { class: "n" }, x.n), h("span", { class: "lbl" }, x.label), x.tag ? h("span", { class: "st" }, x.tag) : null))),
    h("div", { class: "foot" }, h("button", { onclick: () => { setCollapsed(!store.sidebarCollapsed); renderSide(); }, "aria-label": "Collapse sidebar", style: { width: "100%" } }, store.sidebarCollapsed ? "»" : "« Collapse")));
}
let clockEl;
function renderTop() {
  clockEl = h("span", { class: "mono t2 clock" }); const tick = () => { clockEl.textContent = new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC"; }; tick(); setInterval(tick, 1000);
  fill($("#top"), h("button", { class: "menu", "aria-label": "Toggle modules", onclick: () => $("#side").classList.toggle("open") }, "☰"),
    h("button", { class: "search", onclick: openPalette, "aria-label": "Search ORBIS" }, "⌕ ", h("span", null, "Search countries, assets, events…"), h("kbd", null, "Ctrl K")),
    h("span", { class: "sp" }), h("span", { id: "modeBadge" }), clockEl);
}
async function renderStatus() {
  const el = $("#status"), draw = async () => {
    try {
      const s = await api.status(), ok = s.sources.filter((x) => x.status === "OK").length, bad = s.sources.filter((x) => x.status === "ERROR").length, idle = s.sources.filter((x) => x.status === "IDLE" || x.status === "SKIPPED").length;
      fill(el, h("a", { href: "#", onclick: (e) => { e.preventDefault(); sourcesPanel(s); } }, s.offline ? "● Data sources: none contacted (offline mode)" : `● Data sources: ${ok} ok · ${bad} failing · ${idle} idle/skipped`), s.offline ? h("span", { class: "amber" }, "OFFLINE MODE: all market data is DEMO, events are SAMPLE") : h("span", null, "Online mode"), h("span", { style: { marginLeft: "auto" } }, "Server time " + fmt.time(s.time)));
      fill($("#modeBadge"), s.offline ? h("span", { class: "pill DEMO", title: "ORBIS_OFFLINE=1" }, "OFFLINE · DEMO DATA") : null);
    } catch (e) { fill(el, h("span", { class: "neg" }, "● Server unreachable: " + e.message)); }
  };
  draw(); setInterval(draw, 30000);
}
function sourcesPanel(s) {
  openDrawer("Data source status", h("div", null, s.sources.map((x) => h("div", { class: "box", style: { marginBottom: "8px" } }, h("div", { class: "bh" }, h("h2", null, x.name), h("span", { class: "r" }, h("span", { class: "pill " + (x.status === "OK" ? "LIVE" : x.status === "ERROR" ? "UNAVAILABLE" : "PERIODIC") }, x.status))),
    h("div", { class: "bb small" }, h("div", { class: "stat" }, h("span", null, "Type"), h("span", null, x.kind)), h("div", { class: "stat" }, h("span", null, "Frequency"), h("span", null, x.frequency)), h("div", { class: "stat" }, h("span", null, "API key"), h("span", null, x.keyRequired ? "required" : "not required")),
      h("div", { class: "stat" }, h("span", null, "Last OK"), h("span", null, x.lastOk ? fmt.ago(x.lastOk) : "never")), x.lastError ? h("div", { class: "neg small" }, "Last error: " + x.lastError) : null, h("div", { class: "stat" }, h("span", null, "Calls / failures"), h("span", null, x.calls + " / " + x.failures)))))));
}
// ---- command palette
let palSel = 0, palItems = [], palTimer;
function openPalette() {
  const p = $("#palette"); p.hidden = false; const inp = h("input", { placeholder: "Search countries, cities, assets, industries, events…", "aria-label": "Search", autocomplete: "off" }), res = h("div", { class: "res", role: "listbox" });
  fill(p, h("div", { class: "pbox" }, inp, res, h("div", { class: "small muted", style: { padding: "6px 14px" } }, "↑↓ navigate · Enter open · Esc close")));
  const show = (items) => { palItems = items; palSel = 0; fill(res, items.length ? items.map((it, i) => h("a", { href: it.route, class: i === 0 ? "sel" : "", onclick: () => closePalette() }, h("span", { class: "ty" }, it.type), h("span", null, it.label), h("span", { class: "muted small", style: { marginLeft: "auto" } }, it.sub || ""))) : h("div", { class: "state" }, "No results"));};
  const base = MODULES.map((m) => ({ type: "module", label: m.label, route: "#/" + m.id, sub: m.n }));
  show(base); inp.focus();
  inp.addEventListener("input", () => { clearTimeout(palTimer); const v = inp.value.trim(); if (!v) return show(base); palTimer = setTimeout(async () => { try { const r = await api.search(v); const mods = base.filter((b) => b.label.toLowerCase().includes(v.toLowerCase())); show([...mods, ...r.results]); } catch (e) { fill(res, state("Search failed", e.message)); } }, 120); });
  inp.addEventListener("keydown", (e) => { const as = [...res.querySelectorAll("a")]; if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); palSel = (palSel + (e.key === "ArrowDown" ? 1 : -1) + as.length) % as.length; as.forEach((a, i) => a.classList.toggle("sel", i === palSel)); as[palSel] && as[palSel].scrollIntoView({ block: "nearest" }); } else if (e.key === "Enter" && as[palSel]) { as[palSel].click(); location.hash = palItems[palSel].route; } });
  p.onclick = (e) => { if (e.target === p) closePalette(); };
}
function closePalette() { const p = $("#palette"); p.hidden = true; fill(p); }
addEventListener("keydown", (e) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
  else if (e.key === "/" && !typing) { e.preventDefault(); openPalette(); }
  else if (e.key === "Escape") { closePalette(); closeDrawer(); }
});
// ---- router
async function route() {
  const my = ++token, { mod, arg } = parse(), def = MODULES.find((m) => m.id === mod); renderSide(); $("#side").classList.remove("open");
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; } closeDrawer();
  const main = $("#main"); fill(main);
  if (!def) { fill(main, state("Module not found", `There is no module “${mod}”.`, h("a", { href: "#/overview" }, "Go to Overview"))); return; }
  document.title = def.label + " · ORBIS"; main.scrollTop = 0;
  const host = h("div"); main.append(host);
  try { const c = await def.m.render(host, arg); if (my === token) cleanup = c || null; else if (c) c(); }
  catch (e) { console.error(e); if (my === token) fill(host, state("This module failed to load", e.message || String(e), h("button", { onclick: route }, "Retry"))); }
}
addEventListener("hashchange", route);
addEventListener("unhandledrejection", (e) => { toast(String((e.reason && e.reason.message) || e.reason), "err"); });
renderTop(); renderStatus(); route();
