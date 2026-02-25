// xp_widget.js — Widget Jour/Hebdo/Mensuel basé sur:
// CURRENT = data/players_pages.json (si existe) sinon data/snokido_top50.json
// BASELINE = snapshots officiels data/history_paris/YYYY-MM-DD.json
// => Le widget se met à jour à chaque workflow (08h/16h/manual) car CURRENT change.

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
  function getKara(p){ return (p?.karas == null ? null : Number(p.karas)); }

  async function fetchJson(path){
    const res = await fetch(path, { cache: "no-store" });
    if(!res.ok) return null;
    try { return await res.json(); } catch { return null; }
  }

  async function loadCurrentPlayers(){
    // 1) préférer le gros fichier (50 pages)
    const big = await fetchJson("data/players_pages.json");
    if(Array.isArray(big)) return big;

    // 2) fallback top50
    const top = await fetchJson("data/snokido_top50.json");
    if(Array.isArray(top)) return top;

    return null;
  }

  async function loadIndex(){
    const idx = await fetchJson("data/history_paris/index.json");
    if(!Array.isArray(idx)) return null;
    return idx
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .filter(d => d !== "YYYY-MM-DD")
      .sort();
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
  function findClosestLE(index, targetDay){
    for(let i=index.length-1;i>=0;i--){
      if(index[i] <= targetDay) return index[i];
    }
    return null;
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
      <div class="xpSideSub" id="xpSideSub">Chargement…</div>
      <div class="xpSideBody" id="xpSideBody">
        <div class="xpSideLoading">Chargement…</div>
      </div>
    `;
    document.body.appendChild(box);
  }

  function renderEmpty(msg){
    document.getElementById("xpSideBody").innerHTML = `<div class="xpSideEmpty">${msg}</div>`;
  }

  function computeDeltaRows(currentPlayers, baselinePlayers){
    const baseMap = new Map();
    baselinePlayers.forEach(p => {
      baseMap.set(slugify(getName(p)), {
        xp: getXp(p),
        kara: getKara(p),
      });
    });

    const rows = [];
    currentPlayers.forEach(p => {
      const name = getName(p);
      const key = slugify(name);
      const base = baseMap.get(key);
      if(!base) return;

      const curXp = getXp(p);
      const dx = curXp - base.xp;

      if(dx === 0) return;

      const curK = getKara(p);
      const dkara = (curK == null || base.kara == null) ? null : (curK - base.kara);

      rows.push({
        nom: name,
        avatar: getAvatar(p),
        dx,
        dkara
      });
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

    const current = await loadCurrentPlayers();
    if(!current){
      sub.textContent = "—";
      renderEmpty("Impossible de charger data/players_pages.json ou data/snokido_top50.json.");
      return;
    }

    const index = await loadIndex();
    if(!index || index.length < 2){
      sub.textContent = "—";
      renderEmpty("Pas assez d'historique (history_paris). Attends le snapshot 23h59.");
      return;
    }

    const today = index[index.length - 1];

    let baseTarget;
    if(mode === "jour") baseTarget = dayMinus(today, 1);
    else if(mode === "hebdo") baseTarget = mondayOfWeek(today);
    else baseTarget = firstOfMonth(today);

    const baseDay = findClosestLE(index, baseTarget);
    if(!baseDay){
      sub.textContent = "—";
      renderEmpty("Baseline introuvable.");
      return;
    }

    sub.textContent = `${baseDay} → ${today}`;

    const baseline = await loadSnap(baseDay);
    if(!baseline){
      renderEmpty("Snapshot baseline introuvable.");
      return;
    }

    const rows = computeDeltaRows(current, baseline);

    if(!rows.length){
      renderEmpty("Personne n’a gagné d’XP sur la période.");
      return;
    }

    body.innerHTML = rows.map((r,i)=>`
      <div class="xpRow">
        <div class="xpRk">${i+1}</div>
        <div class="xpWho">
          <img class="xpAv" src="${r.avatar || "avatar/1.jpg"}" alt="${r.nom}">
          <div class="xpName" title="${r.nom}">${r.nom}</div>
        </div>
        <div class="xpDx">${fmtSigned(r.dx)}</div>
        <div class="xpKara">${r.dkara == null ? "—" : fmtSigned(r.dkara)}</div>
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

  window.addEventListener("DOMContentLoaded", () => {
    const p = (location.pathname || "").toLowerCase();
    if (p.includes("gang")) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    const mode = (saved === "hebdo" || saved === "mensuel" || saved === "jour") ? saved : "jour";
    refresh(mode);
  });
})();
