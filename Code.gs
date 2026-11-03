/**
 * Backend pro Rodinný průzkum sladkostí.
 *
 * Očekávaná struktura Google Sheetu (3 listy):
 * - "Respondents": sloupec A = jméno respondenta (řádek 1 = hlavička)
 * - "Candies":     sloupec A = název sladkosti, B = jazyk, ve kterém ji
 *                  někdo přidal (cs/sk/fr; jen informativní, appka ho
 *                  nikde nepoužívá) — řádek 1 = hlavička. Seznam se plní
 *                  hlavně přímo z appky (pole "Hledat nebo přidat
 *                  sladkost").
 * - "Responses":   A = časová značka, B = jméno, C = sladkost,
 *                  D = kategorie (odvozená ze skóre), E = skóre (-10..10),
 *                  F = komentář
 *
 * Vícejazyčnost řeší jen frontend (texty appky). Jména ani názvy
 * sladkostí se nepřekládají: sladkost se ve všech jazycích ukazuje pod
 * původním názvem, jak ho kdo napsal, a ten slouží i jako klíč pro
 * hlasování — v kódu se mu říká "gift" (interní název proměnné zůstal
 * z původní verze appky o dárcích — je to jen implementační detail).
 * (Dřívější automatický překlad přes LanguageApp dělal z názvů značek
 * nesmysly, proto byl odstraněn.)
 *
 * doGet akce: respondents, gifts, uservotes, myresponses, giftstats,
 *             highlights
 * doPost typy: start, addgift, unvote (odebrání hlasu),
 *              (bez type = uložení hlasu)
 *
 * Hlasuje se pětistupňovou škálou (smajlíky v appce), která se ukládá
 * jako -10 / -5 / 0 / 5 / 10 — díky tomu fungují průměry, Přehled
 * i Zajímavosti beze změny. Jiné hodnoty se zaokrouhlí na nejbližší
 * stupeň.
 *
 * Po každé úpravě tohoto souboru je potřeba v Apps Scriptu udělat
 * Deploy > Manage deployments > (tužka) Edit > New version > Deploy,
 * jinak se změny na živé URL neprojeví. Web app musí být nasazený
 * s "Execute as: Me" a "Who has access: Anyone".
 */

const SUPPORTED_LANGS = ["cs", "sk", "fr"];

function doGet(e) {
  const action = e.parameter.action;

  try {
    if (action === "respondents") {
      return json(getColumnValues_("Respondents", 1));
    }

    if (action === "gifts") {
      return json(getGifts_());
    }

    if (action === "uservotes") {
      const name = (e.parameter.name || "").trim().toLowerCase();
      return json(getUserVotes_(name));
    }

    if (action === "myresponses") {
      const name = (e.parameter.name || "").trim().toLowerCase();
      return json(getUserResponses_(name));
    }

    if (action === "giftstats") {
      return json(getGiftStats_());
    }

    if (action === "highlights") {
      return json(getHighlights_());
    }

    return json({ error: "Unknown action" });
  } catch (err) {
    return json({ error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === "start") {
      if (!data.name) {
        return json({ error: "Chybí jméno." });
      }
      const name = data.name.trim();
      addRespondentIfMissing_(name);
      // Rovnou vrátíme i hlasy, které tenhle člověk už dal (sladkost +
      // skóre), ať appka hned vyznačí zvolené smajlíky. "alreadyVoted"
      // zůstává kvůli kompatibilitě se starší verzí frontendu (během
      // přechodu, než se GitHub Pages nasadí).
      const nameLower = name.toLowerCase();
      return json({
        success: true,
        votes: getUserVoteScores_(nameLower),
        alreadyVoted: getUserVotes_(nameLower)
      });
    }

    if (data.type === "addgift") {
      if (!data.gift || !data.gift.trim()) {
        return json({ error: "Chybí název sladkosti." });
      }
      // Jazyk sladkosti odvozujeme z jazyka appky, ve kterém ji člověk zrovna
      // psal — to je spolehlivější odhad než automatická detekce. Vracíme
      // kanonický název: pokud stejná sladkost (bez ohledu na velikost
      // písmen a diakritiku) už v seznamu je, appka použije tu existující.
      const result = addGiftIfMissing_(data.gift.trim(), normalizeLang_(data.lang));
      return json({ success: true, gift: result.gift, existed: result.existed });
    }

    if (data.type === "unvote") {
      if (!data.name || !data.gift) {
        return json({ error: "Chybí jméno nebo sladkost." });
      }
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");
      const row = findResponseRow_(sheet, data.name.trim().toLowerCase(), data.gift);
      if (row > 0) {
        sheet.deleteRow(row);
      }
      return json({ success: true, removed: row > 0 });
    }

    if (!data.name || !data.gift || typeof data.score !== "number" || isNaN(data.score)) {
      return json({ error: "Chybí jméno, sladkost nebo hodnocení." });
    }

    const name = data.name.trim();
    addRespondentIfMissing_(name);

    const score = clampScore_(data.score);
    const category = categoryFromScore_(score);
    const comment = (data.comment || "").toString().trim();
    const row = [new Date(), name, data.gift, category, score, comment];

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");

    // Pokud už pro tuhle dvojici jméno+sladkost řádek existuje (člověk
    // změnil hlas jiným smajlíkem), přepíšeme ho místo přidání
    // duplicitního řádku.
    const existingRow = findResponseRow_(sheet, name.toLowerCase(), data.gift);

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return json({ success: true });
  } catch (err) {
    return json({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function normalizeLang_(lang) {
  const l = String(lang || "").trim().toLowerCase();
  return SUPPORTED_LANGS.indexOf(l) >= 0 ? l : "cs";
}

// Zaokrouhlí skóre na nejbližší z pěti stupňů (-10, -5, 0, 5, 10).
function clampScore_(score) {
  const snapped = Math.round(score / 5) * 5;
  return Math.max(-10, Math.min(10, snapped));
}

// Klíč pro porovnání názvů sladkostí: bez ohledu na velikost písmen,
// diakritiku a okolní/vícenásobné mezery ("kofila" = "Kofila", "Pecet" =
// "Pečeť"). Kdyby runtime neuměl String.normalize, porovnává se aspoň bez
// ohledu na velikost písmen.
function matchKey_(text) {
  let s = String(text || "").trim().replace(/\s+/g, " ").toLowerCase();
  if (typeof s.normalize === "function") {
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  return s;
}

function categoryFromScore_(score) {
  if (score > 0) return "Oblíbené";
  if (score < 0) return "Nevhodné";
  return "Nemám názor";
}

function getColumnValues_(sheetName, col) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, col, lastRow - 1, 1)
    .getValues()
    .flat()
    .map(v => String(v).trim())
    .filter(v => v !== "");
}

function findResponseRow_(sheet, nameLower, gift) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  // B = jméno, C = sladkost
  const values = sheet.getRange(2, 2, lastRow - 1, 2).getValues();

  for (let i = 0; i < values.length; i++) {
    const rowName = String(values[i][0]).trim().toLowerCase();
    const rowGift = String(values[i][1]).trim();

    if (rowName === nameLower && rowGift === gift) {
      return i + 2; // skutečné číslo řádku v listu (řádek 1 je hlavička)
    }
  }

  return -1;
}

function getUserVotes_(nameLower) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // B = jméno, C = sladkost
  const values = sheet.getRange(2, 2, lastRow - 1, 2).getValues();

  return values
    .filter(row => String(row[0]).trim().toLowerCase() === nameLower)
    .map(row => String(row[1]).trim());
}

// Hlasy daného člověka jako [{ gift, score }] — pro vyznačení zvolených
// smajlíků v appce.
function getUserVoteScores_(nameLower) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // B = jméno, C = sladkost, D = kategorie, E = skóre
  const values = sheet.getRange(2, 2, lastRow - 1, 4).getValues();

  return values
    .filter(row => String(row[0]).trim().toLowerCase() === nameLower)
    .map(row => ({ gift: String(row[1]).trim(), score: Number(row[3]) }));
}

function getUserResponses_(nameLower) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // B = jméno, C = sladkost, D = kategorie, E = skóre, F = komentář
  const values = sheet.getRange(2, 2, lastRow - 1, 5).getValues();

  return values
    .filter(row => String(row[0]).trim().toLowerCase() === nameLower)
    .map(row => {
      const gift = String(row[1]).trim();
      return {
        gift: gift,
        score: Number(row[3]),
        comment: String(row[4] || "").trim()
      };
    });
}

function addRespondentIfMissing_(name) {
  if (!name) return;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respondents");
  if (!sheet) return;

  const existing = getColumnValues_("Respondents", 1);
  const nameLower = name.toLowerCase();
  const exists = existing.some(n => n.toLowerCase() === nameLower);

  if (!exists) {
    sheet.appendRow([name]);
  }
}

// Přidá sladkost do seznamu, pokud tam ještě není (porovnává se přes
// matchKey_). Vrací { gift, existed } — "gift" je kanonický název, pod
// kterým se pak hlasuje (u existující sladkosti ten, který už v listu je).
function addGiftIfMissing_(gift, giftLang) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Candies");
  if (!sheet) throw new Error('List "Candies" neexistuje.');

  const cleaned = String(gift).trim().replace(/\s+/g, " ");
  const key = matchKey_(cleaned);
  const existing = getColumnValues_("Candies", 1).find(g => matchKey_(g) === key);

  if (existing) {
    return { gift: existing, existed: true };
  }

  sheet.appendRow([cleaned, giftLang]);
  return { gift: cleaned, existed: false };
}

function getGifts_() {
  return getColumnValues_("Candies", 1).map(gift => ({ gift: gift }));
}

// Průměrné skóre a počet hlasů pro každou sladkost ze seznamu Candies, seřazené
// od nejoblíbenější po nejméně oblíbenou. Sladkosti bez hlasů (avgScore null)
// jsou vždy až za těmi s hlasy, seřazené abecedně.
function getGiftStats_() {
  const gifts = getColumnValues_("Candies", 1);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");

  const sums = {};
  const counts = {};

  if (sheet) {
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      // C = sladkost, D = kategorie, E = skóre
      const values = sheet.getRange(2, 3, lastRow - 1, 3).getValues();

      values.forEach(row => {
        const gift = String(row[0]).trim();
        const score = Number(row[2]);

        if (!gift || isNaN(score)) return;

        sums[gift] = (sums[gift] || 0) + score;
        counts[gift] = (counts[gift] || 0) + 1;
      });
    }
  }

  const withVotes = [];
  const withoutVotes = [];

  gifts.forEach(gift => {
    const count = counts[gift] || 0;
    const item = {
      gift: gift,
      avgScore: count > 0 ? sums[gift] / count : null,
      voteCount: count
    };

    if (count > 0) {
      withVotes.push(item);
    } else {
      withoutVotes.push(item);
    }
  });

  withVotes.sort((a, b) => b.avgScore - a.avgScore);
  withoutVotes.sort((a, b) => a.gift.localeCompare(b.gift, "cs"));

  return withVotes.concat(withoutVotes);
}

// Top 5 nejoblíbenějších, nejméně oblíbených a nejkontroverznějších
// sladkostí (nejvyšší rozptyl hodnocení = rodina se na nich nejvíc neshodla).
// Kontroverzní počítáme jen ze sladkostí aspoň se 2 hlasy, jinak rozptyl
// nemá smysl.
function getHighlights_() {
  const gifts = getColumnValues_("Candies", 1);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Responses");

  const entriesByGift = {};

  if (sheet) {
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      // B = jméno, C = sladkost, D = kategorie, E = skóre
      const values = sheet.getRange(2, 2, lastRow - 1, 4).getValues();

      values.forEach(row => {
        const name = String(row[0]).trim();
        const gift = String(row[1]).trim();
        const score = Number(row[3]);

        if (!gift || isNaN(score)) return;
        if (!entriesByGift[gift]) entriesByGift[gift] = [];
        entriesByGift[gift].push({ name: name, score: score });
      });
    }
  }

  const stats = gifts
    .map(gift => {
      const entries = entriesByGift[gift];
      if (!entries || entries.length === 0) return null;

      const scores = entries.map(e => e.score);
      const sum = scores.reduce((a, b) => a + b, 0);
      const avg = sum / scores.length;
      const variance = scores.reduce((acc, s) => acc + Math.pow(s - avg, 2), 0) / scores.length;

      return {
        gift: gift,
        avgScore: avg,
        voteCount: scores.length,
        min: Math.min.apply(null, scores),
        max: Math.max.apply(null, scores),
        stdev: Math.sqrt(variance),
        // Rozložení hlasů na škále -10..10, jen hodnoty s aspoň 1 hlasem
        // (pro vizualizaci rozmístění hodnocení na obrazovce Zajímavosti,
        // včetně jmen, kdo danou hodnotu dal — jména se nepřekládají).
        histogram: buildHistogram_(entries)
      };
    })
    .filter(item => item !== null);

  // Vážený průměr (stejný princip jako např. IMDb žebříček): sladkost s málo
  // hlasy se přitáhne blíž k celkovému průměru přes všechny sladkosti, takže
  // ji pár nadšených/naštvaných hlasů nevystřelí před sladkost, kterou
  // spolehlivě potvrdilo hodně lidí. "confidence" je průměrný počet
  // hlasů na sladkost — čím víc hlasů sladkost má oproti tomuhle průměru, tím
  // víc se počítá jeho vlastní skóre a míň se přitahuje ke globálu.
  const totalVotes = stats.reduce((sum, item) => sum + item.voteCount, 0);
  const totalScoreSum = stats.reduce((sum, item) => sum + item.avgScore * item.voteCount, 0);
  const globalAvg = totalVotes > 0 ? totalScoreSum / totalVotes : 0;
  const confidence = stats.length > 0 ? totalVotes / stats.length : 0;

  stats.forEach(item => {
    item.weightedScore =
      (item.voteCount / (item.voteCount + confidence)) * item.avgScore +
      (confidence / (item.voteCount + confidence)) * globalAvg;

    // Kontroverznost = rozptyl hodnocení × váha podle počtu hlasů (odmocnina,
    // ať to neroste přehnaně prudce) — rozpor potvrzený víc lidmi váží víc
    // než stejně velký rozpor jen mezi dvěma hlasujícími.
    item.controversyScore = item.stdev * Math.sqrt(item.voteCount);
  });

  const topFavorite = stats.slice().sort((a, b) => b.weightedScore - a.weightedScore).slice(0, 5);
  const topUnpopular = stats.slice().sort((a, b) => a.weightedScore - b.weightedScore).slice(0, 5);

  const topControversial = stats
    .filter(item => item.voteCount >= 2)
    .sort((a, b) => b.controversyScore - a.controversyScore)
    .slice(0, 5);

  return {
    topFavorite: topFavorite,
    topUnpopular: topUnpopular,
    topControversial: topControversial
  };
}

function buildHistogram_(entries) {
  const groups = {};

  entries.forEach(e => {
    if (!groups[e.score]) groups[e.score] = [];
    groups[e.score].push(e.name);
  });

  return Object.keys(groups).map(k => ({
    score: Number(k),
    count: groups[k].length,
    names: groups[k]
  }));
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
