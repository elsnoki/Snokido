// gangdata.js (SAFE)
// - Sans accents dans les champs texte sensibles
// - Aucun caractere special dans les cles
// - members: xp/karas facultatifs (Top50 auto via scrap)

const gangsData = [
  {
    name: "Athena Gangster",
    img: "avatar/gang1.jpg",
    creation: "15-03-2019",
    rang: "—",
    chefLabel: "Chef du gang",
    chefValue: "Talk Takashi",
    recrutement: "—",
    trophees: "—",
    members: [
      { nom: "Talk Takashi" },
      { nom: "Ko0pa" },              // AJOUT
      { nom: "Venom_", avatar:"avatar/21.jpg" },
      { nom: "lumia" },
      { nom: "Unit" },
      { nom: "redbot" },
      { nom: "Jordan.io" }
    ],
  },

  {
    name: "Los Pollos Gangsta",
    img: "avatar/gang3.png",
    creation: "23-01-2026",
    rang: "—",
    chefLabel: "Chef du gang",
    chefValue: "—",
    recrutement: "—",
    trophees: "—",
    members: [
      { nom: "Alexis279" },           // alex.c2109 supprimé chez toi
      { nom: "TheGladiator" },
      { nom: "Pingu" },
      { nom: "Abelard" },
      { nom: "hoopa" },
      { nom: "Tellor" },
      { nom: "Golder" },
      { nom: "cirpacha" }
    ],
  },

  {
    name: "Tribu Esdrasso",
    img: "avatar/gang4.png",
    creation: "16-05-2019",
    rang: "—",
    chefLabel: "Chef du gang",
    chefValue: "Esdras950",
    recrutement: "—",
    trophees: "—",
    members: [
      { nom: "Esdras950" },
      { nom: "francoeur" },
      { nom: "josue455" }, // au lieu de josué455 (moins de bugs)
      // non-top50 => manuel
      { nom: "ariel005", xp: 26844, karas: 128092, avatar: "avatar/140.jpg" }
    ],
  },

  {
    name: "Admin",
    img: "avatar/gang7.jpg",
    creation: "01-09-2013",
    rang: "—",
    chefLabel: "Chef du gang",
    chefValue: "—",
    recrutement: "—",
    trophees: "—",
    members: [
      { nom: "dude", xp: 100258, karas: 607188, avatar: "avatar/37.jpg" },
      { nom: "Korben", xp: 92406, karas: 406000, avatar: "avatar/38.jpg" }
    ],
  }
];
