// CISA Known Exploited Vulnerabilities catalogue (US government, public). Defensive information only.
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { event, meta } from "../models.js";
export const ID = "cisa";
registry.declare(ID, { name: "CISA KEV", kind: "cybersecurity advisories", frequency: "weekdays", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", keyRequired: false });
export function parseKev(raw) {
  if (!raw || !Array.isArray(raw.vulnerabilities)) throw new Error("unexpected CISA KEV response");
  const m = meta({ provider: "CISA", source: "Known Exploited Vulnerabilities Catalog", status: "RECENT", frequency: "updated on working days", dataType: "vulnerabilities", attribution: "CISA", license: "US Government work (public domain)", note: "Vulnerabilities confirmed as exploited in the wild per CISA." });
  return raw.vulnerabilities.map((v) => ({ cve: v.cveID, vendor: v.vendorProject, product: v.product, name: v.vulnerabilityName, added: v.dateAdded, description: v.shortDescription, action: v.requiredAction, due: v.dueDate, ransomware: v.knownRansomwareCampaignUse === "Known", url: "https://nvd.nist.gov/vuln/detail/" + v.cveID, meta: m })).filter((v) => v.cve).sort((a, b) => String(b.added).localeCompare(String(a.added)));
}
export async function fetchKev() { const raw = await fetchJson("https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", { id: ID, timeout: 15000 }); const o = parseKev(raw); registry.ok(ID, "RECENT"); return o; }
