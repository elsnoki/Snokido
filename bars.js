// bars.js — génère la barre de navigation + labels auto (mois précédent, année, année-1)

(function(){
  function getMode(){
    const p = new URLSearchParams(location.search);
    return String(p.get("mode") || "jour").toLowerCase();
  }

  const monthsFR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

  function normalizeDay(s){
    const str = String(s||"").trim();
    const m = str.match(/^(\d{4}-\d{2}-\d{2})(?:\.json)?$/);
    return m ? m[1] : null;
  }

  async function fromIndexLatestDay(){
    try{
      const res = await fetch("data/history_paris/index.json?t=" + Date.now(), { cache:"no-store" });
      if(!res.ok) throw new Error();
      const idx = await res.json();
      if(!Array.isArray(idx)) throw new Error();
      const days = idx.map(normalizeDay).filter(Boolean).sort();
      if(!days.length) throw new Error();
      return days[days.length-1];
    }catch{
      return null;
    }
  }

  function makeHref(mode){
    const u = new URL(location.href);
    u.searchParams.set("mode", mode);
    return u.toString();
  }

  function setActive(btn, isActive){
    btn.classList.toggle("is-active", !!isActive);
  }

  function renderBars(){
    const mode = getMode();

    // barre unique : mêmes boutons partout (tu ne perds rien, tout reste accessible)
    const items = [
      { key:"jour", label:"🕛 Jour" },
      { key:"hier", label:"⏪ Hier" },
      { key:"hebdo", label:"📅 Hebdo" },
      { key:"mensuel", label:"🗓️ Mensuel" },
      { key:"ans", label:"📆 Annuel" },
      { key:"ans-veille", label:"📆 Année-1" },
      { key:"niveau", label:"⭐ Niveau théorique" },
      // Si tu veux garder un accès "mois-veille" plus tard :
      // { key:"mois-veille", label:"⏮️ Mois-veille" },
    ];

    document.querySelectorAll('.barMount[data-bar="main"]').forEach(mount => {
      mount.innerHTML = `
        <div class="subnav">
          ${items.map(it => `
            <a class="subnav-btn" data-key="${it.key}" href="${makeHref(it.key)}">${it.label}</a>
          `).join("")}
          <a class="subnav-btn" data-key="prevMonth" href="${makeHref("mensuel")}" id="btnPrevMonth">⏮️ —</a>
          <a class="subnav-btn" data-key="year" href="${makeHref("ans")}" id="btnYear">📆 —</a>
          <a class="subnav-btn" data-key="prevYear" href="${makeHref("ans-veille")}" id="btnPrevYear">📆 —</a>
        </div>
      `;

      // active state
      mount.querySelectorAll(".subnav-btn[data-key]").forEach(a=>{
        const k = a.getAttribute("data-key");
        if(k === "prevMonth" || k === "year" || k === "prevYear") return;
        setActive(a, k === mode || (mode === "jour-veille" && k === "hier") || (mode === "theorique" && k === "niveau"));
      });
    });
  }

  async function setLabels(){
    const latestDay = await fromIndexLatestDay();

    let y, m;
    if(latestDay){
      y = Number(latestDay.slice(0,4));
      m = Number(latestDay.slice(5,7));
    }else{
      const now = new Date();
      y = now.getFullYear();
      m = now.getMonth()+1;
    }

    // année (courante)
    document.querySelectorAll("#btnYear").forEach(btn=>{
      btn.textContent = "📆 " + y;
      btn.title = "Classement annuel (" + y + ")";
    });

    // année précédente
    document.querySelectorAll("#btnPrevYear").forEach(btn=>{
      btn.textContent = "📆 " + (y - 1);
      btn.title = "Classement annuel (" + (y - 1) + ")";
    });

    // mois précédent (label)
    let pm = m - 1;
    let py = y;
    if(pm <= 0){ pm = 12; py = y - 1; }

    document.querySelectorAll("#btnPrevMonth").forEach(btn=>{
      btn.textContent = "⏮️ " + monthsFR[pm-1];
      btn.title = "Classement du mois précédent (" + monthsFR[pm-1] + " " + py + ")";
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    renderBars();
    await setLabels();
  });
})();
