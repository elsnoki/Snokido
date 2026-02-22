import fs from "fs";
import * as cheerio from "cheerio";

function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}
function toInt(s) {
  const n = clean(s).replace(/[^\d]/g, "");
  return n ? Number(n) : null;
}

function parsePlayers(html) {
  const $ = cheerio.load(html);

  const table = $("table")
    .filter((i, el) => {
      const t = clean($(el).text()).toLowerCase();
      return t.includes("nom") && t.includes("xp") && t.includes("date");
    })
    .first();

  if (!table.length) return { players: [], reason: "table_not_found" };

  const players = [];
  table.find("tr").each((i, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 5) return;

    const rank = toInt($(tds[0]).text());
    const img = $(tds[1]).find("img").first();
    const avatar = img.attr("src") || img.attr("data-src") || "";

    const nameA = $(tds[2]).find("a").first();
    const nom = clean(nameA.text());
    const profileHref = nameA.attr("href") || "";

    const niveau = toInt($(tds[3]).text());
    const xp = toInt($(tds[4]).text());
    const inscription = clean($(tds[5]).text() || "");

    if (!nom || xp == null) return;

    // snokido met souvent des href relatifs
    const profileUrl = profileHref.startsWith("http")
      ? profileHref
      : ("https://www.snokido.fr" + profileHref);

    players.push({
      rank: rank ?? players.length + 1,
      nom,
      niveau,
      xp,
      inscription,
      avatar: avatar.startsWith("http") ? avatar : ("https://www.snokido.fr" + avatar),
      profileHref: profileUrl,
      karas: null, // rempli après
    });
  });

  return { players, reason: "ok" };
}

// Essaie de trouver "Kara" et un nombre près dans le texte de la page profil
function parseKarasFromProfile(html) {
  const $ = cheerio.load(html);
  const fullText = clean($("body").text());

  // pattern assez tolérant : "Kara 123 456" ou "123 456 Kara"
  let m = fullText.match(/Kara\s*([\d\s]+)/i);
  if (m && toInt(m[1]) != null) return toInt(m[1]);

  m = fullText.match(/([\d\s]+)\s*Kara/i);
  if (m && toInt(m[1]) != null) return toInt(m[1]);

  return null;
}

// Concurrency limiter
async function mapLimit(list, limit, fn) {
  const ret = [];
  let idx = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (idx < list.length) {
      const i = idx++;
      ret[i] = await fn(list[i], i);
    }
  });
  await Promise.all(workers);
  return ret;
}

async function fetchWithUA(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
  });
  return res;
}

async function main() {
  const url = "https://www.snokido.fr/players";
  fs.mkdirSync("data", { recursive: true });

  console.log("🌐 Fetch:", url);
  const res = await fetchWithUA(url);
  const html = await res.text();

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

  // ✅ PLUS : on récupère Kara (et ça fiabilise aussi XP si besoin)
  console.log("🔎 Fetch profils pour Kara (Top50)...");
  await mapLimit(top50, 6, async (p) => {
    try {
      const r = await fetchWithUA(p.profileHref);
      const h = await r.text();
      p.karas = parseKarasFromProfile(h);
    } catch (e) {
      p.karas = null;
    }
    return p;
  });

  // ✅ BONUS : on “pré-scrape” LargoJunior (même s’il n’est pas Top50)
  // Ça te donnera sa vraie XP + Kara dès maintenant.
  const extraSlugs = ["LargoJunior"];
  for (const name of extraSlugs) {
    const profileUrl = "https://www.snokido.fr/player/" + name.toLowerCase();
    try {
      const r = await fetchWithUA(profileUrl);
      const h = await r.text();
      const karas = parseKarasFromProfile(h);

      // On essaye de récupérer le nom affiché (sinon on garde LargoJunior)
      const $$ = cheerio.load(h);
      const h1 = clean($$("h1").first().text());
      const nom = h1 || name;

      // On essaie d’attraper l’XP depuis le texte (fallback léger)
      const txt = clean($$("body").text());
      let xp = null;
      let m = txt.match(/XP\s*([\d\s]+)/i);
      if (m) xp = toInt(m[1]);
      if (xp == null) {
        m = txt.match(/([\d\s]+)\s*xp/i);
        if (m) xp = toInt(m[1]);
      }

      // On ajoute au JSON pour que ton site puisse le matcher
      top50.push({
        rank: null,
        nom,
        niveau: null,
        xp: xp ?? null,
        inscription: null,
        avatar: null,
        profileHref: profileUrl,
        karas: karas ?? null,
      });
      console.log("✅ Extra ajouté:", nom);
    } catch (e) {
      console.log("⚠️ Extra failed:", name);
    }
  }

  fs.writeFileSync("data/snokido_top50.json", JSON.stringify(top50, null, 2), "utf8");
  console.log(`✅ ${top50.length} joueurs exportés -> data/snokido_top50.json`);
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
