import fs from "fs";
import * as cheerio from "cheerio";

// ---------- Utils ----------
function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function toInt(s) {
  const n = clean(s).replace(/[^\d]/g, "");
  return n ? Number(n) : null;
}

function absUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return "https://www.snokido.fr" + url;
}

async function fetchWithUA(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  return res;
}

// ---------- Parse /players ----------
function parsePlayers(html) {
  const $ = cheerio.load(html);

  const table = $("table")
    .filter((i, el) => {
      const t = clean($(el).text()).toLowerCase();
      return t.includes("nom") && t.includes("xp") && t.includes("date");
    })
    .first();

  if (!table.length) {
    return { players: [], reason: "table_not_found" };
  }

  const players = [];
  table.find("tr").each((i, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 5) return;

    const rank = toInt($(tds[0]).text());

    const img = $(tds[1]).find("img").first();
    const avatar = absUrl(img.attr("src") || img.attr("data-src") || "");

    const nameA = $(tds[2]).find("a").first();
    const nom = clean(nameA.text());
    const profileHref = absUrl(nameA.attr("href") || "");

    const niveau = toInt($(tds[3]).text());
    const xp = toInt($(tds[4]).text());
    const inscription = clean($(tds[5]).text() || "");

    if (!nom || xp == null) return;

    players.push({
      rank: rank ?? players.length + 1,
      nom,
      niveau,
      xp,
      inscription,
      avatar,
      profileHref,
      karas: null, // rempli ensuite
    });
  });

  return { players, reason: "ok" };
}

// ---------- Parse Karas depuis page profil ----------
function parseKarasFromProfile(html) {
  const $ = cheerio.load(html);

  // 1) On tente des zones "probables" (plus fiable que body entier)
  const candidates = [
    clean($("main").text()),
    clean($(".profile").text()),
    clean($(".stats").text()),
    clean($(".content").text()),
    clean($("body").text()),
  ].filter(Boolean);

  // Cherche "Kara" proche d'un nombre (tolérant aux espaces)
  // ex: "Kara 123 456" ou "123 456 Kara"
  for (const text of candidates) {
    let m = text.match(/Kara\s*([\d\s]+)/i);
    if (m) {
      const v = toInt(m[1]);
      if (v != null) return v;
    }
    m = text.match(/([\d\s]+)\s*Kara/i);
    if (m) {
      const v = toInt(m[1]);
      if (v != null) return v;
    }
  }

  return null;
}

// ---------- Concurrency limiter ----------
async function mapLimit(list, limit, fn) {
  const ret = new Array(list.length);
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

// ---------- MAIN ----------
async function main() {
  const url = "https://www.snokido.fr/players";
  fs.mkdirSync("data", { recursive: true });

  console.log("🌐 Fetch:", url);
  const res = await fetchWithUA(url);
  const html = await res.text();

  // debug rapide
  const $ = cheerio.load(html);
  console.log("TITLE:", clean($("title").text()));
  console.log("H1:", clean($("h1").first().text()));
  console.log("tables:", $("table").length);

  const { players, reason } = parsePlayers(html);
  if (!players.length) {
    fs.writeFileSync("data/debug_players.html", html, "utf8");
    console.error(
      `❌ 0 joueurs trouvés. reason=${reason}. debug -> data/debug_players.html`
    );
    process.exit(1);
  }

  const top50 = players.slice(0, 50);

  console.log("🔎 Fetch profils pour Kara (Top50) ...");
  await mapLimit(top50, 6, async (p, i) => {
    try {
      if (!p.profileHref) return p;

      const r = await fetchWithUA(p.profileHref);
      const h = await r.text();

      const k = parseKarasFromProfile(h);
      p.karas = k; // peut rester null

      console.log(
        `  [${i + 1}/50] ${p.nom} -> Kara: ${k == null ? "?" : k}`
      );
    } catch (e) {
      p.karas = null;
      console.log(`  [${i + 1}/50] ${p.nom} -> Kara: ? (error)`);
    }
    return p;
  });

  fs.writeFileSync(
    "data/snokido_top50.json",
    JSON.stringify(top50, null, 2),
    "utf8"
  );

  const okCount = top50.filter((p) => typeof p.karas === "number").length;
  console.log(
    `✅ ${top50.length} joueurs exportés -> data/snokido_top50.json (Kara trouvés: ${okCount}/50)`
  );
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
