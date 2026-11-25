import { h, fmt, badge, chg, box, openDrawer, svg, fill } from "../components/ui.js";
import { sparkline } from "../components/charts.js";
import { toggleWatch, store } from "../store.js";
export const head = (title, sub, meta, right) => h("div", { class: "head" }, h("h1", null, title), sub ? h("span", { class: "sub" }, sub) : null, h("span", { style: { marginLeft: "auto" }, class: "row" }, right, meta ? badge(meta) : null));
export const kpi = (label, value, sub, meta) => h("div", { class: "kpi" }, h("div", { class: "l" }, label, meta ? badge(meta, meta.status === "DEMO" ? "DEMO" : meta.status) : null), h("div", { class: "v" }, value), h("div", { class: "s" }, sub));
export const scaleSeries = (a) => (a.series || []).map(([t, v]) => ({ x: t, y: v }));
export const assetRow = (a) => ({ ...a, spark: a.series ? a.series.map((p) => p[1]) : [] });
export const priceCell = (a) => h("span", { class: "mono" }, (a.currency === "USD" || a.currency === "USD/oz" || a.currency === "USD/t" ? "$" : "") + fmt.price(a.price) + (["pts"].includes(a.currency) ? "" : ""));
export const sparkCell = (a) => sparkline((a.series || []).map((p) => p[1]));
export function assetDrawer(a, rangeFn) { openDrawer(a.name, h("div", null, h("div", { class: "row" }, h("span", { class: "mono", style: { fontSize: "22px" } }, fmt.price(a.price)), chg(a.changePct), badge(a.meta)), h("p", { class: "t2 small" }, `${a.symbol} · ${a.class} · ${a.currency || ""}`), h("a", { href: "#/markets/" + a.id }, "Open in Markets →"))); }
export const watchBtn = (id, redraw) => h("button", { class: store.watchlist.has(id) ? "on" : "", "aria-pressed": store.watchlist.has(id), "aria-label": "Toggle watchlist", onclick: (e) => { e.stopPropagation(); toggleWatch(id); redraw && redraw(); } }, store.watchlist.has(id) ? "★" : "☆");
export function eventItem(e, { compact } = {}) {
  return h("a", { class: "item", href: "#/live/" + encodeURIComponent(e.id) }, h("div", { class: "meta" }, h("span", { class: "cat" }, e.category), badge(e.meta, e.kind === "sample" ? "SAMPLE" : e.meta.status), h("span", null, e.source), h("span", { style: { marginLeft: "auto" } }, fmt.ago(e.time))), h("div", null, e.title), compact ? null : h("div", { class: "small t2" }, e.summary));
}
export function countryPanel(c, { events = [] } = {}) {
  const prov = (k, label) => {
    const p = c.provenance && c.provenance[k]; if (!p) return null;
    return badge({ status: p.status, provider: p.source, source: p.source, frequency: p.year ? "reference year " + p.year : "n/a", dataType: label, updatedAt: null, note: p.year ? "Reference year " + p.year : "" }, p.status);
  };
  const f = (k, label, v) => h("div", { class: "stat" }, h("span", null, label), h("span", { class: "row", style: { gap: "6px", flexWrap: "nowrap" } }, h("span", { class: "mono" }, v), prov(k, label)));
  return h("div", null, h("div", { class: "row", style: { marginBottom: "8px" } }, h("span", { style: { fontSize: "26px" } }, c.flag), h("div", null, h("b", { style: { fontSize: "15px" } }, c.name), h("div", { class: "small t2" }, c.region + " · " + c.government))),
    f("population", "Population", fmt.compact(c.population)), f("gdp", "GDP (nominal)", fmt.usd(c.gdp)), f("gdpGrowth", "GDP growth", fmt.pct(c.gdpGrowth, 1)), f("inflation", "Inflation", fmt.pct(c.inflation, 1)),
    h("div", { class: "stat" }, h("span", null, "Currency"), h("span", { class: "mono" }, c.currency)), c.stockIndex ? h("div", { class: "stat" }, h("span", null, "Stock index"), h("span", null, c.stockIndex)) : null,
    h("h3", { style: { margin: "10px 0 4px" } }, "Main industries"), h("div", { class: "row small" }, c.industries.map((i) => h("span", { class: "pill PERIODIC" }, i))),
    h("h3", { style: { margin: "10px 0 4px" } }, "Main exports"), h("div", { class: "small t2" }, c.exports.join(", ")), h("h3", { style: { margin: "10px 0 4px" } }, "Energy"), h("div", { class: "small t2" }, c.energy),
    h("h3", { style: { margin: "10px 0 4px" } }, "Recent events"), events.length ? h("div", { class: "feed" }, events.slice(0, 4).map((e) => eventItem(e, { compact: true }))) : h("div", { class: "small muted" }, "No events linked to this country in the current feed."),
    h("div", { class: "row", style: { marginTop: "10px" } }, h("a", { href: "#/connections/country:" + c.iso2 }, "Explore connections →"), h("a", { href: "#/forecast" }, "Forecasts →")),
    h("p", { class: "small muted", style: { marginTop: "8px" } }, "Hover a badge for provenance. Values marked DEMO are approximate reference figures, not live statistics."));
}
