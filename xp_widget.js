// xp_widget.js — Mini classement à gauche (Hebdo/Mensuel)
// Dépend de: data/history_paris/index.json + snapshots .json
// Ne casse rien si l'historique n'existe pas.

(function () {
  const XP_AT_100 = 49500;
  const A1 = 1290;
  const R = 0.0006792294619366293;

  const STORAGE_KEY = "xpWidgetMode"; // "hebdo" | "mensuel"

  function slugify(name) {
    return String(name || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function levelsBeyond100FromXp(xpExtra) {
    if (xpExtra <= 0) return 0;
    const x = (xpExtra * R / A1) + 1;
    if (x <= 1) return 0;
    const n = Math.log(x) / Math.log(1 + R);
    return Math.max(0, Math.floor(n));
  }

  function xpToTheoLevel(xp, officialLevel) {
    const v = Number(xp || 0);
    if (v <= XP_AT_100) {
      return (typeof officialLevel === "number" && officialLevel > 0) ? officialLevel : 100;
    }
    return 100 + levelsBeyond100FromXp(v - XP_AT_100);
  }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    try { return await res.json(); } catch { return null; }
  }

  function breakTies(rows) {
    // égalité: -78 sur certains, sauf Betelgeuse/Aldebaran ensemble
    const groups = new Map();
    for (const r of rows) {
      const k = r.dx;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    }

    const exA = slugify("Aldébaran");
    const exB = slugify("Bételgeuse");

    for (const [dx, g] of groups) {
      if (g.length <= 1) continue;

      const names = g.map(x => slugify(x.nom)).sort();
      const isExceptionPair = g.length === 2 && names[0] === exA && names[1] === exB;
      if (isExceptionPair) continue;

      g.sort((a, b) => slugify(a.nom).localeCompare(slugify(b.nom)));
      for (let i = 1; i < g.length; i++) g[i].dx -= 78 * i;
    }
    return rows;
  }

  function computeRankMap(rows) {
    const m = new Map();
    rows.forEach((r, i) => m.set(slugify(r.nom), i + 1));
    return m;
  }

  function formatSigned(n) {
    const v = Number(n || 0);
    return (v >= 0 ? "+" : "") + v.toLocaleString("fr-FR");
  }

  function ensureWidget() {
    if (document.getElementById("xpSide")) return;

    const box = document.createElement("aside");
    box.id = "xpSide";
    box.className = "xpSide";
    box.innerHTML = `
      <div class="xpSideHead">
        <div class="xpSideTitle" id="xpSideTitle">Hebdo</div>
        <button class="xpSideToggle" id="xpSideToggle" title="Basculer Hebdo/Mensuel">▸</button>
      </div>
      <div class="xpSideSub" id="xpSideSub">Chargement…</div>
      <div class="xpSideBody" id="xpSideBody">
        <div class="xpSideLoading">Chargement…</div>
      </div>
    `;
    document.body.appendChild(box);
  }

  async function buildPeriodRows(index, step) {
    // step = 1 (hebdo) / 4 (mensuel ~ 4 semaines)
    if (!Array.isArray(index) || index.length < step + 1) return { rows: null, meta: null };

    const curDay = index[index.length - 1];
    const oldDay = index[index.length - 1 - step];

    const cur = await fetchJson(`data/history_paris/${curDay}.json`);
    const old = await fetchJson(`data/history_paris/${oldDay}.json`);
    if (!Array.isArray(cur) || !Array.isArray(old)) return { rows: null, meta: null };

    const curMap = new Map(cur.map(p => [slugify(p.nom), p]));
    const oldMap = new Map(old.map(p => [slugify(p.nom), p]));

    let rows = [];
    for (const [k, p] of curMap) {
      const o = oldMap.get(k);
      const xpNow = Number(p.xp || 0);
      const xpOld = Number(o?.xp || 0);
      let dx = xpNow - xpOld;

      const lvlNow = xpToTheoLevel(xpNow, p.niveau);
      const lvlOld = xpToTheoLevel(xpOld, o?.niveau);
      const dlvl = lvlNow - lvlOld;

      rows.push({ nom: p.nom, avatar: p.avatar, dx, xpNow, dlvl });
    }

    rows = breakTies(rows);
    rows.sort((a, b) => b.dx - a.dx);

    return {
      rows,
      meta: { curDay, oldDay }
    };
  }

  async function buildPrevRankMap(index, step) {
    // classements précédents de période pour calculer ▲▼
    // hebdo : compare (snap[-2] vs snap[-3]) ; mensuel : (snap[-(step+1)] vs snap[-(2*step+1)])
    // Simplif robuste: on prend la période juste avant si possible.
    const need = (2 * step) + 1;
    if (!Array.isArray(index) || index.length < need) return null;

    const aDay = index[index.length - 1 - step];      // fin période précédente
    const bDay = index[index.length - 1 - 2 * step];  // début période précédente

    const a = await fetchJson(`data/history_paris/${aDay}.json`);
    const b = await fetchJson(`data/history_paris/${bDay}.json`);
    if (!Array.isArray(a) || !Array.isArray(b)) return null;

    const am = new Map(a.map(p => [slugify(p.nom), p]));
    const bm = new Map(b.map(p => [slugify(p.nom), p]));

    let prevRows = [];
    for (const [k, p] of am) {
      const o = bm.get(k);
      prevRows.push({ nom: p.nom, dx: Number(p.xp || 0) - Number(o?.xp || 0) });
    }

    prevRows = breakTies(prevRows);
    prevRows.sort((x, y) => y.dx - x.dx);
    return computeRankMap(prevRows);
  }

  function moveBadge(curRank, prevRank) {
    if (!prevRank) return `<span class="xpMove same">—</span>`;
    const diff = prevRank - curRank; // positif = montée
    if (diff > 0) return `<span class="xpMove up">▲${diff}</span>`;
    if (diff < 0) return `<span class="xpMove down">▼${Math.abs(diff)}</span>`;
    return `<span class="xpMove same">•0</span>`;
  }

  function render(rows, meta, mode, prevRankMap) {
    const title = document.getElementById("xpSideTitle");
    const sub = document.getElementById("xpSideSub");
    const body = document.getElementById("xpSideBody");

    title.textContent = (mode === "mensuel") ? "Mensuel" : "Hebdo";
    sub.textContent = meta ? `${meta.oldDay} → ${meta.curDay}` : "—";

    if (!rows) {
      body.innerHTML = `<div class="xpSideEmpty">Pas assez d’historique.</div>`;
      return;
    }

    // Mini classement top 10 (modifiable)
    const top = rows.slice(0, 10);

    body.innerHTML = top.map((r, i) => {
      const curRank = i + 1;
      const prevRank = prevRankMap ? prevRankMap.get(slugify(r.nom)) : null;

      return `
        <div class="xpRow">
          <div class="xpRk">${curRank}</div>
          <img class="xpAv" src="${r.avatar || "avatar/1.jpg"}" alt="${r.nom}">
          <div class="xpName" title="${r.nom}">${r.nom}</div>
          <div class="xpDx">${formatSigned(r.dx)}</div>
          <div class="xpLv">${formatSigned(r.dlvl)}</div>
          <div class="xpMv">${moveBadge(curRank, prevRank)}</div>
        </div>
      `;
    }).join("");

    body.insertAdjacentHTML("beforeend", `
      <div class="xpSideFoot">
        <span>ΔXP</span><span>ΔNv</span><span>ΔPlace</span>
      </div>
    `);
  }

  async function refresh(mode) {
    ensureWidget();

    const toggle = document.getElementById("xpSideToggle");
    const body = document.getElementById("xpSideBody");
    body.innerHTML = `<div class="xpSideLoading">Chargement…</div>`;

    const step = (mode === "mensuel") ? 4 : 1;

    const index = await fetchJson("data/history_paris/index.json");
    if (!Array.isArray(index)) {
      body.innerHTML = `<div class="xpSideEmpty">index.json introuvable.</div>`;
      return;
    }

    const { rows, meta } = await buildPeriodRows(index, step);
    const prevRankMap = await buildPrevRankMap(index, step);

    render(rows, meta, mode, prevRankMap);

    toggle.onclick = () => {
      const newMode = (mode === "mensuel") ? "hebdo" : "mensuel";
      localStorage.setItem(STORAGE_KEY, newMode);
      refresh(newMode);
    };
  }

  window.addEventListener("DOMContentLoaded", () => {
    // N’affiche pas sur gang.html / gang_profil.html si tu veux
    const path = (location.pathname || "").toLowerCase();
    if (path.includes("gang")) return;

    const mode = localStorage.getItem(STORAGE_KEY) || "hebdo";
    refresh(mode);
  });
})();
