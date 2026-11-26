import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { head } from "./common.js";
import { indicatorBox } from "./indicators.js";
import { sourcesBox } from "../components/sources.js";
export async function render(el) {
  fill(el, head("Technology", "Tech news, research and adoption"), loading()); const [N, W] = await Promise.all([api.technews(), api.publications("artificial intelligence")]);
  fill(el, head("Technology", "What the tech community and research are talking about"),
    h("div", { class: "grid g2" },
      N.available ? box("Hacker News front page", h("div", { class: "feed" }, N.stories.slice(0, 20).map((s) => h("a", { class: "item", href: s.url, target: "_blank", rel: "noopener noreferrer" }, h("div", { class: "meta" }, h("span", null, s.points + " pts"), h("span", null, s.comments + " comments"), h("span", { style: { marginLeft: "auto" } }, fmt.ago(s.time))), h("div", null, s.title)))), { meta: N.stories[0] && N.stories[0].meta }) : box("Hacker News", state("Source unavailable", N.error || "")),
      W.available ? box("Recent AI research (OpenAlex)", h("div", { class: "feed" }, W.works.map((w) => h("a", { class: "item", href: w.doi || w.id, target: "_blank", rel: "noopener noreferrer" }, h("div", { class: "meta" }, h("span", { class: "pill " + (w.peerReviewed === "journal" ? "PERIODIC" : "DEMO") }, w.peerReviewed === "journal" ? "JOURNAL" : "UNVERIFIED STATUS"), h("span", null, w.date)), h("div", null, w.title)))), { meta: W.works[0] && W.works[0].meta }) : box("AI research", state("Source unavailable", W.error || ""))),
    h("div", { style: { height: "10px" } }), indicatorBox(["internetPct", "mobilePer100", "rdPctGdp", "patentsResident", "highTechExportsPct"], { title: "Technology adoption and innovation by country" }),
    h("p", { class: "small muted" }, "Company-level tracking (NVIDIA, TSMC, ASML...) uses SEC filings where available, see Financial Power. Hacker News is community-ranked, not editorial. Quantum, robotics, fusion and battery trackers are not integrated."), sourcesBox(["hackernews", "openalex", "arxiv", "worldbank"]));
}
