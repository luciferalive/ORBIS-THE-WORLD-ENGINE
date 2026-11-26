import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { head } from "./common.js";
export async function render(el) {
  fill(el, head("Megaprojects", "Reference list"), loading()); const M = await api.megaprojects(); let cat = "";
  const out = h("div"), cats = ["", ...new Set(M.projects.map((p) => p.category))];
  const draw = () => fill(out, table([{ key: "name", label: "Project", render: (p) => h("a", { href: p.source, target: "_blank", rel: "noopener noreferrer" }, p.name) }, { key: "category", label: "Category" }, { key: "country", label: "Country" }, { key: "status", label: "Status", render: (p) => h("span", { class: "pill PERIODIC" }, p.status) }, { key: "note", label: "Note" }], M.projects.filter((p) => !cat || p.category === cat), { sortKey: "name", desc: false }));
  fill(el, head("Megaprojects", "Hand-curated reference list", M.meta), h("div", { class: "banner" }, h("b", null, "REFERENCE"), `Statuses are hand-curated as of ${M.asOf} from public project pages and change often. No automated source tracks them, so verify with the linked source before relying on them.`),
    h("div", { class: "row", style: { marginBottom: "8px" } }, h("select", { "aria-label": "Category", onchange: (e) => { cat = e.target.value; draw(); } }, cats.map((c) => h("option", { value: c }, c || "All categories")))), box(`${M.projects.length} projects`, out)); draw();
}
