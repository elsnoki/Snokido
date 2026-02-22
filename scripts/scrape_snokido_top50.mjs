import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const URL = "https://www.snokido.fr/players";

function parseIntSafe(s){
  if(!s) return null;
  const n = Number(String(s).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function cleanText(s){
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

async function main(){
  const res = await fetch(URL, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; SnokikiBot/1.0; +https://github.com/)"
    }
  });
  if(!res.ok) throw new Error(`HTTP ${res.status} on ${URL}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const rows = $("table tr").toArray();
  const players = [];

  for (const tr of rows){
    const tds = $(tr).find("td");
    if(tds.length < 4) continue;

    const rank = parseIntSafe(cleanText($(tds[0]).text()));
    if(!rank || rank > 50) continue;

    const name = cleanText($(tr).find("a").first().text()) || null;
    if(!name) continue;

    const avatar_url = $(tr).find("img").first().attr("src") || null;
    const rowText = cleanText($(tr).text());

    let xp = null;
    const xpMatch = rowText.match(/([\d\s.,]+)\s*xp/i);
    if(xpMatch) xp = parseIntSafe(xpMatch[1]);

    let level = null;
    for (const idx of [2,3,4]) {
      if(tds[idx]) {
        const v = parseIntSafe(cleanText($(tds[idx]).text()));
        if(v && v <= 100) { level = v; break; }
      }
    }

    let signup = null;
    const dateMatch = rowText.match(/(\d{2}-\d{2}-\d{4})/);
    if(dateMatch) signup = dateMatch[1];

    players.push({ rank, name, level, xp, signup, avatar_url });
  }

  players.sort((a,b)=>a.rank-b.rank);
  const top50 = players.slice(0,50);

  if(top50.length < 30){
    throw new Error(`Parsing failed: only ${top50.length} players detected (page structure changed?)`);
  }

  const out = {
    source: URL,
    updated_at: new Date().toISOString(),
    players: top50
  };

  const outDir = path.join(process.cwd(), "data");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "snokido_top50.json"), JSON.stringify(out, null, 2), "utf8");

  console.log(`Saved data/snokido_top50.json with ${top50.length} players`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
