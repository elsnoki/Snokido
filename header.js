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

function openPauseMenu() {
  if (!pauseWrap) return;
  pauseWrap.classList.add("is-open");
}

function closePauseMenu() {
  if (!pauseWrap) return;
  pauseWrap.classList.remove("is-open");
}

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

// ================= FERMETURE CLIC EXTÉRIEUR / ESC =================

document.addEventListener("click", (e) => {
  if (!e.target.closest(".menuWrap")) {
    closeAllMenus();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAllMenus();
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

  // Classements
  if (
    file === "rank.html" ||
    file === "rank0pause.html" ||
    file === "100k.html" ||
    file === "200k.html" ||
    file === "300k.html" ||
    file === "400k.html" ||
    file === "500k.html" ||
    file === "kara.html" ||
    file === "classement.html"
  ) {
    activateMainMenu(".tab-menu-classements");
  }

  // Analyses
  if (
    file === "gang.html" ||
    file === "graphe.html" ||
    file === "frise.html" ||
    file === "video.html" ||
    file === "rankyear.html" ||
    file === "timeline.html" ||
    file === "gen.html"
  ) {
    activateMainMenu(".tab-menu-analyses");
  }

  // Records
  if (
    file === "pause.html" ||
    file === "pauses.html" ||
    file === "pauses_total.html" ||
    file === "trophee.html" ||
    file === "exp1an.html" ||
    file === "role.html" ||
    file === "humble.html"
  ) {
    activateMainMenu(".tab-menu-records");
  }

  // Panthéons
  if (
    file === "pantheon.html" ||
    file === "pantheon2.html" ||
    file === "pantheon3.html"
  ) {
    activateMainMenu(".tab-menu-pantheon");
  }

  // Liens précis
  if (file === "rank.html") activateLink('.dropMenu a[href="rank.html"]');
  if (file === "rank0pause.html") activateLink('.dropMenu a[href="rank0pause.html"]');
  if (file === "100k.html") activateLink('.dropMenu a[href="100k.html"]');
  if (file === "200k.html") activateLink('.dropMenu a[href="200k.html"]');
  if (file === "300k.html") activateLink('.dropMenu a[href="300k.html"]');
  if (file === "400k.html") activateLink('.dropMenu a[href="400k.html"]');
  if (file === "500k.html") activateLink('.dropMenu a[href="500k.html"]');
  if (file === "kara.html") activateLink('.dropMenu a[href="kara.html"]');

  if (file === "gang.html") activateLink('.dropMenu a[href="gang.html"]');
  if (file === "graphe.html") activateLink('.dropMenu a[href="graphe.html"]');
  if (file === "frise.html") activateLink('.dropMenu a[href="frise.html"]');
  if (file === "video.html") activateLink('.dropMenu a[href="video.html"]');
  if (file === "rankyear.html") activateLink('.dropMenu a[href="rankyear.html"]');
  if (file === "timeline.html") activateLink('.dropMenu a[href="timeline.html"]');
  if (file === "gen.html") activateLink('.dropMenu a[href="gen.html"]');

  if (file === "trophee.html") activateLink('.dropMenu a[href="trophee.html"]');
  if (file === "exp1an.html") activateLink('.dropMenu a[href="exp1an.html"]');
  if (file === "role.html") activateLink('.dropMenu a[href="role.html"]');
  if (file === "humble.html") activateLink('.dropMenu a[href="humble.html"]');

  if (file === "pantheon.html") activateLink('.dropMenu a[href="pantheon.html"]');
  if (file === "pantheon2.html") activateLink('.dropMenu a[href="pantheon2.html"]');
  if (file === "pantheon3.html") activateLink('.dropMenu a[href="pantheon3.html"]');

  // Pauses
  const isPausePage =
    file === "pause.html" ||
    file === "pauses.html" ||
    file === "pauses_total.html";

  if (isPausePage) {
    const tabPause = document.querySelector(".tab-pause");
    if (tabPause) tabPause.classList.add("active");
  }

  if (file === "pause.html") {
    const linkUnique = document.getElementById("pauseLinkUnique");
    if (linkUnique) linkUnique.classList.add("is-active");
  }

  if (file === "pauses.html" || file === "pauses_total.html") {
    const linkTotal = document.getElementById("pauseLinkTotal");
    if (linkTotal) linkTotal.classList.add("is-active");
  }
})();
