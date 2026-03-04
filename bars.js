// bars.js — barre de navigation pour classement.html (1 page)

function getMode(){
  const p = new URLSearchParams(location.search);
  return String(p.get("mode") || "jour").toLowerCase();
}

function normalizeDay(s){
  const str = String(s||"").trim();
  const m = str.match(/^(\d{4}-\d{2}-\d{2})(?:\.json)?$/);
  return m ? m[1] : null;
}

async function getLatestDayFromIndex(){
  try{
    const res = await fetch("data/history_paris/index.json?t=" + Date.now(), { cache:"no-store" });
    if(!res.ok) throw new Error("HTTP " + res.status);
    const idx = await res.json();
    if(!Array.isArray(idx)) throw new Error("index pas un tableau");
    const days = idx.map(normalizeDay).filter(Boolean).sort();
    return days.length ? days[days.length - 1] : null;
  }catch{
    return null;
  }
}

function aBtn(mode, label, activeMode){
  const cls = "subnav-btn" + (activeMode === mode ? " is-active" : "");
  return `<a class="${cls}" href="classement.html?mode=${encodeURIComponent(mode)}">${label}</a>`;
}

async function mountBars(){
  const mode = getMode();
  const mounts = document.querySelectorAll('.barMount[data-bar="main"]');
  if(!mounts.length) return;

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
  if(pm <= 0) pm = 12;

  const prevMonthLabel = monthsFR[pm-1];
  const yearLabel = String(y);
  const yearPrevLabel = String(y - 1);

  const html =
    `<div class="subnav">` +
      aBtn("jour","🕛 Jour",mode) +
      aBtn("hier","⏪ Hier",mode) +
      aBtn("hebdo","📅 Hebdo",mode) +
      aBtn("mensuel","🗓️ Mois",mode) +
      aBtn("mois-veille","⏮️ " + prevMonthLabel,mode) +
      aBtn("ans","📆 " + yearLabel,mode) +
      aBtn("ans-veille","📆 " + yearPrevLabel,mode) +
      aBtn("annees","📚 Années",mode) +
      aBtn("niveau","⭐ Niveau théorique",mode) +
    `</div>`;

  mounts.forEach(el => el.innerHTML = html);
}

document.addEventListener("DOMContentLoaded", mountBars);
