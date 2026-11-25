// Polls the server's stateless rule evaluator and turns new triggers into in-app notifications (deduped by key).
import { api } from "./api.js";
import { store, addNotes } from "../store.js";
import { toast } from "../components/ui.js";
let timer;
export async function checkAlerts(manual = false) {
  if (!store.rules.length) return 0;
  try {
    const r = await api.evaluate(store.rules.filter((x) => x.enabled !== false)); const fresh = r.triggered.filter((t) => !store.seen.has(t.key));
    if (fresh.length) { addNotes(fresh.map((t) => ({ ...t, read: false, firedAt: new Date().toISOString() }))); toast(`${fresh.length} new alert${fresh.length > 1 ? "s" : ""}: ${fresh[0].title}`); }
    else if (manual) toast("No new alerts");
    return fresh.length;
  } catch (e) { if (manual) toast("Alert check failed: " + e.message, "err"); return 0; }
}
export function startAlerts() { clearInterval(timer); timer = setInterval(() => checkAlerts(false), 60000); setTimeout(() => checkAlerts(false), 3000); }
