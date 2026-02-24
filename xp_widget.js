// xp_widget.js — Hebdo/Mensuel depuis data/history_paris/
// Fonctionne même avec seulement 2 snapshots (période partielle).
// Hebdo: utilise le snapshot le plus ancien trouvé <= 7 jours
// Mensuel: snapshot le plus ancien trouvé <= 30 jours

(function () {
  const STORAGE_KEY = "xpWidgetMode"; // "hebdo" | "mensuel"

  function slugify(name) {
    return String(name || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
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

    // support 2 formats:
    // (A) ancien: [ {nom,xp,...}, ... ]
    // (B) nouveau: { date, generatedAtParis, players:[...] }
    if (Array.isArray(snap)) return snap;
    if (Array.isArray(snap.players)) return snap.players;

    return null;
  }

  function toUTCDate(dayStr) {
    const [y,m,d] = dayStr.split("-").map(Number);
    return new Date(Date.UTC(y, m-1, d));
  }

  function daysBetween(aStr, bStr) {
    const a = toUTCDate(aStr);
    const b = toUTCDate(bStr);
    const ms = b - a;
    return Math.floor(ms / (24 * 3600 * 1000));
  }

  function format(n) {
    return Number(n || 0).toLocaleString("fr-FR");
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
      <div class="xpSideSub" id="xpSideSub">—</div>
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
    // index est trié chronologiquement (normalement)
    // on veut le snapshot le plus ancien mais pas plus vieux que maxDaysBack
    const latestIdx = index.indexOf(latestDay);
    if (latestIdx <= 0) return null;

    // On parcourt vers l'arrière, tant que c'est <= maxDaysBack
    let chosen = null;
    for (let i = latestIdx - 1; i >= 0; i--) {
      const d = index[i];
      const delta = daysBetween(d, latestDay);
      if (delta <= maxDaysBack) {
        chosen = d; // on continue pour trouver le plus ancien possible dans la fenêtre
      } else {
        break;
      }
    }

    // Si on n'a rien trouvé dans la fenêtre, on prend le précédent tout court (période partielle)
    if (!chosen) chosen = index[latestIdx - 1];

    return chosen;
  }

  function computeDelta(current, past) {
    const pastMap = new Map();
    past.forEach(p => {
      pastMap.set(slugify(p.nom), Number(p.xp || 0));
    });

    const rows = [];
    current.forEach(p => {
      const key = slugify(p.nom);
      const oldXp = pastMap.get(key);
      if (oldXp == null) return; // pas comparable
      const curXp = Number(p.xp || 0);
      const dx = curXp - oldXp;

      rows.push({
        nom: p.nom,
        avatar: p.avatar,
        dx
      });
    });

    // garder même si dx=0 ? (tu veux cumuler: on peut afficher seulement >0)
    const filtered = rows.filter(r => r.dx !== 0);

    filtered.sort((a,b) => b.dx - a.dx);
    return filtered.slice(0, 10);
  }

  async function refresh(mode) {
    ensureWidget();

    const title = document.getElementById("xpSideTitle");
    const sub = document.getElementById("xpSideSub");
    const body = document.getElementById("xpSideBody");

    title.textContent = (mode === "mensuel") ? "Mensuel" : "Hebdo";
    body.innerHTML = `<div class="xpSideLoading">Chargement…</div>`;

    const index = await loadIndex();
    if (!index || index.length < 2) {
      sub.textContent = "—";
      renderEmpty("Pas assez d'historique (il faut au moins 2 jours).");
      return;
    }

    const latestDay = index[index.length - 1];
    const maxDaysBack = (mode === "mensuel") ? 30 : 7;
    const baselineDay = pickBaselineDay(index, latestDay, maxDaysBack);

    sub.textContent = `${baselineDay} → ${latestDay}`;

    const current = await loadSnapshot(latestDay);
    const past = await loadSnapshot(baselineDay);

    if (!current || !past) {
      renderEmpty("Erreur chargement des snapshots.");
      return;
    }

    const rows = computeDelta(current, past);

    if (!rows.length) {
      renderEmpty("Personne n’a gagné d’XP sur la période.");
      return;
    }

    body.innerHTML = rows.map((r, i) => `
      <div class="xpRow">
        <div class="xpRk">${i+1}</div>
        <div class="xpWho">
          <img class="xpAv" src="${r.avatar || "avatar/1.jpg"}" alt="${r.nom}">
          <div class="xpName" title="${r.nom}">${r.nom}</div>
        </div>
        <div class="xpDx">+${format(r.dx)}</div>
      </div>
    `).join("");

    document.getElementById("xpSideToggle").onclick = () => {
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
