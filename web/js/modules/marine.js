import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { head } from "./common.js";
import { sourcesBox } from "../components/sources.js";
export async function render(el) {
  fill(el, head("Marine life", "Species occurrence records"), loading()); const L = await api.species(); let cur = L.species[0]; const out = h("div");
  const load = async (name) => { cur = name; fill(out, loading()); try { const r = await api.species(name); fill(out, r.available ? h("div", null, h("div", { class: "row", style: { marginBottom: "6px" } }, h("b", null, r.species.canonical || r.species.scientificName), h("span", { class: "small muted" }, `${r.species.kingdom || ""} · ${fmt.int(r.total)} records in GBIF`)), table([{ key: "date", label: "Date", render: (x) => (x.date || "n/a").slice(0, 10) }, { key: "country", label: "Country" }, { key: "lat", label: "Lat/Lon", sort: (x) => x.lat, render: (x) => x.lat.toFixed(2) + "°, " + x.lon.toFixed(2) + "°" }, { key: "basis", label: "Basis" }, { key: "dataset", label: "Dataset" }], r.records, { sortKey: "date" }), h("p", { class: "small muted" }, "Showing up to 40 recent georeferenced records. " + (r.meta.note || ""))) : state("GBIF unavailable", r.error)); } catch (e) { fill(out, state("Failed", e.message)); } };
  fill(el, head("Marine life", "Scientific sightings, not live tracking"), h("div", { class: "banner" }, h("b", null, "NOTE"), "Records are historical sightings contributed by scientists and citizens. They are not real-time animal tracking and do not show true distributions."),
    box("Species", h("div", null, h("div", { class: "tabs" }, L.species.map((s) => h("button", { class: s === cur ? "on" : "", onclick: () => load(s) }, s))), out), { meta: { status: "PERIODIC", provider: "GBIF", source: "GBIF occurrence records", frequency: "continuous", dataType: "occurrences", note: "Not real-time tracking." } }), h("div", { style: { height: "10px" } }), sourcesBox(["gbif", "obis"]));
  load(cur);
}
