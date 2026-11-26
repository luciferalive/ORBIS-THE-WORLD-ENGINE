import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { head } from "./common.js";
import { lineChart } from "../components/charts.js";
export async function render(el) {
  fill(el, head("History", "Timeline"), loading());
  const H = await api.history_(), evs = H.events, cats = ["", ...new Set(evs.map((e) => e.category))]; let cat = "", q = "";
  const list = h("div", { class: "tl" }), yr = (y) => (y < 0 ? Math.abs(y) + " BCE" : String(y));
  const draw = () => { const l = evs.filter((e) => (!cat || e.category === cat) && (!q || (e.title + e.note).toLowerCase().includes(q))); fill(list, l.length ? l.map((e) => h("div", { class: "e" }, h("div", { class: "y" }, yr(e.year)), h("div", null, h("b", null, e.title), h("span", { class: "cat", style: { marginLeft: "8px" } }, e.category)), e.note ? h("div", { class: "small t2" }, e.note) : null, h("div", { class: "row small" }, (e.countries || []).map((c) => h("a", { href: "#/orbis/" + c }, c))))) : state("No matches", "")); };
  fill(el, head("History", "Selected world history", H.meta), h("div", { class: "row", style: { marginBottom: "10px" } }, h("input", { type: "search", placeholder: "Filter…", "aria-label": "Filter history", oninput: (e) => { q = e.target.value.toLowerCase(); draw(); } }), h("select", { "aria-label": "Category", onchange: (e) => { cat = e.target.value; draw(); } }, cats.map((c) => h("option", { value: c }, c || "All categories"))), h("span", { class: "small muted" }, `${evs.length} curated entries, not a complete history`)), h("div", { class: "box" }, h("div", { class: "bb" }, list)), await recorded()); draw();
}
async function recorded() {
  const body = h("div", { class: "bb" }, h("span", { class: "muted small" }, "Loading…"));
  const wrap = h("div", { class: "box", style: { marginTop: "10px" } }, h("div", { class: "bh" }, h("b", null, "Recorded data (ORBIS store)")), body);
  try {
    const S = await api.storedStats(), chart = h("div");
    const show = async (id) => { fill(chart, h("span", { class: "muted small" }, "Loading…")); const r = await api.storedSeries(id); fill(chart, r.points.length > 1 ? lineChart({ series: [{ color: "var(--blue)", points: r.points.map((p) => ({ x: p.t, y: p.v })) }], xIsTime: true, height: 170 }) : h("span", { class: "muted small" }, "Not enough recorded points yet to draw a line (" + r.points.length + ")."), h("div", { class: "small muted" }, r.meta.source + " · " + r.meta.status)); };
    fill(body, h("p", { class: "small t2" }, `${fmt.num(S.seriesPoints)} points in ${S.seriesCount} series · ${fmt.num(S.events)} stored events · ${fmt.num(S.jobRuns)} collector runs. ${S.note}`),
      S.series.length ? h("div", null, h("select", { "aria-label": "Recorded series", onchange: (e) => e.target.value && show(e.target.value) }, h("option", { value: "" }, "Choose a recorded series…"), S.series.map((x) => h("option", { value: x.id }, `${x.id} (${x.points} pts)`))), chart) : h("p", { class: "small muted" }, "Nothing recorded yet. The collector stores only real observations and never demo values; with ORBIS_OFFLINE=1 or ORBIS_SCHEDULER=0 it stays empty."));
  } catch (e) { fill(body, h("span", { class: "small muted" }, "Store unavailable: " + e.message)); }
  return wrap;
}
