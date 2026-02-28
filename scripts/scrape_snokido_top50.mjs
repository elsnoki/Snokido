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

// ---------- Parse table -> players[] ----------
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
      karas: null,
    });
  });

  return { players, reason: "ok" };
}

// ---------- Parse profil -> {nom,slug,niveau,xp,inscription,avatar,profileHref,karas} ----------
function parseProfile(html, url){
  const $ = cheerio.load(html);

  // nom
  const nom =
    clean($("h1").first().text()) ||
    clean($(".profile-name").first().text()) ||
    clean($("title").text().replace("- Snokido", "")) ||
    "—";

  // avatar (essaye plusieurs endroits)
  let avatar =
    $(".profile-avatar img").attr("src") ||
    $(".avatar img").attr("src") ||
    $("img").filter((i,el)=> String($(el).attr("src")||"").includes("/images/snoki/")).first().attr("src") ||
    null;

  if(avatar && avatar.startsWith("/")) avatar = "https://www.snokido.fr" + avatar;

  const text = clean($("body").text());

  // niveau
  const niveau = (() => {
    const m = text.match(/Niveau\s*[:\-]?\s*(\d+)/i);
    return m ? Number(m[1]) : null;
  })();

  // xp
  const xp = (() => {
    const m = text.match(/([\d\s\u00A0]+)\s*XP/i);
    return m ? Number(m[1].replace(/[\s\u00A0]/g, "")) : null;
  })();

  // karas
  const karas = (() => {
    let m = text.match(/Kara\s*[:\-]?\s*([\d\s\u00A0]+)/i);
    if(m){
      const v = Number(String(m[1]).replace(/[\s\u00A0]/g,"").replace(/[^\d]/g,""));
      if(!Number.isNaN(v)) return v;
    }
    m = text.match(/([\d\s\u00A0]+)\s*Kara/i);
    if(m){
      const v = Number(String(m[1]).replace(/[\s\u00A0]/g,"").replace(/[^\d]/g,""));
      if(!Number.isNaN(v)) return v;
    }
    return null;
  })();

  // inscription DD-MM-YYYY
  const inscription = (() => {
    const m = text.match(/Inscription\s*[:\-]?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i);
    if(!m) return null;
    return m[1].replace(/\//g,"-");
  })();

  const slug = url.split("/player/")[1].toLowerCase().trim();

  return {
    rank: null,
    nom,
    slug,
    niveau,
    xp,
    inscription,
    avatar: avatar || null,
    profileHref: url,
    karas
  };
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
      console.log("⛔ Stop page", page, "(no players)");
      break;
    }

    all.push(...players);
    await new Promise(r => setTimeout(r, 150));
  }

  return all;
}

// ---------- Inject 2 profils fixes (snokido + snokido-2) ----------
async function injectFixedProfiles(players){
  const extraUrls = [
    "https://www.snokido.fr/player/snokido",
    "https://www.snokido.fr/player/snokido-2",
  ];

  for(const url of extraUrls){
    try{
      console.log("🌐 Fetch fixed profile:", url);
      const r = await fetchWithUA(url);
      const h = await r.text();
      const extra = parseProfile(h, url);

      // si l’un des champs n’est pas trouvé, on garde quand même ce qu’on a
      const idx = players.findIndex(p =>
        (p.profileHref && p.profileHref.toLowerCase() === url.toLowerCase()) ||
        (p.slug && extra.slug && p.slug.toLowerCase() === extra.slug.toLowerCase())
      );

      if(idx >= 0){
        players[idx] = { ...players[idx], ...extra };
      }else{
        players.push(extra);
      }

      console.log("✅ fixed added:", extra.slug);
      await new Promise(r => setTimeout(r, 150));
    }catch(e){
      console.warn("⚠️ fixed profile failed:", url, e.message);
    }
  }
}

// ---------- MAIN ----------
async function main(){
  fs.mkdirSync("data", { recursive: true });
  fs.mkdirSync("data/history_paris", { recursive: true });

  const MAX_PAGES = 50;

  const players = await fetchAllPages(MAX_PAGES);
  if(!players.length){
    console.error("❌ 0 joueurs trouvés.");
    process.exit(1);
  }
  console.log(`✅ Total joueurs récupérés: ${players.length}`);

  // ✅ ajoute snokido + snokido-2
  await injectFixedProfiles(players);

  // ✅ Écrit aussi players_pages.json (top 2500-ish)
  writeJson("data/players_pages.json", players);

  // top50 pour le site
  const top50 = players
    .slice()
    .sort((a,b)=> (a.rank ?? 999999) - (b.rank ?? 999999))
    .slice(0, 50);

  // ✅ Kara : pour TOP50 + pour les 2 profils fixes (déjà récupéré dans parseProfile)
  console.log("🔎 Fetch profils Kara (Top50 + fixes)...");

  // ids fixes pour être sûr
  const fixedSlugs = new Set(["snokido","snokido-2"]);

  await mapLimit(top50, 6, async (p) => {
    try{
      // si déjà connu (cas des fixes), ne re-fetch pas
      if(fixedSlugs.has(p.slug) && p.karas != null) return p;

      const r = await fetchWithUA(p.profileHref);
      const h = await r.text();
      const prof = parseProfile(h, p.profileHref);

      // on merge seulement karas (et éventuellement avatar/inscription si plus fiable)
      p.karas = (prof.karas == null) ? p.karas : prof.karas;
      if(!p.avatar && prof.avatar) p.avatar = prof.avatar;
      if(!p.inscription && prof.inscription) p.inscription = prof.inscription;
    }catch{
      // garde ce qu’on a
    }
    return p;
  });

  writeJson("data/snokido_top50.json", top50);

  // snapshot officiel du jour (Paris)
  const dayParis = parisDayString(new Date());
  const snapPath = `data/history_paris/${dayParis}.json`;
  const indexPath = `data/history_paris/index.json`;

  // map karas top50 (et fixes si dedans)
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
      inscription: p.inscription || null,
      avatar: p.avatar || null,
      profileHref: p.profileHref || null,
      karas: karaBySlug.has(p.slug) ? (karaBySlug.get(p.slug) ?? null) : (p.karas ?? null)
    }))
  };

  writeJson(snapPath, snapshot);

  const index = readJsonIfExists(indexPath, []);
  const next = Array.isArray(index) ? index.slice() : [];
  if(!next.includes(dayParis)) next.push(dayParis);
  next.sort();
  writeJson(indexPath, next);

  console.log(`✅ players_pages.json écrit`);
  console.log(`✅ Snapshot écrit: ${snapPath}`);
  console.log(`✅ Index maj: ${indexPath}`);
}

main().catch(err => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
