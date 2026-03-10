// ================= HEADER =================

const headerHTML = `
<header class="topbar">
  <div class="topbar-inner">

    <a class="logo" href="rank.html" aria-label="Accueil SNOKIKI">
      <img src="snokiki.png" alt="SNOKIKI">
    </a>

    <nav class="nav" aria-label="Navigation principale">

      <!-- ===== CLASSEMENTS ===== -->
      <div class="nav-group nav-group-rankings">
        <span class="nav-group-title">Classements</span>

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

      <span class="tab-sep" aria-hidden="true">|</span>

      <!-- ===== ANALYSES / VUES ===== -->
      <div class="nav-group nav-group-analysis">
        <span class="nav-group-title">Analyses</span>

        <a class="tab tab-gang" href="gang.html">Gang</a>
        <a class="tab tab-graph" href="graphe.html">Graphe</a>
        <a class="tab tab-frise" href="frise.html">Frise</a>
        <a class="tab tab-video" href="video.html">Vidéo</a>
        <a class="tab tab-year" href="rankyear.html">Année</a>
        <a class="tab tab-chrono" href="timeline.html">Timeline</a>
        <a class="tab tab-gen" href="gen.html">Générations</a>
      </div>

      <span class="tab-sep" aria-hidden="true">|</span>

      <!-- ===== RECORDS / DISTINCTIONS ===== -->
      <div class="nav-group nav-group-records">
        <span class="nav-group-title">Records & distinctions</span>

        <span class="pauseWrap">
          <a class="tab tab-pause" href="#" id="pauseBtn" aria-haspopup="true" aria-expanded="false">
            Pauses <span class="caret">▾</span>
          </a>

          <div class="pauseMenu" role="menu" aria-label="Menu pauses">
            <a id="pauseLinkUnique" href="pause.html" role="menuitem">Records — pauses uniques</a>
            <a id="pauseLinkTotal" href="pauses.html" role="menuitem">Records — total par joueur</a>
          </div>
        </span>

        <a class="tab tab-trophee" href="trophee.html">Trophées</a>
        <a class="tab tab-record" href="exp1an.html">Record 1 an</a>
        <a class="tab tab-role" href="role.html">Rôles</a>
        <a class="tab tab-humble" href="humble.html">Hommes Humbles</a>
      </div>

      <span class="tab-sep" aria-hidden="true">|</span>

      <!-- ===== PANTHÉONS ===== -->
      <div class="nav-group nav-group-pantheon">
        <span class="nav-group-title">Panthéons</span>

        <a class="tab tab-pantheon" href="pantheon.html">Panthéon des Légendes</a>
        <a class="tab tab-pantheon2" href="pantheon2.html">Panthéon de la honte</a>
        <a class="tab tab-noob" href="pantheon3.html">Panthéon des Noobs</a>
      </div>

    </nav>
  </div>
</header>
`;

document.body.insertAdjacentHTML("afterbegin", headerHTML);

// ================= ELEMENTS =================

const wrap = document.querySelector(".pauseWrap");
const btn = document.getElementById("pauseBtn");
const menu = document.querySelector(".pauseMenu");

// Sécurité : menu fermé au chargement
if (wrap) {
  wrap.classList.remove("is-open");
}

// ================= PAUSE MENU LOGIC =================

function openMenu() {
  if (!wrap || !btn) return;
  wrap.classList.add("is-open");
  btn.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  if (!wrap || !btn) return;
  wrap.classList.remove("is-open");
  btn.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
  if (!wrap) return;
  const isOpen = wrap.classList.contains("is-open");
  isOpen ? closeMenu() : openMenu();
}

// Ouvre / ferme au clic
if (btn) {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMenu();
  });
}

// Ferme si clic ailleurs
document.addEventListener("click", (e) => {
  if (!e.target.closest(".pauseWrap")) {
    closeMenu();
  }
});

// Ferme avec ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeMenu();
  }
});

// ================= ACTIVE STATE (pause pages) =================

(function setActivePause() {
  const path = (window.location.pathname || "").toLowerCase();
  const file = path.split("/").pop(); // ex: pause.html

  const tabPause = document.querySelector(".tab-pause");
  const linkUnique = document.getElementById("pauseLinkUnique");
  const linkTotal = document.getElementById("pauseLinkTotal");

  const isPausePage =
    file === "pause.html" ||
    file === "pauses.html" ||
    file === "pauses_total.html"; // ancien nom conservé

  if (isPausePage && tabPause) {
    tabPause.classList.add("active");
  }

  if (file === "pause.html" && linkUnique) {
    linkUnique.classList.add("is-active");
  }

  if ((file === "pauses.html" || file === "pauses_total.html") && linkTotal) {
    linkTotal.classList.add("is-active");
  }
})();
