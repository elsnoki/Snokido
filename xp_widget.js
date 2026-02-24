// xp_widget.js
// Calcule XP hebdo (7 jours) et mensuel (30 jours)
// à partir de data/history_paris/*.json

(function () {

  const STORAGE_KEY = "xpWidgetMode"; // hebdo | mensuel

  function slugify(name) {
    return String(name || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  }

  async function loadIndex() {
    return await fetchJson("data/history_paris/index.json");
  }

  async function loadSnapshot(day) {
    const snap = await fetchJson(`data/history_paris/${day}.json`);
    return snap?.players || [];
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
        <button id="xpToggle">▸</button>
      </div>
      <div class="xpSideBody" id="xpSideBody">Chargement…</div>
    `;
    document.body.appendChild(box);
  }

  function computeDelta(current, past) {
    const pastMap = new Map(past.map(p => [slugify(p.nom), p]));

    const rows = current.map(p => {
      const old = pastMap.get(slugify(p.nom));
      const dx = (p.xp || 0) - (old?.xp || 0);
      return {
        nom: p.nom,
        avatar: p.avatar,
        dx
      };
    });

    rows.sort((a,b) => b.dx - a.dx);
    return rows.slice(0, 10);
  }

  async function refresh(mode) {
    ensureWidget();

    const body = document.getElementById("xpSideBody");
    const title = document.getElementById("xpSideTitle");

    title.textContent = mode === "mensuel" ? "Mensuel" : "Hebdo";
    body.innerHTML = "Chargement…";

    const index = await loadIndex();
    if (!index || index.length < 2) {
      body.innerHTML = "Pas assez d'historique.";
      return;
    }

    const latestDay = index[index.length - 1];

    const daysBack = mode === "mensuel" ? 30 : 7;
    const targetIndex = Math.max(0, index.length - 1 - daysBack);
    const pastDay = index[targetIndex];

    const current = await loadSnapshot(latestDay);
    const past = await loadSnapshot(pastDay);

    if (!current || !past) {
      body.innerHTML = "Erreur chargement.";
      return;
    }

    const rows = computeDelta(current, past);

    if (!rows.length) {
      body.innerHTML = "Personne n’a gagné d’XP.";
      return;
    }

    body.innerHTML = rows.map((r, i) => `
      <div class="xpRow">
        <div>${i+1}</div>
        <img src="${r.avatar || "avatar/1.jpg"}" width="32">
        <div>${r.nom}</div>
        <div>+${format(r.dx)}</div>
      </div>
    `).join("");

    document.getElementById("xpToggle").onclick = () => {
      const newMode = mode === "mensuel" ? "hebdo" : "mensuel";
      localStorage.setItem(STORAGE_KEY, newMode);
      refresh(newMode);
    };
  }

  window.addEventListener("DOMContentLoaded", () => {
    const mode = localStorage.getItem(STORAGE_KEY) || "hebdo";
    refresh(mode);
  });

})();
