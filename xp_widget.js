// xp_widget.js — Jour/Hebdo/Mensuel basés sur dates Paris (minuit)
// Jour: (dernier snapshot <= aujourd'hui) vs (dernier snapshot <= hier)
// Hebdo: (<= aujourd'hui) vs (<= lundi)
// Mensuel: (<= aujourd'hui) vs (<= 1er du mois)
// Ignore YYYY-MM-DD.json

(function () {
  const STORAGE_KEY = "xpWidgetMode"; // "jour" | "hebdo" | "mensuel"

  function slugify(name) {
    return String(name || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function getName(p){ return p?.nom ?? p?.name ?? p?.username ?? p?.pseudo ?? "—"; }
  function getAvatar(p){ return p?.avatar ?? null; }
  function getXp(p){ return Number(p?.xp ?? p?.exp ?? 0); }

  async function fetchJson(path){
    const res = await fetch(path, { cache: "no-store" });
    if(!res.ok) return null;
    try { return await res.json(); } catch { return null; }
  }

  async function loadIndex(){
    const idx = await fetchJson("data/history_paris/index.json");
    if(!Array.isArray(idx)) return null;
    // filtre le template
    return idx.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && d !== "YYYY-MM-DD");
  }

  async function loadSnap(day){
    const snap = await fetchJson(`data/history_paris/${day}.json`);
    if(!snap) return null;
    if(Array.isArray(snap)) return snap;
    if(Array.isArray(snap.players)) return snap.players;
    return null;
  }

  function toUTCDate(dayStr){
    const [y,m,d] = dayStr.split("-").map(Number);
    return new Date(Date.UTC(y, m-1, d));
  }

  function fromUTCDate(dt){
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth()+1).padStart(2,"0");
    const dd = String(dt.getUTCDate()).padStart(2,"0");
    return `${yy}-${mm}-${dd}`;
  }

  function dayMinus(dayStr, delta){
    const d = toUTCDate(dayStr);
    d.setUTCDate(d.getUTCDate() - delta);
    return fromUTCDate(d);
  }

  // lundi ISO (lun=1)
  function mondayOfWeek(dayStr){
    const d = toUTCDate(dayStr);
    const wd = d.getUTCDay() || 7; // dim=7
    d.setUTCDate(d.getUTCDate() - (wd - 1));
    return fromUTCDate(d);
  }

  function firstOfMonth(dayStr){
    const d = toUTCDate(dayStr);
    d.setUTCDate(1);
    return fromUTCDate(d);
  }

  function fmtSigned(n){
    const v = Number(n || 0);
    return (v >= 0 ? "+" : "") + v.toLocaleString("fr-FR");
  }

  function ensureWidget(){
    if(document.getElementById("xpSide")) return;

    const box = document.createElement("aside");
    box.id = "xpSide";
    box.className = "xpSide";
    box.innerHTML = `
      <div class="xpSideHead">
        <div class="xpSideTitle" id="xpSideTitle">Jour</div>
        <button class="xpSideToggle" id="xpSideToggle" title="Basculer Jour/Hebdo/Mensuel">▸</button>
      </div>
      <div class="xpSideSub" id="xpSideSub">—</div>
      <div class="xpSideBody" id="xpSideBody">
        <div class="xpSideLoading">Chargement…</div>
      </div>
    `;
    document.body.appendChild(box);
  }

  function renderEmpty(msg){
    document.getElementById("xpSideBody").innerHTML = `<div class="xpSideEmpty">${msg}</div>`;
  }

  // trouve dans index le plus récent <= targetDay
  function findClosestLE(index, targetDay){
    for(let i=index.length-1;i>=0;i--){
      if(index[i] <= targetDay) return index[i];
    }
    return null;
  }

  function computeDeltaRows(cur, base){
    const baseMap = new Map();
    base.forEach(p => baseMap.set(slugify(getName(p)), getXp(p)));

    const rows = [];
    cur.forEach(p => {
      const name = getName(p);
      const key = slugify(name);
      if(!baseMap.has(key)) return;
      const dx = getXp(p) - baseMap.get(key);
      if(dx === 0) return;
      rows.push({ nom: name, avatar: getAvatar(p), dx });
    });

    rows.sort((a,b)=> b.dx - a.dx);
    return rows.slice(0, 10);
  }

  async function refresh(mode){
    ensureWidget();

    const title = document.getElementById("xpSideTitle");
    const sub = document.getElementById("xpSideSub");
    const body = document.getElementById("xpSideBody");
    const toggle = document.getElementById("xpSideToggle");

    title.textContent = mode === "mensuel" ? "Mensuel" : (mode === "hebdo" ? "Hebdo" : "Jour");
    body.innerHTML = `<div class="xpSideLoading">Chargement…</div>`;

    const index = await loadIndex();
    if(!index || index.length < 2){
      sub.textContent = "—";
      renderEmpty("Pas assez d'historique.");
      return;
    }

    const today = index[index.length - 1]; // dernier jour dispo
    const todaySnapDay = findClosestLE(index, today);

    let baseTarget;
    if(mode === "jour") baseTarget = dayMinus(today, 1);
    else if(mode === "hebdo") baseTarget = mondayOfWeek(today);
    else baseTarget = firstOfMonth(today);

    const baseSnapDay = findClosestLE(index, baseTarget);

    if(!todaySnapDay || !baseSnapDay){
      sub.textContent = "—";
      renderEmpty("Baseline introuvable.");
      return;
    }

    sub.textContent = `${baseSnapDay} → ${todaySnapDay}`;

    const cur = await loadSnap(todaySnapDay);
    const base = await loadSnap(baseSnapDay);

    if(!cur || !base){
      renderEmpty("Erreur chargement snapshots.");
      return;
    }

    const rows = computeDeltaRows(cur, base);
    if(!rows.length){
      renderEmpty("Personne n’a gagné d’XP sur la période.");
      return;
    }

    // Compatible avec ton CSS (5 colonnes)
    body.innerHTML = rows.map((r,i)=>`
      <div class="xpRow">
        <div class="xpRk">${i+1}</div>
        <div class="xpWho">
          <img class="xpAv" src="${r.avatar || "avatar/1.jpg"}" alt="${r.nom}">
          <div class="xpName" title="${r.nom}">${r.nom}</div>
        </div>
        <div class="xpDx">${fmtSigned(r.dx)}</div>
        <div class="xpKara">—</div>
        <div class="xpMv"><span class="xpMove same">—</span></div>
      </div>
    `).join("");

    body.insertAdjacentHTML("beforeend", `
      <div class="xpSideFoot">
        <span>ΔXP</span><span>ΔKara</span><span>ΔPlace</span>
      </div>
    `);

    toggle.onclick = () => {
      const modes = ["jour","hebdo","mensuel"];
      const next = modes[(modes.indexOf(mode)+1) % modes.length];
      localStorage.setItem(STORAGE_KEY, next);
      refresh(next);
    };
  }

  window.addEventListener("DOMContentLoaded", ()=>{
    const mode = localStorage.getItem(STORAGE_KEY) || "jour";
    refresh(mode);
  });
})();
