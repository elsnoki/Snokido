import fs from "fs";
import * as cheerio from "cheerio";

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
async function fetchWithUA(url){
  return await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
  });
}

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

async function main(){
  fs.mkdirSync("data", { recursive: true });

  const url = "https://www.snokido.fr/players";
  const res = await fetchWithUA(url);
  const html = await res.text();

  const { players, reason } = parsePlayers(html);
  if(!players.length){
    fs.writeFileSync("data/debug_players.html", html, "utf8");
    console.error(`❌ 0 joueurs trouvés. reason=${reason}`);
    process.exit(1);
  }

  const top50 = players.slice(0, 50);

  // Profils seulement page 1 (Top50)
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

  fs.writeFileSync("data/snokido_top50.json", JSON.stringify(top50, null, 2), "utf8");
  console.log("✅ top50 updated (no history)");
}

main().catch(err => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
