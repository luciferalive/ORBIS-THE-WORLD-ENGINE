// Transparent population scenario model. Growth rate g(t) declines linearly from g0 (2024) to gEnd (2100).
export const SCENARIOS = {
  optimistic: { label: "Optimistic (higher growth)", gEnd: 0.0005 },
  base: { label: "Base", gEnd: -0.0025 },
  adverse: { label: "Adverse (faster decline)", gEnd: -0.0065 },
};
export const G0 = 0.0088, START = { year: 2024, pop: 8.16e9 };
export function populationScenarios(from = 2024, to = 2100) {
  const out = {};
  for (const [k, s] of Object.entries(SCENARIOS)) {
    let p = START.pop; const pts = [{ year: START.year, value: p }];
    for (let y = START.year + 1; y <= to; y++) { const g = G0 + (s.gEnd - G0) * ((y - 1 - START.year) / (2100 - START.year)); p *= 1 + g; pts.push({ year: y, value: p }); }
    out[k] = { label: s.label, points: pts.filter((x) => x.year >= from) };
  }
  return out;
}
export const METHOD = "Compound growth: P(t+1) = P(t) x (1 + g(t)), where g falls linearly from 0.88% (2024) to the scenario end-rate in 2100. Scenarios differ only in that end-rate. This is a simple illustrative model, not the UN cohort-component model, and carries no statistical confidence interval; the spread between scenarios is the uncertainty range.";
