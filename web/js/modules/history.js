import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { head } from "./common.js";
export async function render(el) {
  fill(el, head("History", "Timeline"), loading());
  const H = await api.history_(), evs = H.events, cats = ["", ...new Set(evs.map((e) => e.category))]; let cat = "", q = "";
  const list = h("div", { class: "tl" }), yr = (y) => (y < 0 ? Math.abs(y) + " BCE" : String(y));
  const draw = () => { const l = evs.filter((e) => (!cat || e.category === cat) && (!q || (e.title + e.note).toLowerCase().includes(q))); fill(list, l.length ? l.map((e) => h("div", { class: "e" }, h("div", { class: "y" }, yr(e.year)), h("div", null, h("b", null, e.title), h("span", { class: "cat", style: { marginLeft: "8px" } }, e.category)), e.note ? h("div", { class: "small t2" }, e.note) : null, h("div", { class: "row small" }, (e.countries || []).map((c) => h("a", { href: "#/orbis/" + c }, c))))) : state("No matches", "")); };
  fill(el, head("History", "Selected world history", H.meta), h("div", { class: "row", style: { marginBottom: "10px" } }, h("input", { type: "search", placeholder: "Filter…", "aria-label": "Filter history", oninput: (e) => { q = e.target.value.toLowerCase(); draw(); } }), h("select", { "aria-label": "Category", onchange: (e) => { cat = e.target.value; draw(); } }, cats.map((c) => h("option", { value: c }, c || "All categories"))), h("span", { class: "small muted" }, `${evs.length} curated entries, not a complete history`)), h("div", { class: "box" }, h("div", { class: "bb" }, list))); draw();
}
