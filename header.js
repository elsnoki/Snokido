// ================= HEADER =================

const headerHTML = `
<header class="topbar">
  <div class="topbar-inner">

    <a class="logo" href="rank.html">
      <img src="snokiki.png" alt="SNOKIKI">
    </a>

    <nav class="nav">

      <a class="tab tab-nv100" href="rank.html">NV100</a>
      <a class="tab tab-nv0" href="rank0pause.html">NV100 sans pause</a>
      <a class="tab tab-100" href="100k.html">100K</a>
      <a class="tab tab-200" href="200k.html">200K</a>
      <a class="tab tab-300" href="300k.html">300K</a>
      <a class="tab tab-400" href="400k.html">400K</a>
      <a class="tab tab-500" href="500k.html">500K et +</a>
      <a class="tab tab-niveau" href="niveau.html">Niveaux</a>

      <span class="tab-sep">|</span>

      <a class="tab tab-gang" href="gang.html">Gang</a>
      <a class="tab tab-graph" href="graphe.html">Graphe</a>
      <a class="tab tab-frise" href="frise.html">Frise</a>

      <span class="tab-sep">|</span>

      <span class="pauseWrap">
        <a class="tab tab-pause" href="#" id="pauseBtn">
          Pauses <span class="caret">▾</span>
        </a>

        <div class="pauseMenu">
          <a href="pause.html">Records — pauses uniques</a>
          <a href="pauses.html">Records — total par joueur</a>
        </div>
      </span>

      <a class="tab tab-year" href="rankyear.html">Année</a>
      <a class="tab tab-chrono" href="timeline.html">Timeline</a>

    </nav>
  </div>
</header>
`;

document.body.insertAdjacentHTML("afterbegin", headerHTML);


// ================= PAUSE MENU LOGIC =================

const wrap = document.querySelector(".pauseWrap");
const btn = document.getElementById("pauseBtn");
const menu = document.querySelector(".pauseMenu");

// Sécurité : menu caché au chargement
wrap.classList.remove("is-open");

function openMenu() {
  wrap.classList.add("is-open");
}

function closeMenu() {
  wrap.classList.remove("is-open");
}

function toggleMenu() {
  wrap.classList.toggle("is-open");
}

// Ouvre au clic
btn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  toggleMenu();
});

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

