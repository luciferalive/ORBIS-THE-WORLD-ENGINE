// News: GDELT DOC 2.0 (free, no key) + RSS feeds. Headlines only: we never write summaries the source did not publish.
import { fetchJson, fetchRaw } from "../http.js";
import * as registry from "../registry.js";
import { event, meta } from "../models.js";
export const GDELT = "gdelt", RSS = "rss";
registry.declare(GDELT, { name: "GDELT DOC 2.0", kind: "news", frequency: "15 minutes", url: "https://www.gdeltproject.org", keyRequired: false });
registry.declare(RSS, { name: "RSS feeds (BBC World, Al Jazeera)", kind: "news", frequency: "minutes", url: "https://www.bbc.co.uk/news/world", keyRequired: false });
const RULES = [["conflict", /\b(war|missile|strike|troops|ceasefire|attack|military|shelling|drone)\b/i], ["geopolitics", /\b(sanction|summit|diplomat|treaty|nato|un security|embassy|tariff)\b/i], ["natural_disaster", /\b(earthquake|hurricane|typhoon|flood|wildfire|volcano|tsunami|cyclone)\b/i],
  ["climate", /\b(climate|heatwave|drought|emissions|temperature record)\b/i], ["markets", /\b(stocks?|shares|bitcoin|crypto|nasdaq|dow|index|bond|yield)\b/i], ["economics", /\b(inflation|gdp|central bank|interest rate|recession|unemployment|economy)\b/i],
  ["energy", /\b(oil|gas|opec|lng|electricity|power grid|nuclear|solar|wind farm)\b/i], ["ai", /\b(artificial intelligence|\bAI\b|chatgpt|openai|machine learning)\b/i], ["technology", /\b(tech|chip|semiconductor|software|cyber|satellite|space)\b/i],
  ["health", /\b(outbreak|virus|vaccine|hospital|health|disease|who says)\b/i], ["politics", /\b(election|president|prime minister|parliament|vote|minister)\b/i], ["trade", /\b(trade|export|import|shipping|port|supply chain)\b/i], ["science", /\b(scientist|study|research|discover)\b/i]];
export const classify = (text) => (RULES.find(([, re]) => re.test(text)) || ["society"])[0];
const SEV = { conflict: 3, natural_disaster: 3, geopolitics: 2, health: 2, markets: 2, economics: 2, energy: 2 };
const hid = (s) => { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h.toString(36); };

export function parseGdelt(raw) {
  if (!raw || !Array.isArray(raw.articles)) throw new Error("unexpected GDELT response");
  const m = meta({ provider: "GDELT", source: "GDELT DOC 2.0 article list", status: "LIVE", frequency: "15 minutes", dataType: "news headlines", attribution: "GDELT Project", note: "Category assigned by ORBIS keyword rules, not by the publisher." });
  return raw.articles.filter((a) => a.title && a.url).map((a) => {
    const s = a.seendate || "", t = s.length >= 15 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z` : new Date().toISOString();
    const cat = classify(a.title);
    return event({ id: "gdelt-" + hid(a.url), title: a.title, summary: `Headline published by ${a.domain || "unknown source"}${a.sourcecountry ? " (" + a.sourcecountry + ")" : ""}.`, category: cat, severity: SEV[cat] || 1, time: t, source: a.domain || "GDELT", url: a.url, kind: "reported", meta: m, tags: ["headline"] });
  });
}
export async function fetchGdelt() {
  const raw = await fetchJson("https://api.gdeltproject.org/api/v2/doc/doc?query=sourcelang:english&mode=artlist&maxrecords=60&format=json&sort=datedesc", { id: GDELT });
  const out = parseGdelt(raw); registry.ok(GDELT, "LIVE"); return out;
}
const dec = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/<[^>]+>/g, "").trim();
export function parseRss(xml, sourceName) {
  if (typeof xml !== "string" || !xml.includes("<item")) throw new Error("unexpected RSS response");
  const m = meta({ provider: sourceName, source: sourceName + " RSS", status: "LIVE", frequency: "minutes", dataType: "news headlines", attribution: sourceName, note: "Category assigned by ORBIS keyword rules." });
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((x) => {
    const g = (tag) => { const r = x[1].match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return r ? dec(r[1]) : ""; };
    const title = g("title"), link = g("link"), date = new Date(g("pubDate")); if (!title || !link) return null;
    const cat = classify(title + " " + g("description"));
    return event({ id: "rss-" + hid(link), title, summary: g("description").slice(0, 280), category: cat, severity: SEV[cat] || 1, time: isNaN(date) ? new Date().toISOString() : date.toISOString(), source: sourceName, url: link, kind: "reported", meta: m, tags: ["headline"] });
  }).filter(Boolean);
}
export async function fetchRss() {
  const feeds = [["BBC News", "https://feeds.bbci.co.uk/news/world/rss.xml"], ["Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml"], ["UN News", "https://news.un.org/feed/subscribe/en/news/all/rss.xml"], ["NASA", "https://www.nasa.gov/feed/"]];
  const res = await Promise.allSettled(feeds.map(async ([n, u]) => parseRss(await fetchRaw(u, { id: RSS }), n)));
  const ok = res.filter((r) => r.status === "fulfilled").flatMap((r) => r.value); if (!ok.length) throw new Error("all RSS feeds failed");
  registry.ok(RSS, "LIVE"); return ok;
}
