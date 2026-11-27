// PyQuest Arcade — the five game types. Every student builds ONE game file that grows level by level.
//
// For each level:
//   scaffold(c)  code appended to the student's file the first time they open the level.
//                c(en, es) picks the comment language. The first line is the level's marker comment.
//   solve        [find, replace] pairs that turn the scaffold into a working answer. A find starting
//                with "^" searches the whole file (for edits to earlier levels); otherwise it searches
//                from where this level's block starts. Used by the tests and by teacher catch-up.
//   check        Python run after the whole file. Set `result` to a key in `fails`, or leave it None.
//   goals, fails, hints   English + Spanish text.
// The boss is a separate broken game (not part of the student's file).

const T = (en, es) => ({ en, es });
import { buildMore } from "./more_levels.js";

// The order levels go into the student's file. Side quests (q…, side1) are optional; main levels never depend on them.
export const IN_FILE = ["l1", "l2", "q1", "l3", "l4", "q2", "l5", "l6", "side1", "l7", "l8", "q4", "l9", "l10", "q5", "l11", "l12", "q6",
  "l13", "l14", "q7", "l15", "l16", "q8", "l17", "l18", "q9", "l19", "l20", "q10", "mygame"];
const CHAIN = IN_FILE.filter((id) => !/^(q\d+|side1)$/.test(id));          // the required path
export const SIDE_AFTER = { q1: "l2", q2: "l4", side1: "l6", q4: "l8", q5: "l10", q6: "l12", q7: "l14", q8: "l16", q9: "l18", q10: "l20" };
export const BOSS_AFTER = { boss1: "l4", boss: "l8", boss3: "l12", boss4: "l16", boss5: "l20" };
// The marker comment that starts each level's block. side1 was "SIDE" before the unit grew, so both are recognised.
const LABEL = { mygame: "FINAL", side1: "QUEST 3" };
for (const id of IN_FILE) if (!LABEL[id]) LABEL[id] = id.startsWith("q") ? "QUEST " + id.slice(1) : id.toUpperCase();
export const MARKERS = { ...LABEL, side1: "(?:SIDE|QUEST 3)" };
export const markerRe = (id) => new RegExp("^# ===== " + MARKERS[id] + " ·", "m");
const mark = (id, title) => `# ===== ${LABEL[id]} · ${title} =====`;

// ---------- shared pieces ----------
const l1Check = (v) => `
if not isinstance(globals().get("TITLE"), str) or TITLE.strip() in ("", "???"):
    result = "title"
elif not isinstance(globals().get("${v}"), (int, float)) or ${v} <= 0:
    result = "speed"
elif not any(TITLE.strip() in line for line in _printed):
    result = "print"
`;
const l1Fails = (v) => ({
  title: T("TITLE still says ??? — give your game a name inside the quotes.", "TITLE todavía dice ??? — ponle nombre a tu juego entre las comillas."),
  speed: T(`${v} needs to be a number bigger than 0 (no quotes).`, `${v} debe ser un número mayor que 0 (sin comillas).`),
  print: T("Your title didn't show in the output. Change print(\"\") to print(TITLE).", "Tu título no apareció. Cambia print(\"\") por print(TITLE)."),
});
const l1Hints = (v, n) => [
  T("Text goes inside quotes. Numbers don't.", "El texto va entre comillas. Los números no."),
  T(`Change ??? to your game's name and the 0 after ${v} to ${n}.`, `Cambia ??? por el nombre de tu juego y el 0 de ${v} por ${n}.`),
  T(`Example:\nTITLE = "Sky Jumper"\n${v} = ${n}\nprint(TITLE)`, `Ejemplo:\nTITLE = "Salto al cielo"\n${v} = ${n}\nprint(TITLE)`),
];
const titleFail = T("Show your TITLE on screen: change text(\"\", 10, 28) to text(TITLE, 10, 28).", "Muestra tu TITLE en pantalla: cambia text(\"\", 10, 28) por text(TITLE, 10, 28).");
const textsHasTitle = `any(TITLE in t[0] for t in _pq._texts)`;

// The final level is the same idea for every game type.
const FINAL = (win) => ({
  title: T("Polish & Publish", "Pulir y publicar"),
  goals: {
    en: ["Add a way to WIN that calls game_over(\"You win!\") (any message except \"Game over!\").", "Add one more thing that makes the game yours: an enemy, a level, music, new sprites.", "Playtest with a classmate, then press Publish."],
    es: ["Agrega una forma de GANAR que llame a game_over(\"¡Ganaste!\") (cualquier mensaje menos \"Game over!\").", "Agrega algo más que haga tuyo el juego: un enemigo, un nivel, música, nuevos sprites.", "Pruébalo con un compañero y luego presiona Publicar."],
  },
  scaffold: (c) => `
${mark("mygame", c("Polish & Publish", "Pulir y publicar"))}
GOAL = 10
# ${c("1. Add a way to WIN. For example, in a new @every_frame function:", "1. Agrega una forma de GANAR. Por ejemplo, en una nueva función @every_frame:")}
#    ${c(win.hint.en, win.hint.es)}
# ${c("2. Add one more thing that's yours: an enemy, a level, music(\"fast\"), new sprites...", "2. Agrega algo más tuyo: un enemigo, un nivel, music(\"fast\"), nuevos sprites...")}
`,
  solve: [["GOAL = 10\n", "GOAL = 10\n\n@every_frame\ndef win():\n" + win.code + "\nmusic(\"fast\")\n"]],
  check: `
import re
import pq as _pq
code_only = re.sub(r"#.*", "", _source)
if not re.search(r"game_over\\(\\s*[\\"'](?!Game over|Time's up)", code_only):
    result = "win"
else:
    for keys in (["right"], ["left"], ["up"], ["space"], ["right", "up"], []):
        _step(30, keys=keys)
`,
  fails: {
    win: T("Add a win: call game_over(\"You win!\") when the player reaches a goal.", "Agrega una victoria: llama a game_over(\"¡Ganaste!\") cuando el jugador llegue a una meta."),
  },
  hints: [
    T("Make a new function with @every_frame above it, and put an if inside.", "Crea una nueva función con @every_frame arriba y pon un if adentro."),
    T(win.hint.en, win.hint.es),
    T("Example:\n@every_frame\ndef win():\n" + win.code, "Ejemplo:\n@every_frame\ndef win():\n" + win.code.replace("You win!", "¡Ganaste!")),
  ],
});
const scoreWin = { code: "    if score >= GOAL:\n        game_over(\"You win!\")", hint: T("if score >= GOAL: game_over(\"You win!\")", "if score >= GOAL: game_over(\"¡Ganaste!\")") };

// A boss check: counts how many of the planted bugs are still there.
const bossTry = `
bad = []
def _try(**kw):
    try:
        _step(**kw)
        return True
    except TypeError:
        return False
text_ok = True
`;
const bossEnd = `
if not text_ok:
    bad.append("text")
_extra = len(bad)
result = bad[0] if bad else None
`;
const bossFailsCommon = {
  score: T("Bug found: the score never goes up. Look closely at how score is spelled.", "Bicho encontrado: el puntaje nunca sube. Revisa bien cómo se escribe score."),
  text: T("Bug found: the score text crashes. Text + number needs str( ).", "Bicho encontrado: el texto del puntaje falla. Texto + número necesita str( )."),
};
const bossHints = (fixes) => [
  T("Press Run and read the error first. Fix one bug at a time, top to bottom.", "Presiona Ejecutar y lee el error. Arregla un bicho a la vez, de arriba abajo."),
  T("Four bugs: a missing colon, a + or - that's backwards, a misspelled variable, and text joined to a number.", "Cuatro bichos: dos puntos que faltan, un + o - al revés, una variable mal escrita y texto unido a un número."),
  T("Fixes: " + fixes, "Arreglos: " + fixes),
];

// ---------- platformer physics, shared by Platform Jumper and Castle Quest ----------
const gravityLevel = (color) => ({
  title: T("Gravity", "Gravedad"),
  goals: {
    en: ["Change the 0 in fall() to GRAVITY so the player falls.", "Show your TITLE on screen with text(TITLE, 10, 28)."],
    es: ["Cambia el 0 de fall() por GRAVITY para que el jugador caiga.", "Muestra tu TITLE en pantalla con text(TITLE, 10, 28)."],
  },
  scaffold: (c) => `
${mark("l2", c("Gravity", "Gravedad"))}
ground = Box(200, 390, 400, 20, "${color}")
player.vy = 0

@every_frame                          # ${c("runs this function 60 times a second: the GAME LOOP", "ejecuta esta función 60 veces por segundo: el CICLO DEL JUEGO")}
def fall():
    player.vy = player.vy + 0         # ${c("gravity: add GRAVITY instead of 0", "gravedad: suma GRAVITY en vez de 0")}
    player.y = player.y + player.vy
    stand_on(player, [ground])        # ${c("don't fall through the ground", "no atravesar el suelo")}
    text("", 10, 28)                  # ${c("show your TITLE here", "muestra tu TITLE aquí")}
`,
  solve: [["player.vy + 0", "player.vy + GRAVITY"], ['text("", 10, 28)', "text(TITLE, 10, 28)"]],
  check: `
import pq as _pq
player.x, player.y, player.vy = 200, 100, 0
_step(4)
if GRAVITY <= 0 or player.vy <= 0 or abs(player.vy - 4 * GRAVITY) > 0.01:
    result = "gravity"
else:
    _step(240)
    if not on_ground(player):
        result = "land"
    elif not ${textsHasTitle}:
        result = "title"
`,
  fails: {
    gravity: T("The player isn't falling yet. Add GRAVITY to player.vy every frame.", "El jugador aún no cae. Suma GRAVITY a player.vy en cada cuadro."),
    land: T("The player should stop on the ground. Keep the stand_on line.", "El jugador debe detenerse en el suelo. Deja la línea stand_on."),
    title: titleFail,
  },
  hints: [
    T("vy is the player's up/down speed. Gravity makes it a little bigger every frame.", "vy es la velocidad vertical. La gravedad la aumenta un poco en cada cuadro."),
    T("Replace the 0 with the variable GRAVITY you made in Level 1.", "Cambia el 0 por la variable GRAVITY que creaste en el Nivel 1."),
    T("Example:\n    player.vy = player.vy + GRAVITY\n    text(TITLE, 10, 28)", "Ejemplo:\n    player.vy = player.vy + GRAVITY\n    text(TITLE, 10, 28)"),
  ],
});

const jumpLevel = {
  title: T("Run & Jump", "Correr y saltar"),
  goals: {
    en: ["Holding the right arrow moves the player right.", "Pressing up makes the player jump: player.vy = -JUMP (only when on the ground)."],
    es: ["Mantener la flecha derecha mueve al jugador a la derecha.", "Presionar arriba hace saltar al jugador: player.vy = -JUMP (solo en el suelo)."],
  },
  scaffold: (c) => `
${mark("l3", c("Run & Jump", "Correr y saltar"))}
@every_frame
def controls():
    # ${c('EVENTS: key_down("left") is True while the left arrow is held', 'EVENTOS: key_down("left") es True mientras mantienes la flecha izquierda')}
    if key_down("left"):
        player.x = player.x - speed
    # ${c('add an if for the "right" arrow here', 'agrega aquí un if para la flecha "right"')}

    # ${c("jump when up is PRESSED and the player is on the ground", "salta cuando se PRESIONA arriba y el jugador está en el suelo")}
    if key_pressed("up") and on_ground(player):
        pass                          # ${c("replace pass with: player.vy = -JUMP", "cambia pass por: player.vy = -JUMP")}
`,
  solve: [['    if key_pressed("up")', '    if key_down("right"):\n        player.x = player.x + speed\n    if key_pressed("up")'], ["        pass", "        player.vy = -JUMP"]],
  check: `
player.x, player.y, player.vy = 200, 300, 0
_step(120)
x0 = player.x
_step(5, keys=["right"])
if player.x <= x0:
    result = "right"
else:
    x0 = player.x
    _step(5, keys=["left"])
    if player.x >= x0:
        result = "left"
    else:
        _step(30)
        _step(1, keys=["up"])
        if player.vy >= 0:
            result = "jump"
`,
  fails: {
    right: T("The right arrow doesn't move the player yet.", "La flecha derecha todavía no mueve al jugador."),
    left: T("Oops, the left arrow stopped working. Check your if statements.", "Uy, la flecha izquierda dejó de funcionar. Revisa tus if."),
    jump: T("Pressing up on the ground should set player.vy to -JUMP (negative goes up).", "Presionar arriba en el suelo debe poner player.vy en -JUMP (negativo sube)."),
  },
  hints: [
    T("Copy the left-arrow if and change two things.", "Copia el if de la flecha izquierda y cambia dos cosas."),
    T("Up on the screen means y gets smaller, so a jump needs a negative speed.", "Arriba en la pantalla significa que y disminuye, así que el salto necesita velocidad negativa."),
    T('Example:\n    if key_down("right"):\n        player.x = player.x + speed\n    if key_pressed("up") and on_ground(player):\n        player.vy = -JUMP', 'Ejemplo:\n    if key_down("right"):\n        player.x = player.x + speed\n    if key_pressed("up") and on_ground(player):\n        player.vy = -JUMP'),
  ],
};

const livesEnemy = (name, sprite, x, y, lo, hi) => ({
  title: T(`Side quest: ${name.en}`, `Misión extra: ${name.es}`),
  goals: {
    en: [`Turn the ${sprite} around at the edges (x < ${lo} or x > ${hi}).`, `Touching the ${sprite}: lives - 1, play("hurt"), player back to x=60, y=300.`, "When lives == 0: game_over(\"Game over!\")."],
    es: [`Haz que el ${sprite} dé la vuelta en los bordes (x < ${lo} o x > ${hi}).`, `Tocar al ${sprite}: lives - 1, play("hurt"), jugador de vuelta a x=60, y=300.`, "Cuando lives == 0: game_over(\"Game over!\")."],
  },
  scaffold: (c) => `
${mark("side1", c(name.en, name.es))}
lives = 3
enemy = Sprite("${sprite}", x=${x}, y=${y})
enemy.vx = 2

@every_frame
def enemies():
    global lives
    enemy.x = enemy.x + enemy.vx
    # ${c(`turn around at the edges: if enemy.x < ${lo} or enemy.x > ${hi}, flip enemy.vx`, `da la vuelta en los bordes: si enemy.x < ${lo} o enemy.x > ${hi}, invierte enemy.vx`)}
    # ${c('touching the enemy: lives - 1, play("hurt"), player back to x=60, y=300', 'al tocar al enemigo: lives - 1, play("hurt"), jugador a x=60, y=300')}
    # ${c('and if lives == 0: game_over("Game over!")', 'y si lives == 0: game_over("Game over!")')}
    pass
    text("Lives: " + str(lives), 300, 28)
`,
  solve: [["    pass\n    text(\"Lives", `    if enemy.x < ${lo} or enemy.x > ${hi}:\n        enemy.vx = -enemy.vx\n    if player.touching(enemy):\n        lives -= 1\n        play("hurt")\n        player.x, player.y = 60, 300\n        if lives == 0:\n            game_over("Game over!")\n    text("Lives`]],
  check: `
import pq as _pq
enemy.x, enemy.vx = ${hi + 5}, 2
player.x, player.y, player.vy = 60, 300, 0
_step(1)
if enemy.vx >= 0:
    result = "turn"
else:
    l0 = lives
    player.x, player.y, player.vy = enemy.x, enemy.y, 0
    _step(1)
    if lives != l0 - 1:
        result = "hit"
    elif player.touching(enemy):
        result = "respawn"
    else:
        lives = 1
        player.x, player.y, player.vy = enemy.x, enemy.y, 0
        _step(1)
        if not _pq._state["over"]:
            result = "over"
`,
  fails: {
    turn: T(`The ${sprite} should turn around at the edge: flip enemy.vx.`, `El ${sprite} debe dar la vuelta en el borde: invierte enemy.vx.`),
    hit: T("Touching the enemy should take away exactly 1 life.", "Tocar al enemigo debe quitar exactamente 1 vida."),
    respawn: T("After a hit, send the player back to x=60, y=300.", "Después del golpe, regresa al jugador a x=60, y=300."),
    over: T("When lives reaches 0, call game_over(\"Game over!\").", "Cuando lives llegue a 0, llama a game_over(\"Game over!\")."),
  },
  hints: [
    T("Flipping a speed means: enemy.vx = -enemy.vx", "Invertir una velocidad es: enemy.vx = -enemy.vx"),
    T("You need two ifs: one for the edges, one for player.touching(enemy). The lives==0 if goes inside the second.", "Necesitas dos if: uno para los bordes y otro para player.touching(enemy). El if de lives==0 va dentro del segundo."),
    T(`Example:\n    if enemy.x < ${lo} or enemy.x > ${hi}:\n        enemy.vx = -enemy.vx\n    if player.touching(enemy):\n        lives -= 1\n        play("hurt")\n        player.x, player.y = 60, 300\n        if lives == 0:\n            game_over("Game over!")`, `Ejemplo:\n    if enemy.x < ${lo} or enemy.x > ${hi}:\n        enemy.vx = -enemy.vx\n    if player.touching(enemy):\n        lives -= 1\n        play("hurt")\n        player.x, player.y = 60, 300\n        if lives == 0:\n            game_over("Game over!")`),
  ],
});

// ===================================================================== Platform Jumper
const platformer = {
  id: "platformer",
  name: T("Platform Jumper", "Saltador de plataformas"),
  blurb: T("Run, jump between platforms and grab coins. Mario-style.", "Corre, salta entre plataformas y atrapa monedas. Estilo Mario."),
  sprite: "hero",
  levels: {
    l1: {
      title: T("Setup", "Preparación"),
      goals: { en: ["Name your game: set TITLE (keep the quotes).", "Set speed to a number bigger than 0 (try 4).", "Change print(\"\") to print(TITLE)."], es: ["Nombra tu juego: cambia TITLE (con comillas).", "Pon speed en un número mayor que 0 (prueba 4).", "Cambia print(\"\") por print(TITLE)."] },
      scaffold: (c) => `from pq import *

${mark("l1", c("Setup", "Preparación"))}
TITLE = "???"              # ${c("name your game", "ponle nombre a tu juego")}
PLAYER_SPRITE = "hero"     # ${c("try hero, knight, cat, robot, or one you unlocked", "prueba hero, knight, cat, robot o uno que desbloqueaste")}
background("#5c94fc")      # ${c("the sky colour", "el color del cielo")}
speed = 0                  # ${c("how fast your player runs (try 4)", "qué tan rápido corre tu jugador (prueba 4)")}
JUMP = 10                  # ${c("how high the player jumps", "qué tan alto salta")}
GRAVITY = 0.5              # ${c("how hard gravity pulls", "qué tan fuerte jala la gravedad")}

player = Sprite(PLAYER_SPRITE, x=60, y=300)

print("")                  # ${c("print your TITLE (no quotes around TITLE!)", "imprime tu TITLE (¡sin comillas alrededor de TITLE!)")}
`,
      solve: [['TITLE = "???"', 'TITLE = "Sky Jumper"'], ["speed = 0 ", "speed = 4 "], ['print("")', "print(TITLE)"]],
      check: l1Check("speed"), fails: l1Fails("speed"), hints: l1Hints("speed", 4),
    },
    l2: gravityLevel("#c84c0c"),
    l3: jumpLevel,
    l4: {
      title: T("Platforms", "Plataformas"),
      goals: { en: ["Change range(1) to range(4) to build a staircase of platforms.", "In fall() (Level 2), change [ground] to platforms so the player can land on them."], es: ["Cambia range(1) por range(4) para construir una escalera de plataformas.", "En fall() (Nivel 2), cambia [ground] por platforms para que el jugador pueda pararse en ellas."] },
      scaffold: (c) => `
${mark("l4", c("Platforms", "Plataformas"))}
platforms = [ground]          # ${c("a LIST that starts with the ground", "una LISTA que empieza con el suelo")}
# ${c("A FOR LOOP repeats code. Change 1 to 4 to build a staircase.", "Un BUCLE FOR repite código. Cambia 1 por 4 para construir una escalera.")}
for i in range(1):
    step = Box(110 + i * 80, 320 - i * 60, 70, 16, "#c84c0c")
    platforms.append(step)
# ${c("Then go back to fall() and change [ground] to platforms", "Luego regresa a fall() y cambia [ground] por platforms")}
`,
      solve: [["range(1)", "range(4)"], ["^stand_on(player, [ground])", "stand_on(player, platforms)"]],
      check: `
if not isinstance(globals().get("platforms"), list) or len(platforms) < 5:
    result = "count"
else:
    p = platforms[2]
    player.x, player.y, player.vy = p.x, p.y - 80, 0
    _step(60)
    if abs(player.y + player.tall / 2 - (p.y - p.h / 2)) > 1:
        result = "land"
`,
      fails: {
        count: T("Build at least 4 platforms (plus the ground). Check range( ).", "Construye al menos 4 plataformas (más el suelo). Revisa range( )."),
        land: T("The player falls through the platforms. In fall(), use stand_on(player, platforms).", "El jugador atraviesa las plataformas. En fall(), usa stand_on(player, platforms)."),
      },
      hints: [
        T("range(4) makes the loop run 4 times, with i = 0, 1, 2, 3.", "range(4) repite el bucle 4 veces, con i = 0, 1, 2, 3."),
        T("Find the stand_on line in your Level 2 code. It only knows about the ground right now.", "Busca la línea stand_on en tu código del Nivel 2. Ahora solo conoce el suelo."),
        T("Example:\nfor i in range(4):\n...\n    stand_on(player, platforms)", "Ejemplo:\nfor i in range(4):\n...\n    stand_on(player, platforms)"),
      ],
    },
    l5: {
      title: T("Coins", "Monedas"),
      goals: { en: ["Inside the for loop: if the player touches the coin, hide it.", "Add 1 to score and play(\"coin\")."], es: ["Dentro del bucle for: si el jugador toca la moneda, escóndela.", "Suma 1 a score y usa play(\"coin\")."] },
      scaffold: (c) => `
${mark("l5", c("Coins", "Monedas"))}
score = 0
coins = []
for p in platforms:
    coins.append(Sprite("coin", x=p.x, y=p.y - 30))

@every_frame
def collect():
    global score                      # ${c("lets this function change score", "permite que esta función cambie score")}
    for coin in coins:
        # ${c('if the player touches this coin: coin.hide(), score + 1, play("coin")', 'si el jugador toca esta moneda: coin.hide(), score + 1, play("coin")')}
        pass
    text("Score: " + str(score), 10, 52)
`,
      solve: [["        pass\n    text(\"Score", "        if player.touching(coin):\n            coin.hide()\n            score += 1\n            play(\"coin\")\n    text(\"Score"]],
      check: `
s0 = score
c = coins[0]
c.show()
player.x, player.y, player.vy = c.x, c.y, 0
_step(1)
if score != s0 + 1:
    result = "score"
elif c.visible:
    result = "hide"
`,
      fails: {
        score: T("Touching a coin should add exactly 1 to score.", "Tocar una moneda debe sumar exactamente 1 a score."),
        hide: T("Hide the coin after it's collected: coin.hide()", "Esconde la moneda al atraparla: coin.hide()"),
      },
      hints: [
        T("touching() answers True or False, which is perfect for an if.", "touching() responde True o False, perfecto para un if."),
        T("Your if goes inside the for loop, lined up where pass is.", "Tu if va dentro del bucle for, alineado donde está pass."),
        T("Example:\n        if player.touching(coin):\n            coin.hide()\n            score += 1\n            play(\"coin\")", "Ejemplo:\n        if player.touching(coin):\n            coin.hide()\n            score += 1\n            play(\"coin\")"),
      ],
    },
    side1: livesEnemy(T("Slime Patrol", "Patrulla de babosas"), "slime", 300, 364, 220, 380),
    l6: {
      title: T("Coin Maker", "Fábrica de monedas"),
      goals: { en: ["Fill in make_coin(x, y): make a coin Sprite at (x, y) and add it to coins.", "The two make_coin lines below it should then add 2 coins."], es: ["Completa make_coin(x, y): crea una moneda en (x, y) y agrégala a coins.", "Las dos líneas make_coin de abajo agregarán 2 monedas."] },
      scaffold: (c) => `
${mark("l6", c("Coin Maker", "Fábrica de monedas"))}
# ${c("A FUNCTION is a recipe with a name. x and y are its PARAMETERS (inputs).", "Una FUNCIÓN es una receta con nombre. x y y son sus PARÁMETROS (entradas).")}
def make_coin(x, y):
    # ${c("make a coin Sprite at (x, y) and add it to the coins list", "crea una moneda en (x, y) y agrégala a la lista coins")}
    pass

make_coin(60, 200)
make_coin(340, 120)
`,
      solve: [["    pass\n\nmake_coin", "    coins.append(Sprite(\"coin\", x=x, y=y))\n\nmake_coin"]],
      check: `
if not callable(globals().get("make_coin")):
    result = "def"
else:
    n = len(coins)
    make_coin(77, 88)
    if len(coins) != n + 1:
        result = "add"
    elif (coins[-1].x, coins[-1].y) != (77, 88):
        result = "place"
    else:
        coins[-1].hide()
`,
      fails: {
        def: T("Keep the function named make_coin with two inputs: def make_coin(x, y):", "Deja la función llamada make_coin con dos entradas: def make_coin(x, y):"),
        add: T("make_coin should add exactly one coin to the coins list.", "make_coin debe agregar exactamente una moneda a la lista coins."),
        place: T("Use the parameters: the coin goes at x=x, y=y.", "Usa los parámetros: la moneda va en x=x, y=y."),
      },
      hints: [
        T("Replace pass with one line that appends a new Sprite to coins.", "Cambia pass por una línea que agregue un nuevo Sprite a coins."),
        T("Look at how Level 5 made coins with coins.append(...).", "Mira cómo el Nivel 5 creó monedas con coins.append(...)."),
        T("Example:\ndef make_coin(x, y):\n    coins.append(Sprite(\"coin\", x=x, y=y))", "Ejemplo:\ndef make_coin(x, y):\n    coins.append(Sprite(\"coin\", x=x, y=y))"),
      ],
    },
    mygame: FINAL(scoreWin),
  },
  boss: {
    starter: (c) => `from pq import *

# ${c("THE BUG BEAST broke this platform game! Find and squash 4 bugs.", "¡LA BESTIA DE BICHOS rompió este juego! Encuentra y aplasta 4 bichos.")}
background("#2b0f3a")
ground = Box(200, 390, 400, 20, "#6c5ce7")
player = Sprite("hero", x=60, y=300)
coins = []
score = 0

for i in range(4)
    coins.append(Sprite("coin", x=100 + i * 70, y=360))

@every_frame
def fall():
    player.vy = player.vy - 0.5
    player.y = player.y + player.vy
    stand_on(player, [ground])

@every_frame
def controls():
    if key_down("left"):
        player.x -= 4
    if key_down("right"):
        player.x += 4

@every_frame
def collect():
    global score
    for coin in coins:
        if player.touching(coin):
            coin.hide()
            scor = score + 1
    text("Score: " + score, 10, 28)
`,
    solve: [["range(4)\n", "range(4):\n"], ["player.vy - 0.5", "player.vy + 0.5"], ["scor = score", "score = score"], ['"Score: " + score', '"Score: " + str(score)']],
    check: bossTry + `
player.x, player.y, player.vy = 300, 200, 0
text_ok = _try(frames=10) and text_ok
if player.y <= 200:
    bad.append("gravity")
s0 = score
c = coins[0]
player.x, player.y, player.vy = c.x, c.y, 0
text_ok = _try(frames=1) and text_ok
if score != s0 + 1:
    bad.append("score")
` + bossEnd,
    fails: { gravity: T("Bug found: the player floats up into space! Gravity should ADD to vy.", "Bicho encontrado: ¡el jugador flota hacia el espacio! La gravedad debe SUMAR a vy."), ...bossFailsCommon },
    hints: bossHints("add \":\" after range(4) · player.vy + 0.5 · score = score + 1 · str(score)"),
  },
};

// ===================================================================== Castle Quest (metroidvania)
const explorer = {
  id: "explorer",
  name: T("Castle Quest", "Misión en el castillo"),
  blurb: T("Explore room after room and find a power-up that unlocks new places. Metroidvania-style.", "Explora sala tras sala y encuentra un poder que abre nuevos lugares. Estilo metroidvania."),
  sprite: "knight",
  levels: {
    l1: {
      ...platformer.levels.l1,
      scaffold: (c) => platformer.levels.l1.scaffold(c).replace('PLAYER_SPRITE = "hero"', 'PLAYER_SPRITE = "knight"').replace('background("#5c94fc")', 'background("#1b1b3a")'),
      solve: [['TITLE = "???"', 'TITLE = "Castle Quest"'], ["speed = 0 ", "speed = 4 "], ['print("")', "print(TITLE)"]],
    },
    l2: gravityLevel("#576574"),
    l3: jumpLevel,
    l4: {
      title: T("Rooms", "Salas"),
      goals: { en: ["Give room 1 at least 3 platforms (add (x, y) spots to its list).", "Fill in the for loop: add a Box for every spot in rooms[room].", "In fall() (Level 2), change [ground] to platforms."], es: ["Dale a la sala 1 al menos 3 plataformas (agrega lugares (x, y) a su lista).", "Completa el bucle for: agrega un Box por cada lugar de rooms[room].", "En fall() (Nivel 2), cambia [ground] por platforms."] },
      scaffold: (c) => `
${mark("l4", c("Rooms", "Salas"))}
# ${c("Each room is a LIST of platform spots (x, y). rooms is a list of rooms!", "Cada sala es una LISTA de lugares (x, y). ¡rooms es una lista de salas!")}
rooms = [
    [(110, 320), (200, 260), (290, 200)],
    [(80, 300)],
]
room = 0
platforms = [ground]
# ${c("FOR LOOP: for every spot in this room, add a platform:", "BUCLE FOR: por cada lugar de esta sala, agrega una plataforma:")}
#     platforms.append(Box(spot[0], spot[1], 80, 16, "#576574"))
for spot in rooms[room]:
    pass
# ${c("Then change [ground] to platforms in fall()", "Luego cambia [ground] por platforms en fall()")}
`,
      solve: [["[(80, 300)],", "[(80, 300), (180, 240), (300, 180)],"], ["for spot in rooms[room]:\n    pass", "for spot in rooms[room]:\n    platforms.append(Box(spot[0], spot[1], 80, 16, \"#576574\"))"], ["^stand_on(player, [ground])", "stand_on(player, platforms)"]],
      check: `
if len(rooms) < 2 or len(rooms[1]) < 3:
    result = "room1"
elif len(platforms) != 1 + len(rooms[0]):
    result = "loop"
else:
    p = platforms[1]
    player.x, player.y, player.vy = p.x, p.y - 80, 0
    _step(60)
    if abs(player.y + player.tall / 2 - (p.y - p.h / 2)) > 1:
        result = "land"
`,
      fails: {
        room1: T("Room 1 needs at least 3 platform spots.", "La sala 1 necesita al menos 3 lugares de plataforma."),
        loop: T("The loop should add one platform for every spot in the room.", "El bucle debe agregar una plataforma por cada lugar de la sala."),
        land: T("The player falls through. In fall(), use stand_on(player, platforms).", "El jugador las atraviesa. En fall(), usa stand_on(player, platforms)."),
      },
      hints: [
        T("A spot like (180, 240) is an x and a y. spot[0] is x and spot[1] is y.", "Un lugar como (180, 240) es una x y una y. spot[0] es x y spot[1] es y."),
        T("Copy the platforms.append line from the comment into the loop, in place of pass.", "Copia la línea platforms.append del comentario dentro del bucle, en lugar de pass."),
        T("Example:\nfor spot in rooms[room]:\n    platforms.append(Box(spot[0], spot[1], 80, 16, \"#576574\"))", "Ejemplo:\nfor spot in rooms[room]:\n    platforms.append(Box(spot[0], spot[1], 80, 16, \"#576574\"))"),
      ],
    },
    l5: {
      title: T("Power-Up Boots", "Botas de poder"),
      goals: { en: ["If the player touches the boots: hide them, set has_boots to True, play(\"win\").", "In controls() (Level 3): with boots, jump higher, e.g. player.vy = -JUMP * 1.4."], es: ["Si el jugador toca las botas: escóndelas, pon has_boots en True, play(\"win\").", "En controls() (Nivel 3): con botas salta más alto, p. ej. player.vy = -JUMP * 1.4."] },
      scaffold: (c) => `
${mark("l5", c("Power-Up Boots", "Botas de poder"))}
score = 0
has_boots = False                     # ${c("a True/False variable", "una variable True/False")}
boots = Sprite("boots", x=290, y=160)

@every_frame
def pickups():
    global has_boots
    # ${c('if the player touches the boots: boots.hide(), has_boots = True, play("win")', 'si el jugador toca las botas: boots.hide(), has_boots = True, play("win")')}
    pass
# ${c("Then in controls(): if has_boots, jump higher (player.vy = -JUMP * 1.4)", "Luego en controls(): si has_boots, salta más alto (player.vy = -JUMP * 1.4)")}
`,
      solve: [["    pass\n", "    if player.touching(boots):\n        boots.hide()\n        has_boots = True\n        play(\"win\")\n"], ["^        player.vy = -JUMP", "        player.vy = -JUMP * 1.4 if has_boots else -JUMP"]],
      check: `
has_boots = False
boots.show()
player.x, player.y, player.vy = boots.x, boots.y, 0
_step(1)
if not has_boots:
    result = "pick"
elif boots.visible:
    result = "hide"
else:
    player.x, player.y, player.vy = 30, 300, 0
    _step(120)
    _step(1, keys=["up"])
    if player.vy >= -JUMP:
        result = "boots"
`,
      fails: {
        pick: T("Touching the boots should set has_boots to True.", "Tocar las botas debe poner has_boots en True."),
        hide: T("Hide the boots once they're picked up.", "Esconde las botas cuando las recojas."),
        boots: T("With boots, the jump should be stronger than -JUMP. Change controls().", "Con botas, el salto debe ser más fuerte que -JUMP. Cambia controls()."),
      },
      hints: [
        T("has_boots is a Boolean: it's only ever True or False.", "has_boots es un Booleano: solo puede ser True o False."),
        T("In controls(), put an if has_boots: ... else: ... where the jump happens.", "En controls(), pon un if has_boots: ... else: ... donde ocurre el salto."),
        T("Example:\n        if has_boots:\n            player.vy = -JUMP * 1.4\n        else:\n            player.vy = -JUMP", "Ejemplo:\n        if has_boots:\n            player.vy = -JUMP * 1.4\n        else:\n            player.vy = -JUMP"),
      ],
    },
    side1: livesEnemy(T("Bat Attack", "Ataque de murciélagos"), "bat", 200, 200, 100, 300),
    l6: {
      title: T("Room Changer", "Cambio de sala"),
      goals: { en: ["Finish load_room(n): build the platforms for rooms[n] (like your Level 4 loop).", "Walk off the right edge to go to the next room."], es: ["Termina load_room(n): construye las plataformas de rooms[n] (como tu bucle del Nivel 4).", "Sal por el borde derecho para ir a la siguiente sala."] },
      scaffold: (c) => `
${mark("l6", c("Room Changer", "Cambio de sala"))}
def load_room(n):                     # ${c("n is the PARAMETER: which room to load", "n es el PARÁMETRO: qué sala cargar")}
    global room
    room = n
    for p in platforms:
        if p != ground:
            p.hide()
    platforms[:] = [ground]
    # ${c("build the platforms for room n (like Level 4, but with rooms[n])", "construye las plataformas de la sala n (como el Nivel 4, pero con rooms[n])")}

@every_frame
def doors():
    # ${c("walk off the right edge to go to the next room", "sal por el borde derecho para ir a la siguiente sala")}
    if player.x > 390 and room < len(rooms) - 1:
        load_room(room + 1)
        player.x = 20
`,
      solve: [["platforms[:] = [ground]\n", "platforms[:] = [ground]\n    for spot in rooms[n]:\n        platforms.append(Box(spot[0], spot[1], 80, 16, \"#576574\"))\n"]],
      check: `
if not callable(globals().get("load_room")):
    result = "def"
else:
    load_room(1)
    built = [p for p in platforms if p is not ground]
    if room != 1:
        result = "room"
    elif len(built) != len(rooms[1]) or any((p.x, p.y) != (s[0], s[1]) for p, s in zip(built, rooms[1])):
        result = "build"
    else:
        load_room(0)
        player.x, player.y, player.vy = 395, 300, 0
        _step(1)
        if room != 1:
            result = "door"
`,
      fails: {
        def: T("Keep the function: def load_room(n):", "Deja la función: def load_room(n):"),
        room: T("load_room(n) should set room to n.", "load_room(n) debe poner room en n."),
        build: T("load_room(n) should add a platform for every spot in rooms[n].", "load_room(n) debe agregar una plataforma por cada lugar de rooms[n]."),
        door: T("Walking off the right edge should load the next room.", "Salir por el borde derecho debe cargar la siguiente sala."),
      },
      hints: [
        T("You already wrote this loop in Level 4. Copy it into the function.", "Ya escribiste este bucle en el Nivel 4. Cópialo dentro de la función."),
        T("Inside the function use rooms[n], the parameter, not rooms[room].", "Dentro de la función usa rooms[n], el parámetro, no rooms[room]."),
        T("Example:\n    for spot in rooms[n]:\n        platforms.append(Box(spot[0], spot[1], 80, 16, \"#576574\"))", "Ejemplo:\n    for spot in rooms[n]:\n        platforms.append(Box(spot[0], spot[1], 80, 16, \"#576574\"))"),
      ],
    },
    mygame: FINAL({ code: "    if room == len(rooms) - 1 and player.x > 380:\n        game_over(\"You win!\")", hint: T("if room == len(rooms) - 1 and player.x > 380: game_over(\"You win!\")", "if room == len(rooms) - 1 and player.x > 380: game_over(\"¡Ganaste!\")") }),
  },
  boss: {
    starter: (c) => `from pq import *

# ${c("THE BUG BEAST broke this castle! Find and squash 4 bugs.", "¡LA BESTIA DE BICHOS rompió este castillo! Encuentra y aplasta 4 bichos.")}
background("#1b1b3a")
ground = Box(200, 390, 400, 20, "#576574")
player = Sprite("knight", x=60, y=300)
spots = [(120, 320), (220, 260)]
platforms = [ground]
has_boots = False
boots = Sprite("boots", x=320, y=360)

for spot in spots
    platforms.append(Box(spot[0], spot[1], 80, 16, "#576574"))

@every_frame
def fall():
    player.vy = player.vy - 0.5
    player.y = player.y + player.vy
    stand_on(player, platforms)

@every_frame
def pickups():
    global has_boots
    if player.touching(boots):
        boots.hide()
        has_bots = True
    text("Boots: " + has_boots, 10, 28)
`,
    solve: [["in spots\n", "in spots:\n"], ["player.vy - 0.5", "player.vy + 0.5"], ["has_bots = True", "has_boots = True"], ['"Boots: " + has_boots', '"Boots: " + str(has_boots)']],
    check: bossTry + `
player.x, player.y, player.vy = 300, 200, 0
text_ok = _try(frames=10) and text_ok
if player.y <= 200:
    bad.append("gravity")
player.x, player.y, player.vy = boots.x, boots.y, 0
text_ok = _try(frames=1) and text_ok
if not has_boots:
    bad.append("boots")
` + bossEnd,
    fails: {
      gravity: T("Bug found: the knight floats away! Gravity should ADD to vy.", "Bicho encontrado: ¡el caballero sale flotando! La gravedad debe SUMAR a vy."),
      boots: T("Bug found: picking up the boots doesn't work. Check the spelling of has_boots.", "Bicho encontrado: recoger las botas no funciona. Revisa cómo se escribe has_boots."),
      text: T("Bug found: the Boots text crashes. Text + True/False needs str( ).", "Bicho encontrado: el texto de Boots falla. Texto + True/False necesita str( )."),
    },
    hints: bossHints("add \":\" after spots · player.vy + 0.5 · has_boots = True · str(has_boots)"),
  },
};

// ===================================================================== Star Fighter (Galaga-style)
const l1Base = (c, { sprite, bg, v, vHint, extra, player }) => `from pq import *

${mark("l1", c("Setup", "Preparación"))}
TITLE = "???"              # ${c("name your game", "ponle nombre a tu juego")}
${sprite}
background("${bg}")      # ${c("the background colour", "el color del fondo")}
${v} = 0                    # ${c(vHint.en, vHint.es)}
${extra}
${player}

print("")                  # ${c("print your TITLE (no quotes around TITLE!)", "imprime tu TITLE (¡sin comillas alrededor de TITLE!)")}
`;
const l1Goals = (v, n) => ({ en: ["Name your game: set TITLE (keep the quotes).", `Set ${v} to a number bigger than 0 (try ${n}).`, "Change print(\"\") to print(TITLE)."], es: ["Nombra tu juego: cambia TITLE (con comillas).", `Pon ${v} en un número mayor que 0 (prueba ${n}).`, "Cambia print(\"\") por print(TITLE)."] });

const shooter = {
  id: "shooter",
  name: T("Star Fighter", "Caza estelar"),
  blurb: T("Fly a ship, fire lasers and blast aliens before they bomb you. Galaga-style.", "Pilota una nave, dispara láseres y derriba alienígenas. Estilo Galaga."),
  sprite: "ship",
  levels: {
    l1: {
      title: T("Setup", "Preparación"), goals: l1Goals("speed", 5),
      scaffold: (c) => l1Base(c, { sprite: `PLAYER_SPRITE = "ship"     # ${c("try ship, ufo, dragon, or one you unlocked", "prueba ship, ufo, dragon o uno que desbloqueaste")}`, bg: "#000814", v: "speed", vHint: T("how fast your ship moves (try 5)", "qué tan rápido se mueve tu nave (prueba 5)"), extra: "", player: "player = Sprite(PLAYER_SPRITE, x=200, y=370)" }),
      solve: [['TITLE = "???"', 'TITLE = "Star Fighter"'], ["speed = 0 ", "speed = 5 "], ['print("")', "print(TITLE)"]],
      check: l1Check("speed"), fails: l1Fails("speed"), hints: l1Hints("speed", 5),
    },
    l2: {
      title: T("The Alien", "El alienígena"),
      goals: { en: ["Make the alien move: change the 0 to alien_speed.", "Show your TITLE on screen with text(TITLE, 10, 28)."], es: ["Haz que el alienígena se mueva: cambia el 0 por alien_speed.", "Muestra tu TITLE en pantalla con text(TITLE, 10, 28)."] },
      scaffold: (c) => `
${mark("l2", c("The Alien", "El alienígena"))}
alien = Sprite("alien", x=200, y=80)
alien_speed = 2

@every_frame                          # ${c("runs this function 60 times a second: the GAME LOOP", "ejecuta esta función 60 veces por segundo: el CICLO DEL JUEGO")}
def move_alien():
    alien.x = alien.x + 0             # ${c("use alien_speed instead of 0", "usa alien_speed en vez de 0")}
    text("", 10, 28)                  # ${c("show your TITLE here", "muestra tu TITLE aquí")}
`,
      solve: [["alien.x + 0", "alien.x + alien_speed"], ['text("", 10, 28)', "text(TITLE, 10, 28)"]],
      check: `
import pq as _pq
alien.x = 100
_step(10)
if alien_speed == 0 or abs(alien.x - (100 + 10 * alien_speed)) > 0.01:
    result = "move"
elif not ${textsHasTitle}:
    result = "title"
`,
      fails: { move: T("The alien isn't moving yet. Add alien_speed to alien.x every frame.", "El alienígena aún no se mueve. Suma alien_speed a alien.x en cada cuadro."), title: titleFail },
      hints: [
        T("Every frame, x should grow by alien_speed.", "En cada cuadro, x debe crecer alien_speed."),
        T("Replace the 0 with the variable alien_speed.", "Cambia el 0 por la variable alien_speed."),
        T("Example:\n    alien.x = alien.x + alien_speed\n    text(TITLE, 10, 28)", "Ejemplo:\n    alien.x = alien.x + alien_speed\n    text(TITLE, 10, 28)"),
      ],
    },
    l3: {
      title: T("Flight Controls", "Controles de vuelo"),
      goals: { en: ["Holding right moves the ship right (stop at x = 380).", "Turn the alien around at the edges: if alien.x > 380 or alien.x < 20, flip alien_speed."], es: ["Mantener derecha mueve la nave a la derecha (detente en x = 380).", "Haz que el alienígena dé la vuelta en los bordes: si alien.x > 380 o alien.x < 20, invierte alien_speed."] },
      scaffold: (c) => `
${mark("l3", c("Flight Controls", "Controles de vuelo"))}
@every_frame
def controls():
    global alien_speed
    if key_down("left") and player.x > 20:
        player.x = player.x - speed
    # ${c('add an if for the "right" arrow (stop at x = 380)', 'agrega un if para la flecha "right" (detente en x = 380)')}
    pass
    # ${c("turn the alien around: if alien.x > 380 or alien.x < 20, flip alien_speed", "voltea al alienígena: si alien.x > 380 o alien.x < 20, invierte alien_speed")}
    pass
`,
      solve: [["    pass", '    if key_down("right") and player.x < 380:\n        player.x = player.x + speed'], ["    pass", "    if alien.x > 380 or alien.x < 20:\n        alien_speed = -alien_speed"]],
      check: `
player.x = 200
_step(5, keys=["right"])
if player.x <= 200:
    result = "right"
else:
    player.x = 370
    _step(30, keys=["right"])
    if player.x > 380 + speed:
        result = "edge"
    else:
        alien.x = 385
        alien_speed = abs(alien_speed) or 2
        _step(1)
        if alien_speed >= 0:
            result = "bounce"
`,
      fails: {
        right: T("The right arrow doesn't move the ship yet.", "La flecha derecha todavía no mueve la nave."),
        edge: T("The ship flies off the right side. Only move right while player.x < 380.", "La nave se sale por la derecha. Solo muévela si player.x < 380."),
        bounce: T("The alien should turn around at the edge: alien_speed = -alien_speed", "El alienígena debe dar la vuelta en el borde: alien_speed = -alien_speed"),
      },
      hints: [
        T("Copy the left-arrow if, then change left to right, - to + and > 20 to < 380.", "Copia el if de la izquierda y cambia left por right, - por + y > 20 por < 380."),
        T("A minus sign flips a speed: 2 becomes -2, -2 becomes 2.", "Un signo menos invierte una velocidad: 2 se vuelve -2 y -2 se vuelve 2."),
        T('Example:\n    if key_down("right") and player.x < 380:\n        player.x = player.x + speed\n    if alien.x > 380 or alien.x < 20:\n        alien_speed = -alien_speed', 'Ejemplo:\n    if key_down("right") and player.x < 380:\n        player.x = player.x + speed\n    if alien.x > 380 or alien.x < 20:\n        alien_speed = -alien_speed'),
      ],
    },
    l4: {
      title: T("Lasers", "Láseres"),
      goals: { en: ["Pressing space already adds a laser to the bullets list.", "Use a for loop to move EVERY bullet up by 8."], es: ["Presionar espacio ya agrega un láser a la lista bullets.", "Usa un bucle for para subir CADA bala 8."] },
      scaffold: (c) => `
${mark("l4", c("Lasers", "Láseres"))}
bullets = []                          # ${c("a LIST of lasers", "una LISTA de láseres")}

@every_frame
def lasers():
    if key_pressed("space"):
        bullets.append(Sprite("laser", x=player.x, y=player.y - 20))
    # ${c("move EVERY bullet up by 8:  for bullet in bullets: ...", "sube CADA bala 8:  for bullet in bullets: ...")}
    pass
    cleanup(bullets)                  # ${c("removes lasers that left the screen", "quita los láseres que salieron de la pantalla")}
`,
      solve: [["    pass\n    cleanup", "    for bullet in bullets:\n        bullet.y = bullet.y - 8\n    cleanup"]],
      check: `
bullets.clear()
_step(1, keys=["space"])
if len(bullets) != 1:
    result = "fire"
else:
    b = bullets[0]
    y0 = b.y
    _step(3)
    if abs((y0 - b.y) - 24) > 0.01:
        result = "move"
`,
      fails: { fire: T("Pressing space should add one laser. Keep the key_pressed part.", "Presionar espacio debe agregar un láser. Deja la parte de key_pressed."), move: T("Every laser should move up by 8 each frame.", "Cada láser debe subir 8 en cada cuadro.") },
      hints: [
        T("A for loop runs the same code for every item in a list.", "Un bucle for ejecuta el mismo código para cada elemento de una lista."),
        T("Up means y gets smaller.", "Subir significa que y disminuye."),
        T("Example:\n    for bullet in bullets:\n        bullet.y = bullet.y - 8", "Ejemplo:\n    for bullet in bullets:\n        bullet.y = bullet.y - 8"),
      ],
    },
    l5: {
      title: T("Direct Hit", "Impacto directo"),
      goals: { en: ["If a bullet touches the alien: hide the bullet, add 1 to score, play(\"boom\").", "Move the alien somewhere new: alien.x = random_x()."], es: ["Si una bala toca al alienígena: esconde la bala, suma 1 a score, play(\"boom\").", "Mueve al alienígena a otro lugar: alien.x = random_x()."] },
      scaffold: (c) => `
${mark("l5", c("Direct Hit", "Impacto directo"))}
score = 0

@every_frame
def hits():
    global score                      # ${c("lets this function change score", "permite que esta función cambie score")}
    for bullet in bullets:
        # ${c('if bullet touches alien: bullet.hide(), score + 1, play("boom"), alien.x = random_x()', 'si la bala toca al alien: bullet.hide(), score + 1, play("boom"), alien.x = random_x()')}
        pass
    text("Score: " + str(score), 10, 52)
`,
      solve: [["        pass\n    text(\"Score", "        if bullet.touching(alien):\n            bullet.hide()\n            score += 1\n            play(\"boom\")\n            alien.x = random_x()\n    text(\"Score"]],
      check: `
s0 = score
b = Sprite("laser", x=alien.x, y=alien.y)
bullets.append(b)
_step(1)
if score != s0 + 1:
    result = "score"
elif b.visible:
    result = "hide"
`,
      fails: { score: T("A laser hitting the alien should add exactly 1 to score.", "Un láser que golpea al alienígena debe sumar exactamente 1 a score."), hide: T("Hide the laser after it hits: bullet.hide()", "Esconde el láser después del golpe: bullet.hide()") },
      hints: [
        T("Use an if with bullet.touching(alien) inside the for loop.", "Usa un if con bullet.touching(alien) dentro del bucle for."),
        T("Hiding the bullet stops it from scoring twice.", "Esconder la bala evita que cuente dos veces."),
        T("Example:\n        if bullet.touching(alien):\n            bullet.hide()\n            score += 1\n            play(\"boom\")\n            alien.x = random_x()", "Ejemplo:\n        if bullet.touching(alien):\n            bullet.hide()\n            score += 1\n            play(\"boom\")\n            alien.x = random_x()"),
      ],
    },
    side1: {
      title: T("Side quest: Alien Attack", "Misión extra: Ataque alienígena"),
      goals: { en: ["If a bomb touches the player: hide it, lives - 1, play(\"hurt\").", "When lives == 0: game_over(\"Game over!\")."], es: ["Si una bomba toca al jugador: escóndela, lives - 1, play(\"hurt\").", "Cuando lives == 0: game_over(\"Game over!\")."] },
      scaffold: (c) => `
${mark("side1", c("Alien Attack", "Ataque alienígena"))}
lives = 3
bombs = []

@every_frame
def alien_attack():
    global lives
    if random.randint(1, 60) == 1:    # ${c("about once a second, drop a bomb", "más o menos cada segundo, suelta una bomba")}
        bombs.append(Sprite("bomb", x=alien.x, y=alien.y + 20))
    for bomb in bombs:
        bomb.y = bomb.y + 4
        # ${c('if bomb touches player: bomb.hide(), lives - 1, play("hurt")', 'si la bomba toca al jugador: bomb.hide(), lives - 1, play("hurt")')}
        # ${c('and if lives == 0: game_over("Game over!")', 'y si lives == 0: game_over("Game over!")')}
        pass
    cleanup(bombs)
    text("Lives: " + str(lives), 300, 28)
`,
      solve: [["        pass\n    cleanup(bombs)", "        if bomb.touching(player):\n            bomb.hide()\n            lives -= 1\n            play(\"hurt\")\n            if lives == 0:\n                game_over(\"Game over!\")\n    cleanup(bombs)"]],
      check: `
import pq as _pq
l0 = lives
b = Sprite("bomb", x=player.x, y=player.y - 4)
bombs.append(b)
_step(1)
if lives != l0 - 1:
    result = "hit"
elif b.visible:
    result = "hide"
else:
    lives = 1
    b = Sprite("bomb", x=player.x, y=player.y - 4)
    bombs.append(b)
    _step(1)
    if not _pq._state["over"]:
        result = "over"
`,
      fails: { hit: T("A bomb touching the player should take away exactly 1 life.", "Una bomba que toca al jugador debe quitar exactamente 1 vida."), hide: T("Hide the bomb after it hits.", "Esconde la bomba después del golpe."), over: T("When lives reaches 0, call game_over(\"Game over!\").", "Cuando lives llegue a 0, llama a game_over(\"Game over!\").") },
      hints: [
        T("This looks a lot like your Level 5 hits() code, but with bombs and the player.", "Se parece mucho a tu código hits() del Nivel 5, pero con bombas y el jugador."),
        T("Put the lives == 0 check inside the hit, right after lives goes down.", "Pon la revisión de lives == 0 dentro del golpe, justo después de bajar lives."),
        T("Example:\n        if bomb.touching(player):\n            bomb.hide()\n            lives -= 1\n            play(\"hurt\")\n            if lives == 0:\n                game_over(\"Game over!\")", "Ejemplo:\n        if bomb.touching(player):\n            bomb.hide()\n            lives -= 1\n            play(\"hurt\")\n            if lives == 0:\n                game_over(\"Game over!\")"),
      ],
    },
    l6: {
      title: T("Triple Shot", "Disparo triple"),
      goals: { en: ["Fill in fire(x, dx): make a laser at (x, player.y - 20), set its .vx to dx, add it to bullets.", "Score 5 and press space: you get a triple shot!"], es: ["Completa fire(x, dx): crea un láser en (x, player.y - 20), pon su .vx en dx y agrégalo a bullets.", "Llega a 5 puntos y presiona espacio: ¡disparo triple!"] },
      scaffold: (c) => `
${mark("l6", c("Triple Shot", "Disparo triple"))}
def fire(x, dx):                      # ${c("x and dx are PARAMETERS (inputs)", "x y dx son PARÁMETROS (entradas)")}
    # ${c("make a laser at (x, player.y - 20), set its .vx to dx, add it to bullets", "crea un láser en (x, player.y - 20), pon su .vx en dx y agrégalo a bullets")}
    pass

@every_frame
def spread():
    if key_pressed("space") and score >= 5:   # ${c("triple shot once score is 5!", "¡disparo triple al llegar a 5!")}
        fire(player.x, -2)
        fire(player.x, 2)
    for bullet in bullets:
        bullet.x = bullet.x + bullet.vx
`,
      solve: [["    pass\n\n@every_frame", "    b = Sprite(\"laser\", x=x, y=player.y - 20)\n    b.vx = dx\n    bullets.append(b)\n\n@every_frame"]],
      check: `
if not callable(globals().get("fire")):
    result = "def"
else:
    n = len(bullets)
    fire(123, 2)
    if len(bullets) != n + 1:
        result = "add"
    else:
        b = bullets[-1]
        if b.x != 123 or b.vx != 2:
            result = "params"
`,
      fails: { def: T("Keep the function: def fire(x, dx):", "Deja la función: def fire(x, dx):"), add: T("fire should add exactly one laser to bullets.", "fire debe agregar exactamente un láser a bullets."), params: T("Use the parameters: the laser starts at x and its .vx is dx.", "Usa los parámetros: el láser empieza en x y su .vx es dx.") },
      hints: [
        T("You need three lines: make the Sprite, set .vx, append it.", "Necesitas tres líneas: crear el Sprite, poner .vx y agregarlo."),
        T("Inside the function, x and dx are whatever numbers were passed in.", "Dentro de la función, x y dx son los números que se pasaron."),
        T("Example:\n    b = Sprite(\"laser\", x=x, y=player.y - 20)\n    b.vx = dx\n    bullets.append(b)", "Ejemplo:\n    b = Sprite(\"laser\", x=x, y=player.y - 20)\n    b.vx = dx\n    bullets.append(b)"),
      ],
    },
    mygame: FINAL(scoreWin),
  },
  boss: {
    starter: (c) => `from pq import *

# ${c("THE BUG BEAST broke this space game! Find and squash 4 bugs.", "¡LA BESTIA DE BICHOS rompió este juego espacial! Encuentra y aplasta 4 bichos.")}
background("#000814")
player = Sprite("ship", x=200, y=370)
alien = Sprite("alien", x=200, y=80)
bullets = []
score = 0
stars = []

for i in range(20)
    stars.append(Box(random_x(), random.randint(0, 400), 2, 2, "white"))

@every_frame
def controls():
    if key_down("left"):
        player.x -= 5
    if key_down("right"):
        player.x += 5
    if key_pressed("space"):
        bullets.append(Sprite("laser", x=player.x, y=player.y - 20))
    for bullet in bullets:
        bullet.y = bullet.y + 8
    cleanup(bullets)

@every_frame
def hits():
    global score
    for bullet in bullets:
        if bullet.touching(alien):
            bullet.hide()
            scor = score + 1
            alien.x = random_x()
    text("Score: " + score, 10, 28)
`,
    solve: [["range(20)\n", "range(20):\n"], ["bullet.y + 8", "bullet.y - 8"], ["scor = score", "score = score"], ['"Score: " + score', '"Score: " + str(score)']],
    check: bossTry + `
bullets.clear()
text_ok = _try(frames=1, keys=["space"]) and text_ok
b = bullets[0] if bullets else None
y0 = b.y if b else 0
text_ok = _try(frames=3) and text_ok
if b is None or b.y >= y0:
    bad.append("laser")
s0 = score
b2 = Sprite("laser", x=alien.x, y=alien.y)
bullets.append(b2)
text_ok = _try(frames=1) and text_ok
if score != s0 + 1:
    bad.append("score")
` + bossEnd,
    fails: { laser: T("Bug found: the lasers fly backwards! Up means y gets smaller.", "Bicho encontrado: ¡los láseres van hacia atrás! Subir significa que y disminuye."), ...bossFailsCommon },
    hints: bossHints("add \":\" after range(20) · bullet.y - 8 · score = score + 1 · str(score)"),
  },
};

// ===================================================================== Road Hopper (Frogger-style)
const hopper = {
  id: "hopper",
  name: T("Road Hopper", "Cruza la calle"),
  blurb: T("Hop across lanes of traffic to reach the other side. Frogger-style.", "Salta entre carriles de tráfico hasta llegar al otro lado. Estilo Frogger."),
  sprite: "frog",
  levels: {
    l1: {
      title: T("Setup", "Preparación"), goals: l1Goals("hop", 40),
      scaffold: (c) => l1Base(c, { sprite: `PLAYER_SPRITE = "frog"     # ${c("try frog, cat, robot, or one you unlocked", "prueba frog, cat, robot o uno que desbloqueaste")}`, bg: "#1e272e", v: "hop", vHint: T("how far each hop goes (try 40)", "qué tan lejos llega cada salto (prueba 40)"), extra: "", player: "player = Sprite(PLAYER_SPRITE, x=200, y=380)" }),
      solve: [['TITLE = "???"', 'TITLE = "Road Hopper"'], ["hop = 0 ", "hop = 40 "], ['print("")', "print(TITLE)"]],
      check: l1Check("hop"), fails: l1Fails("hop"), hints: l1Hints("hop", 40),
    },
    l2: {
      title: T("Traffic", "Tráfico"),
      goals: { en: ["Make the car drive: change the 0 to car_speed.", "Show your TITLE on screen with text(TITLE, 10, 28)."], es: ["Haz que el carro avance: cambia el 0 por car_speed.", "Muestra tu TITLE en pantalla con text(TITLE, 10, 28)."] },
      scaffold: (c) => `
${mark("l2", c("Traffic", "Tráfico"))}
road = Box(200, 220, 400, 220, "#57606f")
car = Sprite("car", x=0, y=300)
car_speed = 3

@every_frame                          # ${c("runs this function 60 times a second: the GAME LOOP", "ejecuta esta función 60 veces por segundo: el CICLO DEL JUEGO")}
def drive():
    car.x = car.x + 0                 # ${c("use car_speed instead of 0", "usa car_speed en vez de 0")}
    if car.x > 420:                   # ${c("off the right side? come back on the left", "¿salió por la derecha? vuelve por la izquierda")}
        car.x = -20
    text("", 10, 28)                  # ${c("show your TITLE here", "muestra tu TITLE aquí")}
`,
      solve: [["car.x + 0", "car.x + car_speed"], ['text("", 10, 28)', "text(TITLE, 10, 28)"]],
      check: `
import pq as _pq
car.x = 100
_step(10)
if car_speed == 0 or abs(car.x - (100 + 10 * car_speed)) > 0.01:
    result = "move"
elif not ${textsHasTitle}:
    result = "title"
`,
      fails: { move: T("The car isn't driving yet. Add car_speed to car.x every frame.", "El carro aún no avanza. Suma car_speed a car.x en cada cuadro."), title: titleFail },
      hints: [
        T("Every frame, x should grow by car_speed.", "En cada cuadro, x debe crecer car_speed."),
        T("Replace the 0 with the variable car_speed.", "Cambia el 0 por la variable car_speed."),
        T("Example:\n    car.x = car.x + car_speed\n    text(TITLE, 10, 28)", "Ejemplo:\n    car.x = car.x + car_speed\n    text(TITLE, 10, 28)"),
      ],
    },
    l3: {
      title: T("Hop!", "¡Salta!"),
      goals: { en: ["Add hops for down, left and right (each moves by hop).", "One press = one hop, so use key_pressed, not key_down."], es: ["Agrega saltos para abajo, izquierda y derecha (cada uno se mueve hop).", "Una pulsación = un salto, así que usa key_pressed, no key_down."] },
      scaffold: (c) => `
${mark("l3", c("Hop!", "¡Salta!"))}
@every_frame
def hopping():
    # ${c("EVENTS: key_pressed is True once per press, so each press = one hop", "EVENTOS: key_pressed es True una vez por pulsación: cada pulsación = un salto")}
    if key_pressed("up"):
        player.y = player.y - hop
    # ${c('add hops for "down", "left" and "right"', 'agrega saltos para "down", "left" y "right"')}
    pass
    if player.y > 380:                # ${c("stay on the screen", "quédate en la pantalla")}
        player.y = 380
`,
      solve: [["    pass\n", '    if key_pressed("down"):\n        player.y = player.y + hop\n    if key_pressed("left"):\n        player.x = player.x - hop\n    if key_pressed("right"):\n        player.x = player.x + hop\n']],
      check: `
player.x, player.y = 200, 380
_step(5, keys=["up"])
if player.y != 380 - hop:
    result = "up"
else:
    _step(1, keys=["right"])
    if player.x != 200 + hop:
        result = "sides"
    else:
        _step(1, keys=["left"])
        _step(1, keys=["down"])
        if (player.x, player.y) != (200, 380):
            result = "sides"
`,
      fails: { up: T("Holding up should hop just once. Keep key_pressed for up.", "Mantener arriba debe saltar solo una vez. Deja key_pressed para arriba."), sides: T("Down, left and right should each hop by hop.", "Abajo, izquierda y derecha deben saltar hop cada uno.") },
      hints: [
        T("Copy the up if three times and change the key and the math.", "Copia el if de arriba tres veces y cambia la tecla y la operación."),
        T("Left changes x (smaller), right changes x (bigger), down changes y (bigger).", "Izquierda cambia x (menor), derecha cambia x (mayor), abajo cambia y (mayor)."),
        T('Example:\n    if key_pressed("right"):\n        player.x = player.x + hop', 'Ejemplo:\n    if key_pressed("right"):\n        player.x = player.x + hop'),
      ],
    },
    l4: {
      title: T("Busy Road", "Calle llena"),
      goals: { en: ["Change range(1) to range(4) for 4 lanes of cars.", "In traffic(), move every car c by c.vx and wrap it like your first car."], es: ["Cambia range(1) por range(4) para tener 4 carriles.", "En traffic(), mueve cada carro c según c.vx y haz que vuelva como tu primer carro."] },
      scaffold: (c) => `
${mark("l4", c("Busy Road", "Calle llena"))}
lanes = []                            # ${c("a LIST of cars", "una LISTA de carros")}
# ${c("A FOR LOOP: change 1 to 4 to make 4 lanes of traffic", "Un BUCLE FOR: cambia 1 por 4 para tener 4 carriles")}
for i in range(1):
    c = Sprite("car", x=i * 90, y=260 - i * 40)
    c.vx = 2 + i                      # ${c("each lane is a little faster", "cada carril es un poco más rápido")}
    lanes.append(c)

@every_frame
def traffic():
    for c in lanes:
        # ${c("move c by c.vx, and wrap it around like your first car", "mueve c según c.vx y haz que vuelva como tu primer carro")}
        pass
`,
      solve: [["range(1)", "range(4)"], ["        pass", "        c.x = c.x + c.vx\n        if c.x > 420:\n            c.x = -20"]],
      check: `
if len(lanes) < 4:
    result = "count"
else:
    xs = [c.x for c in lanes]
    _step(1)
    if not all(c.x != x for c, x in zip(lanes, xs)):
        result = "move"
    else:
        lanes[0].x = 430
        _step(1)
        if lanes[0].x > 420:
            result = "wrap"
`,
      fails: { count: T("Make at least 4 lanes of cars. Check range( ).", "Crea al menos 4 carriles. Revisa range( )."), move: T("Every car in lanes should move by its own c.vx.", "Cada carro de lanes debe moverse según su c.vx."), wrap: T("Cars that leave on the right should come back on the left.", "Los carros que salen por la derecha deben volver por la izquierda.") },
      hints: [
        T("The for loop gives you each car as c, one at a time.", "El bucle for te da cada carro como c, uno por uno."),
        T("Copy the wrap-around if from drive() in Level 2, using c instead of car.", "Copia el if de drive() del Nivel 2, usando c en vez de car."),
        T("Example:\n        c.x = c.x + c.vx\n        if c.x > 420:\n            c.x = -20", "Ejemplo:\n        c.x = c.x + c.vx\n        if c.x > 420:\n            c.x = -20"),
      ],
    },
    l5: {
      title: T("Crossing", "El cruce"),
      goals: { en: ["If the player touches a car: play(\"hurt\") and go back to the start (200, 380).", "Reaching the top (y < 100): score + 1, play(\"coin\"), back to the start."], es: ["Si el jugador toca un carro: play(\"hurt\") y vuelve al inicio (200, 380).", "Al llegar arriba (y < 100): score + 1, play(\"coin\") y vuelve al inicio."] },
      scaffold: (c) => `
${mark("l5", c("Crossing", "El cruce"))}
score = 0

@every_frame
def crossing():
    global score
    for c in [car] + lanes:
        # ${c('if the player touches c: play("hurt"), back to the start (200, 380)', 'si el jugador toca c: play("hurt"), vuelve al inicio (200, 380)')}
        pass
    # ${c('made it to the top (y < 100)? score + 1, play("coin"), back to the start', '¿llegó arriba (y < 100)? score + 1, play("coin"), vuelve al inicio')}
    pass
    text("Score: " + str(score), 10, 52)
`,
      solve: [["        pass", "        if player.touching(c):\n            play(\"hurt\")\n            player.x, player.y = 200, 380"], ["    pass\n    text(\"Score", "    if player.y < 100:\n        score += 1\n        play(\"coin\")\n        player.x, player.y = 200, 380\n    text(\"Score"]],
      check: `
c = lanes[0]
player.x, player.y = c.x, c.y
_step(1)
if (player.x, player.y) != (200, 380):
    result = "hit"
else:
    s0 = score
    player.x, player.y = 60, 80
    _step(1)
    if score != s0 + 1:
        result = "score"
    elif player.y != 380:
        result = "reset"
`,
      fails: { hit: T("Touching a car should send the player back to (200, 380).", "Tocar un carro debe regresar al jugador a (200, 380)."), score: T("Reaching the top should add exactly 1 to score.", "Llegar arriba debe sumar exactamente 1 a score."), reset: T("After scoring, send the player back to the start.", "Después de anotar, regresa al jugador al inicio.") },
      hints: [
        T("Two ifs: one inside the for loop for cars, one after it for the top.", "Dos if: uno dentro del bucle para los carros y otro después para la meta."),
        T("player.x, player.y = 200, 380 moves the player in one line.", "player.x, player.y = 200, 380 mueve al jugador en una línea."),
        T("Example:\n        if player.touching(c):\n            play(\"hurt\")\n            player.x, player.y = 200, 380\n    if player.y < 100:\n        score += 1\n        play(\"coin\")\n        player.x, player.y = 200, 380", "Ejemplo:\n        if player.touching(c):\n            play(\"hurt\")\n            player.x, player.y = 200, 380\n    if player.y < 100:\n        score += 1\n        play(\"coin\")\n        player.x, player.y = 200, 380"),
      ],
    },
    side1: {
      title: T("Side quest: Lives", "Misión extra: Vidas"),
      goals: { en: ["In crossing() (Level 5), when a car hits: lives - 1.", "When lives == 0: game_over(\"Game over!\"). Add lives to the global line."], es: ["En crossing() (Nivel 5), cuando un carro golpea: lives - 1.", "Cuando lives == 0: game_over(\"Game over!\"). Agrega lives a la línea global."] },
      scaffold: (c) => `
${mark("side1", c("Lives", "Vidas"))}
lives = 3
# ${c("In crossing() (Level 5): change the global line to:  global score, lives", "En crossing() (Nivel 5): cambia la línea global por:  global score, lives")}
# ${c('and when a car hits: lives -= 1, and if lives == 0: game_over("Game over!")', 'y cuando un carro golpea: lives -= 1, y si lives == 0: game_over("Game over!")')}

@every_frame
def show_lives():
    text("Lives: " + str(lives), 300, 28)
`,
      solve: [["^    global score\n    for c in [car] + lanes:", "    global score, lives\n    for c in [car] + lanes:"], ["^            play(\"hurt\")\n            player.x, player.y = 200, 380", "            play(\"hurt\")\n            player.x, player.y = 200, 380\n            lives -= 1\n            if lives == 0:\n                game_over(\"Game over!\")"]],
      check: `
import pq as _pq
l0 = lives
c = lanes[0]
player.x, player.y = c.x, c.y
_step(1)
if lives != l0 - 1:
    result = "hit"
else:
    lives = 1
    c = lanes[0]
    player.x, player.y = c.x, c.y
    _step(1)
    if not _pq._state["over"]:
        result = "over"
`,
      fails: { hit: T("A car hit should take away exactly 1 life (in crossing()).", "Un golpe de carro debe quitar exactamente 1 vida (en crossing())."), over: T("When lives reaches 0, call game_over(\"Game over!\").", "Cuando lives llegue a 0, llama a game_over(\"Game over!\").") },
      hints: [
        T("This level changes your Level 5 code instead of adding a new loop.", "Este nivel cambia tu código del Nivel 5 en vez de agregar otro bucle."),
        T("Without global lives, Python won't let crossing() change lives.", "Sin global lives, Python no deja que crossing() cambie lives."),
        T("Example:\n    global score, lives\n    ...\n            lives -= 1\n            if lives == 0:\n                game_over(\"Game over!\")", "Ejemplo:\n    global score, lives\n    ...\n            lives -= 1\n            if lives == 0:\n                game_over(\"Game over!\")"),
      ],
    },
    l6: {
      title: T("Lane Builder", "Constructor de carriles"),
      goals: { en: ["Fill in add_lane(y, speed): a car at (420, y) with .vx = speed, added to lanes.", "In traffic(), cars going LEFT (x < -30) should come back at x = 420."], es: ["Completa add_lane(y, speed): un carro en (420, y) con .vx = speed, agregado a lanes.", "En traffic(), los carros que van a la IZQUIERDA (x < -30) deben volver en x = 420."] },
      scaffold: (c) => `
${mark("l6", c("Lane Builder", "Constructor de carriles"))}
def add_lane(y, speed):               # ${c("y and speed are PARAMETERS (inputs)", "y y speed son PARÁMETROS (entradas)")}
    # ${c("make a car at (420, y), set its .vx to speed, add it to lanes", "crea un carro en (420, y), pon su .vx en speed y agrégalo a lanes")}
    pass

add_lane(120, -4)                     # ${c("a lane driving LEFT!", "¡un carril que va a la IZQUIERDA!")}
# ${c("Then in traffic(): if c.x < -30, move it to x = 420", "Luego en traffic(): si c.x < -30, muévelo a x = 420")}
`,
      solve: [["    pass\n\nadd_lane", "    c = Sprite(\"car\", x=420, y=y)\n    c.vx = speed\n    lanes.append(c)\n\nadd_lane"], ["^            c.x = -20", "            c.x = -20\n        if c.x < -30:\n            c.x = 420"]],
      check: `
if not callable(globals().get("add_lane")):
    result = "def"
else:
    n = len(lanes)
    add_lane(150, -3)
    if len(lanes) != n + 1:
        result = "add"
    else:
        c = lanes[-1]
        if c.y != 150 or c.vx != -3:
            result = "params"
        else:
            c.x = -35
            _step(1)
            if c.x < -30:
                result = "wrap"
`,
      fails: { def: T("Keep the function: def add_lane(y, speed):", "Deja la función: def add_lane(y, speed):"), add: T("add_lane should add exactly one car to lanes.", "add_lane debe agregar exactamente un carro a lanes."), params: T("Use the parameters: the car goes at y, and its .vx is speed.", "Usa los parámetros: el carro va en y, y su .vx es speed."), wrap: T("Cars driving left should wrap back to x = 420 in traffic().", "Los carros que van a la izquierda deben volver a x = 420 en traffic().") },
      hints: [
        T("Look at how Level 4 made each car: Sprite, then .vx, then append.", "Mira cómo el Nivel 4 creó cada carro: Sprite, luego .vx y luego append."),
        T("A negative speed drives left, so it needs its own wrap-around if.", "Una velocidad negativa va a la izquierda, así que necesita su propio if."),
        T("Example:\n    c = Sprite(\"car\", x=420, y=y)\n    c.vx = speed\n    lanes.append(c)", "Ejemplo:\n    c = Sprite(\"car\", x=420, y=y)\n    c.vx = speed\n    lanes.append(c)"),
      ],
    },
    mygame: FINAL(scoreWin),
  },
  boss: {
    starter: (c) => `from pq import *

# ${c("THE BUG BEAST broke this road game! Find and squash 4 bugs.", "¡LA BESTIA DE BICHOS rompió este juego! Encuentra y aplasta 4 bichos.")}
background("#1e272e")
player = Sprite("frog", x=200, y=380)
lanes = []
score = 0

for i in range(3)
    c = Sprite("car", x=i * 120, y=280 - i * 60)
    c.vx = 3
    lanes.append(c)

@every_frame
def hopping():
    global score
    if key_pressed("up"):
        player.y = player.y + 40
    if player.y < 100:
        scor = score + 1
        player.y = 380
    for c in lanes:
        c.x = c.x + c.vx
        if c.x > 420:
            c.x = -20
    text("Score: " + score, 10, 28)
`,
    solve: [["range(3)\n", "range(3):\n"], ["player.y + 40", "player.y - 40"], ["scor = score", "score = score"], ['"Score: " + score', '"Score: " + str(score)']],
    check: bossTry + `
player.x, player.y = 40, 380
text_ok = _try(frames=1, keys=["up"]) and text_ok
if player.y >= 380:
    bad.append("hop")
s0 = score
player.x, player.y = 40, 80
text_ok = _try(frames=1) and text_ok
if score != s0 + 1:
    bad.append("score")
` + bossEnd,
    fails: { hop: T("Bug found: pressing up hops DOWN! Up means y gets smaller.", "Bicho encontrado: ¡arriba salta hacia ABAJO! Subir significa que y disminuye."), ...bossFailsCommon },
    hints: bossHints("add \":\" after range(3) · player.y - 40 · score = score + 1 · str(score)"),
  },
};

// ===================================================================== Brick Breaker (Breakout-style)
const breaker = {
  id: "breaker",
  name: T("Brick Breaker", "Rompe ladrillos"),
  blurb: T("Bounce a ball off your paddle and smash every brick. Breakout-style.", "Rebota una pelota con tu paleta y rompe todos los ladrillos. Estilo Breakout."),
  sprite: "ball",
  levels: {
    l1: {
      title: T("Setup", "Preparación"), goals: l1Goals("speed", 6),
      scaffold: (c) => l1Base(c, { sprite: `BALL_SPRITE = "ball"       # ${c("try ball, star, cat, or one you unlocked", "prueba ball, star, cat o uno que desbloqueaste")}\nPADDLE_COLOR = "#48dbfb"   # ${c("your paddle's colour", "el color de tu paleta")}`, bg: "#130f40", v: "speed", vHint: T("how fast your paddle moves (try 6)", "qué tan rápido se mueve tu paleta (prueba 6)"), extra: "", player: "paddle = Box(200, 380, 80, 12, PADDLE_COLOR)" }),
      solve: [['TITLE = "???"', 'TITLE = "Brick Breaker"'], ["speed = 0 ", "speed = 6 "], ['print("")', "print(TITLE)"]],
      check: l1Check("speed"), fails: l1Fails("speed"), hints: l1Hints("speed", 6),
    },
    l2: {
      title: T("The Ball", "La pelota"),
      goals: { en: ["Set ball.vy to 3 so the ball moves down.", "In move_ball(), change the 0 to ball.vy.", "Show your TITLE on screen with text(TITLE, 10, 28)."], es: ["Pon ball.vy en 3 para que la pelota baje.", "En move_ball(), cambia el 0 por ball.vy.", "Muestra tu TITLE en pantalla con text(TITLE, 10, 28)."] },
      scaffold: (c) => `
${mark("l2", c("The Ball", "La pelota"))}
ball = Sprite(BALL_SPRITE, x=200, y=200, size=0.6)
ball.vx = 3                           # ${c("sideways speed", "velocidad hacia los lados")}
ball.vy = 0                           # ${c("up/down speed: make it 3", "velocidad arriba/abajo: ponla en 3")}

@every_frame                          # ${c("runs this function 60 times a second: the GAME LOOP", "ejecuta esta función 60 veces por segundo: el CICLO DEL JUEGO")}
def move_ball():
    ball.x = ball.x + ball.vx
    ball.y = ball.y + 0               # ${c("use ball.vy instead of 0", "usa ball.vy en vez de 0")}
    text("", 10, 28)                  # ${c("show your TITLE here", "muestra tu TITLE aquí")}
`,
      solve: [["ball.vy = 0 ", "ball.vy = 3 "], ["ball.y + 0", "ball.y + ball.vy"], ['text("", 10, 28)', "text(TITLE, 10, 28)"]],
      check: `
import pq as _pq
if ball.vy == 0:
    result = "vy"
else:
    ball.x, ball.y, ball.vx, ball.vy = 200, 150, 0, 3
    _step(5)
    if abs(ball.y - 165) > 0.01:
        result = "move"
    elif not ${textsHasTitle}:
        result = "title"
`,
      fails: { vy: T("Give the ball an up/down speed: ball.vy = 3.", "Dale a la pelota velocidad vertical: ball.vy = 3."), move: T("The ball isn't moving down. Add ball.vy to ball.y every frame.", "La pelota no baja. Suma ball.vy a ball.y en cada cuadro."), title: titleFail },
      hints: [
        T("x uses ball.vx already. Do the same for y with ball.vy.", "x ya usa ball.vx. Haz lo mismo para y con ball.vy."),
        T("Two changes: the 0 in ball.vy = 0, and the 0 in move_ball().", "Dos cambios: el 0 de ball.vy = 0 y el 0 de move_ball()."),
        T("Example:\nball.vy = 3\n...\n    ball.y = ball.y + ball.vy\n    text(TITLE, 10, 28)", "Ejemplo:\nball.vy = 3\n...\n    ball.y = ball.y + ball.vy\n    text(TITLE, 10, 28)"),
      ],
    },
    l3: {
      title: T("Bounce", "Rebote"),
      goals: { en: ["Bounce off the top: if ball.y < 10, flip ball.vy.", "Holding right moves the paddle right (stop at 360)."], es: ["Rebota en el techo: si ball.y < 10, invierte ball.vy.", "Mantener derecha mueve la paleta a la derecha (detente en 360)."] },
      scaffold: (c) => `
${mark("l3", c("Bounce", "Rebote"))}
@every_frame
def bounce():
    if ball.x < 10 or ball.x > 390:   # ${c("hit a side wall? flip sideways speed", "¿pegó en una pared? invierte la velocidad lateral")}
        ball.vx = -ball.vx
    # ${c("bounce off the top: if ball.y < 10, flip ball.vy", "rebota en el techo: si ball.y < 10, invierte ball.vy")}
    pass
    if ball.touching(paddle) and ball.vy > 0:
        ball.vy = -ball.vy
    if key_down("left") and paddle.x > 40:
        paddle.x = paddle.x - speed
    # ${c('add the "right" arrow (stop at 360)', 'agrega la flecha "right" (detente en 360)')}
    pass
`,
      solve: [["    pass", "    if ball.y < 10:\n        ball.vy = -ball.vy"], ["    pass", '    if key_down("right") and paddle.x < 360:\n        paddle.x = paddle.x + speed']],
      check: `
paddle.x = 200
_step(3, keys=["right"])
if paddle.x <= 200:
    result = "right"
else:
    ball.x, ball.y, ball.vx, ball.vy = 200, 8, 0, -3
    _step(1)
    if ball.vy <= 0:
        result = "top"
`,
      fails: { right: T("The right arrow doesn't move the paddle yet.", "La flecha derecha todavía no mueve la paleta."), top: T("The ball should bounce off the top: flip ball.vy when ball.y < 10.", "La pelota debe rebotar en el techo: invierte ball.vy cuando ball.y < 10.") },
      hints: [
        T("The side-wall if is a good model for the top.", "El if de las paredes laterales es un buen modelo para el techo."),
        T("For the paddle, copy the left if and change left to right, - to + and > 40 to < 360.", "Para la paleta, copia el if de la izquierda y cambia left por right, - por + y > 40 por < 360."),
        T('Example:\n    if ball.y < 10:\n        ball.vy = -ball.vy\n    if key_down("right") and paddle.x < 360:\n        paddle.x = paddle.x + speed', 'Ejemplo:\n    if ball.y < 10:\n        ball.vy = -ball.vy\n    if key_down("right") and paddle.x < 360:\n        paddle.x = paddle.x + speed'),
      ],
    },
    l4: {
      title: T("Brick Wall", "Muro de ladrillos"),
      goals: { en: ["Change range(1) to range(4) for 4 rows of bricks.", "4 rows need 4 colours: add a 4th colour to the colors list."], es: ["Cambia range(1) por range(4) para 4 filas de ladrillos.", "4 filas necesitan 4 colores: agrega un 4.º color a la lista colors."] },
      scaffold: (c) => `
${mark("l4", c("Brick Wall", "Muro de ladrillos"))}
bricks = []
colors = ["#ff4757", "#ffa502", "#2ed573"]
# ${c("A loop INSIDE a loop: rows, then the 8 bricks in each row.", "Un bucle DENTRO de un bucle: filas y luego los 8 ladrillos de cada fila.")}
# ${c("Change range(1) to range(4) for 4 rows.", "Cambia range(1) por range(4) para 4 filas.")}
for row in range(1):
    for col in range(8):
        brick = Box(40 + col * 46, 60 + row * 22, 42, 16, colors[row])
        bricks.append(brick)
`,
      solve: [["row in range(1)", "row in range(4)"], ['"#2ed573"]', '"#2ed573", "#1e90ff"]']],
      check: `
if len(bricks) < 32:
    result = "count"
elif len(set(b.color for b in bricks)) < 4:
    result = "colors"
`,
      fails: { count: T("Make 4 rows of 8 bricks (32 in all). Check range( ).", "Crea 4 filas de 8 ladrillos (32 en total). Revisa range( )."), colors: T("Each row should have its own colour.", "Cada fila debe tener su propio color.") },
      hints: [
        T("If you see an IndexError, the colors list is too short for the number of rows.", "Si ves un IndexError, la lista colors es muy corta para el número de filas."),
        T("Add another colour string at the end of the list, inside the [ ].", "Agrega otro color al final de la lista, dentro de los [ ]."),
        T('Example:\ncolors = ["#ff4757", "#ffa502", "#2ed573", "#1e90ff"]\nfor row in range(4):', 'Ejemplo:\ncolors = ["#ff4757", "#ffa502", "#2ed573", "#1e90ff"]\nfor row in range(4):'),
      ],
    },
    l5: {
      title: T("Smash", "¡A romper!"),
      goals: { en: ["If the ball touches a brick: hide it, flip ball.vy, score + 1, play(\"coin\").", "Add break after that, so one bounce only breaks one brick."], es: ["Si la pelota toca un ladrillo: escóndelo, invierte ball.vy, score + 1, play(\"coin\").", "Agrega break después, para que un rebote solo rompa un ladrillo."] },
      scaffold: (c) => `
${mark("l5", c("Smash", "¡A romper!"))}
score = 0

@every_frame
def smash():
    global score                      # ${c("lets this function change score", "permite que esta función cambie score")}
    for brick in bricks:
        # ${c('if ball touches brick: brick.hide(), flip ball.vy, score + 1, play("coin"), then break', 'si la pelota toca el ladrillo: brick.hide(), invierte ball.vy, score + 1, play("coin") y luego break')}
        pass
    text("Score: " + str(score), 10, 52)
`,
      solve: [["        pass\n    text(\"Score", "        if ball.touching(brick):\n            brick.hide()\n            ball.vy = -ball.vy\n            score += 1\n            play(\"coin\")\n            break\n    text(\"Score"]],
      check: `
b = bricks[-1]
b.show()
ball.x, ball.y, ball.vx, ball.vy = b.x, b.y + 6, 0, -3
s0 = score
_step(1)
if score != s0 + 1:
    result = "score"
elif b.visible:
    result = "hide"
elif ball.vy <= 0:
    result = "bounce"
`,
      fails: { score: T("Breaking a brick should add exactly 1 to score.", "Romper un ladrillo debe sumar exactamente 1 a score."), hide: T("Hide the brick it hits: brick.hide()", "Esconde el ladrillo que golpea: brick.hide()"), bounce: T("The ball should bounce: ball.vy = -ball.vy", "La pelota debe rebotar: ball.vy = -ball.vy") },
      hints: [
        T("Your if goes inside the for loop, where pass is.", "Tu if va dentro del bucle for, donde está pass."),
        T("break stops the loop early, so the ball can't hit two bricks at once.", "break detiene el bucle antes, para que la pelota no rompa dos ladrillos a la vez."),
        T("Example:\n        if ball.touching(brick):\n            brick.hide()\n            ball.vy = -ball.vy\n            score += 1\n            play(\"coin\")\n            break", "Ejemplo:\n        if ball.touching(brick):\n            brick.hide()\n            ball.vy = -ball.vy\n            score += 1\n            play(\"coin\")\n            break"),
      ],
    },
    side1: {
      title: T("Side quest: Lives", "Misión extra: Vidas"),
      goals: { en: ["If the ball falls below the paddle (y > 410): lives - 1, play(\"hurt\"), ball back to (200, 200).", "When lives == 0: game_over(\"Game over!\")."], es: ["Si la pelota cae bajo la paleta (y > 410): lives - 1, play(\"hurt\"), pelota a (200, 200).", "Cuando lives == 0: game_over(\"Game over!\")."] },
      scaffold: (c) => `
${mark("side1", c("Lives", "Vidas"))}
lives = 3

@every_frame
def fall_out():
    global lives
    # ${c('ball below the paddle (y > 410)? lives - 1, play("hurt"), ball back to (200, 200)', '¿pelota bajo la paleta (y > 410)? lives - 1, play("hurt"), pelota a (200, 200)')}
    # ${c('and if lives == 0: game_over("Game over!")', 'y si lives == 0: game_over("Game over!")')}
    pass
    text("Lives: " + str(lives), 300, 28)
`,
      solve: [["    pass\n    text(\"Lives", "    if ball.y > 410:\n        lives -= 1\n        play(\"hurt\")\n        ball.x, ball.y = 200, 200\n        if lives == 0:\n            game_over(\"Game over!\")\n    text(\"Lives"]],
      check: `
import pq as _pq
l0 = lives
ball.x, ball.y, ball.vx, ball.vy = 200, 415, 0, 3
_step(1)
if lives != l0 - 1:
    result = "hit"
elif ball.y > 410:
    result = "reset"
else:
    lives = 1
    ball.x, ball.y, ball.vx, ball.vy = 200, 415, 0, 3
    _step(1)
    if not _pq._state["over"]:
        result = "over"
`,
      fails: { hit: T("Losing the ball should take away exactly 1 life.", "Perder la pelota debe quitar exactamente 1 vida."), reset: T("Put the ball back at (200, 200) after it falls.", "Regresa la pelota a (200, 200) después de caer."), over: T("When lives reaches 0, call game_over(\"Game over!\").", "Cuando lives llegue a 0, llama a game_over(\"Game over!\").") },
      hints: [
        T("Bigger y means lower on the screen.", "Una y mayor significa más abajo en la pantalla."),
        T("The lives == 0 if goes inside the first if, after lives goes down.", "El if de lives == 0 va dentro del primero, después de bajar lives."),
        T("Example:\n    if ball.y > 410:\n        lives -= 1\n        play(\"hurt\")\n        ball.x, ball.y = 200, 200\n        if lives == 0:\n            game_over(\"Game over!\")", "Ejemplo:\n    if ball.y > 410:\n        lives -= 1\n        play(\"hurt\")\n        ball.x, ball.y = 200, 200\n        if lives == 0:\n            game_over(\"Game over!\")"),
      ],
    },
    l6: {
      title: T("Row Maker", "Fábrica de filas"),
      goals: { en: ["Fill in make_row(y, color): 8 bricks across the screen at height y, in that colour.", "The make_row line below then adds a new row."], es: ["Completa make_row(y, color): 8 ladrillos a lo ancho, a la altura y, de ese color.", "La línea make_row de abajo agregará una fila nueva."] },
      scaffold: (c) => `
${mark("l6", c("Row Maker", "Fábrica de filas"))}
def make_row(y, color):               # ${c("y and color are PARAMETERS (inputs)", "y y color son PARÁMETROS (entradas)")}
    # ${c("make 8 bricks across at height y, in this color, and add them to bricks", "crea 8 ladrillos a lo ancho a la altura y, de este color, y agrégalos a bricks")}
    pass

make_row(160, "#a29bfe")
`,
      solve: [["    pass\n\nmake_row", "    for col in range(8):\n        bricks.append(Box(40 + col * 46, y, 42, 16, color))\n\nmake_row"]],
      check: `
if not callable(globals().get("make_row")):
    result = "def"
else:
    n = len(bricks)
    make_row(30, "#ffffff")
    new = bricks[n:]
    if len(new) != 8:
        result = "add"
    elif any(b.y != 30 or b.color != "#ffffff" for b in new):
        result = "params"
    else:
        for b in new:
            b.hide()
`,
      fails: { def: T("Keep the function: def make_row(y, color):", "Deja la función: def make_row(y, color):"), add: T("make_row should add exactly 8 bricks.", "make_row debe agregar exactamente 8 ladrillos."), params: T("Use the parameters: every brick at height y, in color.", "Usa los parámetros: cada ladrillo a la altura y, del color color.") },
      hints: [
        T("You need the inner loop from Level 4 (for col in range(8)).", "Necesitas el bucle interno del Nivel 4 (for col in range(8))."),
        T("Use the parameters y and color instead of 60 + row * 22 and colors[row].", "Usa los parámetros y y color en vez de 60 + row * 22 y colors[row]."),
        T("Example:\n    for col in range(8):\n        bricks.append(Box(40 + col * 46, y, 42, 16, color))", "Ejemplo:\n    for col in range(8):\n        bricks.append(Box(40 + col * 46, y, 42, 16, color))"),
      ],
    },
    mygame: FINAL(scoreWin),
  },
  boss: {
    starter: (c) => `from pq import *

# ${c("THE BUG BEAST broke this brick game! Find and squash 4 bugs.", "¡LA BESTIA DE BICHOS rompió este juego! Encuentra y aplasta 4 bichos.")}
background("#130f40")
paddle = Box(200, 380, 80, 12, "#48dbfb")
ball = Sprite("ball", x=200, y=250, size=0.6)
ball.vx, ball.vy = 3, 3
bricks = []
score = 0

for col in range(8)
    bricks.append(Box(40 + col * 46, 60, 42, 16, "#ff4757"))

@every_frame
def play_ball():
    global score
    ball.x = ball.x + ball.vx
    ball.y = ball.y + ball.vy
    if ball.x < 10 or ball.x > 390:
        ball.vx = -ball.vx
    if key_down("left"):
        paddle.x -= 6
    if key_down("right"):
        paddle.x -= 6
    for brick in bricks:
        if ball.touching(brick):
            brick.hide()
            ball.vy = -ball.vy
            scor = score + 1
            break
    text("Score: " + score, 10, 28)
`,
    solve: [["range(8)\n", "range(8):\n"], ['    if key_down("right"):\n        paddle.x -= 6', '    if key_down("right"):\n        paddle.x += 6'], ["scor = score", "score = score"], ['"Score: " + score', '"Score: " + str(score)']],
    check: bossTry + `
paddle.x = 200
text_ok = _try(frames=3, keys=["right"]) and text_ok
if paddle.x <= 200:
    bad.append("paddle")
s0 = score
b = bricks[0]
b.show()
ball.x, ball.y, ball.vx, ball.vy = b.x, b.y + 6, 0, -3
text_ok = _try(frames=1) and text_ok
if score != s0 + 1:
    bad.append("score")
` + bossEnd,
    fails: { paddle: T("Bug found: the right arrow moves the paddle LEFT!", "Bicho encontrado: ¡la flecha derecha mueve la paleta a la IZQUIERDA!"), ...bossFailsCommon },
    hints: bossHints("add \":\" after range(8) · paddle.x += 6 for right · score = score + 1 · str(score)"),
  },
};

export const GAME_TYPES = { platformer, explorer, shooter, hopper, breaker };
// Add Levels 7–20, the new side quests and the new bosses to every game type.
for (const [tid, g] of Object.entries(GAME_TYPES)) {
  const more = buildMore(tid, mark);
  Object.assign(g.levels, more.levels);
  g.bosses = { boss1: more.bosses.boss1, boss: g.boss, boss3: more.bosses.boss3, boss4: more.bosses.boss4, boss5: more.bosses.boss5 };
}
export { T, mark, FINAL, scoreWin, bossTry, bossEnd, bossFailsCommon, bossHints, l1Check, l1Fails, l1Hints, titleFail, textsHasTitle };

// ---------- building a student's file ----------
export const langPick = (lang) => (en, es) => (lang === "es" ? es : en);

export function applySolve(file, start, solve) {
  for (const [find, rep] of solve) {
    const whole = find.startsWith("^"), f = whole ? find.slice(1) : find;
    const i = file.indexOf(f, whole ? 0 : start);
    if (i < 0) throw new Error("solve step not found: " + f.slice(0, 40));
    file = file.slice(0, i) + rep + file.slice(i + f.length);
  }
  return file;
}

// Append a level's block (scaffold, or the worked answer when `solved`). Returns the new file.
export function addLevel(file, typeId, levelId, lang, solved = false) {
  const lv = GAME_TYPES[typeId].levels[levelId];
  const block = lv.scaffold(langPick(lang));
  const start = levelId === "l1" ? 0 : file.length;
  let out = levelId === "l1" ? block : file.replace(/\s*$/, "\n") + block;
  if (solved) out = applySolve(out, start, lv.solve);
  return out;
}

// Make sure every earlier level on the path is in the file (filling gaps with worked answers,
// e.g. after a teacher skips a student ahead), then add this level's scaffold if it's missing.
export function ensureLevel(file, typeId, levelId, lang) {
  const upTo = SIDE_AFTER[levelId] || BOSS_AFTER[levelId];
  const path = upTo ? CHAIN.slice(0, CHAIN.indexOf(upTo) + 1) : CHAIN.slice(0, CHAIN.indexOf(levelId));
  let out = file || "";
  for (const id of path) if (!markerRe(id).test(out)) out = addLevel(out, typeId, id, lang, true);
  if (!BOSS_AFTER[levelId] && !markerRe(levelId).test(out)) out = addLevel(out, typeId, levelId, lang, false);
  return out;
}
