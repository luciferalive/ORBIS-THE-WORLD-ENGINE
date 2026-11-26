import { h, fill, fmt, box, state, loading, toast, openDrawer } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { head } from "./common.js";
import { statusPill } from "../components/sources.js";
let token = ""; // memory only; never persisted
const f = { q: "", category: "", status: "", integration: "" };
export async function render(el) {
  fill(el, head("API Management Center", "Data source registry, health and administration"), loading());
  const R = await api.providers(), P = R.providers, body = h("div");
  const cats = [...new Set(P.map((p) => p.category))].sort(), stats = [...new Set(P.map((p) => p.status))].sort();
  const sel = (label, key, opts) => h("select", { "aria-label": label, onchange: (e) => { f[key] = e.target.value; draw(); } }, h("option", { value: "" }, label), opts.map((o) => h("option", { value: o, selected: f[key] === o }, o)));
  const count = (s) => P.filter((p) => p.status === s).length;
  const draw = () => {
    const l = P.filter((p) => (!f.category || p.category === f.category) && (!f.status || p.status === f.status) && (!f.integration || p.integration === f.integration) && (!f.q || (p.name + p.org + p.modules.join(" ")).toLowerCase().includes(f.q)));
    fill(body, table([{ key: "name", label: "Provider", render: (p) => h("b", null, p.name) }, { key: "category", label: "Category" }, { key: "integration", label: "Integration" }, { key: "status", label: "Status", render: (p) => statusPill(p.status) }, { key: "reliability", label: "Reliability", num: true, render: (p) => (p.reliability == null ? "n/a" : p.reliability + "%") }, { key: "avgMs", label: "Avg ms", num: true, render: (p) => p.avgMs ?? "n/a" }, { key: "requests", label: "Req / fail", num: true, render: (p) => p.requests + " / " + p.failures }, { key: "lastOk", label: "Last OK", render: (p) => (p.lastOk ? fmt.ago(p.lastOk) : "never") }], l, { sortKey: "name", desc: false, onRow: detail, empty: "No providers match." }), h("p", { class: "small muted" }, `${l.length} of ${P.length} providers`));
  };
  const detail = (p) => {
    const out = h("div"), row = (k, v) => (v == null || v === "" ? null : h("div", { class: "stat" }, h("span", null, k), h("span", { style: { textAlign: "right", maxWidth: "65%", wordBreak: "break-word" } }, v)));
    openDrawer(p.name, h("div", null, h("div", { class: "row", style: { marginBottom: "8px" } }, statusPill(p.status), h("span", { class: "pill PERIODIC" }, p.integration)), row("Organization", p.org), row("Category", p.category), row("Authentication", p.auth), p.keyEnv ? row("Credential", p.credentialConfigured ? "configured on server" : "CONFIGURATION REQUIRED: set " + p.keyEnv) : null, row("Connected modules", p.modules.join(", ") || "none yet"), row("Coverage", p.coverage), row("Historical coverage", p.history), row("Update frequency", p.frequency), row("Rate limits", p.rate), row("Licence", p.license), row("Last error", p.lastError && p.lastError.message),
      h("p", null, h("a", { href: p.docs, target: "_blank", rel: "noopener noreferrer" }, "Documentation ↗")), p.testable ? h("div", null, h("button", { class: "on", onclick: async () => { fill(out, loading()); try { const r = await api.admin("POST", `/providers/${p.id}/test`, token); fill(out, h("div", null, h("div", { class: "stat" }, h("span", null, "Result"), h("span", { class: r.ok ? "pos" : "neg" }, r.ok ? "OK " + (r.httpStatus || "") : "FAILED " + (r.error || r.httpStatus))), r.ms ? h("div", { class: "stat" }, h("span", null, "Response time"), h("span", null, r.ms + " ms")) : null, r.shape ? h("div", { class: "stat" }, h("span", null, "Detected shape"), h("span", null, r.shape)) : null, r.sample ? h("pre", { class: "mono small", style: { whiteSpace: "pre-wrap", maxHeight: "260px", overflow: "auto" } }, r.sample) : null)); } catch (e) { fill(out, state("Test not run", e.message)); } } }, "Test connection"), h("span", { class: "small muted", style: { marginLeft: "8px" } }, "needs admin token"), out) : h("p", { class: "small muted" }, "No test endpoint defined."),
      p.integration === "custom" ? h("button", { onclick: async () => { try { await api.admin("DELETE", "/providers/" + p.id, token); toast("Removed"); render(el); } catch (e) { toast(e.message, "err"); } } }, "Remove provider") : null));
  };
  const tok = h("input", { type: "password", placeholder: "Admin token", "aria-label": "Admin token", autocomplete: "off", oninput: (e) => (token = e.target.value) });
  const reg = { name: h("input", { placeholder: "Provider name", "aria-label": "Name" }), url: h("input", { placeholder: "https://api.example.org/endpoint", "aria-label": "URL", style: { minWidth: "260px" } }), format: h("select", { "aria-label": "Format" }, ["json", "rss", "atom", "csv", "xml", "geojson"].map((x) => h("option", null, x))), category: h("input", { placeholder: "Category", "aria-label": "Category" }), authHeader: h("input", { placeholder: "Auth header name (optional)", "aria-label": "Auth header" }), authEnv: h("input", { placeholder: "ENV VAR holding the key", "aria-label": "Env var name" }) };
  fill(el, head("API Management Center", "Data source registry, health and administration"),
    h("div", { class: "kpis" }, ...[["Providers", P.length], ["Integrated", P.filter((p) => p.integration === "integrated").length], ["Operational", count("OPERATIONAL")], ["Config required", count("CONFIGURATION REQUIRED")], ["Disconnected", count("DISCONNECTED")], ["Not integrated", count("NOT INTEGRATED")]].map(([l, v]) => h("div", { class: "kpi" }, h("div", { class: "l" }, l), h("div", { class: "v" }, v)))),
    R.offline ? h("div", { class: "banner" }, h("b", null, "OFFLINE"), "Server is in ORBIS_OFFLINE mode: providers are not contacted, so none can be OPERATIONAL.") : null,
    h("div", { class: "row", style: { marginBottom: "8px" } }, h("input", { type: "search", placeholder: "Filter providers…", "aria-label": "Filter", oninput: (e) => { f.q = e.target.value.toLowerCase(); draw(); } }), sel("All categories", "category", cats), sel("All statuses", "status", stats), sel("All integrations", "integration", ["integrated", "catalogued", "custom"])),
    await jobsPanel(), h("div", { style: { height: "10px" } }),
    box("Provider registry", body), h("div", { style: { height: "10px" } }),
    box("Administration", h("div", null, R.adminEnabled ? null : h("div", { class: "banner" }, h("b", null, "CONFIGURATION REQUIRED"), "Set ORBIS_ADMIN_TOKEN in the server .env to enable provider tests and registration."), h("div", { class: "row", style: { marginBottom: "10px" } }, tok, h("span", { class: "small muted" }, "Held in memory only; sent as a header.")),
      h("h3", null, "Register a custom provider"), h("div", { class: "row", style: { margin: "6px 0" } }, reg.name, reg.url, reg.format, reg.category, reg.authHeader, reg.authEnv), h("p", { class: "small t2" }, "HTTPS only; private/internal addresses are blocked. Secrets are never entered here: put the key in the server environment and give its variable name. A registered provider starts disabled and is testable; response mapping and scheduling are not implemented yet (see ROADMAP)."),
      h("button", { class: "on", onclick: async () => { try { const r = await api.admin("POST", "/providers", token, { name: reg.name.value, url: reg.url.value, format: reg.format.value, category: reg.category.value, authHeader: reg.authHeader.value, authEnv: reg.authEnv.value }); toast("Registered " + r.name); render(el); } catch (e) { toast(e.message, "err"); } } }, "Register provider")), {}));
  draw();
}

async function jobsPanel() {
  try {
    const J = await api.jobs();
    return box("Collector jobs (SQLite recorder)", h("div", null,
      h("p", { class: "small t2" }, J.enabled ? "Scheduler running: jobs store real observations only." : J.offline ? "Scheduler off: ORBIS_OFFLINE mode." : "Scheduler off (ORBIS_SCHEDULER=0)."),
      table([{ key: "id", label: "Job" }, { key: "everyMinutes", label: "Every (min)" }, { key: "lastOk", label: "Last success", render: (j) => (j.lastOk ? fmt.ago(j.lastOk) : "never") }, { key: "runs", label: "Runs" }, { key: "failures", label: "Failures" }, { key: "lastError", label: "Last error", render: (j) => j.lastError || "none" }], J.jobs)));
  } catch (e) { return box("Collector jobs", h("span", { class: "small muted" }, "Unavailable: " + e.message)); }
}
