import fs from "fs";
import * as cheerio from "cheerio";

// ---------------- Utils ----------------
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
function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function writeJson(path, obj){ fs.writeFileSync(path, JSON.stringify(obj, null, 2), "utf8"); }

// ------------- Fetch -------------
async function fetchWithUA(url){
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

// ------------- Parse players table -------------
function parsePlayersFromHtml(html){
  const $ = cheerio.load(html);

  const table = $("table")
    .filter((i, el) => {
      const t = clean($(el).text()).toLowerCase();
      return t.includes("nom") && t.includes("xp") && t.includes("date");
    })
    .first();

  if(!table.length) return [];

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

    if(!nom || xp == null || !profileHref) return;

    players.push({
      rank: rank ?? null,
      nom,
      niveau: (typeof niveau === "number" ? niveau : null),
      xp: Number(xp) || 0,
      inscription: inscription || null,
      avatar: avatar || null,
      profileHref,
      karas: null,
    });
  });

  return players;
}

// ------------- Parse Kara + XP from profile page -------------
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

function parseXpFromProfile(html){
  const $ = cheerio.load(html);
  const text = clean($("body").text());

  let m = text.match(/XP\s*([\d\s]+)/i);
  if(m){
    const v = toInt(m[1]);
    if(v != null) return v;
  }
  m = text.match(/([\d\s]+)\s*xp/i);
  if(m){
    const v = toInt(m[1]);
    if(v != null) return v;
  }
  return null;
}

function parseAvatarFromProfile(html){
  const $ = cheerio.load(html);
  const img = $("img").filter((i, el) => {
    const src = $(el).attr("src") || "";
    return src.includes("/images/snoki/");
  }).first();

  if(!img.length) return null;
  const src = img.attr("src") || "";
  return absUrl(src);
}

// ------------- Extras (hidden accounts same pseudo) -------------
const EXTRA_PROFILES = [
  { url: "https://www.snokido.fr/player/snokido",   label: "snokido (dude)" },
  { url: "https://www.snokido.fr/player/snokido-2", label: "snokido (Korben)" },
];

async function fetchExtraProfile(extra){
  const r = await fetchWithUA(extra.url);
  const h = await r.text();

  const xp = parseXpFromProfile(h) ?? 0;
  const karas = parseKarasFromProfile(h) ?? 0;
  const avatar = parseAvatarFromProfile(h);

  return {
    rank: null,
    nom: extra.label,          // ✅ nom affiché
    niveau: null,
    xp,
    inscription: null,
    avatar: avatar || null,
    profileHref: extra.url,    // ✅ clé unique via URL /player/...
    karas,
  };
}

// ------------- MAIN -------------
async function main(){
  ensureDir("data");

  const MAX_PAGES = 50;
  const all = [];
  const seen = new Set(); // profileHref unique

  for(let page=1; page<=MAX_PAGES; page++){
    const url = page === 1
      ? "https://www.snokido.fr/players"
      : `https://www.snokido.fr/players-${page}`;

    console.log("🌐 Fetch:", url);
    const res = await fetchWithUA(url);
    const html = await res.text();

    const players = parsePlayersFromHtml(html);
    console.log("  -> rows:", players.length);

    for(const p of players){
      if(seen.has(p.profileHref)) continue;
      seen.add(p.profileHref);
      all.push(p);
    }
  }

  if(!all.length){
    console.error("❌ 0 joueurs scrapés sur les pages.");
    process.exit(1);
  }

  // ✅ inject extras (snokido + snokido-2)
  for(const ex of EXTRA_PROFILES){
    try{
      const p = await fetchExtraProfile(ex);

      const idx = all.findIndex(x => (x.profileHref || "") === ex.url);
      if(idx >= 0) all[idx] = p;
      else all.push(p);

      console.log("✅ Extra ajouté:", p.nom);
    }catch{
      console.log("⚠️ Extra failed:", ex.url);
    }
  }

  // Save big list
  writeJson("data/players_pages.json", all);
  console.log(`✅ players_pages.json -> ${all.length} joueurs`);

  // Build top50 by XP (desc)
  const top50 = all
    .slice()
    .sort((a,b)=> (Number(b.xp)||0) - (Number(a.xp)||0))
    .slice(0, 50);

  // Fetch karas for top50 + the 2 extras if they are in top50 (or not — harmless)
  console.log("🔎 Fetch profils (Kara) pour Top50...");
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

  writeJson("data/snokido_top50.json", top50);
  console.log("✅ snokido_top50.json écrit");
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
