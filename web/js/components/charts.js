// SVG charts: line/area (multi-series, bands, tooltip), sparkline, bars. Dependency-free.
import { h, svg, fmt } from "./ui.js";
const NS = (n) => Number.isFinite(n);
function tipEl() { let t = document.querySelector(".tip"); if (!t) { t = h("div", { class: "tip" }); t.hidden = true; document.body.append(t); } return t; }
export function sparkline(values, { w = 90, h: hh = 26, color } = {}) {
  const v = values.filter(NS); if (v.length < 2) return h("span", { class: "muted small" }, "no history");
  const lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1, up = v[v.length - 1] >= v[0], c = color || (up ? "var(--green)" : "var(--red)");
  const pts = v.map((y, i) => `${((i / (v.length - 1)) * w).toFixed(1)},${(hh - 2 - ((y - lo) / r) * (hh - 4)).toFixed(1)}`).join(" ");
  return svg("svg", { width: w, height: hh, viewBox: `0 0 ${w} ${hh}`, "aria-hidden": "true" }, svg("polyline", { points: pts, fill: "none", stroke: c, "stroke-width": 1.4 }));
}
/** series: [{name,color,points:[{x,y}],dashed?}], bands: [{upper:[{x,y}],lower:[{x,y}],color}] */
export function lineChart({ series, bands = [], height = 240, xFmt = (x) => x, yFmt = (y) => fmt.num(y), xIsTime = false, markers = [] }) {
  const W = 760, H = height, m = { l: 58, r: 12, t: 10, b: 24 };
  const all = [...series.flatMap((s) => s.points), ...bands.flatMap((b) => [...b.upper, ...b.lower])].filter((p) => NS(p.x) && NS(p.y));
  const wrap = h("div", { style: { position: "relative" } });
  if (all.length < 2) { wrap.append(h("div", { class: "state" }, "No data to chart.")); return wrap; }
  let x0 = Math.min(...all.map((p) => p.x)), x1 = Math.max(...all.map((p) => p.x)), y0 = Math.min(...all.map((p) => p.y)), y1 = Math.max(...all.map((p) => p.y));
  const pad = (y1 - y0) * 0.06 || Math.abs(y1) * 0.05 || 1; y0 -= pad; y1 += pad;
  const X = (x) => m.l + ((x - x0) / (x1 - x0 || 1)) * (W - m.l - m.r), Y = (y) => m.t + (1 - (y - y0) / (y1 - y0)) * (H - m.t - m.b);
  const s = svg("svg", { class: "chart", viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none", role: "img", style: `height:${H}px` });
  for (let i = 0; i <= 4; i++) { const y = y0 + ((y1 - y0) * i) / 4; s.append(svg("line", { x1: m.l, x2: W - m.r, y1: Y(y), y2: Y(y), stroke: "#222B36", "stroke-width": 1 }), svg("text", { x: m.l - 6, y: Y(y) + 3, "text-anchor": "end" }, yFmt(y))); }
  for (let i = 0; i <= 4; i++) { const x = x0 + ((x1 - x0) * i) / 4; s.append(svg("text", { x: X(x), y: H - 6, "text-anchor": i === 0 ? "start" : i === 4 ? "end" : "middle" }, xIsTime ? fmtTime(x, x1 - x0) : xFmt(x))); }
  const path = (pts) => pts.filter((p) => NS(p.y)).map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join("");
  for (const b of bands) { const up = b.upper, lo = [...b.lower].reverse(); s.append(svg("path", { d: path(up) + path(lo).replace("M", "L") + "Z", fill: b.color || "#A68BFA", opacity: 0.16 })); }
  for (const sr of series) s.append(svg("path", { d: path(sr.points), fill: "none", stroke: sr.color || "var(--blue)", "stroke-width": 1.6, "stroke-dasharray": sr.dashed ? "5 4" : null }));
  for (const mk of markers) s.append(svg("line", { x1: X(mk.x), x2: X(mk.x), y1: m.t, y2: H - m.b, stroke: "var(--muted)", "stroke-dasharray": "3 3" }), svg("text", { x: X(mk.x) + 4, y: m.t + 10 }, mk.label));
  const cross = svg("line", { y1: m.t, y2: H - m.b, stroke: "var(--text2)", "stroke-width": 1, opacity: 0 }); s.append(cross);
  const tip = tipEl();
  s.addEventListener("mousemove", (e) => {
    const r = s.getBoundingClientRect(), x = x0 + ((((e.clientX - r.left) / r.width) * W - m.l) / (W - m.l - m.r)) * (x1 - x0);
    cross.setAttribute("opacity", 1); const cx = X(Math.max(x0, Math.min(x1, x))); cross.setAttribute("x1", cx); cross.setAttribute("x2", cx);
    const lines = series.map((sr) => { let best = null; for (const p of sr.points) if (NS(p.y) && (!best || Math.abs(p.x - x) < Math.abs(best.x - x))) best = p; return best ? `<span style="color:${sr.color || "#65A9FF"}">●</span> ${sr.name ? sr.name + " " : ""}${yFmt(best.y)}` : ""; });
    tip.hidden = false; tip.innerHTML = `<div class="t2">${xIsTime ? new Date(x).toISOString().slice(0, 16).replace("T", " ") : xFmt(Math.round(x))}</div>` + lines.join("<br>"); tip.style.left = Math.min(innerWidth - 180, e.clientX + 14) + "px"; tip.style.top = e.clientY + 14 + "px";
  });
  s.addEventListener("mouseleave", () => { tip.hidden = true; cross.setAttribute("opacity", 0); });
  wrap.append(s);
  if (series.length > 1 || bands.length) wrap.append(h("div", { class: "row small t2", style: { padding: "2px 0 0 58px" } }, series.filter((x) => x.name).map((x) => h("span", null, h("span", { style: { color: x.color } }, "━ "), x.name)), bands.map((b) => b.name ? h("span", null, h("span", { style: { color: b.color } }, "▮ "), b.name) : null)));
  return wrap;
}
function fmtTime(t, span) { const d = new Date(t); return span < 2 * 86400e3 ? d.toISOString().slice(11, 16) : span < 800 * 86400e3 ? d.toISOString().slice(5, 10) : String(d.getUTCFullYear()); }
export function barChart({ items, height = 180, color = "var(--blue)", fmtV = (v) => fmt.compact(v), horizontal = false }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (horizontal) return h("div", null, items.map((i) => h("div", { style: { display: "grid", gridTemplateColumns: "120px 1fr 70px", gap: "8px", alignItems: "center", padding: "2px 0" } }, h("span", { class: "t2 small", style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, i.label), h("div", { class: "bar" }, h("i", { style: { width: (i.value / max) * 100 + "%", background: i.color || color } })), h("span", { class: "mono small right" }, fmtV(i.value)))));
  const W = 760, H = height, bw = W / items.length, s = svg("svg", { class: "chart", viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none", style: `height:${H}px` });
  items.forEach((i, k) => { const bh = (i.value / max) * (H - 36); s.append(svg("rect", { x: k * bw + 4, y: H - 20 - bh, width: bw - 8, height: bh, fill: i.color || color }), svg("text", { x: k * bw + bw / 2, y: H - 6, "text-anchor": "middle" }, i.label), svg("text", { x: k * bw + bw / 2, y: H - 24 - bh, "text-anchor": "middle" }, fmtV(i.value))); });
  return s;
}
