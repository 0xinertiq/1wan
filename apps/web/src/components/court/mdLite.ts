// Brief formatter ported from dashboard-v52 (mdLite). Returns HTML with all text escaped;
// links are limited to http(s).
export function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function mdInline(t: string) {
  t = esc(t);
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return t.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
}

// New-look options: srcLine shows a source tail as small links joined by a middle dot ("A · B") instead of "— A, B";
// numberTop5 renders the items under a "Top 5" heading as one numbered list (one item per paragraph).
export function mdLite(src: string, opt: { srcLine?: boolean; numberTop5?: boolean } = {}) {
  const L = String(src || "").replace(/\r/g, "").split("\n");
  const o: string[] = [];
  let i = 0, ul = false, hseen = false, top5 = false, ol = false;
  const cu = () => { if (ul) { o.push("</ul>"); ul = false; } };
  const co = () => { if (ol) { o.push("</ol>"); ol = false; } };
  while (i < L.length) {
    const tr = L[i].trim();
    if (!tr) { cu(); i++; continue; }
    if (tr.charAt(0) === "|") {
      cu();
      const rows: string[][] = [];
      while (i < L.length && L[i].trim().charAt(0) === "|") {
        const r = L[i].trim();
        if (!/^\|[\s:|-]+\|?$/.test(r)) rows.push(r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        i++;
      }
      if (rows.length)
        o.push('<div class="brt"><table><thead><tr>' + rows[0].map((c) => "<th>" + mdInline(c) + "</th>").join("") + "</tr></thead><tbody>" +
          rows.slice(1).map((r) => "<tr>" + r.map((c) => "<td>" + mdInline(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>");
      continue;
    }
    const hm = /^(#{1,4})\s+(.*)$/.exec(tr);
    if (hm) { cu(); co(); if (hm[1].length === 1 && !o.length) { i++; continue; } hseen = true; top5 = !!opt.numberTop5 && /top\s*5/i.test(hm[2]); o.push("<h4>" + mdInline(hm[2]) + "</h4>"); i++; continue; }
    const bl = /^\*\*Bottom line:?\*\*:?\s*(.*)$/i.exec(tr);
    if (bl) { cu(); o.push('<p class="lead"><b>Bottom line</b> ' + mdInline(bl[1]) + "</p>"); i++; continue; }
    const wn = /^\*\*(Watch next|Gaps):?\*\*:?\s*(.*)$/i.exec(tr);
    if (wn) { cu(); o.push('<h4 class="wl">' + mdInline(wn[1]) + "</h4>"); if (wn[2]) o.push("<p>" + mdInline(wn[2]) + "</p>"); i++; continue; }
    const bm = /^(?:[-*•]|\d+[.)])\s+(.*)$/.exec(tr);
    if (bm) { if (!ul) { o.push("<ul>"); ul = true; } o.push("<li>" + mdInline(bm[1]) + "</li>"); i++; continue; }
    cu();
    if (!o.length && /^(Daily Brief|Daily Intel(?:ligence)? Brief|Chief Kumo weekly review|Pulse Morning Brief|Weekend Pulse|Crypto Watchlist Scan)\b/.test(tr)) { i++; continue; }
    const lead = !hseen && !/^(Next 48h|Content angle)/.test(tr), cls = lead ? ' class="lead"' : "";
    const lb = /^(Next 48h|Content angle|Alerts|Thesis log|No trade today):\s*(.*)$/.exec(tr);
    let tail = "", bodyT = tr;
    const sp = bodyT.lastIndexOf(" — [");
    if (sp > 0 && /\)\s*$/.test(bodyT)) { tail = bodyT.slice(sp + 3); bodyT = bodyT.slice(0, sp); }
    const srcLinks = [...tail.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)];
    const src = !tail ? "" : opt.srcLine
      ? srcLinks.length ? '<span class="brsrc-line">' + srcLinks.map((m) => '<a href="' + esc(m[2]) + '" target="_blank" rel="noopener noreferrer">' + esc(m[1]) + "</a>").join(" · ") + "</span>" : ""
      : ' <span class="brsrc">— ' + mdInline(tail) + "</span>";
    const html = (lb ? '<b class="pl">' + esc(lb[1]) + "</b> " + mdInline(lb[2]) : mdInline(bodyT)) + src;
    if (top5) { if (!ol) { o.push('<ol class="bitems">'); ol = true; } o.push("<li>" + html + "</li>"); }
    else o.push("<p" + cls + ">" + html + "</p>");
    i++;
  }
  cu(); co();
  return o.join("");
}
