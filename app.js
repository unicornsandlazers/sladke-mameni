// URL vlastního Apps Script deploymentu pro tuhle appku
// (Deploy > New deployment > Web app). Nesmí to být URL appky pro dárky!
const API =
"https://script.google.com/macros/s/AKfycbx5V4k_x-f4do-e2b0Wj8LD30tdjA57UCizFEkBd_kH-AdDBIzt1dq0JHuBw3kRf9KVEw/exec";

/**
 * Jména respondentů se nikdy nepřekládají. U sladkostí appka rozlišuje
 * "gift" (kanonický, nepřeložený název — používá se jako klíč při
 * hlasování a párování odpovědí) a "giftDisplay" (přeložený text pro
 * zobrazení, počítá ho backend přes Code.gs podle zvoleného jazyka).
 * Objekty se sladkostmi (v allGifts, reviewData…) mají vždy oba tyhle
 * dva atributy. (Interní názvy proměnných zůstaly "gift" — je to jen
 * implementační detail z původní appky o dárcích, uživatel ho nikde
 * nevidí.)
 *
 * Hlasuje se pěti smajlíky (LEVELS) přímo v seznamu všech sladkostí.
 * Na backend se ukládají jako -10 / -5 / 0 / 5 / 10, takže Přehled
 * a Zajímavosti počítají průměry stejně jako dřív. Další klepnutí na
 * zvolený smajlík hlas odebere.
 */
const I18N = {
    cs: {
        home: "← Domů",
        app_title: "Rodinný průzkum sladkostí",
        name_label: "Jak se jmenuješ?",
        name_placeholder: "Začni psát jméno",
        start_button: "Hodnotit sladkosti",
        loading: "Načítám…",
        overview_button: "📊 Přehled sladkostí",
        highlights_button: "🏆 Zajímavosti",
        name_required: "Vyplň prosím jméno.",
        confirm_new_name: 'Jméno "{name}" jsme zatím v seznamu nenašli. Chceš pokračovat jako nový respondent?',
        check_name: "Zkontroluj prosím jméno, nebo ho vyber ze seznamu.",
        load_start_error: "Něco se pokazilo při načítání. Zkus to prosím znovu.",
        grid_title: "Sladkosti",
        voting_as: "Hlasuje:",
        rated_count: "ohodnoceno {voted} z {total}",
        starter_title: "Seznam teprve vzniká",
        starter_text: "Zatím tu je jen pár sladkostí. Napiš ty, které máš nejradši (nebo které nesnášíš), a ostatní je pak taky ohodnotí.",
        search_label: "Hledat nebo přidat sladkost",
        search_placeholder: "Začni psát, třeba Kofila",
        add_button: "➕ Přidat „{gift}“",
        no_match: "Takovou sladkost v seznamu ještě nemáme.",
        partial_match: "Není to žádná z nalezených? Přidej ji.",
        add_error: "Nepodařilo se přidat, zkus to prosím znovu.",
        filter_all: "Vše",
        filter_unvoted: "Nehodnocené",
        grid_hint: "Klepni na smajlíka. Dalším klepnutím na stejného smajlíka hlas vezmeš zpět.",
        all_rated: "Všechny sladkosti máš ohodnocené. Díky! 🎉",
        nothing_found: "Nic nenalezeno.",
        list_empty: "Zatím tu nejsou žádné sladkosti. Přidej první!",
        new_badge: "NOVÁ",
        level_1: "Fuj",
        level_2: "Nic moc",
        level_3: "Ujde",
        level_4: "Dobrá",
        level_5: "Miluju",
        overview_title: "Přehled sladkostí",
        person_select_label: "Odpovědi konkrétního člena rodiny",
        person_select_default: "— Vyber jméno —",
        overview_hint: "Pořadí podle průměrného hodnocení všech hlasujících.",
        overview_empty: "Zatím tu nejsou žádné sladkosti.",
        overview_load_error: "Nepodařilo se načíst přehled. Zkus to prosím znovu.",
        review_back_link: "‹ Zpět na přehled sladkostí",
        responses_for: "Odpovědi: {name}",
        review_empty: "Zatím tu nejsou žádné vyplněné odpovědi.",
        review_load_error: "Nepodařilo se načíst odpovědi. Zkus to prosím znovu.",
        highlights_title: "Zajímavosti",
        top_favorite_heading: "🏆 Nejoblíbenější",
        top_unpopular_heading: "💔 Nejméně oblíbené",
        top_controversial_heading: "⚡ Nejkontroverznější",
        controversial_hint: "Sladkosti, na kterých se rodina nejvíc neshodla.",
        highlights_not_enough: "Zatím není dost hlasů.",
        highlights_load_error: "Nepodařilo se načíst.",
        range_label: "hodnocení od {min} do {max}",
        save_error_prefix: "⚠️ {count} odpověď(i) se nepodařilo uložit.",
        retry_button: "Zkusit znovu",
        saving: "Ukládám…",
        saved: "✓ Uloženo",
        votes_none: "zatím bez hlasů",
        vote_one: "hlas",
        vote_few: "hlasy",
        vote_many: "hlasů"
    },
    sk: {
        home: "← Domov",
        app_title: "Rodinný prieskum sladkostí",
        name_label: "Ako sa voláš?",
        name_placeholder: "Začni písať meno",
        start_button: "Hodnotiť sladkosti",
        loading: "Načítavam…",
        overview_button: "📊 Prehľad sladkostí",
        highlights_button: "🏆 Zaujímavosti",
        name_required: "Vyplň prosím meno.",
        confirm_new_name: 'Meno "{name}" sme zatiaľ v zozname nenašli. Chceš pokračovať ako nový respondent?',
        check_name: "Skontroluj prosím meno, alebo ho vyber zo zoznamu.",
        load_start_error: "Niečo sa pokazilo pri načítaní. Skús to prosím znovu.",
        grid_title: "Sladkosti",
        voting_as: "Hlasuje:",
        rated_count: "ohodnotené {voted} z {total}",
        starter_title: "Zoznam ešte len vzniká",
        starter_text: "Zatiaľ je tu len pár sladkostí. Napíš tie, ktoré máš najradšej (alebo ktoré neznášaš), a ostatní ich potom tiež ohodnotia.",
        search_label: "Hľadať alebo pridať sladkosť",
        search_placeholder: "Začni písať, napríklad Horalky",
        add_button: "➕ Pridať „{gift}“",
        no_match: "Takú sladkosť v zozname ešte nemáme.",
        partial_match: "Nie je to žiadna z nájdených? Pridaj ju.",
        add_error: "Nepodarilo sa pridať, skús to prosím znovu.",
        filter_all: "Všetko",
        filter_unvoted: "Nehodnotené",
        grid_hint: "Ťukni na smajlíka. Ďalším ťuknutím na toho istého smajlíka hlas vezmeš späť.",
        all_rated: "Všetky sladkosti máš ohodnotené. Ďakujeme! 🎉",
        nothing_found: "Nič sa nenašlo.",
        list_empty: "Zatiaľ tu nie sú žiadne sladkosti. Pridaj prvú!",
        new_badge: "NOVÁ",
        level_1: "Fuj",
        level_2: "Nič moc",
        level_3: "Ujde",
        level_4: "Dobrá",
        level_5: "Milujem",
        overview_title: "Prehľad sladkostí",
        person_select_label: "Odpovede konkrétneho člena rodiny",
        person_select_default: "— Vyber meno —",
        overview_hint: "Poradie podľa priemerného hodnotenia všetkých hlasujúcich.",
        overview_empty: "Zatiaľ tu nie sú žiadne sladkosti.",
        overview_load_error: "Nepodarilo sa načítať prehľad. Skús to prosím znovu.",
        review_back_link: "‹ Späť na prehľad sladkostí",
        responses_for: "Odpovede: {name}",
        review_empty: "Zatiaľ tu nie sú žiadne vyplnené odpovede.",
        review_load_error: "Nepodarilo sa načítať odpovede. Skús to prosím znovu.",
        highlights_title: "Zaujímavosti",
        top_favorite_heading: "🏆 Najobľúbenejšie",
        top_unpopular_heading: "💔 Najmenej obľúbené",
        top_controversial_heading: "⚡ Najkontroverznejšie",
        controversial_hint: "Sladkosti, na ktorých sa rodina najviac nezhodla.",
        highlights_not_enough: "Zatiaľ nie je dosť hlasov.",
        highlights_load_error: "Nepodarilo sa načítať.",
        range_label: "hodnotenie od {min} do {max}",
        save_error_prefix: "⚠️ {count} odpoveď(e) sa nepodarilo uložiť.",
        retry_button: "Skúsiť znovu",
        saving: "Ukladám…",
        saved: "✓ Uložené",
        votes_none: "zatiaľ bez hlasov",
        vote_one: "hlas",
        vote_few: "hlasy",
        vote_many: "hlasov"
    },
    fr: {
        home: "← Accueil",
        app_title: "Sondage familial sur les bonbons",
        name_label: "Comment tu t'appelles ?",
        name_placeholder: "Commence à taper ton prénom",
        start_button: "Évaluer les bonbons",
        loading: "Chargement…",
        overview_button: "📊 Aperçu des bonbons",
        highlights_button: "🏆 Points forts",
        name_required: "Indique ton prénom, s'il te plaît.",
        confirm_new_name: 'On n\'a pas trouvé "{name}" dans la liste. Tu veux continuer en tant que nouveau participant ?',
        check_name: "Vérifie ton prénom ou choisis-le dans la liste.",
        load_start_error: "Un problème est survenu pendant le chargement. Réessaie, s'il te plaît.",
        grid_title: "Bonbons",
        voting_as: "Votant :",
        rated_count: "{voted} sur {total} évalués",
        starter_title: "La liste se construit",
        starter_text: "Il n'y a encore que quelques bonbons. Ajoute ceux que tu préfères (ou que tu détestes), et les autres pourront les évaluer aussi.",
        search_label: "Chercher ou ajouter un bonbon",
        search_placeholder: "Commence à taper, par ex. Haribo",
        add_button: "➕ Ajouter « {gift} »",
        no_match: "Ce bonbon n'est pas encore dans la liste.",
        partial_match: "Ce n'est aucun de ceux-ci ? Ajoute-le.",
        add_error: "Impossible d'ajouter, réessaie, s'il te plaît.",
        filter_all: "Tous",
        filter_unvoted: "Non évalués",
        grid_hint: "Touche un smiley. Touche à nouveau le même smiley pour retirer ton vote.",
        all_rated: "Tu as évalué tous les bonbons. Merci ! 🎉",
        nothing_found: "Aucun résultat.",
        list_empty: "Il n'y a pas encore de bonbons. Ajoute le premier !",
        new_badge: "NOUVEAU",
        level_1: "Beurk",
        level_2: "Bof",
        level_3: "Correct",
        level_4: "Bon",
        level_5: "J'adore",
        overview_title: "Aperçu des bonbons",
        person_select_label: "Réponses d'un membre de la famille",
        person_select_default: "— Choisis un prénom —",
        overview_hint: "Classement selon la note moyenne de tous les votants.",
        overview_empty: "Il n'y a pas encore de bonbons.",
        overview_load_error: "Impossible de charger l'aperçu. Réessaie, s'il te plaît.",
        review_back_link: "‹ Retour à l'aperçu des bonbons",
        responses_for: "Réponses : {name}",
        review_empty: "Il n'y a pas encore de réponses.",
        review_load_error: "Impossible de charger les réponses. Réessaie, s'il te plaît.",
        highlights_title: "Points forts",
        top_favorite_heading: "🏆 Les plus appréciés",
        top_unpopular_heading: "💔 Les moins appréciés",
        top_controversial_heading: "⚡ Les plus controversés",
        controversial_hint: "Les bonbons qui divisent le plus la famille.",
        highlights_not_enough: "Pas encore assez de votes.",
        highlights_load_error: "Le chargement a échoué.",
        range_label: "note de {min} à {max}",
        save_error_prefix: "⚠️ {count} réponse(s) non enregistrée(s).",
        retry_button: "Réessayer",
        saving: "Enregistrement…",
        saved: "✓ Enregistré",
        votes_none: "pas encore de vote",
        vote_one: "vote",
        vote_few: "votes",
        vote_many: "votes"
    }
};

// Pět stupňů hodnocení. "score" je hodnota ukládaná do sheetu.
const LEVELS = [
    { score: -10, emoji: "😖", labelKey: "level_1" },
    { score: -5, emoji: "🙁", labelKey: "level_2" },
    { score: 0, emoji: "😐", labelKey: "level_3" },
    { score: 5, emoji: "🙂", labelKey: "level_4" },
    { score: 10, emoji: "😍", labelKey: "level_5" }
];

// Dokud je v seznamu méně sladkostí než tohle, pole pro přidávání se
// zvýrazní výzvou "Seznam teprve vzniká".
const STARTER_THRESHOLD = 10;

function detectLang() {
    const nav = (navigator.language || "cs").toLowerCase();
    if (nav.indexOf("sk") === 0) return "sk";
    if (nav.indexOf("fr") === 0) return "fr";
    return "cs";
}

let lang = readStoredLang() || detectLang();

function readStoredLang() {
    try {
        const stored = localStorage.getItem("giftSurveyLang");
        return I18N[stored] ? stored : null;
    } catch (err) {
        return null;
    }
}

function t(key, vars) {
    const dict = I18N[lang] || I18N.cs;
    let str = dict[key] !== undefined ? dict[key] : (I18N.cs[key] !== undefined ? I18N.cs[key] : key);

    if (vars) {
        Object.keys(vars).forEach(k => {
            str = str.split(`{${k}}`).join(String(vars[k]));
        });
    }

    return str;
}

function localeForLang(l) {
    if (l === "sk") return "sk-SK";
    if (l === "fr") return "fr-FR";
    return "cs-CZ";
}

function formatScore(score) {
    const sign = score > 0 ? "+" : "";
    return sign + score.toLocaleString(localeForLang(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// Smajlík nejbližší danému skóre (-10..10).
function emojiForScore(score) {
    const index = Math.max(0, Math.min(LEVELS.length - 1, Math.round((Number(score) + 10) / 5)));
    return LEVELS[index].emoji;
}

function applyStaticTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = t(el.getAttribute("data-i18n"));
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });

    document.documentElement.lang = lang;
}

function updateLangButtons() {
    document.querySelectorAll(".langBtn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
}

function setLang(newLang) {
    if (lang === newLang) return;

    lang = newLang;
    try {
        localStorage.setItem("giftSurveyLang", lang);
    } catch (err) {
        // Bez localStorage (anonymní okno apod.) se jazyk jen nezapamatuje.
    }

    applyStaticTranslations();
    updateLangButtons();
    updateSaveStatus();
    refreshDynamicScreen();
}

function isVisible(id) {
    return document.getElementById(id).style.display !== "none";
}

// Po přepnutí jazyka je potřeba přenačíst přeložené názvy sladkostí
// v aktuálně otevřené obrazovce (statické popisky se přepnou samy
// přes applyStaticTranslations, ale názvy sladkostí se překládají na
// backendu, takže je nutné je znovu natáhnout).
async function refreshDynamicScreen() {
    if (isVisible("gridScreen")) {
        renderGrid();
        await loadGifts();
        renderGrid();
    } else if (isVisible("overviewScreen")) {
        showOverview();
    } else if (isVisible("highlightsScreen")) {
        showHighlights();
    } else if (isVisible("reviewScreen") && reviewUser) {
        loadReviewFor(reviewUser);
    } else {
        loadGifts();
    }
}

let allGifts = [];
let respondents = [];
let currentUser = "";
let myVotes = new Map();          // gift → score pro currentUser
let addedThisSession = [];        // kanonické názvy, nejnovější první
let searchQuery = "";
let filterMode = "all";           // "all" | "unvoted"
let reviewUser = "";
let reviewData = [];
let reviewVotes = new Map();

function loadGifts() {
    return fetch(`${API}?action=gifts&lang=${lang}`)
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data)) throw new Error(data && data.error ? data.error : "Neplatná odpověď");

            // Sladkosti přidané v téhle session si nechá, i kdyby je backend
            // (např. kvůli cache překladů) ještě nevrátil.
            const known = new Set(data.map(g => g.gift));
            allGifts.forEach(g => {
                if (!known.has(g.gift) && addedThisSession.indexOf(g.gift) >= 0) data.push(g);
            });

            allGifts = data;
            return data;
        })
        .catch(err => {
            console.error("Nepodařilo se načíst seznam sladkostí:", err);
            return allGifts;
        });
}

// Sladkosti se stahují na pozadí hned při otevření appky (souběžně s tím, jak
// si člověk vybírá jméno), aby po kliknutí na "Hodnotit sladkosti" nebylo
// třeba čekat.
const giftsReady = loadGifts();

async function loadRespondents() {

    try {
        const response = await fetch(`${API}?action=respondents`);
        respondents = await response.json();
        respondents.sort((a, b) => a.localeCompare(b, "cs"));

        const list = document.getElementById("respondentList");
        list.innerHTML = "";

        respondents.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            list.appendChild(option);
        });

        const select = document.getElementById("personSelect");
        respondents.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("Nepodařilo se načíst seznam respondentů:", err);
    }
}

/* ---------- Ukládání hlasů na pozadí ---------- */

// Požadavky pro stejnou dvojici jméno+sladkost se posílají za sebou (ne
// souběžně), aby rychlé překlikání mezi smajlíky nedorazilo na backend
// v jiném pořadí a neuložil se starší hlas. Při chybě se uloží jen
// poslední požadavek pro danou dvojici — ten se dá zkusit poslat znovu.
let pendingCount = 0;
const saveChains = {};
const failedSaves = new Map();    // "jméno|sladkost" → payload
let savedFlashTimer = null;
let showSavedFlash = false;

function saveKey(payload) {
    return `${payload.name.toLowerCase()}|${payload.gift}`;
}

function queueSave(payload) {
    const key = saveKey(payload);

    pendingCount++;
    updateSaveStatus();

    const send = () => fetch(API, {
        method: "POST",
        body: JSON.stringify(payload)
    })
        .then(r => r.json())
        .then(result => {
            if (result && result.error) throw new Error(result.error);
            failedSaves.delete(key);
        })
        .catch(err => {
            console.error("Uložení selhalo:", err);
            failedSaves.set(key, payload);
        })
        .finally(() => {
            pendingCount--;
            if (pendingCount === 0 && failedSaves.size === 0) flashSaved();
            updateSaveStatus();
        });

    saveChains[key] = (saveChains[key] || Promise.resolve()).then(send);
    return saveChains[key];
}

function flashSaved() {
    showSavedFlash = true;
    clearTimeout(savedFlashTimer);
    savedFlashTimer = setTimeout(() => {
        showSavedFlash = false;
        updateSaveStatus();
    }, 1500);
}

function updateSaveStatus() {
    const status = document.getElementById("saveStatus");
    if (!status) return;

    status.classList.remove("saveError", "saveOk");

    if (failedSaves.size > 0) {
        status.innerHTML =
            `${escapeHtml(t("save_error_prefix", { count: failedSaves.size }))} ` +
            `<button type="button" onclick="retryFailedSaves()">${escapeHtml(t("retry_button"))}</button>`;
        status.classList.add("saveError");
    } else if (pendingCount > 0) {
        status.textContent = t("saving");
    } else if (showSavedFlash) {
        status.textContent = t("saved");
        status.classList.add("saveOk");
    } else {
        status.textContent = "";
    }
}

function retryFailedSaves() {
    const toRetry = Array.from(failedSaves.values());
    failedSaves.clear();
    updateSaveStatus();
    toRetry.forEach(payload => queueSave(payload));
}

window.addEventListener("beforeunload", (e) => {
    if (failedSaves.size > 0 || pendingCount > 0) {
        e.preventDefault();
        e.returnValue = "";
    }
});

// Nastaví nebo (při klepnutí na už zvolený stupeň) odebere hlas. "votes" je
// mapa gift → score pro daného člověka, kterou volající zobrazuje.
function castVote(name, gift, score, votes) {
    if (votes.get(gift) === score) {
        votes.delete(gift);
        queueSave({ type: "unvote", name: name, gift: gift });
    } else {
        votes.set(gift, score);
        queueSave({ name: name, gift: gift, score: score, comment: "" });
    }
}

/* ---------- Přihlášení ---------- */

function findExistingName(input) {
    const lower = input.trim().toLowerCase();
    return respondents.find(name => name.toLowerCase() === lower) || null;
}

async function startSurvey() {

    const raw = document.getElementById("nameInput").value.trim();
    const message = document.getElementById("loginMessage");
    message.textContent = "";

    if (!raw) {
        message.textContent = t("name_required");
        return;
    }

    const existing = findExistingName(raw);

    if (!existing) {
        const confirmed = confirm(t("confirm_new_name", { name: raw }));

        if (!confirmed) {
            message.textContent = t("check_name");
            return;
        }
    }

    currentUser = existing || raw;

    const startButton = document.getElementById("startButton");
    startButton.disabled = true;
    startButton.textContent = t("loading");

    try {
        // Požadavek na start a sladkosti (pokud ještě nedoběhly z přednačtení)
        // běží souběžně, ne za sebou.
        const [startResult] = await Promise.all([
            fetch(API, {
                method: "POST",
                body: JSON.stringify({ type: "start", name: currentUser })
            }).then(r => r.json()),
            giftsReady
        ]);

        if (startResult.error) throw new Error(startResult.error);

        myVotes = new Map((startResult.votes || []).map(v => [v.gift, Number(v.score)]));

        document.getElementById("loginScreen").style.display = "none";
        document.getElementById("gridScreen").style.display = "block";
        renderGrid();
    } catch (err) {
        console.error(err);
        message.textContent = t("load_start_error");
    } finally {
        startButton.disabled = false;
        startButton.textContent = t("start_button");
    }
}

/* ---------- Seznam sladkostí s hlasováním ---------- */

// Klíč pro porovnání názvů: bez ohledu na velikost písmen, diakritiku
// a vícenásobné mezery (stejně jako matchKey_ v Code.gs).
function matchKey(text) {
    return String(text || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

function giftKeys(item) {
    return [matchKey(item.giftDisplay), matchKey(item.gift)];
}

function sortedGifts() {
    const collator = new Intl.Collator(localeForLang(lang));
    const added = addedThisSession
        .map(gift => allGifts.find(g => g.gift === gift))
        .filter(Boolean);
    const rest = allGifts
        .filter(g => addedThisSession.indexOf(g.gift) < 0)
        .sort((a, b) => collator.compare(a.giftDisplay, b.giftDisplay));
    return added.concat(rest);
}

function onSearchInput() {
    searchQuery = document.getElementById("searchInput").value;
    document.getElementById("addMessage").textContent = "";
    renderGrid();
}

function setFilter(mode) {
    filterMode = mode;
    renderGrid();
}

function renderGrid() {
    const query = matchKey(searchQuery);
    const trimmed = searchQuery.trim();
    const gifts = sortedGifts();

    // Hlavička
    const meta = document.getElementById("gridMeta");
    meta.innerHTML = "";
    meta.append(`${t("voting_as")} `);
    const strong = document.createElement("strong");
    strong.textContent = currentUser;
    meta.append(strong);
    const votedCount = allGifts.filter(g => myVotes.has(g.gift)).length;
    meta.append(` · ${t("rated_count", { voted: votedCount, total: allGifts.length })}`);

    // Zvýraznění na začátku, dokud je sladkostí málo
    const starter = allGifts.length < STARTER_THRESHOLD;
    document.getElementById("searchCard").classList.toggle("starter", starter);
    document.getElementById("starterIntro").style.display = starter ? "block" : "none";

    // Filtrování
    let visible = gifts;
    if (query) visible = visible.filter(g => giftKeys(g).some(k => k.indexOf(query) >= 0));
    if (filterMode === "unvoted") visible = visible.filter(g => !myVotes.has(g.gift));

    // Přidání nové sladkosti — jen když žádná existující nesedí přesně
    const exact = query && allGifts.some(g => giftKeys(g).indexOf(query) >= 0);
    const showAdd = trimmed.length > 0 && !exact;
    document.getElementById("addArea").style.display = showAdd ? "block" : "none";
    if (showAdd) {
        const matchesAny = gifts.some(g => giftKeys(g).some(k => k.indexOf(query) >= 0));
        document.getElementById("addHint").textContent = matchesAny ? t("partial_match") : t("no_match");
        document.getElementById("addButton").textContent = t("add_button", { gift: trimmed });
    }

    // Filtr
    document.getElementById("filterAll").classList.toggle("active", filterMode === "all");
    document.getElementById("filterAll").setAttribute("aria-pressed", String(filterMode === "all"));
    document.getElementById("filterUnvoted").classList.toggle("active", filterMode === "unvoted");
    document.getElementById("filterUnvoted").setAttribute("aria-pressed", String(filterMode === "unvoted"));

    // Prázdný výsledek
    const empty = document.getElementById("gridEmpty");
    let emptyText = "";
    if (visible.length === 0 && !showAdd) {
        if (allGifts.length === 0) emptyText = t("list_empty");
        else if (filterMode === "unvoted" && !query) emptyText = t("all_rated");
        else emptyText = t("nothing_found");
    }
    empty.textContent = emptyText;
    empty.style.display = emptyText ? "block" : "none";

    // Dlaždice
    const list = document.getElementById("candyList");
    list.innerHTML = "";
    visible.forEach(item => {
        list.appendChild(createCandyTile(item, myVotes, currentUser, {
            isNew: addedThisSession.indexOf(item.gift) >= 0,
            onChange: updateGridMeta
        }));
    });
}

function updateGridMeta() {
    const meta = document.getElementById("gridMeta");
    const votedCount = allGifts.filter(g => myVotes.has(g.gift)).length;
    meta.lastChild.textContent = ` · ${t("rated_count", { voted: votedCount, total: allGifts.length })}`;
}

// Jedna dlaždice: název + pět smajlíků. Po klepnutí se aktualizuje jen
// tahle dlaždice (seznam se nepřekresluje), takže i ve filtru
// "Nehodnocené" zůstane na místě a hlas jde hned vzít zpět.
function createCandyTile(item, votes, voterName, options) {
    const tile = document.createElement("div");
    tile.className = "candyTile";

    const head = document.createElement("div");
    head.className = "candyHead";

    const name = document.createElement("div");
    name.className = "candyName";
    name.textContent = item.giftDisplay;
    name.title = item.giftDisplay;
    head.appendChild(name);

    if (options && options.isNew) {
        const badge = document.createElement("span");
        badge.className = "newBadge";
        badge.textContent = t("new_badge");
        head.appendChild(badge);
    }

    tile.appendChild(head);

    const levels = document.createElement("div");
    levels.className = "levels";
    levels.setAttribute("role", "group");
    levels.setAttribute("aria-label", item.giftDisplay);

    const buttons = LEVELS.map(level => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "levelBtn";
        btn.textContent = level.emoji;
        btn.setAttribute("aria-label", t(level.labelKey));
        btn.title = t(level.labelKey);
        btn.addEventListener("click", () => {
            castVote(voterName, item.gift, level.score, votes);
            refresh();
            if (options && options.onChange) options.onChange();
        });
        levels.appendChild(btn);
        return { btn: btn, score: level.score };
    });

    function refresh() {
        const current = votes.has(item.gift) ? votes.get(item.gift) : null;
        // Hlas mimo pět stupňů (starší data) se vyznačí u nejbližšího smajlíka.
        const shown = current === null ? null : LEVELS[Math.max(0, Math.min(4, Math.round((current + 10) / 5)))].score;
        tile.classList.toggle("voted", current !== null);
        buttons.forEach(b => {
            const selected = b.score === shown;
            b.btn.classList.toggle("selected", selected);
            b.btn.setAttribute("aria-pressed", String(selected));
        });
    }

    tile.appendChild(levels);
    refresh();
    return tile;
}

async function addCandy() {
    const input = document.getElementById("searchInput");
    const text = input.value.trim().replace(/\s+/g, " ");
    const message = document.getElementById("addMessage");
    const button = document.getElementById("addButton");

    if (!text) return;

    button.disabled = true;
    message.textContent = "";

    try {
        const response = await fetch(API, {
            method: "POST",
            body: JSON.stringify({ type: "addgift", gift: text, lang: lang })
        }).then(r => r.json());

        if (response.error) throw new Error(response.error);

        const gift = response.gift || text;

        if (!allGifts.some(g => g.gift === gift)) {
            allGifts.push({ gift: gift, giftDisplay: gift });
        }
        if (!response.existed && addedThisSession.indexOf(gift) < 0) {
            addedThisSession.unshift(gift);
        }

        input.value = "";
        searchQuery = "";
        filterMode = "all";
        renderGrid();
    } catch (err) {
        console.error(err);
        message.textContent = t("add_error");
    } finally {
        button.disabled = false;
    }
}

/* ---------- Přehled ---------- */

// Přehled sladkostí seřazený podle popularity napříč všemi hlasujícími —
// nevyžaduje zadání jména, jde na něj rovnou z úvodní obrazovky.
async function showOverview() {

    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("reviewScreen").style.display = "none";
    document.getElementById("overviewScreen").style.display = "block";

    const container = document.getElementById("overviewList");
    container.innerHTML = `<p class="hint">${t("loading")}</p>`;

    try {
        const response = await fetch(`${API}?action=giftstats&lang=${lang}`);
        const stats = await response.json();
        if (!Array.isArray(stats)) throw new Error(stats && stats.error);
        renderOverview(stats);
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="message">${t("overview_load_error")}</p>`;
    }
}

function voteCountLabel(count) {
    if (count === 0) return t("votes_none");
    if (count === 1) return `1 ${t("vote_one")}`;
    if (count <= 4) return `${count} ${t("vote_few")}`;
    return `${count} ${t("vote_many")}`;
}

function scoreColor(score) {
    return score > 0 ? "var(--positive)" : score < 0 ? "var(--negative)" : "var(--neutral)";
}

function renderOverview(stats) {

    const container = document.getElementById("overviewList");
    container.innerHTML = "";

    if (stats.length === 0) {
        container.innerHTML = `<p>${t("overview_empty")}</p>`;
        return;
    }

    stats.forEach(item => {
        const row = document.createElement("div");
        row.className = "reviewItem";

        const hasVotes = item.voteCount > 0;
        const color = hasVotes ? scoreColor(item.avgScore) : "var(--neutral)";
        const scoreText = hasVotes ? `${emojiForScore(item.avgScore)} ${formatScore(item.avgScore)}` : "—";

        row.innerHTML =
            `<div class="reviewGift">${escapeHtml(item.giftDisplay)}</div>` +
            `<div class="reviewScore" style="color:${color}">${scoreText}</div>` +
            `<div class="hint" style="margin-top:2px;text-align:left;">${voteCountLabel(item.voteCount)}</div>`;

        container.appendChild(row);
    });
}

/* ---------- Odpovědi konkrétního člověka ---------- */

// Zobrazí hlasy konkrétního člověka (vybraného v přehledu) a umožní je
// změnit nebo odebrat — stejnými smajlíky jako v hlavním seznamu.
async function loadReviewFor(name) {

    reviewUser = name;

    const container = document.getElementById("reviewList");
    document.getElementById("reviewTitle").textContent = t("responses_for", { name: name });
    container.innerHTML = `<p class="hint">${t("loading")}</p>`;

    try {
        const response = await fetch(`${API}?action=myresponses&name=${encodeURIComponent(name)}&lang=${lang}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error(data && data.error);

        reviewData = data.sort((a, b) => b.score - a.score);
        reviewVotes = new Map(reviewData.map(item => [item.gift, Number(item.score)]));
        renderReview();
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="message">${t("review_load_error")}</p>`;
    }
}

function renderReview() {
    const container = document.getElementById("reviewList");
    container.innerHTML = "";

    if (reviewData.length === 0) {
        container.innerHTML = `<p>${t("review_empty")}</p>`;
        return;
    }

    reviewData.forEach(item => {
        container.appendChild(createCandyTile(item, reviewVotes, reviewUser));
    });
}

async function onPersonSelected() {

    const select = document.getElementById("personSelect");
    const name = select.value;
    if (!name) return;

    select.value = "";

    document.getElementById("overviewScreen").style.display = "none";
    document.getElementById("reviewScreen").style.display = "block";

    await loadReviewFor(name);
}

/* ---------- Zajímavosti ---------- */

async function showHighlights() {

    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("highlightsScreen").style.display = "block";

    const listIds = ["topFavoriteList", "topUnpopularList", "topControversialList"];
    listIds.forEach(id => {
        document.getElementById(id).innerHTML = `<p class="hint">${t("loading")}</p>`;
    });

    try {
        const response = await fetch(`${API}?action=highlights&lang=${lang}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        renderHighlightList("topFavoriteList", data.topFavorite, item =>
            `${emojiForScore(item.avgScore)} ${formatScore(item.avgScore)} · ${voteCountLabel(item.voteCount)}`);

        renderHighlightList("topUnpopularList", data.topUnpopular, item =>
            `${emojiForScore(item.avgScore)} ${formatScore(item.avgScore)} · ${voteCountLabel(item.voteCount)}`);

        renderHighlightList("topControversialList", data.topControversial, item =>
            `${t("range_label", { min: emojiForScore(item.min), max: emojiForScore(item.max) })} · ${voteCountLabel(item.voteCount)}`);
    } catch (err) {
        console.error(err);
        listIds.forEach(id => {
            document.getElementById(id).innerHTML = `<p class="message">${t("highlights_load_error")}</p>`;
        });
    }
}

function renderHighlightList(containerId, items, subtitleFn) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (!items || items.length === 0) {
        container.innerHTML = `<p class="hint">${t("highlights_not_enough")}</p>`;
        return;
    }

    items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "highlightRow";

        row.innerHTML =
            `<span class="highlightRank">${index + 1}.</span>` +
            `<div class="highlightBody">` +
                `<div class="highlightGift">${escapeHtml(item.giftDisplay)}</div>` +
                `<div class="hint" style="margin-top:2px;text-align:left;">${escapeHtml(subtitleFn(item))}</div>` +
                renderDistribution(item.histogram) +
            `</div>`;

        container.appendChild(row);
    });
}

// Vizualizace rozmístění hlasů na škále -10..+10 — puntík na místě dané
// hodnoty, velikost puntíku podle toho, kolik lidí zrovna tolik dalo.
function renderDistribution(histogram) {
    if (!histogram || histogram.length === 0) return "";

    const maxCount = Math.max(...histogram.map(h => h.count));
    const minSize = 8;
    const maxSize = 22;

    const dots = histogram.map(h => {
        const fraction = (h.score + 10) / 20;
        const size = minSize + (h.count / maxCount) * (maxSize - minSize);
        const radius = size / 2;
        // Odsazeno o poloměr tečky, ať se u krajních hodnot (-10/+10)
        // vejde celá dovnitř pásu místo přesahu za okraj.
        const left = `calc(${radius}px + ${fraction} * (100% - ${size}px))`;
        const label = emojiForScore(h.score);
        const names = (h.names || []).join(", ");

        // title = nápověda při hoveru na počítači; klepnutí (showDotInfo)
        // ukáže bublinu se jmény i na mobilu, kde hover nefunguje.
        return `<div class="distDot" style="left:${left}; width:${size}px; height:${size}px;" ` +
            `title="${escapeAttr(`${label}: ${voteCountLabel(h.count)}`)}" ` +
            `data-label="${escapeAttr(label)}" data-names="${escapeAttr(names)}" ` +
            `onclick="showDotInfo(this, event)"></div>`;
    }).join("");

    return `<div class="distStrip">${dots}</div>`;
}

// Klepnutí na tečku ukáže/skryje bublinu se jmény hlasujících, kteří dali
// sladkosti danou hodnotu — funguje i na mobilu, kde nativní title (hover)
// nefunguje spolehlivě.
function showDotInfo(dot, event) {
    event.stopPropagation();

    const wasOpen = dot.dataset.open === "true";
    closeAllDotPopups();
    if (wasOpen) return;

    const names = dot.getAttribute("data-names");
    const label = dot.getAttribute("data-label");

    const popup = document.createElement("div");
    popup.className = "distPopup";
    popup.style.left = dot.style.left;
    popup.textContent = names ? `${label} ${names}` : label;

    dot.parentElement.appendChild(popup);
    dot.dataset.open = "true";
}

function closeAllDotPopups() {
    document.querySelectorAll(".distPopup").forEach(p => p.remove());
    document.querySelectorAll(".distDot").forEach(d => { d.dataset.open = "false"; });
}

document.addEventListener("click", closeAllDotPopups);

/* ---------- Pomocné ---------- */

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
}

document.getElementById("searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.getElementById("addArea").style.display !== "none") {
        e.preventDefault();
        addCandy();
    }
});

applyStaticTranslations();
updateLangButtons();
loadRespondents();
