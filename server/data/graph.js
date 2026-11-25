// Knowledge-graph builder. Relations come from the bundled reference data (labelled REFERENCE), never invented per request.
import { COUNTRIES, INDUSTRIES, COMMODITY_FACTS } from "./reference.js";
import { defOf } from "./demo.js";
const ASSET_COMMODITY = { xau: "Gold", xag: "Silver", wti: "Oil", brent: "Oil", ng: "Natural gas", hg: "Copper", li: "Lithium", u3o8: "Uranium", zw: "Wheat", zc: "Corn" };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
export function buildGraph(assetsList, events = []) {
  const nodes = new Map(), edges = [];
  const node = (id, type, label, extra = {}) => { if (!nodes.has(id)) nodes.set(id, { id, type, label, ...extra }); return id; };
  const edge = (a, b, rel) => edges.push({ a, b, rel });
  for (const c of COUNTRIES) node("country:" + c.iso2, "country", c.name, { iso2: c.iso2 });
  for (const i of INDUSTRIES) node("industry:" + slug(i), "industry", i);
  for (const k of Object.keys(COMMODITY_FACTS)) node("commodity:" + slug(k), "commodity", k);
  for (const c of COUNTRIES) {
    for (const i of c.industries) { const id = "industry:" + slug(i); if (!nodes.has(id)) node(id, "industry", i); edge("country:" + c.iso2, id, "has industry"); }
  }
  for (const [k, f] of Object.entries(COMMODITY_FACTS)) for (const p of f.producers) { const c = COUNTRIES.find((x) => x.name === p); if (c) edge("country:" + c.iso2, "commodity:" + slug(k), "major producer"); }
  const sectorOf = { Technology: "Technology", Semiconductors: "Semiconductors", Energy: "Energy", Finance: "Finance", Automotive: "Automotive", Pharmaceuticals: "Pharmaceuticals", Consumer: "Manufacturing" };
  for (const a of assetsList) {
    const d = defOf(a.id);
    if (a.class === "stock") { const cid = node("company:" + a.id, "company", a.name, { symbol: a.symbol }); const ind = sectorOf[a.sector]; if (ind) edge("industry:" + slug(ind), cid, "includes company"); edge(cid, "market:" + a.id, "trades as"); node("market:" + a.id, "market", a.symbol + " (" + a.name + ")", { assetId: a.id }); }
    else if (ASSET_COMMODITY[a.id]) { node("market:" + a.id, "market", a.symbol + " (" + a.name + ")", { assetId: a.id }); edge("commodity:" + slug(ASSET_COMMODITY[a.id]), "market:" + a.id, "priced by market"); }
  }
  edge("commodity:oil", "industry:energy", "feeds industry"); edge("commodity:natural-gas", "industry:energy", "feeds industry"); edge("commodity:lithium", "industry:automotive", "feeds industry"); edge("commodity:uranium", "industry:energy", "feeds industry"); edge("commodity:copper", "industry:technology", "feeds industry"); edge("commodity:wheat", "industry:agriculture", "feeds industry"); edge("commodity:corn", "industry:agriculture", "feeds industry");
  for (const e of events.slice(0, 40)) {
    const id = node("event:" + e.id, "event", e.title.slice(0, 70), { time: e.time, kind: e.kind });
    for (const cc of e.countries) if (nodes.has("country:" + cc)) edge(id, "country:" + cc, "affects country");
    for (const cm of e.commodities) if (nodes.has("commodity:" + slug(cm))) edge(id, "commodity:" + slug(cm), "affects commodity");
    for (const ind of e.industries) if (nodes.has("industry:" + slug(ind))) edge(id, "industry:" + slug(ind), "affects industry");
    for (const as of e.assets) if (nodes.has("market:" + as)) edge(id, "market:" + as, "affects market");
  }
  const seen = new Set(), uniq = edges.filter((e) => { if (!nodes.has(e.a) || !nodes.has(e.b)) return false; const k = e.a + "|" + e.b + "|" + e.rel; if (seen.has(k)) return false; seen.add(k); return true; });
  return { nodes: [...nodes.values()], edges: uniq };
}
export function neighbourhood(graph, focus, { depth = 2, types = null, limit = 60 } = {}) {
  const adj = new Map(); for (const e of graph.edges) { if (types && !types.includes(e.rel)) continue; (adj.get(e.a) || adj.set(e.a, []).get(e.a)).push([e.b, e]); (adj.get(e.b) || adj.set(e.b, []).get(e.b)).push([e.a, e]); }
  const byId = new Map(graph.nodes.map((n) => [n.id, n])); if (!byId.has(focus)) return null;
  const dist = new Map([[focus, 0]]), q = [focus], used = [];
  while (q.length && dist.size < limit) { const cur = q.shift(); if (dist.get(cur) >= depth) continue; for (const [nb, e] of adj.get(cur) || []) { if (!dist.has(nb)) { if (dist.size >= limit) break; dist.set(nb, dist.get(cur) + 1); q.push(nb); } if (dist.has(nb)) used.push(e); } }
  const ids = new Set(dist.keys()), eset = new Set();
  const edges = used.filter((e) => ids.has(e.a) && ids.has(e.b)).filter((e) => { const k = e.a + e.b + e.rel; if (eset.has(k)) return false; eset.add(k); return true; });
  return { focus, nodes: [...ids].map((id) => ({ ...byId.get(id), depth: dist.get(id) })), edges, truncated: dist.size >= limit };
}
