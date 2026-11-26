// The Space Devs "Launch Library 2". Free tier is rate limited (about 15 requests/hour). https://thespacedevs.com/llapi
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
import { meta } from "../models.js";
export const ID = "launchlibrary";
registry.declare(ID, { name: "Launch Library 2", kind: "space launches", frequency: "minutes-hours", url: "https://thespacedevs.com/llapi", keyRequired: false });
export function parseLaunches(raw) {
  if (!raw || !Array.isArray(raw.results)) throw new Error("unexpected Launch Library response");
  const m = meta({ provider: "The Space Devs", source: "Launch Library 2", status: "RECENT", frequency: "minutes to hours", dataType: "launch schedule", attribution: "Launch Library 2 by The Space Devs", license: "Free tier for non-commercial use; check terms", note: "Launch times (NET) are targets and often slip." });
  return raw.results.filter((r) => r.id && r.name && r.net).map((r) => ({ id: r.id, name: r.name, net: new Date(r.net).toISOString(), status: r.status?.name || "Unknown", provider: r.launch_service_provider?.name || r.lsp_name || "", pad: r.pad?.name || "", location: r.pad?.location?.name || "", lat: Number(r.pad?.latitude) || null, lon: Number(r.pad?.longitude) || null, mission: r.mission?.name || "", url: r.url, meta: m }));
}
export async function fetchUpcoming() { const raw = await fetchJson("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=15&mode=normal", { id: ID }); const o = parseLaunches(raw); registry.ok(ID, "RECENT"); return o; }
