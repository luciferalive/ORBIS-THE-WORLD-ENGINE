import { h, fill, fmt, badge, box, state, toast } from "../components/ui.js";
import { api } from "../services/api.js";
import { head } from "./common.js";
import { store, saveRules, subscribe, clearNotes } from "../store.js";
import { checkAlerts } from "../services/alerts.js";
export async function render(el) {
  const [M, S] = await Promise.all([api.markets(), api.status()]);
  const list = h("div"), form = {};
  const drawRules = () => fill(list, store.rules.length ? store.rules.map((r) => h("div", { class: "stat" }, h("span", null, describe(r, M.assets)), h("span", { class: "row" }, h("button", { onclick: () => { r.enabled = r.enabled === false; saveRules(); drawRules(); } }, r.enabled === false ? "Enable" : "Disable"), h("button", { onclick: () => { store.rules = store.rules.filter((x) => x !== r); saveRules(); drawRules(); } }, "Delete")))) : h("div", { class: "small muted" }, "No alert rules yet."));
  const type = h("select", { "aria-label": "Rule type" }, [["asset_change", "Asset % change"], ["asset_price", "Asset price"], ["event", "Real news event"], ["quake", "Earthquake magnitude"]].map(([v, l]) => h("option", { value: v }, l)));
  const asset = h("select", { "aria-label": "Asset" }, M.assets.map((a) => h("option", { value: a.id }, a.name)));
  const op = h("select", { "aria-label": "Condition" }, h("option", { value: ">" }, "rises above (>)"), h("option", { value: "<" }, "falls below (<)"));
  const val = h("input", { type: "number", step: "any", placeholder: "threshold", "aria-label": "Threshold", value: "5" });
  const add = h("button", { class: "on", onclick: () => {
    const v = Number(val.value); if (!Number.isFinite(v)) return toast("Enter a numeric threshold", "err");
    const id = "r" + Date.now().toString(36), t = type.value, rule = t.startsWith("asset") ? { id, type: t, asset: asset.value, op: op.value, value: v } : t === "event" ? { id, type: t, minSeverity: Math.max(1, Math.min(5, v)) } : { id, type: t, minMagnitude: v };
    store.rules.push(rule); saveRules(); drawRules(); toast("Alert rule added"); checkAlerts(true); } }, "Add rule");
  fill(el, head("Settings", "Alerts, notifications and data connections"),
    box("Alert rules", h("div", null, h("p", { class: "small t2" }, "Rules are checked every minute while ORBIS is open and fire in-app notifications (bell, top right). Sample/demo events never trigger alerts. Rules are stored in this browser only."), h("div", { class: "row", style: { marginBottom: "8px" } }, type, asset, op, val, add, h("button", { onclick: () => checkAlerts(true) }, "Check now")), h("p", { class: "small muted" }, "Thresholds: asset % change and price use the field/operator above; Real news event uses the number as minimum severity (1–5); Earthquake uses the number as minimum magnitude."), list)),
    h("div", { style: { height: "10px" } }), box("Data provider configuration", h("div", null, h("p", { class: "small t2" }, "API keys live on the server in .env and are never sent to the browser. Restart the server after changing them."), S.sources.map((x) => h("div", { class: "stat" }, h("span", null, x.name), h("span", { class: "small" }, (x.keyRequired ? "key required · " : "no key · ") + x.status.toLowerCase().replace("_", " "))))), { meta: null }),
    h("div", { style: { height: "10px" } }), box("Local data", h("div", { class: "row" }, h("button", { onclick: () => { clearNotes(); toast("Notification history cleared"); } }, "Clear notification history"), h("button", { onclick: () => { try { localStorage.clear(); } catch {} location.reload(); } }, "Reset all local settings"))));
  drawRules();
}
function describe(r, assets) { const a = (assets.find((x) => x.id === r.asset) || {}).name || r.asset; return (r.enabled === false ? "⏸ " : "● ") + ({ asset_change: `${a}: % change ${r.op} ${r.value}`, asset_price: `${a}: price ${r.op} ${r.value}`, event: `Real news event with severity ≥ ${r.minSeverity}`, quake: `Earthquake magnitude ≥ ${r.minMagnitude}` })[r.type]; }
