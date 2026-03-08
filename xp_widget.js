// xp_widget.js — Widget Jour / Hebdo / Mensuel
// Réécrit pour coller à classement.html
// - mêmes périodes
// - mêmes règles de tri
// - pas de négatifs
// - tie-break uniquement à dx égal
// - affiche : rang widget / pseudo / ΔXP / place classement général

(function () {
  const STORAGE_KEY = "xpWidgetMode";
  const MODES = ["jour", "hebdo", "mensuel"];
  const HISTORY_BASE = "data/history_paris";

  const LIVE_CANDIDATES = [
    "period/players_pages.json",
    "./period/players_pages.json",
    "../period/players_pages.json",
    "data/players_pages.json",
    "./data/players_pages.json",
    "../data/players_pages.json",
    "data/period/players_pages.json",
    "./data/period/players_pages.json",
    "../data/period/players_pages.json",
    "data/snokido_top50.json",
    "./data/snokido_top50.json",
    "../data/snokido_top50.json"
  ];

  function safeMode(m) {
    return MODES.includes(m) ? m : "jour";
  }

  function slugify(name) {
    return String(name || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function getName(p) {
    return p?.nom ?? p?.name ?? p?.username ?? p?.pseudo ?? "—";
  }

  function getAvatar(p) {
    return p?.avatar ?? null;
  }

  function getXp(p) {
    return Number(p?.xp ?? p?.exp ?? 0);
  }

  function getProfileHref(p) {
    return p?.profileHref ?? p?.href ?? null;
  }

  function getGlobalRank(p) {
    const v = Number(p?.rang ?? p?.rank ?? p?.place ?? p?.position ?? p?.classement ?? 0);
    return Number.isFinite(v) && v > 0 ? v : null;
  }

  function nameLower(p) {
    return String(getName(p)).toLowerCase().trim();
  }

  function profileIdFromHref(href) {
    if (!href) return null;
    try {
      const u = new URL(href, location.origin);
      const m = u.pathname.match(/\/player\/([^\/?#]+)/i);
      return m ? m[1].toLowerCase() : null;
    } catch {
      const m = String(href).match(/\/player\/([^\/?#]+)/i);
      return m ? m[1].toLowerCase() : null;
    }
  }

  function playerKeysMulti(p) {
    const keys = [];
    if (!p) return keys;

    const id = profileIdFromHref(getProfileHref(p));
    if (id) keys.push("id:" + id);

    const s = String(p?.slug || "").toLowerCase().trim();
    if (s) {
      keys.push("slug:" + s);
      keys.push("id:" + s);
    }

    const n1 = nameLower(p);
    if (n1) keys.push("n1:" + n1);

    const n2 = slugify(getName(p));
    if (n2) keys.push("n2:" + n2);

    return Array.from(new Set(keys));
  }

  function fmtSigned(n) {
    const v = Number(n || 0);
    return (v >= 0 ? "+" : "") + v.toLocaleString("fr-FR");
  }

  function extractPlayers(payload) {
    if (!payload) return null;
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      if (Array.isArray(payload.joueurs)) return payload.joueurs;
      if (Array.isArray(payload.players)) return payload.players;
      if (Array.isArray(payload.top50)) return payload.top50;
      if (Array.isArray(payload.data)) return payload.data;
    }
    return null;
  }

  async function fetchJson(path) {
    const url = path + (path.includes("?") ? "&" : "?") + "t=" + Date.now();

    let res;
    try {
      res = await fetch(url, { cache: "no-store" });
    } catch {
      return null;
    }
    if (!res.ok) return null;

    let txt;
    try {
      txt = await res.text();
    } catch {
      return null;
    }

    txt = String(txt || "").replace(/^\uFEFF/, "").trim();
    if (!txt) return null;

    try {
      return JSON.parse(txt);
    } catch {}

    try {
      let clean = txt;
      clean = clean.replace(/\/\/[^\n\r]*/g, "");
      clean = clean.replace(/\/\*[\s\S]*?\*\//g, "");
      clean = clean.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(clean);
    } catch {
      return null;
    }
  }

  async function loadCurrentPlayers() {
    for (const p of LIVE_CANDIDATES) {
      const raw = await fetchJson(p);
      const arr = extractPlayers(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
    return null;
  }

  function normalizeDay(s) {
    const str = String(s || "").trim();
    const m = str.match(/^(\d{4}-\d{2}-\d{2})(?:\.json)?$/);
    return m ? m[1] : null;
  }

  async function loadIndex() {
    const idx = await fetchJson(HISTORY_BASE + "/index.json");
    if (!Array.isArray(idx)) return null;
    return idx.map(normalizeDay).filter(Boolean).sort();
  }

  async function loadSnap(day) {
    const raw = await fetchJson(`${HISTORY_BASE}/${day}.json`);
    return extractPlayers(raw);
  }

  function toUTCDate(dayStr) {
    const [y, m, d] = dayStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  function fromUTCDate(dt) {
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  }

  function mondayOfWeek(dayStr) {
    const d = toUTCDate(dayStr);
    const wd = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - (wd - 1));
    return fromUTCDate(d);
  }

  function firstOfMonth(dayStr) {
    return `${dayStr.slice(0, 4)}-${dayStr.slice(5, 7)}-01`;
  }

  function findClosestLE(index, targetDay) {
    for (let i = index.length - 1; i >= 0; i--) {
      if (index[i] <= targetDay) return index[i];
    }
    return null;
  }

  function buildMapFromSnap(players) {
    const map = new Map();
    for (const p of (players || [])) {
      const meta = {
        xp: getXp(p),
        nom: getName(p),
        avatar: getAvatar(p),
        profileHref: getProfileHref(p)
      };
      for (const k of playerKeysMulti(p)) {
        if (!map.has(k)) map.set(k, meta);
      }
    }
    return map;
  }

  function findBaseByKeys(baseMap, p) {
    const keys = playerKeysMulti(p);
    for (const k of keys) {
      if (baseMap.has(k)) return baseMap.get(k);
    }
    return null;
  }

  function applyDxTieBreakPlus12Over500(rows) {
    const byDx = new Map();

    for (const r of rows) {
      const k = String(r.dx);
      if (!byDx.has(k)) byDx.set(k, []);
      byDx.get(k).push(r);
    }

    for (const [, group] of byDx) {
      if (group.length <= 1) {
        group[0].dxAdj = group[0].dx;
        continue;
      }

      const dxVal = Number(group[0].dx || 0);
      if (dxVal < 500) {
        group.forEach(r => r.dxAdj = r.dx);
        continue;
      }

      const sorted = group.slice().sort((a, b) => slugify(a.nom).localeCompare(slugify(b.nom)));
      const n = sorted.length;
      for (let i = 0; i < n; i++) {
        const bonus = 12 * (n - 1 - i);
        sorted[i].dxAdj = sorted[i].dx + bonus;
      }
    }

    for (const r of rows) {
      if (typeof r.dxAdj !== "number") r.dxAdj = r.dx;
    }
  }

  function sortRowsForRanking(rows) {
    rows.sort((a, b) =>
      (Number(b.dx || 0) - Number(a.dx || 0)) ||
      (Number(b.dxAdj ?? b.dx ?? 0) - Number(a.dxAdj ?? a.dx ?? 0)) ||
      (Number(b.xpEnd || 0) - Number(a.xpEnd || 0)) ||
      slugify(a.nom).localeCompare(slugify(b.nom))
    );
    return rows;
  }

  function linkForPlayer(nom, profileHref) {
    return profileHref ? profileHref : ("profil.html?mode=nv100&u=" + encodeURIComponent(slugify(nom)));
  }

  function ensureWidget() {
    if (document.getElementById("xpSide")) return;

    const box = document.createElement("aside");
    box.id = "xpSide";
    box.className = "xpSide";
    box.innerHTML = `
      <div class="xpSideHead">
        <div class="xpSideTitle" id="xpSideTitle">Jour</div>
        <div style="display:flex;gap:6px;">
          <button class="xpSideToggle" id="xpSidePrev" title="Précédent">◂</button>
          <button class="xpSideToggle" id="xpSideNext" title="Suivant">▸</button>
        </div>
      </div>
      <div class="xpSideSub" id="xpSideSub">Chargement…</div>
      <div class="xpSideBody" id="xpSideBody">
        <div class="xpSideLoading">Chargement…</div>
      </div>
    `;
    document.body.appendChild(box);
  }

  function setTitle(mode) {
    const title = document.getElementById("xpSideTitle");
    title.textContent = mode === "mensuel" ? "Mensuel" : (mode === "hebdo" ? "Hebdo" : "Jour");
  }

  function renderEmpty(msg) {
    document.getElementById("xpSideBody").innerHTML = `<div class="xpSideEmpty">${msg}</div>`;
  }

  function computeGlobalRanks(players) {
    const sorted = (players || []).slice().sort((a, b) => {
      const dx = getXp(b) - getXp(a);
      if (dx !== 0) return dx;
      return slugify(getName(a)).localeCompare(slugify(getName(b)));
    });

    const rankMap = new Map();
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const explicitRank = getGlobalRank(p);
      const rank = explicitRank || (i + 1);
      for (const k of playerKeysMulti(p)) {
        if (!rankMap.has(k)) rankMap.set(k, rank);
      }
    }
    return rankMap;
  }

  function computeRowsLikeClassement(currentPlayers, baselinePlayers) {
    const baseMap = buildMapFromSnap(baselinePlayers);
    const globalRankMap = computeGlobalRanks(currentPlayers);
    const rows = [];

    for (const p of (currentPlayers || [])) {
      const base = findBaseByKeys(baseMap, p);
      if (!base) continue;

      const xpEnd = getXp(p);
      const dx = xpEnd - Number(base.xp || 0);

      // on masque les négatifs et les 0
      if (dx <= 0) continue;

      let globalRank = null;
      for (const k of playerKeysMulti(p)) {
        if (globalRankMap.has(k)) {
          globalRank = globalRankMap.get(k);
          break;
        }
      }

      rows.push({
        nom: getName(p),
        avatar: getAvatar(p),
        profileHref: getProfileHref(p),
        dx,
        dxAdj: null,
        xpEnd,
        globalRank
      });
    }

    applyDxTieBreakPlus12Over500(rows);
    sortRowsForRanking(rows);

    return rows.slice(0, 10);
  }

  async function refresh(mode) {
    mode = safeMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);

    ensureWidget();
    setTitle(mode);

    const sub = document.getElementById("xpSideSub");
    const body = document.getElementById("xpSideBody");
    body.innerHTML = `<div class="xpSideLoading">Chargement…</div>`;

    const current = await loadCurrentPlayers();
    if (!current) {
      sub.textContent = "—";
      renderEmpty("Impossible de charger les joueurs live.");
      return;
    }

    const index = await loadIndex();
    if (!index || index.length < 2) {
      sub.textContent = "—";
      renderEmpty("Pas assez d'historique (history_paris).");
      return;
    }

    const latestDay = index[index.length - 1];

    let baseTarget;
    if (mode === "jour") {
      baseTarget = latestDay;
    } else if (mode === "hebdo") {
      baseTarget = mondayOfWeek(latestDay);
    } else {
      baseTarget = firstOfMonth(latestDay);
    }

    const baseDay = findClosestLE(index, baseTarget);
    if (!baseDay) {
      sub.textContent = "—";
      renderEmpty("Baseline introuvable.");
      return;
    }

    const baseline = await loadSnap(baseDay);
    if (!baseline) {
      sub.textContent = "—";
      renderEmpty("Snapshot baseline introuvable.");
      return;
    }

    sub.textContent = `${baseDay} → live`;

    const rows = computeRowsLikeClassement(current, baseline);
    if (!rows.length) {
      renderEmpty("Personne n’a gagné d’XP sur la période.");
      return;
    }

    body.innerHTML = rows.map((r, i) => {
      const href = linkForPlayer(r.nom, r.profileHref);
      return `
        <div class="xpRow">
          <div class="xpRk">${i + 1}</div>
          <div class="xpWho">
            <a class="xpWhoLink" href="${href}" target="_blank" rel="noopener">
              <img class="xpAv" src="${r.avatar || "avatar/1.jpg"}" alt="${r.nom}">
            </a>
            <a class="xpName" href="${href}" target="_blank" rel="noopener" title="${r.nom}">${r.nom}</a>
          </div>
          <div class="xpDx">${fmtSigned(r.dx)}</div>
          <div class="xpPlace">${r.globalRank == null ? "—" : "#" + Number(r.globalRank).toLocaleString("fr-FR")}</div>
        </div>
      `;
    }).join("");

    body.insertAdjacentHTML("beforeend", `
      <div class="xpSideFoot">
        <span>ΔXP</span><span>Place</span>
      </div>
    `);
  }

  function wireButtons() {
    const prev = document.getElementById("xpSidePrev");
    const next = document.getElementById("xpSideNext");

    prev.onclick = () => {
      const cur = safeMode(localStorage.getItem(STORAGE_KEY));
      const i = MODES.indexOf(cur);
      refresh(MODES[(i - 1 + MODES.length) % MODES.length]);
    };

    next.onclick = () => {
      const cur = safeMode(localStorage.getItem(STORAGE_KEY));
      const i = MODES.indexOf(cur);
      refresh(MODES[(i + 1) % MODES.length]);
    };
  }

  window.addEventListener("DOMContentLoaded", () => {
    const p = String(location.pathname || "").toLowerCase();
    if (p.includes("gang")) return;

    ensureWidget();
    wireButtons();

    const mode = safeMode(localStorage.getItem(STORAGE_KEY));
    refresh(mode);
  });
})();
