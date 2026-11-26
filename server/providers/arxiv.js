// arXiv API (Atom). Preprints are NOT peer reviewed. Be polite: 1 request / 3 s. https://info.arxiv.org/help/api/
import { fetchRaw } from "../http.js";
import * as registry from "../registry.js";
import { meta } from "../models.js";
export const ID = "arxiv";
registry.declare(ID, { name: "arXiv", kind: "preprints", frequency: "daily", url: "https://arxiv.org", keyRequired: false });
const dec = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
export function parseAtom(xml) {
  if (typeof xml !== "string" || !xml.includes("<feed")) throw new Error("unexpected arXiv response");
  const m = meta({ provider: "arXiv", source: "arXiv API (Atom)", status: "RECENT", frequency: "daily", dataType: "preprints", attribution: "Thank you to arXiv for use of its open access interoperability", license: "Metadata CC0; papers carry their own licences", note: "PREPRINTS: not peer reviewed." });
  const tag = (b, t) => { const r = b.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return r ? dec(r[1]) : ""; };
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, b]) => ({ id: tag(b, "id"), title: tag(b, "title"), summary: tag(b, "summary").slice(0, 400), published: tag(b, "published"), authors: [...b.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)].map((x) => dec(x[1])).slice(0, 4), category: (b.match(/<arxiv:primary_category[^>]*term="([^"]+)"/) || [])[1] || "", url: tag(b, "id"), status: "PREPRINT", meta: m })).filter((e) => e.id && e.title);
}
export async function fetchRecent(cat = "astro-ph") { if (!/^[a-z-]+(\.[A-Za-z]+)?$/.test(cat)) throw new Error("bad category"); const xml = await fetchRaw(`https://export.arxiv.org/api/query?search_query=cat:${cat}*&sortBy=submittedDate&sortOrder=descending&max_results=15`, { id: ID }); const o = parseAtom(xml); registry.ok(ID, "RECENT"); return o; }
