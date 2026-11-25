import { h, fill, fmt, badge, box, state, loading, sev } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { head } from "./common.js";
export async function render(el) {
  fill(el, head("Planet", "Earthquakes and natural events"), loading());
  const Q = await api.quakes();
  if (Q.available === false || !Q.quakes.length) { fill(el, head("Planet", "Earthquakes and natural events"), box("Earthquakes", state("No earthquake data", Q.error ? `USGS feed unavailable: ${Q.error}. ORBIS does not simulate earthquakes.` : "No earthquakes in the current feed window."), { meta: Q.meta || { status: "UNAVAILABLE", provider: "USGS", source: "Earthquake Hazards Program", frequency: "1 minute", dataType: "seismic", note: Q.error || "" } }),
    box("Other planetary layers", h("p", { class: "small t2" }, "Weather, wildfires, air quality, volcanoes and sea level need additional providers (e.g. NASA FIRMS, Open-Meteo, Smithsonian GVP) that are not wired in yet. They are listed as planned rather than faked."))); return; }
  const qs = Q.quakes; const max = qs.reduce((m, q) => (q.magnitude > m.magnitude ? q : m), qs[0]);
  fill(el, head("Planet", "Earthquakes, past 24 hours (M2.5+)", qs[0].meta), h("div", { class: "kpis" }, h("div", { class: "kpi" }, h("div", { class: "l" }, "Quakes"), h("div", { class: "v" }, qs.length)), h("div", { class: "kpi" }, h("div", { class: "l" }, "Strongest"), h("div", { class: "v" }, "M" + max.magnitude.toFixed(1)), h("div", { class: "s" }, max.location)), h("div", { class: "kpi" }, h("div", { class: "l" }, "M5+"), h("div", { class: "v" }, qs.filter((q) => q.magnitude >= 5).length))),
    box("Earthquakes", table([{ key: "magnitude", label: "Mag", num: true, render: (q) => h("b", null, q.magnitude.toFixed(1)) }, { key: "location", label: "Location" }, { key: "depthKm", label: "Depth km", num: true, render: (q) => Math.round(q.depthKm) }, { key: "time", label: "Time", render: (q) => fmt.ago(q.time) }, { key: "severity", label: "Sev", render: (q) => sev(q.severity) }], qs, { sortKey: "time", onRow: (q) => (location.hash = "#/live/" + encodeURIComponent(q.id)) }), { meta: qs[0].meta }));
}
