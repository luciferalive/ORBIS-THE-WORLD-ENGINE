import { readFileSync, existsSync } from "node:fs";
// Minimal .env loader (no dependency). Real environment variables win.
const envFile = new URL("../.env", import.meta.url);
if (existsSync(envFile)) for (const line of readFileSync(envFile, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && process.env[m[1]] === undefined && m[2] !== "") process.env[m[1]] = m[2];
}
export const config = {
  port: Number(process.env.PORT || 8090),
  offline: process.env.ORBIS_OFFLINE === "1",
  twelvedataKey: process.env.TWELVEDATA_KEY || "",
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  analystModel: process.env.ANALYST_MODEL || "claude-sonnet-4-5",
  cacheDir: new URL("../data/cache/", import.meta.url).pathname,
  fetchTimeoutMs: 8000,
};
