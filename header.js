// ================= HEADER =================

document.body.insertAdjacentHTML("afterbegin", `
<header class="topbar">
  <div class="topbar-inner">

    <a class="logo" href="rank.html">
      <img src="snokiki.png" alt="SNOKIKI">
    </a>

    <nav class="nav">

      <div class="menuWrap">
        <a class="tab menuBtn tab-menu-classements" href="#">
          Classements <span class="caret">▾</span>
        </a>

        <div class="dropMenu">
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

      <div class="menuWrap">
        <a class="tab menuBtn tab-menu-analyses" href="#">
          Analyses <span class="caret">▾</span>
        </a>

        <div class="dropMenu">
          <a class="tab tab-gang" href="gang.html">Gang</a>
          <a class="tab tab-graph" href="graphe.html">Graphe</a>
          <a class="tab tab-frise" href="frise.html">Frise</a>
          <a class="tab tab-video" href="video.html">Vidéo</a>
          <a class="tab tab-year" href="rankyear.html">Année</a>
          <a class="tab tab-chrono" href="timeline.html">Timeline</a>
          <a class="tab tab-gen" href="gen.html">Générations</a>
        </div>
      </div>

      <div class="menuWrap">
        <a class="tab menuBtn tab-menu-records" href="#">
          Records <span class="caret">▾</span>
        </a>

        <div class="dropMenu">

          <div class="pauseWrap">
            <a class="tab subMenuBtn" href="#" id="pauseBtn">
              Pauses <span class="caret">▸</span>
            </a>

            <div class="pauseMenu">
              <a href="pause.html">Records — pauses uniques</a>
              <a href="pauses.html">Records — total par joueur</a>
            </div>
          </div>

          <a class="tab" href="trophee.html">Trophées</a>
          <a class="tab" href="exp1an.html">Record 1 an</a>
          <a class="tab" href="1ers.html">1ers</a>
          <a class="tab" href="role.html">Rôles</a>
          <a class="tab" href="humble.html">Hommes Humbles</a>

        </div>
      </div>

      <div class="menuWrap">
        <a class="tab menuBtn tab-menu-pantheon" href="#">
          Panthéons <span class="caret">▾</span>
        </a>

        <div class="dropMenu">
          <a class="tab" href="pantheon.html">Panthéon des Légendes</a>
          <a class="tab" href="pantheon2.html">Panthéon de la honte</a>
          <a class="tab" href="pantheon3.html">Panthéon des Noobs</a>
        </div>
      </div>

      <a class="tab tab-menu-createur" href="createur_snoki.html">
        Créateur de Snoki
      </a>

    </nav>
  </div>
</header>
`);


// ================= DROPDOWNS =================

const menuWraps = document.querySelectorAll(".menuWrap");
const menuButtons = document.querySelectorAll(".menuBtn");

function closeAll() {
  menuWraps.forEach(w => w.classList.remove("is-open"));
}

menuButtons.forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const wrap = btn.closest(".menuWrap");

    if (wrap.classList.contains("is-open")) {
      wrap.classList.remove("is-open");
    } else {
      closeAll();
      wrap.classList.add("is-open");
    }
  });
});

// fermer clic extérieur
document.addEventListener("click", () => closeAll());

// ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAll();
});
