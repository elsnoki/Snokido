import fs from "fs";
import * as cheerio from "cheerio";

// ---------- Utils ----------
function clean(s){ return (s || "").replace(/\s+/g, " ").trim(); }
function digitsToInt(s){
  const n = String(s || "").replace(/[^\d]/g, "");
  return n ? Number(n) : null;
}
function toInt(s){ return digitsToInt(clean(s)); }
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
async function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
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

// ✅ Kara depuis profil (SAFE: jamais 0 si pas trouvé)
function parseKarasFromProfile(html){
  const lower = String(html || "").toLowerCase();

  // blocage/challenge
  if(lower.includes("cloudflare") || lower.includes("attention required") || lower.includes("checking your browser")){
    return null;
  }

  const $ = cheerio.load(html);
  const text = clean($("body").text());

  // 1) texte visible
  const rxText = [
    /Karas?\s*[:\-]?\s*([\d\s\u00A0\u202F.,]+)/i,
    /([\d\s\u00A0\u202F.,]+)\s*Karas?/i
  ];
  for(const rx of rxText){
    const m = text.match(rx);
    if(m){
      const v = digitsToInt(m[1]);
      if(v != null) return v;
    }
  }

  // 2) HTML brut
  const rxHtml = [
    /Karas?[^0-9]{0,30}([\d][\d\s\u00A0\u202F.,]{0,30})/i,
    /([\d][\d\s\u00A0\u202F.,]{0,30})[^A-Za-z0-9]{0,20}Karas?/i
  ];
  for(const rx of rxHtml){
    const m = String(html).match(rx);
    if(m){
      const v = digitsToInt(m[1]);
      if(v != null) return v;
    }
  }

  return null;
}

// ✅ Parse profil (infos générales)
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
    const m = text.match(/([\d\s\u00A0\u202F]+)\s*XP/i);
    return m ? Number(m[1].replace(/[\s\u00A0\u202F]/g, "")) : null;
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
      console.log("⛔ Stop page", page, "(no players)");
      break;
    }

    all.push(...players);
    await sleep(150);
  }

  return all;
}

// ---------- Upsert profil fixe (snokido + snokido-2) ----------
async function upsertFixed(players, url){
  const res = await fetchWithUA(url);
  if(!res.ok){
    console.warn("⚠️ fixed fetch not ok", res.status, url);
    return null;
  }
  const h = await res.text();

  const info = parseProfileInfo(h, url);
  const karas = parseKarasFromProfile(h);

  const idx = players.findIndex(p =>
    (p.profileHref && p.profileHref.toLowerCase() === url.toLowerCase()) ||
    (p.slug && info.slug && p.slug.toLowerCase() === info.slug.toLowerCase())
  );

  const merged = { rank: null, ...info, karas: karas };

  if(idx >= 0) players[idx] = { ...players[idx], ...merged };
  else players.push(merged);

  return info.slug;
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

  // ✅ inject fixes
  const fixedUrls = [
    "https://www.snokido.fr/player/snokido",
    "https://www.snokido.fr/player/snokido-2",
  ];
  for(const url of fixedUrls){
    try{
      console.log("🌐 Fetch fixed profile:", url);
      const slug = await upsertFixed(players, url);
      console.log("✅ fixed updated:", slug);
      await sleep(300);
    }catch(e){
      console.warn("⚠️ fixed profile failed:", url, e.message);
    }
  }

  // top50
  const top50 = players
    .slice()
    .sort((a,b)=> (a.rank ?? 999999) - (b.rank ?? 999999))
    .slice(0, 50);

  // ✅ Kara TOP50 : limit bas + pauses (évite blocage)
  console.log("🔎 Fetch profils Kara (Top50, limit=2 + pauses)...");

  await mapLimit(top50, 2, async (p, i) => {
    try{
      const res = await fetchWithUA(p.profileHref);
      if(!res.ok){
        console.warn("⚠️ profile fetch not ok", res.status, p.profileHref);
        return p;
      }
      const h = await res.text();

      const k = parseKarasFromProfile(h);
      if(k != null) p.karas = k; // ✅ n'écrase pas si null

      await sleep(400);

      if(i === 0 && k == null){
        const low = h.toLowerCase();
        if(low.includes("cloudflare") || low.includes("attention required") || low.includes("checking your browser")){
          console.warn("⚠️ Looks like Snokido blocks profile fetch (cloudflare/challenge).");
        }
      }
    }catch(e){
      console.warn("⚠️ profile fetch error", p.profileHref, e.message);
    }
    return p;
  });

  // top50 pour le site
  writeJson("data/snokido_top50.json", top50);

  // snapshot officiel du jour (Paris)
  const dayParis = parisDayString(new Date());
  const snapPath = `data/history_paris/${dayParis}.json`;
  const indexPath = `data/history_paris/index.json`;

  // map karas top50
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
      // ✅ IMPORTANT: jamais 0 par défaut
      karas: karaBySlug.has(p.slug) ? (karaBySlug.get(p.slug) ?? null) : (p.karas ?? null)
    }))
  };

  writeJson(snapPath, snapshot);

  const index = readJsonIfExists(indexPath, []);
  const next = Array.isArray(index) ? index.slice() : [];
  if(!next.includes(dayParis)) next.push(dayParis);
  next.sort();
  writeJson(indexPath, next);

  console.log(`✅ Snapshot écrit: ${snapPath}`);
  console.log(`✅ Index maj: ${indexPath}`);
}

main().catch(err => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
