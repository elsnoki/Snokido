// bars.js — barre de navigation pour classement.html (1 page)

function getMode(){
  const p = new URLSearchParams(location.search);
  return String(p.get("mode") || "jour").toLowerCase();
}

async function getLatestDayFromIndex(){
  try{
    const res = await fetch("data/history_paris/index.json?t=" + Date.now(), { cache:"no-store" });
    if(!res.ok) throw new Error("HTTP " + res.status);
    const idx = await res.json();
    if(!Array.isArray(idx)) throw new Error("index pas un tableau");

    const days = idx
      .map(x => {
        const s = String(x||"").trim();
        const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:\.json)?$/);
        return m ? m[1] : null;
      })
      .filter(Boolean)
      .sort();

    return days.length ? days[days.length - 1] : null;
  }catch{
    return null;
  }
}

function buildBarHTML({ activeMode, yearLabel, prevMonthLabel }){
  // ✅ IMPORTANT : tout pointe vers classement.html?mode=...
  const items = [
    ["jour",       "🕛 Jour"],
    ["hier",       "⏪ Hier"],
    ["hebdo",      "📅 Hebdo"],
    ["mensuel",    "🗓️ Mensuel"],
    ["mois-veille","⏮️ " + (prevMonthLabel || "Mois-veille")],
    ["ans",        "📆 " + (yearLabel || "Année")],
    ["ans-veille", "📆 " + ((yearLabel && /^\d+$/.test(yearLabel)) ? (Number(yearLabel)-1) : "Année-1")],
    ["niveau",     "⭐ Niveau théorique"],
  ];

  const btn = (mode, label) => {
    const cls = "subnav-btn" + (activeMode === mode ? " is-active" : "");
    return `<a class="${cls}" href="classement.html?mode=${encodeURIComponent(mode)}">${label}</a>`;
  };

  return `
    <div class="subnav">
      ${items.map(([m,l]) => btn(m,l)).join("")}
    </div>
  `;
}

async function mountBars(){
  const mode = getMode();
  const mounts = document.querySelectorAll('.barMount[data-bar="main"]');
  if(!mounts.length) return;

  // labels auto (mois précédent + année) basés sur index.json si possible
  const monthsFR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const latestDay = await getLatestDayFromIndex();

  let y, m;
  if(latestDay){
    y = Number(latestDay.slice(0,4));
    m = Number(latestDay.slice(5,7));
  }else{
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth() + 1;
  }

  let pm = m - 1;
  let py = y;
  if(pm <= 0){ pm = 12; py = y - 1; }

  const yearLabel = String(y);
  const prevMonthLabel = monthsFR[pm-1]; // juste "février" etc (ton bouton reste "mode=mois-veille")

  const html = buildBarHTML({ activeMode: mode, yearLabel, prevMonthLabel });

  mounts.forEach(el => { el.innerHTML = html; });
}

document.addEventListener("DOMContentLoaded", mountBars);
