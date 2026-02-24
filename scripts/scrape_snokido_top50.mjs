import fs from "fs";
import * as cheerio from "cheerio";

function clean(s){ return (s || "").replace(/\s+/g, " ").trim(); }
function toInt(s){
  const n = clean(s).replace(/[^\d]/g, "");
  return n ? Number(n) : null;
}
function slugify(s){
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}
function ensureDir(path){ fs.mkdirSync(path, { recursive: true }); }
function readJsonIfExists(path, fallback){
  try{
    if(!fs.existsSync(path)) return fallback;
    return JSON.parse(fs.readFileSync(path, "utf8"));
  }catch{ return fallback; }
}
function writeJson(path, obj){
  fs.writeFileSync(path, JSON.stringify(obj, null, 2), "utf8");
}
function absUrl(url){
  if(!url) return "";
  if(url.startsWith("http")) return url;
  return "https://www.snokido.fr" + url;
}

function parisNowParts(){
  const dtf = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false
  });
  const parts = dtf.formatToParts(new Date());
  const get = (t) => parts.find(p => p.type === t)?.value;
  const yyyy = get("year");
  const mm = get("month");
  const dd = get("day");
  const hh = get("hour");
  const mi = get("minute");
  const ss = get("second");
  return { yyyy, mm, dd, hh, mi, ss, dateKey: `${yyyy}-${mm}-${dd}` };
}
function weekdayParis(){
  const dtf = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "short" });
  const w = dtf.format(new Date()).toLowerCase();
  if(w.startsWith("lun")) return 1;
  if(w.startsWith("mar")) return 2;
  if(w.startsWith("mer")) return 3;
  if(w.startsWith("jeu")) return 4;
  if(w.startsWith("ven")) return 5;
  if(w.startsWith("sam")) return 6;
  return 7;
}

async function fetchWithUA(url){
  return await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
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

function findPlayersTable($){
  const t1 = $("table").filter((i, el) => {
    const headers = $(el).find("th").map((_, th) => clean($(th).text()).toLowerCase()).get();
    if (!headers.length) return false;
    const hasName = headers.some(h => h.includes("nom"));
    const hasXp = headers.some(h => h.includes("xp") || h.includes("exp"));
    const hasDate = headers.some(h => h.includes("date") || h.includes("inscription"));
    return hasName && hasXp && hasDate;
  }).first();
  if(t1.length) return t1;

  const t2 = $("table").filter((i, el) => {
    const rows = $(el).find("tr");
    if(rows.length < 20) return false;
    const firstTdCount = rows.eq(1).find("td").length;
    return firstTdCount >= 5;
  }).first();
  if(t2.length) return t2;

  return null;
}

function parsePlayers(html){
  const $ = cheerio.load(html);
  const table = findPlayersTable($);
  if(!table || !table.length) return { players: [], reason: "table_not_found" };

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
  const fullText = clean($("body").text());

  let m = fullText.match(/Kara\s*([\d\s]+)/i);
  if(m && toInt(m[1]) != null) return toInt(m[1]);

  m = fullText.match(/([\d\s]+)\s*Kara/i);
  if(m && toInt(m[1]) != null) return toInt(m[1]);

  return null;
}

// modèle niveau théorique
const XP_AT_100 = 49500;
const A1 = 1290;
const R = 0.0006792294619366293;
function levelsBeyond100FromXp(xpExtra){
  if(xpExtra <= 0) return 0;
  const x = (xpExtra * R / A1) + 1;
  if(x <= 1) return 0;
  const n = Math.log(x) / Math.log(1 + R);
  return Math.max(0, Math.floor(n));
}
function xpToTheoLevel(xp, fallbackLevel){
  const xpNum = Number(xp || 0);
  if(xpNum <= XP_AT_100){
    return (typeof fallbackLevel === "number" && fallbackLevel > 0) ? fallbackLevel : 100;
  }
  return 100 + levelsBeyond100FromXp(xpNum - XP_AT_100);
}

function buildMapBySlug(list){
  const m = new Map();
  for(const p of list) m.set(slugify(p.nom), p);
  return m;
}
function applyTieBreak(rows){
  const groups = new Map();
  rows.forEach(r => {
    const k = r.dxp;
    if(!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  });

  for(const [dxp, arr] of groups){
    if(arr.length <= 1) continue;
    const names = arr.map(x => slugify(x.nom));
    const onlyThoseTwo = arr.length === 2 && names.includes("betelgeuse") && names.includes("aldebaran");
    if(onlyThoseTwo) continue;
    for(let i=1;i<arr.length;i++) arr[i].dxp = arr[i].dxp - 78;
  }
}
function computePeriod({ current, baseline, prevPeriodRows }){
  const baseMap = buildMapBySlug(baseline);
  const rows = [];

  for(const p of current){
    const b = baseMap.get(slugify(p.nom));
    if(!b) continue;

    const dxpRaw = (Number(p.xp)||0) - (Number(b.xp)||0);
    if(dxpRaw === 0) continue;

    const curLvl = xpToTheoLevel(p.xp, p.niveau);
    const baseLvl = xpToTheoLevel(b.xp, b.niveau);
    const dLvl = curLvl - baseLvl;

    rows.push({ nom: p.nom, avatar: p.avatar, dxp: dxpRaw, dLvl, profileHref: p.profileHref });
  }

  rows.sort((a,b)=> b.dxp - a.dxp);
  applyTieBreak(rows);
  rows.sort((a,b)=> b.dxp - a.dxp);

  const prevRank = new Map();
  if(Array.isArray(prevPeriodRows)){
    prevPeriodRows.forEach((r, i) => prevRank.set(slugify(r.nom), i+1));
  }
  rows.forEach((r, i) => {
    const nowRank = i+1;
    const oldRank = prevRank.get(slugify(r.nom));
    r.rank = nowRank;
    r.dPlace = oldRank ? (oldRank - nowRank) : 0;
  });

  return rows;
}

async function main(){
  ensureDir("data");
  ensureDir("data/period");
  ensureDir("data/history_paris");

  const url = "https://www.snokido.fr/players";
  console.log("🌐 Fetch:", url);

  const res = await fetchWithUA(url);
  const html = await res.text();

  const $ = cheerio.load(html);
  console.log("TITLE:", clean($("title").text()));
  console.log("H1:", clean($("h1").first().text()));
  console.log("tables:", $("table").length);

  const { players, reason } = parsePlayers(html);
  if(!players.length){
    fs.writeFileSync("data/debug_players.html", html, "utf8");
    console.error(`❌ 0 joueurs trouvés. reason=${reason}. debug -> data/debug_players.html`);
    process.exit(1);
  }

  const top50 = players.slice(0, 50);

  console.log("🔎 Fetch profils (Kara) Top50...");
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

  // export top50 array
  writeJson("data/snokido_top50.json", top50);

  // snapshot obj
  const now = parisNowParts();
  const snapshot = {
    date: now.dateKey,
    generatedAtParis: `${now.dateKey} ${now.hh}:${now.mi}:${now.ss}`,
    players: top50.map(p => ({
      nom: p.nom,
      slug: slugify(p.nom),
      xp: Number(p.xp) || 0,
      karas: (p.karas == null ? 0 : Number(p.karas)),
      avatar: p.avatar || null,
      profileHref: p.profileHref || null,
      niveau: (typeof p.niveau === "number" ? p.niveau : null)
    }))
  };

  writeJson(`data/history_paris/${now.dateKey}.json`, snapshot);

  const indexPath = `data/history_paris/index.json`;
  const index = readJsonIfExists(indexPath, []);
  const nextIndex = Array.isArray(index) ? index.slice() : [];
  if(!nextIndex.includes(now.dateKey)) nextIndex.push(now.dateKey);
  nextIndex.sort();
  writeJson(indexPath, nextIndex);

  // baselines
  const wd = weekdayParis();
  const weekBasePath = "data/period/weekly_baseline.json";
  const monthBasePath = "data/period/monthly_baseline.json";

  if(wd === 1 || !fs.existsSync(weekBasePath)) writeJson(weekBasePath, snapshot);
  if(now.dd === "01" || !fs.existsSync(monthBasePath)) writeJson(monthBasePath, snapshot);

  const weeklyBase = readJsonIfExists(weekBasePath, snapshot);
  const monthlyBase = readJsonIfExists(monthBasePath, snapshot);

  const prevWeekly = readJsonIfExists("data/period/weekly_current.json", null);
  const prevMonthly = readJsonIfExists("data/period/monthly_current.json", null);

  const weeklyRows = computePeriod({
    current: snapshot.players,
    baseline: weeklyBase.players || [],
    prevPeriodRows: prevWeekly?.rows
  });

  const monthlyRows = computePeriod({
    current: snapshot.players,
    baseline: monthlyBase.players || [],
    prevPeriodRows: prevMonthly?.rows
  });

  writeJson("data/period/weekly_current.json", {
    type: "weekly",
    baselineDate: weeklyBase.date,
    asOfDate: snapshot.date,
    rows: weeklyRows
  });

  writeJson("data/period/monthly_current.json", {
    type: "monthly",
    baselineDate: monthlyBase.date,
    asOfDate: snapshot.date,
    rows: monthlyRows
  });

  // preuve de run
  writeJson("data/last_run.json", {
    generatedAtParis: snapshot.generatedAtParis,
    date: snapshot.date,
    tablesDetected: $("table").length
  });

  console.log("✅ done");
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
