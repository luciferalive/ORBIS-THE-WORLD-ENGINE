import { h, fill, fmt, badge, box, state, loading, banner, chg } from "../components/ui.js";
import { api } from "../services/api.js";
import { lineChart } from "../components/charts.js";
import { head, sparkCell } from "./common.js";
export async function render(el, arg) {
  fill(el, head("Resources", "Commodities and strategic materials"), loading());
  const R = await api.resources(), facts = R.facts, names = Object.keys(facts), pick = names.includes(arg) ? arg : names[0], f = facts[pick];
  const match = R.prices.filter((p) => p.name.toLowerCase().includes(pick.toLowerCase().split(" ")[0]) || (pick === "Oil" && /wti|brent/i.test(p.id)) || (pick === "Natural gas" && p.id === "ng") || (pick === "Wheat" && p.id === "zw") || (pick === "Corn" && p.id === "zc") || (pick === "Uranium" && p.id === "u3o8"));
  fill(el, head("Resources", "Commodities and strategic materials", R.meta), R.prices.some((p) => p.meta.status === "DEMO") ? banner("Prices are DEMO. Producer / consumer lists are qualitative reference lists (approximate, not ranked output statistics).") : null,
    h("div", { class: "tabs" }, names.map((n) => h("a", { href: "#/resources/" + n }, h("button", { class: n === pick ? "on" : "" }, n)))),
    h("div", { class: "grid g2" }, box(pick, h("div", null, h("div", { class: "stat" }, h("span", null, "Major producers"), h("span", null, f.producers.join(", "))), h("div", { class: "stat" }, h("span", null, "Major consumers"), h("span", null, f.consumers.join(", "))), h("p", { class: "small t2" }, f.note)), { meta: { status: "ESTIMATE", provider: "ORBIS reference", source: "Hand-entered qualitative reference list", frequency: "static", dataType: "reference", note: "Not a ranked statistical dataset; verify before citing." } }),
      box("Price", match.length ? h("div", null, match.map((p) => h("div", null, h("div", { class: "row" }, h("b", null, p.name), h("span", { class: "mono" }, fmt.price(p.price) + " " + (p.currency || "")), chg(p.changePct), badge(p.meta)), lineChart({ series: [{ color: "#65A9FF", points: p.series.map((s) => ({ x: s.t ?? s[0], y: s.v ?? s[1] })) }], xIsTime: true, yFmt: fmt.price, height: 150 })))) : state("No price series", "No tracked price for this resource."))),
    box("All tracked commodity prices", h("div", null, R.prices.map((p) => h("div", { class: "stat" }, h("a", { href: "#/markets/" + p.id }, p.name), h("span", { class: "row", style: { flexWrap: "nowrap" } }, sparkCell(p), h("span", { class: "mono" }, fmt.price(p.price)), chg(p.changePct), badge(p.meta)))))));
}
