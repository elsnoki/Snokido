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
    if(tds.length < 6) return;

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
      karas: null
    });
  });

  return { players, reason: "ok" };
}

// ✅ Kara depuis profil (version SAFE : jamais 0 si pas trouvé)
function parseKarasFromProfile(html){
  const $ = cheerio.load(html);
  const text = clean($("body").text());

  // Cherche un nombre près de "Kara"
  let m = text.match(/Kara[s]?\s*[:\-]?\s*([\d\s\u00A0]+)/i);
  if(m){
    const v = toInt(m[1]);
    return v == null ? null : v;
  }
  m = text.match(/([\d\s\u00A0]+)\s*Kara[s]?/i);
  if(m){
    const v = toInt(m[1]);
    return v == null ? null : v;
  }
  return null;
}

// ✅ Parse profil (hors Karas) : nom / avatar / niveau / xp / inscription
function parseProfileInfo(html, url){
  const $ = cheerio.load(html);

  const nom =
    clean($("h1").first().text()) ||
    clean($(".profile-name").first().text()) ||
    clean($("title").text().replace("- Snokido", "")) ||
    "—";

  let avatar =
    $(".profile-avatar img").attr("src") ||
    $(".avatar img").attr("src") ||
    $("img").filter((i,el)=> String($(el).attr("src")||"").includes("/images/snoki/")).first().attr("src") ||
    null;

  if(avatar && avatar.startsWith("/")) avatar = "https://www.snokido.fr" + avatar;

  const text = clean($("body").text());

  const niveau = (() => {
    const m = text.match(/Niveau\s*[:\-]?\s*(\d+)/i);
    return m ? Number(m[1]) : null;
  })();

  const xp = (() => {
    const m = text.match(/([\d\s\u00A0]+)\s*XP/i);
    return m ? Number(m[1].replace(/[\s\u00A0]/g, "")) : null;
  })();

  const inscription = (() => {
    const m = text.match(/Inscription\s*[:\-]?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i);
    if(!m) return null;
    return m[1].replace(/\//g,"-");
  })();

  const slug = url.split("/player/")[1].toLowerCase().trim();

  return { nom, avatar: avatar || null, niveau, xp, inscription, slug, profileHref: url };
}

// ---------- Fetch pages 1..N : /players, /players-2, ... ----------
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
    await new Promise(r => setTimeout(r, 150));
  }
  return all;
}

// ---------- Upsert profil fixe (avec Karas SAFE) ----------
async function upsertFixed(players, url){
  const r = await fetchWithUA(url);
  const h = await r.text();

  const info = parseProfileInfo(h, url);
  const karas = parseKarasFromProfile(h); // ✅ SAFE

  const idx = players.findIndex(p =>
    (p.profileHref && p.profileHref.toLowerCase() === url.toLowerCase()) ||
    (p.slug && info.slug && p.slug.toLowerCase() === info.slug.toLowerCase())
  );

  const merged = {
    rank: null,
    ...info,
    karas: karas // null si pas trouvé
  };

  if(idx >= 0) players[idx] = { ...players[idx], ...merged };
  else players.push(merged);

  return info.slug;
}

// ---------- MAIN ----------
async function main(){
  fs.mkdirSync("data", { recursive: true });

  const MAX_PAGES = 50;

  // 1) scrape 50 pages (sans history)
  const players = await fetchAllPages(MAX_PAGES);
  if(!players.length){
    console.error("❌ 0 joueurs trouvés.");
    process.exit(1);
  }
  console.log(`✅ Total joueurs récupérés (pages): ${players.length}`);

  // 2) inject snokido + snokido-2
  const fixedUrls = [
    "https://www.snokido.fr/player/snokido",
    "https://www.snokido.fr/player/snokido-2",
  ];
  for(const url of fixedUrls){
    try{
      console.log("🌐 Fetch fixed profile:", url);
      const slug = await upsertFixed(players, url);
      console.log("✅ fixed updated:", slug);
      await new Promise(r => setTimeout(r, 150));
    }catch(e){
      console.warn("⚠️ fixed profile failed:", url, e.message);
    }
  }

  // 3) top50 (tri par rank)
  const top50 = players
    .slice()
    .sort((a,b)=> (a.rank ?? 999999) - (b.rank ?? 999999))
    .slice(0, 50);

  // 4) Kara TOP50 (SAFE)
  console.log("🔎 Fetch profils Kara (Top50)...");

  await mapLimit(top50, 6, async (p) => {
    try{
      const r = await fetchWithUA(p.profileHref);
      const h = await r.text();
      const k = parseKarasFromProfile(h); // ✅ SAFE
      if(k != null) p.karas = k;          // ✅ n’écrase pas si null
    }catch{
      // garde ce qu'on a
    }
    return p;
  });

  // 5) écrire JSON
  writeJson("data/snokido_top50.json", top50);
  writeJson("data/players_pages.json", players);

  console.log("✅ top50 + players_pages.json updated (Karas corrigés)");
}

main().catch(err => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
