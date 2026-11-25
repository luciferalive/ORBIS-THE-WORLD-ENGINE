// Open-Meteo: free for non-commercial use (attribution required; commercial needs a plan). No key. https://open-meteo.com/en/terms
// Current conditions for a set of locations in ONE request (comma-separated coordinates).
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { meta } from "../models.js";
export const ID = "openmeteo";
registry.declare(ID, { name: "Open-Meteo", kind: "weather", frequency: "15 min model updates", url: "https://open-meteo.com", keyRequired: false });
export function parseCurrent(raw, places) {
  const arr = Array.isArray(raw) ? raw : [raw]; if (!arr.length || !arr[0] || !arr[0].current) throw new Error("unexpected Open-Meteo response");
  const m = meta({ provider: "Open-Meteo", source: "Open-Meteo forecast API (NWP model analysis)", status: "RECENT", frequency: "15 minutes", dataType: "weather (model)", units: "°C, mm, km/h", attribution: "Weather data by Open-Meteo.com (CC BY 4.0)", license: "CC BY 4.0, non-commercial use free", note: "Model-based current conditions, not station observations." });
  return arr.map((r, i) => ({ place: places[i].name, iso2: places[i].iso2, lat: r.latitude, lon: r.longitude, tempC: r.current.temperature_2m, precipMm: r.current.precipitation, windKmh: r.current.wind_speed_10m, code: r.current.weather_code, time: r.current.time + "Z", meta: m }));
}
export async function fetchCurrent(places) {
  const q = (k) => places.map((p) => p[k]).join(",");
  const raw = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${q("lat")}&longitude=${q("lon")}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&timezone=GMT`, { id: ID });
  const out = parseCurrent(raw, places); registry.ok(ID, "RECENT"); return out;
}
