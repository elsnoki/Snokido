import fs from "fs";

function clean(s){ return String(s || "").replace(/\s+/g, " ").trim(); }

function slugify(s){
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function toIntLoose(s){
  const n = clean(s).replace(/[^\d]/g, "");
  return n ? Number(n) : null;
}

// Parse lignes du type :
// "1  Talk Takashi  100  1225000 xp  13-04-2014"
function parseMainTableLines(text){
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const players = [];
  for(const line of lines){
    // ignore header
    if(line.toLowerCase().includes("nom du joueur")) continue;

    // détecte une ligne qui commence par un rang
    const m = line.match(/^(\d+)\s+(.+?)\s+(\d+)\s+([\d\s]+)\s*xp\b/i);
    if(!m) continue;

    const rank = Number(m[1]);
    const nom = clean(m[2]);
    const niveau = Number(m[3]);
    const xp = toIntLoose(m[4]);

    if(!nom || xp == null) continue;

    players.push({
      rank,
      nom,
      slug: slugify(nom),
      xp,
      niveau,
      avatar: null,
      profileHref: null,
      karas: null
    });
  }

  // tri par rank au cas où
  players.sort((a,b)=> a.rank - b.rank);
  return players;
}

// Parse extras fin de texte :
// "polyy : 1700"  (xp)
// "Napoléon.1er\n12 964 xp" (xp avec espaces)
function parseExtras(text){
  const extras = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1) format "name : 1700"
  for(const line of lines){
    const m = line.match(/^([^:]+)\s*:\s*([\d\s]+)$/);
    if(!m) continue;

    const nom = clean(m[1]);
    const xp = toIntLoose(m[2]);
    if(!nom || xp == null) continue;

    extras.push({
      nom,
      slug: slugify(nom),
      xp,
      niveau: null,
      avatar: null,
      profileHref: null,
      karas: null
    });
  }

  // 2) format "Name" puis ligne suivante "12 964 xp"
  for(let i=0;i<lines.length-1;i++){
    const nameLine = lines[i];
    const nextLine = lines[i+1];

    // si nextLine contient "xp" et nameLine n’est pas une ligne de tableau
    if(/\bxp\b/i.test(nextLine) && !/^\d+\s+/.test(nameLine)){
      const xp = toIntLoose(nextLine);
      if(xp == null) continue;

      // éviter de doubler un extra déjà trouvé
      const nom = clean(nameLine);
      const key = slugify(nom);
      if(!nom) continue;
      if(extras.some(e => e.slug === key)) continue;

      extras.push({
        nom,
        slug: key,
        xp,
        niveau: null,
        avatar: null,
        profileHref: null,
        karas: null
      });
    }
  }

  // dédoublonnage par slug (garde la première occurrence)
  const seen = new Set();
  const out = [];
  for(const e of extras){
    if(seen.has(e.slug)) continue;
    seen.add(e.slug);
    out.push(e);
  }
  return out;
}

function main(){
  const baselineDate = process.argv[2] || "2026-02-01";

  const inPath = `data/manual/monthly_${baselineDate}.txt`;
  const outPath = `data/period/monthly_baseline.json`;

  if(!fs.existsSync(inPath)){
    console.error("❌ Fichier introuvable:", inPath);
    process.exit(1);
  }

  const txt = fs.readFileSync(inPath, "utf8");

  const playersMain = parseMainTableLines(txt);
  const extras = parseExtras(txt);

  // merge (main + extras non-déjà-présents)
  const mainSlugs = new Set(playersMain.map(p => p.slug));
  const merged = playersMain.slice();
  for(const e of extras){
    if(mainSlugs.has(e.slug)) continue;
    merged.push(e);
  }

  fs.mkdirSync("data/period", { recursive: true });

  const out = {
    type: "monthly_baseline_manual",
    baselineDate,
    generatedAt: new Date().toISOString(),
    players: merged
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");

  console.log("✅ Baseline mensuelle écrite ->", outPath);
  console.log("Players:", merged.length, "(main:", playersMain.length, "extras:", merged.length - playersMain.length, ")");
}

main();
