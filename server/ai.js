// AI Analyst: provider interface. The model only sees a snapshot built from ORBIS data and must cite it.
// Disabled (clearly) when no key is configured. The key stays on the server.
import { config } from "./config.js";
import { fetchRaw } from "./http.js";
import * as svc from "./services.js";
export const enabled = () => !!config.anthropicKey;
export async function buildContext() {
  const [{ assets }, { events, sample }, sig, countries] = await Promise.all([svc.getAssets(), svc.getEvents(), svc.getSignals(), svc.getCountries()]);
  const lines = [];
  lines.push("MARKETS (status | price | 24h-window change):");
  for (const a of assets) lines.push(`[${a.meta.status}] ${a.name} (${a.symbol}) ${a.price} ${a.currency} ${a.changePct.toFixed(2)}% | source ${a.meta.provider} | ${a.meta.updatedAt}`);
  lines.push("", `EVENTS (${sample ? "SAMPLE PLACEHOLDERS, NOT REAL NEWS" : "reported/measured"}):`);
  for (const e of events.slice(0, 25)) lines.push(`[${e.kind}] ${e.time} ${e.category} sev${e.severity}: ${e.title} (${e.source})`);
  lines.push("", "SIGNALS (calculated):"); for (const [k, v] of Object.entries(sig.signals)) for (const s of v) lines.push(`${k}: ${s.entity} [${s.dataStatus}] ${s.explanation}`);
  lines.push("", "COUNTRIES (population, GDP USD, growth %, inflation %; status):"); for (const c of countries.countries) lines.push(`${c.name}: ${c.population}, ${Math.round(c.gdp / 1e9)}bn, ${c.gdpGrowth}, ${c.inflation} [${c.provenance.gdp.status} ${c.provenance.gdp.year}]`);
  return { text: lines.join("\n"), generatedAt: new Date().toISOString(), sampleEvents: sample, demoMarkets: assets.filter((a) => a.meta.status === "DEMO").length };
}
const SYSTEM = `You are the ORBIS Analyst. Answer ONLY from the DATA SNAPSHOT supplied. Rules: (1) Separate "Facts from the data" from "Interpretation". (2) Quote the status tags (LIVE, DEMO, PERIODIC, ESTIMATE...) of anything you cite and say when data is DEMO or SAMPLE and therefore not real. (3) Cite the item and its timestamp. (4) If the snapshot cannot answer, say so; do not guess or use outside knowledge about current events. (5) State uncertainty.`;
export async function ask(question) {
  if (!enabled()) return { enabled: false };
  const ctx = await buildContext();
  const body = JSON.stringify({ model: config.analystModel, max_tokens: 900, system: SYSTEM, messages: [{ role: "user", content: `DATA SNAPSHOT (generated ${ctx.generatedAt}):\n${ctx.text}\n\nQUESTION: ${String(question).slice(0, 1000)}` }] });
  const txt = await fetchRaw("https://api.anthropic.com/v1/messages", { id: "ai", timeout: 45000, retries: 0, headers: { "x-api-key": config.anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" }, method: "POST", body }).catch((e) => { throw new Error("AI provider error: " + e.message); });
  const j = JSON.parse(txt); return { enabled: true, answer: (j.content || []).map((c) => c.text || "").join("\n"), generatedAt: ctx.generatedAt, sampleEvents: ctx.sampleEvents, demoMarkets: ctx.demoMarkets };
}
