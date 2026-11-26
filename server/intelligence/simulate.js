// Hypothetical scenario models. Deterministic, transparent, adjustable. OUTPUTS ARE SIMULATIONS, NOT PREDICTIONS.
// Coefficients are illustrative defaults for exploring sensitivity; they are not estimated for any specific economy.
const num = (v, d, lo = -1e9, hi = 1e9) => { const x = v === undefined || v === "" ? d : Number(v); if (!Number.isFinite(x)) throw new Error("numeric parameter expected"); return Math.min(hi, Math.max(lo, x)); };
export const MODELS = {
  oil_shock: { label: "Oil price shock -> inflation and trade balance", defaults: { oilChangePct: 30, energyWeightPct: 4, refinedPassThrough: 0.6, secondRoundPer1Pct: 0.002, netOilImportsPctGdp: 2, baselineInflationPct: 3 },
    run(p) { const o = num(p.oilChangePct, 30, -90, 300), w = num(p.energyWeightPct, 4, 0, 30), pt = num(p.refinedPassThrough, 0.6, 0, 1.5), sr = num(p.secondRoundPer1Pct, 0.002, 0, 0.05), imp = num(p.netOilImportsPctGdp, 2, -30, 30), base = num(p.baselineInflationPct, 3, -5, 100);
      const direct = w * (o / 100) * pt, second = sr * o, total = direct + second, tb = -imp * (o / 100);
      return { outputs: { directCpiPp: direct, secondRoundCpiPp: second, totalCpiPp: total, inflationAfterPct: base + total, tradeBalanceChangePctGdp: tb }, assumptions: ["Direct effect = energy weight in CPI x oil change x refined-product pass-through.", "Second-round effect = linear coefficient x oil change.", "Trade balance effect = -(net oil imports % GDP) x oil change; volumes held constant (no demand response)."] }; } },
  supply_disruption: { label: "Supply disruption -> price pressure", defaults: { shortfallPct: 5, demandElasticity: -0.1, durationMonths: 3, bufferMonths: 1 },
    run(p) { const s = num(p.shortfallPct, 5, 0, 100), e = num(p.demandElasticity, -0.1, -2, -0.01), d = num(p.durationMonths, 3, 0.25, 60), b = num(p.bufferMonths, 1, 0, 60);
      const eff = s * Math.max(0, 1 - b / d), price = Math.min(500, eff / Math.abs(e));
      return { outputs: { effectiveShortfallPct: eff, priceChangePct: price }, assumptions: ["Inventories cover the first part of the disruption: effective shortfall = shortfall x max(0, 1 - buffer/duration).", "Price change ~ effective shortfall / |short-run demand elasticity| (linear, capped at 500%).", "Ignores substitution, spare capacity release, policy response and speculation. Real prices can differ widely."] }; } },
  fx_depreciation: { label: "Currency depreciation -> inflation", defaults: { depreciationPct: 15, importSharePctOfCpi: 25, passThrough: 0.2, baselineInflationPct: 4 },
    run(p) { const d = num(p.depreciationPct, 15, 0, 90), i = num(p.importSharePctOfCpi, 25, 0, 100), pt = num(p.passThrough, 0.2, 0, 1), base = num(p.baselineInflationPct, 4, -5, 100), dc = d * (i / 100) * pt;
      return { outputs: { cpiPp: dc, inflationAfterPct: base + dc }, assumptions: ["CPI effect = depreciation x import share of consumption basket x pass-through to consumer prices.", "Pass-through varies widely by country and regime; the default is illustrative."] }; } },
  population: { label: "Population path from a growth-rate assumption", defaults: { startPopulation: 8.16e9, startGrowthPct: 0.88, endGrowthPct: -0.2, yearsToEnd: 75, horizonYears: 75 },
    run(p) { const P0 = num(p.startPopulation, 8.16e9, 1e3, 2e10), g0 = num(p.startGrowthPct, 0.88, -5, 5), g1 = num(p.endGrowthPct, -0.2, -5, 5), n = Math.round(num(p.yearsToEnd, 75, 1, 300)), H = Math.round(num(p.horizonYears, 75, 1, 300));
      const path = [{ year: 0, population: P0 }]; let P = P0; for (let y = 1; y <= H; y++) { const g = g0 + (g1 - g0) * Math.min(1, y / n); P *= 1 + g / 100; path.push({ year: y, population: P }); }
      const peak = path.reduce((m, x) => (x.population > m.population ? x : m), path[0]);
      return { outputs: { finalPopulation: P, changePct: (P / P0 - 1) * 100, peakPopulation: peak.population, peakYearOffset: peak.year, path }, assumptions: ["Annual growth moves linearly from the start rate to the end rate over 'yearsToEnd', then stays flat.", "No age structure, migration or fertility detail: this is a growth-rate sketch, not a demographic projection."] }; } },
};
export function simulate(model, params = {}) {
  const m = MODELS[model]; if (!m) throw new Error("unknown model"); if (typeof params !== "object" || params === null) throw new Error("params must be an object");
  const r = m.run(params); return { model, label: m.label, kind: "SIMULATION", hypothetical: true, params: { ...m.defaults, ...params }, ...r, reproducible: true, warning: "Hypothetical scenario output from a simple documented model. Not a prediction and not advice.", generatedAt: new Date().toISOString() };
}
