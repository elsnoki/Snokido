// xp_widget.js — Widget Hebdo/Mensuel depuis data/history_paris/
// Compatible avec ton style.css (grille 5 colonnes)
// Affiche: Rang, Avatar+Pseudo, ΔXP, (ΔKara placeholder), (ΔPlace placeholder)

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

    // Supporte 2 formats:
    // A) ancien: [ {nom,xp,avatar,...}, ... ]
    // B) nouveau: { date, generatedAtParis, players:[...] }
    if (Array.isArray(snap)) return snap;
    if (Array.isArray(snap.players)) return snap.players;
    return null;
  }

  function toUTCDate(dayStr) {
    const [y, m, d] = dayStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  function daysBetween(aStr, bStr) {
    const a = toUTCDate(aStr);
    const b = toUTCDate(bStr);
    return Math.floor((b - a) / (24 * 3600 * 1000));
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
    const body = document.getElementById("xpSideBody");
    body.innerHTML = `<div class="xpSideEmpty">${msg}</div>`;
  }

  function pickBaselineDay(index, latestDay, maxDaysBack) {
    const latestIdx = index.indexOf(latestDay);
    if (latestIdx <= 0) return null;

    // On prend le plus ancien snapshot disponible dans la fenêtre (<= maxDaysBack).
    let chosen = null;
    for (let i = latestIdx - 1; i >= 0; i--) {
      const d = index[i];
      const delta = daysBetween(d, latestDay);
      if (delta <= maxDaysBack) chosen = d;
      else break;
    }

    // si aucun dans la fenêtre, on prend juste le précédent (période partielle)
    if (!chosen) chosen = index[latestIdx - 1];
    return chosen;
  }

  function computeDeltaRows(current, past) {
    const pastMap = new Map();
    past.forEach(p => {
      pastMap.set(slugify(p.nom), {
        xp: Number(p.xp || 0),
        karas: Number(p.karas || 0) // si jamais présent, sinon 0
      });
    });

    const rows = [];
    current.forEach(p => {
      const key = slugify(p.nom);
      const old = pastMap.get(key);
      if (!old) return;

      const curXp = Number(p.xp || 0);
      const dxp = curXp - old.xp;

      // optional kara delta (si tes snapshots ont karas)
      const curKaras = Number(p.karas || 0);
      const dkara = curKaras - old.karas;

      rows.push({
        nom: p.nom || "—",
        avatar: p.avatar || null,
        dxp,
        dkara
      });
    });

    // cache ceux à 0 XP (tu peux enlever si tu veux)
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

    body.innerHTML = rows.map((r, i) => `
      <div class="xpRow">
        <div class="xpRk">${i + 1}</div>
        <div class="xpWho">
          <img class="xpAv" src="${r.avatar || "avatar/1.jpg"}" alt="${r.nom}">
          <div class="xpName" title="${r.nom}">${r.nom}</div>
        </div>
        <div class="xpDx">${fmtSigned(r.dxp)}</div>
        <div class="xpKara">${Number.isFinite(r.dkara) ? fmtSigned(r.dkara) : "—"}</div>
        <div class="xpMv"><span class="xpMove same">—</span></div>
      </div>
    `).join("");

    body.insertAdjacentHTML("beforeend", `
      <div class="xpSideFoot">
        <span>ΔXP</span><span>ΔKara</span><span>ΔPlace</span>
      </div>
    `);

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
