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

// ---- Marine (waves, sea surface temperature) and air quality endpoints: same provider, same terms.
export function parseMarine(raw, points) {
  const arr = Array.isArray(raw) ? raw : [raw]; if (!arr[0] || !arr[0].current) throw new Error("unexpected Open-Meteo marine response");
  const m = meta({ provider: "Open-Meteo Marine", source: "Open-Meteo marine API (wave model, ocean model)", status: "RECENT", frequency: "hourly model", dataType: "ocean conditions (model)", units: "m, s, °C", attribution: "Open-Meteo.com (CC BY 4.0)", license: "CC BY 4.0, non-commercial free", note: "Model output, not buoy observations. Open ocean points only." });
  return arr.map((r, i) => ({ name: points[i].name, lat: r.latitude, lon: r.longitude, waveHeightM: r.current.wave_height ?? null, wavePeriodS: r.current.wave_period ?? null, seaTempC: r.current.sea_surface_temperature ?? null, time: r.current.time + "Z", meta: m }));
}
export async function fetchMarine(points) { const q = (k) => points.map((p) => p[k]).join(","); const raw = await fetchJson(`https://marine-api.open-meteo.com/v1/marine?latitude=${q("lat")}&longitude=${q("lon")}&current=wave_height,wave_period,sea_surface_temperature&timezone=GMT`, { id: ID }); const o = parseMarine(raw, points); registry.ok(ID, "RECENT"); return o; }
export function parseAir(raw, places) {
  const arr = Array.isArray(raw) ? raw : [raw]; if (!arr[0] || !arr[0].current) throw new Error("unexpected Open-Meteo air-quality response");
  const m = meta({ provider: "Open-Meteo Air Quality", source: "Open-Meteo air-quality API (CAMS model)", status: "RECENT", frequency: "hourly model", dataType: "air quality (model)", units: "µg/m³, AQI", attribution: "Open-Meteo.com, Copernicus CAMS (CC BY 4.0)", license: "CC BY 4.0, non-commercial free", note: "Model analysis at grid resolution; ground ozone here is NOT stratospheric ozone." });
  return arr.map((r, i) => ({ place: places[i].name, iso2: places[i].iso2, lat: r.latitude, lon: r.longitude, usAqi: r.current.us_aqi ?? null, pm25: r.current.pm2_5 ?? null, pm10: r.current.pm10 ?? null, groundOzone: r.current.ozone ?? null, no2: r.current.nitrogen_dioxide ?? null, time: r.current.time + "Z", meta: m }));
}
export async function fetchAir(places) { const q = (k) => places.map((p) => p[k]).join(","); const raw = await fetchJson(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${q("lat")}&longitude=${q("lon")}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide&timezone=GMT`, { id: ID }); const o = parseAir(raw, places); registry.ok(ID, "RECENT"); return o; }
