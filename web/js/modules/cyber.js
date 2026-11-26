import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { head } from "./common.js";
import { sourcesBox } from "../components/sources.js";
export async function render(el) {
  fill(el, head("Cybersecurity", "Known exploited vulnerabilities"), loading()); const V = await api.vulns();
  fill(el, head("Cybersecurity", "Defensive vulnerability intelligence", V.vulnerabilities[0] && V.vulnerabilities[0].meta), h("div", { class: "banner" }, h("b", null, "DEFENSIVE"), "Public advisories only (CISA KEV). ORBIS contains no offensive or exploit functionality."),
    V.available ? box(`Newest of ${V.total} catalogued vulnerabilities`, table([{ key: "added", label: "Added" }, { key: "cve", label: "CVE", render: (v) => h("a", { href: v.url, target: "_blank", rel: "noopener noreferrer" }, v.cve) }, { key: "vendor", label: "Vendor" }, { key: "product", label: "Product" }, { key: "name", label: "Vulnerability" }, { key: "due", label: "Fix due" }, { key: "ransomware", label: "Ransomware", render: (v) => (v.ransomware ? "known use" : "-") }], V.vulnerabilities, { sortKey: "added" }), { meta: V.vulnerabilities[0] && V.vulnerabilities[0].meta }) : box("CISA KEV", state("Source unavailable", V.error)),
    h("div", { style: { height: "10px" } }), sourcesBox(["cisa", "nvd", "cert-in"]), h("p", { class: "small muted" }, "NIST NVD and India's CERT-In are catalogued but not integrated yet (CERT-In publishes no official API)."));
}
