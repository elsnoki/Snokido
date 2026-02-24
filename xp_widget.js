// xp_widget.js — Mini classement Hebdo/Mensuel (Paris)
// Lit: data/period/weekly_current.json + data/period/monthly_current.json
// Structure attendue (depuis ton scraper):
// { baselineDate, asOfDate, rows:[{ nom, avatar, dxp, dLvl, rank, dPlace, profileHref }] }

(function () {
  const STORAGE_KEY = "xpWidgetMode"; // "hebdo" | "mensuel"

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return null;
    try { return await res.json(); } catch { return null; }
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString("fr-FR");
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
    const sub = document.getElementById("xpSideSub");
    const body = document.getElementById("xpSideBody");
    sub.textContent = "—";
    body.innerHTML = `<div class="xpSideEmpty">${msg}</div>`;
  }

  function moveBadge(dPlace) {
    // Ton scraper met: dPlace = oldRank - nowRank, donc + = gagne des places
    if (typeof dPlace !== "number") return `<span class="xpMove same">—</span>`;
    if (dPlace > 0) return `<span class="xpMove up">▲${dPlace}</span>`;
    if (dPlace < 0) return `<span class="xpMove down">▼${Math.abs(dPlace)}</span>`;
    return `<span class="xpMove same">=</span>`;
  }

  function render(period, mode) {
    const title = document.getElementById("xpSideTitle");
    const sub = document.getElementById("xpSideSub");
    const body = document.getElementById("xpSideBody");

    title.textContent = (mode === "mensuel") ? "Mensuel" : "Hebdo";

    const start = period?.baselineDate || "—";
    const cur = period?.asOfDate || "—";
    sub.textContent = `${start} → ${cur}`;

    if (!period || !Array.isArray(period.rows)) {
      body.innerHTML = `<div class="xpSideEmpty">Données indisponibles.</div>`;
      return;
    }

    // Ton scraper enlève déjà dxp=0, mais on refiltre au cas où
    let rows = period.rows.filter(r => Number(r.dxp || 0) !== 0);

    if (!rows.length) {
      body.innerHTML = `<div class="xpSideEmpty">Personne n’a gagné d’XP sur la période.</div>`;
      return;
    }

    rows = rows.slice(0, 10);

    body.innerHTML = rows.map((r, i) => {
      const rk = r.rank ?? (i + 1);
      const name = r.nom || "—";
      const av = r.avatar || "avatar/1.jpg";
      const dxp = Number(r.dxp || 0);
      const dLvl = Number(r.dLvl || 0);
      const href = r.profileHref || null;

      const nameHtml = href
        ? `<a href="${href}" target="_blank" rel="noopener">${name}</a>`
        : `<span>${name}</span>`;

      return `
        <div class="xpRow">
          <div class="xpRk">${rk}</div>
          <div class="xpWho">
            <img class="xpAv" src="${av}" alt="${name}">
            <div class="xpName" title="${name}">${nameHtml}</div>
          </div>
          <div class="xpDx">${fmtSigned(dxp)}</div>
          <div class="xpKara">${fmtSigned(dLvl)}</div>
          <div class="xpMv">${moveBadge(r.dPlace)}</div>
        </div>
      `;
    }).join("");

    // Lignes du footer (labels)
    body.insertAdjacentHTML("beforeend", `
      <div class="xpSideFoot">
        <span>ΔXP</span><span>ΔNiv</span><span>ΔPlace</span>
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

    const period = await fetchJson(path);

    if (!period) {
      renderEmpty("Fichier period introuvable. Lance le workflow au moins une fois.");
    } else {
      render(period, mode);
    }

    toggle.onclick = () => {
      const newMode = (mode === "mensuel") ? "hebdo" : "mensuel";
      localStorage.setItem(STORAGE_KEY, newMode);
      refresh(newMode);
    };
  }

  window.addEventListener("DOMContentLoaded", () => {
    const p = (location.pathname || "").toLowerCase();
    if (p.includes("gang")) return;

    const mode = localStorage.getItem(STORAGE_KEY) || "hebdo";
    refresh(mode);
  });
})();
