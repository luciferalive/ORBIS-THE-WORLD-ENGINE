import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { lineChart } from "../components/charts.js";
import { head, kpi } from "./common.js";
import { sourcesBox } from "../components/sources.js";
const doy = (t) => { const d = new Date(t); return Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5); };
function ice(title, r, color) {
  if (!r.available) return box(title, state("Source unavailable", (r.error || "no data") + ". Nothing is simulated."), { meta: { status: "UNAVAILABLE", provider: "NSIDC", source: "Sea Ice Index", frequency: "daily", dataType: title } });
  const pts = r.points, yr = new Date(r.latest.t).getUTCFullYear(), byYear = (y) => pts.filter((p) => new Date(p.t).getUTCFullYear() === y).map((p) => ({ x: doy(p.t), y: p.v }));
  const clim = {}; pts.filter((p) => { const y = new Date(p.t).getUTCFullYear(); return y >= 1981 && y <= 2010; }).forEach((p) => { const d = doy(p.t); (clim[d] = clim[d] || []).push(p.v); });
  const avg = Object.entries(clim).map(([d, v]) => ({ x: +d, y: v.reduce((a, b) => a + b, 0) / v.length })).sort((a, b) => a.x - b.x);
  return box(title, h("div", null, h("div", { class: "row", style: { marginBottom: "6px" } }, h("span", { class: "mono", style: { fontSize: "20px" } }, fmt.num(r.latest.v, 2) + " M km²"), h("span", { class: "small muted" }, "latest " + new Date(r.latest.t).toISOString().slice(0, 10))), lineChart({ series: [{ name: "1981-2010 average", color: "#626F7F", dashed: true, points: avg }, { name: String(yr - 1), color: "#65A9FF", points: byYear(yr - 1) }, { name: String(yr), color, points: byYear(yr) }], xFmt: (d) => "day " + d, yFmt: (v) => v.toFixed(0), height: 200 })), { meta: r.meta });
}
export async function render(el) {
  fill(el, head("Polar", "Arctic and Antarctic sea ice"), loading()); const C = await api.climate();
  fill(el, head("Polar", "Sea ice extent from satellite records", C.seaIceNorth.meta || C.seaIceSouth.meta), h("div", { class: "grid g2" }, ice("Arctic sea ice extent", C.seaIceNorth, "#55D6A7"), ice("Antarctic sea ice extent", C.seaIceSouth, "#F0B65C")),
    h("p", { class: "small muted" }, "Extent = area with at least 15% ice cover. Recent values are preliminary. Ice sheets, glaciers, polar wildlife and research stations are not integrated yet."), sourcesBox(["nsidc", "gistemp"]));
}
