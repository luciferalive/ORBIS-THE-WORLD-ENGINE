import { h, fill, fmt, badge, box, state, loading, svg } from "../components/ui.js";
import { api } from "../services/api.js";
import { lineChart, barChart } from "../components/charts.js";
import { head, kpi } from "./common.js";

/** Pure model: expected population and births/deaths since 00:00 UTC, from the anchor + annual rates. */
export function livePop(anchor, now = Date.now()) {
  const YEAR = 365.2425 * 86400e3, t0 = Date.parse(anchor.date), dt = now - t0;
  const bps = anchor.birthsPerYear / YEAR, dps = anchor.deathsPerYear / YEAR, d = new Date(now), mid = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const jan = Date.UTC(d.getUTCFullYear(), 0, 1);
  return { population: anchor.population + (bps - dps) * dt, birthsToday: bps * (now - mid), deathsToday: dps * (now - mid), birthsYear: bps * (now - jan), deathsYear: dps * (now - jan), birthsPerSec: bps * 1000, deathsPerSec: dps * 1000 };
}
export async function render(el) {
  fill(el, head("Humanity", "Population, births and deaths"), loading());
  const H = await api.humanity(); const stop = [];
  const ids = {}; const slot = (k) => (ids[k] = h("span", { class: "mono" }));
  const pop = slot("pop"), bd = slot("bd"), dd = slot("dd"), by = slot("by"), dy = slot("dy"), net = slot("net");
  const rate = { b: H.anchor.birthsPerYear / 31556952, d: H.anchor.deathsPerYear / 31556952 };
  fill(el, head("Humanity", "Population, births and deaths", H.meta),
    h("div", { class: "banner" }, h("b", null, "ESTIMATE"), "These counters are a model, not a census. ORBIS takes an anchor population and annual birth/death rates and extrapolates linearly at constant rates. Nobody counts births and deaths in real time."),
    h("div", { class: "kpis" }, kpi("Population (modelled)", pop, "anchor + net growth", H.meta), kpi("Births today", bd, `≈ ${rate.b.toFixed(2)} / second`, H.meta), kpi("Deaths today", dd, `≈ ${rate.d.toFixed(2)} / second`, H.meta), kpi("Births this year", by, "since 1 Jan UTC", H.meta), kpi("Deaths this year", dy, "since 1 Jan UTC", H.meta), kpi("Net growth / day", net, "births − deaths", H.meta)),
    h("div", { class: "grid g2" },
      box("Population history and projection (billions)", lineChart({ series: [{ name: "History", color: "#65A9FF", points: H.history.map(([x, y]) => ({ x, y })) }, { name: "UN-style projection (medium)", color: "#A68BFA", dashed: true, points: [H.history[H.history.length - 1], ...H.projection].map(([x, y]) => ({ x, y })) }], yFmt: (v) => v.toFixed(1) + "B", xFmt: (x) => x }), { meta: { ...H.meta, status: "PERIODIC" } }),
      box("Urban share of population", lineChart({ series: [{ color: "#55D6A7", points: H.urban.map(([x, y]) => ({ x, y: y * 100 })) }], yFmt: (v) => v.toFixed(0) + "%", xFmt: (x) => x }))),
    box("Population by region (billions)", barChart({ items: H.regions.map(([label, value]) => ({ label, value })), horizontal: true, fmtV: (v) => v.toFixed(2) + "B" }), { meta: { ...H.meta, status: "PERIODIC" } }),
    box("How this is calculated", h("div", { class: "small t2" }, h("p", null, `Anchor: ${fmt.num(H.anchor.population / 1e9, 2)} billion people at ${H.anchor.date.slice(0, 10)}; ${fmt.compact(H.anchor.birthsPerYear)} births and ${fmt.compact(H.anchor.deathsPerYear)} deaths per year.`), h("p", null, "Counter value = anchor + (births/s − deaths/s) × seconds since anchor. Daily counters count from 00:00 UTC. Rates are held constant, so the further from the anchor, the larger the model error."), h("p", null, H.anchor.note), h("p", null, "For scenario uncertainty see ", h("a", { href: "#/forecast" }, "Forecast"), "."))));
  const tick = () => { const l = livePop(H.anchor); pop.textContent = fmt.int(l.population); bd.textContent = fmt.int(l.birthsToday); dd.textContent = fmt.int(l.deathsToday); by.textContent = fmt.int(l.birthsYear); dy.textContent = fmt.int(l.deathsYear); net.textContent = fmt.int(l.birthsToday - l.deathsToday); };
  tick(); const t = setInterval(tick, 100); stop.push(() => clearInterval(t)); return () => stop.forEach((f) => f());
}
