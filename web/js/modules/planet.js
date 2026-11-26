import { h, fill, fmt, badge, box, state, loading, sev } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { head } from "./common.js";
import { sourcesBox } from "../components/sources.js";
const WX = { 0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Rime fog", 51: "Light drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Showers", 95: "Thunderstorm" };
const unavailable = (title, r, provider) => box(title, state("Source unavailable", (r.error || "no data") + ". ORBIS does not simulate this."), { meta: { status: "UNAVAILABLE", provider, source: provider, frequency: "n/a", dataType: title, note: r.error || "" } });
export async function render(el) {
  fill(el, head("Planet", "Earthquakes, natural hazards and weather"), loading());
  const [Q, Hz, W] = await Promise.all([api.quakes(), api.hazards(), api.weather()]);
  const qs = Q.available === false ? [] : Q.quakes, hz = Hz.available ? Hz.hazards : [];
  const max = qs.reduce((m, q) => (!m || q.magnitude > m.magnitude ? q : m), null);
  const byHaz = {}; hz.forEach((e) => (byHaz[e.hazard] = (byHaz[e.hazard] || 0) + 1));
  fill(el, head("Planet", "Earthquakes, natural hazards and weather", (qs[0] || hz[0] || {}).meta),
    h("div", { class: "kpis" }, ...[["Earthquakes (24h, M2.5+)", Q.available === false ? "n/a" : qs.length], ["Strongest", max ? "M" + max.magnitude.toFixed(1) : "n/a"], ["Open NASA events", Hz.available ? hz.length : "n/a"], ...Object.entries(byHaz).slice(0, 3).map(([k, v]) => [k, v])].map(([l, v]) => h("div", { class: "kpi" }, h("div", { class: "l" }, l), h("div", { class: "v" }, v)))),
    h("div", { class: "grid g2" },
      Q.available === false ? unavailable("Earthquakes", Q, "USGS") : box("Earthquakes (past 24 h)", table([{ key: "magnitude", label: "Mag", num: true, render: (q) => h("b", null, q.magnitude.toFixed(1)) }, { key: "location", label: "Location" }, { key: "depthKm", label: "Depth km", num: true, render: (q) => Math.round(q.depthKm) }, { key: "time", label: "Time", render: (q) => fmt.ago(q.time) }], qs, { sortKey: "time", onRow: (q) => (location.hash = "#/live/" + encodeURIComponent(q.id)) }), { meta: qs[0] && qs[0].meta }),
      !Hz.available ? unavailable("Wildfires, storms, volcanoes", Hz, "NASA EONET") : box("Open natural events (NASA EONET)", table([{ key: "hazard", label: "Type" }, { key: "title", label: "Event" }, { key: "time", label: "Latest report", render: (e) => fmt.ago(e.time) }], hz, { sortKey: "time", onRow: (e) => (location.hash = "#/live/" + encodeURIComponent(e.id)) }), { meta: hz[0] && hz[0].meta })),
    h("div", { style: { height: "10px" } }),
    !W.available ? unavailable("Current weather, major cities", W, "Open-Meteo") : box("Current weather in major cities (model)", table([{ key: "place", label: "City" }, { key: "tempC", label: "Temp °C", num: true, render: (p) => p.tempC.toFixed(1) }, { key: "windKmh", label: "Wind km/h", num: true, render: (p) => Math.round(p.windKmh) }, { key: "precipMm", label: "Rain mm", num: true, render: (p) => p.precipMm.toFixed(1) }, { key: "code", label: "Conditions", render: (p) => WX[p.code] || "code " + p.code }], W.places, { sortKey: "place", desc: false }), { meta: W.places[0] && W.places[0].meta }),
    h("p", { class: "small muted" }, "Not yet connected: drought, air quality, sea level, ocean conditions, climate trends (planned: Open-Meteo air quality/archive, NOAA, Copernicus). They are not simulated."),
    sourcesBox(["usgs", "eonet", "openmeteo", "noaa-cdo", "copernicus-marine"]));
}
