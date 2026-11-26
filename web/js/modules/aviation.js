import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { head } from "./common.js";
import { sourcesBox } from "../components/sources.js";
export async function render(el) {
  fill(el, head("Aviation", "Aircraft positions (ADS-B)"), loading()); const A = await api.aircraft(); const m = A.aircraft[0] && A.aircraft[0].meta;
  const byC = {}; A.aircraft.forEach((a) => (byC[a.country] = (byC[a.country] || 0) + 1)); const top = Object.entries(byC).sort((a, b) => b[1] - a[1]).slice(0, 10);
  fill(el, head("Aviation", "Publicly received ADS-B aircraft positions", m), h("div", { class: "banner" }, h("b", null, "LIMITS"), "OpenSky relies on volunteer receivers and anonymous access is credit-limited. This is NOT a complete picture of air traffic, and ORBIS shows at most 800 airborne aircraft."),
    A.available ? h("div", null, h("div", { class: "kpis" }, h("div", { class: "kpi" }, h("div", { class: "l" }, "Airborne shown"), h("div", { class: "v" }, A.aircraft.length)), h("div", { class: "kpi" }, h("div", { class: "l" }, "Snapshot"), h("div", { class: "v", style: { fontSize: "13px" } }, fmt.datetime(A.aircraft[0] && A.aircraft[0].time)))),
      h("div", { class: "grid g21" }, box("Aircraft", table([{ key: "callsign", label: "Callsign" }, { key: "icao24", label: "ICAO24" }, { key: "country", label: "Origin country" }, { key: "altitudeM", label: "Alt m", num: true, render: (a) => (a.altitudeM != null ? Math.round(a.altitudeM) : "n/a") }, { key: "velocityMs", label: "Speed km/h", num: true, render: (a) => (a.velocityMs != null ? Math.round(a.velocityMs * 3.6) : "n/a") }], A.aircraft.slice(0, 300), { sortKey: "callsign", desc: false }), { meta: m }), box("By registration country", h("div", null, top.map(([c, n]) => h("div", { class: "stat" }, h("span", null, c), h("span", { class: "mono" }, n)))), { meta: m }))) : box("OpenSky", state("Source unavailable", A.error)),
    h("div", { style: { height: "10px" } }), sourcesBox(["opensky"]));
}
