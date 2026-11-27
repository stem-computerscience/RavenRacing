// Shared by the browser and the Worker: the shape of the unit, rewards and badges.
// Lesson text, starter code and checks live in lessons.js (browser only).

export const CONCEPTS = [
  { id: "variables",    csta: "MS-PRO-VD-16", en: "Variables & print", es: "Variables y print" },
  { id: "conditionals", csta: "MS-PRO-RD-17", en: "If / else & events", es: "If / else y eventos" },
  { id: "loops",        csta: "MS-PRO-RD-17", en: "Loops",              es: "Bucles" },
  { id: "lists",        csta: "MS-PRO-VD-16", en: "Lists",              es: "Listas" },
  { id: "functions",    csta: "MS-PRO-PD-12", en: "Functions",          es: "Funciones" },
  { id: "debugging",    csta: "MS-PRO-TR-19", en: "Debugging",          es: "Depuración" },
  { id: "random",       csta: "MS-PRO-VD-16", en: "Random & math",      es: "Azar y números" },
  { id: "strings",      csta: "MS-PRO-VD-16", en: "Strings",            es: "Strings" },
  { id: "while",        csta: "MS-PRO-RD-17", en: "While loops",        es: "Bucles while" },
  { id: "dicts",        csta: "MS-PRO-VD-16", en: "Dictionaries",       es: "Diccionarios" },
];

// Order matters: each entry unlocks after the one named in `after`.
// 5 worlds of 4 levels. A side quest after every 2nd level (optional), a boss after every 4th.
const lesson = (id, after, xp, coins, concepts) => ({ id, kind: "lesson", xp, coins, after, concepts });
const side = (id, after, concepts) => ({ id, kind: "side", xp: 40, coins: 20, after, concepts });
const boss = (id, after, xp, coins, concepts) => ({ id, kind: "boss", xp, coins, after, concepts });
export const UNIT = [
  // World 1 · First Steps
  lesson("l1", null, 50, 10, ["variables"]),
  lesson("l2", "l1", 50, 10, ["variables", "functions"]),
  side("q1", "l2", ["strings", "variables"]),
  lesson("l3", "l2", 60, 10, ["conditionals"]),
  lesson("l4", "l3", 60, 10, ["loops", "lists"]),
  side("q2", "l4", ["loops", "lists"]),
  boss("boss1", "l4", 100, 30, ["debugging", "conditionals", "loops"]),
  // World 2 · Make It Play
  lesson("l5", "boss1", 70, 15, ["conditionals", "variables"]),
  lesson("l6", "l5", 70, 15, ["functions", "lists"]),
  side("side1", "l6", ["lists", "conditionals"]),
  lesson("l7", "l6", 70, 15, ["random", "conditionals"]),
  lesson("l8", "l7", 70, 15, ["random", "variables"]),
  side("q4", "l8", ["random", "conditionals"]),
  boss("boss", "l8", 120, 40, ["debugging", "conditionals", "loops"]),
  // World 3 · Words & Waves
  lesson("l9", "boss", 80, 15, ["strings", "variables"]),
  lesson("l10", "l9", 80, 15, ["while", "functions"]),
  side("q5", "l10", ["while", "lists"]),
  lesson("l11", "l10", 80, 15, ["random", "lists", "conditionals"]),
  lesson("l12", "l11", 80, 15, ["conditionals", "variables"]),
  side("q6", "l12", ["strings", "functions"]),
  boss("boss3", "l12", 140, 40, ["debugging", "strings", "random"]),
  // World 4 · Data Dungeon
  lesson("l13", "boss3", 90, 20, ["dicts"]),
  lesson("l14", "l13", 90, 20, ["dicts", "functions", "loops"]),
  side("q7", "l14", ["loops", "conditionals"]),
  lesson("l15", "l14", 90, 20, ["dicts", "loops"]),
  lesson("l16", "l15", 90, 20, ["dicts", "loops", "strings"]),
  side("q8", "l16", ["dicts", "conditionals"]),
  boss("boss4", "l16", 160, 50, ["debugging", "dicts"]),
  // World 5 · Boss Rush
  lesson("l17", "boss4", 100, 20, ["random", "variables"]),
  lesson("l18", "l17", 100, 20, ["lists", "dicts", "loops"]),
  side("q9", "l18", ["random", "lists", "functions"]),
  lesson("l19", "l18", 100, 20, ["conditionals", "loops"]),
  lesson("l20", "l19", 100, 20, ["lists", "dicts", "loops"]),
  side("q10", "l20", ["strings", "conditionals"]),
  boss("boss5", "l20", 200, 60, ["debugging", "while", "conditionals"]),
  { id: "mygame", kind: "build", xp: 150, coins: 50, after: "boss5", concepts: ["functions", "loops", "lists", "dicts"] },
];
// The five worlds on the map (each starts at the first id listed).
export const WORLDS = [
  { start: "l1", en: "World 1 · First Steps", es: "Mundo 1 · Primeros pasos" },
  { start: "l5", en: "World 2 · Make It Play", es: "Mundo 2 · A jugar" },
  { start: "l9", en: "World 3 · Words & Waves", es: "Mundo 3 · Palabras y oleadas" },
  { start: "l13", en: "World 4 · Data Dungeon", es: "Mundo 4 · Calabozo de datos" },
  { start: "l17", en: "World 5 · Boss Rush", es: "Mundo 5 · Ronda de jefes" },
];

export const HINT_COST = [0, 5, 10];   // XP taken off the reward for hint 1, 2, 3
export const MIN_REWARD = 10;

export const SHOP = [
  { id: "cat",    price: 20 }, { id: "ghost", price: 20 },
  { id: "gem",    price: 30 }, { id: "heart", price: 30 },
  { id: "ufo",    price: 40 }, { id: "fish",  price: 40 },
  { id: "dragon", price: 60 }, { id: "robot", price: 60 },
];
export const FREE_SPRITES = ["ship", "star", "rock", "basket", "apple", "coin", "hero", "knight", "alien", "laser", "bomb", "frog", "car", "ball", "slime", "bat", "boots"];

export const BADGES = [
  { id: "launch",   en: "First Launch",     es: "Primer despegue",   desc_en: "Finished your first lesson", desc_es: "Terminaste tu primera lección" },
  { id: "loops",    en: "Loop Master",      es: "Maestro de bucles", desc_en: "Finished the loops lesson", desc_es: "Terminaste la lección de bucles" },
  { id: "nohints",  en: "No Hints Needed",  es: "Sin pistas",        desc_en: "Solved a lesson with no hints", desc_es: "Resolviste una lección sin pistas" },
  { id: "side",     en: "Side Quester",     es: "Misión extra",      desc_en: "Finished a side quest", desc_es: "Terminaste una misión extra" },
  { id: "bugs",     en: "Bug Squasher",     es: "Aplasta bichos",    desc_en: "Beat the bug-hunt boss", desc_es: "Venciste al jefe de bichos" },
  { id: "wordsmith", en: "Wordsmith",       es: "Maestro de palabras", desc_en: "Finished the strings level (Name Tag)", desc_es: "Terminaste el nivel de strings (Etiqueta de nombre)" },
  { id: "datawiz",  en: "Data Wizard",      es: "Mago de datos",     desc_en: "Finished World 4: Data Dungeon", desc_es: "Terminaste el Mundo 4: Calabozo de datos" },
  { id: "king",     en: "Bug Beast King Slayer", es: "Vencedor del Rey Bestia", desc_en: "Beat all five bosses", desc_es: "Venciste a los cinco jefes" },
  { id: "maker",    en: "Game Maker",       es: "Creador de juegos", desc_en: "Published your game", desc_es: "Publicaste tu juego" },
  { id: "shopper",  en: "Collector",        es: "Coleccionista",     desc_en: "Unlocked a new sprite", desc_es: "Desbloqueaste un sprite" },
];

export const levelFor = (xp) => Math.floor(xp / 100) + 1;

export function rewardFor(item, hintsUsed) {
  let cost = 0;
  for (let i = 0; i < Math.min(hintsUsed, HINT_COST.length); i++) cost += HINT_COST[i];
  return { xp: Math.max(MIN_REWARD, item.xp - cost), coins: item.coins };
}

// progressMap: { lessonId: {status} }, locks: [lessonId]
export function isUnlocked(id, progressMap, locks = []) {
  const item = UNIT.find((u) => u.id === id);
  if (!item || locks.includes(id)) return false;
  if (!item.after) return true;
  const prev = progressMap[item.after];
  return !!prev && (prev.status === "done" || prev.status === "skipped");
}

// Mastery per concept (2026 CSTA codes above): each finished lesson scores 2 (≤1 hint) or 1 (more hints).
// Average ≥1.75 → mastered, ≥0.75 → developing, else beginning.
// Optional side quests only count once they're done, so skipping one never lowers a grade.
export function mastery(progressMap) {
  const out = {};
  for (const c of CONCEPTS) {
    const items = UNIT.filter((u) => u.concepts.includes(c.id) && u.kind !== "build" &&
      (u.kind !== "side" || progressMap[u.id]?.status === "done"));
    let sum = 0;
    for (const it of items) {
      const p = progressMap[it.id];
      if (p && p.status === "done") sum += p.hints_used <= 1 ? 2 : 1;
    }
    const avg = items.length ? sum / items.length : 0;
    out[c.id] = avg >= 1.75 ? "mastered" : avg >= 0.75 ? "developing" : "beginning";
  }
  return out;
}
