import { h, fill, fmt, badge, box, state, loading, banner, openDrawer, closeDrawer, toast } from "../components/ui.js";
import { api } from "../services/api.js";
import { Globe } from "../globe/globe.js";
import { head, countryPanel } from "./common.js";
import { store, subscribe, toggleLayer, toggleCountryWatch } from "../store.js";

const LAYERS = [
  { id: "population", label: "Countries (size ∝ population)" }, { id: "events", label: "Events" }, { id: "cities", label: "Major cities" }, { id: "quakes", label: "Earthquakes (USGS)" }, { id: "daynight", label: "Day / night" },
  { id: "_conflict", label: "Conflict zones", planned: true }, { id: "_shipping", label: "Shipping routes", planned: true }, { id: "_energy", label: "Energy infrastructure", planned: true }, { id: "_flights", label: "Flights", planned: true }, { id: "_weather", label: "Weather", planned: true },
];
export async function render(el, arg) {
  fill(el, head("Orbis", "Interactive world model"), loading());
  const [co, ci, ev, qk, gj] = await Promise.allSettled([api.countries(), api.cities(), api.events({ sort: "time" }), api.quakes(), api.geo()]);
  if (co.status !== "fulfilled") throw co.reason;
  const C = co.value.countries, CI = ci.status === "fulfilled" ? ci.value.cities : [], E = ev.status === "fulfilled" ? ev.value.events : [], Q = qk.status === "fulfilled" && qk.value.available !== false ? qk.value.quakes : [], G = gj.status === "fulfilled" && gj.value.available ? gj.value : null;
  const host = h("div", { class: "globe-wrap", style: { height: "min(70vh, 640px)", minHeight: "340px" } }), layersEl = h("div", { class: "layers" });
  const evMarks = E.flatMap((e) => (e.lat != null ? [{ lat: e.lat, lon: e.lon, severity: e.severity, sample: e.kind === "sample" }] : (e.countries || []).map((iso) => { const c = C.find((x) => x.iso2 === iso); return c ? { lat: c.lat, lon: c.lon, severity: e.severity, sample: e.kind === "sample" } : null; }).filter(Boolean)));
  const selectCountry = (iso, focus) => {
    store.selectedCountry = iso; if (!iso) { closeDrawer(); return; }
    const c = C.find((x) => x.iso2 === iso); if (!c) return;
    history.replaceState(null, "", "#/orbis/" + iso); globe.select(iso, focus);
    openDrawer(c.name, h("div", null, h("button", { style: { marginBottom: "8px" }, onclick: (e) => { toggleCountryWatch(iso); e.target.textContent = store.countryWatch.has(iso) ? "★ Following" : "☆ Follow"; } }, store.countryWatch.has(iso) ? "★ Following" : "☆ Follow"), countryPanel(c, { events: E.filter((e) => (e.countries || []).includes(iso)) })), () => { globe.select(null); history.replaceState(null, "", "#/orbis"); });
  };
  const globe = new Globe(host, { countries: C, geo: G && G.geo, onPick: (iso) => selectCountry(iso, false) });
  globe.setMarkers({ events: evMarks, cities: CI, quakes: Q.map((q) => ({ lat: q.lat, lon: q.lon, mag: q.magnitude })) });
  const drawLayers = () => { const on = {}; LAYERS.forEach((l) => (on[l.id] = store.layers.has(l.id) || (l.id === "daynight" && store.layers.has("daynight")))); globe.setLayers(on);
    fill(layersEl, LAYERS.map((l) => h("label", { class: l.planned ? "dis" : "", title: l.planned ? "Planned: no data provider connected yet" : "" }, h("input", { type: "checkbox", checked: store.layers.has(l.id), disabled: !!l.planned || (l.id === "quakes" && !Q.length), onchange: () => toggleLayer(l.id) }), l.label, l.planned ? h("span", { class: "pill UNAVAILABLE", style: { marginLeft: "auto" } }, "PLANNED") : l.id === "quakes" && !Q.length ? h("span", { class: "pill UNAVAILABLE", style: { marginLeft: "auto" } }, "NO DATA") : l.id === "events" && E.every((e) => e.kind === "sample") ? h("span", { class: "pill DEMO", style: { marginLeft: "auto" } }, "SAMPLE") : null))); };
  const unsub = subscribe(drawLayers); drawLayers();
  const sel = h("select", { "aria-label": "Select country", onchange: (e) => selectCountry(e.target.value || null, true) }, h("option", { value: "" }, "Select a country…"), [...C].sort((a, b) => a.name.localeCompare(b.name)).map((c) => h("option", { value: c.iso2 }, c.flag + " " + c.name)));
  const ctl = h("div", { class: "globe-ctl" }, h("button", { onclick: () => globe.zoomBy(1.3), "aria-label": "Zoom in" }, "+"), h("button", { onclick: () => globe.zoomBy(1 / 1.3), "aria-label": "Zoom out" }, "−"), h("button", { onclick: () => { globe.zoom = 1; globe.focus(20, 20); }, "aria-label": "Reset view" }, "⟲"));
  const noGeo = !G;
  host.append(ctl, h("div", { class: "globe-leg" }, noGeo ? "Country boundaries unavailable: coarse continent outlines are decorative; click selects the nearest reference country." : "Boundaries: Natural Earth. Drag to rotate · wheel to zoom · click a country."));
  fill(el, head("Orbis", "Interactive world model", co.value.meta, sel),
    h("div", { class: "grid gside" }, host, h("div", null, box("Layers", layersEl), h("div", { style: { height: "10px" } }), box("About", h("p", { class: "small t2" }, "Globe markers show reference countries; DEMO-labelled figures are approximate. Layers marked PLANNED have no data source wired in yet and are deliberately not simulated.")))));
  if (arg) setTimeout(() => selectCountry(arg.toUpperCase(), true), 50);
  return () => { unsub(); globe.destroy(); };
}
