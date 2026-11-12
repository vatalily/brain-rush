const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "data/additional-questions-source.txt"), "utf8");
const lines = source.split(/\r?\n/).map(line => line.trim());
const categoryFor = { R: "famous", Y: "math", G: "general", B: "movie", P: "logic" };
const levels = ["easy", "medium", "hard", "epic"];
const bank = Object.fromEntries(Object.values(categoryFor).map(category => [category, Object.fromEntries(levels.map(level => [level, []]))]));
const cards = new Map();
const keys = new Map();
let inAnswerKey = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith("Answer Key")) inAnswerKey = true;
  if (lines[i] === "Selected logic explanations") break;
  if (inAnswerKey) {
    const answer = lines[i].match(/^([RYGBP])(\d{2})\s+([ABCD])\s+(.+)$/);
    if (answer) keys.set(`${answer[1]}${answer[2]}`, { index: "ABCD".indexOf(answer[3]), text: answer[4] });
    continue;
  }
  const heading = lines[i].match(/^([RYGBP])(\d{2})\s+\[(Easy|Medium|Hard|Epic)\]\s+(.+)$/);
  if (heading) {
    const [, prefix, number, level, question] = heading;
    const id = `${prefix}${number}`;
    if (cards.has(id)) throw new Error(`Duplicate question ${id}`);
    const choices = [];
    for (let optionIndex = 0; optionIndex < 4; optionIndex++) {
      const option = lines[i + optionIndex + 1]?.match(/^([ABCD])\.\s+(.+)$/);
      if (!option || option[1] !== "ABCD"[optionIndex]) throw new Error(`Missing choice ${"ABCD"[optionIndex]} for ${id}`);
      choices.push(option[2]);
    }
    if (new Set(choices).size !== 4) throw new Error(`Repeated choice for ${id}`);
    const prompt = prefix === "B" ? question.replace(/\s+Clue:.*$/i, "").trim() : question;
    cards.set(id, { category: categoryFor[prefix], level: level.toLowerCase(), question: prompt, choices });
    i += 4;
    continue;
  }
}

if (cards.size !== 200 || keys.size !== 200) throw new Error(`Expected 200 questions and 200 answers; found ${cards.size} and ${keys.size}`);
for (const [id, card] of cards) {
  const key = keys.get(id);
  if (!key) throw new Error(`Missing answer key for ${id}`);
  if (card.choices[key.index] !== key.text) throw new Error(`Answer key mismatch for ${id}: ${card.choices[key.index]} != ${key.text}`);
  bank[card.category][card.level].push([card.question, card.choices, key.index]);
}
for (const category of Object.values(categoryFor)) {
  const count = levels.reduce((sum, level) => sum + bank[category][level].length, 0);
  if (count !== 40) throw new Error(`${category} has ${count} cards instead of 40`);
}

fs.writeFileSync(path.join(root, "additional-questions.js"), `// Generated from data/additional-questions-source.txt. Do not edit by hand.\nwindow.ADDITIONAL_QUESTIONS = ${JSON.stringify(bank, null, 2)};\n`);
console.log(`Imported ${cards.size} verified multiple-choice questions.`);
