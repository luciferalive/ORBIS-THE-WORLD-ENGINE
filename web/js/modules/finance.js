import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { head } from "./common.js";
import { sourcesBox } from "../components/sources.js";
export async function render(el, arg) {
  fill(el, head("Financial Power", "Public filings of major institutions"), loading()); const L = await api.filers(), key = L.filers.some((f) => f.key === arg) ? arg : L.filers[0].key, F = await api.filer(key);
  fill(el, head("Financial Power", "Public SEC filings of major financial institutions", F.meta), h("div", { class: "banner" }, h("b", null, "READ CAREFULLY"), "Assets under management (AUM) is not ownership or control of companies, and ORBIS shows no AUM or holdings figures here, only the list of public SEC filings. Sovereign wealth funds, pension funds and central banks are not integrated."),
    h("div", { class: "tabs" }, L.filers.map((f) => h("a", { href: "#/finance/" + f.key }, h("button", { class: f.key === key ? "on" : "" }, f.name)))),
    F.available ? box(`${F.name} (CIK ${F.cik}) · ${F.sic || "SIC n/a"}`, table([{ key: "date", label: "Filed" }, { key: "form", label: "Form" }, { key: "accession", label: "Accession" }, { key: "url", label: "Document", sort: () => 0, render: (f) => h("a", { href: f.url, target: "_blank", rel: "noopener noreferrer" }, "open ↗") }], F.filings, { sortKey: "date" }), { meta: F.meta }) : box(F.name, state("SEC EDGAR unavailable", F.error || "")),
    h("p", { class: "small muted" }, "13F (institutional holdings) filings appear under form type 13F-HR when filed. Parsing holdings tables is not implemented."), h("div", { style: { height: "10px" } }), sourcesBox(["edgar"]));
}
