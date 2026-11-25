import { h, fill, fmt, badge, box, chg, state, loading, banner } from "../components/ui.js";
import { api } from "../services/api.js";
import { lineChart } from "../components/charts.js";
import { table } from "../components/table.js";
import { head, sparkCell, watchBtn } from "./common.js";
import { store, subscribe } from "../store.js";
const TABS = [["all", "All"], ["watch", "Watchlist ★"], ["stock", "Stocks"], ["index", "Indices"], ["crypto", "Crypto"], ["forex", "Forex"], ["metal", "Metals"], ["commodity", "Commodities"]];
const RANGES = ["1H", "24H", "7D", "1M", "3M", "1Y", "ALL"];
let tab = "all", view = "table";
export async function render(el, arg) {
  fill(el, head("Markets", "Stocks, crypto, forex, metals"), loading());
  const M = await api.markets(); const assets = M.assets; let unsub = () => {};
  const demo = assets.filter((a) => a.meta.status === "DEMO").length;
  const body = h("div"), detail = h("div");
  const draw = () => {
    const list = tab === "all" ? assets : tab === "watch" ? assets.filter((a) => store.watchlist.has(a.id)) : assets.filter((a) => a.class === tab);
    const tabs = h("div", { class: "tabs" }, TABS.map(([k, l]) => h("button", { class: tab === k ? "on" : "", onclick: () => { tab = k; draw(); } }, l)), h("span", { style: { flex: 1 } }), h("button", { class: view === "table" ? "on" : "", onclick: () => { view = "table"; draw(); } }, "Table"), h("button", { class: view === "heat" ? "on" : "", onclick: () => { view = "heat"; draw(); } }, "Heatmap"));
    const content = !list.length ? state(tab === "watch" ? "Watchlist is empty" : "No assets", "Click ☆ on any asset to add it to your watchlist.")
      : view === "heat" ? h("div", { class: "heat" }, list.map((a) => { const t = Math.max(-1, Math.min(1, a.changePct / 3)), bg = t >= 0 ? `rgba(85,214,167,${0.18 + t * 0.55})` : `rgba(255,95,101,${0.18 - t * 0.55})`; return h("button", { style: { background: bg }, onclick: () => (location.hash = "#/markets/" + a.id), title: a.name }, h("b", null, a.symbol), h("div", { class: "mono small" }, fmt.pct(a.changePct))); }))
      : table([{ key: "w", label: "", render: (a) => watchBtn(a.id, draw) }, { key: "symbol", label: "Symbol", render: (a) => h("b", null, a.symbol) }, { key: "name", label: "Name" }, { key: "class", label: "Class" }, { key: "price", label: "Price", num: true, render: (a) => fmt.price(a.price) }, { key: "changePct", label: "Change", num: true, render: (a) => chg(a.changePct) }, { key: "series", label: "Trend", sort: () => 0, render: sparkCell }, { key: "status", label: "Data", sort: (a) => a.meta.status, render: (a) => badge(a.meta) }], list, { sortKey: "symbol", desc: false, onRow: (a) => (location.hash = "#/markets/" + a.id) });
    fill(body, tabs, content);
  };
  unsub = subscribe(() => { if (tab === "watch") draw(); }); draw();
  fill(el, head("Markets", "Stocks, crypto, forex, metals, commodities", assets[0].meta),
    demo ? banner(`${demo} of ${assets.length} assets are DEMO values (no live provider reachable or configured). Do not use for decisions.`) : null,
    Object.entries(M.notes || {}).filter(([, v]) => v && v.ok === false).map(([k, v]) => banner(`${k}: ${v.error || "unavailable"}`)), body, detail);
  if (arg) await showDetail(detail, assets.find((a) => a.id === arg), draw); return () => unsub();
}
async function showDetail(host, a, redraw) {
  if (!a) { fill(host, box("Not found", state("Unknown asset", ""))); return; }
  let range = a.seriesRange || "24H"; const chart = h("div");
  const load = async (r) => { range = r; fill(chart, loading()); try { const d = await api.history(a.id, r); const pts = d.series.map(([x, y]) => ({ x, y })); fill(chart, lineChart({ series: [{ color: pts.length && pts[pts.length - 1].y >= pts[0].y ? "#55D6A7" : "#FF5F65", points: pts }], xIsTime: true, yFmt: fmt.price }), h("div", { class: "small muted" }, `${pts.length} points · range ${r}` + (d.note ? " · " + d.note : ""))); drawBtns(); } catch (e) { fill(chart, state("History unavailable", e.message)); } };
  const btns = h("div", { class: "tabs" }), drawBtns = () => fill(btns, ["1H", "24H", "7D", "1M", "3M", "1Y", "ALL"].map((r) => h("button", { class: r === range ? "on" : "", onclick: () => load(r) }, r)));
  fill(host, h("div", { style: { height: "10px" } }), box(`${a.name} (${a.symbol})`, h("div", null, h("div", { class: "row", style: { marginBottom: "8px" } }, h("span", { class: "mono", style: { fontSize: "24px" } }, fmt.price(a.price)), chg(a.changePct), badge(a.meta), watchBtn(a.id, redraw), h("a", { href: "#/forecast/" + a.id }, "Projection →")), btns, chart, h("p", { class: "small muted" }, a.meta.note || "")), { right: h("a", { href: "#/markets" }, "Close ✕") }));
  host.scrollIntoView({ block: "nearest" }); load(range);
}
