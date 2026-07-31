import fs from "fs";
import * as cheerio from "cheerio";

const CONCURRENCY = 15;
const SAVE_EVERY = 25;

function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function toInt(s) {
  const n = String(s || "").replace(/[^\d]/g, "");
  return n ? Number(n) : null;
}

function absUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return "https://www.snokido.fr" + url;
}

function slugify(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithUA(url) {
  return fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "fr-FR,fr;q=0.9"
    }
  });
}

async function fetchWithRetry(url, tries = 4) {
  let lastErr;

  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetchWithUA(url);

      if ([429, 500, 502, 503, 504].includes(res.status)) {
        await sleep(1000 * i);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.text();
    } catch (err) {
      lastErr = err;
      await sleep(500 * i);
    }
  }

  throw lastErr;
}

function parsePlayers(html) {
  const $ = cheerio.load(html);

  const table = $("table")
    .filter((i, el) => {
      const txt = clean($(el).text()).toLowerCase();
      return (
        txt.includes("nom") &&
        txt.includes("xp") &&
        txt.includes("date")
      );
    })
    .first();

  const players = [];

  table.find("tr").each((i, tr) => {
    const tds = $(tr).find("td");

    if (tds.length < 5) return;

    const rank = toInt($(tds[0]).text());

    const nameA = $(tds[2]).find("a").first();

    const nom = clean(nameA.text());
    const profileHref = absUrl(nameA.attr("href"));

    if (!nom || !profileHref) return;

    players.push({
      rank,
      nom,
      slug: slugify(nom),
      profileHref
    });
  });

  return players;
}

async function fetchAllPlayers() {
  const all = [];

  for (let page = 1; page <= 50; page++) {
    const url =
      page === 1
        ? "https://www.snokido.fr/players"
        : `https://www.snokido.fr/players-${page}`;

    console.log(`Page ${page}`);

    const html = await fetchWithRetry(url);
    const players = parsePlayers(html);

    if (!players.length) break;

    all.push(...players);
  }

  return all;
}

function parseGamesRated(html) {
  const text = clean(
    cheerio.load(html)("body").text()
  );

  const m = text.match(
    /Jeux\s+notés\s*:\s*([\d\s]+)/i
  );

  return m
    ? Number(m[1].replace(/\s/g, ""))
    : null;
}

function saveResults(results) {
  fs.writeFileSync(
    "data/players_games_rated.json",
    JSON.stringify(results, null, 2),
    "utf8"
  );
}

async function main() {
  fs.mkdirSync("data", { recursive: true });

  const players = await fetchAllPlayers();

  console.log(
    `Joueurs trouvés : ${players.length}`
  );

  const results = [];
  let completed = 0;
  let nextIndex = 0;

  async function worker(id) {
    while (true) {
      const index = nextIndex++;

      if (index >= players.length) {
        return;
      }

      const player = players[index];

      try {
        const html = await fetchWithRetry(
          player.profileHref
        );

        results.push({
          rank: player.rank,
          nom: player.nom,
          slug: player.slug,
          jeuxNotes: parseGamesRated(html),
          profileHref: player.profileHref
        });
      } catch {
        results.push({
          rank: player.rank,
          nom: player.nom,
          slug: player.slug,
          jeuxNotes: null,
          profileHref: player.profileHref,
          error: true
        });
      }

      completed++;

      process.stdout.write(
        `\r${completed}/${players.length}`
      );

      if (completed % SAVE_EVERY === 0) {
        saveResults(results);
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: CONCURRENCY },
      (_, i) => worker(i)
    )
  );

  results.sort((a, b) => a.rank - b.rank);

  saveResults(results);

  console.log("\nTerminé");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
