import { h, fill, fmt, badge, box, state, loading, banner, openDrawer, closeDrawer, toast } from "../components/ui.js";
import { api } from "../services/api.js";
import { Globe } from "../globe/globe.js";
import { head, countryPanel } from "./common.js";
import { store, subscribe, toggleLayer, toggleCountryWatch } from "../store.js";

const LAYERS = [
  { id: "population", label: "Countries (size ∝ population)" }, { id: "events", label: "Events" }, { id: "cities", label: "Major cities" }, { id: "quakes", label: "Earthquakes (USGS)" }, { id: "daynight", label: "Day / night" }, { id: "hazards", label: "Natural hazards (NASA EONET)" }, { id: "launches", label: "Launch pads (upcoming)" }, { id: "aircraft", label: "Aircraft (OpenSky, partial)", lazy: true }, { id: "iss", label: "International Space Station", lazy: true },
  { id: "_conflict", label: "Conflict zones", planned: true }, { id: "_shipping", label: "Shipping routes", planned: true }, { id: "_energy", label: "Energy infrastructure", planned: true }, { id: "_weather", label: "Weather", planned: true },
];
export async function render(el, arg) {
  fill(el, head("Orbis", "Interactive world model"), loading());
  const [co, ci, ev, qk, gj, hz, ln] = await Promise.allSettled([api.countries(), api.cities(), api.events({ sort: "time" }), api.quakes(), api.geo(), api.hazards(), api.launches()]);
  const HZ = hz.status === "fulfilled" && hz.value.available ? hz.value.hazards : [], LN = ln.status === "fulfilled" && ln.value.available ? ln.value.launches.filter((l) => l.lat != null) : [];
  if (co.status !== "fulfilled") throw co.reason;
  const C = co.value.countries, CI = ci.status === "fulfilled" ? ci.value.cities : [], E = ev.status === "fulfilled" ? ev.value.events : [], Q = qk.status === "fulfilled" && qk.value.available !== false ? qk.value.quakes : [], G = gj.status === "fulfilled" && gj.value.available ? gj.value : null;
  const eref0 = (e) => ({ title: e.title, sub: `${e.category} · ${e.source} · ${fmt.ago(e.time)}`, href: "#/live/" + encodeURIComponent(e.id), status: e.meta && e.meta.status });
  const host = h("div", { class: "globe-wrap", style: { height: "min(70vh, 640px)", minHeight: "340px" } }), layersEl = h("div", { class: "layers" });
  const evMarks = E.flatMap((e) => (e.lat != null ? [{ lat: e.lat, lon: e.lon, severity: e.severity, sample: e.kind === "sample", ref: eref0(e) }] : (e.countries || []).map((iso) => { const c = C.find((x) => x.iso2 === iso); return c ? { lat: c.lat, lon: c.lon, severity: e.severity, sample: e.kind === "sample", ref: eref0(e) } : null; }).filter(Boolean)));
  const selectCountry = (iso, focus) => {
    store.selectedCountry = iso; if (!iso) { closeDrawer(); return; }
    const c = C.find((x) => x.iso2 === iso); if (!c) return;
    history.replaceState(null, "", "#/orbis/" + iso); globe.select(iso, focus);
    openDrawer(c.name, h("div", null, h("button", { style: { marginBottom: "8px" }, onclick: (e) => { toggleCountryWatch(iso); e.target.textContent = store.countryWatch.has(iso) ? "★ Following" : "☆ Follow"; } }, store.countryWatch.has(iso) ? "★ Following" : "☆ Follow"), countryPanel(c, { events: E.filter((e) => (e.countries || []).includes(iso)) })), () => { globe.select(null); history.replaceState(null, "", "#/orbis"); });
  };
  const globe = new Globe(host, { countries: C, geo: G && G.geo, onPick: (iso) => selectCountry(iso, false), onMarker: (m) => openDrawer("Record", h("div", null, h("div", { class: "row", style: { marginBottom: "6px" } }, m.ref.status ? h("span", { class: "pill " + m.ref.status }, m.ref.status) : null), h("h3", { style: { margin: "4px 0" } }, m.ref.title), h("p", { class: "small t2" }, m.ref.sub), m.ref.href ? h("a", { href: m.ref.href }, "Open details →") : null)) });
  const live = { aircraft: [], iss: [] }, mk = (kind, list) => list;
  const eref = (e) => ({ title: e.title, sub: `${e.category} · ${e.source} · ${fmt.ago(e.time)}`, href: "#/live/" + encodeURIComponent(e.id), status: e.meta && e.meta.status });
  const pushMarkers = () => globe.setMarkers({ events: evMarks, cities: CI, quakes: Q.map((q) => ({ lat: q.lat, lon: q.lon, mag: q.magnitude, ref: eref(q) })), hazards: HZ.map((e) => ({ lat: e.lat, lon: e.lon, ref: eref(e) })), launches: LN.map((l) => ({ lat: l.lat, lon: l.lon, ref: { title: l.name, sub: `NET ${fmt.datetime(l.net)} · ${l.location}`, href: "#/space", status: l.meta.status } })), aircraft: live.aircraft, iss: live.iss });
  pushMarkers();
  const drawLayers = () => { const on = {}; LAYERS.forEach((l) => (on[l.id] = store.layers.has(l.id) || (l.id === "daynight" && store.layers.has("daynight")))); globe.setLayers(on);
    fill(layersEl, LAYERS.map((l) => h("label", { class: l.planned ? "dis" : "", title: l.planned ? "Planned: no data provider connected yet" : "" }, h("input", { type: "checkbox", checked: store.layers.has(l.id), disabled: !!l.planned || (l.id === "quakes" && !Q.length) || (l.id === "hazards" && !HZ.length) || (l.id === "launches" && !LN.length), onchange: () => toggleLayer(l.id) }), l.label, l.planned ? h("span", { class: "pill UNAVAILABLE", style: { marginLeft: "auto" } }, "PLANNED") : l.id === "hazards" && !HZ.length ? h("span", { class: "pill UNAVAILABLE", style: { marginLeft: "auto" } }, "NO DATA") : l.id === "launches" && !LN.length ? h("span", { class: "pill UNAVAILABLE", style: { marginLeft: "auto" } }, "NO DATA") : l.id === "quakes" && !Q.length ? h("span", { class: "pill UNAVAILABLE", style: { marginLeft: "auto" } }, "NO DATA") : l.id === "events" && E.every((e) => e.kind === "sample") ? h("span", { class: "pill DEMO", style: { marginLeft: "auto" } }, "SAMPLE") : null))); };
  let issTimer = null, acLoaded = false;
  const lazy = async () => {
    if (store.layers.has("aircraft") && !acLoaded) { acLoaded = true; try { const A = await api.aircraft(); live.aircraft = A.available ? A.aircraft.map((a) => ({ lat: a.lat, lon: a.lon, ref: { title: a.callsign || a.icao24, sub: `${a.country} · ${a.altitudeM != null ? Math.round(a.altitudeM) + " m" : "alt n/a"} · ADS-B snapshot`, status: a.meta.status } })) : []; if (!A.available) toast("Aircraft unavailable: " + A.error, "err"); pushMarkers(); } catch (e) { acLoaded = false; } }
    if (store.layers.has("iss") && !issTimer) { const tick = async () => { try { const I = await api.iss(); live.iss = I.available ? [{ lat: I.lat, lon: I.lon, ref: { title: "International Space Station", sub: `${Math.round(I.altitudeKm)} km · ${Math.round(I.velocityKmh)} km/h · ${fmt.ago(I.time)}`, href: "#/space", status: I.meta.status } }] : []; pushMarkers(); } catch {} }; tick(); issTimer = setInterval(tick, 10000); }
    if (!store.layers.has("iss") && issTimer) { clearInterval(issTimer); issTimer = null; }
  };
  const unsub = subscribe(() => { drawLayers(); lazy(); }); drawLayers(); lazy();
  const sel = h("select", { "aria-label": "Select country", onchange: (e) => selectCountry(e.target.value || null, true) }, h("option", { value: "" }, "Select a country…"), [...C].sort((a, b) => a.name.localeCompare(b.name)).map((c) => h("option", { value: c.iso2 }, c.flag + " " + c.name)));
  const ctl = h("div", { class: "globe-ctl" }, h("button", { onclick: () => globe.zoomBy(1.3), "aria-label": "Zoom in" }, "+"), h("button", { onclick: () => globe.zoomBy(1 / 1.3), "aria-label": "Zoom out" }, "−"), h("button", { onclick: () => { globe.zoom = 1; globe.focus(20, 20); }, "aria-label": "Reset view" }, "⟲"));
  const noGeo = !G;
  host.append(ctl, h("div", { class: "globe-leg" }, noGeo ? "Country boundaries unavailable: coarse continent outlines are decorative; click selects the nearest reference country." : "Boundaries: Natural Earth. Drag to rotate · wheel to zoom · click a country."));
  fill(el, head("Orbis", "Interactive world model", co.value.meta, sel),
    h("div", { class: "grid gside" }, host, h("div", null, box("Layers", layersEl), h("div", { style: { height: "10px" } }), box("About", h("p", { class: "small t2" }, "Globe markers show reference countries; DEMO-labelled figures are approximate. Layers marked PLANNED have no data source wired in yet and are deliberately not simulated.")))));
  if (arg) setTimeout(() => selectCountry(arg.toUpperCase(), true), 50);
  return () => { unsub(); if (issTimer) clearInterval(issTimer); globe.destroy(); };
}
