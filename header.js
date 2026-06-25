// ================= HEADER =================

const headerHTML = `
<header class="topbar">
  <div class="topbar-inner">

    <a class="logo" href="rank.html">
      <img src="snokiki.png" alt="SNOKIKI">
    </a>

    <nav class="nav">

      <!-- ===== CATÉGORIE : CLASSEMENTS ===== -->
      <div class="menuWrap">
        <a class="tab menuBtn tab-menu-classements" href="#" data-menu="classements">
          Classements <span class="caret">▾</span>
        </a>

        <div class="dropMenu" data-menu-content="classements">
          <a class="tab tab-nv100" href="rank.html">NV100</a>
          <a class="tab tab-nv0" href="rank0pause.html">NV100 sans pause</a>
          <a class="tab tab-100" href="100k.html">100K</a>
          <a class="tab tab-200" href="200k.html">200K</a>
          <a class="tab tab-300" href="300k.html">300K</a>
          <a class="tab tab-400" href="400k.html">400K</a>
          <a class="tab tab-500" href="500k.html">500K et +</a>
          <a class="tab tab-niveau" href="classement.html?mode=niveau">Niveau théorique</a>
          <a class="tab tab-kara" href="kara.html">Kara</a>
        </div>
      </div>

      <!-- ===== CATÉGORIE : ANALYSES ===== -->
      <div class="menuWrap">
        <a class="tab menuBtn tab-menu-analyses" href="#" data-menu="analyses">
          Analyses <span class="caret">▾</span>
        </a>

        <div class="dropMenu" data-menu-content="analyses">
          <a class="tab tab-gang" href="gang.html">Gang</a>
          <a class="tab tab-graph" href="graphe.html">Graphe</a>
          <a class="tab tab-frise" href="frise.html">Frise</a>
          <a class="tab tab-video" href="video.html">Vidéo</a>
          <a class="tab tab-year" href="rankyear.html">Année</a>
          <a class="tab tab-chrono" href="timeline.html">Timeline</a>
          <a class="tab tab-gen" href="gen.html">Générations</a>
        </div>
      </div>

      <!-- ===== CATÉGORIE : RECORDS ===== -->
      <div class="menuWrap">
        <a class="tab menuBtn tab-menu-records" href="#" data-menu="records">
          Records <span class="caret">▾</span>
        </a>

        <div class="dropMenu" data-menu-content="records">
          <div class="pauseWrap">
            <a class="tab tab-pause subMenuBtn" href="#" id="pauseBtn">
              Pauses <span class="caret">▸</span>
            </a>

            <div class="pauseMenu">
              <a id="pauseLinkUnique" href="pause.html">Records — pauses uniques</a>
              <a id="pauseLinkTotal" href="pauses.html">Records — total par joueur</a>
            </div>
          </div>

          <a class="tab tab-trophee" href="trophee.html">Trophées</a>
          <a class="tab tab-record" href="exp1an.html">Record 1 an</a>
          <a class="tab tab-1ers" href="1ers.html">1ers</a>
          <a class="tab tab-role" href="role.html">Rôles</a>
          <a class="tab tab-humble" href="humble.html">Hommes Humbles</a>
        </div>
      </div>

      <!-- ===== CATÉGORIE : PANTHÉONS ===== -->
      <div class="menuWrap">
        <a class="tab menuBtn tab-menu-pantheon" href="#" data-menu="pantheons">
          Panthéons <span class="caret">▾</span>
        </a>

        <div class="dropMenu" data-menu-content="pantheons">
          <a class="tab tab-pantheon" href="pantheon.html">Panthéon des Légendes</a>
          <a class="tab tab-pantheon2" href="pantheon2.html">Panthéon de la honte</a>
          <a class="tab tab-noob" href="pantheon3.html">Panthéon des Noobs</a>
        </div>
      </div>

      <!-- ===== LIEN SIMPLE (corrigé) ===== -->
      <a class="tab tab-menu-createur" href="createur_snoki.html">
        Créateur de Snoki
      </a>

    </nav>
  </div>
</header>
`;

document.body.insertAdjacentHTML("afterbegin", headerHTML);

// ================= MENUS PRINCIPAUX =================

const menuWraps = document.querySelectorAll(".menuWrap");
const menuButtons = document.querySelectorAll(".menuBtn");

function closeAllMenus() {
  menuWraps.forEach((wrap) => {
    wrap.classList.remove("is-open");
    const btn = wrap.querySelector(".menuBtn");
    if (btn) btn.setAttribute("aria-expanded", "false");
  });

  closePauseMenu();
}

function toggleMainMenu(button) {
  const wrap = button.closest(".menuWrap");
  if (!wrap) return;

  const isOpen = wrap.classList.contains("is-open");

  closeAllMenus();

  if (!isOpen) {
    wrap.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  }
}

menuButtons.forEach((button) => {
  button.setAttribute("aria-expanded", "false");

  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMainMenu(button);
  });
});

// ================= SOUS-MENU PAUSES =================

const pauseWrap = document.querySelector(".pauseWrap");
const pauseBtn = document.getElementById("pauseBtn");

function togglePauseMenu() {
  if (!pauseWrap) return;
  pauseWrap.classList.toggle("is-open");
}

if (pauseBtn) {
  pauseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePauseMenu();
  });
}

// ================= FERMETURE =================

document.addEventListener("click", (e) => {
  if (!e.target.closest(".menuWrap")) {
    menuWraps.forEach(w => w.classList.remove("is-open"));
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    menuWraps.forEach(w => w.classList.remove("is-open"));
  }
});

// ================= ACTIVE STATE =================

(function setActiveState() {
  const path = (window.location.pathname || "").toLowerCase();
  const file = path.split("/").pop();

  const activateMainMenu = (selector) => {
    const el = document.querySelector(selector);
    if (el) el.classList.add("active");
  };

  const activateLink = (selector) => {
    const el = document.querySelector(selector);
    if (el) el.classList.add("active");
  };

  if (
    ["rank.html","rank0pause.html","100k.html","200k.html","300k.html","400k.html","500k.html","kara.html","classement.html"].includes(file)
  ) activateMainMenu(".tab-menu-classements");

  if (
    ["gang.html","graphe.html","frise.html","video.html","rankyear.html","timeline.html","gen.html"].includes(file)
  ) activateMainMenu(".tab-menu-analyses");

  if (
    ["pause.html","pauses.html","pauses_total.html","trophee.html","exp1an.html","role.html","humble.html"].includes(file)
  ) activateMainMenu(".tab-menu-records");

  if (
    ["pantheon.html","pantheon2.html","pantheon3.html"].includes(file)
  ) activateMainMenu(".tab-menu-pantheon");

  if (file === "createur_snoki.html") {
    activateLink(".tab-menu-createur");
  }
})();
