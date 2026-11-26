// OpenAlex (open scholarly index, CC0). Polite pool: send a mailto. https://docs.openalex.org
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { meta } from "../models.js";
export const ID = "openalex";
registry.declare(ID, { name: "OpenAlex", kind: "scientific publications", frequency: "daily", url: "https://openalex.org", keyRequired: false });
export function parseWorks(raw) {
  if (!raw || !Array.isArray(raw.results)) throw new Error("unexpected OpenAlex response");
  const m = meta({ provider: "OpenAlex", source: "OpenAlex works", status: "RECENT", frequency: "daily", dataType: "publications", attribution: "OpenAlex", license: "CC0", note: "Includes preprints; peer-review status is shown via the source type when known." });
  return raw.results.filter((w) => w.id && w.title).map((w) => ({ id: w.id, title: w.title, date: w.publication_date, doi: w.doi, venue: w.primary_location?.source?.display_name || "", venueType: w.primary_location?.source?.type || "", type: w.type, authors: (w.authorships || []).slice(0, 4).map((a) => a.author?.display_name).filter(Boolean), openAccess: !!w.open_access?.is_oa, cited: w.cited_by_count || 0, peerReviewed: w.primary_location?.source?.type === "journal" ? "journal" : "unknown/preprint", meta: m }));
}
export async function fetchRecent(search = "") {
  const f = `type:article,from_publication_date:${new Date(Date.now() - 14 * 86400e3).toISOString().slice(0, 10)}`;
  const raw = await fetchJson(`https://api.openalex.org/works?filter=${f}&sort=cited_by_count:desc&per-page=15${search ? "&search=" + encodeURIComponent(search) : ""}&mailto=orbis@example.org`, { id: ID }); const o = parseWorks(raw); registry.ok(ID, "RECENT"); return o;
}
