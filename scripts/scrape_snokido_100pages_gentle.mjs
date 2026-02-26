import fs from "fs";
import * as cheerio from "cheerio";

// ---------- Utils ----------
function clean(s){ return (s || "").replace(/\s+/g, " ").trim(); }
function toInt(s){
  const n = clean(s).replace(/[^\d]/g, "");
  return n ? Number(n) : null;
}
function absUrl(url){
  if(!url) return "";
  if(url.startsWith("http")) return url;
  return "https://www.snokido.fr" + url;
}
function slugify(s){
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const jitter = (min, max) => Math.floor(min + Math.random() * (max - min));

async function fetchWithUA(url){
  return await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
  });
}

async function fetchWithRetry(url, tries = 4){
  let lastErr = null;

  for(let attempt = 1; attempt <= tries; attempt++){
    try{
      const res = await fetchWithUA(url);

      // si rate limit / souci serveur : backoff
      if([429, 500, 502, 503, 504].includes(res.status)){
        const wait = jitter(1500 * attempt, 3500 * attempt);
        console.log(`⚠️ ${res.status} sur ${url} (tentative ${attempt}/${tries}) -> pause ${wait}ms`);
        await sleep(wait);
        continue;
      }

      if(!res.ok){
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.text();
    }catch(e){
      lastErr = e;
      const wait = jitter(1200 * attempt, 3000 * attempt);
      console.log(`⚠️ Erreur fetch ${url} (tentative ${attempt}/${tries}): ${e.message} -> pause ${wait}ms`);
      await sleep(wait);
    }
  }

  throw lastErr || new Error("fetch failed");
}

function writeJson(path, obj){
  fs.writeFileSync(path, JSON.stringify(obj, null, 2), "utf8");
}

// ---------- Parse HTML -> players[] ----------
function parsePlayers(html){
  const $ = cheerio.load(html);

  const table = $("table")
    .filter((i, el) => {
      const t = clean($(el).text()).toLowerCase();
      return t.includes("nom") && (t.includes("xp") || t.includes("exp")) && t.includes("date");
    })
    .first();

  if(!table.length) return { players: [], reason: "table_not_found" };

  const players = [];
  table.find("tr").each((i, tr) => {
    const tds = $(tr).find("td");
    if(tds.length < 5) return;

    const rank = toInt($(tds[0]).text());

    const img = $(tds[1]).find("img").first();
    const avatar = absUrl(img.attr("src") || img.attr("data-src") || "");

    const nameA = $(tds[2]).find("a").first();
    const nom = clean(nameA.text());
    const profileHref = absUrl(nameA.attr("href") || "");

    const niveau = toInt($(tds[3]).text());
    const xp = toInt($(tds[4]).text());
    const inscription = clean($(tds[5]).text() || "");

    if(!nom || xp == null) return;

    players.push({
      rank: rank ?? players.length + 1,
      nom,
      slug: slugify(nom),
      niveau,
      xp,
      inscription,
      avatar,
      profileHref
    });
  });

  return { players, reason: "ok" };
}

// ---------- Fetch pages 1..N : /players, /players-2, ... ----------
async function fetchAllPages(maxPages){
  const all = [];
  for(let page = 1; page <= maxPages; page++){
    const url = page === 1
      ? "https://www.snokido.fr/players"
      : `https://www.snokido.fr/players-${page}`;

    console.log("🌐 Fetch:", url);

    // pause douce AVANT chaque page (évite rafale)
    await sleep(jitter(900, 1600));

    const html = await fetchWithRetry(url, 4);
    const { players } = parsePlayers(html);

    if(!players.length){
      console.log("⛔ Stop: aucune ligne trouvée page", page);
      break;
    }

    all.push(...players);

    // petite pause après page aussi (encore plus “gentle”)
    await sleep(jitter(500, 1100));
  }
  return all;
}

// ---------- MAIN ----------
async function main(){
  fs.mkdirSync("data", { recursive: true });

  const MAX_PAGES = 100;

  const players = await fetchAllPages(MAX_PAGES);
  if(!players.length){
    console.error("❌ 0 joueurs trouvés.");
    process.exit(1);
  }

  console.log(`✅ Total joueurs récupérés (pages): ${players.length}`);

  // IMPORTANT: on n’ajoute rien d’autre => rankyear lit ce fichier et se met à jour “auto”
  writeJson("data/players_pages.json", players);

  console.log("✅ players_pages.json updated (100 pages, gentle)");
}

main().catch(err => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
