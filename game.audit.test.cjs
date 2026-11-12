const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Deliberately use a controllable clock: immediate timer mocks cannot expose a
// timeout from an old AI popup acting on a later human popup with the same ID.
function loadGame() {
  let now = 0;
  let nextTimer = 0;
  const timers = new Map();
  const globals = new Map();
  let modalNodes = new Map();
  let modalHtml = "";

  function element(id = "") {
    const classes = new Set();
    let html = "";
    const node = {
      id, textContent: "", disabled: false, style: {}, dataset: {}, scrollTop: 0,
      attributes: new Map(),
      classList: {
        add(...names) { names.forEach(name => classes.add(name)); },
        remove(...names) { names.forEach(name => classes.delete(name)); },
        contains(name) { return classes.has(name); },
        toggle(name, force) {
          const enabled = force === undefined ? !classes.has(name) : force;
          enabled ? classes.add(name) : classes.delete(name);
          return enabled;
        }
      },
      setAttribute(name, value) { this.attributes.set(name, value); },
      click() { if (!this.disabled) this.onclick?.(); }
    };
    Object.defineProperty(node, "innerHTML", {
      get() { return html; },
      set(value) {
        html = String(value);
        if (id !== "modal-card") return;
        modalHtml = html;
        modalNodes = new Map();
        for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
          modalNodes.set(`#${match[1]}`, element(match[1]));
        }
        if (/class="[^"]*\bauto-notice\b/.test(html)) {
          modalNodes.set(".auto-notice", element());
        }
      }
    });
    return node;
  }

  for (const id of [
    "app", "modal", "modal-card", "pause-btn", "rules-btn", "sound-btn", "play-btn",
    "how-btn", "roll-btn", "add-player-btn", "start-btn", "setup-players",
    "setup-error", "player-list", "skill-tray", "board", "routes-overlay",
    "flying-dice", "turn-label", "die-one", "die-two", "roll-total", "event-log", "editable-title"
  ]) globals.set(`#${id}`, element(id));
  const screens = ["menu-screen", "setup-screen", "game-screen"].map(element);
  screens.forEach(screen => globals.set(`#${screen.id}`, screen));

  const addTimer = (callback, ms = 0, interval = null) => {
    const id = ++nextTimer;
    timers.set(id, { callback, due: now + Number(ms), interval });
    return id;
  };
  const context = vm.createContext({
    window: { addEventListener() {} },
    document: {
      querySelector(selector) { return globals.get(selector) || modalNodes.get(selector) || null; },
      querySelectorAll(selector) { return selector === ".screen" ? screens : []; }
    },
    setTimeout: (callback, ms) => addTimer(callback, ms),
    clearTimeout: id => timers.delete(id),
    setInterval: (callback, ms) => addTimer(callback, ms, Number(ms)),
    clearInterval: id => timers.delete(id),
    requestAnimationFrame() {}, console
  });
  for (const file of ["questions-data.js", "additional-questions.js", "legacy-distractors.js", "game.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, file), "utf8"), context, { filename: file });
  }
  const run = source => vm.runInContext(source, context);
  // These tests exercise state transitions and modal ownership, not layout.
  run("render = () => {};");
  return {
    run, context,
    get state() { return run("state"); },
    get modalHtml() { return modalHtml; },
    get pendingTimers() { return timers.size; },
    node: selector => globals.get(selector) || modalNodes.get(selector) || null,
    async advance(ms) {
      const target = now + ms;
      for (;;) {
        const due = [...timers.entries()]
          .filter(([, timer]) => timer.due <= target)
          .sort((a, b) => a[1].due - b[1].due || a[0] - b[0])[0];
        if (!due) break;
        const [id, timer] = due;
        now = timer.due;
        if (timer.interval == null) timers.delete(id);
        else timer.due += timer.interval;
        timer.callback();
        for (let i = 0; i < 5; i++) await Promise.resolve();
      }
      now = target;
      for (let i = 0; i < 5; i++) await Promise.resolve();
    }
  };
}

function preparePlayers(game, count = 2) {
  const state = game.state;
  state.players = Array.from({ length: count }, (_, index) => ({
    name: `Player ${index + 1}`, avatar: index, pos: 10 + index, previous: index,
    human: true, aiDifficulty: "normal", shield: false, snakeFall: null,
    inventory: [], finished: false
  }));
  state.current = 0;
  state.running = true;
  state.busy = true;
  return state;
}

test("manually continuing an AI answer cannot later dismiss the human answer result", async () => {
  const game = loadGame();
  const state = preparePlayers(game);
  state.players[0].human = false;
  game.run(`
    let humanResultAdvanced = 0;
    const card = ["Which answer?", ["A", "B", "C", "D"], 0];
    showAnswerResult(state.players[0], true, card, 0, false, () => {
      showAnswerResult(state.players[1], true, card, 0, false, () => humanResultAdvanced++);
    });
  `);
  const aiContinue = game.node("#answer-continue");
  aiContinue.click();
  const humanContinue = game.node("#answer-continue");
  assert.notEqual(humanContinue, aiContinue, "the human has a new popup button");
  await game.advance(game.run("CONFIG.reactionNoticeMs") + 100);
  assert.equal(game.run("humanResultAdvanced"), 0);
  assert.equal(game.node("#modal").classList.contains("show"), true);
  humanContinue.click();
  assert.equal(game.run("humanResultAdvanced"), 1);
});

test("an old AI notice timeout cannot advance the next human notice", async () => {
  const game = loadGame();
  const state = preparePlayers(game);
  state.players[0].human = false;
  game.run(`
    let humanNoticeAdvanced = 0;
    showNotice("AI notice", "Continue early", () => {
      state.current = 1;
      showNotice("Human notice", "Read at your own pace", () => humanNoticeAdvanced++);
    });
  `);
  game.node("#continue-btn").click();
  const humanContinue = game.node("#continue-btn");
  await game.advance(game.run("CONFIG.reactionNoticeMs") + 100);
  assert.equal(game.run("humanNoticeAdvanced"), 0);
  assert.match(game.modalHtml, /Human notice/);
  humanContinue.click();
  assert.equal(game.run("humanNoticeAdvanced"), 1);
});

test("a replaced automatic notice cannot close or run the later notice early", async () => {
  const game = loadGame();
  preparePlayers(game);
  game.run(`
    let oldNoticeCalls = 0, currentNoticeCalls = 0;
    showAutoNotice("Old", "Old reaction", () => oldNoticeCalls++);
  `);
  const noticeDuration = game.run("CONFIG.reactionNoticeMs");
  const replacementAt = Math.floor(noticeDuration / 3);
  await game.advance(replacementAt);
  game.run('showAutoNotice("Current", "Current reaction", () => currentNoticeCalls++);');
  await game.advance(noticeDuration - replacementAt);
  assert.equal(game.run("oldNoticeCalls"), 0);
  assert.equal(game.run("currentNoticeCalls"), 0);
  assert.match(game.modalHtml, /Current/);
  await game.advance(replacementAt);
  assert.equal(game.run("currentNoticeCalls"), 1);
});

test("Push Back and Switch preserve the position immediately before their move", async () => {
  const game = loadGame();
  const state = preparePlayers(game);
  const [player, rival] = state.players;
  player.pos = 8; player.previous = 2;
  rival.pos = 20; rival.previous = 14;
  await game.run("pushBack(state.players[1], state.players[0], () => {});");
  assert.equal(rival.pos, 18);
  assert.equal(rival.previous, 20);
  assert.equal(player.previous, 2);

  game.run("switchPlaces(state.players[1], state.players[0], () => {});");
  assert.equal(player.pos, 18);
  assert.equal(player.previous, 8);
  assert.equal(rival.pos, 8);
  assert.equal(rival.previous, 18);
});

test("a Shielded skill does not change either position history", async () => {
  const game = loadGame();
  const state = preparePlayers(game);
  const [player, rival] = state.players;
  player.pos = 8; player.previous = 2;
  rival.pos = 20; rival.previous = 14; rival.shield = true;
  await game.run("pushBack(state.players[1], state.players[0], () => {});");
  assert.equal(rival.pos, 20);
  assert.equal(rival.previous, 14);
  rival.shield = true;
  game.run("switchPlaces(state.players[1], state.players[0], () => {});");
  assert.deepEqual([player.pos, player.previous, rival.pos, rival.previous], [8, 2, 20, 14]);
});

test("the game continues for two remaining players and shows final standings with one left", async () => {
  const game = loadGame();
  const state = preparePlayers(game, 4);
  game.run("let turnsBegun = []; beginTurn = () => turnsBegun.push(state.current);");
  game.run("winCurrent();");
  assert.equal(state.running, true);
  assert.equal(state.winners.length, 1);
  assert.equal(state.players.filter(player => !player.finished).length, 3);
  await game.advance(3000);
  assert.equal(state.current, 1);
  assert.deepEqual(Array.from(game.run("turnsBegun")), [1]);

  game.run("winCurrent();");
  assert.equal(state.running, true);
  assert.equal(state.winners.length, 2);
  assert.equal(state.players.filter(player => !player.finished).length, 2);
  await game.advance(3000);
  assert.equal(state.current, 2);
  game.run("winCurrent();");
  assert.equal(state.running, false);
  assert.deepEqual(Array.from(state.winners, player => player.name), ["Player 1", "Player 2", "Player 3", "Player 4"]);
  assert.match(game.modalHtml, /podium-celebration/);
  assert.equal(game.pendingTimers, 0, "no AI or movement actions remain after final results");
});

test("turn progression skips finished players across the end of the turn order", async () => {
  const game = loadGame();
  const state = preparePlayers(game, 4);
  state.current = 3;
  state.players[0].finished = true;
  state.players[2].finished = true;
  game.run("let turnsBegun = []; beginTurn = () => turnsBegun.push(state.current); nextTurn();");
  assert.equal(state.current, 1);
  await game.advance(500);
  assert.deepEqual(Array.from(game.run("turnsBegun")), [1]);
});

test("quitting clears player data, inventories, questions, timers, and pending actions", async () => {
  const game = loadGame();
  const state = preparePlayers(game, 4);
  state.players[0].inventory = ["shield", "switch"];
  state.players[0].shield = true;
  state.setupPlayers[0].name = "Private player name";
  state.winners = [state.players[0]];
  state.current = 2;
  state.doubleUsed = true;
  state.bonusRollPending = true;
  state.rollsThisTurn = 2;
  state.movingIndex = 2;
  state.usingStored = true;
  game.run(`
    resetQuestionDecks(); randomizeBoard();
    let lateActions = 0;
    schedule(() => { lateActions++; state.running = true; }, 100);
    state.timer = setInterval(() => lateActions++, 50);
    showAutoNotice("Still playing", "Must be cancelled", () => lateActions++);
    resetGame();
  `);
  assert.equal(state.running, false);
  assert.equal(state.busy, false);
  assert.equal(state.players.length, 0);
  assert.equal(state.winners.length, 0);
  assert.equal(state.current, 0);
  assert.equal(state.movingIndex, null);
  assert.equal(state.doubleUsed, false);
  assert.equal(state.bonusRollPending, false);
  assert.equal(state.rollsThisTurn, 0);
  assert.equal(state.usingStored, false);
  assert.equal(Object.keys(state.boardCategories).length, 0);
  assert.equal(Object.keys(state.questionDecks).length, 0);
  assert.equal(game.run("Object.keys(skills).length"), 0);
  assert.equal(state.setupPlayers.length, 2);
  assert.equal(state.setupPlayers.some(player => player.name), false);
  assert.equal(state.setupPlayers.some(player => player.human), true);
  assert.equal(game.node("#modal").classList.contains("show"), false);
  assert.equal(game.node("#menu-screen").classList.contains("active"), true);
  assert.equal(game.node("#board").innerHTML, "");
  await game.advance(10000);
  assert.equal(game.run("lateActions"), 0);
  assert.equal(state.running, false);
  assert.equal(game.pendingTimers, 0);
});

test("an open modal blocks rolling and consuming a kept skill", async () => {
  const game = loadGame();
  const state = preparePlayers(game);
  state.busy = false;
  state.players[0].inventory = ["shield"];
  game.run('showModal("<h2>Read this first</h2>");');
  assert.equal(game.node("#app").inert, true);
  assert.equal(game.node("#roll-btn").disabled, true);
  assert.equal(game.node("#pause-btn").disabled, true);
  await game.run("rollDice();");
  game.run("useStoredSkill(0);");
  assert.equal(state.rollsThisTurn, 0);
  assert.equal(state.busy, false);
  assert.deepEqual(Array.from(state.players[0].inventory), ["shield"]);
  assert.equal(state.players[0].shield, false);
  assert.match(game.modalHtml, /Read this first/);
  game.run("closeModal();");
  assert.equal(game.node("#app").inert, false);
  assert.equal(game.node("#roll-btn").disabled, false);
  game.run("useStoredSkill(0);");
  assert.equal(state.players[0].inventory.length, 0);
  assert.equal(state.players[0].shield, true);
});

test("scheduled actions from an older game cannot mutate a newer game", async () => {
  const game = loadGame();
  preparePlayers(game);
  game.run(`
    let staleGameActions = 0, currentGameActions = 0;
    schedule(() => { staleGameActions++; state.players[0].pos = 59; }, 100);
    state.gameVersion++;
    schedule(() => currentGameActions++, 100);
  `);
  const originalPosition = game.state.players[0].pos;
  await game.advance(100);
  assert.equal(game.run("staleGameActions"), 0);
  assert.equal(game.run("currentGameActions"), 1);
  assert.equal(game.state.players[0].pos, originalPosition);
  assert.equal(game.state.pendingTimeouts.size, 0);
});

test("missing a challenge after a slide applies the slide's two-tile penalty", () => {
  const game = loadGame();
  const state = preparePlayers(game);
  const [player, rival] = state.players;
  player.pos = 11; player.previous = 24; player.snakeFall = { head: 29, tail: 11 };
  rival.pos = 11; rival.previous = 8;
  game.run(`
    resetQuestionDecks();
    askQuestion = (category, difficulty, player, callback) => callback(player !== state.players[0]);
    runChallenge(state.players[0], state.players[1], () => {}, { questionTile: 29 });
  `);
  assert.equal(player.pos, 9, "a missed slide question must not return the player forward to their dice origin");
  assert.equal(player.snakeFall, null);
  assert.equal(rival.pos, 11);
});

test("a cancelled slide continuation cannot resolve a landing in a newer game", async () => {
  const game = loadGame();
  const state = preparePlayers(game);
  const oldPlayer = state.players[0];
  oldPlayer.pos = 29;
  game.run(`
    let releaseOldSlide, staleLandings = 0;
    animateSlide = () => new Promise(resolve => releaseOldSlide = resolve);
    resolveLanding = () => staleLandings++;
    const oldRoute = applyBoardRoute(state.players[0]);
    state.gameVersion++;
  `);
  state.players = [{ ...state.players[0], pos: 0 }, { ...state.players[1], pos: 0 }];
  game.run("releaseOldSlide();");
  await game.advance(0);
  await game.advance(1000);
  await game.run("oldRoute");
  assert.equal(game.run("staleLandings"), 0);
  assert.equal(oldPlayer.pos, 29, "the cancelled route must stop before committing its destination");
  assert.equal(state.players[0].pos, 0);
});

test("a later collision challenge retains the same arrival's slide penalty", () => {
  const game = loadGame();
  const state = preparePlayers(game, 3);
  const player = state.players[0];
  state.players.forEach(candidate => candidate.pos = 11);
  player.previous = 24;
  player.snakeFall = { head: 29, tail: 11 };
  game.run(`
    resetQuestionDecks();
    let arrivingAnswers = 0;
    showNotice = (title, text, callback) => callback?.();
    askQuestion = (category, difficulty, player, callback) => {
      callback(player !== state.players[0] || ++arrivingAnswers === 1);
    };
    checkChallenge(state.players[0], () => {}, { questionTile: 29 });
  `);
  assert.equal(game.run("arrivingAnswers"), 2);
  assert.equal(player.pos, 9, "the second missed challenge is still part of the original slide landing");
});
