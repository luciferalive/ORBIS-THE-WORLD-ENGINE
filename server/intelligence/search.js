export function buildIndex({ countries, cities, assets, industries, commodities, events }) {
  const items = [];
  for (const c of countries) items.push({ type: "country", id: c.iso2, label: c.name, sub: c.region, route: "#/orbis/" + c.iso2, keys: [c.name, c.iso2, c.iso3, c.currency] });
  for (const c of cities) items.push({ type: "city", id: c.name, label: c.name, sub: c.iso2, route: "#/civilization/city/" + encodeURIComponent(c.name), keys: [c.name] });
  for (const a of assets) items.push({ type: a.class === "crypto" ? "crypto" : a.class === "stock" ? "stock" : a.class, id: a.id, label: a.name, sub: a.symbol, route: "#/markets/" + a.id, keys: [a.name, a.symbol] });
  for (const i of industries) items.push({ type: "industry", id: i, label: i, sub: "Industry", route: "#/connections/industry:" + i.toLowerCase().replace(/[^a-z0-9]+/g, "-"), keys: [i] });
  for (const k of commodities) items.push({ type: "commodity", id: k, label: k, sub: "Resource", route: "#/resources/" + encodeURIComponent(k), keys: [k] });
  for (const e of events.slice(0, 80)) items.push({ type: "event", id: e.id, label: e.title, sub: e.source, route: "#/world-live/" + encodeURIComponent(e.id), keys: [e.title, ...(e.tags || [])] });
  return items;
}
export function search(items, q, limit = 20) {
  q = String(q || "").trim().toLowerCase(); if (!q) return [];
  const scored = [];
  for (const it of items) {
    let best = 0;
    for (const k of it.keys) { const s = String(k || "").toLowerCase(); if (!s) continue; if (s === q) best = Math.max(best, 100); else if (s.startsWith(q)) best = Math.max(best, 80); else if (s.split(/\W+/).some((w) => w.startsWith(q))) best = Math.max(best, 60); else if (s.includes(q)) best = Math.max(best, 40); }
    if (best) scored.push({ ...it, score: best - (it.type === "event" ? 10 : 0) });
  }
  return scored.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label)).slice(0, limit).map(({ keys, score, ...r }) => r);
}
