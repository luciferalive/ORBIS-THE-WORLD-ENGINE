import { sourcesBox } from "../components/sources.js";
import { h, fill, fmt, badge, box, state, loading, banner, chg } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { barChart } from "../components/charts.js";
import { head } from "./common.js";
async function _render(el) {
  fill(el, head("Economy", "Country comparison"), loading());
  const C = await api.countries(), cs = C.countries, st = cs[0].provenance && cs[0].provenance.gdp ? cs[0].provenance.gdp.status : "DEMO";
  let metric = "gdp"; const chart = h("div");
  const M = { gdp: ["GDP (USD)", (c) => c.gdp, fmt.usd], population: ["Population", (c) => c.population, fmt.compact], gdpGrowth: ["GDP growth %", (c) => c.gdpGrowth, (v) => v.toFixed(1) + "%"], inflation: ["Inflation %", (c) => c.inflation, (v) => v.toFixed(1) + "%"], gdppc: ["GDP per capita", (c) => c.gdp / c.population, (v) => "$" + fmt.compact(v)] };
  const draw = () => { const [, get, f] = M[metric]; const top = [...cs].filter((c) => Number.isFinite(get(c))).sort((a, b) => get(b) - get(a)).slice(0, 15); fill(chart, h("div", { class: "tabs" }, Object.entries(M).map(([k, [l]]) => h("button", { class: k === metric ? "on" : "", onclick: () => { metric = k; draw(); } }, l))), barChart({ items: top.map((c) => ({ label: c.flag + " " + c.name, value: Math.max(0, get(c)) })), horizontal: true, fmtV: f })); };
  draw();
  fill(el, head("Economy", "Country economic comparison", C.meta), st === "DEMO" ? banner("Economic figures are approximate bundled reference values (≈2023) labelled DEMO. With network access ORBIS replaces them with World Bank data, labelled PERIODIC.") : null,
    box("Top 15 by metric", chart), h("div", { style: { height: "10px" } }),
    box("All countries", table([{ key: "name", label: "Country", render: (c) => c.flag + " " + c.name }, { key: "region", label: "Region" }, { key: "gdp", label: "GDP", num: true, render: (c) => fmt.usd(c.gdp) }, { key: "gdppc", label: "GDP / capita", num: true, sort: (c) => c.gdp / c.population, render: (c) => "$" + fmt.compact(c.gdp / c.population) }, { key: "gdpGrowth", label: "Growth", num: true, render: (c) => chg(c.gdpGrowth, 1) }, { key: "inflation", label: "Inflation", num: true, render: (c) => fmt.pct(c.inflation, 1) }, { key: "population", label: "Population", num: true, render: (c) => fmt.compact(c.population) }, { key: "currency", label: "Ccy" }, { key: "s", label: "Data", sort: () => 0, render: (c) => badge({ status: c.provenance.gdp.status, provider: c.provenance.gdp.source, source: c.provenance.gdp.source, frequency: "reference year " + c.provenance.gdp.year, dataType: "economy" }, c.provenance.gdp.status) }], cs, { sortKey: "gdp", onRow: (c) => (location.hash = "#/orbis/" + c.iso2) })));
}

export async function render(el, arg) { const c = await _render(el, arg); el.append(h("div", { style: { height: "10px" } }), sourcesBox(['worldbank', 'fred'])); return c; }
