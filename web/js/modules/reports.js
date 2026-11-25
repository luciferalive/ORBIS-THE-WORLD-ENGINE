import { h, fill, fmt, badge, box, state, loading, toast } from "../components/ui.js";
import { api } from "../services/api.js";
import { head } from "./common.js";
// Reports are assembled from live ORBIS API data in the browser. Every row keeps its data status and provider.
const csvEsc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const toCsv = (rows) => rows.map((r) => r.map(csvEsc).join(",")).join("\n");
function download(name, text, type = "text/csv") { const a = h("a", { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); a.remove(); }
const KINDS = {
  markets: { label: "Market snapshot", build: async () => { const M = await api.markets(); return { title: "Market snapshot", cols: ["Symbol", "Name", "Class", "Price", "Change %", "Status", "Provider", "Updated"], rows: M.assets.map((a) => [a.symbol, a.name, a.class, a.price, a.changePct?.toFixed(2), a.meta.status, a.meta.provider, a.meta.updatedAt]), note: "Prices marked DEMO are not real." }; } },
  events: { label: "Events digest", build: async () => { const d = await api.events({ sort: "time" }); return { title: "Events digest", cols: ["Time", "Category", "Severity", "Title", "Source", "Kind", "URL"], rows: d.events.map((e) => [e.time, e.category, e.severity, e.title, e.source, e.kind, e.url || ""]), note: d.sample ? "SAMPLE placeholders only: no live feed was reachable." : "Category/severity are automatic keyword classifications." }; } },
  countries: { label: "Country comparison", build: async () => { const C = await api.countries(); return { title: "Country comparison", cols: ["Country", "Region", "Population", "GDP (USD)", "GDP growth %", "Inflation %", "Population status", "Year"], rows: C.countries.map((c) => [c.name, c.region, c.population, c.gdp, c.gdpGrowth, c.inflation, c.provenance.population.status, c.provenance.population.year]), note: "DEMO rows are approximate reference values." }; } },
  anomalies: { label: "Anomaly report", build: async () => { const A = await api.anomalies(); return { title: "Anomaly report", cols: ["Asset", "Class", "Move %", "Robust z", "Status", "Explanation"], rows: A.anomalies.map((a) => [a.name, a.class, a.movePct.toFixed(2), a.z.toFixed(1), a.dataStatus, a.explanation]), note: A.meta.note }; } },
  humanity: { label: "Humanity snapshot", build: async () => { const H = await api.humanity(); return { title: "Humanity snapshot", cols: ["Year", "Population (billions)", "Series"], rows: [...H.history.map(([y, v]) => [y, v, "history"]), ...H.projection.map(([y, v]) => [y, v, "projection"])], note: H.anchor.note }; } },
};
export async function render(el) {
  const out = h("div"); let cur = null;
  const gen = async (k) => { fill(out, loading()); try { cur = await KINDS[k].build(); const stamp = new Date().toISOString();
    fill(out, h("div", { class: "box print-area" }, h("div", { class: "bh" }, h("h2", null, cur.title), h("div", { class: "r" }, h("span", { class: "small muted" }, "Generated " + stamp), h("button", { onclick: () => download(`orbis-${k}-${stamp.slice(0, 10)}.csv`, toCsv([cur.cols, ...cur.rows])) }, "Download CSV"), h("button", { onclick: () => window.print() }, "Print / Save PDF"))),
      h("div", { class: "bb" }, cur.note ? h("p", { class: "small t2" }, cur.note) : null, h("div", { class: "scroll", style: { maxHeight: "60vh" } }, h("table", { class: "t" }, h("thead", null, h("tr", null, cur.cols.map((c) => h("th", null, c)))), h("tbody", null, cur.rows.slice(0, 500).map((r) => h("tr", null, r.map((c) => h("td", null, String(c ?? "")))))))), h("p", { class: "small muted" }, `${cur.rows.length} rows · generated from ORBIS API data; sources and statuses are included per row where available.`)))); } catch (e) { fill(out, state("Report failed", e.message)); } };
  fill(el, head("Reports", "Generate exportable intelligence reports"), h("div", { class: "row", style: { marginBottom: "10px" } }, Object.entries(KINDS).map(([k, v]) => h("button", { onclick: () => gen(k) }, v.label))), out, h("p", { class: "small muted" }, "Narrative AI reports require ANTHROPIC_API_KEY (see AI Analyst)."));
  gen("markets");
}
