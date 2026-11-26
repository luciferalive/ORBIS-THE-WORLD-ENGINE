import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { lineChart } from "../components/charts.js";
import { head } from "./common.js";
import { sourcesBox } from "../components/sources.js";
const un = (t, r, p) => box(t, state("Source unavailable", (r.error || "no data") + ". Nothing is simulated."), { meta: { status: "UNAVAILABLE", provider: p, source: p, frequency: "n/a", dataType: t } });
export async function render(el) {
  fill(el, head("Astronomy", "Sky, Sun and near-Earth objects"), loading()); const A = await api.astronomy(), W = await api.spaceweather();
  fill(el, head("Astronomy", "Observations and discoveries"),
    h("div", { class: "grid g2" },
      A.apod.available ? box("Astronomy Picture of the Day", h("div", null, A.apod.url ? h("img", { src: A.apod.url, alt: A.apod.title, style: { maxWidth: "100%", borderRadius: "3px" }, referrerpolicy: "no-referrer" }) : h("a", { href: A.apod.link, target: "_blank", rel: "noopener noreferrer" }, "Open media ↗"), h("h3", { style: { margin: "6px 0" } }, A.apod.title), h("p", { class: "small t2" }, A.apod.explanation), h("p", { class: "small muted" }, "Credit: " + A.apod.credit + " · " + A.apod.date)), { meta: A.apod.meta }) : un("Astronomy Picture of the Day", A.apod, "NASA APOD"),
      A.xray.available ? box("Solar X-ray flux (GOES, last 6 hours)", h("div", null, h("div", { class: "row" }, h("span", { class: "mono", style: { fontSize: "22px" } }, A.xray.latest.flareClass), h("span", { class: "small muted" }, "now · 6 h peak " + A.xray.peak6h.flareClass)), lineChart({ series: [{ color: "#F0B65C", points: A.xray.points.map((p) => ({ x: p.t, y: Math.log10(p.v) })) }], xIsTime: true, yFmt: (v) => "1e" + v.toFixed(0), height: 170 }), W.available ? h("p", { class: "small t2" }, `Geomagnetic: Kp ${W.latest.kp.toFixed(1)} (${W.latest.storm}).`) : null), { meta: A.xray.meta }) : un("Solar X-ray flux", A.xray, "NOAA GOES")),
    h("div", { style: { height: "10px" } }),
    A.neo.available ? box("Near-Earth asteroid approaches (next 7 days)", table([{ key: "approach", label: "Approach" }, { key: "name", label: "Object" }, { key: "diameterM", label: "Max diameter m", num: true, render: (o) => (o.diameterM ? Math.round(o.diameterM) : "n/a") }, { key: "missKm", label: "Miss km", num: true, render: (o) => fmt.compact(o.missKm) }, { key: "velKmS", label: "km/s", num: true, render: (o) => o.velKmS.toFixed(1) }], A.neo.objects, { sortKey: "approach", desc: false }), { meta: A.neo.objects[0] && A.neo.objects[0].meta }) : un("Near-Earth asteroids", A.neo, "NASA NeoWs"),
    h("div", { style: { height: "10px" } }),
    A.exoplanets.available ? box("Recently catalogued exoplanets", table([{ key: "year", label: "Year", num: true }, { key: "name", label: "Planet" }, { key: "host", label: "Host star" }, { key: "method", label: "Method" }, { key: "radiusEarth", label: "Radius (Earth=1)", num: true, render: (p) => (p.radiusEarth ? p.radiusEarth.toFixed(1) : "n/a") }], A.exoplanets.planets, { sortKey: "year" }), { meta: A.exoplanets.planets[0] && A.exoplanets.planets[0].meta }) : un("Exoplanets", A.exoplanets, "NASA Exoplanet Archive"),
    h("div", { style: { height: "10px" } }),
    box("Annual meteor showers (reference)", h("div", { class: "row" }, A.meteorShowers.items.map((m) => h("span", { class: "pill PERIODIC" }, m.name + " · " + m.peak))), { meta: A.meteorShowers.meta }),
    h("p", { class: "small muted" }, "Comets, black holes, supernovae and gravitational waves have no live source connected yet (planned: Minor Planet Center, LIGO/GWOSC, TNS)."), sourcesBox(["nasa", "apod", "exoplanets", "goes", "swpc"]));
}
