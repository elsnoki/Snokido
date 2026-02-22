// data.js — source unique pour rank.html / 100k.html / profil.html

function slugify(name){
  return String(name || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

const joueurs = [
  {
    nom:"Ko0pa", avatar:"avatar/17.jpg", gen:6,
    inscription:"24-01-2026", arrivee:"16-02-2026",
    modes:{
      nv100:{ jours:23, atteint_le:"16-02-2026", rang:"1/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:null, atteint_le:"—", rang:"2/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"TheGladiator", avatar:"avatar/4.jpg", gen:4,
    inscription:"23-05-2020", arrivee:"16-07-2020",
    modes:{
      nv100:{ jours:54, atteint_le:"16-07-2020", rang:"2/23", xp:49500, pauses_total:{nb:1, mois:0, jours:17}, pauses_detail:[
        {xp:432, periode:"23/05/2020 -> 09/06/2020", mois:0, jours:17}
      ]},
      "100k":{ jours:40, atteint_le:"25-08-2020", rang:"3/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "200k":{ jours:84, atteint_le:"17-11-2020", rang:"1/6", xp:200000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "300k":{ jours:135, atteint_le:"01-04-2021", rang:"1/4", xp:300000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "400k":{ jours:null, atteint_le:"—", rang:"4/4", xp:400000, pauses_total:{nb:1, mois:38, jours:1163}, pauses_detail:[
        {xp:300010, periode:"01/04/2021 -> 07/06/2024", mois:38, jours:1163}
      ]}
    }
  },

  {
    nom:"redbot", avatar:"avatar/20.jpg", gen:5,
    inscription:"07-08-2022", arrivee:"01-10-2022",
    modes:{
      nv100:{ jours:55, atteint_le:"01-10-2022", rang:"3/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"cirpacha", avatar:"avatar/11.jpg", gen:4,
    inscription:"03-02-2020", arrivee:"07-05-2020",
    modes:{
      nv100:{ jours:94, atteint_le:"07-05-2020", rang:"4/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:238, atteint_le:"31-12-2020", rang:"8/14", xp:100000, pauses_total:{nb:1, mois:1, jours:30}, pauses_detail:[
        {xp:66666, periode:"06/2020 -> 07/2020", mois:1, jours:30}
      ]}
    }
  },

  {
    nom:"LargoJunior", avatar:"avatar/35.jpg", gen:6,
    inscription:"10-02-2026", arrivee:"20-05-2026",
    modes:{
      nv100:{ jours:100, atteint_le:"—", rang:"5/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
      // 100k pas renseigné ici (si tu veux l’ajouter plus tard)
    }
  },

  {
    nom:"Tellor", avatar:"avatar/18.jpg", gen:5,
    inscription:"10-04-2020", arrivee:"17-09-2020",
    modes:{
      nv100:{ jours:170, atteint_le:"17-09-2020", rang:"6/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"Abelard", avatar:"avatar/5.jpg", gen:2,
    inscription:"27-02-2016", arrivee:"17-01-2017",
    modes:{
      nv100:{ jours:325, atteint_le:"17-01-2017", rang:"7/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:242, atteint_le:"16-09-2017", rang:"9/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"Jordan.io", avatar:"avatar/6.jpg", gen:4,
    inscription:"16-03-2019", arrivee:"06-04-2020",
    modes:{
      nv100:{ jours:387, atteint_le:"06-04-2020", rang:"8/23", xp:49500, pauses_total:{nb:1, mois:4, jours:123}, pauses_detail:[
        {xp:4380, periode:"07/2019 -> 11/2019", mois:4, jours:123}
      ]},
      "100k":{ jours:217, atteint_le:"09-11-2020", rang:"6/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"Alexis279", avatar:"avatar/9.jpg", gen:4,
    inscription:"07-10-2018", arrivee:"12-03-2020",
    modes:{
      nv100:{ jours:522, atteint_le:"12-03-2020", rang:"9/23", xp:49500, pauses_total:{nb:2, mois:4, jours:122}, pauses_detail:[
        {xp:14790, periode:"05/2019 -> 07/2019", mois:2, jours:61},
        {xp:17944, periode:"10/2019 -> 12/2019", mois:2, jours:61}
      ]},
      "100k":{ jours:82, atteint_le:"02-06-2020", rang:"4/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"Largo672", avatar:"avatar/15.jpg", gen:1,
    inscription:"10-02-2014", arrivee:"10-10-2015",
    modes:{
      nv100:{ jours:610, atteint_le:"10-10-2015", rang:"10/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"Unit", avatar:"avatar/14.jpg", gen:4,
    inscription:"13-07-2018", arrivee:"09-04-2020",
    modes:{
      nv100:{ jours:636, atteint_le:"09-04-2020", rang:"11/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:null, atteint_le:"—", rang:"—", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"alex.c2109", avatar:"avatar/2.jpg", gen:3,
    inscription:"24-06-2017", arrivee:"31-03-2019",
    modes:{
      nv100:{ jours:645, atteint_le:"31-03-2019", rang:"12/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:116, atteint_le:"25-07-2019", rang:"5/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"djabrail", avatar:"avatar/16.jpg", gen:1,
    inscription:"07-08-2014", arrivee:"30-06-2016",
    modes:{
      nv100:{ jours:693, atteint_le:"30-06-2016", rang:"13/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"Esdras950", avatar:"avatar/12.jpg", gen:4,
    inscription:"01-05-2018", arrivee:"27-04-2020",
    modes:{
      nv100:{ jours:727, atteint_le:"27-04-2020", rang:"14/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:635, atteint_le:"22-01-2022", rang:"11/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"josué455", avatar:"avatar/8.jpg", gen:2,
    inscription:"15-08-2014", arrivee:"01-10-2016",
    modes:{
      nv100:{ jours:778, atteint_le:"01-10-2016", rang:"15/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:808, atteint_le:"05-08-2017", rang:"12/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"Golder", avatar:"avatar/13.jpg", gen:4,
    inscription:"24-07-2017", arrivee:"30-03-2020",
    modes:{
      nv100:{ jours:980, atteint_le:"30-03-2020", rang:"16/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"Talk Takashi", avatar:"avatar/1.jpg", gen:2,
    inscription:"13-04-2014", arrivee:"20-01-2017",
    modes:{
      nv100:{ jours:1013, atteint_le:"20-01-2017", rang:"17/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:274, atteint_le:"21-10-2017", rang:"10/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"francoeur", avatar:"avatar/3.jpg", gen:3,
    inscription:"18-12-2015", arrivee:"04-04-2019",
    modes:{
      nv100:{ jours:1203, atteint_le:"04-04-2019", rang:"18/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:236, atteint_le:"26-11-2019", rang:"7/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"lumia", avatar:"avatar/10.jpg", gen:5,
    inscription:"01-01-2019", arrivee:"15-05-2022",
    modes:{
      nv100:{ jours:1226, atteint_le:"15-05-2022", rang:"19/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:823, atteint_le:"11-08-2024", rang:"13/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"hoopa", avatar:"avatar/7.jpg", gen:3,
    inscription:"19-11-2015", arrivee:"19-05-2019",
    modes:{
      nv100:{ jours:1277, atteint_le:"19-05-2019", rang:"20/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:34, atteint_le:"22-06-2019", rang:"1/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"dude", avatar:"avatar/37.jpg", gen:0,
    inscription:"22-03-2013", arrivee:"~Mai 2018",
    modes:{
      nv100:{ jours:1866, atteint_le:"~Mai 2018", rang:"21/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:2830, atteint_le:"05-02-2026", rang:"14/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"Pingu", avatar:"avatar/19.jpg", gen:5,
    inscription:"12-05-2019", arrivee:"15-09-2024",
    modes:{
      nv100:{ jours:1953, atteint_le:"15-09-2024", rang:"22/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },

  {
    nom:"Korben", avatar:"avatar/38.jpg", gen:0,
    inscription:"22-03-2013", arrivee:"~Août 2018",
    modes:{
      nv100:{ jours:1958, atteint_le:"~Août 2018", rang:"23/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  }
];
