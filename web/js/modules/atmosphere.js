import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { lineChart } from "../components/charts.js";
import { table } from "../components/table.js";
import { head, kpi } from "./common.js";
import { sourcesBox } from "../components/sources.js";
const un = (title, r, provider) => box(title, state("Source unavailable", (r.error || "no data") + ". Nothing is simulated."), { meta: { status: "UNAVAILABLE", provider, source: provider, frequency: "n/a", dataType: title, note: r.error || "" } });
const AQI = (v) => (v == null ? "n/a" : v <= 50 ? "Good" : v <= 100 ? "Moderate" : v <= 150 ? "Unhealthy for sensitive" : v <= 200 ? "Unhealthy" : v <= 300 ? "Very unhealthy" : "Hazardous");
export async function render(el) {
  fill(el, head("Atmosphere and climate", "CO2, methane, temperature, air quality, ozone"), loading());
  const [C, A] = await Promise.all([api.climate(), api.airquality()]);
  const series = (r, color, yFmt, last = 240) => lineChart({ series: [{ color, points: r.points.slice(-last).map((p) => ({ x: p.t, y: p.v })) }], xIsTime: true, yFmt, height: 170 });
  fill(el, head("Atmosphere and climate", "Measured greenhouse gases, global temperature and air quality"),
    h("div", { class: "kpis" }, C.co2.available ? kpi("CO2 (Mauna Loa)", fmt.num(C.co2.latest.v, 1) + " ppm", new Date(C.co2.latest.t).toISOString().slice(0, 7), C.co2.meta) : kpi("CO2", "n/a", "unavailable"), C.ch4.available ? kpi("Methane (global)", fmt.int(C.ch4.latest.v) + " ppb", new Date(C.ch4.latest.t).toISOString().slice(0, 7), C.ch4.meta) : kpi("Methane", "n/a", "unavailable"),
      C.temperature.available ? kpi("Global temp anomaly", fmt.num(C.temperature.latestMonth.v, 2) + " °C", "vs 1951-1980, " + new Date(C.temperature.latestMonth.t).toISOString().slice(0, 7), C.temperature.meta) : kpi("Global temperature", "n/a", "unavailable")),
    h("div", { class: "grid g2" }, C.co2.available ? box("Atmospheric CO2, monthly (last 20 years)", series(C.co2, "#F0B65C", (v) => v.toFixed(0) + " ppm"), { meta: C.co2.meta }) : un("Atmospheric CO2", C.co2, "NOAA GML"), C.ch4.available ? box("Atmospheric methane, monthly", series(C.ch4, "#A68BFA", (v) => v.toFixed(0) + " ppb"), { meta: C.ch4.meta }) : un("Atmospheric methane", C.ch4, "NOAA GML")),
    h("div", { style: { height: "10px" } }),
    C.temperature.available ? box("Global surface temperature anomaly, annual (NASA GISTEMP)", lineChart({ series: [{ color: "#FF5F65", points: C.temperature.annual.map((a) => ({ x: Date.UTC(a.year, 6, 1), y: a.anomalyC })) }], xIsTime: true, yFmt: (v) => v.toFixed(2) + "°C", height: 190 }), { meta: C.temperature.meta }) : un("Global temperature anomaly", C.temperature, "NASA GISTEMP"),
    h("div", { style: { height: "10px" } }),
    A.available ? box("Air quality in major cities (model)", table([{ key: "place", label: "City" }, { key: "usAqi", label: "US AQI", num: true, render: (p) => (p.usAqi == null ? "n/a" : p.usAqi) }, { key: "c", label: "Category", sort: (p) => p.usAqi ?? -1, render: (p) => AQI(p.usAqi) }, { key: "pm25", label: "PM2.5 µg/m³", num: true, render: (p) => (p.pm25 == null ? "n/a" : p.pm25.toFixed(1)) }, { key: "groundOzone", label: "Ground-level ozone µg/m³", num: true, render: (p) => (p.groundOzone == null ? "n/a" : Math.round(p.groundOzone)) }], A.places, { sortKey: "usAqi" }), { meta: A.meta }) : un("Air quality", A, "Open-Meteo Air Quality"),
    h("div", { style: { height: "10px" } }),
    box("Ozone: two different things", h("div", { class: "small t2" }, h("p", null, h("b", null, "Ground-level ozone"), " is a pollutant formed from emissions; it is the ozone column in the table above (modelled)."), h("p", null, h("b", null, "Stratospheric ozone"), " (the ozone layer, and the Antarctic ozone hole) is measured by satellites (NASA Ozone Watch, Copernicus CAMS). ORBIS has no live source for it yet, so no ozone-layer figures are shown rather than estimating them.")), { right: h("span", { class: "pill UNAVAILABLE" }, "STRATOSPHERIC: NOT CONNECTED") }),
    h("div", { style: { height: "10px" } }), sourcesBox(["noaa-gml", "gistemp", "openmeteo", "copernicus-marine", "nasa-earthdata"]));
}
