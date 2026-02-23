import fs from "fs";
import * as cheerio from "cheerio";

// -------- Utils --------
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
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  return res;
}

// Date "YYYY-MM-DD" en timezone Europe/Paris
function parisDayString(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(date); // "YYYY-MM-DD"
}

// -------- Parse HTML -> players[] --------
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
      karas: null,
    });
  });

  return { players, reason: "ok" };
}

// -------- Kara depuis profil --------
function parseKarasFromProfile(html) {
  const $ = cheerio.load(html);
  const text = clean($("body").text());

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
  return null;
}

// -------- Concurrency limiter --------
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

// -------- index.json builder --------
function rebuildIndexJson() {
  const dir = "data/history_paris";
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.replace(".json", ""))
    .sort();
  fs.writeFileSync(`${dir}/index.json`, JSON.stringify(files, null, 2), "utf8");
  console.log(`✅ index -> ${dir}/index.json (${files.length} snapshots)`);
}

// -------- MAIN --------
async function main() {
  const url = "https://www.snokido.fr/players";
  fs.mkdirSync("data", { recursive: true });
  fs.mkdirSync("data/history_paris", { recursive: true });

  console.log("🌐 Fetch:", url);
  const res = await fetchWithUA(url);
  const html = await res.text();

  const { players, reason } = parsePlayers(html);
  if (!players.length) {
    fs.writeFileSync("data/debug_players.html", html, "utf8");
    console.error(
      `❌ 0 joueurs trouvés. reason=${reason}. debug -> data/debug_players.html`
    );
    process.exit(1);
  }

  const top50 = players.slice(0, 50);

  console.log("🔎 Fetch profils pour Kara (Top50)...");
  await mapLimit(top50, 6, async (p) => {
    try {
      const r = await fetchWithUA(p.profileHref);
      const h = await r.text();
      p.karas = parseKarasFromProfile(h);
    } catch {
      p.karas = null;
    }
    return p;
  });

  // dernier top50
  fs.writeFileSync("data/snokido_top50.json", JSON.stringify(top50, null, 2), "utf8");
  console.log("✅ top50 -> data/snokido_top50.json");

  // snapshot du jour (Paris)
  const dayParis = parisDayString(new Date());
  const snapPath = `data/history_paris/${dayParis}.json`;

  if (fs.existsSync(snapPath)) {
    console.log(`ℹ️ Snapshot déjà présent pour ${dayParis} -> ${snapPath} (pas de duplication)`);
  } else {
    fs.writeFileSync(snapPath, JSON.stringify(top50, null, 2), "utf8");
    console.log(`✅ snapshot Paris -> ${snapPath}`);
  }

  // rebuild index
  rebuildIndexJson();
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
