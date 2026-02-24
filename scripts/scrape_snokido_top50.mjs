import fs from "fs";
import * as cheerio from "cheerio";

// -------- Utils --------
function clean(s){ return (s||"").replace(/\s+/g," ").trim(); }
function toInt(s){ const n = clean(s).replace(/[^\d]/g,""); return n ? Number(n) : null; }
function absUrl(url){ if(!url) return ""; if(url.startsWith("http")) return url; return "https://www.snokido.fr"+url; }

async function fetchWithUA(url){
  const res = await fetch(url, {
    headers:{
      "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language":"fr-FR,fr;q=0.9,en;q=0.8",
      "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
  });
  return res;
}

// Date "YYYY-MM-DD" en Europe/Paris
function parisDayString(date=new Date()){
  const fmt = new Intl.DateTimeFormat("fr-CA", {
    timeZone:"Europe/Paris",
    year:"numeric", month:"2-digit", day:"2-digit"
  });
  return fmt.format(date);
}

// -------- Parse players table --------
function parsePlayers(html){
  const $ = cheerio.load(html);
  const table = $("table").filter((i,el)=>{
    const t = clean($(el).text()).toLowerCase();
    return t.includes("nom") && t.includes("xp") && t.includes("date");
  }).first();

  if(!table.length) return {players:[], reason:"table_not_found"};

  const players=[];
  table.find("tr").each((i,tr)=>{
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

    players.push({ rank: rank ?? players.length+1, nom, niveau, xp, inscription, avatar, profileHref, karas:null });
  });

  return {players, reason:"ok"};
}

// Kara depuis profil
function parseKarasFromProfile(html){
  const $ = cheerio.load(html);
  const text = clean($("body").text());
  let m = text.match(/Kara\s*([\d\s]+)/i);
  if(m){ const v = toInt(m[1]); if(v!=null) return v; }
  m = text.match(/([\d\s]+)\s*Kara/i);
  if(m){ const v = toInt(m[1]); if(v!=null) return v; }
  return null;
}

// Concurrency limiter
async function mapLimit(list, limit, fn){
  const ret = new Array(list.length);
  let idx=0;
  const workers = Array.from({length:limit}, async ()=>{
    while(idx < list.length){
      const i = idx++;
      ret[i] = await fn(list[i], i);
    }
  });
  await Promise.all(workers);
  return ret;
}

// ---------- Helpers period caches ----------
function slugify(name){
  return String(name||"")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9]/g,"")
    .toLowerCase();
}

// égalité: -78 (sauf betelgeuse/aldebaran ensemble)
function breakTies(rows){
  const groups = new Map();
  for(const r of rows){
    const k = r.dx;
    if(!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const exA = slugify("Aldébaran");
  const exB = slugify("Bételgeuse");

  for(const [dx,g] of groups){
    if(g.length <= 1) continue;

    const names = g.map(x=>slugify(x.nom)).sort();
    const isExceptionPair = g.length===2 && names[0]===exA && names[1]===exB;
    if(isExceptionPair) continue;

    g.sort((a,b)=>slugify(a.nom).localeCompare(slugify(b.nom)));
    for(let i=1;i<g.length;i++){
      g[i].dx -= 78*i;
      g[i].dxAdjusted = true;
    }
  }
  return rows;
}

function listSnapshots(){
  const dir="data/history_paris";
  if(!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f=>/^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map(f=>f.replace(".json",""))
    .sort();
}

function loadSnap(day){
  const p = `data/history_paris/${day}.json`;
  if(!fs.existsSync(p)) return null;
  try{
    const j = JSON.parse(fs.readFileSync(p,"utf8"));
    return Array.isArray(j) ? j : null;
  }catch{
    return null;
  }
}

// calc start of week (Monday) in Paris for a given day string
function startOfWeekParis(dayStr){
  const [y,m,d]=dayStr.split("-").map(Number);
  // Create a date at UTC midnight, then we'll use weekday based on Paris? simpler: use UTC date and treat dayStr as calendar day.
  const dt = new Date(Date.UTC(y,m-1,d));
  // day of week in ISO: Monday=1..Sunday=7
  const dow = Number(new Intl.DateTimeFormat("en-GB", { timeZone:"Europe/Paris", weekday:"short" }).format(dt));
  // ^ not reliable numeric. We'll do standard using UTC date: since dayStr is already a Paris calendar date, we can use UTC day-of-week of same calendar date.
  const jsDow = dt.getUTCDay(); // 0=Sun..6=Sat
  const iso = (jsDow===0)?7:jsDow; // 1..7
  const delta = iso - 1; // days since Monday
  dt.setUTCDate(dt.getUTCDate()-delta);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth()+1).padStart(2,"0");
  const dd = String(dt.getUTCDate()).padStart(2,"0");
  return `${yy}-${mm}-${dd}`;
}

function startOfMonth(dayStr){
  const [y,m,_]=dayStr.split("-").map(Number);
  const mm = String(m).padStart(2,"0");
  return `${y}-${mm}-01`;
}

function pickFirstSnapshotOnOrAfter(index, targetDay){
  for(const d of index){
    if(d >= targetDay) return d;
  }
  return null;
}

function computeDeltaLeaderboard(curDay, startDay){
  const cur = loadSnap(curDay);
  const old = loadSnap(startDay);
  if(!cur || !old) return null;

  const curMap = new Map(cur.map(p=>[slugify(p.nom), p]));
  const oldMap = new Map(old.map(p=>[slugify(p.nom), p]));

  let rows=[];
  for(const [k,p] of curMap){
    const o = oldMap.get(k);
    const xpNow = Number(p.xp||0);
    const xpOld = Number(o?.xp||0);
    const dx = xpNow - xpOld;

    const karaNow = Number(p.karas||0);
    const karaOld = Number(o?.karas||0);
    const dkara = karaNow - karaOld;

    rows.push({
      nom: p.nom,
      avatar: p.avatar,
      dx,
      dkara,
      xpNow,
      karaNow
    });
  }

  rows = breakTies(rows);
  rows.sort((a,b)=>b.dx - a.dx);

  // ranking map for “previous period” (for arrows) will be handled in front-end if needed.
  return rows;
}

async function main(){
  const url="https://www.snokido.fr/players";
  fs.mkdirSync("data",{recursive:true});
  fs.mkdirSync("data/history_paris",{recursive:true});
  fs.mkdirSync("data/period",{recursive:true});

  console.log("🌐 Fetch:", url);
  const res = await fetchWithUA(url);
  const html = await res.text();

  const {players, reason} = parsePlayers(html);
  if(!players.length){
    fs.writeFileSync("data/debug_players.html", html, "utf8");
    console.error(`❌ 0 joueurs trouvés. reason=${reason}`);
    process.exit(1);
  }

  const top50 = players.slice(0,50);

  console.log("🔎 Fetch profils pour Kara (Top50)...");
  await mapLimit(top50, 6, async (p)=>{
    try{
      const r = await fetchWithUA(p.profileHref);
      const h = await r.text();
      p.karas = parseKarasFromProfile(h);
    }catch{
      p.karas = null;
    }
    return p;
  });

  // last top50
  fs.writeFileSync("data/snokido_top50.json", JSON.stringify(top50,null,2), "utf8");

  // snapshot Paris
  const dayParis = parisDayString(new Date());
  const snapPath = `data/history_paris/${dayParis}.json`;
  if(fs.existsSync(snapPath)){
    console.log("ℹ️ Snapshot déjà présent:", snapPath);
  }else{
    fs.writeFileSync(snapPath, JSON.stringify(top50,null,2), "utf8");
    console.log("✅ snapshot Paris ->", snapPath);
  }

  // index.json
  const index = listSnapshots();
  fs.writeFileSync("data/history_paris/index.json", JSON.stringify(index,null,2), "utf8");

  // ===== period caches based on calendar =====
  const curDay = index[index.length-1];
  const weekStartTarget = startOfWeekParis(curDay);   // lundi
  const monthStartTarget = startOfMonth(curDay);      // 1er

  const weekStartSnap = pickFirstSnapshotOnOrAfter(index, weekStartTarget);
  const monthStartSnap = pickFirstSnapshotOnOrAfter(index, monthStartTarget);

  const weekly = weekStartSnap ? computeDeltaLeaderboard(curDay, weekStartSnap) : null;
  const monthly = monthStartSnap ? computeDeltaLeaderboard(curDay, monthStartSnap) : null;

  const outWeekly = {
    type: "weekly",
    curDay,
    startDay: weekStartSnap,
    targetStart: weekStartTarget,
    rows: weekly || [],
  };
  const outMonthly = {
    type: "monthly",
    curDay,
    startDay: monthStartSnap,
    targetStart: monthStartTarget,
    rows: monthly || [],
  };

  fs.writeFileSync("data/period/weekly_current.json", JSON.stringify(outWeekly,null,2), "utf8");
  fs.writeFileSync("data/period/monthly_current.json", JSON.stringify(outMonthly,null,2), "utf8");

  console.log("✅ period caches -> data/period/weekly_current.json + monthly_current.json");
}

main().catch(err=>{
  console.error("❌ Erreur:", err);
  process.exit(1);
});
