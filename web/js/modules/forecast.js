import { sourcesBox } from "../components/sources.js";
import { h, fill, fmt, badge, box, state, loading, banner } from "../components/ui.js";
import { api } from "../services/api.js";
import { lineChart } from "../components/charts.js";
import { head } from "./common.js";
async function _render(el, arg) {
  fill(el, head("Forecast", "Scenario projections"), loading());
  const [P, M] = await Promise.all([api.forecastPop(), api.markets()]); const id = M.assets.some((a) => a.id === arg) ? arg : "btc"; const A = await api.forecastAsset(id, 30);
  const S = P.scenarios, col = { optimistic: "#55D6A7", base: "#65A9FF", adverse: "#FF5F65" };
  const popChart = lineChart({ series: [{ name: "History", color: "#929EAD", points: P.history.map(([x, y]) => ({ x, y: y * 1e9 })) }, ...Object.entries(S).map(([k, s]) => ({ name: s.label, color: col[k], dashed: true, points: s.points.map((p) => ({ x: p.year, y: p.value })) }))], yFmt: (v) => (v / 1e9).toFixed(1) + "B", xFmt: (x) => x });
  const pts = A.cone.points, hist = A.history.slice(-60);
  const cone = lineChart({ series: [{ name: "History", color: "#929EAD", points: hist.map((p) => ({ x: p.t, y: p.v })) }, { name: "Central", color: "#A68BFA", dashed: true, points: pts.map((p) => ({ x: p.t, y: p.base })) }], bands: [{ name: "10th–90th percentile range", color: "#A68BFA", upper: pts.map((p) => ({ x: p.t, y: p.optimistic })), lower: pts.map((p) => ({ x: p.t, y: p.adverse })) }], xIsTime: true, yFmt: fmt.price });
  const sel = h("select", { "aria-label": "Asset", onchange: (e) => (location.hash = "#/forecast/" + e.target.value) }, M.assets.map((a) => h("option", { value: a.id, selected: a.id === id }, a.name)));
  fill(el, head("Forecast", "Scenario projections, not predictions", P.meta), h("div", { class: "banner" }, h("b", null, "PROJECTION"), "These are model outputs under stated assumptions. They are not facts, forecasts of what will happen, or financial advice."),
    box("World population scenarios", h("div", null, popChart, h("p", { class: "small t2" }, P.method)), { meta: P.meta }), h("div", { style: { height: "10px" } }),
    box("Asset projection cone", h("div", null, h("div", { class: "row", style: { marginBottom: "8px" } }, sel, A.meta.status === "DEMO" ? h("span", { class: "pill DEMO" }, "BASED ON DEMO SERIES") : null), cone, h("p", { class: "small t2" }, `Method: log-return drift (${(A.cone.muPerStep * 100).toFixed(4)}%/step) and volatility (${(A.cone.sdPerStep * 100).toFixed(3)}%/step) from ${A.cone.observations} observations, extrapolated with a random-walk cone. It ignores news, regime shifts and fat tails, so real outcomes will often leave the band.`)), { meta: A.meta }));
}

export async function render(el, arg) { const c = await _render(el, arg); el.append(h("div", { style: { height: "10px" } }), sourcesBox(['worldbank', 'coingecko'])); return c; }
