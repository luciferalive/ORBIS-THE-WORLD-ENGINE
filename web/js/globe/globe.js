// Dependency-free canvas orthographic globe: drag to rotate, wheel/pinch zoom, inertia, click picking,
// graticule, day/night terminator (computed from UTC), country polygons when available, markers.
import { CONTINENTS } from "./continents.js";
const D2R = Math.PI / 180;

export function sunPosition(date = new Date()) {
  const d = date.getTime() / 86400000 - 10957.5; // days since J2000
  const g = (357.529 + 0.98560028 * d) * D2R, q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R, e = (23.439 - 0.00000036 * d) * D2R;
  const dec = Math.asin(Math.sin(e) * Math.sin(L)), ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24, lon = ((ra / D2R) - gmst * 15 + 540) % 360 - 180;
  return { lat: dec / D2R, lon: lon < -180 ? lon + 360 : lon };
}
/** point (lon,lat) -> {x,y,z} unit vector rotated so that centre (clon,clat) faces the viewer */
export function project(lon, lat, clon, clat) {
  const l = lon * D2R, p = lat * D2R, l0 = clon * D2R, p0 = clat * D2R;
  const cp = Math.cos(p), x = cp * Math.sin(l - l0), z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * cp * Math.cos(l - l0);
  const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * cp * Math.cos(l - l0);
  return { x, y, z };
}
export function invert(px, py, clon, clat) { // screen (unit-disc coords) -> lon/lat or null
  const r2 = px * px + py * py; if (r2 > 1) return null;
  const z = Math.sqrt(1 - r2), p0 = clat * D2R;
  const lat = Math.asin(z * Math.sin(p0) + py * Math.cos(p0)), lon = clon * D2R + Math.atan2(px, z * Math.cos(p0) - py * Math.sin(p0));
  return { lon: ((lon / D2R + 540) % 360) - 180, lat: lat / D2R };
}
export function pointInRing(lon, lat, ring) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c; } return c; }

export class Globe {
  /** opts: {onPick(iso2|null), countries:[{iso2,lat,lon,name}], geo: FeatureCollection|null} */
  constructor(host, opts) {
    this.host = host; this.opts = opts; this.clon = 20; this.clat = 20; this.zoom = 1; this.vlon = 0.04; this.drag = null; this.layers = {}; this.markers = {}; this.selected = null; this.hover = null; this.auto = true; this.raf = 0; this.last = 0;
    this.canvas = document.createElement("canvas"); this.canvas.setAttribute("role", "img"); this.canvas.setAttribute("aria-label", "Interactive globe. Drag to rotate, scroll to zoom, click a country to select.");
    this.canvas.tabIndex = 0; host.append(this.canvas); this.ctx = this.canvas.getContext("2d"); this.geo = opts.geo || null; this.prep();
    this.resize = () => { const r = host.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); this.w = r.width; this.h = r.height; this.canvas.width = r.width * dpr; this.canvas.height = r.height * dpr; this.dpr = dpr; };
    this.ro = new ResizeObserver(this.resize); this.ro.observe(host); this.resize(); this.bind(); this.loop = this.loop.bind(this); this.raf = requestAnimationFrame(this.loop);
  }
  prep() { // flatten polygons for drawing and picking
    this.polys = [];
    if (this.geo && this.geo.features) for (const f of this.geo.features) { const iso = f.properties && (f.properties.iso2 || f.properties.ISO_A2 || f.properties.iso_a2), g = f.geometry; if (!g) continue; const parts = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []; for (const rings of parts) this.polys.push({ iso, name: f.properties && (f.properties.name || f.properties.NAME), ring: rings[0] }); }
  }
  setLayers(l) { this.layers = l; this.draw(); }
  setMarkers(m) { this.markers = m; this.draw(); }
  select(iso, focus = true) { this.selected = iso; if (iso && focus) { const c = this.opts.countries.find((x) => x.iso2 === iso); if (c) this.focus(c.lon, c.lat); } this.draw(); }
  focus(lon, lat) { this.auto = false; this.target = { lon, lat }; }
  zoomBy(f) { this.zoom = Math.max(0.7, Math.min(6, this.zoom * f)); this.draw(); }
  destroy() { cancelAnimationFrame(this.raf); this.ro.disconnect(); this.canvas.remove(); }
  get R() { return (Math.min(this.w, this.h) / 2 - 8) * this.zoom; }
  toScreen(lon, lat) { const p = project(lon, lat, this.clon, this.clat); return { sx: this.w / 2 + p.x * this.R, sy: this.h / 2 - p.y * this.R, z: p.z }; }
  bind() {
    const c = this.canvas; let moved = 0, pts = new Map(), pinch = 0;
    c.addEventListener("pointerdown", (e) => { c.setPointerCapture(e.pointerId); pts.set(e.pointerId, e); moved = 0; this.drag = { x: e.clientX, y: e.clientY }; this.auto = false; this.vlon = 0; if (pts.size === 2) pinch = 0; });
    c.addEventListener("pointermove", (e) => {
      const rect = c.getBoundingClientRect();
      if (pts.has(e.pointerId)) { pts.set(e.pointerId, e);
        if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); if (pinch) this.zoomBy(d / pinch); pinch = d; return; }
        const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y; moved += Math.abs(dx) + Math.abs(dy); const k = 0.25 / this.zoom; this.clon -= dx * k; this.clat = Math.max(-85, Math.min(85, this.clat + dy * k)); this.vlon = -dx * k * 0.5; this.drag = { x: e.clientX, y: e.clientY }; this.target = null; this.draw();
      } else { const mx = e.clientX - rect.left, my = e.clientY - rect.top, mk = this.pickMarker(mx, my), iso = mk ? null : this.pick(mx, my); c.style.cursor = mk || iso ? "pointer" : "grab"; if (iso !== this.hover) { this.hover = iso; this.draw(); } }
    });
    const up = (e) => { const was = pts.has(e.pointerId); pts.delete(e.pointerId); if (!was) return; if (moved < 5 && pts.size === 0) { const rect = c.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top; const mk = this.pickMarker(mx, my); if (mk && this.opts.onMarker) { this.opts.onMarker(mk.m, mk.kind); return; } const iso = this.pick(mx, my); this.selected = iso; this.opts.onPick && this.opts.onPick(iso); this.draw(); } };
    c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
    c.addEventListener("wheel", (e) => { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
    c.addEventListener("keydown", (e) => { const s = 6 / this.zoom; if (e.key === "ArrowLeft") this.clon -= s; else if (e.key === "ArrowRight") this.clon += s; else if (e.key === "ArrowUp") this.clat = Math.min(85, this.clat + s); else if (e.key === "ArrowDown") this.clat = Math.max(-85, this.clat - s); else if (e.key === "+" || e.key === "=") this.zoomBy(1.2); else if (e.key === "-") this.zoomBy(1 / 1.2); else return; this.auto = false; e.preventDefault(); this.draw(); });
  }
  /** Nearest visible marker (of enabled layers) within 9px of the pointer, or null. */
  pickMarker(mx, my) {
    let best = null, bd = 81;
    for (const [kind, list] of Object.entries(this.markers)) { if (!this.layers[kind] || !Array.isArray(list)) continue;
      for (const m of list) { if (!m.ref) continue; const s = this.toScreen(m.lon, m.lat); if (s.z <= 0.05) continue; const d = (s.sx - mx) ** 2 + (s.sy - my) ** 2; if (d < bd) { bd = d; best = { kind, m }; } } }
    return best;
  }
  pick(mx, my) {
    const px = (mx - this.w / 2) / this.R, py = -(my - this.h / 2) / this.R, ll = invert(px, py, this.clon, this.clat); if (!ll) return null;
    if (this.polys.length) { for (const p of this.polys) if (p.iso && pointInRing(ll.lon, ll.lat, p.ring)) return p.iso; }
    let best = null, bd = 1e9; // fallback: nearest reference country within ~9deg (great-circle approx)
    for (const c of this.opts.countries) { const dl = Math.min(Math.abs(c.lon - ll.lon), 360 - Math.abs(c.lon - ll.lon)) * Math.cos(ll.lat * D2R), dd = Math.hypot(dl, c.lat - ll.lat); if (dd < bd) { bd = dd; best = c.iso2; } }
    return bd < 9 / Math.sqrt(this.zoom) ? best : null;
  }
  loop(t) {
    const dt = Math.min(64, t - this.last || 16); this.last = t;
    if (this.target) { let d = this.target.lon - this.clon; d = ((d + 540) % 360) - 180; this.clon += d * 0.12; this.clat += (this.target.lat - this.clat) * 0.12; if (Math.abs(d) < 0.1 && Math.abs(this.target.lat - this.clat) < 0.1) this.target = null; this.draw(); }
    else if (!this.drag || !this.canvas.hasPointerCapture) { if (this.auto) { this.clon += 0.012 * dt; this.draw(); } else if (Math.abs(this.vlon) > 0.003) { this.clon += this.vlon; this.vlon *= 0.94; this.draw(); } }
    this.raf = requestAnimationFrame(this.loop);
  }
  ring(ctx, ring, fillIt) { let started = false, prevVis = false; ctx.beginPath(); for (const [lo, la] of ring) { const s = this.toScreen(lo, la), vis = s.z > 0; if (vis) { if (!started || !prevVis) ctx.moveTo(s.sx, s.sy); else ctx.lineTo(s.sx, s.sy); started = true; } prevVis = vis; } if (fillIt) ctx.fill(); ctx.stroke(); }
  draw() {
    const { ctx, w, h, dpr } = this; if (!w) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = this.R;
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R); g.addColorStop(0, "#062a30"); g.addColorStop(1, "#03100f");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.strokeStyle = "#2fe6a0"; ctx.lineWidth = 1; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
    // graticule
    ctx.strokeStyle = "rgba(57,255,156,.16)"; ctx.lineWidth = 0.6;
    for (let lo = -180; lo < 180; lo += 30) this.ring(ctx, Array.from({ length: 73 }, (_, i) => [lo, -90 + i * 2.5]), false);
    for (let la = -60; la <= 60; la += 30) this.ring(ctx, Array.from({ length: 145 }, (_, i) => [-180 + i * 2.5, la]), false);
    // land
    ctx.lineWidth = 0.8;
    if (this.polys.length) { for (const p of this.polys) { const sel = p.iso && p.iso === this.selected, hov = p.iso && p.iso === this.hover; ctx.fillStyle = sel ? "#0f6b52" : hov ? "#0d4d40" : "#0a3029"; ctx.strokeStyle = sel ? "#39ff9c" : "#1f8f6a"; this.ring(ctx, p.ring, true); } }
    else { ctx.fillStyle = "#0c3a33"; ctx.strokeStyle = "#39ff9c"; for (const ring of Object.values(CONTINENTS)) this.ring(ctx, [...ring, ring[0]], true); }
    // night side: shade 4-degree cells whose centre is below the sun's horizon
    if (this.layers.daynight) {
      const sun = sunPosition(), sv = project(sun.lon, sun.lat, 0, 0); ctx.fillStyle = "rgba(2,5,10,0.5)";
      for (let la = -88; la < 88; la += 4) for (let lo = -180; lo < 180; lo += 4) {
        const c = project(lo + 2, la + 2, 0, 0); if (c.x * sv.x + c.y * sv.y + c.z * sv.z >= 0) continue;
        const q = [[lo, la], [lo + 4, la], [lo + 4, la + 4], [lo, la + 4]].map(([x, y]) => this.toScreen(x, y)); if (q.some((p) => p.z <= 0)) continue;
        ctx.beginPath(); ctx.moveTo(q[0].sx, q[0].sy); for (let i = 1; i < 4; i++) ctx.lineTo(q[i].sx, q[i].sy); ctx.closePath(); ctx.fill();
      }
    }
    // markers
    const draw = (list, color, rf) => { for (const m of list) { const s = this.toScreen(m.lon, m.lat); if (s.z <= 0.02) continue; ctx.fillStyle = color(m); ctx.beginPath(); ctx.arc(s.sx, s.sy, rf(m), 0, 7); ctx.fill(); } };
    if (this.layers.population) draw(this.opts.countries, (c) => (c.iso2 === this.selected ? "#65A9FF" : "rgba(160,190,230,.55)"), (c) => (c.iso2 === this.selected ? 4.5 : 1.5 + Math.log10(c.population / 1e6 + 1) * 0.9));
    if (this.layers.cities && this.markers.cities) draw(this.markers.cities, () => "#F0B65C", (c) => 1.5 + Math.log10(c.population / 1e6 + 1));
    if (this.layers.events && this.markers.events) draw(this.markers.events, (e) => (e.sample ? "rgba(240,182,92,.85)" : e.severity >= 4 ? "#FF5F65" : "#F0B65C"), (e) => 2.5 + (e.severity || 1) * 0.7);
    if (this.layers.quakes && this.markers.quakes) draw(this.markers.quakes, () => "#FF5F65", (q) => 1.5 + Math.max(0, q.mag - 3) * 1.3);
    if (this.layers.hazards && this.markers.hazards) draw(this.markers.hazards, () => "#A68BFA", () => 3);
    if (this.layers.aircraft && this.markers.aircraft) draw(this.markers.aircraft, () => "rgba(154,209,255,.8)", () => 1.3);
    if (this.layers.launches && this.markers.launches) draw(this.markers.launches, () => "#55D6A7", () => 3.5);
    if (this.layers.iss && this.markers.iss) for (const m of this.markers.iss) { const s = this.toScreen(m.lon, m.lat); if (s.z <= 0) continue; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(s.sx, s.sy, 6, 0, 7); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s.sx, s.sy, 2.5, 0, 7); ctx.fill(); }
    ctx.restore();
    // labels for selected/hover
    for (const iso of [this.selected, this.hover]) { const c = iso && this.opts.countries.find((x) => x.iso2 === iso); if (!c) continue; const s = this.toScreen(c.lon, c.lat); if (s.z <= 0.05) continue; ctx.font = "11px Inter, sans-serif"; ctx.fillStyle = "#E8EDF3"; ctx.strokeStyle = "#07090D"; ctx.lineWidth = 3; ctx.strokeText(c.name, s.sx + 7, s.sy - 6); ctx.fillText(c.name, s.sx + 7, s.sy - 6); }
  }
}
