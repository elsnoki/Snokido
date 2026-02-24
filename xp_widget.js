// xp_widget.js — Mini classement Hebdo/Mensuel (calendrier Paris)
// Source: data/period/weekly_current.json + data/period/monthly_current.json
// - Pseudos affichés à côté de l’avatar
// - Cache ceux à ΔXP = 0
// - Flèches ▲▼ si rank prev fourni (optionnel futur)
// - Ne dépend PAS de data.js

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

  function renderEmpty(msg) {
    const title = document.getElementById("xpSideTitle");
    const sub = document.getElementById("xpSideSub");
    const body = document.getElementById("xpSideBody");
    title.textContent = title.textContent || "Hebdo";
    sub.textContent = "—";
    body.innerHTML = `<div class="xpSideEmpty">${msg}</div>`;
  }

  // Optionnel si tu veux des flèches plus tard
  function moveBadge(curRank, prevRank) {
    if (!prevRank) return `<span class="xpMove same">—</span>`;
    const diff = prevRank - curRank;
    if (diff > 0) return `<span class="xpMove up">▲${diff}</span>`;
    if (diff < 0) return `<span class="xpMove down">▼${Math.abs(diff)}</span>`;
    return `<span class="xpMove same">•0</span>`;
  }

  function render(data, mode) {
    const title = document.getElementById("xpSideTitle");
    const sub = document.getElementById("xpSideSub");
    const body = document.getElementById("xpSideBody");

    title.textContent = (mode === "mensuel") ? "Mensuel" : "Hebdo";

    const cur = data?.curDay || "—";
    const start = data?.startDay || data?.targetStart || "—";
    sub.textContent = `${start} → ${cur}`;

    if (!data || !Array.isArray(data.rows)) {
      body.innerHTML = `<div class="xpSideEmpty">Données indisponibles.</div>`;
      return;
    }

    // Filtre : pas de 0 exp
    let rows = data.rows.filter(r => Number(r.dx || 0) !== 0);

    if (!rows.length) {
      body.innerHTML = `<div class="xpSideEmpty">Personne n’a gagné d’XP sur la période.</div>`;
      return;
    }

    // Top 10
    rows = rows.slice(0, 10);

    body.innerHTML = rows.map((r, i) => {
      const curRank = i + 1;
      const prevRank = null; // pas fourni dans tes caches pour l’instant

      const name = r.nom || "—";
      const av = r.avatar || "avatar/1.jpg";

      return `
        <div class="xpRow">
          <div class="xpRk">${curRank}</div>
          <div class="xpWho">
            <img class="xpAv" src="${av}" alt="${name}">
            <div class="xpName" title="${name}">${name}</div>
          </div>
          <div class="xpDx">${formatSigned(r.dx)}</div>
          <div class="xpKara">${r.dkara != null ? formatSigned(r.dkara) : "—"}</div>
          <div class="xpMv">${moveBadge(curRank, prevRank)}</div>
        </div>
      `;
    }).join("");

    body.insertAdjacentHTML("beforeend", `
      <div class="xpSideFoot">
        <span>ΔXP</span><span>ΔKara</span><span>ΔPlace</span>
      </div>
    `);
  }

  async function refresh(mode) {
    ensureWidget();

    const toggle = document.getElementById("xpSideToggle");
    const body = document.getElementById("xpSideBody");
    body.innerHTML = `<div class="xpSideLoading">Chargement…</div>`;

    const path = (mode === "mensuel")
      ? "data/period/monthly_current.json"
      : "data/period/weekly_current.json";

    const data = await fetchJson(path);

    if (!data) {
      renderEmpty("Fichier period introuvable. Lance le workflow au moins une fois.");
    } else {
      render(data, mode);
    }

    toggle.onclick = () => {
      const newMode = (mode === "mensuel") ? "hebdo" : "mensuel";
      localStorage.setItem(STORAGE_KEY, newMode);
      refresh(newMode);
    };
  }

  window.addEventListener("DOMContentLoaded", () => {
    // option : ne pas afficher sur les pages gang
    const p = (location.pathname || "").toLowerCase();
    if (p.includes("gang")) return;

    const mode = localStorage.getItem(STORAGE_KEY) || "hebdo";
    refresh(mode);
  });
})();
