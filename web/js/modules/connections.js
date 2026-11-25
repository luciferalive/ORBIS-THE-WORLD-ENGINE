import { h, fill, fmt, box, state, loading, svg } from "../components/ui.js";
import { api } from "../services/api.js";
import { head } from "./common.js";
const COL = { country: "#65A9FF", industry: "#A68BFA", commodity: "#F0B65C", asset: "#55D6A7", city: "#929EAD" };
export async function render(el, arg) {
  const focus = arg || "country:US"; let depth = 1;
  fill(el, head("Connections", "Knowledge graph"), loading());
  const out = h("div", { class: "graph-wrap" }), info = h("div", { class: "small muted" });
  const C = await api.countries();
  const load = async (f) => {
    fill(out, loading());
    try {
      const g = await api.graph({ focus: f, depth, limit: 60 }), W = 900, H = 520, cx = W / 2, cy = H / 2, byD = {};
      g.nodes.forEach((n) => (byD[n.depth] = byD[n.depth] || []).push(n)); const pos = {};
      Object.entries(byD).forEach(([d, ns]) => ns.forEach((n, i) => { const r = d == 0 ? 0 : 130 + (d - 1) * 110, a = (i / ns.length) * Math.PI * 2 - Math.PI / 2 + d * 0.4; pos[n.id] = [cx + r * Math.cos(a) * 1.5, cy + r * Math.sin(a)]; }));
      const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Knowledge graph" });
      g.edges.forEach((e) => { const a = pos[e.a], b = pos[e.b]; if (a && b) s.append(svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: "#2a3a50", "stroke-width": 1 }), svg("text", { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, "text-anchor": "middle", fill: "#626F7F", "font-size": 8 }, e.rel)); });
      g.nodes.forEach((n) => { const p = pos[n.id]; if (!p) return; const gr = svg("g", { class: "gnode", tabindex: 0, role: "button", "aria-label": n.label + " (" + n.type + ")" }, svg("circle", { cx: p[0], cy: p[1], r: n.depth === 0 ? 11 : 7, fill: COL[n.type] || "#888", stroke: n.depth === 0 ? "#fff" : "none" }), svg("text", { x: p[0], y: p[1] + 20, "text-anchor": "middle" }, n.label)); const go = () => { history.replaceState(null, "", "#/connections/" + encodeURIComponent(n.id)); load(n.id); }; gr.addEventListener("click", go); gr.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); }); s.append(gr); });
      fill(out, s); fill(info, `${g.nodes.length} nodes · ${g.edges.length} relations` + (g.truncated ? " (truncated)" : "") + " · click a node to re-centre");
    } catch (e) { fill(out, state("Graph unavailable", e.message)); }
  };
  const opts = [...C.countries.map((c) => ({ id: "country:" + c.iso2, label: c.flag + " " + c.name }))];
  const sel = h("select", { "aria-label": "Focus", onchange: (e) => { history.replaceState(null, "", "#/connections/" + encodeURIComponent(e.target.value)); load(e.target.value); } }, opts.map((o) => h("option", { value: o.id, selected: o.id === focus }, o.label)));
  const dsel = h("select", { "aria-label": "Depth", onchange: (e) => { depth = +e.target.value; load(sel.value); } }, [1, 2].map((d) => h("option", { value: d }, "Depth " + d)));
  fill(el, head("Connections", "How countries, industries, commodities and assets relate", { status: "ESTIMATE", provider: "ORBIS reference graph", source: "Hand-curated relations", frequency: "static", dataType: "relations", note: "Relations are curated reference links (e.g. major exporter), not computed trade flows." }), h("div", { class: "row", style: { marginBottom: "10px" } }, sel, dsel, info), out, h("div", { class: "row small t2", style: { marginTop: "6px" } }, Object.entries(COL).map(([k, c]) => h("span", null, h("span", { style: { color: c } }, "● "), k)))); 
  if (!opts.find((o) => o.id === focus)) { /* non-country focus */ sel.prepend(h("option", { value: focus, selected: true }, focus)); }
  await load(focus);
}
