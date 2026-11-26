// OpenSky Network anonymous REST API: limited rate/credits, positions can be delayed and are NOT complete global coverage
// (community ADS-B receivers). https://openskynetwork.github.io/opensky-api/rest.html
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { meta } from "../models.js";
export const ID = "opensky";
registry.declare(ID, { name: "OpenSky Network", kind: "aviation (ADS-B)", frequency: "~10 s anonymous resolution", url: "https://opensky-network.org", keyRequired: false });
export function parseStates(raw, limit = 800) {
  if (!raw || !Array.isArray(raw.states)) throw new Error("unexpected OpenSky response");
  const m = meta({ provider: "OpenSky Network", source: "ADS-B state vectors from community receivers", status: "LIVE", frequency: "about 10 s", dataType: "aircraft positions", attribution: "OpenSky Network, https://opensky-network.org", license: "Research/non-commercial; see OpenSky terms", note: "Coverage depends on volunteer receivers: oceans and some regions are sparse. Not a complete picture of air traffic." });
  const at = new Date((raw.time || Date.now() / 1000) * 1000).toISOString();
  return raw.states.filter((s) => Number.isFinite(s[5]) && Number.isFinite(s[6]) && !s[8]).slice(0, limit).map((s) => ({ icao24: s[0], callsign: (s[1] || "").trim(), country: s[2], lon: s[5], lat: s[6], altitudeM: s[7], velocityMs: s[9], headingDeg: s[10], time: at, meta: m }));
}
export async function fetchStates() { const raw = await fetchJson("https://opensky-network.org/api/states/all", { id: ID, timeout: 15000 }); const o = parseStates(raw); registry.ok(ID, "LIVE"); return o; }
