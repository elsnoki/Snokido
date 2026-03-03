// ================= BARS (subnav) =================

(function () {
  const file = (location.pathname.split("/").pop() || "").toLowerCase();

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function setActiveLinks(root) {
    const links = root.querySelectorAll("a");
    links.forEach(a => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      const hrefFile = href.split("?")[0].split("#")[0].split("/").pop();
      if (hrefFile && hrefFile === file) a.classList.add("is-active");
    });
  }

  // ---------- XP BAR (Jour/Hier/Hebdo/Mensuel/Mois-veille/Année) ----------
  function buildXpBar() {
    const bar = el(`
      <div class="subnav subnav-xp">
        <a class="subnav-btn" href="jour.html">🕛 Jour</a>
        <a class="subnav-btn" href="jour-veille.html">⏪ Hier</a>
        <a class="subnav-btn" href="hebdo.html">📅 Hebdo</a>
        <a class="subnav-btn" href="mensuel.html">🗓️ Mensuel</a>
        <a class="subnav-btn" href="mois-veille.html">⏮️ Mois-veille</a>
        <a class="subnav-btn" href="ans.html">📆 Année</a>
      </div>
    `);
    setActiveLinks(bar);
    return bar;
  }

  // ---------- NIVEAU BAR (séparée + plus haut) ----------
  function buildNiveauBar() {
    const bar = el(`
      <div class="subnav subnav-niveau">
        <a class="subnav-btn" href="niveau.html">⭐ Niveau théorique</a>
        <span class="subnav-sep">|</span>
        <a class="subnav-btn" href="jour.html">🕛 Jour</a>
        <a class="subnav-btn" href="mensuel.html">🗓️ Mensuel</a>
        <a class="subnav-btn" href="ans.html">📆 Année</a>
      </div>
    `);
    setActiveLinks(bar);
    return bar;
  }

  // ---------- CSS injecté (pour placement + “Niveau” pas collé) ----------
  function injectCss() {
    const style = el(`
      <style>
        /* barre XP standard */
        .subnav.subnav-xp{
          display:flex; gap:8px; flex-wrap:wrap;
          padding:10px 16px;
          border-bottom:1px solid #e6e6e6;
          background:#f6f6f6;
        }
        .subnav-btn{
          display:inline-flex; align-items:center; gap:8px;
          padding:8px 10px;
          border-radius:10px;
          font-weight:900;
          text-decoration:none;
          border:1px solid #d6d6d6;
          background:#fff;
          color:#333;
        }
        .subnav-btn:hover{ filter:brightness(.98); }
        .subnav-btn.is-active{
          border-color:#2c6fb7;
          color:#2c6fb7;
          box-shadow: inset 0 0 0 1px rgba(44,111,183,.25);
        }

        /* barre Niveau (plus haut + séparée visuellement) */
        .subnav.subnav-niveau{
          display:flex; gap:8px; flex-wrap:wrap;
          padding:10px 18px;
          margin:14px auto 0;
          max-width:1180px;
          border:1px solid rgba(0,0,0,.10);
          border-radius:12px;
          background: rgba(255,255,255,.92);
          box-shadow: 0 10px 24px rgba(0,0,0,.18);
        }
        .subnav-sep{
          display:inline-flex;
          align-items:center;
          font-weight:900;
          opacity:.45;
          padding:0 4px;
        }
      </style>
    `);
    document.head.appendChild(style);
  }

  // ---------- Mount ----------
  function mount() {
    injectCss();

    // 1) Bar Niveau : seulement sur niveau.html
    if (file === "niveau.html") {
      const mountNode = document.getElementById("subnav-niveau");
      if (mountNode) mountNode.replaceWith(buildNiveauBar());
      else document.body.insertAdjacentElement("afterbegin", buildNiveauBar());
    }

    // 2) Bar XP : sur pages XP (jour/jour-veille/hebdo/mensuel/mois-veille/ans)
    const xpPages = new Set(["jour.html","jour-veille.html","hebdo.html","mensuel.html","mois-veille.html","ans.html"]);
    if (xpPages.has(file)) {
      const mountNode = document.getElementById("subnav-xp");
      if (mountNode) mountNode.replaceWith(buildXpBar());
    }
  }

  document.addEventListener("DOMContentLoaded", mount);
})();
