// xp_widget.js — version stable avec 3 boutons fixes

(function () {

  const STORAGE_KEY = "xpWidgetMode";

  const MODES = ["jour", "hebdo", "mensuel"];

  function slugify(name) {
    return String(name || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function getName(p){ return p?.nom ?? p?.name ?? p?.username ?? "—"; }
  function getAvatar(p){ return p?.avatar ?? null; }
  function getXp(p){ return Number(p?.xp ?? p?.exp ?? 0); }

  async function fetchJson(path){
    const r = await fetch(path, { cache:"no-store" });
    if(!r.ok) return null;
    return await r.json();
  }

  async function loadIndex(){
    const idx = await fetchJson("data/history_paris/index.json");
    if(!Array.isArray(idx)) return null;
    return idx.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
  }

  async function loadSnap(day){
    const s = await fetchJson(`data/history_paris/${day}.json`);
    if(!s) return null;
    if(Array.isArray(s)) return s;
    if(Array.isArray(s.players)) return s.players;
    return null;
  }

  function toDate(str){
    const [y,m,d] = str.split("-").map(Number);
    return new Date(Date.UTC(y,m-1,d));
  }

  function formatDate(d){
    return d.toISOString().slice(0,10);
  }

  function minusDays(str,n){
    const d = toDate(str);
    d.setUTCDate(d.getUTCDate()-n);
    return formatDate(d);
  }

  function mondayOf(str){
    const d = toDate(str);
    const wd = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate()-(wd-1));
    return formatDate(d);
  }

  function firstOfMonth(str){
    const d = toDate(str);
    d.setUTCDate(1);
    return formatDate(d);
  }

  function findClosestLE(index,target){
    for(let i=index.length-1;i>=0;i--){
      if(index[i] <= target) return index[i];
    }
    return null;
  }

  function fmt(n){
    return (n>=0?"+":"") + n.toLocaleString("fr-FR");
  }

  function ensureWidget(){
    if(document.getElementById("xpSide")) return;

    const box = document.createElement("aside");
    box.id="xpSide";
    box.className="xpSide";
    box.innerHTML = `
      <div class="xpSideHead">
        <div>
          <button class="xpBtn" data-mode="jour">Jour</button>
          <button class="xpBtn" data-mode="hebdo">Hebdo</button>
          <button class="xpBtn" data-mode="mensuel">Mensuel</button>
        </div>
      </div>
      <div class="xpSideSub" id="xpRange">—</div>
      <div class="xpSideBody" id="xpBody">Chargement…</div>
    `;
    document.body.appendChild(box);
  }

  function setActive(mode){
    document.querySelectorAll(".xpBtn").forEach(b=>{
      b.style.opacity = (b.dataset.mode===mode) ? "1" : "0.5";
    });
  }

  function computeDelta(cur,base){
    const map = new Map();
    base.forEach(p=> map.set(slugify(getName(p)), getXp(p)));

    const rows=[];
    cur.forEach(p=>{
      const name=getName(p);
      const old=map.get(slugify(name));
      if(old==null) return;
      const dx=getXp(p)-old;
      if(dx===0) return;
      rows.push({nom:name,avatar:getAvatar(p),dx});
    });

    rows.sort((a,b)=>b.dx-a.dx);
    return rows.slice(0,10);
  }

  async function refresh(mode){

    localStorage.setItem(STORAGE_KEY,mode);
    setActive(mode);

    const index=await loadIndex();
    if(!index || index.length<2){
      document.getElementById("xpBody").innerHTML="Pas assez d'historique.";
      return;
    }

    const today=index[index.length-1];
    let baseTarget;

    if(mode==="jour") baseTarget=minusDays(today,1);
    if(mode==="hebdo") baseTarget=mondayOf(today);
    if(mode==="mensuel") baseTarget=firstOfMonth(today);

    const baseDay=findClosestLE(index,baseTarget);
    const todayDay=findClosestLE(index,today);

    document.getElementById("xpRange").textContent =
      `${baseDay} → ${todayDay}`;

    const cur=await loadSnap(todayDay);
    const base=await loadSnap(baseDay);

    const rows=computeDelta(cur,base);

    const body=document.getElementById("xpBody");

    if(!rows.length){
      body.innerHTML="Personne n’a gagné d’XP.";
      return;
    }

    body.innerHTML=rows.map((r,i)=>`
      <div class="xpRow">
        <div class="xpRk">${i+1}</div>
        <div class="xpWho">
          <img class="xpAv" src="${r.avatar||"avatar/1.jpg"}">
          <div class="xpName">${r.nom}</div>
        </div>
        <div class="xpDx">${fmt(r.dx)}</div>
        <div></div>
        <div></div>
      </div>
    `).join("");
  }

  window.addEventListener("DOMContentLoaded",()=>{
    ensureWidget();

    const saved=localStorage.getItem(STORAGE_KEY);
    const start = MODES.includes(saved) ? saved : "jour";

    document.querySelectorAll(".xpBtn").forEach(btn=>{
      btn.onclick=()=> refresh(btn.dataset.mode);
    });

    refresh(start);
  });

})();
