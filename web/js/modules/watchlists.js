import { h, fill, fmt, badge, box, state, loading, chg } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { head, sparkCell, watchBtn } from "./common.js";
import { store, toggleCountryWatch, subscribe } from "../store.js";
export async function render(el) {
  fill(el, head("Watchlists", "Your saved assets and countries"), loading());
  const [M, C] = await Promise.all([api.markets(), api.countries()]); const body = h("div");
  const draw = () => {
    const as = M.assets.filter((a) => store.watchlist.has(a.id)), cs = C.countries.filter((c) => store.countryWatch.has(c.iso2));
    fill(body, h("div", { class: "grid g2" },
      box("Assets", as.length ? table([{ key: "w", label: "", render: (a) => watchBtn(a.id, draw) }, { key: "symbol", label: "Symbol", render: (a) => h("b", null, a.symbol) }, { key: "price", label: "Price", num: true, render: (a) => fmt.price(a.price) }, { key: "changePct", label: "Chg", num: true, render: (a) => chg(a.changePct) }, { key: "s", label: "Trend", sort: () => 0, render: sparkCell }, { key: "d", label: "Data", sort: (a) => a.meta.status, render: (a) => badge(a.meta) }], as, { onRow: (a) => (location.hash = "#/markets/" + a.id) }) : state("No assets saved", "Star assets in Markets to track them here.", h("a", { href: "#/markets" }, "Open Markets"))),
      box("Countries", cs.length ? table([{ key: "name", label: "Country", render: (c) => c.flag + " " + c.name }, { key: "gdpGrowth", label: "Growth", num: true, render: (c) => fmt.pct(c.gdpGrowth, 1) }, { key: "inflation", label: "Inflation", num: true, render: (c) => fmt.pct(c.inflation, 1) }, { key: "x", label: "", sort: () => 0, render: (c) => h("button", { onclick: (e) => { e.stopPropagation(); toggleCountryWatch(c.iso2); draw(); } }, "Remove") }], cs, { onRow: (c) => (location.hash = "#/orbis/" + c.iso2) }) : state("No countries saved", "Open a country on the Globe and use Follow.", h("a", { href: "#/orbis" }, "Open Globe")))),
      h("p", { class: "small muted" }, "Watchlists are stored in this browser only (no account system yet)."));
  };
  draw(); fill(el, head("Watchlists", "Your saved assets and countries"), body);
}
