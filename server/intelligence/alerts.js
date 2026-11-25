// Stateless alert-rule evaluation. Rules live with the user (browser) because ORBIS has no accounts yet;
// the server only evaluates them against current data so thresholds stay consistent with what the UI shows.
export const RULE_TYPES = ["asset_change", "asset_price", "event", "quake"];
const OPS = { ">": (a, b) => a > b, "<": (a, b) => a < b };
export function validateRule(r) {
  if (!r || typeof r !== "object") return "rule must be an object";
  if (!RULE_TYPES.includes(r.type)) return "unknown rule type";
  if (typeof r.id !== "string" || !r.id || r.id.length > 64) return "rule needs an id";
  if (r.type === "asset_change" || r.type === "asset_price") { if (typeof r.asset !== "string") return "asset required"; if (!(r.op in OPS)) return "op must be > or <"; if (!Number.isFinite(r.value)) return "numeric value required"; }
  if (r.type === "event" && r.minSeverity != null && !(r.minSeverity >= 1 && r.minSeverity <= 5)) return "minSeverity must be 1-5";
  if (r.type === "quake" && !Number.isFinite(r.minMagnitude)) return "minMagnitude required";
  return null;
}
/** ctx: {assets, events, quakes}. Returns triggered [{ruleId, title, detail, dataStatus, at, key}] (key = dedupe key). */
export function evaluate(rules, ctx) {
  const out = [], now = new Date().toISOString();
  for (const r of rules.slice(0, 50)) {
    if (validateRule(r)) continue;
    if (r.type === "asset_change" || r.type === "asset_price") {
      const a = ctx.assets.find((x) => x.id === r.asset); if (!a) continue;
      const v = r.type === "asset_change" ? a.changePct : a.price;
      if (Number.isFinite(v) && OPS[r.op](v, r.value)) out.push({ ruleId: r.id, title: `${a.name} ${r.type === "asset_change" ? "change" : "price"} ${r.op} ${r.value}`, detail: `${a.name}: ${r.type === "asset_change" ? v.toFixed(2) + "%" : v}`, dataStatus: a.meta.status, at: now, key: `${r.id}:${a.id}:${new Date().toISOString().slice(0, 13)}` });
    } else if (r.type === "event") {
      for (const e of ctx.events) { if (e.kind === "sample") continue; if (e.severity >= (r.minSeverity || 1) && (!r.category || e.category === r.category) && (!r.keyword || (e.title + e.summary).toLowerCase().includes(String(r.keyword).toLowerCase()))) out.push({ ruleId: r.id, title: e.title, detail: `${e.category} · severity ${e.severity} · ${e.source}`, dataStatus: e.meta.status, at: e.time, key: `${r.id}:${e.id}` }); }
    } else if (r.type === "quake") {
      for (const q of ctx.quakes) if (q.magnitude >= r.minMagnitude) out.push({ ruleId: r.id, title: q.title, detail: q.location, dataStatus: q.meta.status, at: q.time, key: `${r.id}:${q.id}` });
    }
  }
  return out;
}
