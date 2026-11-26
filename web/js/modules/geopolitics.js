import { sourcesBox } from "../components/sources.js";
import { h, fill, fmt, badge, box, state, loading, banner } from "../components/ui.js";
import { api } from "../services/api.js";
import { head, eventItem } from "./common.js";
const GEO = ["geopolitics", "conflict", "politics", "trade"];
async function _render(el) {
  fill(el, head("Geopolitics", "Conflict, politics and trade developments"), loading());
  const d = await api.events({ sort: "time" }), evs = d.events.filter((e) => GEO.includes(e.category)), byCountry = {};
  evs.forEach((e) => (e.countries || []).forEach((c) => (byCountry[c] = (byCountry[c] || 0) + 1)));
  const top = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 12);
  fill(el, head("Geopolitics", "Conflict, politics and trade developments", d.events[0] && d.events[0].meta),
    d.sample ? banner("Only SAMPLE placeholders are available: no live news feed is reachable. No geopolitical data is being shown as real.") : null,
    h("div", { class: "grid g21" }, box(`Geopolitical events (${evs.length})`, evs.length ? h("div", { class: "feed", style: { maxHeight: "560px", overflow: "auto", margin: "-10px" } }, evs.map((e) => eventItem(e))) : state("No geopolitical events", "None in the current feeds."), { meta: d.events[0] && d.events[0].meta }),
      h("div", null, box("Most mentioned countries", top.length ? h("div", null, top.map(([c, n]) => h("div", { class: "stat" }, h("a", { href: "#/orbis/" + c }, c), h("span", { class: "mono" }, n)))) : h("div", { class: "small muted" }, "No country detected in current events."), { meta: { status: "ESTIMATE", provider: "ORBIS classifier", source: "Keyword-based country detection on headlines", frequency: "per request", dataType: "counts", note: "Automatic; may miss or misattribute countries." } }),
        h("div", { style: { height: "10px" } }), box("Structured conflict data", h("div", { class: "small t2" }, h("p", null, "Event-level conflict datasets (ACLED, UCDP) and trackers (CFR Global Conflict Tracker, Our World in Data: war & peace) need licences or manual curation, so they are not wired in and nothing is simulated."), h("p", null, "Headline classification here uses keyword rules and is labelled as such.")), { right: h("span", { class: "pill UNAVAILABLE" }, "PLANNED") }))));
}

export async function render(el, arg) { const c = await _render(el, arg); el.append(h("div", { style: { height: "10px" } }), sourcesBox(['gdelt', 'rss', 'acled', 'ucdp'])); return c; }
