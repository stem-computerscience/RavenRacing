// Shared by the browser and the Worker: the shape of the unit, rewards and badges.
// Lesson text, starter code and checks live in lessons.js (browser only).

export const CONCEPTS = [
  { id: "variables",    csta: "MS-PRO-VD-16", en: "Variables & print", es: "Variables y print" },
  { id: "conditionals", csta: "MS-PRO-RD-17", en: "If / else & events", es: "If / else y eventos" },
  { id: "loops",        csta: "MS-PRO-RD-17", en: "Loops",              es: "Bucles" },
  { id: "lists",        csta: "MS-PRO-VD-16", en: "Lists",              es: "Listas" },
  { id: "functions",    csta: "MS-PRO-PD-12", en: "Functions",          es: "Funciones" },
  { id: "debugging",    csta: "MS-PRO-TR-19", en: "Debugging",          es: "Depuración" },
];

// Order matters: each entry unlocks after the one named in `after`.
export const UNIT = [
  { id: "l1",   kind: "lesson", xp: 50,  coins: 10, after: null,   concepts: ["variables"] },
  { id: "l2",   kind: "lesson", xp: 50,  coins: 10, after: "l1",   concepts: ["variables", "functions"] },
  { id: "l3",   kind: "lesson", xp: 60,  coins: 10, after: "l2",   concepts: ["conditionals"] },
  { id: "l4",   kind: "lesson", xp: 60,  coins: 10, after: "l3",   concepts: ["loops", "lists"] },
  { id: "l5",   kind: "lesson", xp: 70,  coins: 15, after: "l4",   concepts: ["conditionals", "variables"] },
  { id: "side1",kind: "side",   xp: 40,  coins: 20, after: "l5",   concepts: ["lists", "conditionals"] },
  { id: "l6",   kind: "lesson", xp: 70,  coins: 15, after: "l5",   concepts: ["functions", "lists"] },
  { id: "boss", kind: "boss",   xp: 120, coins: 40, after: "l6",   concepts: ["debugging", "conditionals", "loops"] },
  { id: "mygame", kind: "build", xp: 100, coins: 30, after: "boss", concepts: ["functions", "loops", "lists"] },
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
