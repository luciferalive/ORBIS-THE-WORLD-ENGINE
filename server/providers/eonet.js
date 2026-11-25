// NASA EONET v3: open natural events (wildfires, storms, volcanoes, floods, drought, sea/lake ice). Public, no key.
// https://eonet.gsfc.nasa.gov/docs/v3
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { event, meta } from "../models.js";
export const ID = "eonet";
registry.declare(ID, { name: "NASA EONET", kind: "planet (wildfires, storms, volcanoes, floods)", frequency: "continuous (event-driven)", url: "https://eonet.gsfc.nasa.gov", keyRequired: false });
const CAT = { wildfires: "wildfire", severeStorms: "storm", volcanoes: "volcano", floods: "flood", drought: "drought", landslides: "landslide", seaLakeIce: "ice", earthquakes: "earthquake", dustHaze: "dust", snow: "snow", tempExtremes: "heat", waterColor: "water", manmade: "manmade" };
export function parseEvents(raw) {
  if (!raw || !Array.isArray(raw.events)) throw new Error("unexpected EONET response");
  const m = meta({ provider: "NASA EONET", source: "Earth Observatory Natural Event Tracker", status: "LIVE", frequency: "event-driven", dataType: "natural events", attribution: "NASA EONET", license: "Public domain (NASA)", note: "Curated from satellite and agency sources; location is the latest reported geometry." });
  const out = [];
  for (const e of raw.events) {
    const g = (e.geometry || []).filter((x) => x.type === "Point" && Array.isArray(x.coordinates)).pop(); if (!g || !g.date) continue;
    const cat = e.categories?.[0]?.id || "other", kind = CAT[cat] || cat;
    out.push(event({ id: "eonet-" + e.id, title: e.title, summary: `${e.categories?.[0]?.title || "Natural event"}, ${e.closed ? "closed " + e.closed : "open"}.`, category: "natural_disaster", severity: kind === "volcano" || kind === "storm" ? 3 : 2, time: g.date, lat: g.coordinates[1], lon: g.coordinates[0], tags: [kind], source: "NASA EONET", url: e.link || e.sources?.[0]?.url, kind: "measured", meta: m, hazard: kind }));
  }
  return out;
}
export async function fetchOpen() { const raw = await fetchJson("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=150", { id: ID }); const out = parseEvents(raw); registry.ok(ID, "LIVE"); return out; }
