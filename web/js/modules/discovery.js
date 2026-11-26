import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { head } from "./common.js";
import { sourcesBox } from "../components/sources.js";
export async function render(el) {
  fill(el, head("Discovery", "New findings across science"), loading()); const [A, W, P] = await Promise.all([api.astronomy(), api.publications(""), api.preprints("astro-ph")]);
  const item = (t, meta, sub, url, tag) => h("a", { class: "item", href: url, target: "_blank", rel: "noopener noreferrer" }, h("div", { class: "meta" }, tag ? h("span", { class: "pill " + tag[1] }, tag[0]) : null, h("span", null, meta)), h("div", null, t), sub ? h("div", { class: "small t2" }, sub) : null);
  const ex = A.exoplanets.available ? A.exoplanets.planets.slice(0, 8) : [];
  fill(el, head("Discovery", "Latest exoplanets, publications and preprints"), h("div", { class: "banner" }, h("b", null, "NOTE"), "Peer-reviewed journal articles, unreviewed preprints and catalogue entries are labelled separately. A listing here is not an endorsement or a confirmed breakthrough."),
    h("div", { class: "grid g3" },
      box("Exoplanet catalogue (latest)", ex.length ? h("div", { class: "feed" }, ex.map((p) => item(p.name, `${p.year} · ${p.method}`, `Host ${p.host}` + (p.radiusEarth ? ` · ${p.radiusEarth.toFixed(1)} Earth radii` : ""), "https://exoplanetarchive.ipac.caltech.edu/overview/" + encodeURIComponent(p.name), ["CATALOGUE", "PERIODIC"]))) : state("Unavailable", A.exoplanets.error || ""), { meta: ex[0] && ex[0].meta }),
      box("Most-cited recent publications", W.available ? h("div", { class: "feed" }, W.works.slice(0, 8).map((w) => item(w.title, w.venue || w.date, w.authors.join(", "), w.doi || w.id, w.peerReviewed === "journal" ? ["JOURNAL", "PERIODIC"] : ["UNVERIFIED STATUS", "DEMO"]))) : state("Unavailable", W.error || ""), { meta: W.works && W.works[0] && W.works[0].meta }),
      box("Astrophysics preprints", P.available ? h("div", { class: "feed" }, P.papers.slice(0, 8).map((p) => item(p.title, p.category, p.authors.join(", "), p.url, ["PREPRINT", "DEMO"]))) : state("Unavailable", P.error || ""), { meta: P.papers && P.papers[0] && P.papers[0].meta })),
    h("div", { style: { height: "10px" } }), sourcesBox(["exoplanets", "openalex", "arxiv", "gbif"]));
}
