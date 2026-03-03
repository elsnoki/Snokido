// bars.js — barre de navigation pour la page unique "classements.html"

const CLASSEMENTS_PAGE = "classements.html";

function getMode() {
  const p = new URLSearchParams(location.search);
  return String(p.get("mode") || "jour").toLowerCase();
}

function isActiveMode(current, mode) {
  if (current === mode) return true;
  // alias
  if (mode === "hier" && (current === "jour-veille")) return true;
  if (mode === "ans-veille" && (current === "annee-veille")) return true;
  return false;
}

function el(html) {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

async function fetchJson(path) {
  const url = path + (path.includes("?") ? "&" : "?") + "t=" + Date.now();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

function normalizeDay(s) {
  const str = String(s || "").trim();
  const m = str.match(/^(\d{4}-\d{2}-\d{2})(?:\.json)?$/);
  return m ? m[1] : null;
}

async function getLatestDayFromIndex() {
  const idx = await fetchJson("data/history_paris/index.json");
  if (!Array.isArray(idx)) return null;
  const days = idx.map(normalizeDay).filter(Boolean).sort();
  return days.length ? days[days.length - 1] : null;
}

function monthNameFR(m) {
  const monthsFR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return monthsFR[Math.max(0, Math.min(11, m - 1))];
}

function buildMainBar() {
  const mode = getMode();

  const items = [
    { mode: "jour", label: "🕛 Jour" },
    { mode: "hier", label: "⏪ Hier" },
    { mode: "hebdo", label: "📅 Hebdo" },
    { mode: "mensuel", label: "🗓️ Mensuel" },

    // ✅ mois-veille (ton fichier / logique)
    { mode: "mois-veille", label: "⏮️ Mois-veille", id: "barPrevMonth" },

    { mode: "ans", label: "📆 Année", id: "barYear" },
    { mode: "ans-veille", label: "📆 Année-1", id: "barPrevYear" },
  ];

  return el(`
    <div class="subnav subnav-xp">
      ${items.map(it => `
        <a
          class="subnav-btn ${isActiveMode(mode, it.mode) ? "is-active" : ""}"
          href="${CLASSEMENTS_PAGE}?mode=${encodeURIComponent(it.mode)}"
          ${it.id ? `id="${it.id}"` : ""}
        >${it.label}</a>
      `).join("")}
    </div>
  `);
}

async function setDynamicLabels() {
  const latestDay = await getLatestDayFromIndex();
  let y, m;

  if (latestDay) {
    y = Number(latestDay.slice(0, 4));
    m = Number(latestDay.slice(5, 7));
  } else {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth() + 1;
  }

  // Année
  const by = document.getElementById("barYear");
  if (by) {
    by.textContent = "📆 " + y;
    by.title = "Classement annuel (" + y + ")";
  }

  // Année-1
  const bpy = document.getElementById("barPrevYear");
  if (bpy) {
    bpy.textContent = "📆 " + (y - 1);
    bpy.title = "Classement annuel (" + (y - 1) + ")";
  }

  // Mois-veille = mois précédent du latestDay
  const bm = document.getElementById("barPrevMonth");
  if (bm) {
    let pm = m - 1;
    let py = y;
    if (pm <= 0) { pm = 12; py = y - 1; }
    bm.textContent = "⏮️ " + monthNameFR(pm);
    bm.title = "Classement du mois précédent (" + monthNameFR(pm) + " " + py + ")";
  }
}

function mountBars() {
  document.querySelectorAll('[data-bar="main"]').forEach(m => {
    m.innerHTML = "";
    m.appendChild(buildMainBar());
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  mountBars();
  await setDynamicLabels();
});
