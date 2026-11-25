// USGS Earthquake Hazards Program GeoJSON feeds. Public domain, no key, updated every minute. https://earthquake.usgs.gov/earthquakes/feed/
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { event, meta } from "../models.js";
export const ID = "usgs";
registry.declare(ID, { name: "USGS Earthquakes", kind: "planet", frequency: "1 minute", url: "https://earthquake.usgs.gov", keyRequired: false });
export function parseQuakes(raw) {
  if (!raw || !Array.isArray(raw.features)) throw new Error("unexpected USGS response");
  const m = meta({ provider: "USGS", source: "Earthquake Hazards Program GeoJSON feed", status: "LIVE", frequency: "1 minute", dataType: "seismic events", units: "magnitude (Mw/ML)", attribution: "U.S. Geological Survey", license: "Public domain" });
  return raw.features.filter((f) => f.geometry?.coordinates && Number.isFinite(f.properties?.mag)).map((f) => {
    const [lon, lat, depth] = f.geometry.coordinates, p = f.properties, mag = p.mag;
    return event({ id: "usgs-" + f.id, title: `M${mag.toFixed(1)} earthquake: ${p.place || "unknown location"}`, summary: `Magnitude ${mag.toFixed(1)} at ${Math.round(depth)} km depth. ${p.tsunami ? "Tsunami flag set." : ""}${p.alert ? " PAGER alert level: " + p.alert + "." : ""}`.trim(),
      category: "natural_disaster", severity: mag >= 7 ? 5 : mag >= 6 ? 4 : mag >= 5 ? 3 : mag >= 4 ? 2 : 1, time: new Date(p.time).toISOString(), lat, lon, location: p.place || "", tags: ["earthquake", "M" + Math.floor(mag)], source: "USGS", url: p.url, kind: "measured", meta: m, magnitude: mag, depthKm: depth });
  });
}
export async function fetchQuakes(feed = "2.5_day") {
  const raw = await fetchJson(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feed}.geojson`, { id: ID });
  const out = parseQuakes(raw); registry.ok(ID, "LIVE"); return out;
}
