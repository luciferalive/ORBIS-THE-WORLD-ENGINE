import { h, fill, fmt, box } from "./ui.js";
import { api } from "../services/api.js";
export const PILL = { OPERATIONAL: "LIVE", IDLE: "PERIODIC", DEGRADED: "RECENT", "OFFLINE MODE": "DEMO", "CONFIGURATION REQUIRED": "DEMO", DISCONNECTED: "UNAVAILABLE", "AUTHENTICATION FAILED": "UNAVAILABLE", "RATE LIMITED": "RECENT", "NOT INTEGRATED": "UNAVAILABLE" };
export const statusPill = (s) => h("span", { class: "pill " + (PILL[s] || "UNAVAILABLE") }, s);
/** Data Sources panel every module shows: providers that feed it, with live status. */
export function sourcesBox(ids, title = "Data sources") {
  const body = h("div", null, h("div", { class: "sk" }));
  api.providers().then((r) => { const list = r.providers.filter((p) => ids.includes(p.id));
    fill(body, list.map((p) => h("div", { class: "stat" }, h("span", null, h("a", { href: p.docs, target: "_blank", rel: "noopener noreferrer" }, p.name), h("span", { class: "small muted" }, " · " + p.auth)), h("span", { class: "row", style: { flexWrap: "nowrap" } }, p.lastOk ? h("span", { class: "small muted" }, fmt.ago(p.lastOk)) : null, statusPill(p.status))), ), h("div", { class: "small muted", style: { marginTop: "4px" } }, h("a", { href: "#/sources" }, "Open API Management Center →"))); }).catch((e) => fill(body, h("div", { class: "small neg" }, "Provider registry unavailable: " + e.message)));
  return box(title, body);
}
