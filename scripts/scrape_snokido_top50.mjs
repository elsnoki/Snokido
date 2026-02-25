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
async function fetchWithUA(url){
  return await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
  });
}
async function mapLimit(list, limit, fn){
  const ret = new Array(list.length);
  let idx = 0;
  const workers = Array.from({ length: limit }, async () => {
    while(idx < list.length){
      const i = idx++;
      ret[i] = await fn(list[i], i);
    }
  });
  await Promise.all(workers);
  return ret;
}
function readJsonIfExists(path, fallback){
  try{
    if(!fs.existsSync(path)) return fallback;
    return JSON.parse(fs.readFileSync(path, "utf8"));
  }catch{
    return fallback;
  }
}
function writeJson(path, obj){
  fs.writeFileSync(path, JSON.stringify(obj, null, 2), "utf8");
}

// Date "YYYY-MM-DD" en timezone Europe/Paris
function parisDayString(date = new Date()){
  const fmt = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(date);
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
      profileHref,
      karas: null,
    });
  });

  return { players, reason: "ok" };
}

// ---------- Kara depuis profil ----------
function parseKarasFromProfile(html){
  const $ = cheerio.load(html);
  const text = clean($("body").text());

  let m = text.match(/Kara\s*([\d\s]+)/i);
  if(m){
    const v = toInt(m[1]);
    if(v != null) return v;
  }
  m = text.match(/([\d\s]+)\s*Kara/i);
  if(m){
    const v = toInt(m[1]);
    if(v != null) return v;
  }
  return null;
}

// ---------- Fetch pages 1..N (format Snokido: /players-2, /players-3 ...) ----------
async function fetchAllPages(maxPages){
  const all = [];

  for(let page = 1; page <= maxPages; page++){
    const url = page === 1
      ? "https://www.snokido.fr/players"
      : `https://www.snokido.fr/players-${page}`;

    console.log("🌐 Fetch:", url);

    const res = await fetchWithUA(url);
    const html = await res.text();

    const { players } = parsePlayers(html);

    if(!players.length){
      console.log("⛔ Stop: aucune ligne trouvée page", page);
      break;
    }

    all.push(...players);

    // pause légère (respect serveur)
    await new Promise(r => setTimeout(r, 150));
  }

  return all;
}

// ---------- MAIN ----------
async function main(){
  fs.mkdirSync("data", { recursive: true });
  fs.mkdirSync("data/history_paris", { recursive: true });

  const MAX_PAGES = 50;

  // 1) scrape pages
  const players = await fetchAllPages(MAX_PAGES);
  if(!players.length){
    console.error("❌ 0 joueurs trouvés sur toutes les pages.");
    process.exit(1);
  }
  console.log(`✅ Total joueurs récupérés (pages): ${players.length}`);

  // 2) page 1 = Top50 (pour ton site)
  const top50 = players.slice(0, 50);

  // 3) profils seulement pour Top50 (Kara)
  console.log("🔎 Fetch profils Kara (page 1 seulement)...");
  await mapLimit(top50, 6, async (p) => {
    try{
      const r = await fetchWithUA(p.profileHref);
      const h = await r.text();
      p.karas = parseKarasFromProfile(h);
    }catch{
      p.karas = null;
    }
    return p;
  });

  // 4) écrit data/snokido_top50.json (utilisé par niveau.html)
  writeJson("data/snokido_top50.json", top50);

  // 5) snapshot officiel du jour (Paris) pour daily/hebdo/mensuel
  const dayParis = parisDayString(new Date());
  const snapPath = `data/history_paris/${dayParis}.json`;
  const indexPath = `data/history_paris/index.json`;

  // map des karas pour ceux du top50
  const karaBySlug = new Map(top50.map(p => [p.slug, p.karas]));

  const snapshot = {
    date: dayParis,
    generatedAtParis: new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false
    }).format(new Date()),
    players: players.map(p => ({
      nom: p.nom,
      slug: p.slug,
      xp: Number(p.xp) || 0,
      niveau: (typeof p.niveau === "number") ? p.niveau : null,
      avatar: p.avatar || null,
      profileHref: p.profileHref || null,
      // karas uniquement si présent dans top50
      karas: karaBySlug.has(p.slug) ? (karaBySlug.get(p.slug) ?? null) : null
    }))
  };

  writeJson(snapPath, snapshot);

  // index.json
  const index = readJsonIfExists(indexPath, []);
  const next = Array.isArray(index) ? index.slice() : [];
  if(!next.includes(dayParis)) next.push(dayParis);
  next.sort();
  writeJson(indexPath, next);

  console.log(`✅ Snapshot écrit: ${snapPath}`);
  console.log(`✅ index mis à jour: ${indexPath}`);
}

main().catch(err => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
