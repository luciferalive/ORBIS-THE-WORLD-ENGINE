// Boot sequence: once per browser session, skippable (click or any key), disabled for reduced-motion.
export function boot() {
  try { if (sessionStorage.getItem("orbis.booted") || matchMedia("(prefers-reduced-motion: reduce)").matches) return; sessionStorage.setItem("orbis.booted", "1"); } catch { /* storage blocked: still show once */ }
  const el = document.createElement("div"); el.id = "boot"; el.setAttribute("aria-hidden", "true");
  const cv = document.createElement("canvas"), pre = document.createElement("pre"), sk = document.createElement("div"); sk.className = "skip2"; sk.textContent = "[ click or press any key to skip ]";
  el.append(cv, pre, sk); document.body.append(el);
  const ctx = cv.getContext("2d"); cv.width = innerWidth; cv.height = innerHeight; const cols = Math.floor(cv.width / 16), drops = Array(cols).fill(0).map(() => Math.random() * -40);
  const rain = setInterval(() => { ctx.fillStyle = "rgba(2,6,10,.12)"; ctx.fillRect(0, 0, cv.width, cv.height); ctx.fillStyle = "#39FF9C"; ctx.font = "14px monospace"; drops.forEach((y, i) => { ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 90), i * 16, y * 16); drops[i] = y * 16 > cv.height && Math.random() > .97 ? 0 : y + 1; }); }, 50);
  const lines = ["ORBIS // WORLD INTELLIGENCE ENGINE", "initialising data core ............ ok", "loading provider registry ......... ok", "mounting recorder (sqlite) ........ ok", "integrity rule: no fabricated data . enforced", "status taxonomy: LIVE RECENT PERIODIC ESTIMATE PROJECTION DEMO UNAVAILABLE", "", "> access granted"];
  let i = 0, done = false; const end = () => { if (done) return; done = true; clearInterval(rain); clearInterval(tick); el.classList.add("out"); setTimeout(() => el.remove(), 600); removeEventListener("keydown", end); };
  const tick = setInterval(() => { if (i < lines.length) pre.textContent += lines[i++] + "\n"; else setTimeout(end, 350); }, 230);
  el.addEventListener("click", end); addEventListener("keydown", end, { once: true }); setTimeout(end, 4500);
}
