import { h, fill } from "./ui.js";
/** columns: [{key,label,num?,render?(row),sort?(row)}]; rows: objects. Sortable, optional row click. */
export function table(columns, rows, { sortKey, desc = true, onRow, empty = "No rows." } = {}) {
  const wrap = h("div", { class: "scroll" });
  let sk = sortKey || null, d = desc;
  const bodyRow = (r) => h("tr", {
    class: onRow ? "click" : "", tabindex: onRow ? 0 : null,
    onclick: onRow ? () => onRow(r) : null,
    onkeydown: onRow ? (e) => { if (e.key === "Enter") onRow(r); } : null,
  }, columns.map((c) => h("td", { class: c.num ? "n" : "" }, c.render ? c.render(r) : r[c.key])));
  const draw = () => {
    const col = columns.find((c) => c.key === sk);
    const val = (r) => (col.sort ? col.sort(r) : r[sk]);
    const sorted = col ? [...rows].sort((a, b) => {
      const x = val(a), y = val(b);
      const c = typeof x === "string" ? x.localeCompare(y) : (x ?? -Infinity) - (y ?? -Infinity);
      return d ? -c : c;
    }) : rows;
    const head = columns.map((c) => h("th", {
      class: (c.num ? "n " : "") + (c.key === sk ? "sorted " + (d ? "" : "asc") : ""), tabindex: 0,
      "aria-sort": c.key === sk ? (d ? "descending" : "ascending") : "none",
      onclick: () => { if (sk === c.key) d = !d; else { sk = c.key; d = true; } draw(); },
      onkeydown: (e) => { if (e.key === "Enter") e.target.click(); },
    }, c.label));
    const body = sorted.length ? sorted.map(bodyRow) : h("tr", null, h("td", { colspan: columns.length, class: "muted" }, empty));
    fill(wrap, h("table", { class: "t" }, h("thead", null, h("tr", null, head)), h("tbody", null, body)));
  };
  draw();
  return wrap;
}
