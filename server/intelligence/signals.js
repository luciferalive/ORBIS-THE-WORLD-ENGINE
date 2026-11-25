// Rise & Fall signals are CALCULATED from price series. No ranking is produced by a language model.
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
export function analyseSeries(series) {
  const v = series.map((p) => p.v).filter(Number.isFinite); if (v.length < 12) return null;
  if (std(v) / mean(v) < 1e-9) return null; // pegged / flat
  const n = v.length, third = Math.floor(n / 3), ret = (a, b) => v[b] / v[a] - 1;
  const total = ret(0, n - 1), a = ret(0, third), c = ret(n - 1 - third, n - 1);
  const steps = []; for (let i = 1; i < n; i++) steps.push(v[i] / v[i - 1] - 1);
  const last = steps[steps.length - 1], base = steps.slice(0, -1), sd = std(base) || 1e-9, z = (last - mean(base)) / sd;
  return { total: total * 100, first: a * 100, recent: c * 100, momentum: (c - a) * 100, z, volPerStep: sd * 100, n };
}
export function buildSignals(assets, { perKind = 6 } = {}) {
  const rows = [];
  for (const a of assets) {
    const m = analyseSeries(a.series); if (!m) continue;
    const base = { id: a.id, entity: a.name, symbol: a.symbol, category: a.class, value: a.price, currency: a.currency, window: a.seriesRange, dataStatus: a.meta.status, source: a.meta.provider, updatedAt: a.meta.updatedAt, m };
    const mk = (kind, strength, explanation) => rows.push({ ...base, kind, strength: Math.min(1, strength), movement: m.total, momentum: m.momentum, explanation });
    const w = a.seriesRange;
    if (m.total > 0) mk("rising", m.total / 10, `Up ${m.total.toFixed(2)}% over ${w} (${a.series.length} observations).`);
    if (m.total < 0) mk("falling", -m.total / 10, `Down ${Math.abs(m.total).toFixed(2)}% over ${w}.`);
    if (m.recent > 0 && m.total > 0 && m.recent > 2 * Math.max(m.first, 0.05)) mk("emerging", m.momentum / 8, `Gaining momentum: the latest third of the ${w} window rose ${m.recent.toFixed(2)}% vs ${m.first.toFixed(2)}% in the first third.`);
    if (m.total > 0 && m.recent < 0) mk("losing", -m.recent / 4, `Uptrend stalling: up ${m.total.toFixed(2)}% over ${w} but ${m.recent.toFixed(2)}% in the latest third.`);
    if (Math.abs(m.z) >= 2.5) mk("unusual", Math.abs(m.z) / 6, `Latest step moved ${m.z.toFixed(1)} standard deviations from this asset's own typical step over ${w}.`);
  }
  const out = {};
  for (const k of ["rising", "falling", "emerging", "losing", "unusual"]) out[k] = rows.filter((r) => r.kind === k).sort((x, y) => y.strength - x.strength).slice(0, perKind);
  return out;
}
/** Statistical projection cone from a price series: drift and volatility of log returns, extended `steps` steps. */
export function projectCone(series, steps = 30) {
  const v = series.map((p) => p.v).filter((x) => x > 0); if (v.length < 12) return null;
  const lr = []; for (let i = 1; i < v.length; i++) lr.push(Math.log(v[i] / v[i - 1]));
  const mu = mean(lr), sd = std(lr), last = series[series.length - 1], dt = (series[series.length - 1].t - series[0].t) / (series.length - 1);
  const pts = [];
  for (let k = 0; k <= steps; k++) { const drift = mu * k, band = 1.2816 * sd * Math.sqrt(k); pts.push({ t: last.t + k * dt, base: last.v * Math.exp(drift), optimistic: last.v * Math.exp(drift + band), adverse: last.v * Math.exp(drift - band) }); }
  return { points: pts, muPerStep: mu, sdPerStep: sd, observations: v.length, stepMs: dt };
}
