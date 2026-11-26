import { sourcesBox } from "../components/sources.js";
import { h, fill, fmt, badge, box, state, loading, banner, sev, openDrawer } from "../components/ui.js";
import { api } from "../services/api.js";
import { head, eventItem } from "./common.js";
const CATS = ["", "war", "politics", "economy", "energy", "technology", "natural_disaster", "health", "trade", "science", "other"];
async function _render(el, arg) {
  fill(el, head("World Live", "Event feed"), loading());
  const f = { category: "", severity: "", q: "", sort: "time" }; const list = h("div", { class: "feed" }), info = h("div", { class: "small muted" });
  let first;
  const load = async () => { fill(list, loading()); try { const d = await api.events({ ...f }); first = first || d; fill(info, `${d.events.length} of ${d.total} events · ` + Object.entries(d.feeds || {}).map(([k, x]) => k + ": " + (x && x.ok === false ? "failed" : x && x.ok ? "ok" : String(x))).join(" · "));
      fill(list, d.events.length ? d.events.map((e) => { const a = eventItem(e); a.addEventListener("click", (ev) => { ev.preventDefault(); history.replaceState(null, "", "#/live/" + encodeURIComponent(e.id)); detail(e); }); return a; }) : state("No events match", "Try clearing filters.")); return d; } catch (e) { fill(list, state("Event feed unavailable", e.message, h("button", { onclick: load }, "Retry"))); } };
  const timer = h("input", { type: "search", placeholder: "Filter events…", "aria-label": "Filter events", oninput: (e) => { f.q = e.target.value; clearTimeout(timer._t); timer._t = setTimeout(load, 250); } });
  const bar = h("div", { class: "row", style: { marginBottom: "10px" } }, timer, h("select", { "aria-label": "Category", onchange: (e) => { f.category = e.target.value; load(); } }, CATS.map((c) => h("option", { value: c }, c || "All categories"))),
    h("select", { "aria-label": "Minimum severity", onchange: (e) => { f.severity = e.target.value; load(); } }, h("option", { value: "" }, "Any severity"), [2, 3, 4, 5].map((n) => h("option", { value: n }, "Severity ≥ " + n))),
    h("select", { "aria-label": "Sort", onchange: (e) => { f.sort = e.target.value; load(); } }, h("option", { value: "time" }, "Newest"), h("option", { value: "severity" }, "Severity")), h("button", { onclick: load }, "Refresh"));
  const d = await api.events({ ...f }); first = d;
  fill(el, head("World Live", "Events from news feeds and measured sources", d.events[0] && d.events[0].meta), d.sample ? banner("These are SAMPLE placeholder events so the interface can be explored offline. They are not real news.") : null, bar, info, h("div", { class: "box" }, list)); await load();
  if (arg) { try { const r = await api.event(arg); detail(r.event); } catch (e) { fill(list, state("Event not found", e.message)); } }
}
function detail(e) {
  const kind = { sample: "Sample placeholder", measured: "Measured by a sensor network", reported: "Reported by a news source" }[e.kind] || e.kind;
  openDrawer("Event", h("div", null, h("div", { class: "row" }, h("span", { class: "cat" }, e.category), badge(e.meta, e.kind === "sample" ? "SAMPLE" : e.meta.status), sev(e.severity)), h("h3", { style: { margin: "8px 0" } }, e.title),
    h("h3", { class: "t2", style: { marginTop: "12px" } }, "Facts (from the source)"), h("div", { class: "stat" }, h("span", null, "Source"), h("span", null, e.source)), h("div", { class: "stat" }, h("span", null, "Time"), h("span", { class: "mono" }, fmt.datetime(e.time))), h("div", { class: "stat" }, h("span", null, "Nature"), h("span", null, kind)), e.location ? h("div", { class: "stat" }, h("span", null, "Location"), h("span", null, e.location)) : null, e.summary ? h("p", { class: "small" }, e.summary) : null, e.url ? h("a", { href: e.url, target: "_blank", rel: "noopener noreferrer" }, "Open original source ↗") : null,
    h("h3", { class: "t2", style: { marginTop: "12px" } }, "ORBIS classification (automatic, may be wrong)"), h("div", { class: "small t2" }, `Category “${e.category}” and severity ${e.severity}/5 come from keyword rules, not from analysts or the source.`),
    h("div", { class: "row", style: { marginTop: "6px" } }, (e.countries || []).map((c) => h("a", { class: "pill PERIODIC", href: "#/orbis/" + c }, c)), (e.commodities || []).map((c) => h("a", { class: "pill PERIODIC", href: "#/resources/" + c }, c)), (e.assets || []).map((a) => h("a", { class: "pill PERIODIC", href: "#/markets/" + a }, a))),
    h("h3", { class: "t2", style: { marginTop: "12px" } }, "Tags"), h("div", { class: "small t2" }, (e.tags || []).join(", ") || "none")), () => history.replaceState(null, "", "#/live"));
}

export async function render(el, arg) { const c = await _render(el, arg); el.append(h("div", { style: { height: "10px" } }), sourcesBox(['gdelt', 'rss', 'usgs', 'eonet'])); return c; }
