// scripts/scrape_snokido_top50.mjs
import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";

const URL = "https://www.snokido.fr/players";

function cleanInt(str) {
  return Number(String(str).replace(/[^\d]/g, "")) || 0;
}

function text(el) {
  return (el?.text?.() ?? "").replace(/\s+/g, " ").trim();
}

function looksLikeBlocked(html) {
  const s = html.toLowerCase();
  return (
    s.includes("captcha") ||
    s.includes("cloudflare") ||
    s.includes("access denied") ||
    s.includes("bot") && s.includes("blocked")
  );
}

async function main() {
  const res = await fetch(URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    },
  });

  const html = await res.text();

  // Debug si GitHub reçoit une page différente
  if (!html || html.length < 2000 || looksLikeBlocked(html)) {
    console.error("❌ HTML suspect (bloqué/redirect/captcha). Status:", res.status);
    console.error("---- HTML HEAD (800 chars) ----");
    console.error(html.slice(0, 800));
    process.exit(1);
  }

  const $ = cheerio.load(html);

  // On récupère les lignes “joueurs” de manière robuste
  // La page contient un tableau, mais on ne dépend pas d'une classe exacte.
  const rows = [];
  $("table tr").each((_, tr) => {
    const $tr = $(tr);
    const tds = $tr.find("td");
    if (tds.length < 4) return; // ignore header/others

    // Nom: généralement un <a> dans un td
    const a = $tr.find("a").first();
    const name = text(a);
    if (!name) return;

    // XP: dans un td qui contient "xp"
    let xp = 0;
    tds.each((_, td) => {
      const v = text($(td));
      if (v.toLowerCase().includes("xp")) xp = cleanInt(v);
    });
    if (!xp) return;

    // Niveau: souvent colonne "Niveau"
    // On tente de lire le 4e champ textuel numérique
    let level = 0;
    tds.each((_, td) => {
      const v = text($(td));
      if (/^\d{1,3}$/.test(v)) {
        if (level === 0) level = Number(v);
      }
    });

    // Date inscription: format dd-mm-yyyy
    let insc = "";
    tds.each((_, td) => {
      const v = text($(td));
      if (/^\d{2}-\d{2}-\d{4}$/.test(v)) insc = v;
    });

    // Avatar: premier img du row
    let avatar = $tr.find("img").first().attr("src") || "";
    if (avatar.startsWith("//")) avatar = "https:" + avatar;
    if (avatar.startsWith("/")) avatar = "https://www.snokido.fr" + avatar;

    // URL profil (si besoin)
    let profileUrl = a.attr("href") || "";
    if (profileUrl.startsWith("/")) profileUrl = "https://www.snokido.fr" + profileUrl;

    rows.push({ name, level, xp, insc, avatar, profileUrl });
  });

  if (rows.length === 0) {
    console.error("❌ 0 joueurs trouvés. Le HTML reçu ne contient pas le tableau attendu.");
    console.error("---- TITRE PAGE ----");
    console.error($("title").text());
    console.error("---- H1 ----");
    console.error($("h1").first().text());
    process.exit(1);
  }

  // Top 50 = les 50 premiers de la page 1
  const top50 = rows.slice(0, 50);

  const outDir = path.join(process.cwd(), "data");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "snokido_top50.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        source: URL,
        count: top50.length,
        players: top50,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`✅ OK: ${top50.length} joueurs -> ${outPath}`);
}

main().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});
