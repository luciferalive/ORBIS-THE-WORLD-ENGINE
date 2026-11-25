import { h, fill, fmt, badge, box, chg, state, loading, banner } from "../components/ui.js";
import { api } from "../services/api.js";
import { Globe } from "../globe/globe.js";
import { head, kpi, eventItem, sparkCell } from "./common.js";
import { table } from "../components/table.js";
import { livePop } from "./humanity.js";
import { store } from "../store.js";

export async function render(el) {
  fill(el, head("Overview", "World at a glance"), loading());
  const [mk, ev, sg, co, hu, gj] = await Promise.allSettled([api.markets(), api.events({ sort: "time" }), api.signals(), api.countries(), api.humanity(), api.geo()]);
  const ok = (r) => r.status === "fulfilled" ? r.value : null, M = ok(mk), E = ok(ev), S = ok(sg), C = ok(co), H = ok(hu), G = ok(gj);
  const demo = M && M.assets.some((a) => a.meta.status === "DEMO");
  const by = (id) => M && M.assets.find((a) => a.id === id);
  const stop = [];
  const pop = h("span", { class: "mono" }), births = h("span"), deaths = h("span");
  const tile = (a) => a ? kpi(a.name, fmt.price(a.price), [chg(a.changePct), a.meta.status === "DEMO" ? "demo" : a.meta.status.toLowerCase()], a.meta) : kpi("n/a", "—", "unavailable");
  const globeHost = h("div", { class: "globe-wrap", style: { height: "380px" } });
  const side = h("div");
  fill(el, head("Overview", "World at a glance", H && H.meta),
    demo ? banner("Offline or provider-less mode: market values are DEMO and events are SAMPLE placeholders. Nothing on this screen marked DEMO is real.") : null,
    h("div", { class: "kpis" }, kpi("World population", pop, "estimated now", H && H.meta), kpi("Births today", births, "model estimate, since 00:00 UTC", H && H.meta), kpi("Deaths today", deaths, "model estimate, since 00:00 UTC", H && H.meta),
      tile(by("spx")), tile(by("btc")), tile(by("xau")), tile(by("brent"))),
    h("div", { class: "grid g21" }, h("div", { class: "box" }, h("div", { class: "bh" }, h("h2", null, "Orbis"), h("div", { class: "r" }, h("a", { href: "#/orbis" }, "Open full globe →"))), globeHost),
      box("Event feed", E && E.events.length ? h("div", { class: "feed", style: { maxHeight: "380px", overflow: "auto", margin: "-10px" } }, E.events.slice(0, 12).map((e) => eventItem(e, { compact: true }))) : state("No events", "No events available from the feeds."), { meta: E && E.events[0] && E.events[0].meta })),
    h("div", { class: "grid g3", style: { marginTop: "10px" } },
      box("Top movers", M ? table([{ key: "name", label: "Asset" }, { key: "price", label: "Price", num: true, render: (a) => fmt.price(a.price) }, { key: "changePct", label: "Chg", num: true, render: (a) => chg(a.changePct) }], [...M.assets].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 8), { sortKey: "changePct", onRow: (a) => (location.hash = "#/markets/" + a.id) }) : state("Markets unavailable", "")),
      box("Rising", S ? sigList(S.signals.rising) : state("Signals unavailable", ""), { meta: S && S.meta }),
      box("Falling", S ? sigList(S.signals.falling) : state("Signals unavailable", ""), { meta: S && S.meta })));
  if (C) { const g = new Globe(globeHost, { countries: C.countries, geo: G && G.available ? G.geo : null, onPick: (iso) => { if (iso) { store.selectedCountry = iso; location.hash = "#/orbis/" + iso; } } }); g.setLayers({ population: true, daynight: true, events: false }); stop.push(() => g.destroy()); }
  if (H) { const t = setInterval(() => { const l = livePop(H.anchor); pop.textContent = fmt.int(l.population); births.textContent = fmt.int(l.birthsToday); deaths.textContent = fmt.int(l.deathsToday); }, 200); stop.push(() => clearInterval(t)); const l = livePop(H.anchor); pop.textContent = fmt.int(l.population); births.textContent = fmt.int(l.birthsToday); deaths.textContent = fmt.int(l.deathsToday); }
  return () => stop.forEach((f) => f());
}
const sigList = (l) => l.length ? h("div", null, l.slice(0, 6).map((s) => h("div", { class: "stat" }, h("a", { href: "#/markets/" + s.id }, s.entity), h("span", { class: "mono " + (s.movement >= 0 ? "pos" : "neg") }, fmt.pct(s.movement)), ))) : h("div", { class: "small muted" }, "No signals.");
