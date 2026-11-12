const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadBoard() {
  const elements = new Map();
  const makeElement = () => {
    const classes = new Set();
    return {
      innerHTML: "", textContent: "", style: {}, dataset: {}, children: [], attributes: {},
      classList: {
        add(...values) { values.forEach(value => classes.add(value)); },
        remove(...values) { values.forEach(value => classes.delete(value)); },
        contains(value) { return classes.has(value); },
        toggle(value, force) { force ? classes.add(value) : classes.delete(value); }
      },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      insertAdjacentHTML(position, html) { this.innerHTML += html; },
      querySelector() { return this.children[0] || null; },
      querySelectorAll() { return this.children; }
    };
  };
  const context = vm.createContext({
    window: { addEventListener() {} },
    document: {
      querySelector(selector) {
        if (!elements.has(selector)) elements.set(selector, makeElement());
        return elements.get(selector);
      },
      querySelectorAll() { return []; }
    },
    setTimeout() { return 1; }, clearTimeout() {}, setInterval() {}, clearInterval() {},
    requestAnimationFrame() {}, console
  });
  for (const file of ["questions-data.js", "additional-questions.js", "legacy-distractors.js", "game.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, file), "utf8"), context, { filename: file });
  }
  const run = source => vm.runInContext(source, context);
  return {
    run, elements,
    setBounds(width, height, gapX, gapY) {
      const bounds = { left: 137, top: 89, width, height, right: 137 + width, bottom: 89 + height };
      const board = elements.get("#board") || makeElement();
      board.offsetLeft = 29; board.offsetTop = 17;
      board.getBoundingClientRect = () => bounds;
      board.children = [];
      const cellWidth = (width - 9 * gapX) / 10;
      const cellHeight = (height - 5 * gapY) / 6;
      for (let pos = 1; pos <= 60; pos++) {
        const placement = run(`boardPlacement(${pos})`);
        const left = bounds.left + (placement.col - 1) * (cellWidth + gapX);
        const top = bounds.top + (placement.row - 1) * (cellHeight + gapY);
        const tile = makeElement();
        tile.dataset.pos = String(pos);
        tile.className = `tile ${run(`tileCategory(${pos})`)}`;
        tile.getBoundingClientRect = () => ({ left, top, width: cellWidth, height: cellHeight, right: left + cellWidth, bottom: top + cellHeight });
        elements.set(`.tile[data-pos="${pos}"]`, tile);
        board.children.push(tile);
      }
      elements.set("#board", board);
      if (!elements.has("#routes-overlay")) elements.set("#routes-overlay", makeElement());
      return { board, bounds };
    }
  };
}

// Sample SVG curves rather than constraining their control points: a designer
// may change the curve formula while retaining the same connected geometry.
function samplePath(d) {
  assert.equal(typeof d, "string");
  assert.ok(d.length > 0);
  assert.doesNotMatch(d, /NaN|Infinity|undefined/);
  const tokens = d.match(/[a-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi) || [];
  const points = [];
  let cursor = [0, 0], start = null, command = null, index = 0;
  const take = count => {
    const values = tokens.slice(index, index += count).map(Number);
    assert.equal(values.length, count, "complete SVG coordinates");
    values.forEach(value => assert.ok(Number.isFinite(value), "finite SVG coordinates"));
    return values;
  };
  const put = point => { cursor = point; points.push(point); };
  while (index < tokens.length) {
    if (/^[a-z]$/i.test(tokens[index])) command = tokens[index++];
    assert.ok(command, "SVG path starts with a command");
    const relative = command === command.toLowerCase();
    const origin = [...cursor];
    const point = (x, y) => relative ? [origin[0] + x, origin[1] + y] : [x, y];
    switch (command.toUpperCase()) {
      case "M": {
        const [x, y] = take(2); put(point(x, y)); start = [...cursor];
        command = relative ? "l" : "L";
        break;
      }
      case "L": { const [x, y] = take(2); put(point(x, y)); break; }
      case "H": { const [x] = take(1); put([relative ? origin[0] + x : x, origin[1]]); break; }
      case "V": { const [y] = take(1); put([origin[0], relative ? origin[1] + y : y]); break; }
      case "C": {
        const [a, b, c, e, x, y] = take(6);
        const c1 = point(a, b), c2 = point(c, e), end = point(x, y);
        for (let step = 1; step <= 80; step++) {
          const t = step / 80, u = 1 - t;
          points.push([0, 1].map(axis => u ** 3 * origin[axis] + 3 * u * u * t * c1[axis] + 3 * u * t * t * c2[axis] + t ** 3 * end[axis]));
        }
        cursor = end; break;
      }
      case "Q": {
        const [a, b, x, y] = take(4), control = point(a, b), end = point(x, y);
        for (let step = 1; step <= 80; step++) {
          const t = step / 80, u = 1 - t;
          points.push([0, 1].map(axis => u * u * origin[axis] + 2 * u * t * control[axis] + t * t * end[axis]));
        }
        cursor = end; break;
      }
      case "Z": assert.ok(start); put([...start]); command = null; break;
      default: assert.fail(`Unsupported path command ${command}; extend the geometric sampler for this SVG command`);
    }
  }
  return { points, start: points[0], end: cursor };
}

const closePoint = (actual, expected) => Math.hypot(actual[0] - expected[0], actual[1] - expected[1]) < 1e-6;
function assertEnds(pathData, first, second) {
  const sampled = samplePath(pathData);
  assert.ok(
    (closePoint(sampled.start, first) && closePoint(sampled.end, second)) ||
    (closePoint(sampled.start, second) && closePoint(sampled.end, first)),
    `path endpoints ${JSON.stringify([sampled.start, sampled.end])} connect ${JSON.stringify([first, second])}`
  );
}

test("all sixty numbered tiles occupy unique adjacent cells with five alternating row turns", () => {
  const board = loadBoard();
  const placements = Array.from({ length: 60 }, (_, index) => board.run(`boardPlacement(${index + 1})`));
  assert.equal(new Set(placements.map(({ row, col }) => `${row}/${col}`)).size, 60);
  const turns = [];
  placements.forEach((cell, index) => {
    assert.ok(cell.row >= 1 && cell.row <= 6 && cell.col >= 1 && cell.col <= 10);
    if (!index) return;
    const previous = placements[index - 1];
    assert.equal(Math.abs(cell.row - previous.row) + Math.abs(cell.col - previous.col), 1, `${index}→${index + 1} stays adjacent`);
    if (cell.row !== previous.row) turns.push([index, index + 1, cell.col]);
  });
  assert.deepEqual(turns, [[10, 11, 10], [20, 21, 1], [30, 31, 10], [40, 41, 1], [50, 51, 10]]);
  assert.deepEqual([placements[0].row, placements[0].col, placements[59].row, placements[59].col], [6, 1, 1, 1]);
});

for (const [label, width, height, gapX, gapY] of [["wide", 880, 740, 6, 6], ["narrow", 480, 560, 4, 4]]) {
  test(`${label} overlays and slide endpoints use board coordinates at a nonzero screen offset`, () => {
    const game = loadBoard();
    const { board, bounds } = game.setBounds(width, height, gapX, gapY);
    game.run(`
      state.players = [{ name: "Poppy", pos: 18, previous: 12, inventory: ["shield"], shield: true }, { name: "Boba", pos: 30, previous: 25, inventory: [], shield: false }];
      state.current = 1;
      state.boardCategories = { 1: "math", 10: "logic", 11: "general", 60: "famous" };
      skills = { 8: "shield", 21: "push" };
      resetQuestionDecks();
    `);
    const gameplaySnapshot = () => game.run("JSON.stringify({ players: state.players, current: state.current, categories: state.boardCategories, skills, decks: state.questionDecks })");
    const beforeDrawing = gameplaySnapshot();
    game.run("drawRoutes();");
    assert.equal(gameplaySnapshot(), beforeDrawing, "drawing the board does not alter positions, inventories, skills, categories, turns, or question piles");
    const overlay = game.elements.get("#routes-overlay");
    assert.equal(overlay.attributes.viewBox, `0 0 ${width} ${height}`);
    assert.equal(overlay.style.left, `${board.offsetLeft}px`);
    assert.equal(overlay.style.top, `${board.offsetTop}px`);
    assert.equal(overlay.style.width, `${width}px`);
    assert.equal(overlay.style.height, `${height}px`);
    const svg = game.elements.get("#routes-overlay").innerHTML;
    const routes = [...svg.matchAll(/<g class="slide-route" data-slide-from="(\d+)">([\s\S]*?)<\/g>/g)];
    assert.equal(routes.length, 4);
    const destinations = game.run("snakes");
    const center = pos => {
      const rect = game.elements.get(`.tile[data-pos="${pos}"]`).getBoundingClientRect();
      return [rect.left - bounds.left + rect.width / 2, rect.top - bounds.top + rect.height / 2];
    };
    for (const [, start, group] of routes) {
      const pathData = group.match(/<path class="route-slide-body" d="([^"]+)"/)[1];
      assertEnds(pathData, center(Number(start)), center(destinations[start]));
      const motion = samplePath(pathData);
      assert.ok(motion.points.every((point, index) => !index || point[1] >= motion.points[index - 1][1]), "rider only travels down toward the destination");
      assert.ok(motion.points.every(([x, y]) => x >= 0 && x <= width && y >= 0 && y <= height), "slide stays inside the board");
    }
  });
}
