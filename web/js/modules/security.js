import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { head, eventItem } from "./common.js";
import { sourcesBox } from "../components/sources.js";
export async function render(el) {
  fill(el, head("Security", "Publicly reported security developments"), loading()); const [E, V] = await Promise.all([api.events({ sort: "time" }), api.vulns()]);
  const ev = E.events.filter((e) => ["conflict", "geopolitics"].includes(e.category) || /attack|security|terror|military|sanction|ceasefire/i.test(e.title));
  fill(el, head("Security", "Public security news and advisories", E.events[0] && E.events[0].meta), h("div", { class: "banner" }, h("b", null, "PUBLIC SOURCES ONLY"), "Headlines from news feeds and official advisories. Reports are REPORTED, not verified by ORBIS, and ORBIS has no access to restricted systems or surveillance data."),
    E.sample ? h("div", { class: "banner" }, h("b", null, "SAMPLE"), "Only placeholders are available: no live feed is reachable.") : null,
    h("div", { class: "grid g2" }, box(`Security-related headlines (${ev.length})`, ev.length ? h("div", { class: "feed", style: { maxHeight: "520px", overflow: "auto", margin: "-10px" } }, ev.map((e) => eventItem(e))) : state("None", "No matching headlines in the current feeds."), { meta: E.events[0] && E.events[0].meta }),
      V.available ? box("Newest known-exploited vulnerabilities", h("div", { class: "feed" }, V.vulnerabilities.slice(0, 10).map((v) => h("a", { class: "item", href: v.url, target: "_blank", rel: "noopener noreferrer" }, h("div", { class: "meta" }, h("span", null, v.cve), h("span", null, v.vendor), h("span", { style: { marginLeft: "auto" } }, v.added)), h("div", null, v.name)))), { meta: V.vulnerabilities[0] && V.vulnerabilities[0].meta }) : box("CISA KEV", state("Unavailable", V.error || ""))),
    h("p", { class: "small muted" }, "Official threat assessments and national security announcements are not integrated yet."), sourcesBox(["gdelt", "rss", "cisa"]));
}
