import { h, fill, $, fmt, badge, closeDrawer, toast, state, openDrawer } from "./components/ui.js";
import { api } from "./services/api.js";
import { store, setCollapsed } from "./store.js";
import { boot } from "./fx.js";
import * as overview from "./modules/overview.js"; import * as orbis from "./modules/orbis.js"; import * as humanity from "./modules/humanity.js"; import * as economy from "./modules/economy.js";
import * as markets from "./modules/markets.js"; import * as live from "./modules/live.js"; import * as planet from "./modules/planet.js"; import * as resources from "./modules/resources.js";
import * as civilization from "./modules/civilization.js"; import * as risefall from "./modules/risefall.js"; import * as risk from "./modules/risk.js"; import * as connections from "./modules/connections.js";
import * as geopolitics from "./modules/geopolitics.js"; import * as reports from "./modules/reports.js"; import * as watchlists from "./modules/watchlists.js"; import * as settings from "./modules/settings.js";
import { startAlerts } from "./services/alerts.js"; import { store as st, subscribe, markRead, clearNotes } from "./store.js";
import * as space from "./modules/space.js"; import * as science from "./modules/science.js"; import * as cyber from "./modules/cyber.js"; import * as aviation from "./modules/aviation.js"; import * as sources from "./modules/sources.js";
import * as atmosphere from "./modules/atmosphere.js"; import * as polar from "./modules/polar.js"; import * as oceans from "./modules/oceans.js"; import * as marine from "./modules/marine.js"; import * as astronomy from "./modules/astronomy.js";
import * as technology from "./modules/technology.js"; import * as finance from "./modules/finance.js"; import * as megaprojects from "./modules/megaprojects.js"; import * as discovery from "./modules/discovery.js"; import * as security from "./modules/security.js"; import * as simulations from "./modules/simulations.js"; import * as universe from "./modules/universe.js";
import { agriculture, crime, railways, roads, logistics, maritime } from "./modules/simple.js";
import * as history from "./modules/history.js"; import * as forecast from "./modules/forecast.js"; import * as analyst from "./modules/analyst.js";

const G = (group, list) => list.map((x) => ({ ...x, group }));
export const MODULES = [
  ...G("Command", [{ id: "overview", label: "Overview", m: overview }, { id: "orbis", label: "Globe", m: orbis }]),
  ...G("People and society", [{ id: "humanity", label: "Humanity", m: humanity }, { id: "civilization", label: "Civilization", m: civilization }, { id: "crime", label: "Crime", m: crime }]),
  ...G("Economy and markets", [{ id: "economy", label: "Economy", m: economy }, { id: "markets", label: "Markets", m: markets }, { id: "finance", label: "Financial Power", m: finance }, { id: "resources", label: "Resources", m: resources }, { id: "agriculture", label: "Agriculture", m: agriculture }]),
  ...G("World events", [{ id: "live", label: "World Live", m: live }, { id: "geopolitics", label: "Geopolitics", m: geopolitics }, { id: "security", label: "Security", m: security }, { id: "risk", label: "World Risk", m: risk, tag: "METHOD" }]),
  ...G("Planet", [{ id: "planet", label: "Planet", m: planet }, { id: "atmosphere", label: "Atmosphere", m: atmosphere }, { id: "oceans", label: "Oceans", m: oceans }, { id: "marine", label: "Marine life", m: marine }, { id: "polar", label: "Polar", m: polar }]),
  ...G("Space", [{ id: "space", label: "Space", m: space }, { id: "astronomy", label: "Astronomy", m: astronomy }]),
  ...G("Transport", [{ id: "aviation", label: "Aviation", m: aviation }, { id: "maritime", label: "Maritime", m: maritime }, { id: "railways", label: "Railways", m: railways }, { id: "roads", label: "Roads", m: roads }, { id: "logistics", label: "Logistics", m: logistics }]),
  ...G("Science and technology", [{ id: "science", label: "Science", m: science }, { id: "technology", label: "Technology", m: technology }, { id: "discovery", label: "Discovery", m: discovery }, { id: "cyber", label: "Cybersecurity", m: cyber }, { id: "megaprojects", label: "Megaprojects", m: megaprojects }]),
  ...G("Intelligence", [{ id: "risefall", label: "Rise & Fall", m: risefall }, { id: "connections", label: "Connections", m: connections }, { id: "history", label: "History", m: history }, { id: "forecast", label: "Forecast", m: forecast }, { id: "simulations", label: "Simulations", m: simulations }, { id: "universe", label: "Universe Clock", m: universe }, { id: "analyst", label: "AI Analyst", m: analyst }, { id: "reports", label: "Reports", m: reports }]),
  ...G("Workspace", [{ id: "watchlists", label: "Watchlists", m: watchlists }, { id: "sources", label: "API Center", m: sources }, { id: "settings", label: "Settings", m: settings }]),
];
let cleanup = null, token = 0;
const parse = () => { const [, mod = "overview", ...rest] = location.hash.replace(/^#\/?/, "/").split("/"); return { mod: mod || "overview", arg: decodeURIComponent(rest.join("/") || "") }; };

function renderSide() {
  const { mod } = parse(), side = $("#side"); side.classList.toggle("collapsed", store.sidebarCollapsed);
  fill(side, h("div", { class: "brand" }, h("i"), h("span", null, "ORBIS")),
    h("nav", { "aria-label": "Modules" }, MODULES.flatMap((x, i) => [i === 0 || MODULES[i - 1].group !== x.group ? h("div", { class: "grp" }, x.group) : null, h("a", { class: "nav" + (x.id === mod ? " on" : ""), href: "#/" + x.id, title: x.label, "aria-current": x.id === mod ? "page" : null }, h("span", { class: "n" }, String(i + 1).padStart(2, "0")), h("span", { class: "lbl" }, x.label), x.tag ? h("span", { class: "st" }, x.tag) : null)])),
    h("div", { class: "foot" }, h("button", { onclick: () => { setCollapsed(!store.sidebarCollapsed); renderSide(); }, "aria-label": "Collapse sidebar", style: { width: "100%" } }, store.sidebarCollapsed ? "»" : "« Collapse")));
}
let clockEl;
function renderTop() {
  clockEl = h("span", { class: "mono t2 clock" }); const tick = () => { clockEl.textContent = new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC"; }; tick(); setInterval(tick, 1000);
  fill($("#top"), h("button", { class: "menu", "aria-label": "Toggle modules", onclick: () => $("#side").classList.toggle("open") }, "☰"),
    h("button", { class: "search", onclick: openPalette, "aria-label": "Search ORBIS" }, "⌕ ", h("span", null, "Search countries, assets, events…"), h("kbd", null, "Ctrl K")),
    h("span", { class: "sp" }), h("span", { id: "modeBadge" }), h("button", { id: "bell", onclick: openNotes, "aria-label": "Notifications" }, "🔔 ", h("span", { id: "bellN" }, "0")), h("a", { href: "#/settings", class: "pill PERIODIC", title: "Local profile (no accounts yet)" }, "LOCAL"), clockEl);
  const upd = () => { const n = st.notes.filter((x) => !x.read).length; const b = $("#bellN"); if (b) { b.textContent = n; $("#bell").classList.toggle("on", n > 0); } }; subscribe(upd); upd();
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

function openNotes() {
  markRead();
  openDrawer("Notifications", h("div", null, h("div", { class: "row", style: { marginBottom: "8px" } }, h("a", { href: "#/settings" }, "Manage alert rules"), h("button", { onclick: () => { clearNotes(); closeDrawer(); } }, "Clear history")),
    st.notes.length ? h("div", { class: "feed" }, st.notes.map((n) => h("div", { class: "item" }, h("div", { class: "meta" }, h("span", { class: "pill " + (n.dataStatus || "DEMO") }, n.dataStatus || "?"), h("span", null, fmt.ago(n.firedAt || n.at))), h("div", null, n.title), h("div", { class: "small t2" }, n.detail)))) : state("No notifications", "Create alert rules in Settings. They fire here when conditions are met.")));
}
boot();
startAlerts();
