// scripts/scrape_snokido_top50.mjs
import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";

const URL = "https://www.snokido.fr/players";

const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
const cleanInt = (s) => Number(String(s || "").replace(/[^\d]/g, "")) || 0;

function findXpInText(rowText) {
  // accepte: "1 225 000 xp" ou "1225000xp"
  const m = rowText.match(/([\d\s\u00A0]+)\s*xp\b/i);
  return m ? cleanInt(m[1]) : 0;
}

function findDateInText(rowText) {
  const m = rowText.match(/\b\d{2}-\d{2}-\d{4}\b/);
  return m ? m[0] : "";
}

async function main() {
  const res = await fetch(URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  // 🔎 DEBUG rapide dans les logs
  console.log("TITLE:", norm($("title").text()));
  console.log("H1:", norm($("h1").first().text()));
  console.log("tables:", $("table").length, "trs:", $("tr").length);

  // ✅ On va chercher des “lignes” de joueurs de manière LARGE
  // - en priorité les TR
  // - sinon fallback sur des blocs qui contiennent "xp"
  const candidates = [];

  $("tr").each((_, el) => candidates.push(el));

  if (candidates.length === 0) {
    // fallback si jamais pas de table du tout
    $("[class*='table'], [class*='row'], li, div")
      .filter((_, el) => /xp/i.test(norm($(el).text())))
      .each((_, el) => candidates.push(el));
  }

  const rows = [];
  const seen = new Set();

  for (const el of candidates) {
    const $el = $(el);

    const rowText = norm($el.text());
    if (!rowText) continue;

    const xp = findXpInText(rowText);
    if (!xp) continue;

    // nom: premier <a> lisible dans la ligne
    const a = $el.find("a").first();
    const name = norm(a.text());
    if (!name) continue;

    // avatar: premier img
    let avatar = $el.find("img").first().attr("src") || "";
    if (avatar.startsWith("//")) avatar = "https:" + avatar;
    if (avatar.startsWith("/")) avatar = "https://www.snokido.fr" + avatar;

    // niveau: on cherche un nombre "isolé" (100 etc.)
    let level = 0;
    const mLvl = rowText.match(/\b(\d{1,3})\b/);
    if (mLvl) level = Number(mLvl[1]) || 0;

    // inscription: dd-mm-yyyy si présent dans la ligne
    const insc = findDateInText(rowText);

    // profileUrl si présent
    let profileUrl = a.attr("href") || "";
    if (profileUrl.startsWith("/"))
      profileUrl = "https://www.snokido.fr" + profileUrl;

    // dédoublonnage par nom
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({ name, level, xp, insc, avatar, profileUrl });
  }

  if (rows.length === 0) {
    // on sauvegarde le HTML pour inspection
    const outDir = path.join(process.cwd(), "data");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "debug_players.html"), html, "utf8");

    console.error("❌ 0 joueurs trouvés. HTML sauvegardé dans data/debug_players.html");
    process.exit(1);
  }

  // Top 50: tri xp desc, puis slice
  rows.sort((a, b) => b.xp - a.xp);
  const top50 = rows.slice(0, 50);

  const outDir = path.join(process.cwd(), "data");
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(outDir, "snokido_top50.json"),
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

  console.log(`✅ OK: ${top50.length} joueurs enregistrés.`);
}

main().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});
