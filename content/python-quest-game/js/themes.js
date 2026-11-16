// The three adventures students can choose. Level text uses {tokens}
// that are filled in from the chosen theme.
window.PQ_THEMES = {
  space: {
    name: "Space Mission",
    pitch: "Captain a starship, dodge asteroids and land on strange planets.",
    vocab: { hero: "Captain Nova", ship: "starship", item: "star crystal", items: "star crystals",
             goal: "landing pad", enemy: "asteroid", ally: "Mission Control", place: "deck" },
    glyph: { hero: "🚀", item: "⭐", wall: "🪨", goal: "🪐", crash: "💥" },
    worlds: ["Wake the Ship", "Asteroid Field", "Orbit Run", "Command Deck"],
    intros: [
      "The starship has been asleep for 100 years. Bring its computer back online.",
      "Rocks ahead! The ship has to make smart choices to survive.",
      "Fly in circles, scan in loops, and collect every star crystal.",
      "Teach the ship's computer new commands and take control of the fleet."
    ]
  },
  dungeon: {
    name: "Dungeon Quest",
    pitch: "Explore a castle, unlock magic doors and outsmart the slime king.",
    vocab: { hero: "Sir Pip", ship: "castle", item: "gem", items: "gems",
             goal: "exit door", enemy: "slime", ally: "the old wizard", place: "chamber" },
    glyph: { hero: "🧙", item: "💎", wall: "🧱", goal: "🚪", crash: "💥" },
    worlds: ["The Gatehouse", "Hall of Choices", "Endless Corridors", "Wizard's Library"],
    intros: [
      "The castle gate only listens to someone who can speak Python.",
      "Every door asks a question. Answer right and it opens.",
      "The corridors go on and on. Spells that repeat will save your legs.",
      "The wizard's spellbooks are full of functions. Write your own."
    ]
  },
  robot: {
    name: "Robot Rescue",
    pitch: "Program a robot to fix a broken factory and power it back up.",
    vocab: { hero: "Bolt", ship: "factory", item: "battery", items: "batteries",
             goal: "charging dock", enemy: "glitch", ally: "the Chief Engineer", place: "sector" },
    glyph: { hero: "🤖", item: "🔋", wall: "📦", goal: "🏁", crash: "💥" },
    worlds: ["Boot Sequence", "Sorting Facility", "Assembly Line", "Control Core"],
    intros: [
      "Bolt just switched on. Teach it to talk and remember things.",
      "The sorting machines need rules: if this, do that.",
      "The assembly line repeats the same job forever. Loops make it easy.",
      "Build reusable programs to bring the factory's core back online."
    ]
  }
};

window.PQ_WORLDS = [
  { n: 1, topic: "print & variables" },
  { n: 2, topic: "if / elif / else" },
  { n: 3, topic: "loops" },
  { n: 4, topic: "functions & lists" }
];

window.PQ_RANKS = [
  [0, "Rookie Coder"], [300, "Variable Voyager"], [800, "Logic Ranger"],
  [1500, "Loop Master"], [2200, "Function Wizard"], [2900, "Python Legend"]
];
