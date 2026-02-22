<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Profil du gang</title>

  <link rel="stylesheet" href="style.css">
  <script src="header.js" defer></script>

  <style>
    body{margin:0;font-family:Arial,sans-serif;background:radial-gradient(1100px 600px at 25% 15%,#2a88ad 0%,#0b3551 60%,#062638 100%);}
    .wrap{max-width:1180px;margin:26px auto 40px;padding:0 12px;}
    .panel{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.28);border:1px solid rgba(0,0,0,.10);}
    .titlebar{background:#3b3b3b;color:#fff;padding:14px 16px;font-size:22px;font-weight:900;}
    .content{padding:16px;}
    .membersGrid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:12px;padding:16px;background:linear-gradient(#1e6f92,#114e6a);}
    .mCard{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:10px;text-align:center;color:#fff;font-weight:900;font-size:13px;}
    .mCard img{width:66px;height:66px;object-fit:cover;border-radius:14px;border:2px solid rgba(0,0,0,.25);background:#ddd;display:block;margin:0 auto 8px;}
    .mXp{margin-top:6px;font-weight:700;font-size:12px;opacity:.95;}
    @media (max-width:1020px){.membersGrid{grid-template-columns:repeat(4,minmax(0,1fr));}}
  </style>
</head>

<body>
  <main class="wrap">
    <section class="panel">
      <div class="titlebar" id="pageTitle">Gang</div>
      <div class="content" id="content"></div>
      <div class="membersGrid" id="members"></div>
    </section>
  </main>

  <script>
    function slugify(s){
      return (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]/g,"").toLowerCase();
    }

    window.addEventListener("DOMContentLoaded", () => {
      const params = new URLSearchParams(location.search);
      const gSlug = params.get("g");

      const pageTitle = document.getElementById("pageTitle");
      const content = document.getElementById("content");
      const members = document.getElementById("members");

      const gangs = JSON.parse(localStorage.getItem("gangsResolved") || "[]");

      if(!gangs.length){
        pageTitle.textContent = "Donnees manquantes";
        content.innerHTML = `<p style="font-weight:900">Reviens sur <a href="gang.html">gang.html</a> (le classement) pour recalculer les gangs.</p>`;
        return;
      }

      const gang = gangs.find(x => slugify(x.name) === gSlug);

      if(!gang){
        pageTitle.textContent = "Gang introuvable";
        content.innerHTML = `<p style="font-weight:900">Gang introuvable. Retour: <a href="gang.html">gang.html</a></p>`;
        return;
      }

      pageTitle.textContent = "Gang : " + gang.name;

      const xpStr = (gang.totalXp||0).toLocaleString("fr-FR") + " xp";
      const karaStr = (gang.totalKaras||0) ? (gang.totalKaras.toLocaleString("fr-FR") + " Kara") : "—";

      content.innerHTML = `
        <p style="font-size:18px;font-weight:900;margin:0 0 10px">Classement: ${gang.classement ?? "—"}</p>
        <p style="margin:0 0 6px"><b>XP total:</b> ${xpStr}</p>
        <p style="margin:0 0 6px"><b>Kara total:</b> ${karaStr}</p>
        <p style="margin:0"><b>Membres:</b> ${gang.count} / 50</p>
      `;

      const list = (gang.membersResolved || []).slice().sort((a,b)=> (b.xp||0) - (a.xp||0));
      members.innerHTML = list.map(m => `
        <div class="mCard" title="${m.nom}">
          <img src="${m.avatar || "avatar/1.jpg"}" alt="${m.nom}">
          ${m.nom}
          <div class="mXp">${(m.xp||0).toLocaleString("fr-FR")} xp</div>
          <div class="mXp">${(m.karas||0).toLocaleString("fr-FR")} Kara</div>
        </div>
      `).join("");
    });
  </script>
</body>
</html>
