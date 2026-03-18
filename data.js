function slugify(name){
  return String(name || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

const joueurs = [
  // ===== 23 joueurs NV100 =====
  {
    nom:"Ko0pa", avatar:"avatar/17.jpg", gen:6, inscription:"24-01-2026",
    modes:{
      nv100:{ jours:23, atteint_le:"16-02-2026", rang:"1/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:30, atteint_le:"18-03-2026", rang:"1/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },
  {
    nom:"TheGladiator", avatar:"avatar/4.jpg", gen:4, inscription:"23-05-2020",
    modes:{
      nv100:{ jours:54, atteint_le:"16-07-2020", rang:"2/23", xp:49500, pauses_total:{nb:1, mois:0, jours:17}, pauses_detail:[
        {xp:432, periode:"23/05/2020 -> 09/06/2020", mois:0, jours:17}
      ]},
      "100k":{ jours:40, atteint_le:"25-08-2020", rang:"3/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "200k":{ jours:84, atteint_le:"17-11-2020", rang:"1/6", xp:200000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "300k": { jours:135, atteint_le:"01-04-2021", rang:"1/4", xp:300000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "400k": { jours:2109, atteint_le:"02-03-2026", rang:"4/4", xp:400000, pauses_total:{nb:1, mois:38, jours:1163}, pauses_detail:[{xp:300010, periode:"01/04/2021 -> 07/06/2024", mois:38, jours:1163}] }
    }
  },
  {
    nom:"redbot", avatar:"avatar/20.jpg", gen:5, inscription:"07-08-2022",
    modes:{
      nv100:{ jours:55, atteint_le:"01-10-2022", rang:"3/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },
  {
    nom:"cirpacha", avatar:"avatar/11.jpg", gen:4, inscription:"03-02-2020",
    modes:{
      nv100:{ jours:94, atteint_le:"07-05-2020", rang:"4/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:238, atteint_le:"31-12-2020", rang:"8/14", xp:100000, pauses_total:{nb:1, mois:1, jours:30}, pauses_detail:[
        {xp:66666, periode:"06/2020 -> 07/2020", mois:1, jours:30}
      ]}
    }
  },
  {
    nom:"LargoJunior", avatar:"avatar/35.jpg", gen:6, inscription:"10-02-2026",
    modes:{
      nv100:{ jours:100, atteint_le:"20-05-2026", rang:"5/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },
  {
    nom:"Tellor", avatar:"avatar/18.jpg", gen:5, inscription:"10-04-2020",
    modes:{
      nv100:{ jours:170, atteint_le:"17-09-2020", rang:"6/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },
  {
    nom:"Abelard", avatar:"avatar/5.jpg", gen:2, inscription:"27-02-2016",
    modes:{
      nv100:{ jours:325, atteint_le:"17-01-2017", rang:"7/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:242, atteint_le:"16-09-2017", rang:"9/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "200k":{ jours:1811, atteint_le:"31-08-2022", rang:"6/6", xp:200000, pauses_total:{nb:2, mois:7, jours:211}, pauses_detail:[
        {xp:108220, periode:"02/2018 -> 05/2018", mois:3, jours:89},
        {xp:184204, periode:"04/2021 -> 08/2021", mois:4, jours:122}
      ]}
    }
  },
  {
    nom:"Jordan.io", avatar:"avatar/6.jpg", gen:4, inscription:"16-03-2019",
    modes:{
      nv100:{ jours:387, atteint_le:"06-04-2020", rang:"8/23", xp:49500, pauses_total:{nb:1, mois:4, jours:123}, pauses_detail:[
        {xp:4380, periode:"07/2019 -> 11/2019", mois:4, jours:123}
      ]},
      "100k":{ jours:217, atteint_le:"09-11-2020", rang:"6/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "200k":{ jours:877, atteint_le:"05-04-2023", rang:"4/6", xp:200000, pauses_total:{nb:2, mois:10, jours:303}, pauses_detail:[
        {xp:136660, periode:"09/2021 -> 05/2022", mois:8, jours:242},
        {xp:137000, periode:"05/2022 -> 07/2022", mois:2, jours:61}
      ]}
    }
  },
  {
    nom:"Alexis279", avatar:"avatar/9.jpg", gen:4, inscription:"07-10-2018",
    modes:{
      nv100:{ jours:522, atteint_le:"12-03-2020", rang:"9/23", xp:49500, pauses_total:{nb:2, mois:4, jours:122}, pauses_detail:[
        {xp:14790, periode:"05/2019 -> 07/2019", mois:2, jours:61},
        {xp:17944, periode:"10/2019 -> 12/2019", mois:2, jours:61}
      ]},
      "100k":{ jours:82, atteint_le:"02-06-2020", rang:"4/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },
  {
    nom:"Largo672", avatar:"avatar/15.jpg", gen:1, inscription:"10-02-2014",
    modes:{
      nv100:{ jours:610, atteint_le:"10-10-2015", rang:"10/23", xp:49500, pauses_total:{nb:2, mois:8, jours:243}, pauses_detail:[
        {xp:22828, periode:"07/2014 -> 01/2015", mois:5, jours:153},
        {xp:23632, periode:"01/2015 -> 03/2015", mois:2, jours:61}
      ]}
    }
  },
  {
    nom:"Unit", avatar:"avatar/14.jpg", gen:4, inscription:"13-07-2018",
    modes:{
      nv100:{ jours:636, atteint_le:"09-04-2020", rang:"11/23", xp:49500, pauses_total:{nb:1, mois:5, jours:153}, pauses_detail:[
        {xp:35120, periode:"07/2019 -> 12/2019", mois:5, jours:153},
      ]},
        "100k":{jours:null, atteint_le:"—", rang:"—", xp:100000, pauses_total:{nb:1, mois:57, jours:1754}, pauses_detail:[
        {xp:60000, periode:"05/2021 -> 18/02/2026", mois:57, jours:1754}
      ]}
    }
  },
  {
  nom:"alex.c2109", avatar:"avatar/2.jpg", gen:3, inscription:"24-06-2017",
  modes:{
    nv100:{ jours:645, atteint_le:"31-03-2019", rang:"12/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "100k":{ jours:116, atteint_le:"25-07-2019", rang:"5/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "200k":{ jours:232, atteint_le:"13-03-2020", rang:"2/6", xp:200000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "300k": { jours:292, atteint_le:"30-12-2020", rang:"4/4", xp:300000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "400k": { jours:776, atteint_le:"14-02-2023", rang:"2/4", xp:400000, pauses_total:{nb:1, mois:8, jours:242}, pauses_detail:[
      {xp:325500, periode:"09/2021 -> 05/2022", mois:8, jours:242}
    ] },

    "500k": { jours:530, atteint_le:"28-07-2024", rang:"—", xp:500000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "600k": { jours:167, atteint_le:"11-01-2025", rang:"—", xp:600000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "700k": { jours:158, atteint_le:"18-06-2025", rang:"—", xp:700000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "800k": { jours:224, atteint_le:"28-01-2026", rang:"—", xp:800000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
  }
},
  {
    nom:"djabrail", avatar:"avatar/16.jpg", gen:1, inscription:"07-08-2014",
    modes:{
      nv100:{ jours:693, atteint_le:"30-06-2016", rang:"13/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },
  {
    nom:"Esdras950", avatar:"avatar/12.jpg", gen:4, inscription:"01-05-2018",
    modes:{
      nv100:{ jours:727, atteint_le:"27-04-2020", rang:"14/23", xp:49500, pauses_total:{nb:2, mois:3, jours:93}, pauses_detail:[
        {xp:31294, periode:"07/2019 -> 09/2019", mois:2, jours:61},
        {xp:31680, periode:"10/2019 -> 11/2019", mois:1, jours:32}
      ]},
      "100k":{ jours:635, atteint_le:"22-01-2022", rang:"11/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },
  {
    nom:"josué455", avatar:"avatar/8.jpg", gen:2, inscription:"15-08-2014",
    modes:{
      nv100:{ jours:778, atteint_le:"01-10-2016", rang:"15/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:808, atteint_le:"05-08-2017", rang:"12/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },
  {
    nom:"Golder", avatar:"avatar/13.jpg", gen:4, inscription:"24-07-2017",
    modes:{
      nv100:{ jours:980, atteint_le:"30-03-2020", rang:"16/23", xp:49500, pauses_total:{nb:3, mois:6, jours:182}, pauses_detail:[
        {xp:43360, periode:"09/2019 -> 11/2019", mois:2, jours:61},
        {xp:43476, periode:"12/2019 -> 03/2020", mois:3, jours:92}
      ] }
    }
  },
  {
  nom:"Talk Takashi", avatar:"avatar/1.jpg", gen:2, inscription:"13-04-2014",
  modes:{
    nv100:{ jours:1013, atteint_le:"20-01-2017", rang:"17/23", xp:49500, pauses_total:{nb:2, mois:22, jours:670}, pauses_detail:[
      {xp:640, periode:"07/2014 -> 03/2015", mois:8, jours:243},
      {xp:928, periode:"03/2015 -> 05/2016", mois:14, jours:427}
    ]},
    "100k":{ jours:274, atteint_le:"21-10-2017", rang:"10/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "200k":{ jours:420, atteint_le:"15-12-2018", rang:"3/6", xp:200000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "300k": { jours:177, atteint_le:"10-06-2019", rang:"3/4", xp:300000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "400k": { jours:204, atteint_le:"31-12-2019", rang:"1/4", xp:400000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "500k": { jours:178, atteint_le:"26-06-2020", rang:"—", xp:500000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "600k": { jours:73, atteint_le:"28-08-2020", rang:"—", xp:600000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "700k": { jours:79, atteint_le:"15-11-2020", rang:"—", xp:700000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "800k": { jours:133, atteint_le:"28-03-2021", rang:"—", xp:800000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "900k": { jours:227, atteint_le:"10-11-2021", rang:"—", xp:900000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "1m":   { jours:251, atteint_le:"19-07-2022", rang:"—", xp:1000000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "1m1":  { jours:419, atteint_le:"11-09-2023", rang:"—", xp:1100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
    "1m2":  { jours:680, atteint_le:"22-07-2025", rang:"—", xp:1200000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
  }
},
  {
    nom:"francoeur", avatar:"avatar/3.jpg", gen:3, inscription:"18-12-2015",
    modes:{
      nv100:{ jours:1203, atteint_le:"04-04-2019", rang:"18/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:236, atteint_le:"26-11-2019", rang:"7/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "200k":{ jours:994, atteint_le:"16-08-2022", rang:"5/6", xp:200000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "300k": { jours:157, atteint_le:"20-01-2021", rang:"2/4", xp:300000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "400k": { jours:1052, atteint_le:"08-12-2023", rang:"3/4", xp:400000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },
  {
    nom:"lumia", avatar:"avatar/10.jpg", gen:5, inscription:"01-01-2019",
    modes:{
      nv100:{ jours:1226, atteint_le:"15-05-2022", rang:"19/23", xp:49500, pauses_total:{nb:3, mois:27, jours:821}, pauses_detail:[
        {xp:17360, periode:"08/2019 -> 11/2019", mois:3},
        {xp:17914, periode:"12/2019 -> 03/2020", mois:3},
        {xp:24554, periode:"06/2020 -> 03/2022", mois:21}
      ]},
      "100k":{ jours:823, atteint_le:"11-08-2024", rang:"13/14", xp:100000, pauses_total:{nb:2, mois:14, jours:428}, pauses_detail:[
        {xp:61666, periode:"07/2022 -> 11/2022", mois:4, jours:123},
        {xp:76050, periode:"05/2023 -> 03/2024", mois:10, jours:305}
      ]},
      "200k":{ jours: null, atteint_le:"/* ta date */", rang:"/* ton rang */", xp:200000, pauses_total:{nb:2, mois:11, jours:335}, pauses_detail:[
    {xp:107590, periode:"01/2025 -> 07/2025", mois:6, jours:182},
    {xp:107774, periode:"08/2025 -> 01/2026", mois:5, jours:153}
  ]
},
    }
  },
  {
    nom:"hoopa", avatar:"avatar/7.jpg", gen:3, inscription:"19-11-2015",
    modes:{
      nv100:{ jours:1277, atteint_le:"19-05-2019", rang:"20/23", xp:49500, pauses_total:{nb:5, mois:28, jours:852}, pauses_detail:[
        {xp:10202, periode:"04/2016 -> 05/2016", mois:1},
        {xp:11860, periode:"08/2016 -> 06/2017", mois:10},
        {xp:12552, periode:"06/2017 -> 02/2018", mois:8},
        {xp:12848, periode:"03/2018 -> 08/2018", mois:5},
        {xp:13032, periode:"11/2018 -> 03/2019", mois:4}
      ]},
      "100k":{ jours:34, atteint_le:"22-06-2019", rang:"1/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },
  {
    nom:"dude", avatar:"avatar/37.jpg", gen:0, inscription:"22-03-2013",
    modes:{
      nv100:{ jours:1866, atteint_le:"~Mai 2018", rang:"21/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] },
      "100k":{ jours:2830, atteint_le:"05-02-2026", rang:"14/14", xp:100000, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },
  {
    nom:"Pingu", avatar:"avatar/19.jpg", gen:5, inscription:"12-05-2019",
    modes:{
      nv100:{ jours:1953, atteint_le:"15-09-2024", rang:"22/23", xp:49500, pauses_total:{nb:1, mois:58, jours:1766}, pauses_detail:[
        {xp:1500, periode:"01/07/2019 -> 01/05/2024", mois:58, jours:1766}
      ]}
    }
  },
  {
    nom:"Korben", avatar:"avatar/38.jpg", gen:0, inscription:"22-03-2013",
    modes:{
      nv100:{ jours:1958, atteint_le:"~Août 2018", rang:"23/23", xp:49500, pauses_total:{nb:0, mois:0, jours:0}, pauses_detail:[] }
    }
  },
  // =====================
// AJOUTS / MISES À JOUR
// =====================

{
  nom:"UY-Scuty", avatar:"avatar/27.jpg", gen:6, inscription:"03-06-2022",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:40000,
      pauses_total:{ nb:1, mois:43, jours:1316 },
      pauses_detail:[
        { xp:40000, periode:"depuis 06/08/2022", mois:43, jours:1316 }
      ]
    }
  }
},
{
  nom:"blackout", avatar:"avatar/30.jpg", gen:6, inscription:"16-05-2019",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:40000,
      pauses_total:{ nb:2, mois:35, jours:1079 },
      pauses_detail:[
        { xp:1696, periode:"20/05/2019 -> 01/2022~", mois:31, jours:957 },
        { xp:24724, periode:"04/2022 -> 08/2022", mois:4, jours:122 }
      ]
    }
  }
},
{
  nom:"Athèna", avatar:"avatar/31.jpg", gen:7, inscription:"30-03-2019",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:40000,
      pauses_total:{ nb:3, mois:75, jours:2334 },
      pauses_detail:[
        { xp:5080, periode:"16/06/2019 -> 08/2021~", mois:25, jours:777 },
        { xp:22028, periode:"27/10/2021 -> 04/08/2022", mois:9, jours:281 },
        { xp:40000, periode:"depuis 15/09/2022", mois:41, jours:1276 }
      ]
    }
  }
},
{
  nom:"acno", avatar:"avatar/32.jpg", gen:7, inscription:"23-03-2019",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:40000,
      pauses_total:{ nb:3, mois:77, jours:2372 },
      pauses_detail:[
        { xp:5080, periode:"19/05/2019 -> 10/2021", mois:28, jours:866 },
        { xp:22028, periode:"01/2022 -> 04/08/2022", mois:7, jours:215 },
        { xp:40000, periode:"depuis 31/08/2022", mois:42, jours:1291 }
      ]
    }
  }
},
{
  nom:"cahincaha", avatar:"avatar/24.jpg", gen:7, inscription:"22-04-2023",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:42000,
      pauses_total:{ nb:3, mois:25, jours:736 },
      pauses_detail:[
        { xp:40000, periode:"16/12/2023 -> 14/03/2024", mois:2, jours:89 },
        { xp:40056, periode:"14/03/2024 -> 01/06/2024", mois:2, jours:79 },
        { xp:42000, periode:"depuis 05/06/2024", mois:21, jours:647 }
      ]
    }
  }
},
{
  nom:"Houka", avatar:"avatar/25.jpg", gen:6, inscription:"18-11-2023",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:41000,
      pauses_total:{ nb:1, mois:19, jours:595 },
      pauses_detail:[
        { xp:41000, periode:"15/07/2024 -> 02/03/2026", mois:19, jours:595 }
      ]
    }
  }
},
{
  nom:"Bételgeuse", avatar:"avatar/28.jpg", gen:6, inscription:"07-06-2020",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:40000,
      pauses_total:{ nb:2, mois:63, jours:1932 },
      pauses_detail:[
        { xp:8100, periode:"09/2020 -> 08/2022", mois:23, jours:699 },
        { xp:40000, periode:"depuis 28/10/2022", mois:40, jours:1233 }
      ]
    }
  }
},
{
  nom:"Aldébaran", avatar:"avatar/29.jpg", gen:6, inscription:"07-06-2020",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:40000,
      pauses_total:{ nb:2, mois:63, jours:1932 },
      pauses_detail:[
        { xp:8100, periode:"09/2020 -> 08/2022", mois:23, jours:699 },
        { xp:40000, periode:"depuis 28/10/2022", mois:40, jours:1233 }
      ]
    }
  }
},
{
  nom:"Venom_", avatar:"avatar/21.jpg", gen:7, inscription:"09-05-2021",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:48108,
      pauses_total:{ nb:1, mois:53, jours:1625 },
      pauses_detail:[
        { xp:48108, periode:"depuis 10/2021", mois:53, jours:1625 }
      ]
    }
  }
},
{
  nom:"Justice", avatar:"avatar/26.jpg", gen:6, inscription:"29-02-2024",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:32580,
      pauses_total:{ nb:2, mois:15, jours:488 },
      pauses_detail:[
        { xp:27824, periode:"12/08/2024 -> 22/01/2025", mois:5, jours:163 },
        { xp:32580, periode:"14/03/2025 -> 02/02/2026", mois:10, jours:325 }
      ]
    }
  }
},
{
  nom:"Napoléon.1er", avatar:"avatar/40.jpg", gen:6, inscription:"14-07-2024",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:12776,
      pauses_total:{ nb:2, mois:6, jours:213 },
      pauses_detail:[
        { xp:12560, periode:"06/2025 -> 10/2025", mois:4, jours:122 },
        { xp:12776, periode:"11/2025 -> 01/2026", mois:2, jours:91 }
      ]
    }
  }
},
{
  nom:"Elena21", avatar:"avatar/41.jpg", gen:7, inscription:"31-03-2019",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:200,
      pauses_total:{ nb:1, mois:81, jours:2468 },
      pauses_detail:[
        { xp:200, periode:"05/2019 -> 02/2026", mois:81, jours:2468 }
      ]
    }
  }
},
{
  nom:"Gangster2019", avatar:"avatar/44.jpg", gen:7, inscription:"24-03-2019",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:1940,
      pauses_total:{ nb:2, mois:80, jours:2435 },
      pauses_detail:[
        { xp:1512, periode:"06/2019 -> 06/2020", mois:12, jours:366 },
        { xp:1940, periode:"07/2020 -> 03/2026", mois:68, jours:2069 }
      ]
    }
  }
},
{
  nom:"Shadow321", avatar:"avatar/42.jpg", gen:7, inscription:"24-03-2019",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:1134,
      pauses_total:{ nb:1, mois:81, jours:2471 },
      pauses_detail:[
        { xp:1134, periode:"06/2019 -> 07/03/2026", mois:81, jours:2471 }
      ]
    }
  }
},
{
  nom:"Clovis1er", avatar:"avatar/36.jpg", gen:7, inscription:"14-02-2026",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:0,
      pauses_total:{ nb:0, mois:0, jours:0 },
      pauses_detail:[]
    }
  }
},
{
  nom:"Polyy", avatar:"avatar/33.jpg", gen:7, inscription:"24-12-2025",
  modes:{
    nv100:{
      jours:null, atteint_le:"—", rang:"—", xp:0,
      pauses_total:{ nb:0, mois:0, jours:0 },
      pauses_detail:[]
    }
  }
},
];





