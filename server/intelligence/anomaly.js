// Robust anomaly detection on price series: modified z-score (median / MAD) of the latest log-return.
// False-positive controls: minimum sample size, MAD floor (avoids flat-series blowups), a minimum absolute move,
// and a cap on the number of flags. Every flag carries its own explanation.
const median = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
export const DEFAULTS = { minObs: 30, zThreshold: 3.5, minMovePct: 0.5, maxFlags: 10 };
export function detect(series, opts = {}) {
  const o = { ...DEFAULTS, ...opts }, v = series.map((p) => (Array.isArray(p) ? p[1] : p.v)).filter((x) => Number.isFinite(x) && x > 0);
  if (v.length < o.minObs + 1) return { flagged: false, reason: `not enough observations (${v.length}, need ${o.minObs + 1})` };
  const r = []; for (let i = 1; i < v.length; i++) r.push(Math.log(v[i] / v[i - 1]));
  const hist = r.slice(0, -1), last = r[r.length - 1], med = median(hist), mad = Math.max(median(hist.map((x) => Math.abs(x - med))), 1e-6);
  const z = (0.6745 * (last - med)) / mad, movePct = (Math.exp(last) - 1) * 100;
  const flagged = Math.abs(z) >= o.zThreshold && Math.abs(movePct) >= o.minMovePct;
  return { flagged, z, movePct, n: hist.length, reason: flagged ? `Latest step ${movePct.toFixed(2)}% is ${Math.abs(z).toFixed(1)} robust standard deviations from the typical step (median-based, n=${hist.length}).` : `Within normal range (|z|=${Math.abs(z).toFixed(1)} < ${o.zThreshold} or move < ${o.minMovePct}%).` };
}
export function detectAll(assets, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  return assets.map((a) => ({ a, r: detect(a.series, o) })).filter((x) => x.r.flagged).sort((x, y) => Math.abs(y.r.z) - Math.abs(x.r.z)).slice(0, o.maxFlags)
    .map(({ a, r }) => ({ id: a.id, name: a.name, class: a.class, price: a.price, movePct: r.movePct, z: r.z, explanation: r.reason, dataStatus: a.meta.status, hypothesis: "Statistical outlier only. A flagged move is not evidence of a cause; check World Live for related events." }));
}
