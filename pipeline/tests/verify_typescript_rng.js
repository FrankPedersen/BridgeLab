const fs = require("fs");
const path = require("path");
const ts = require(path.join(process.cwd(), "web", "node_modules", "typescript"));

const source = fs.readFileSync(path.join(process.cwd(), "web", "src", "engine", "rng.ts"), "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

const moduleObject = { exports: {} };
const exportsObject = moduleObject.exports;
new Function("exports", "module", "require", transpiled)(
  exportsObject,
  moduleObject,
  require
);
const Mulberry32 = moduleObject.exports.Mulberry32;

const ranks = "23456789TJQKA";
const seeds = [0, 1, 42, 123456, 999999];
const output = {};

for (const seed of seeds) {
  const rng = new Mulberry32(seed);
  const cards = Array.from({ length: 52 }, (_, index) => index);
  for (let index = 51; index > 0; index--) {
    const j = rng.nextInt(index + 1);
    [cards[index], cards[j]] = [cards[j], cards[index]];
  }

  const hands = [
    cards.slice(0, 13),
    cards.slice(13, 26),
    cards.slice(26, 39),
    cards.slice(39, 52),
  ];
  output[String(seed)] = hands.map((hand) => {
    const suits = [];
    for (let suit = 0; suit < 4; suit++) {
      suits.push(
        hand
          .filter((card) => Math.floor(card / 13) === suit)
          .map((card) => ranks[card % 13])
          .join("")
      );
    }
    return suits.join(".");
  });
}

process.stdout.write(JSON.stringify(output));
