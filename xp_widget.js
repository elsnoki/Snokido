// xp_widget.js — Jour / Hebdo / Mensuel auto cumul

(function () {

  const STORAGE_KEY = "xpWidgetMode"; // jour | hebdo | mensuel

  function slugify(name) {
    return String(name || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function getName(p){ return p.nom ?? p.name ?? p.username ?? "—"; }
  function getXp(p){ return Number(p.xp ?? p.exp ?? 0); }
  function getAvatar(p){ return p.avatar ?? null; }

  async function fetchJson(path){
    const res = await fetch(path, { cache:"no-store" });
    if(!res.ok) return null;
    return await res.json();
  }

  async function loadIndex(){
    const idx = await fetchJson("data/history_paris/index.json");
    return Array.isArray(idx) ? idx : null;
  }

  async function loadSnap(day){
    const j = await fetchJson(`data/history_paris/${day}.json`);
    if(!j) return null;
    if(Array.isArray(j)) return j;
    if(Array.isArray(j.players)) return j.players;
    return null;
  }

  function toDate(d){
    const [y,m,dd] = d.split("-").map(Number);
    return new Date(Date.UTC(y,m-1,dd));
  }

  function isSameMonth(a,b){
    return a.getUTCFullYear() === b.getUTCFullYear() &&
           a.getUTCMonth() === b.getUTCMonth();
  }

  function getMonday(date){
    const d = new Date(date);
    const day = d.getUTCDay() || 7;
    if(day !== 1) d.setUTCDate(d.getUTCDate() - (day - 1));
    return d;
  }

  function fmt(n){
    return (n >= 0 ? "+" : "") + n.toLocaleString("fr-FR");
  }

  function ensureWidget(){
    if(document.getElementById("xpSide")) return;

    const box = document.createElement("aside");
    box.id = "xpSide";
    box.className = "xpSide";
    box.innerHTML = `
      <div class="xpSideHead">
        <div id="xpTitle">Jour</div>
        <button id="xpToggle">▸</button>
      </div>
      <div class="xpSideSub" id="xpRange">—</div>
      <div class="xpSideBody" id="xpBody">Chargement…</div>
    `;
    document.body.appendChild(box);
  }

  function computeDelta(current, base){
    const map = new Map();
    base.forEach(p => map.set(slugify(getName(p)), getXp(p)));

    const rows = [];

    current.forEach(p=>{
      const name = getName(p);
      const oldXp = map.get(slugify(name));
      if(oldXp == null) return;

      const dx = getXp(p) - oldXp;
      if(dx === 0) return;

      rows.push({
        nom:name,
        avatar:getAvatar(p),
        dx
      });
    });

    rows.sort((a,b)=> b.dx - a.dx);
    return rows.slice(0,10);
  }

  async function refresh(mode){

    ensureWidget();

    const title = document.getElementById("xpTitle");
    const range = document.getElementById("xpRange");
    const body = document.getElementById("xpBody");

    title.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    body.innerHTML = "Chargement…";

    const index = await loadIndex();
    if(!index || index.length < 2){
      body.innerHTML = "Pas assez d'historique.";
      return;
    }

    const latestDay = index[index.length-1];
    const latestDate = toDate(latestDay);

    let baseDay = null;

    if(mode === "jour"){
      baseDay = index[index.length-2];
    }

    if(mode === "hebdo"){
      const monday = getMonday(latestDate);
      for(let i=index.length-1;i>=0;i--){
        if(toDate(index[i]) <= monday){
          baseDay = index[i];
          break;
        }
      }
      if(!baseDay) baseDay = index[0];
    }

    if(mode === "mensuel"){
      for(let i=index.length-1;i>=0;i--){
        const d = toDate(index[i]);
        if(!isSameMonth(d, latestDate)){
          baseDay = index[i];
          break;
        }
      }
      if(!baseDay) baseDay = index[0];
    }

    range.textContent = `${baseDay} → ${latestDay}`;

    const current = await loadSnap(latestDay);
    const base = await loadSnap(baseDay);

    if(!current || !base){
      body.innerHTML = "Erreur chargement.";
      return;
    }

    const rows = computeDelta(current, base);

    if(!rows.length){
      body.innerHTML = "Personne n’a gagné d’XP.";
      return;
    }

    body.innerHTML = rows.map((r,i)=>`
      <div class="xpRow">
        <div class="xpRk">${i+1}</div>
        <div class="xpWho">
          <img class="xpAv" src="${r.avatar || "avatar/1.jpg"}">
          <div class="xpName">${r.nom}</div>
        </div>
        <div class="xpDx">${fmt(r.dx)}</div>
        <div></div>
        <div></div>
      </div>
    `).join("");

    document.getElementById("xpToggle").onclick = ()=>{
      const modes = ["jour","hebdo","mensuel"];
      const next = modes[(modes.indexOf(mode)+1)%3];
      localStorage.setItem(STORAGE_KEY,next);
      refresh(next);
    };
  }

  window.addEventListener("DOMContentLoaded",()=>{
    const mode = localStorage.getItem(STORAGE_KEY) || "jour";
    refresh(mode);
  });

})();
