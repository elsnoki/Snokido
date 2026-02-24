import fs from "fs";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function fmt(n) {
  const x = Number(n || 0);
  return x.toLocaleString("fr-FR");
}

function injectBetween(html, startMarker, endMarker, content) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Markers not found: ${startMarker} / ${endMarker}`);
  }
  const before = html.slice(0, start + startMarker.length);
  const after = html.slice(end);
  return `${before}\n${content}\n${after}`;
}

function top50Table(players) {
  // Adapte ici si tu veux EXACTEMENT ton HTML actuel (classes, etc.)
  const rows = players
    .filter(p => p && p.nom)
    .slice(0, 50)
    .map((p, i) => {
      const avatar = p.avatar ? `<img src="${p.avatar}" alt="" loading="lazy" />` : "";
      const kara = (p.karas == null) ? "-" : fmt(p.karas);
      const xp = fmt(p.xp);
      const lvl = (p.niveau == null) ? "-" : fmt(p.niveau);
      const linkStart = p.profileHref ? `<a href="${p.profileHref}" target="_blank" rel="noopener">` : "";
      const linkEnd = p.profileHref ? `</a>` : "";

      return `
<tr>
  <td>${i + 1}</td>
  <td class="av">${avatar}</td>
  <td class="name">${linkStart}${p.nom}${linkEnd}</td>
  <td class="lvl">${lvl}</td>
  <td class="xp">${xp}</td>
  <td class="kara">${kara}</td>
</tr>`.trim();
    })
    .join("\n");

  return `
<table class="auto-top50">
  <thead>
    <tr>
      <th>#</th><th></th><th>Nom</th><th>Niv</th><th>XP</th><th>Kara</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>
`.trim();
}

function sideRank(periodJson, title) {
  const rows = (periodJson?.rows || []).slice(0, 10);

  const items = rows.map(r => {
    const aStart = r.profileHref ? `<a href="${r.profileHref}" target="_blank" rel="noopener">` : "";
    const aEnd = r.profileHref ? `</a>` : "";
    const avatar = r.avatar ? `<img src="${r.avatar}" alt="" loading="lazy" />` : "";
    return `
<li>
  <span class="rk">${r.rank}</span>
  <span class="av">${avatar}</span>
  <span class="nm">${aStart}${r.nom}${aEnd}</span>
  <span class="dxp">+${fmt(r.dxp)} XP</span>
</li>`.trim();
  }).join("\n");

  const meta = `
<div class="period-meta">
  <div>${title}</div>
  <div class="small">Base: ${periodJson?.baselineDate || "?"} • MAJ: ${periodJson?.asOfDate || "?"}</div>
</div>`.trim();

  return `
<div class="auto-side-rank">
  ${meta}
  <ol>
${items}
  </ol>
</div>
`.trim();
}

function main() {
  const top50 = readJson("data/snokido_top50.json");
  const weekly = readJson("data/period/weekly_current.json");
  const monthly = readJson("data/period/monthly_current.json");

  // --- niveau.html ---
  if (fs.existsSync("niveau.html")) {
    let html = fs.readFileSync("niveau.html", "utf8");
    html = injectBetween(
      html,
      "<!--AUTO:TOP50_START-->",
      "<!--AUTO:TOP50_END-->",
      top50Table(top50)
    );
    fs.writeFileSync("niveau.html", html, "utf8");
  } else {
    console.warn("⚠️ niveau.html not found, skipped");
  }

  // --- rank.html ---
  if (fs.existsSync("rank.html")) {
    let html = fs.readFileSync("rank.html", "utf8");
    html = injectBetween(
      html,
      "<!--AUTO:WEEKLY_SIDE_START-->",
      "<!--AUTO:WEEKLY_SIDE_END-->",
      sideRank(weekly, "Classement hebdo (lun→dim)")
    );
    html = injectBetween(
      html,
      "<!--AUTO:MONTHLY_SIDE_START-->",
      "<!--AUTO:MONTHLY_SIDE_END-->",
      sideRank(monthly, "Classement mensuel (1→fin de mois)")
    );
    fs.writeFileSync("rank.html", html, "utf8");
  } else {
    console.warn("⚠️ rank.html not found, skipped");
  }

  console.log("✅ Pages updated: niveau.html + rank.html");
}

main();
