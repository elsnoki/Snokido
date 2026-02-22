import fs from "fs";
import * as cheerio from "cheerio"; // ✅ PAS "default"

// -------- Utils --------
function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function toInt(s) {
  const n = clean(s).replace(/[^\d]/g, "");
  return n ? Number(n) : null;
}

// -------- Parse HTML -> players[] --------
function parsePlayers(html) {
  const $ = cheerio.load(html);

  // Table qui contient les bons mots clés
  const table = $("table")
    .filter((i, el) => {
      const t = clean($(el).text()).toLowerCase();
      return t.includes("nom") && t.includes("xp") && t.includes("date");
    })
    .first();

  if (!table.length) {
    return { players: [], reason: "table_not_found" };
  }

  const rows = table.find("tr");
  const players = [];

  rows.each((i, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 5) return;

    const rank = toInt($(tds[0]).text());

    const nameA = $(tds[2]).find("a").first();
    const nom = clean(nameA.text());
    const profileHref = nameA.attr("href") || "";

    const niveau = toInt($(tds[3]).text());
    const xp = toInt($(tds[4]).text());
    const inscription = clean($(tds[5]).text() || "");

    const img = $(tds[1]).find("img").first();
    const avatar = img.attr("src") || img.attr("data-src") || "";

    if (!nom || xp == null) return;

    players.push({
      rank: rank ?? players.length + 1,
      nom,
      niveau,
      xp,
      inscription,
      avatar,
      profileHref,
    });
  });

  return { players, reason: "ok" };
}

// -------- MAIN --------
async function main() {
  const url = "https://www.snokido.fr/players";
  fs.mkdirSync("data", { recursive: true });

  console.log("🌐 Fetch:", url);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
  });

  const html = await res.text();

  // debug rapide
  const $ = cheerio.load(html);
  console.log("TITLE:", clean($("title").text()));
  console.log("H1:", clean($("h1").first().text()));
  console.log("tables:", $("table").length);

  const { players, reason } = parsePlayers(html);

  if (!players.length) {
    fs.writeFileSync("data/debug_players.html", html, "utf8");
    console.error(`❌ 0 joueurs trouvés. reason=${reason}. debug -> data/debug_players.html`);
    process.exit(1);
  }

  const top50 = players.slice(0, 50);

  fs.writeFileSync("data/snokido_top50.json", JSON.stringify(top50, null, 2), "utf8");
  console.log(`✅ ${top50.length} joueurs exportés -> data/snokido_top50.json`);
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
