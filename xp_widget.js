// xp_widget.js — Hebdo/Mensuel depuis data/history_paris/
// Compatible avec ton CSS (xpRow en 5 colonnes)
// Détecte automatiquement le bon champ "nom" dans les snapshots

(function () {
  const STORAGE_KEY = "xpWidgetMode"; // "hebdo" | "mensuel"

  function slugify(name) {
    return String(name || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function getName(p) {
    // Supporte plusieurs formats possibles
    return (
      p?.nom ??
      p?.name ??
      p?.pseudo ??
      p?.username ??
      p?.player ??
      "—"
    );
  }

  function getAvatar(p) {
    return p?.avatar ?? p?.img ?? p?.image ?? null;
  }

  function getXp(p) {
    // Supporte xp / exp
    const v = (p?.xp != null) ? p.xp : p?.exp;
    return Number(v || 0);
  }

  function getKaras(p) {
    // Supporte karas / kara
    const v = (p?.karas != null) ? p.karas : p?.kara;
    return (v == null) ? null : Number(v || 0);
  }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    try { return await res.json(); } catch { return null; }
  }

  async function loadIndex() {
    const idx = await fetchJson("data/history_paris/index.json");
    return Array.isArray(idx) ? idx : null;
  }

  async function loadSnapshot(day) {
    const snap = await fetchJson(`data/history_paris/${day}.json`);
    if (!snap) return null;
    if (Array.isArray(snap)) return snap;
    if (Array.isArray(snap.players)) return snap.players;
    return null;
  }

  function toUTCDate(dayStr) {
    const [y, m, d] = dayStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  function daysBetween(aStr, bStr) {
    return Math.floor((toUTCDate(bStr) - toUTCDate(aStr)) / (24 * 3600 * 1000));
  }

  function fmtSigned(n) {
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

  function renderEmpty(msg) {
    document.getElementById("xpSideBody").innerHTML =
      `<div class="xpSideEmpty">${msg}</div>`;
  }

  function pickBaselineDay(index, latestDay, maxDaysBack) {
    const latestIdx = index.indexOf(latestDay);
    if (latestIdx <= 0) return null;

    let chosen = null;
    for (let i = latestIdx - 1; i >= 0; i--) {
      const d = index[i];
      const delta = daysBetween(d, latestDay);
      if (delta <= maxDaysBack) chosen = d;
      else break;
    }
    if (!chosen) chosen = index[latestIdx - 1];
    return chosen;
  }

  function computeDeltaRows(current, past) {
    const pastMap = new Map();
    past.forEach(p => {
      const name = getName(p);
      pastMap.set(slugify(name), {
        xp: getXp(p),
        karas: getKaras(p)
      });
    });

    const rows = [];
    current.forEach(p => {
      const name = getName(p);
      const key = slugify(name);
      const old = pastMap.get(key);
      if (!old) return;

      const dxp = getXp(p) - old.xp;

      // kara optionnel
      const curK = getKaras(p);
      const dkara =
        (curK == null || old.karas == null) ? null : (curK - old.karas);

      rows.push({
        nom: name,
        avatar: getAvatar(p),
        dxp,
        dkara
      });
    });

    // Cache ceux à 0 XP
    const filtered = rows.filter(r => r.dxp !== 0);

    filtered.sort((a, b) => b.dxp - a.dxp);
    return filtered.slice(0, 10);
  }

  async function refresh(mode) {
    ensureWidget();

    const title = document.getElementById("xpSideTitle");
    const sub = document.getElementById("xpSideSub");
    const body = document.getElementById("xpSideBody");
    const toggle = document.getElementById("xpSideToggle");

    const maxDaysBack = (mode === "mensuel") ? 30 : 7;
    title.textContent = (mode === "mensuel") ? "Mensuel" : "Hebdo";
    body.innerHTML = `<div class="xpSideLoading">Chargement…</div>`;

    const index = await loadIndex();
    if (!index || index.length < 2) {
      sub.textContent = "—";
      renderEmpty("Pas assez d'historique (il faut au moins 2 jours).");
      return;
    }

    const latestDay = index[index.length - 1];
    const baselineDay = pickBaselineDay(index, latestDay, maxDaysBack);
    sub.textContent = `${baselineDay} → ${latestDay}`;

    const current = await loadSnapshot(latestDay);
    const past = await loadSnapshot(baselineDay);

    if (!current || !past) {
      renderEmpty("Erreur chargement des snapshots.");
      return;
    }

    const rows = computeDeltaRows(current, past);

    if (!rows.length) {
      renderEmpty("Personne n’a gagné d’XP sur la période.");
      return;
    }

    // détecte si on a au moins un dkara réel
    const hasKara = rows.some(r => typeof r.dkara === "number");

    body.innerHTML = rows.map((r, i) => `
      <div class="xpRow">
        <div class="xpRk">${i + 1}</div>
        <div class="xpWho">
          <img class="xpAv" src="${r.avatar || "avatar/1.jpg"}" alt="${r.nom}">
          <div class="xpName" title="${r.nom}">${r.nom}</div>
        </div>
        <div class="xpDx">${fmtSigned(r.dxp)}</div>
        <div class="xpKara">${hasKara ? (r.dkara == null ? "—" : fmtSigned(r.dkara)) : "—"}</div>
        <div class="xpMv"><span class="xpMove same">—</span></div>
      </div>
    `).join("");

    body.insertAdjacentHTML("beforeend", `
      <div class="xpSideFoot">
        <span>ΔXP</span><span>ΔKara</span><span>ΔPlace</span>
      </div>
    `);

    // Si tu veux vraiment cacher la colonne Kara quand absente,
    // dis-le et je te donne une version qui change la grille via JS.

    toggle.onclick = () => {
      const newMode = (mode === "mensuel") ? "hebdo" : "mensuel";
      localStorage.setItem(STORAGE_KEY, newMode);
      refresh(newMode);
    };
  }

  window.addEventListener("DOMContentLoaded", () => {
    const mode = localStorage.getItem(STORAGE_KEY) || "hebdo";
    refresh(mode);
  });
})();
