const CONFIG = {
  titlePlaceholder: "Brain Rush",
  tileCount: 60,
  turnDelay: 850,
  reactionNoticeMs: 2500,
  skillChoiceMs: 2500,
  questionSeconds: 15,
  aiRates: {
    friendly: { easy: .72, medium: .58, hard: .42, epic: .28 },
    normal: { easy: .90, medium: .75, hard: .55, epic: .35 },
    clever: { easy: .96, medium: .87, hard: .70, epic: .50 }
  }
};

const categories = ["famous", "math", "general", "movie", "logic"];
const categoryNames = { famous: "Famous & Important", math: "Mathematics", general: "General Knowledge", movie: "Guess the Movie", logic: "Logic & Riddles" };
const skillDeck = [
  "shield", "push", "rainbow", "switch", "double",
  "shield", "push", "rainbow", "switch", "double",
  "shield", "push", "rainbow", "switch", "double",
  "shield", "push", "rainbow", "switch", "double"
];
let skills = {};
const skillInfo = {
  shield: ["assets/shield.png", "Shield", "Automatically pocketed and ready! Blocks the next wrong-answer bounce, slide, hostile skill, or challenge penalty. One Shield at a time."],
  push: ["assets/push-back.png", "Push Back", "Choose a rival and send them back two spaces."],
  rainbow: ["assets/rainbow.png", "Prismatic Rainbow", "Choose the category for this question immediately."],
  switch: ["assets/switch.png", "Switch", "Trade board positions with one opponent."],
  double: ["assets/double-roll.png", "Double Roll", "Roll both paper dice one more time this turn."]
};
const characters = [
  { file: "assets/character-1.png", name: "Poppy", personality: "Brave little daydreamer" },
  { file: "assets/character-2-boba-complete.png", name: "Boba", personality: "Bouncy question collector" },
  { file: "assets/character-3.png", name: "Nori", personality: "Cool under quiz pressure" },
  { file: "assets/character-4.png", name: "Pip", personality: "Quiet puzzle detective" },
  { file: "assets/character-5-fox.png", name: "Fizzle", personality: "Cheeky shortcut seeker" },
  { file: "assets/character-6-frog.png", name: "Sprig", personality: "Gentle fact collector" },
  { file: "assets/character-7-rainbow.png", name: "Prism", personality: "Giggly color chaser" },
  { file: "assets/character-8-cat.png", name: "Miso", personality: "Secretly very competitive" }
];
const avatarFiles = characters.map(character => character.file);
const ladders = { 4: 16, 12: 28, 25: 43, 39: 54 };
const snakes = { 58: 44, 49: 33, 37: 20, 29: 11 };

const questions = {
  famous: {
    easy: [
      ["Who painted the Mona Lisa?", ["Leonardo da Vinci", "Pablo Picasso", "Vincent van Gogh", "Claude Monet"], 0],
      ["Who was famous for the theory of relativity?", ["Albert Einstein", "Isaac Newton", "Marie Curie", "Charles Darwin"], 0]
    ],
    medium: [
      ["Who wrote Romeo and Juliet?", ["William Shakespeare", "Jane Austen", "Mark Twain", "Charles Dickens"], 0],
      ["Who was the first person to walk on the Moon?", ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "John Glenn"], 0]
    ],
    hard: [
      ["Which scientist discovered penicillin?", ["Alexander Fleming", "Louis Pasteur", "Gregor Mendel", "Niels Bohr"], 0],
      ["Who composed The Four Seasons?", ["Antonio Vivaldi", "Mozart", "Bach", "Beethoven"], 0]
    ],
    epic: [
      ["Who developed the first successful polio vaccine?", ["Jonas Salk", "Robert Koch", "Edward Jenner", "Joseph Lister"], 0],
      ["Who wrote The Second Sex?", ["Simone de Beauvoir", "Virginia Woolf", "Hannah Arendt", "George Sand"], 0]
    ]
  },
  math: {
    easy: [["What is 7 + 8?", ["15", "14", "16", "13"], 0], ["What is 6 × 4?", ["24", "20", "28", "18"], 0]],
    medium: [["What is 3/4 as a percentage?", ["75%", "50%", "80%", "25%"], 0], ["What is 12²?", ["144", "124", "24", "122"], 0]],
    hard: [["Solve: 3x + 5 = 20", ["x = 5", "x = 4", "x = 6", "x = 3"], 0], ["What is √196?", ["14", "13", "16", "12"], 0]],
    epic: [["What is 15% of 360?", ["54", "45", "60", "48"], 0], ["What is 2⁵ × 2²?", ["128", "64", "32", "256"], 0]]
  },
  general: {
    easy: [["Which planet is known as the Red Planet?", ["Mars", "Venus", "Jupiter", "Mercury"], 0], ["How many continents are there?", ["7", "6", "8", "5"], 0]],
    medium: [["What is the capital of Canada?", ["Ottawa", "Toronto", "Vancouver", "Montreal"], 0], ["Which is the largest ocean?", ["Pacific", "Atlantic", "Indian", "Arctic"], 0]],
    hard: [["Which element has the symbol W?", ["Tungsten", "Tin", "Titanium", "Tellurium"], 0], ["What is the smallest country by area?", ["Vatican City", "Monaco", "Nauru", "Malta"], 0]],
    epic: [["Which treaty ended World War I?", ["Treaty of Versailles", "Treaty of Paris", "Treaty of Rome", "Treaty of Utrecht"], 0], ["What is the deepest ocean trench?", ["Mariana Trench", "Tonga Trench", "Java Trench", "Puerto Rico Trench"], 0], ["Which element has atomic number 79?", ["Gold", "Silver", "Copper", "Platinum"], 0]]
  },
  movie: {
    easy: [["🦁👑", ["The Lion King", "Madagascar", "Jungle Book", "Zootopia"], 0], ["❄️👸⛄", ["Frozen", "Moana", "Brave", "Cinderella"], 0]],
    medium: [["🎈🏠☁️", ["Up", "Home", "Inside Out", "Soul"], 0], ["🐀👨‍🍳🇫🇷", ["Ratatouille", "Chef", "Bolt", "Flushed Away"], 0]],
    hard: [["🌀💤🏙️", ["Inception", "Interstellar", "Tenet", "The Matrix"], 0], ["🏨🔑🚪", ["The Grand Budapest Hotel", "Home Alone", "Psycho", "The Shining"], 0]],
    epic: [["👁️⌛🚀🌽", ["Interstellar", "Arrival", "Gravity", "Moon"], 0], ["🛢️⛏️🥛", ["There Will Be Blood", "Gold", "The Founder", "No Country for Old Men"], 0]]
  },
  logic: {
    easy: [["What has hands but cannot clap?", ["A clock", "A doll", "A statue", "A tree"], 0], ["What gets wetter as it dries?", ["A towel", "A sponge", "Rain", "Soap"], 0]],
    medium: [["If you overtake second place, what place are you in?", ["Second", "First", "Third", "Last"], 0], ["What has many keys but opens no locks?", ["A piano", "A map", "A diary", "A keyboard lock"], 0]],
    hard: [["I speak without a mouth and hear without ears. What am I?", ["An echo", "A radio", "The wind", "A shadow"], 0], ["Which number comes next: 2, 6, 12, 20, 30?", ["42", "36", "40", "44"], 0]],
    epic: [["A farmer has 17 sheep. All but 9 run away. How many remain?", ["9", "8", "17", "0"], 0], ["What is next: 1, 11, 21, 1211, 111221?", ["312211", "122111", "311221", "111321"], 0]]
  }
};

const additionalQuestionBank = window.ADDITIONAL_QUESTIONS || {};

function preparedQuestionOptions(record) {
  const { category, answer, number } = record;
  const authoredDistractors = window.LEGACY_DISTRACTORS?.[category]?.[number - 1];
  if (authoredDistractors) return shuffle([answer, ...authoredDistractors]);
  if (category === "math") {
    if (answer === "1/2") return shuffle(["1/2", "1/3", "1/4", "2/3"]);
    const match = answer.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
    if (match) {
      const value = Number(match[1]), unit = match[2];
      const steps = value <= 100 ? [1, -1, 2, -2, 3, -3, 4, -4] : [1, -1, 5, -5, 10, -10, 20];
      const options = [answer];
      for (const step of shuffle(steps)) {
        const other = value + step;
        const choice = `${other}${unit}`;
        if (other >= 0 && !options.includes(choice)) options.push(choice);
        if (options.length === 4) break;
      }
      if (options.length === 4) return shuffle(options);
    }
  }
  throw new Error(`No sensible answer choices for ${category} question ${number}`);
}

function buildPreparedQuestionBank(raw) {
  const sectionMap = { Red: "famous", Yellow: "math", Green: "general", Blue: "movie", Purple: "logic" };
  const lines = String(raw || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const records = [];
  let category = null;
  for (let i = 0; i < lines.length;) {
    const section = lines[i].match(/^(Red|Yellow|Green|Blue|Purple):/);
    if (section) { category = sectionMap[section[1]]; i++; continue; }
    const difficulty = lines[i + 1]?.toLowerCase();
    if (/^\d+$/.test(lines[i]) && ["easy", "medium", "hard", "epic"].includes(difficulty)) {
      const number = Number(lines[i]);
      let question = lines[i + 2];
      if (category === "famous" && number === 16) question = "Which Paris landmark is an iron tower built for the 1889 World's Fair?";
      if (category === "famous" && number === 22) question = "Which white marble mausoleum in Agra was built by Shah Jahan?";
      records.push({ category, difficulty, number, question, answer: lines[i + 3] });
      i += 4;
      continue;
    }
    i++;
  }

  const bank = Object.fromEntries(categories.map(cat => [cat, { easy: [], medium: [], hard: [], epic: [] }]));
  records.forEach(record => {
    if (!record.category || !record.question || !record.answer) return;
    const options = preparedQuestionOptions(record);
    if (options.length !== 4) return;
    bank[record.category][record.difficulty].push([record.question, options, options.indexOf(record.answer)]);
  });
  return bank;
}

const preparedQuestionBank = buildPreparedQuestionBank(window.PREPARED_QUESTIONS_RAW);
const backupQuestions = Object.fromEntries(categories.map(category => [category, Object.fromEntries(
  ["easy", "medium", "hard", "epic"].map(difficulty => [difficulty, [...questions[category][difficulty]]])
)]));
const seenQuestionPrompts = new Set();
categories.forEach(category => {
  ["easy", "medium", "hard", "epic"].forEach(difficulty => {
    questions[category][difficulty] = [...(additionalQuestionBank[category]?.[difficulty] || []), ...preparedQuestionBank[category][difficulty]].filter(card => {
      const prompt = card[0].trim().toLowerCase();
      if (seenQuestionPrompts.has(prompt)) return false;
      seenQuestionPrompts.add(prompt);
      return true;
    });
  });
});
categories.forEach(category => {
  ["easy", "medium", "hard", "epic"].forEach(difficulty => {
    const backups = backupQuestions[category][difficulty].filter(card => {
      const prompt = card[0].trim().toLowerCase();
      if (seenQuestionPrompts.has(prompt)) return false;
      seenQuestionPrompts.add(prompt);
      return true;
    });
    questions[category][difficulty].push(...backups);
  });
});

function freshSetupPlayers() {
  return [
    { name: "", human: true, avatar: 0, aiDifficulty: "normal" },
    { name: "", human: false, avatar: 1, aiDifficulty: "normal" }
  ];
}

const state = {
  players: [], current: 0, running: false, busy: false,
  setupPlayers: freshSetupPlayers(),
  doubleUsed: false, bonusRollPending: false, rollsThisTurn: 0,
  winners: [], timer: null, movingIndex: null, usingStored: false,
  boardCategories: {}, questionDecks: {}, pendingTimeouts: new Set(), soundEnabled: true,
  gameVersion: 0, modalVersion: 0, modalTimeouts: new Set()
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const schedule = (callback, ms) => {
  const version = state.gameVersion;
  const id = setTimeout(() => { state.pendingTimeouts.delete(id); if (version === state.gameVersion) callback(); }, ms);
  state.pendingTimeouts.add(id);
  return id;
};
const delay = ms => new Promise(resolve => schedule(resolve, ms));
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));

function clearScheduledActions() {
  state.pendingTimeouts.forEach(id => clearTimeout(id));
  state.pendingTimeouts.clear();
  state.modalTimeouts.clear();
}

function clearModalActions() {
  state.modalTimeouts.forEach(id => { clearTimeout(id); state.pendingTimeouts.delete(id); });
  state.modalTimeouts.clear();
}

function scheduleModal(callback, ms) {
  const version = state.modalVersion;
  const id = schedule(() => {
    state.modalTimeouts.delete(id);
    if (version === state.modalVersion && $("#modal").classList.contains("show")) callback();
  }, ms);
  state.modalTimeouts.add(id);
  return id;
}

function modalAction(callback) {
  const version = state.modalVersion;
  let finished = false;
  return (...args) => {
    if (finished || version !== state.modalVersion || !$("#modal").classList.contains("show")) return;
    finished = true;
    callback(...args);
  };
}

function showScreen(id) {
  $$(".screen").forEach(s => s.classList.toggle("active", s.id === id));
}

let modalReturnFocus = null;

function openModal() {
  clearInterval(state.timer); state.timer = null;
  clearModalActions();
  state.modalVersion++;
  if (!$("#modal").classList.contains("show")) modalReturnFocus = document.activeElement;
  $("#modal-card").scrollTop = 0;
  $("#modal").classList.add("show");
  $("#modal").setAttribute("aria-hidden", "false");
  $("#app").inert = true;
  $("#modal-card").focus?.({ preventScroll: true });
  updateGameActions();
}

function showModal(html) {
  $("#modal-card").innerHTML = html;
  openModal();
}

function closeModal() {
  clearInterval(state.timer); state.timer = null;
  clearModalActions();
  state.modalVersion++;
  $("#modal").classList.remove("show");
  $("#modal").setAttribute("aria-hidden", "true");
  $("#app").inert = false;
  if (modalReturnFocus?.isConnected) modalReturnFocus.focus?.({ preventScroll: true });
  modalReturnFocus = null;
  updateGameActions();
}

function canOpenGameMenu() {
  return state.running && !state.busy && state.players[state.current]?.human && !$("#modal").classList.contains("show");
}

function updateGameActions() {
  const available = canOpenGameMenu();
  $("#roll-btn").disabled = !available;
  $("#pause-btn").disabled = !available;
  $("#rules-btn").disabled = !available;
  const hint = available ? "" : "Available before rolling on a human turn";
  $("#pause-btn").title = hint || "Pause game";
  $("#rules-btn").title = hint || "How to play";
}

function getTitle() {
  return $("#editable-title").textContent.replace(/\s+/g, " ").trim() || CONFIG.titlePlaceholder;
}

function renderSetupPlayers() {
  const root = $("#setup-players");
  root.innerHTML = state.setupPlayers.map((p, i) => `
    <div class="setup-player-row" data-setup-index="${i}">
      <span class="setup-number">${i + 1}</span>
      <button class="setup-player-avatar" data-pick-avatar="${i}" title="Choose character: ${escapeHtml(characters[p.avatar].name)}"><img src="${avatarFiles[p.avatar]}" alt="${escapeHtml(characters[p.avatar].name)}"><span>CHOOSE</span></button>
      <input value="${escapeHtml(p.name)}" placeholder="${p.human ? `Player ${i + 1} name` : "AI name (optional)"}" maxlength="14" data-player-name="${i}" aria-label="Player ${i + 1} name">
      <div class="setup-kind-controls"><select class="player-type" data-player-type="${i}" aria-label="Player ${i + 1} type">
        <option value="human" ${p.human ? "selected" : ""}>HUMAN</option>
        <option value="ai" ${p.human ? "" : "selected"}>AI</option>
      </select>${p.human ? `<span class="local-player-note">LOCAL</span>` : `<select class="ai-difficulty" data-ai-difficulty="${i}" aria-label="${escapeHtml(p.name || `AI ${i + 1}`)} difficulty"><option value="friendly" ${p.aiDifficulty === "friendly" ? "selected" : ""}>FRIENDLY</option><option value="normal" ${!p.aiDifficulty || p.aiDifficulty === "normal" ? "selected" : ""}>NORMAL</option><option value="clever" ${p.aiDifficulty === "clever" ? "selected" : ""}>CLEVER</option></select>`}</div>
      <button class="remove-player" data-remove-player="${i}" ${state.setupPlayers.length <= 2 ? "disabled" : ""} aria-label="Remove player">×</button>
    </div>`).join("");
  $$('[data-player-name]').forEach(el => el.oninput = () => state.setupPlayers[Number(el.dataset.playerName)].name = el.value);
  $$('[data-player-type]').forEach(el => el.onchange = () => { const player = state.setupPlayers[Number(el.dataset.playerType)]; player.human = el.value === "human"; player.aiDifficulty ||= "normal"; renderSetupPlayers(); });
  $$('[data-ai-difficulty]').forEach(el => el.onchange = () => { state.setupPlayers[Number(el.dataset.aiDifficulty)].aiDifficulty = el.value; });
  $$('[data-pick-avatar]').forEach(el => el.onclick = () => openCharacterPicker(Number(el.dataset.pickAvatar)));
  $$('[data-remove-player]').forEach(el => el.onclick = () => { if (state.setupPlayers.length > 2) { state.setupPlayers.splice(Number(el.dataset.removePlayer), 1); renderSetupPlayers(); } });
  $("#add-player-btn").disabled = state.setupPlayers.length >= 4;
  validateSetup();
}

function validateSetup() {
  const enoughPlayers = state.setupPlayers.length >= 2;
  const hasHuman = state.setupPlayers.some(player => player.human);
  const message = !enoughPlayers ? "Add at least 2 players to begin." : !hasHuman ? "One curious human is required on this shared device." : "";
  $("#setup-error").textContent = message;
  $("#start-btn").disabled = Boolean(message);
  return !message;
}

function openCharacterPicker(playerIndex) {
  const player = state.setupPlayers[playerIndex];
  let pendingAvatar = player.avatar;
  const renderPicker = () => {
    showModal(`<button class="picker-close" id="close-picker" aria-label="Close character picker">×</button><div class="eyebrow">Player ${playerIndex + 1}</div><h2>Choose a character</h2><p class="picker-help">Pick a little thinker, then click OKAY to confirm.</p><div class="character-picker">${characters.map((character, avatarIndex) => `<button class="character-choice-card ${avatarIndex === pendingAvatar ? "selected" : ""}" data-avatar-choice="${avatarIndex}" aria-pressed="${avatarIndex === pendingAvatar}" aria-label="${escapeHtml(character.name)}"><img src="${character.file}" alt=""><strong>${escapeHtml(character.name)}</strong>${avatarIndex === pendingAvatar ? "<b>✓ READY</b>" : ""}</button>`).join("")}</div><button class="chunky primary picker-confirm" id="confirm-picker">OKAY</button>`);
    $$('[data-avatar-choice]').forEach(button => button.onclick = () => {
      pendingAvatar = Number(button.dataset.avatarChoice);
      renderPicker();
    });
    $("#confirm-picker").onclick = () => {
      player.avatar = pendingAvatar;
      closeModal();
      renderSetupPlayers();
    };
    $("#close-picker").onclick = closeModal;
  };
  renderPicker();
}

function addSetupPlayer(human) {
  if (state.setupPlayers.length >= 4) return;
  const i = state.setupPlayers.length;
  state.setupPlayers.push({ name: "", human, avatar: i % avatarFiles.length, aiDifficulty: "normal" });
  renderSetupPlayers();
}

function startGame() {
  if (!validateSetup()) return;
  state.gameVersion++;
  clearScheduledActions();
  closeModal();
  state.players = state.setupPlayers.map((p, i) => ({
    name: p.name.trim() || (p.human ? `Player ${i + 1}` : `AI ${i + 1}`),
    avatar: p.avatar, pos: 0, previous: 0, snakeFall: null, shield: false, human: p.human, aiDifficulty: p.aiDifficulty || "normal", finished: false, inventory: []
  }));
  state.current = 0; state.running = true; state.busy = false; state.doubleUsed = false;
  state.bonusRollPending = false; state.rollsThisTurn = 0; state.winners = []; state.movingIndex = null; state.usingStored = false;
  $("#game-title-small").textContent = getTitle();
  randomizeBoard();
  resetQuestionDecks();
  if (state.soundEnabled) ensureAudio();
  buildBoard(); render(); showScreen("game-screen"); beginTurn();
}

function resetGame() {
  state.gameVersion++;
  state.running = false;
  state.busy = false;
  clearInterval(state.timer); state.timer = null;
  clearScheduledActions();
  closeModal();
  state.players = [];
  state.current = 0;
  state.winners = [];
  state.movingIndex = null;
  state.doubleUsed = false;
  state.bonusRollPending = false;
  state.rollsThisTurn = 0;
  state.usingStored = false;
  state.boardCategories = {};
  state.questionDecks = {};
  state.setupPlayers = freshSetupPlayers();
  skills = {};
  stopAudio();
  $("#player-list").innerHTML = "";
  $("#skill-tray").innerHTML = "";
  $("#board").innerHTML = "";
  $("#routes-overlay").innerHTML = "";
  $(".slide-rider")?.remove?.();
  $("#flying-dice").classList.remove("show");
  $("#die-one").classList.remove("rolling"); $("#die-two").classList.remove("rolling");
  $("#turn-label").textContent = "";
  $("#die-one").textContent = "?"; $("#die-two").textContent = "?";
  $("#roll-total").textContent = "Ready?";
  $("#event-log").textContent = "Reach the finish before the other thinkers!";
  renderSetupPlayers();
  showScreen("menu-screen");
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function randomizeBoard() {
  const categoryDeck = shuffle(Array.from({ length: CONFIG.tileCount }, (_, i) => categories[i % categories.length]));
  state.boardCategories = Object.fromEntries(categoryDeck.map((category, i) => [i + 1, category]));

  const routeTiles = new Set([
    1, CONFIG.tileCount,
    ...Object.keys(ladders).map(Number), ...Object.values(ladders),
    ...Object.keys(snakes).map(Number), ...Object.values(snakes)
  ]);
  const availableTiles = shuffle(Array.from({ length: CONFIG.tileCount - 1 }, (_, i) => i + 1).filter(tile => !routeTiles.has(tile)));
  skills = Object.fromEntries(skillDeck.map((skill, i) => [availableTiles[i], skill]));
}

function tileDifficulty(pos) {
  if (pos <= 15) return "easy";
  if (pos <= 30) return "medium";
  if (pos <= 45) return "hard";
  return "epic";
}

function tileCategory(pos) { return state.boardCategories[pos] || categories[(pos - 1) % categories.length]; }

function boardPlacement(pos) {
  const index = pos - 1;
  const rowFromBottom = Math.floor(index / 10);
  const within = index % 10;
  const col = rowFromBottom % 2 === 0 ? within + 1 : 10 - within;
  return { row: 6 - rowFromBottom, col };
}

function buildBoard() {
  const board = $("#board"); board.innerHTML = "";
  for (let pos = 1; pos <= CONFIG.tileCount; pos++) {
    const cat = tileCategory(pos); const place = boardPlacement(pos); const skill = skills[pos];
    const tile = document.createElement("div");
    tile.className = `tile ${cat}${skill ? " has-skill" : ""}${skill === "rainbow" ? " rainbow-tile" : ""}${pos === 1 ? " start" : ""}${pos === CONFIG.tileCount ? " finish" : ""}`;
    tile.dataset.pos = pos; tile.style.gridRow = place.row; tile.style.gridColumn = place.col;
    tile.innerHTML = `<div class="tile-header"><span class="tile-number">${pos}</span>${skill ? `<img class="tile-icon" title="${skillInfo[skill][1]}" src="${skillInfo[skill][0]}" alt="${skillInfo[skill][1]}">` : ""}</div><span class="tile-label">${pos === CONFIG.tileCount ? "FINISH!" : pos === 1 ? "START" : tileDifficulty(pos)}</span><div class="tokens"></div>`;
    board.appendChild(tile);
  }
  requestAnimationFrame(drawRoutes);
}

function render() {
  const list = $("#player-list"); list.innerHTML = "";
  state.players.forEach((p, i) => {
    const isCurrent = i === state.current;
    const finishPlace = state.winners.indexOf(p) + 1;
    const kept = p.shield || p.inventory?.length
      ? `<div class="player-kept-skills"><small>KEPT SKILLS</small>${p.shield ? `<span class="pocket-shield" title="Shield: automatically blocks the next bad effect"><img src="${skillInfo.shield[0]}" alt="Shield ready"><b>AUTO</b></span>` : ""}${(p.inventory || []).map(skill => `<span title="${skillInfo[skill][1]}"><img src="${skillInfo[skill][0]}" alt="${skillInfo[skill][1]}"></span>`).join("")}</div>`
      : `<div class="player-kept-skills empty"><small>KEPT SKILLS</small><em>Empty pocket</em></div>`;
    const card = document.createElement("div"); card.className = `player-card ${isCurrent ? "current expanded" : "compact"}`;
    card.innerHTML = isCurrent
      ? `<div class="active-player-label">NOW THINKING</div><img class="player-face" src="${avatarFiles[p.avatar]}" alt="${escapeHtml(p.name)}"><div class="player-details"><span class="player-name">${escapeHtml(p.name)}</span><span class="player-role">${p.human ? "HUMAN" : "AI THINKER"}</span><span class="player-pos">Tile ${p.pos}${p.finished ? " · Finished" : ""}</span>${kept}</div><span class="shield ${p.shield ? "owned" : ""}" title="${p.shield ? "Shield ready" : "No shield"}">🛡️</span>`
      : `<img class="player-face" src="${avatarFiles[p.avatar]}" alt=""><span class="waiting-player-name">${escapeHtml(p.name)}</span><strong class="waiting-tile">${p.finished && finishPlace ? `FINISHED #${finishPlace}` : `TILE ${p.pos}`}</strong>`;
    list.appendChild(card);
  });
  $$(".tokens").forEach(el => el.innerHTML = "");
  state.players.forEach(p => {
    if (p.pos > 0 && !p.finished) {
      const holder = $(`.tile[data-pos="${Math.min(p.pos, CONFIG.tileCount)}"] .tokens`);
      const playerIndex = state.players.indexOf(p);
      const accents = ["#e88473", "#75b8d9", "#87c18a", "#b18ed1"];
      if (holder) holder.insertAdjacentHTML("beforeend", `<span class="token ${playerIndex === state.current ? "active-token" : ""} ${playerIndex === state.movingIndex ? "moving-token" : ""}" data-player-index="${playerIndex}" style="--token-accent:${accents[playerIndex]}" title="${escapeHtml(p.name)} · Player ${playerIndex + 1}"><img src="${avatarFiles[p.avatar]}" alt="${escapeHtml(p.name)}"><b aria-hidden="true">${playerIndex + 1}</b></span>`);
    }
  });
  const p = state.players[state.current];
  $("#turn-label").textContent = p ? `${p.name}'s turn` : "";
  renderSkillTray();
  updateGameActions();
}

function renderSkillTray() {
  const tray = $("#skill-tray"); if (!tray) return;
  const p = state.players[state.current];
  if (!p || (!p.shield && !p.inventory?.length)) { tray.innerHTML = ""; return; }
  const shieldStatus = p.shield ? `<div class="stored-skill passive-shield" role="status"><img src="${skillInfo.shield[0]}" alt=""><span>Shield ready<br><small>Auto-blocks one bad effect</small></span></div>` : "";
  tray.innerHTML = shieldStatus + (p.inventory || []).map((skill, i) => {
    const usable = canUseSkillNow(skill, p);
    return `<button class="stored-skill" data-use-stored="${i}" title="${usable ? skillInfo[skill][2] : skillUnavailableNote(skill)}" ${!state.running || !p.human || state.busy || !usable ? "disabled" : ""}><img src="${skillInfo[skill][0]}" alt=""><span>${skillInfo[skill][1]}<br><small>${usable ? "Use now" : "Wait for a chance"}</small></span></button>`;
  }).join("");
  $$('[data-use-stored]').forEach(button => button.onclick = () => useStoredSkill(Number(button.dataset.useStored)));
}

function beginTurn() {
  if (!state.running) return;
  const p = state.players[state.current];
  if (!p) return;
  if (p.finished) return nextTurn();
  state.busy = false; state.doubleUsed = false; state.bonusRollPending = false; state.rollsThisTurn = 0; render();
  $("#die-one").textContent = "?"; $("#die-two").textContent = "?"; $("#roll-total").textContent = "Ready?";
  $("#event-log").textContent = p.human ? "Roll the dice, clever thinker!" : `${p.name} is getting ready...`;
  $("#roll-btn").disabled = !p.human;
  if (!p.human) {
    const usableSkillIndex = p.inventory?.findIndex(skill => canUseSkillNow(skill, p)) ?? -1;
    if (usableSkillIndex >= 0 && Math.random() < .55) {
      schedule(() => {
        const [skill] = p.inventory.splice(usableSkillIndex, 1); state.busy = true; render();
        $("#event-log").textContent = `${p.name} uses a kept ${skillInfo[skill][1]}!`;
        executeSkill(skill, p, () => { state.busy = false; rollDice(); });
      }, CONFIG.turnDelay);
    } else schedule(rollDice, CONFIG.turnDelay);
  }
}

let audioContext = null;

function stopAudio() {
  const context = audioContext;
  audioContext = null;
  context?.close?.()?.catch?.(() => {});
}

function ensureAudio() {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return null;
  try {
    if (!audioContext) audioContext = new AudioEngine();
    if (audioContext.state === "suspended") audioContext.resume()?.catch?.(() => {});
    return audioContext;
  } catch { return null; }
}

function updateSoundButton() {
  const button = $("#sound-btn"); if (!button) return;
  button.textContent = state.soundEnabled ? "🔊" : "🔇";
  button.title = state.soundEnabled ? "Mute sound effects" : "Turn sound effects on";
  button.setAttribute("aria-pressed", String(state.soundEnabled));
  button.classList.toggle("muted", !state.soundEnabled);
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  if (state.soundEnabled) ensureAudio();
  else stopAudio();
  updateSoundButton();
}

function playTimerTick(secondsLeft) {
  if (!state.soundEnabled) return;
  const context = ensureAudio(); if (!context) return;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const urgent = secondsLeft <= 5;
  oscillator.type = urgent ? "square" : "sine";
  oscillator.frequency.setValueAtTime(urgent ? (secondsLeft === 1 ? 920 : 680) : 470, start);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(urgent ? (secondsLeft === 1 ? .10 : .065) : .025, start + .008);
  gain.gain.exponentialRampToValueAtTime(.0001, start + (urgent ? .09 : .055));
  oscillator.connect(gain); gain.connect(context.destination);
  oscillator.start(start); oscillator.stop(start + (urgent ? .1 : .065));
}

function playTimeUpSound() {
  if (!state.soundEnabled) return;
  const context = ensureAudio(); if (!context) return;
  const start = context.currentTime;
  [520, 390, 260].forEach((frequency, i) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, start + i * .12);
    gain.gain.setValueAtTime(.0001, start + i * .12);
    gain.gain.exponentialRampToValueAtTime(.085, start + i * .12 + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, start + i * .12 + .14);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(start + i * .12); oscillator.stop(start + i * .12 + .15);
  });
}

function playDiceSound() {
  if (!state.soundEnabled) return;
  const context = ensureAudio();
  if (!context) return;
  const start = context.currentTime;
  for (let i = 0; i < 9; i++) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = i % 2 ? "square" : "triangle";
    oscillator.frequency.setValueAtTime(110 + Math.random() * 150, start + i * .055);
    gain.gain.setValueAtTime(.0001, start + i * .055);
    gain.gain.exponentialRampToValueAtTime(.075, start + i * .055 + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + i * .055 + .045);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(start + i * .055); oscillator.stop(start + i * .055 + .05);
  }
}

function playSlideSound() {
  if (!state.soundEnabled) return;
  const context = ensureAudio(); if (!context) return;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(720, start);
  oscillator.frequency.exponentialRampToValueAtTime(260, start + .7);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(.08, start + .04);
  gain.gain.exponentialRampToValueAtTime(.0001, start + .75);
  oscillator.connect(gain); gain.connect(context.destination);
  oscillator.start(start); oscillator.stop(start + .76);
}

function animateSlide(player, start) {
  const version = state.gameVersion;
  const wrap = $(".board-wrap");
  const path = $(`#routes-overlay .slide-route[data-slide-from="${start}"] .route-slide-body`);
  const token = $(`.tile[data-pos="${start}"] .token[data-player-index="${state.players.indexOf(player)}"]`);
  if (!wrap?.appendChild || !path?.getTotalLength || !path?.getScreenCTM) return delay(850);
  const matrix = path.getScreenCTM();
  if (!matrix) return delay(850);
  const rider = document.createElement("div");
  rider.className = "slide-rider";
  rider.innerHTML = `<span>Wheee~</span><img src="${avatarFiles[player.avatar]}" alt="">`;
  wrap.appendChild(rider);
  if (token) token.style.visibility = "hidden";
  playSlideSound();
  const length = path.getTotalLength(), duration = 1150, startAt = performance.now();
  return new Promise(resolve => {
    const frame = now => {
      if (!state.running || version !== state.gameVersion) { rider.remove(); resolve(); return; }
      const progress = Math.min(1, (now - startAt) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      const point = path.getPointAtLength(length * eased).matrixTransform(matrix);
      const bounds = wrap.getBoundingClientRect();
      rider.style.left = `${point.x - bounds.left}px`;
      rider.style.top = `${point.y - bounds.top}px`;
      rider.style.transform = `translate(-50%,-50%) rotate(${Math.sin(progress * Math.PI * 4) * 9}deg)`;
      if (progress < 1 && state.running) requestAnimationFrame(frame);
      else { rider.remove(); if (token) token.style.visibility = ""; resolve(); }
    };
    requestAnimationFrame(frame);
  });
}

async function rollDice() {
  if (state.busy || !state.running || $("#modal").classList.contains("show")) return;
  state.busy = true; state.rollsThisTurn++; $("#roll-btn").disabled = true; updateGameActions();
  const d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6);
  playDiceSound();
  showFlyingDice(d1, d2);
  $("#die-one").classList.add("rolling"); $("#die-two").classList.add("rolling");
  for (let i = 0; i < 7; i++) {
    $("#die-one").textContent = 1 + Math.floor(Math.random()*6); $("#die-two").textContent = 1 + Math.floor(Math.random()*6); await delay(70);
  }
  $("#die-one").classList.remove("rolling"); $("#die-two").classList.remove("rolling");
  $("#die-one").textContent = d1; $("#die-two").textContent = d2; $("#roll-total").textContent = `${d1} + ${d2} = ${d1+d2}`;
  await delay(420); $("#flying-dice").classList.remove("show");
  await moveCurrent(d1 + d2);
}

async function moveCurrent(steps) {
  const p = state.players[state.current]; p.previous = p.pos; p.snakeFall = null;
  const target = Math.min(CONFIG.tileCount, p.pos + steps);
  $("#event-log").textContent = `${p.name} moves ${steps} spaces.`;
  state.movingIndex = state.current;
  while (p.pos < target) { p.pos++; render(); await delay(125); }
  state.movingIndex = null; render();
  if (p.pos >= CONFIG.tileCount) return winCurrent();
  if (ladders[p.pos] || snakes[p.pos]) return applyBoardRoute(p);
  resolveLanding(p);
}

async function applyBoardRoute(player) {
  const version = state.gameVersion;
  const start = player.pos, end = ladders[start] || snakes[start], climbing = Boolean(ladders[start]);
  if (!climbing && player.shield) {
    player.shield = false;
    player.snakeFall = null;
    render();
    return showAutoNotice("NO SLIDE TODAY!", `${player.name}'s Shield caught the slide before the swoosh.`, () => resolveLanding(player, start), skillInfo.shield[0]);
  }
  player.snakeFall = climbing ? null : { head: start, tail: end };
  $("#event-log").textContent = climbing ? `A wobbly ladder! ${player.name} climbs to ${end}.` : `Wheee~ ${player.name} takes the slide to ${end}!`;
  if (climbing) await delay(800);
  else await animateSlide(player, start);
  if (!state.running || version !== state.gameVersion) return;
  player.pos = end; render(); await delay(climbing ? 500 : 300);
  if (!state.running || version !== state.gameVersion) return;
  resolveLanding(player, start);
}

function resolveLanding(player, questionTile = player.pos) {
  const landingTile = player.pos;
  const occupied = state.players.some(rival => rival !== player && !rival.finished && rival.pos === landingTile);
  if (!occupied) return askLandingQuestion(player, questionTile);
  const finish = passed => {
    player.snakeFall = null;
    if (passed === false || player.pos !== landingTile) return nextTurn();
    finishLanding(player, landingTile);
  };
  const challenge = category => checkChallenge(player, finish, { questionTile, category });
  if (skills[questionTile] === "rainbow" && player.human) {
    return chooseCategory(player, challenge, tileDifficulty(questionTile), 2);
  }
  challenge();
}

function finishLanding(player, landingTile = player.pos) {
  if (!state.running) return;
  const skill = skills[landingTile];
  if (player.pos !== landingTile || !skill || skill === "rainbow") return nextTurn();
  activateSkill(skill, player, nextTurn);
}

function askLandingQuestion(player, questionTile = player.pos) {
  const difficulty = tileDifficulty(questionTile);
  if (skills[questionTile] !== "rainbow") return askQuestion(tileCategory(questionTile), difficulty, player);

  if (player.human) {
    return chooseCategory(player, category => askQuestion(category, difficulty, player), difficulty);
  }

  const available = categories.filter(category => remainingQuestionCards(category, difficulty));
  if (!available.length) return askQuestion(tileCategory(questionTile), difficulty, player);
  const category = available[Math.floor(Math.random() * available.length)];
  showModal(`<img class="skill-art" src="${skillInfo.rainbow[0]}" alt=""><div class="eyebrow">Rainbow event!</div><h2>Choose right now</h2><p>${escapeHtml(player.name)} picked <strong>${categoryNames[category]}</strong> for this question.</p><button class="chunky primary" id="rainbow-ai-continue">SHOW QUESTION</button>`);
  const button = $("#rainbow-ai-continue");
  button.onclick = modalAction(() => { closeModal(); askQuestion(category, difficulty, player); });
  scheduleModal(() => button.click(), CONFIG.skillChoiceMs);
}

function shuffleQuestionCards(cards) {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleQuestionOptions([prompt, options, correctIndex]) {
  const order = shuffleQuestionCards([0, 1, 2, 3]);
  return [prompt, order.map(index => options[index]), order.indexOf(correctIndex)];
}

function resetQuestionDecks() {
  state.questionDecks = Object.fromEntries(categories.map(category => [category, Object.fromEntries(
    ["easy", "medium", "hard", "epic"].map(difficulty => [difficulty, shuffleQuestionCards(questions[category][difficulty].map(shuffleQuestionOptions))])
  )]));
}

function remainingQuestionCards(category, difficulty) {
  return state.questionDecks?.[category]?.[difficulty]?.length || 0;
}

function randomQuestion(category, difficulty) {
  const pile = state.questionDecks?.[category]?.[difficulty];
  return pile?.length ? pile.pop() : null;
}

function buildQuestionPopup(category, difficulty, player, q, interactive) {
  const template = $("#question-template").content.cloneNode(true);
  const questionModal = template.querySelector(".question-modal");
  const owner = document.createElement("div");
  owner.className = "question-owner";
  owner.textContent = `${player.name} is answering`;
  questionModal.prepend(owner);
  template.querySelector(".category-pill").textContent = categoryNames[category];
  template.querySelector(".category-pill").classList.add(category);
  template.querySelector(".difficulty-tag").textContent = difficulty;
  template.querySelector(".question-text").textContent = q[0];
  const answers = template.querySelector(".answers");
  q[1].forEach((answer, i) => {
    const b = document.createElement("button"); b.className = "answer-button"; b.textContent = answer;
    b.dataset.answerIndex = i;
    b.disabled = !interactive;
    answers.appendChild(b);
  });
  $("#modal-card").innerHTML = ""; $("#modal-card").appendChild(template); openModal();
  return { answers, buttons: [...answers.querySelectorAll(".answer-button")], timer: $(".timer") };
}

function askQuestion(category, difficulty, player, onDone, fixedQuestion = null) {
  const q = fixedQuestion || randomQuestion(category, difficulty);
  if (!q) {
    showAutoNotice("Card pile picked clean!", `No unused ${difficulty} ${categoryNames[category]} cards remain. Take a free pass this turn!`, () => {
      if (onDone) onDone(true);
      else handleCorrect(player);
    });
    return;
  }
  if (!player.human) return aiQuestion(category, difficulty, player, q, onDone);
  const popup = buildQuestionPopup(category, difficulty, player, q, true);
  const answer = modalAction((correct, choiceIndex, button, timedOut = false) => resolveHumanAnswer(correct, choiceIndex, button, popup.answers, player, category, difficulty, q, onDone, timedOut));
  popup.buttons.forEach((button, i) => {
    button.onclick = () => answer(i === q[2], i, button);
  });
  let time = CONFIG.questionSeconds; const timerEl = $(".timer");
  playTimerTick(time);
  state.timer = setInterval(() => {
    time--; timerEl.querySelector("span").textContent = time;
    if (time > 0) {
      if (time <= 5) timerEl.classList.add("danger");
      playTimerTick(time);
    }
    if (time <= 0) { clearInterval(state.timer); playTimeUpSound(); answer(false, null, null, true); }
  }, 1000);
}

async function resolveHumanAnswer(correct, choiceIndex, button, answers, player, category, difficulty, q, onDone, timedOut = false) {
  clearInterval(state.timer); answers.querySelectorAll(".answer-button").forEach(b => b.disabled = true);
  if (button) button.classList.add(correct ? "correct" : "wrong");
  if (!correct) answers.querySelector(`[data-answer-index="${q[2]}"]`)?.classList.add("correct");
  await delay(550);
  showAnswerResult(player, correct, q, choiceIndex, timedOut, () => {
    if (onDone) return onDone(correct);
    correct ? handleCorrect(player) : handleWrong(player, timedOut ? "Time ran out!" : "Not quite!");
  });
}

async function aiQuestion(category, difficulty, player, q, onDone) {
  const popup = buildQuestionPopup(category, difficulty, player, q, false);
  popup.timer.classList.add("ai-thinking");
  popup.timer.querySelector("span").textContent = "AI";
  $("#event-log").textContent = `${player.name} is thinking about a ${difficulty} ${categoryNames[category]} question...`;
  await delay(1100);
  const correct = Math.random() < CONFIG.aiRates[player.aiDifficulty || "normal"][difficulty];
  const wrongChoices = q[1].map((_, i) => i).filter(i => i !== q[2]);
  const choiceIndex = correct ? q[2] : wrongChoices[Math.floor(Math.random() * wrongChoices.length)];
  popup.buttons[choiceIndex].classList.add(correct ? "correct" : "wrong");
  if (!correct) popup.buttons[q[2]].classList.add("correct");
  $("#event-log").textContent = correct ? `${player.name} chose “${q[1][choiceIndex]}” — correct!` : `${player.name} chose “${q[1][choiceIndex]}” — not quite.`;
  await delay(700);
  showAnswerResult(player, correct, q, choiceIndex, false, () => {
    if (onDone) return onDone(correct);
    correct ? handleCorrect(player) : handleWrong(player);
  });
}

function showAnswerResult(player, correct, q, choiceIndex, timedOut, callback) {
  const happy = ["Brain sparkle!", "Tiny genius detected!", "Correct-a-mundo!", "Your brain did a cartwheel!"];
  const oops = timedOut
    ? ["The timer ate your answer!", "Poof! Time flew away!"]
    : ["Oopsie noodle!", "The answer escaped!", "Brain took a tea break!", "A very educational bonk!"];
  const title = (correct ? happy : oops)[Math.floor(Math.random() * (correct ? happy : oops).length)];
  const chosen = choiceIndex == null ? "No answer chosen" : `Chosen: ${q[1][choiceIndex]}`;
  showModal(`<div class="answer-result ${correct ? "is-correct" : "is-wrong"}"><div class="result-burst">${correct ? "✓" : "?"}</div><div class="eyebrow">${escapeHtml(player.name)}</div><h2>${title}</h2><p class="chosen-answer">${escapeHtml(chosen)}</p><div class="mini-correct-answer"><span>CORRECT ANSWER</span><strong>${escapeHtml(q[1][q[2]])}</strong></div><button class="chunky primary" id="answer-continue">${player.human ? "OKAY, NEXT!" : "CONTINUE"}</button></div>`);
  const button = $("#answer-continue");
  button.onclick = modalAction(() => { closeModal(); callback?.(); });
  if (!player.human) scheduleModal(() => button.click(), CONFIG.reactionNoticeMs);
}

async function handleCorrect(player) {
  player.snakeFall = null;
  $("#event-log").textContent = `${player.name} answered correctly and stays!`;
  const landingTile = player.pos;
  await delay(400);
  finishLanding(player, landingTile);
}

async function handleWrong(player, message = "Wrong answer!") {
  const snakeFall = player.snakeFall;
  player.snakeFall = null;
  if (player.shield) {
    player.shield = false;
    render();
    return showAutoNotice("BONK BLOCKED!", `${player.name}'s Shield blocked the wrong-answer bounce.`, () => checkChallenge(player), skillInfo.shield[0]);
  }
  const destination = snakeFall ? Math.max(0, snakeFall.tail - 2) : player.previous;
  $("#event-log").textContent = snakeFall
    ? `${message} Slide slip! ${player.name} scoots two more tiles from ${snakeFall.tail} to ${destination}.`
    : `${message} ${player.name} returns to space ${destination}.`;
  await delay(600); player.pos = destination; render();
  if (snakeFall) return showAutoNotice("SLIDE OOPS!", `${player.name} missed the question on Tile ${snakeFall.head} and scooted back to Tile ${destination}.`, nextTurn);
  await delay(450); nextTurn();
}

function canUseSkillNow(skill, player) {
  const rivals = state.players.filter(candidate => candidate !== player && !candidate.finished);
  return !(skill === "double" && state.doubleUsed) &&
    !(skill === "shield" && player.shield) &&
    !(skill === "push" && !rivals.some(candidate => candidate.pos > 0)) &&
    !(skill === "switch" && !rivals.some(candidate => candidate.pos !== player.pos));
}

function skillUnavailableNote(skill) {
  const notes = {
    double: "Already rolled extra dice this turn!",
    shield: "Your Shield is already ready!",
    push: "No rival can move back right now!",
    switch: "Every rival is on the same tile!"
  };
  return notes[skill] || "Wait for a useful moment.";
}

async function activateSkill(skill, player, after = nextTurn) {
  if (skill === "rainbow") return after();
  if (skill === "shield") return executeSkill(skill, player, after);
  const [icon, name, description] = skillInfo[skill];
  const canUse = canUseSkillNow(skill, player);
  const note = !canUse ? `<p>${skillUnavailableNote(skill)} Tuck this one away.</p>` : "";
  showModal(`<img class="skill-art" src="${icon}" alt=""><div class="eyebrow">Skill discovered!</div><h2>${name}</h2><p>${description}</p>${note}${canUse ? `<button class="chunky primary" id="use-skill">USE NOW</button>` : ""}<button class="chunky secondary" id="keep-skill">KEEP FOR LATER</button>`);
  if (canUse) $("#use-skill").onclick = modalAction(() => {
    closeModal();
    if (skill === "double") return executeSkill(skill, player, after);
    showAutoNotice("ZAP! Use it!", `${player.name} sends ${name} bouncing into action!`, () => executeSkill(skill, player, after), icon);
  });
  const keepButton = $("#keep-skill"), useButton = canUse ? $("#use-skill") : null;
  keepButton.onclick = modalAction(() => { closeModal(); keepSkill(skill, player, after); });
  if (!player.human) scheduleModal(() => (useButton && Math.random() < .6 ? useButton : keepButton).click(), CONFIG.skillChoiceMs);
}

function keepSkill(skill, player, after = nextTurn) {
  if (skill === "shield") return executeSkill(skill, player, after);
  player.inventory ||= [];
  const dropped = player.inventory.length >= 3 ? player.inventory.shift() : null;
  player.inventory.push(skill); render();
  const message = `${player.name} tucked ${skillInfo[skill][1]} away for later.${dropped ? ` The full pocket let ${skillInfo[dropped][1]} go.` : ""}`;
  showAutoNotice("Yoink! Pocketed!", message, after, skillInfo[skill][0]);
}

function useStoredSkill(index) {
  const player = state.players[state.current];
  if (!state.running || !player?.human || state.busy || $("#modal").classList.contains("show") || index < 0 || index >= player.inventory.length || !canUseSkillNow(player.inventory[index], player)) return;
  const [skill] = player.inventory.splice(index, 1); state.usingStored = true; state.busy = true; render();
  executeSkill(skill, player, resumeAfterStoredSkill);
}

function resumeAfterStoredSkill() {
  state.usingStored = false; state.busy = false; closeModal(); render();
  $("#roll-btn").disabled = false;
  $("#event-log").textContent = "Skill used! Now roll the dice.";
}

async function executeSkill(skill, player, after = () => checkChallenge(player)) {
  const [, name] = skillInfo[skill];
  if (skill === "shield") {
    // Passive protection has its own pocket: never evict a kept action skill.
    const alreadyProtected = player.shield;
    player.shield = true;
    render();
    showAutoNotice(alreadyProtected ? "STILL BONK-PROOF!" : "POCKET BODYGUARD!", alreadyProtected
      ? `${player.name} already has a Shield ready. One trusty bodyguard at a time!`
      : `${player.name}'s Shield hopped into the pocket! It automatically blocks the next bad effect, then disappears.`, after, skillInfo[skill][0]);
  } else if (skill === "double") {
    if (state.doubleUsed) return after();
    state.doubleUsed = true;
    state.bonusRollPending = state.rollsThisTurn === 0;
    state.usingStored = false;
    state.busy = false;
    closeModal();
    render();
    $("#event-log").textContent = `ROLL-O-RAMA! ${player.name}'s bonus dice are already bouncing!`;
    rollDice();
  } else if (skill === "push") {
    chooseOpponent(player, "Push back an opponent 2 spaces", target => pushBack(target, player, after), candidate => candidate.pos > 0, after);
  } else if (skill === "switch") {
    chooseOpponent(player, "Swap places with an opponent", target => switchPlaces(target, player, after), candidate => candidate.pos !== player.pos, after);
  }
}

function diePips(value) {
  const map = {1:[[50,50]],2:[[27,27],[73,73]],3:[[27,27],[50,50],[73,73]],4:[[27,27],[73,27],[27,73],[73,73]],5:[[27,27],[73,27],[50,50],[27,73],[73,73]],6:[[27,23],[27,50],[27,77],[73,23],[73,50],[73,77]]};
  return map[value].map(([x,y]) => `<i class="pip" style="left:${x}%;top:${y}%"></i>`).join("");
}

function showFlyingDice(a,b) {
  const el = $("#flying-dice"), wrap = $(".board-wrap");
  el.children[0].innerHTML = diePips(a); el.children[1].innerHTML = diePips(b);
  el.style.left = `${8 + Math.random()*55}%`; el.style.top = `${8 + Math.random()*62}%`;
  el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
}

function positionBoardOverlay(svg, board, bounds) {
  svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
  Object.assign(svg.style, { left:`${board.offsetLeft}px`,top:`${board.offsetTop}px`,width:`${bounds.width}px`,height:`${bounds.height}px` });
}

function drawRoutes() {
  const svg = $("#routes-overlay"), board = $("#board"); if (!svg || !board || !board.querySelector(".tile")) return;
  const br = board.getBoundingClientRect(); if (!br.width || !br.height) return;
  positionBoardOverlay(svg, board, br);
  svg.innerHTML = "";
  const center = pos => { const r = $(`.tile[data-pos="${pos}"]`).getBoundingClientRect(); return [r.left-br.left+r.width/2, r.top-br.top+r.height/2]; };
  Object.entries(ladders).forEach(([a,b]) => {
    const [rawX1,rawY1]=center(a),[rawX2,rawY2]=center(b);
    const rawDx=rawX2-rawX1,rawDy=rawY2-rawY1,len=Math.hypot(rawDx,rawDy);
    const ux=rawDx/len,uy=rawDy/len;
    const endInset=Math.min(18,len*.08);
    const x1=rawX1+ux*endInset,y1=rawY1+uy*endInset,x2=rawX2-ux*endInset,y2=rawY2-uy*endInset;
    const dx=x2-x1,dy=y2-y1,railGap=8,nx=-uy*railGap,ny=ux*railGap;
    const rails=`<line x1="${x1+nx}" y1="${y1+ny}" x2="${x2+nx}" y2="${y2+ny}"/><line x1="${x1-nx}" y1="${y1-ny}" x2="${x2-nx}" y2="${y2-ny}"/>`;
    let rungOutlines="",rungFills="";
    const rungCount=Math.max(3,Math.floor(Math.hypot(dx,dy)/38));
    for(let i=1;i<=rungCount;i++){
      const t=i/(rungCount+1),x=x1+dx*t,y=y1+dy*t;
      const rung=`<line x1="${x-nx}" y1="${y-ny}" x2="${x+nx}" y2="${y+ny}"/>`;
      rungOutlines+=rung;rungFills+=rung;
    }
    svg.insertAdjacentHTML("beforeend",`<g class="ladder-route"><g class="route-ladder-outline">${rails}</g><g class="route-ladder">${rails}</g><g class="route-rung-outline">${rungOutlines}</g><g class="route-rung">${rungFills}</g></g>`);
  });
  Object.entries(snakes).forEach(([a,b]) => {
    const [x1,y1]=center(a),[x2,y2]=center(b),mid=(y1+y2)/2;
    const bend = x2 >= x1 ? 28 : -28;
    const d=`M ${x1} ${y1} C ${x1+bend} ${mid-20}, ${x2+bend} ${mid+20}, ${x2} ${y2}`;
    svg.insertAdjacentHTML("beforeend",`<g class="slide-route" data-slide-from="${a}"><path class="route-slide-outline" d="${d}"/><path class="route-slide-body" d="${d}"/><path class="route-slide-shine" d="${d}"/><circle class="slide-start" cx="${x1}" cy="${y1}" r="11"/><circle class="slide-end" cx="${x2}" cy="${y2}" r="7"/></g>`);
  });
}

function chooseCategory(player, callback, difficulty = tileDifficulty(player.pos), needed = 1) {
  const available = categories.filter(category => remainingQuestionCards(category, difficulty) >= needed);
  if (!available.length) return callback(tileCategory(player.pos));
  showModal(`<img class="skill-art" src="${skillInfo.rainbow[0]}" alt=""><div class="eyebrow">Rainbow event!</div><h2>Choose this question's category</h2><p>Pick the category you feel brightest about!</p><div class="choice-grid category-choice-grid">${categories.map(c => `<button class="choice-button category-choice ${c}" data-category="${c}" ${!available.includes(c) ? 'disabled title="No unused cards left"' : ""}>${categoryNames[c]}${!available.includes(c) ? "<small>Pile empty</small>" : ""}</button>`).join("")}</div>`);
  $$("[data-category]").forEach(button => button.onclick = modalAction(() => { const category = button.dataset.category; closeModal(); callback(category); }));
}

function chooseOpponent(player, prompt, callback, eligible = () => true, onNoTarget = nextTurn) {
  const choices = state.players.filter(p => p !== player && !p.finished && eligible(p));
  if (!choices.length) return showAutoNotice("No target this time!", `${player.name}'s skill has no useful rival to choose.`, onNoTarget);
  if (!player.human) {
    const target = choices.sort((a,b) => b.pos-a.pos)[0]; return callback(target);
  }
  showModal(`<div class="eyebrow">Special move!</div><h2>${prompt}</h2><div class="choice-grid">${choices.map(p => `<button class="choice-button" data-opponent="${state.players.indexOf(p)}"><img class="player-face" src="${avatarFiles[p.avatar]}" alt="">${escapeHtml(p.name)}<br>Space ${p.pos}</button>`).join("")}</div>`);
  $$('[data-opponent]').forEach(b => b.onclick = modalAction(() => { closeModal(); callback(state.players[Number(b.dataset.opponent)]); }));
}

async function pushBack(target, player, callback) {
  if (target.shield) { target.shield = false; render(); return showAutoNotice("CLONK! Blocked!", `${target.name}'s Shield said “nope!”`, callback, skillInfo.shield[0]); }
  const oldPosition = target.pos;
  target.previous = oldPosition;
  target.pos = Math.max(0, target.pos - 2);
  render(); showAutoNotice("BOOP—BACK YOU GO!", `${target.name} wobbled back ${oldPosition - target.pos} ${oldPosition - target.pos === 1 ? "space" : "spaces"}.`, () => resolveSkillCollisions([target], callback), skillInfo.push[0]);
}

function switchPlaces(target, player, callback) {
  if (target.shield) {
    target.shield = false;
    render();
    return showAutoNotice("NO-SWAP SHIELD!", `${target.name}'s Shield blocked the position switch.`, callback, skillInfo.shield[0]);
  }
  player.previous = player.pos; target.previous = target.pos;
  [player.pos, target.pos] = [target.pos, player.pos]; render();
  showAutoNotice("SWAP-A-DOODLE!", `${player.name} and ${target.name} traded places.`, () => resolveSkillCollisions([player, target], callback), skillInfo.switch[0]);
}

function resolveSkillCollisions(movedPlayers, after) {
  const visit = index => {
    if (!state.running) return;
    if (index >= movedPlayers.length) return after?.();
    const player = movedPlayers[index];
    if (player.pos <= 0 || player.finished) return visit(index + 1);
    checkChallenge(player, () => visit(index + 1));
  };
  visit(0);
}

function showAutoNotice(title, text, callback, icon = "") {
  const image = icon ? `<img class="auto-notice-icon" src="${icon}" alt="">` : `<div class="auto-notice-bang">!</div>`;
  showModal(`<div class="auto-notice" role="status">${image}<div class="eyebrow">Quick reaction!</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p><div class="auto-notice-dots">✦ · ✦ · ✦</div></div>`);
  scheduleModal(() => {
    if (!$(".auto-notice")) return;
    closeModal();
    callback?.();
  }, CONFIG.reactionNoticeMs);
}

function showNotice(title, text, callback) {
  showModal(`<h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p><button class="chunky primary" id="continue-btn">CONTINUE</button>`);
  const button = $("#continue-btn");
  button.onclick = modalAction(() => { closeModal(); callback?.(); });
  if (!state.players[state.current]?.human) scheduleModal(() => button.click(), CONFIG.reactionNoticeMs);
}

function checkChallenge(player, after = nextTurn, context = {}) {
  const tile = player.pos;
  const rivals = state.players.filter(p => p !== player && !p.finished && p.pos === tile);
  let allCorrect = true;
  const visit = index => {
    if (player.pos !== tile) return after(false);
    if (index >= rivals.length) return after(allCorrect);
    const rival = rivals[index];
    if (rival.finished || rival.pos !== tile) return visit(index + 1);
    showNotice("Cozy collision!", `${player.name} landed on ${rival.name}'s tile. Both get a different question from the same category and difficulty!`, () => runChallenge(player, rival, correct => {
      allCorrect = allCorrect && correct !== false;
      visit(index + 1);
    }, context));
  };
  visit(0);
}

function runChallenge(challenger, rival, after = nextTurn, context = {}) {
  const diff = tileDifficulty(context.questionTile ?? challenger.pos);
  const availableCategories = categories.filter(category => remainingQuestionCards(category, diff) >= 2);
  if (!availableCategories.length) {
    showAutoNotice("Challenge deck empty!", `There are not two unused ${diff} cards left in one category. Both thinkers stay cozy on this tile.`, after);
    return;
  }
  const cat = context.category && availableCategories.includes(context.category) ? context.category : availableCategories[Math.floor(Math.random() * availableCategories.length)];
  const challengerQuestion = randomQuestion(cat, diff);
  const rivalQuestion = randomQuestion(cat, diff);
  const finish = (challengerCorrect, rivalCorrect) => {
    const wrongPlayers = [
      ...(!challengerCorrect ? [challenger] : []),
      ...(!rivalCorrect ? [rival] : [])
    ];
    const returned = [];
    const protectedPlayers = [];
    wrongPlayers.forEach(player => {
      if (player.shield) {
        player.shield = false;
        protectedPlayers.push(player.name);
      } else {
        player.pos = player.snakeFall ? Math.max(0, player.snakeFall.tail - 2) : player.previous ?? 0;
        player.snakeFall = null;
        returned.push(`${player.name} → Tile ${player.pos}`);
      }
    });
    rival.snakeFall = null;
    render();
    let title = "Challenge finished!";
    let text = "";
    if (challengerCorrect && rivalCorrect) {
      title = "Double brain sparkle!";
      text = `${challenger.name} and ${rival.name} both got it right, so they stay together on Tile ${challenger.pos}. Cozy!`;
    } else if (!challengerCorrect && !rivalCorrect) {
      title = "Double oopsie!";
      text = `Both answers went wobble-wrong. ${returned.length ? returned.join(" · ") : "Their shields saved the day."}`;
    } else {
      const winner = challengerCorrect ? challenger : rival;
      title = `${winner.name} keeps the tile!`;
      text = returned.length ? `${returned.join(" · ")} returns to the tile they came from.` : "A shield saved the other thinker from bouncing back.";
    }
    if (protectedPlayers.length) text += ` 🛡️ ${protectedPlayers.join(" & ")}'s shield blocked the bounce.`;
    showNotice(title, text, () => after(challengerCorrect));
  };
  const askRival = challengerCorrect => askQuestion(cat, diff, rival, rivalCorrect => finish(challengerCorrect, rivalCorrect), rivalQuestion);
  askQuestion(cat, diff, challenger, askRival, challengerQuestion);
}

function ordinalPlace(place) {
  return place === 1 ? "1st" : place === 2 ? "2nd" : place === 3 ? "3rd" : `${place}th`;
}

function podiumStep(player, place) {
  if (!player) return "";
  const medals = ["🥇", "🥈", "🥉"];
  return `<div class="podium-entry place-${place}"><div class="podium-player"><span class="podium-medal">${medals[place - 1] || "⭐"}</span><img src="${avatarFiles[player.avatar]}" alt="${escapeHtml(player.name)}"><strong>${escapeHtml(player.name)}</strong></div><div class="podium-block"><span>${ordinalPlace(place)}</span></div></div>`;
}

function showFinalPodium() {
  state.running = false;
  clearScheduledActions();
  const standings = [...state.winners, ...state.players.filter(player => !state.winners.includes(player))];
  state.winners = standings;
  standings.forEach(player => player.finished = true);
  render();
  const topThree = `${podiumStep(standings[1], 2)}${podiumStep(standings[0], 1)}${podiumStep(standings[2], 3)}`;
  const remainingPlaces = standings.slice(3).map((player, index) => `<div class="extra-place"><span>${ordinalPlace(index + 4)}</span><img src="${avatarFiles[player.avatar]}" alt=""><strong>${escapeHtml(player.name)}</strong></div>`).join("");
  const confetti = Array.from({ length: 42 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--delay:${(i % 9) * -.16}s;--drift:${(i % 2 ? 1 : -1) * (20 + i % 35)}px;--color:${["#f2765b", "#f4cb4d", "#77b87b", "#6eb9d2", "#a886c8"][i % 5]}"></i>`).join("");
  showModal(`<div class="podium-celebration"><div class="confetti" aria-hidden="true">${confetti}</div><div class="eyebrow">Game complete!</div><h2>Everybody found their place!</h2><p>One thinker remains, so the standings are complete!</p><div class="podium">${topThree}</div>${remainingPlaces ? `<div class="extra-places">${remainingPlaces}</div>` : ""}<button class="chunky primary" id="again-btn">PLAY AGAIN</button><button class="chunky secondary" id="menu-btn">MAIN MENU</button></div>`);
  $("#again-btn").onclick = () => { closeModal(); startGame(); };
  $("#menu-btn").onclick = resetGame;
}

function winCurrent() {
  const player = state.players[state.current];
  player.pos = CONFIG.tileCount;
  player.finished = true;
  if (!state.winners.includes(player)) state.winners.push(player);
  render();
  const remaining = state.players.filter(candidate => !candidate.finished);
  if (remaining.length <= 1) return showFinalPodium();
  const place = state.winners.length;
  showAutoNotice("PODIUM HOP!", `${player.name} claimed ${ordinalPlace(place)} place and hops onto the podium. The game continues!`, nextTurn, avatarFiles[player.avatar]);
}

function nextTurn() {
  if (!state.running) return;
  state.busy = true;
  updateGameActions();
  if (state.bonusRollPending && !state.players[state.current]?.finished) {
    state.bonusRollPending = false;
    state.busy = true;
    render();
    $("#event-log").textContent = "Bonus roll! The paper dice are bouncing again.";
    schedule(() => { state.busy = false; rollDice(); }, 450);
    return;
  }
  state.bonusRollPending = false;
  for (let offset = 1; offset <= state.players.length; offset++) {
    const candidate = (state.current + offset) % state.players.length;
    if (!state.players[candidate].finished) {
      state.current = candidate;
      render();
      schedule(beginTurn, 500);
      return;
    }
  }
  showFinalPodium();
}

function showRules() {
  if (state.running && !canOpenGameMenu()) return;
  showModal(`<div class="rules-modal"><div class="eyebrow">How to play</div><h2>Roll. Land. Think.</h2><p class="rules-intro"><span>Start at Tile 1 and follow the numbered tiles in a zigzag to Tile 60.</span><span>Play until only one thinker remains on the board.</span></p><div class="rules-steps">
    <div><b>1</b><strong>Roll & move</strong><span>On your turn, roll the dice and move forward the number shown.</span></div>
    <div><b>2</b><strong>Answer</strong><span>Your landing tile gives you a color and difficulty. You have 15 seconds.</span></div>
    <div><b>3</b><strong>Stay or bounce</strong><span>Correct? Stay. Wrong? Go back to your previous tile.</span></div>
  </div><div class="rules-label">Tile colors = question categories</div><div class="rules-category-key">
    <span class="famous"><i class="dot famous"></i>Famous & Important</span>
    <span class="math"><i class="dot math"></i>Mathematics</span>
    <span class="general"><i class="dot general"></i>General Knowledge</span>
    <span class="movie"><i class="dot movie"></i>Guess the Movie</span>
    <span class="logic"><i class="dot logic"></i>Logic & Riddles</span>
  </div><div class="rules-label">Board surprises</div><div class="rules-surprises">
    <div><strong>↗ Ladder</strong><span>Climb, then answer for the tile you first landed on.</span></div>
    <div><strong>↘ Slide</strong><span>Wheee~ Go down, then answer for the tile you first landed on. Wrong? Back 2 more.</span></div>
    <div><strong>✦ Skills</strong><span>Shield auto-pockets and blocks one bad effect. Other skills: use now or keep.</span></div>
    <div><strong>🌈 Rainbow</strong><span>Choose your category now; difficulty stays the same.</span></div>
  </div><p class="rules-footnote"><strong>Same tile?</strong> Both players answer different cards of the same category and difficulty. Wrong answers bounce back. Used cards do not repeat this game.</p><button class="chunky primary rules-close" id="got-it">GOT IT</button></div>`);
  $("#got-it").onclick = closeModal;
}

function pauseGame() {
  if (!canOpenGameMenu()) return;
  showModal(`<div class="eyebrow">Tiny thinking break</div><h2>Game paused</h2><p>The meeples promise not to wiggle away.</p><button class="chunky primary" id="resume-btn">RESUME</button><button class="chunky secondary" id="quit-btn">QUIT TO MENU</button>`);
  $("#resume-btn").onclick = closeModal;
  $("#quit-btn").onclick = resetGame;
}

$("#play-btn").onclick = () => { closeModal(); renderSetupPlayers(); showScreen("setup-screen"); };
$("#how-btn").onclick = showRules; $("#rules-btn").onclick = showRules; $("#pause-btn").onclick = pauseGame; $("#sound-btn").onclick = toggleSound; $("#roll-btn").onclick = rollDice;
$$('.back-btn').forEach(b => b.onclick = () => showScreen(b.dataset.target));
$("#add-player-btn").onclick = () => addSetupPlayer(true);
$("#start-btn").onclick = startGame;
window.addEventListener("resize", () => requestAnimationFrame(drawRoutes));
window.addEventListener("keydown", event => {
  if (!$("#modal").classList.contains("show")) return;
  if (event.key === "Escape") {
    const dismiss = $("#close-picker") || $("#got-it") || $("#resume-btn");
    if (dismiss) { event.preventDefault(); dismiss.click(); }
  }
  if (event.key !== "Tab") return;
  const controls = [...$("#modal-card").querySelectorAll('button:not(:disabled),input,select,[tabindex="0"]')];
  const first = controls[0], last = controls.at(-1);
  if (!first) { event.preventDefault(); return; }
  if (event.shiftKey && (document.activeElement === first || document.activeElement === $("#modal-card"))) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === $("#modal-card"))) {
    event.preventDefault(); first.focus();
  }
});
window.addEventListener("error", event => {
  const log = $("#event-log");
  if (log) log.textContent = `Something got tangled: ${event.message}`;
});

renderSetupPlayers();
updateSoundButton();

