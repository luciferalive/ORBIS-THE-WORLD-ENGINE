// Generic World Bank indicator explorer used by many modules. No values are shown unless the provider returned them.
import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { barChart } from "../components/charts.js";
import { head } from "./common.js";
import { sourcesBox } from "../components/sources.js";
const n1 = (v) => fmt.num(v, 1), pct = (v) => fmt.num(v, 1) + "%", cmp = (v) => fmt.compact(v);
export const IND = {
  fertility: ["Fertility rate (births/woman)", (v) => fmt.num(v, 2)], lifeExpectancy: ["Life expectancy (years)", n1], infantMortality: ["Infant mortality (per 1,000)", n1], povertyPct: ["Poverty headcount ($3/day, %)", pct], literacyPct: ["Adult literacy (%)", pct], educationSpendPct: ["Education spend (% GDP)", pct], age65Pct: ["Population 65+ (% of total)", pct], urbanPct: ["Urban population (%)", pct],
  unemployment: ["Unemployment (%)", pct], debtGdp: ["Government debt (% GDP)", pct], tradeGdp: ["Trade (% GDP)", pct], currentAccountGdp: ["Current account (% GDP)", pct], reservesUsd: ["FX reserves (USD)", (v) => "$" + cmp(v)], gdpPerCapita: ["GDP per capita (USD)", (v) => "$" + fmt.int(v)],
  cropIndex: ["Crop production index (2014-16=100)", n1], foodIndex: ["Food production index (2014-16=100)", n1], cerealYield: ["Cereal yield (kg/ha)", fmt.int], agriLandPct: ["Agricultural land (% of land)", pct], agriValueAddedPct: ["Agriculture (% of GDP)", pct], undernourishmentPct: ["Undernourishment (% of pop.)", pct], fertilizerKgHa: ["Fertilizer (kg/ha arable)", n1], waterWithdrawalPct: ["Freshwater withdrawal (% of resources)", pct], basicWaterPct: ["Basic drinking water access (%)", pct],
  homicideRate: ["Intentional homicides (per 100,000)", n1], railKm: ["Rail lines (km)", fmt.int], railPassengerKm: ["Rail passenger-km", cmp], railFreightTonKm: ["Rail freight (million ton-km)", cmp], roadKm: ["Road network (km)", fmt.int], roadPavedPct: ["Paved roads (%)", pct], roadDensity: ["Road density (km per 100 km²)", n1], airPassengers: ["Air passengers carried", cmp], portTeu: ["Container port traffic (TEU)", cmp], lpi: ["Logistics Performance Index (1-5)", (v) => fmt.num(v, 2)],
  internetPct: ["Internet users (%)", pct], mobilePer100: ["Mobile subscriptions (per 100)", n1], rdPctGdp: ["R&D spend (% GDP)", (v) => fmt.num(v, 2) + "%"], patentsResident: ["Patent applications (residents)", fmt.int], highTechExportsPct: ["High-tech exports (% of manufactured)", pct],
  energyUsePerCapita: ["Energy use (kg oil eq./person)", fmt.int], renewableElecPct: ["Renewables (% of electricity)", pct], fossilElecPct: ["Fossil fuels (% of electricity)", pct], nuclearElecPct: ["Nuclear (% of electricity)", pct], hydroElecPct: ["Hydro (% of electricity)", pct], energyImportsPct: ["Net energy imports (% of use)", pct], co2PerCapita: ["GHG per capita (t CO2e)", n1], forestPct: ["Forest area (% of land)", pct], renewablesPct: ["Renewables (% of final energy)", pct],
};
/** A box with a metric selector, ranked bars and a full table for the given indicator keys. */
export function indicatorBox(keys, { title = "Country indicators", note } = {}) {
  const host = h("div", null, h("div", { class: "sk" })); let cur = keys[0];
  api.indicatorTable(keys).then((T) => {
    if (!T.available) { fill(host, state("World Bank unavailable", "No values are shown because the provider could not be reached. ORBIS does not substitute estimates here.")); return; }
    const L = (k) => IND[k] || [k, n1], valid = (k) => T.rows.filter((r) => r.values[k]);
    const draw = () => { const [label, f] = L(cur), rows = valid(cur).sort((a, b) => b.values[cur].value - a.values[cur].value);
      fill(host, h("div", { class: "tabs" }, keys.map((k) => h("button", { class: k === cur ? "on" : "", onclick: () => { cur = k; draw(); } }, L(k)[0]))),
        rows.length ? h("div", null, barChart({ items: rows.slice(0, 12).map((r) => ({ label: r.flag + " " + r.name + " (" + r.values[cur].year + ")", value: Math.max(0, r.values[cur].value) })), horizontal: true, fmtV: f }), h("div", { class: "small muted" }, `${label}: top ${Math.min(12, rows.length)} of ${rows.length} reference countries with data`)) : state("No data", "No reference country has a value for this indicator."),
        h("div", { style: { height: "8px" } }), table([{ key: "name", label: "Country", render: (r) => r.flag + " " + r.name }, ...keys.map((k) => ({ key: k, label: L(k)[0], num: true, sort: (r) => (r.values[k] ? r.values[k].value : null), render: (r) => (r.values[k] ? h("span", { title: "reference year " + r.values[k].year }, L(k)[1](r.values[k].value), h("span", { class: "muted small" }, " ·" + String(r.values[k].year).slice(2))) : h("span", { class: "muted" }, "n/a")) }))], T.rows, { sortKey: keys[0], onRow: (r) => (location.hash = "#/orbis/" + r.iso2) }), note ? h("p", { class: "small muted" }, note) : null); };
    draw(); host.dataset.meta = "1"; if (T.errors && T.errors.length) host.append(h("p", { class: "small neg" }, "Some indicators failed: " + T.errors.map((e) => e.key).join(", ")));
  }).catch((e) => fill(host, state("Indicators unavailable", e.message)));
  return box(title, host, { meta: { status: "PERIODIC", provider: "World Bank", source: "World Bank Open Data", frequency: "annual (cells show reference year)", dataType: "indicators", attribution: "World Bank, CC BY 4.0", license: "CC BY 4.0", note: "Latest available year differs by country." } });
}
/** Factory for simple indicator modules. */
export function indicatorModule({ title, sub, keys, intro, sources, extra, note }) {
  return { async render(el) { fill(el, head(title, sub), intro ? h("div", { class: "banner" }, h("b", null, "NOTE"), intro) : null, indicatorBox(keys, { title: title + " indicators", note }), extra ? await extra() : null, h("div", { style: { height: "10px" } }), sourcesBox(sources || ["worldbank"])); } };
}
