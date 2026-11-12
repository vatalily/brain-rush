const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = __dirname;

function loadGame({ manualTimers = false } = {}) {
  const elements = new Map();
  const makeElement = () => {
    const classes = new Set();
    return {
      innerHTML: "", textContent: "", disabled: false, style: {},
      classList: {
        add: name => classes.add(name),
        remove: name => classes.delete(name),
        contains: name => classes.has(name),
        toggle: (name, force) => force ? classes.add(name) : classes.delete(name)
      },
      setAttribute() {},
      click() { if (!this.disabled) this.onclick?.(); },
      querySelector() { return this; },
      scrollTop: 0
    };
  };
  let nextTimer = 0;
  let virtualTime = 0;
  const scheduled = new Map();
  const context = vm.createContext({
    window: { addEventListener() {} },
    document: {
      querySelector(selector) {
        if (!elements.has(selector)) elements.set(selector, makeElement());
        return elements.get(selector);
      },
      querySelectorAll() { return []; }
    },
    setTimeout(callback, ms = 0) {
      const id = ++nextTimer;
      if (manualTimers) scheduled.set(id, { callback, time: virtualTime + ms });
      else queueMicrotask(callback);
      return id;
    },
    clearTimeout(id) { scheduled.delete(id); }, setInterval() {}, clearInterval() {},
    requestAnimationFrame() {}, console
  });
  vm.runInContext(fs.readFileSync(path.join(root, "questions-data.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(root, "additional-questions.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(root, "legacy-distractors.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(root, "game.js"), "utf8"), context);
  const runNextTimer = () => {
    const next = [...scheduled].sort((a, b) => a[1].time - b[1].time || a[0] - b[0])[0];
    if (!next) return false;
    scheduled.delete(next[0]);
    virtualTime = next[1].time;
    next[1].callback();
    return true;
  };
  return { context, elements, run: source => vm.runInContext(source, context), runNextTimer, pendingTimers: () => scheduled.size };
}

function prepareEffects(game) {
  game.context.events = [];
  game.run(`render = () => {};
    closeModal = () => {};
    showAutoNotice = (title, text, callback) => { events.push(title); callback?.(); };
    askLandingQuestion = (player, tile) => { events.push(["question", tile]); };
    rollDice = () => { events.push("roll"); };`);
  const state = game.run("state");
  state.running = true;
  state.players = [
    { name: "P1", pos: 0, previous: 0, human: true, shield: false, inventory: [], finished: false },
    { name: "P2", pos: 0, previous: 0, human: false, shield: false, inventory: [], finished: false }
  ];
  return state;
}

test("question piles contain distinct, valid cards and reset without repeats", () => {
  const game = loadGame();
  const questions = game.run("questions");
  const allPrompts = [];
  for (const category of game.run("categories")) {
    for (const difficulty of ["easy", "medium", "hard", "epic"]) {
      const cards = questions[category][difficulty];
      assert.ok(cards.length >= 3, `${category}/${difficulty} needs a usable pile (found ${cards.length})`);
      assert.equal(new Set(cards.map(card => card[0].trim().toLowerCase())).size, cards.length);
      cards.forEach(([question, options, answer]) => {
        assert.ok(question);
        allPrompts.push(question.trim().toLowerCase());
        assert.equal(options.length, 4);
        assert.equal(new Set(options).size, 4);
        assert.ok(answer >= 0 && answer < 4);
      });
    }
  }
  assert.equal(new Set(allPrompts).size, allPrompts.length, "a question should not appear in multiple piles");
  const answersByPrompt = new Map();
  for (const category of game.run("categories")) {
    for (const difficulty of ["easy", "medium", "hard", "epic"]) {
      questions[category][difficulty].forEach(([prompt, options, answer]) => answersByPrompt.set(prompt, options[answer]));
    }
  }
  game.run("resetQuestionDecks()");
  for (const category of game.run("categories")) {
    for (const difficulty of ["easy", "medium", "hard", "epic"]) {
      game.run("state.questionDecks")[category][difficulty].forEach(([prompt, options, answer]) => {
        assert.equal(options[answer], answersByPrompt.get(prompt), `reshuffled answer changed for ${prompt}`);
      });
    }
  }
  const pile = game.run("state.questionDecks.math.epic");
  const size = pile.length;
  const drawn = Array.from({ length: size }, () => game.run('randomQuestion("math", "epic")'));
  assert.equal(new Set(drawn.map(card => card[0])).size, size);
  assert.equal(game.run('randomQuestion("math", "epic")'), null);
  game.run("resetQuestionDecks()");
  assert.equal(game.run("state.questionDecks.math.epic.length"), size);
});

test("additional cards, legacy choices, and serpentine board order are complete", () => {
  const game = loadGame();
  const extra = game.run("window.ADDITIONAL_QUESTIONS");
  const legacy = game.run("window.LEGACY_DISTRACTORS");
  const prepared = game.run("preparedQuestionBank");
  const active = game.run("questions");
  let total = 0;
  for (const category of game.run("categories")) {
    const categoryCount = Object.values(extra[category]).reduce((sum, cards) => sum + cards.length, 0);
    assert.equal(categoryCount, 40, `${category} additional cards`);
    if (category !== "math") assert.equal(legacy[category]?.length, 30, `${category} legacy choices`);
    assert.equal(Object.values(prepared[category]).reduce((sum, cards) => sum + cards.length, 0), 30, `${category} prepared cards`);
    for (const difficulty of ["easy", "medium", "hard", "epic"]) {
      for (const [prompt] of extra[category][difficulty]) {
        assert.ok(active[category][difficulty].some(([activePrompt]) => activePrompt === prompt), `missing ${category}/${difficulty}: ${prompt}`);
      }
    }
    total += categoryCount;
  }
  assert.equal(total, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(game.run("boardPlacement(1)"))), { row: 6, col: 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(game.run("boardPlacement(10)"))), { row: 6, col: 10 });
  assert.deepEqual(JSON.parse(JSON.stringify(game.run("boardPlacement(11)"))), { row: 5, col: 10 });
  assert.deepEqual(JSON.parse(JSON.stringify(game.run("boardPlacement(20)"))), { row: 5, col: 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(game.run("boardPlacement(60)"))), { row: 1, col: 1 });
});

test("stored skills wait until they have a useful target", () => {
  const game = loadGame();
  const state = prepareEffects(game);
  const [player, rival] = state.players;
  player.inventory = ["shield", "push", "switch", "double"];
  player.shield = true;
  assert.equal(game.run('canUseSkillNow("shield", state.players[0])'), false);
  assert.equal(game.run('canUseSkillNow("push", state.players[0])'), false);
  assert.equal(game.run('canUseSkillNow("switch", state.players[0])'), false);
  assert.equal(game.run('canUseSkillNow("double", state.players[0])'), true);
  rival.pos = 5;
  assert.equal(game.run('canUseSkillNow("push", state.players[0])'), true);
  assert.equal(game.run('canUseSkillNow("switch", state.players[0])'), true);
  state.doubleUsed = true;
  assert.equal(game.run('canUseSkillNow("double", state.players[0])'), false);
  assert.deepEqual(Array.from(player.inventory), ["shield", "push", "switch", "double"]);
});

test("eight named characters have portraits and personalities", () => {
  const game = loadGame();
  const characters = game.run("characters");
  assert.equal(characters.length, 8);
  assert.equal(new Set(characters.map(character => character.name)).size, 8);
  characters.forEach(character => {
    assert.ok(character.personality);
    assert.ok(fs.existsSync(path.join(root, character.file)), character.file);
  });
});

test("Shield stops a snake and the landing tile supplies the question", async () => {
  const game = loadGame();
  const state = prepareEffects(game);
  const player = state.players[0];
  player.pos = 29; player.shield = true;
  await game.run("applyBoardRoute(state.players[0])");
  assert.equal(player.pos, 29);
  assert.equal(player.shield, false);
  assert.equal(player.snakeFall, null);
  assert.deepEqual(Array.from(game.context.events.at(-1)), ["question", 29]);

  game.context.events.length = 0;
  await game.run("applyBoardRoute(state.players[0])");
  assert.equal(player.pos, 11);
  assert.equal(player.snakeFall.head, 29);
  assert.equal(player.snakeFall.tail, 11);
  assert.deepEqual(Array.from(game.context.events.at(-1)), ["question", 29]);
});

for (const human of [true, false]) {
  test(`${human ? "human" : "AI"} Shields auto-pocket without a choice or losing a kept skill`, async () => {
    const game = loadGame();
    const state = prepareEffects(game);
    const player = state.players[0];
    player.human = human;
    player.inventory = ["push", "switch", "double"];
    player.pos = 20;
    game.run('showModal = () => { throw new Error("Shield must not ask Use/Keep"); };');
    await game.run('activateSkill("shield", state.players[0], () => events.push("acquired"))');
    assert.equal(player.shield, true);
    assert.deepEqual(Array.from(player.inventory), ["push", "switch", "double"]);
    assert.equal(game.context.events.filter(event => event === "acquired").length, 1);

    // Another Shield refreshes the existing protection, never stacks a second charge.
    await game.run('activateSkill("shield", state.players[0], () => events.push("acquired"))');
    assert.equal(player.shield, true);
    assert.deepEqual(Array.from(player.inventory), ["push", "switch", "double"]);
    assert.ok(game.context.events.includes("STILL BONK-PROOF!"));
    await game.run('pushBack(state.players[0], state.players[1], () => events.push("blocked"))');
    assert.equal(player.pos, 20);
    assert.equal(player.shield, false);
    await game.run('pushBack(state.players[0], state.players[1], () => events.push("moved"))');
    assert.equal(player.pos, 18);
    assert.equal(player.shield, false);
    assert.deepEqual(Array.from(player.inventory), ["push", "switch", "double"]);
  });
}

test("pocketed Shield is shown as passive protection rather than an activation button", async () => {
  const game = loadGame();
  const state = prepareEffects(game);
  const player = state.players[0];
  await game.run('activateSkill("shield", state.players[0], () => {})');
  game.run("renderSkillTray()");
  let tray = game.elements.get("#skill-tray").innerHTML;
  assert.match(tray, /Shield ready/);
  assert.doesNotMatch(tray, /<button|data-use-stored/);
  await game.run('pushBack(state.players[0], state.players[1], () => {})');
  game.run("renderSkillTray()");
  assert.equal(game.elements.get("#skill-tray").innerHTML, "");
  assert.equal(player.shield, false);
});

test("wrong answer after a snake slide moves two more tiles back from the tail", async () => {
  const game = loadGame();
  const state = prepareEffects(game);
  const player = state.players[0];
  player.pos = 29; player.previous = 24;
  game.run('nextTurn = () => events.push("next")');
  await game.run("applyBoardRoute(state.players[0])");
  assert.equal(player.pos, 11);
  await game.run('handleWrong(state.players[0], "Not quite!")');
  assert.equal(player.pos, 9);
  assert.equal(player.snakeFall, null);
  assert.ok(game.context.events.includes("SLIDE OOPS!"));
  assert.ok(game.context.events.includes("next"));
});

test("a Shielded snake does not slide or incur the extra snake penalty", async () => {
  const game = loadGame();
  const state = prepareEffects(game);
  const player = state.players[0];
  player.pos = 29; player.previous = 24; player.shield = true;
  game.run('nextTurn = () => events.push("next")');
  await game.run("applyBoardRoute(state.players[0])");
  assert.equal(player.pos, 29);
  assert.equal(player.shield, false);
  await game.run('handleWrong(state.players[0], "Not quite!")');
  assert.equal(player.pos, 24);
  assert.equal(player.snakeFall, null);
  assert.ok(!game.context.events.includes("SLIDE OOPS!"));
});

test("Shield blocks a wrong-answer penalty if it is active after a snake slide", async () => {
  const game = loadGame();
  const state = prepareEffects(game);
  const player = state.players[0];
  player.pos = 11; player.previous = 24; player.shield = true;
  player.snakeFall = { head: 29, tail: 11 };
  game.run('checkChallenge = () => events.push("challenge checked")');
  await game.run('handleWrong(state.players[0], "Not quite!")');
  assert.equal(player.pos, 11);
  assert.equal(player.shield, false);
  assert.equal(player.snakeFall, null);
  assert.ok(game.context.events.includes("BONK BLOCKED!"));
  assert.ok(!game.context.events.includes("SLIDE OOPS!"));
});

test("Shield stops both opponent skills and is consumed once", () => {
  const game = loadGame();
  const state = prepareEffects(game);
  const [attacker, target] = state.players;
  attacker.pos = 8; target.pos = 20; target.shield = true;
  game.run("pushBack(state.players[1], state.players[0], () => {})");
  assert.equal(target.pos, 20);
  assert.equal(target.shield, false);
  game.run("pushBack(state.players[1], state.players[0], () => {})");
  assert.equal(target.pos, 18);

  target.shield = true;
  game.run("switchPlaces(state.players[1], state.players[0], () => {})");
  assert.equal(attacker.pos, 8);
  assert.equal(target.pos, 18);
  assert.equal(target.shield, false);
  game.run("switchPlaces(state.players[1], state.players[0], () => {})");
  assert.equal(attacker.pos, 18);
  assert.equal(target.pos, 8);
});

test("a kept Double Roll provides a normal roll and then a bonus roll", async () => {
  const game = loadGame();
  const state = prepareEffects(game);
  state.busy = true;
  state.rollsThisTurn = 0;
  game.run('executeSkill("double", state.players[0], () => {})');
  assert.equal(state.doubleUsed, true);
  assert.equal(state.bonusRollPending, true);
  assert.equal(game.context.events.filter(event => event === "roll").length, 1);
  game.run("nextTurn()");
  await new Promise(setImmediate);
  assert.equal(game.context.events.filter(event => event === "roll").length, 2);
  assert.equal(state.bonusRollPending, false);
  assert.equal(state.current, 0);
});

test("a tile Double Roll begins its extra roll immediately and cannot chain", () => {
  const game = loadGame();
  const state = prepareEffects(game);
  state.busy = true;
  state.rollsThisTurn = 1;
  game.run('executeSkill("double", state.players[0], () => {})');
  assert.equal(game.context.events.filter(event => event === "roll").length, 1);
  assert.equal(state.bonusRollPending, false);
  game.run('executeSkill("double", state.players[0], () => { events.push("done"); })');
  assert.deepEqual(Array.from(game.context.events), ["roll", "done"]);
});

test("Shield covers a wrong answer and a Rainbow chooses its question now", async () => {
  const game = loadGame();
  const realLandingQuestion = game.run("askLandingQuestion");
  const state = prepareEffects(game);
  game.context.realLandingQuestion = realLandingQuestion;
  const player = state.players[0];
  player.pos = 6; player.previous = 0; player.shield = true;
  game.run(`checkChallenge = () => { events.push("challenge checked"); };
    chooseCategory = (player, callback) => callback("logic");
    askQuestion = (category, difficulty) => events.push([category, difficulty]);
    skills[6] = "rainbow";`);
  await game.run("handleWrong(state.players[0])");
  assert.equal(player.pos, 6);
  assert.equal(player.shield, false);
  assert.ok(game.context.events.includes("challenge checked"));
  game.run("askLandingQuestion = realLandingQuestion; askLandingQuestion(state.players[0])");
  assert.deepEqual(Array.from(game.context.events.at(-1)), ["logic", "easy"]);
});

test("a challenge draws separate cards from the same pile", () => {
  const game = loadGame();
  const state = prepareEffects(game);
  state.players[0].pos = state.players[1].pos = 46;
  state.players[0].previous = 40;
  state.players[1].previous = 43;
  game.run(`resetQuestionDecks();
    showNotice = (title, text, callback) => callback?.();
    askQuestion = (category, difficulty, player, callback, card) => {
      events.push([category, difficulty, card[0]]);
      callback(true);
    };`);
  game.run("runChallenge(state.players[0], state.players[1], () => {})");
  const draws = game.context.events.map(event => Array.from(event));
  assert.equal(draws.length, 2);
  assert.equal(draws[0][0], draws[1][0]);
  assert.equal(draws[0][1], "epic");
  assert.equal(draws[1][1], "epic");
  assert.notEqual(draws[0][2], draws[1][2]);
  assert.equal(state.players[0].pos, 46);
  assert.equal(state.players[1].pos, 46);
});

test("challenge wrong answers return each player to their own previous tile unless Shielded", () => {
  const game = loadGame();
  const state = prepareEffects(game);
  state.players[0].pos = state.players[1].pos = 24;
  state.players[0].previous = 18;
  state.players[1].previous = 20;
  state.players[1].shield = true;
  game.run(`resetQuestionDecks();
    showNotice = (title, text, callback) => callback?.();
    askQuestion = (category, difficulty, player, callback) => callback(false);`);
  game.run("runChallenge(state.players[0], state.players[1], () => {})");
  assert.equal(state.players[0].pos, 18);
  assert.equal(state.players[1].pos, 24);
  assert.equal(state.players[1].shield, false);
});

test("landing on a shared tile challenges instead of drawing an extra ordinary question", async () => {
  const game = loadGame();
  const state = prepareEffects(game);
  state.players[0].pos = state.players[1].pos = 7;
  game.run(`skills[7] = "double";
    checkChallenge = (player, callback) => { events.push("challenge"); callback(); };
    activateSkill = (skill) => { events.push(skill); };`);
  await game.run("resolveLanding(state.players[0])");
  assert.deepEqual(game.context.events, ["challenge", "double"]);
});

test("an unshared route landing asks the original tile question exactly once", async () => {
  const game = loadGame();
  game.context.landingQuestion = game.run("askLandingQuestion");
  const state = prepareEffects(game);
  state.players[0].pos = 11;
  game.run(`askLandingQuestion = landingQuestion;
    askQuestion = (category, difficulty) => events.push([category, difficulty]);
    skills = {};`);
  await game.run("resolveLanding(state.players[0], 58)");
  assert.equal(game.context.events.length, 1);
  assert.deepEqual(Array.from(game.context.events[0]), [game.run("tileCategory(58)"), "epic"]);
});

test("a challenge that moves the arriving player does not award the original tile skill", async () => {
  const game = loadGame();
  const state = prepareEffects(game);
  state.players[0].pos = state.players[1].pos = 7;
  state.players[0].previous = 2;
  game.run(`skills[7] = "double";
    nextTurn = () => events.push("next");
    checkChallenge = (player, callback) => {
      events.push("challenge"); player.pos = player.previous; callback();
    };
    activateSkill = (skill) => events.push(skill);`);
  await game.run("resolveLanding(state.players[0])");
  assert.equal(state.players[0].pos, 2);
  assert.deepEqual(game.context.events, ["challenge", "next"]);
});

test("every occupant on a shared tile receives a challenge", async () => {
  const game = loadGame();
  const state = prepareEffects(game);
  state.players[0].pos = state.players[1].pos = 24;
  state.players.push(
    { name: "P3", pos: 24, previous: 18, shield: false, finished: false },
    { name: "P4", pos: 12, previous: 5, shield: false, finished: false }
  );
  game.run(`showNotice = (title, text, callback) => callback();
    runChallenge = (challenger, rival, after) => {
      events.push(rival.name); after();
    };`);
  await game.run('checkChallenge(state.players[0], () => events.push("done"))');
  assert.deepEqual(game.context.events, ["P2", "P3", "done"]);
});

test("remaining occupants are not challenged after the arriving player bounces away", async () => {
  const game = loadGame();
  const state = prepareEffects(game);
  state.players[0].pos = state.players[1].pos = 24;
  state.players[0].previous = 18;
  state.players.push({ name: "P3", pos: 24, previous: 19, shield: false, finished: false });
  game.run(`showNotice = (title, text, callback) => callback();
    runChallenge = (challenger, rival, after) => {
      events.push(rival.name); challenger.pos = challenger.previous; after();
    };`);
  await game.run('checkChallenge(state.players[0], () => events.push("done"))');
  assert.deepEqual(game.context.events, ["P2", "done"]);
  assert.equal(state.players[0].pos, 18);
});

test("a route collision keeps the question difficulty of the original landing tile", async () => {
  const game = loadGame();
  const state = prepareEffects(game);
  state.players[0].pos = state.players[1].pos = 11;
  game.run(`resetQuestionDecks();
    showNotice = (title, text, callback) => callback();
    askQuestion = (category, difficulty, player, callback, card) => {
      events.push([category, difficulty, card[0]]); callback(true);
    };`);
  await game.run('checkChallenge(state.players[0], () => {}, { questionTile: 58 })');
  const draws = game.context.events.map(event => Array.from(event));
  assert.equal(draws.length, 2);
  assert.equal(draws[0][0], draws[1][0]);
  assert.equal(draws[0][1], "epic");
  assert.equal(draws[1][1], "epic");
  assert.notEqual(draws[0][2], draws[1][2]);
});

test("an exhausted pile still resolves the landing rather than skipping skills and collisions", () => {
  const game = loadGame();
  const state = prepareEffects(game);
  state.players[0].pos = 46;
  game.run(`state.questionDecks = { math: { epic: [] } };
    handleCorrect = player => events.push(["landing resolved", player.pos]);
    nextTurn = () => events.push("turn skipped");`);
  game.run('askQuestion("math", "epic", state.players[0])');
  assert.deepEqual(Array.from(game.context.events.at(-1)), ["landing resolved", 46]);
  assert.ok(!game.context.events.includes("turn skipped"));
  assert.equal(game.run('remainingQuestionCards("math", "epic")'), 0);
});

test("an exhausted callback question advances its challenge without penalizing the player", () => {
  const game = loadGame();
  prepareEffects(game);
  game.run(`state.questionDecks = { logic: { hard: [] } };
    nextTurn = () => events.push("turn skipped");`);
  game.run('askQuestion("logic", "hard", state.players[0], correct => events.push(correct))');
  assert.equal(game.context.events.at(-1), true);
  assert.ok(!game.context.events.includes("turn skipped"));
  assert.equal(game.run('remainingQuestionCards("logic", "hard")'), 0);
});

async function simulateCompleteGame(playerCount, seed, allHuman = false) {
  const game = loadGame({ manualTimers: true });
  const state = game.run("state");
  const stats = { rolls: 0, questions: 0, challenges: 0, routes: 0, wrongAnswers: 0, kept: 0, skills: new Set() };
  const drawnPrompts = new Set();
  let randomState = seed >>> 0;
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 4294967296;
  };
  const label = `${playerCount} players / seed ${seed}`;
  state.players = Array.from({ length: playerCount }, (_, i) => ({
    name: `P${i + 1}`, avatar: i, pos: 0, previous: 0, snakeFall: null,
    human: allHuman || i % 2 === 0, aiDifficulty: ["friendly", "normal", "clever"][i % 3],
    shield: false, finished: false, inventory: []
  }));
  state.running = true;
  state.soundEnabled = false;
  game.context.simStats = stats;
  game.context.seededRandom = random;
  game.context.noteDraw = card => {
    if (!card) return;
    const prompt = card[0].trim().toLowerCase();
    assert.ok(!drawnPrompts.has(prompt), `${label}: repeated question ${card[0]}`);
    drawnPrompts.add(prompt);
  };
  game.context.checkSimulationState = () => {
    assert.ok(state.current >= 0 && state.current < playerCount, `${label}: invalid current player`);
    assert.equal(new Set(state.winners).size, state.winners.length, `${label}: duplicate finishing place`);
    for (const player of state.players) {
      assert.ok(Number.isInteger(player.pos) && player.pos >= 0 && player.pos <= 60, `${label}: invalid position for ${player.name}`);
      assert.ok(Number.isInteger(player.previous) && player.previous >= 0 && player.previous <= 60, `${label}: invalid previous tile`);
      assert.ok(player.inventory.length <= 3, `${label}: inventory over capacity`);
      assert.ok(!player.inventory.includes("rainbow"), `${label}: Rainbow was incorrectly kept`);
    }
    state.winners.forEach(player => assert.ok(player.finished, `${label}: unfinished podium player`));
  };
  game.run(`
    Math.random = seededRandom;
    render = checkSimulationState;
    const simulationDraw = randomQuestion;
    randomQuestion = (...args) => {
      const card = simulationDraw(...args); noteDraw(card); return card;
    };
    showAutoNotice = (title, text, callback) => { closeModal(); callback?.(); };
    showNotice = (title, text, callback) => { closeModal(); callback?.(); };
    showAnswerResult = (player, correct, card, choice, timedOut, callback) => {
      if (!correct) simStats.wrongAnswers++;
      closeModal(); callback?.();
    };
    const simulationModal = showModal;
    showModal = html => {
      simulationModal(html);
      if (html.includes('id="keep-skill"')) {
        const use = html.includes('id="use-skill"') && Math.random() < .65;
        if (!use) simStats.kept++;
        scheduleModal(() => $(use ? "#use-skill" : "#keep-skill").click(), 1);
      }
    };
    chooseCategory = (player, callback, difficulty = tileDifficulty(player.pos), needed = 1) => {
      const available = categories.filter(category => remainingQuestionCards(category, difficulty) >= needed);
      callback(available[Math.floor(Math.random() * available.length)] || tileCategory(player.pos));
    };
    chooseOpponent = (player, prompt, callback, eligible = () => true, onNoTarget = nextTurn) => {
      const targets = state.players.filter(rival => rival !== player && !rival.finished && eligible(rival));
      targets.sort((a, b) => b.pos - a.pos);
      targets.length ? callback(targets[0]) : onNoTarget();
    };
    buildQuestionPopup = (category, difficulty, player, card, interactive) => {
      simStats.questions++;
      const buttons = card[1].map(() => ({ disabled: !interactive, classList: { add() {} } }));
      const answers = {
        querySelectorAll: () => buttons,
        querySelector: selector => buttons[Number(selector.match(/\\d+/)?.[0])]
      };
      openModal();
      if (interactive) {
        const correct = Math.random() < ({ easy: .9, medium: .85, hard: .8, epic: .75 })[difficulty];
        const choice = correct ? card[2] : (card[2] + 1) % 4;
        schedule(() => buttons[choice].onclick(), 10);
      }
      return { answers, buttons, timer: $(".timer") };
    };
    const simulationChallenge = runChallenge;
    runChallenge = (...args) => { simStats.challenges++; return simulationChallenge(...args); };
    const simulationRoute = applyBoardRoute;
    applyBoardRoute = (...args) => { simStats.routes++; return simulationRoute(...args); };
    const simulationSkill = executeSkill;
    executeSkill = (skill, ...args) => { simStats.skills.add(skill); return simulationSkill(skill, ...args); };
    rollDice = () => {
      if (!state.running || state.busy || $("#modal").classList.contains("show")) return;
      if (state.players[state.current].finished) throw new Error("A finished player took another turn");
      if (++simStats.rolls > 500) throw new Error("Game did not finish within 500 rolls");
      state.busy = true; state.rollsThisTurn++;
      return moveCurrent(2 + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6));
    };
    randomizeBoard(); resetQuestionDecks(); beginTurn();
  `);
  let steps = 0;
  while (state.running && steps++ < 15000) {
    if (!game.runNextTimer()) {
      assert.ok(!state.busy, `${label}: game stalled while resolving a turn`);
      assert.ok(!game.elements.get("#modal")?.classList.contains("show"), `${label}: unanswered dialog`);
      const player = state.players[state.current];
      assert.ok(player.human, `${label}: AI failed to schedule its next action`);
      const skillIndex = game.run("state.players[state.current].inventory.findIndex(skill => canUseSkillNow(skill, state.players[state.current]))");
      if (skillIndex >= 0 && random() < .65) game.run(`useStoredSkill(${skillIndex})`);
      else game.run("rollDice()");
    }
    // Drain promise continuations between virtual timer steps, without waiting for wall-clock animations.
    await new Promise(setImmediate);
    game.context.checkSimulationState();
  }
  assert.ok(!state.running, `${label}: game exceeded the action limit`);
  assert.equal(state.winners.length, playerCount, `${label}: incomplete standings`);
  assert.equal(new Set(state.winners).size, playerCount, `${label}: standings repeat a player`);
  state.winners.slice(0, -1).forEach(player => assert.equal(player.pos, 60, `${label}: podium finisher did not reach the finish`));
  assert.equal(state.players.filter(player => player.pos < 60).length, 1, `${label}: game should end with one player left on the board`);
  assert.ok(stats.rolls > playerCount && stats.questions > playerCount, `${label}: game did not exercise ordinary turns`);
  assert.equal(game.pendingTimers(), 0, `${label}: actions remain scheduled after the final podium`);
  const cardsLeft = game.run("Object.values(state.questionDecks).flatMap(bank => Object.values(bank)).reduce((total, pile) => total + pile.length, 0)");
  const cardsInitially = game.run("Object.values(questions).flatMap(bank => Object.values(bank)).reduce((total, pile) => total + pile.length, 0)");
  assert.equal(cardsInitially - cardsLeft, drawnPrompts.size, `${label}: deck accounting differs from unique draws`);
  return stats;
}

test("seeded complete games preserve decks, skills, movement, and final standings for 2–4 players", async () => {
  const totals = { challenges: 0, routes: 0, wrongAnswers: 0, kept: 0, skills: new Set() };
  for (const playerCount of [2, 3, 4]) {
    for (const seed of [1, 42, 2026]) {
      const stats = await simulateCompleteGame(playerCount, seed, seed === 42);
      for (const key of ["challenges", "routes", "wrongAnswers", "kept"]) totals[key] += stats[key];
      stats.skills.forEach(skill => totals.skills.add(skill));
    }
  }
  assert.ok(totals.challenges > 0, "simulations should exercise same-tile challenges");
  assert.ok(totals.routes > 0, "simulations should exercise ladders and slides");
  assert.ok(totals.wrongAnswers > 0, "simulations should exercise answer penalties");
  assert.ok(totals.kept > 0, "simulations should exercise skill storage");
  assert.deepEqual([...totals.skills].sort(), ["double", "push", "shield", "switch"]);
});
