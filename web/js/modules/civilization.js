import { sourcesBox } from "../components/sources.js";
import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { head } from "./common.js";
async function _render(el) {
  fill(el, head("Civilization", "Countries and cities"), loading());
  const [C, CI] = await Promise.all([api.countries(), api.cities()]);
  fill(el, head("Civilization", "Countries, governments and major cities", C.meta),
    box("Countries", table([{ key: "name", label: "Country", render: (c) => c.flag + " " + c.name }, { key: "region", label: "Region" }, { key: "government", label: "Government" }, { key: "population", label: "Population", num: true, render: (c) => fmt.compact(c.population) }, { key: "industries", label: "Main industries", sort: (c) => c.industries[0], render: (c) => c.industries.slice(0, 3).join(", ") }], C.countries, { sortKey: "name", desc: false, onRow: (c) => (location.hash = "#/orbis/" + c.iso2) })),
    h("div", { style: { height: "10px" } }), box("Largest cities in the reference set", table([{ key: "name", label: "City" }, { key: "iso2", label: "Country", sort: (c) => c.iso2, render: (c) => { const k = C.countries.find((x) => x.iso2 === c.iso2); return k ? k.flag + " " + k.name : c.iso2; } }, { key: "population", label: "Metro population", num: true, render: (c) => fmt.compact(c.population) }], CI.cities, { sortKey: "population" }), { meta: CI.meta }),
    h("p", { class: "small muted" }, "Religions, languages, ethnic composition and migration are not included: they need vetted sources (e.g. CIA Factbook, UN DESA, Pew) and are not simulated."));
}

export async function render(el, arg) { const c = await _render(el, arg); el.append(h("div", { style: { height: "10px" } }), sourcesBox(['worldbank'])); return c; }
