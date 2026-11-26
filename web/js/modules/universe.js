import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { head } from "./common.js";
import { livePop } from "./humanity.js";
const UNIX_JD = 2440587.5, AGE_UNIVERSE_GYR = 13.8, AGE_EARTH_GYR = 4.54;
export async function render(el) {
  fill(el, head("Universe Clock", "Past, present, future"), loading()); const [H, HIST, ISS, L] = await Promise.all([api.humanity(), api.history_(), api.iss(), api.launches()]);
  const live = h("div", { class: "kpis" }), stop = [];
  const tick = () => { const now = Date.now(), jd = now / 86400000 + UNIX_JD, p = livePop(H.anchor, now), d = new Date(now), doy = Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5);
    fill(live, ...[["UTC", d.toISOString().slice(0, 19).replace("T", " ")], ["Unix time", Math.floor(now / 1000)], ["Julian date", jd.toFixed(5)], ["Day of year", doy], ["World population (model)", fmt.int(p.population)], ["Births today (model)", fmt.int(p.birthsToday)]].map(([l, v]) => h("div", { class: "kpi" }, h("div", { class: "l" }, l), h("div", { class: "v", style: { fontSize: "15px" } }, v)))); };
  tick(); const t = setInterval(tick, 1000); stop.push(() => clearInterval(t));
  const past = (HIST.events || []).slice(-6).reverse(), future = L.available ? L.launches.slice(0, 5) : [];
  fill(el, head("Universe Clock", "One timeline from the past to projections"),
    live, h("div", { class: "grid g3" },
      box("Past", h("div", null, h("div", { class: "stat" }, h("span", null, "Universe age (Planck 2018)"), h("span", { class: "mono" }, AGE_UNIVERSE_GYR + " ± 0.02 Gyr")), h("div", { class: "stat" }, h("span", null, "Earth age"), h("span", { class: "mono" }, AGE_EARTH_GYR + " Gyr")), h("h3", { style: { margin: "8px 0 4px" } }, "Recent curated history"), past.map((e) => h("div", { class: "small", style: { padding: "2px 0" } }, h("b", null, e.year + " "), e.title)), h("a", { href: "#/history" }, "Full timeline →")), { meta: { status: "PERIODIC", provider: "Planck 2018 / ORBIS history", source: "Cosmological parameters and curated history", frequency: "static", dataType: "reference", note: "Ages are published estimates with uncertainty." } }),
      box("Present", h("div", null, ISS.available ? h("div", { class: "stat" }, h("span", null, "ISS position"), h("span", { class: "mono" }, `${ISS.lat.toFixed(2)}°, ${ISS.lon.toFixed(2)}° · ${Math.round(ISS.altitudeKm)} km`)) : h("div", { class: "small muted" }, "ISS position unavailable: " + (ISS.error || "")), h("div", { class: "stat" }, h("span", null, "World population"), h("span", { class: "mono" }, "model estimate above")), h("a", { href: "#/live" }, "Live events →"), " ", h("a", { href: "#/space" }, "Space →")), ISS.available ? { meta: ISS.meta } : {}),
      box("Future (projections, not facts)", h("div", null, future.length ? future.map((l) => h("div", { class: "small", style: { padding: "2px 0" } }, h("b", null, fmt.datetime(l.net) + " "), l.name)) : h("div", { class: "small muted" }, "Launch schedule unavailable."), h("div", { class: "stat" }, h("span", null, "Sun leaves main sequence"), h("span", { class: "mono" }, "~5 Gyr (model)")), h("div", { class: "stat" }, h("span", null, "Population 2100"), h("a", { href: "#/forecast" }, "scenarios →")), h("p", { class: "small muted" }, "Launch times are targets and slip. Astrophysical timescales are model estimates.")), { meta: { status: "PROJECTION", provider: "Launch Library 2 / stellar models", source: "Schedules and astrophysical estimates", frequency: "varies", dataType: "projection" } })));
  return () => stop.forEach((f) => f());
}
