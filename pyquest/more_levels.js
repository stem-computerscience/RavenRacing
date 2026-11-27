// PyQuest Arcade — Levels 7–20, side quests 1, 2 and 4–10, and bosses 1, 3, 4 and 5.
//
// These levels are written once and tuned for each game type with a small config (CFG below), so every
// game type gets the same lessons: random numbers, timers, strings, while loops, dictionaries, enemies,
// animation and a little algorithm work. Each level keeps the same shape as games.js:
//   scaffold(c) · solve [[find, replace]] ("^" = search the whole file) · check · goals · fails · hints.
// Main levels only build on earlier MAIN levels, never on side quests, so quests can always be skipped.

const T = (en, es) => ({ en, es });

// who  = the thing that catches stars and power-ups (the player, or the ball in Brick Breaker)
// P    = what the player controls (player, or the paddle)
// ry   = random y range for pickups (null = a fixed row, for Star Fighter's ship)
// safe = a spot the checks use where nothing else is going on
// hit  = what happens when a foe meets you: hurt (go home), ball (ball knocks it out), shoot (lasers)
export const CFG = {
  platformer: { who: "player", P: "player", still: "player.vy = 0", ry: [120, 340], fixY: 0, safe: [150, 150], power: [330, 330], home: "60, 300", foeY: [364, 230, 170], hit: "hurt", bg: "#5c94fc", hero: "hero", item: "coin" },
  explorer:   { who: "player", P: "player", still: "player.vy = 0", ry: [120, 340], fixY: 0, safe: [150, 150], power: [330, 330], home: "60, 300", foeY: [364, 220, 150], hit: "hurt", bg: "#1b1b3a", hero: "knight", item: "gem" },
  shooter:    { who: "player", P: "player", still: "", ry: null, fixY: 370, safe: [200, 370], power: [80, 370], home: "200, 370", foeY: [150, 200, 250], hit: "shoot", bg: "#000814", hero: "ship", item: "star" },
  hopper:     { who: "player", P: "player", still: "", ry: [140, 340], fixY: 0, safe: [200, 340], power: [80, 340], home: "200, 380", foeY: [180, 260, 220], hit: "hurt", bg: "#1e272e", hero: "frog", item: "apple" },
  breaker:    { who: "ball", P: "paddle", still: "ball.vx, ball.vy = 0, 0", ry: [180, 320], fixY: 0, safe: [200, 250], power: [90, 300], home: "200, 200", foeY: [200, 240, 280], hit: "ball", bg: "#130f40", hero: "ball", item: "gem" },
};

// Same text in both languages (code).
const both = (s) => T(s, s);
const ex = (code) => T("Example:\n" + code, "Ejemplo:\n" + code);

// Shared start of every check: strip comments for code searches, and move hazards/extra score sources
// off-screen so a check only measures the thing it's testing.
const PRE = (keep = []) => `
import re
import pq as _pq
code_only = re.sub(r"#.*", "", _source)
for _n in ${JSON.stringify(["coins", "lanes", "foes", "bricks", "gems", "bombs"].filter((n) => !keep.includes(n)))}:
    for _t in (globals().get(_n) or []):
        _t.x = -900
for _n in ${JSON.stringify(["car", "enemy", "boots", "star"].filter((n) => !keep.includes(n)))}:
    if _n in globals():
        globals()[_n].x = -900
if "power" in globals() and ${keep.includes("power") ? "False" : "True"}:
    power.x = -900
`;
const texts = `[t[0] for t in _pq._texts]`;
// Indent every line of a code block by n spaces (for nesting check code).
const ind = (code, n) => code.replace(/^(?=.)/gm, " ".repeat(n));

export function buildMore(typeId, mark) {
  const C = CFG[typeId];
  const W = C.who, P = C.P;
  const ry = C.ry;
  const randY = (obj, ind = "") => (ry ? `\n${ind}${obj}.y = random.randint(${ry[0]}, ${ry[1]})` : "");
  const yStart = ry ? Math.round((ry[0] + ry[1]) / 2) : C.fixY;
  const [sx, sy] = C.safe;
  const placeWho = (x, y, n = 0) => ind(`${W}.x, ${W}.y = ${x}, ${y}\n${C.still ? C.still + "\n" : ""}`, n);
  const yNote = ry ? T(` and y = random.randint(${ry[0]}, ${ry[1]})`, ` y y = random.randint(${ry[0]}, ${ry[1]})`) : T("", "");
  const whoName = W === "ball" ? T("the ball", "la pelota") : T("the player", "el jugador");
  const L = {};

  // ---------------------------------------------------------------- QUEST 1 · Style Studio (after L2)
  L.q1 = {
    title: T("Side quest: Style Studio", "Misión extra: Estudio de estilo"),
    goals: {
      en: ["Put your name in SUBTITLE (replace the ???).", "Pick a tune: change music(\"off\") to music(\"chill\") or music(\"fast\").", "Show SUBTITLE at the bottom: change text(\"\", 10, 394, 14) to text(SUBTITLE, 10, 394, 14)."],
      es: ["Pon tu nombre en SUBTITLE (cambia los ???).", "Elige una canción: cambia music(\"off\") por music(\"chill\") o music(\"fast\").", "Muestra SUBTITLE abajo: cambia text(\"\", 10, 394, 14) por text(SUBTITLE, 10, 394, 14)."],
    },
    scaffold: (c) => `
${mark("q1", c("Style Studio", "Estudio de estilo"))}
SUBTITLE = "by ???"                   # ${c("a STRING: put your name after by", "un STRING: pon tu nombre después de by")}
music("off")                         # ${c('pick a tune: "chill" or "fast"', 'elige una canción: "chill" o "fast"')}

@every_frame
def credits():
    text("", 10, 394, 14)            # ${c("show SUBTITLE here, small, at the bottom", "muestra SUBTITLE aquí, pequeño, abajo")}
`,
    solve: [['SUBTITLE = "by ???"', 'SUBTITLE = "by Maya R."'], ['music("off")', 'music("chill")'], ['text("", 10, 394, 14)', "text(SUBTITLE, 10, 394, 14)"]],
    check: PRE() + `
if "???" in str(globals().get("SUBTITLE", "???")):
    result = "name"
elif _pq._state["music"] not in ("chill", "fast"):
    result = "music"
else:
    _step(1)
    if not any(SUBTITLE in t for t in ${texts}):
        result = "show"
`,
    fails: {
      name: T("Put your name in SUBTITLE instead of ???.", "Pon tu nombre en SUBTITLE en vez de ???."),
      music: T("Pick music(\"chill\") or music(\"fast\").", "Elige music(\"chill\") o music(\"fast\")."),
      show: T("SUBTITLE isn't on the screen yet. Use text(SUBTITLE, 10, 394, 14).", "SUBTITLE aún no está en la pantalla. Usa text(SUBTITLE, 10, 394, 14)."),
    },
    hints: [
      T("SUBTITLE is a string, so keep the quotes: \"by Sam\".", "SUBTITLE es un string, así que deja las comillas: \"by Sam\"."),
      T("The name of a variable has no quotes: text(SUBTITLE, ...) shows what's inside it.", "El nombre de una variable no lleva comillas: text(SUBTITLE, ...) muestra lo que guarda."),
      ex('SUBTITLE = "by Sam"\nmusic("chill")\n...\n    text(SUBTITLE, 10, 394, 14)'),
    ],
  };

  // ---------------------------------------------------------------- QUEST 2 · Moving Scenery (after L4)
  L.q2 = {
    title: T("Side quest: Moving Scenery", "Misión extra: Paisaje en movimiento"),
    goals: {
      en: ["Change range(0) to range(8) to make 8 bits of scenery.", "In drift(): move each one left by 1 (s.x = s.x - 1).", "When s.x < 0, send it back to the right side: s.x = 400."],
      es: ["Cambia range(0) por range(8) para crear 8 piezas de paisaje.", "En drift(): mueve cada una 1 a la izquierda (s.x = s.x - 1).", "Cuando s.x < 0, regrésala al lado derecho: s.x = 400."],
    },
    scaffold: (c) => `
${mark("q2", c("Moving Scenery", "Paisaje en movimiento"))}
scenery = []
for i in range(0):                    # ${c("change 0 to 8", "cambia 0 por 8")}
    scenery.append(Box(i * 50 + 25, 40 + (i % 3) * 25, 6, 6, "white"))

@every_frame
def drift():
    for s in scenery:
        # ${c("move s left by 1. If s.x < 0, send it back to s.x = 400", "mueve s 1 a la izquierda. Si s.x < 0, regrésala a s.x = 400")}
        pass
`,
    solve: [["range(0):", "range(8):"], ["        pass\n", "        s.x = s.x - 1\n        if s.x < 0:\n            s.x = 400\n"]],
    check: PRE() + `
if len(scenery) < 8:
    result = "count"
else:
    s = scenery[0]
    s.x = 200
    _step(1)
    if s.x != 199:
        result = "move"
    else:
        s.x = 0.5
        _step(1)
        if s.x < 300:
            result = "wrap"
`,
    fails: {
      count: T("Make 8 pieces of scenery: range(8).", "Crea 8 piezas de paisaje: range(8)."),
      move: T("Each piece should move left by exactly 1 every frame.", "Cada pieza debe moverse exactamente 1 a la izquierda en cada cuadro."),
      wrap: T("When a piece goes off the left side (x < 0), set its x to 400.", "Cuando una pieza sale por la izquierda (x < 0), pon su x en 400."),
    },
    hints: [
      T("The for loop runs the same lines for every piece of scenery. s is the current piece.", "El bucle for ejecuta las mismas líneas para cada pieza. s es la pieza actual."),
      T("Left means x gets smaller. Then add an if for the edge.", "Izquierda significa que x disminuye. Luego agrega un if para el borde."),
      ex("        s.x = s.x - 1\n        if s.x < 0:\n            s.x = 400"),
    ],
  };

  // ---------------------------------------------------------------- BOSS 1 · Bug Beast Jr. (after L4)
  const theme = { platformer: ["hero", "coin", "#2b0f3a"], explorer: ["knight", "gem", "#1b1b3a"], shooter: ["ship", "star", "#000814"], hopper: ["frog", "apple", "#1e272e"], breaker: ["ball", "gem", "#130f40"] }[typeId];
  const B = {};
  B.boss1 = {
    starter: (c) => `from pq import *

# ${c("BUG BEAST JR. broke this little game! Find and squash 4 bugs.", "¡BESTIA DE BICHOS JR. rompió este juego! Encuentra y aplasta 4 bichos.")}
# ${c("Goal: move with the arrows and collect all 5 items.", "Meta: muévete con las flechas y junta las 5 cosas.")}
TITLE = "Bug Hunt"
background("${theme[2]}")
player = Sprite("${theme[0]}", x=200, y=320)
items = []

for i in range(5)
    items.append(Sprite("${theme[1]}", x=60 + i * 70, y=200))

@every_frame
def controls():
    if key_down("left"):
        player.x = player.x - 4
    if key_down("rigth"):
        player.x = player.x + 4
    if key_down("up"):
        player.y = player.y + 4
    if key_down("down"):
        player.y = player.y + 4

@every_frame
def grab():
    for it in items:
        if player.touching(it):
            it.hide()
    text(TITEL, 10, 28)
`,
    solve: [["range(5)\n", "range(5):\n"], ['"rigth"', '"right"'], ['    if key_down("up"):\n        player.y = player.y + 4', '    if key_down("up"):\n        player.y = player.y - 4'], ["text(TITEL", "text(TITLE"]],
    check: `
bad = []
def _ok(**kw):
    try:
        _step(**kw)
        return True
    except Exception:
        return False
if not _ok(frames=1):
    bad.append("title")
player.x, player.y = 200, 320
_ok(frames=3, keys=["right"])
if player.x <= 200:
    bad.append("right")
y0 = player.y
_ok(frames=3, keys=["up"])
if player.y >= y0:
    bad.append("up")
_extra = len(bad)
result = bad[0] if bad else None
`,
    fails: {
      title: T("Bug found: the game crashes every frame. Something on the text line is misspelled.", "Bicho encontrado: el juego falla en cada cuadro. Algo en la línea de text está mal escrito."),
      right: T("Bug found: the right arrow does nothing. Check how \"right\" is spelled.", "Bicho encontrado: la flecha derecha no hace nada. Revisa cómo se escribe \"right\"."),
      up: T("Bug found: the up arrow moves the player DOWN. Up means y gets smaller.", "Bicho encontrado: la flecha arriba mueve al jugador ABAJO. Arriba significa que y disminuye."),
    },
    hints: [
      T("Press Run and read the error first. Fix one bug at a time, top to bottom.", "Presiona Ejecutar y lee el error. Arregla un bicho a la vez, de arriba abajo."),
      T("Four bugs: a missing colon, a misspelled key name, a + that should be -, and a misspelled variable.", "Cuatro bichos: dos puntos que faltan, un nombre de tecla mal escrito, un + que debería ser - y una variable mal escrita."),
      T("Fixes: add \":\" after range(5) · \"right\" · player.y - 4 for up · TITLE", "Arreglos: agrega \":\" después de range(5) · \"right\" · player.y - 4 para arriba · TITLE"),
    ],
  };

  // ---------------------------------------------------------------- L7 · Lucky Star (random)
  L.l7 = {
    title: T("Lucky Star", "Estrella de la suerte"),
    goals: {
      en: [`Start the star at a random spot: star.x = random.randint(30, 370)${ry ? ` and star.y = random.randint(${ry[0]}, ${ry[1]})` : ""}.`, `In lucky(): if ${W} touches the star, add 5 to score and play("win").`, "Then move the star to a NEW random spot."],
      es: [`Empieza la estrella en un lugar al azar: star.x = random.randint(30, 370)${ry ? ` y star.y = random.randint(${ry[0]}, ${ry[1]})` : ""}.`, `En lucky(): si ${W} toca la estrella, suma 5 a score y play("win").`, "Luego mueve la estrella a un lugar al azar NUEVO."],
    },
    scaffold: (c) => `
${mark("l7", c("Lucky Star", "Estrella de la suerte"))}
# ${c("RANDOM: random.randint(1, 6) picks a whole number from 1 to 6, like rolling a dice.", "AZAR: random.randint(1, 6) elige un número entero del 1 al 6, como tirar un dado.")}
star = Sprite("star", x=200, y=${yStart})
star.x = 200                          # ${c("make it random: random.randint(30, 370)", "hazlo al azar: random.randint(30, 370)")}${ry ? `
star.y = ${yStart}                          # ${c(`make it random: random.randint(${ry[0]}, ${ry[1]})`, `hazlo al azar: random.randint(${ry[0]}, ${ry[1]})`)}` : ""}

@every_frame
def lucky():
    global score
    # ${c(`if ${W} touches the star: score + 5, play("win"), and move the star to a new random spot`, `si ${W} toca la estrella: score + 5, play("win"), y mueve la estrella a un lugar al azar nuevo`)}
    pass
`,
    solve: [["star.x = 200 ", "star.x = random.randint(30, 370) "], ...(ry ? [[`star.y = ${yStart} `, `star.y = random.randint(${ry[0]}, ${ry[1]}) `]] : []),
      ["    pass\n", `    if ${W}.touching(star):\n        score += 5\n        play("win")\n        star.x = random.randint(30, 370)${randY("star", "        ")}\n`]],
    check: PRE() + `
if not re.search(r"star\\.x\\s*=\\s*random\\.randint", code_only):
    result = "random"
else:
    s0 = score
    star.show()
    star.x, star.y = ${sx}, ${sy}
${placeWho(sx, sy, 4)}    _step(1)
    if score != s0 + 5:
        result = "catch"
    elif (star.x, star.y) == (${sx}, ${sy}):
        result = "move"
`,
    fails: {
      random: T("Start the star with star.x = random.randint(30, 370).", "Empieza la estrella con star.x = random.randint(30, 370)."),
      catch: T(`When ${W} touches the star, add exactly 5 to score.`, `Cuando ${W} toque la estrella, suma exactamente 5 a score.`),
      move: T("After it's caught, move the star to a new random spot.", "Después de atraparla, mueve la estrella a un lugar al azar nuevo."),
    },
    hints: [
      T("random.randint(a, b) gives a different whole number from a to b every time it runs.", "random.randint(a, b) da un número entero distinto de a a b cada vez que se ejecuta."),
      T(`Use an if with ${W}.touching(star), like your Level 5 code.`, `Usa un if con ${W}.touching(star), como tu código del Nivel 5.`),
      ex(`    if ${W}.touching(star):\n        score += 5\n        play("win")\n        star.x = random.randint(30, 370)${randY("star", "        ")}`),
    ],
  };

  // ---------------------------------------------------------------- L8 · Clock (math: // and %)
  L.l8 = {
    title: T("Clock", "Reloj"),
    goals: {
      en: ["Turn frames into whole seconds: seconds = frames // 60.", "Every 5 seconds (if frames % 300 == 0), move the star to a new random spot."],
      es: ["Convierte cuadros en segundos enteros: seconds = frames // 60.", "Cada 5 segundos (if frames % 300 == 0), mueve la estrella a un lugar al azar nuevo."],
    },
    scaffold: (c) => `
${mark("l8", c("Clock", "Reloj"))}
frames = 0                            # ${c("counts every frame. 60 frames = 1 second", "cuenta cada cuadro. 60 cuadros = 1 segundo")}

@every_frame
def clock():
    global frames
    frames += 1
    seconds = 0                       # ${c("// divides and drops the decimals: frames // 60", "// divide y quita los decimales: frames // 60")}
    text("Time: " + str(seconds), 300, 52)
    # ${c("% gives the REMAINDER. frames % 300 == 0 is True once every 5 seconds.", "% da el RESIDUO. frames % 300 == 0 es True una vez cada 5 segundos.")}
    # ${c("every 5 seconds, move the star to a new random spot", "cada 5 segundos, mueve la estrella a un lugar al azar nuevo")}
    pass
`,
    solve: [["seconds = 0 ", "seconds = frames // 60 "], ["    pass\n", `    if frames % 300 == 0:\n        star.x = random.randint(30, 370)${randY("star", "        ")}\n`]],
    check: PRE() + `
${placeWho(sx, sy)}star.x, star.y = -300, -300
frames = 0
_step(150)
if not any(t.startswith("Time: 2") for t in ${texts}):
    result = "seconds"
else:
    frames = 299
    star.x, star.y = -300, -300
    _step(1)
    if star.x == -300:
        result = "every5"
`,
    fails: {
      seconds: T("After 150 frames the clock should say Time: 2. Use seconds = frames // 60.", "Después de 150 cuadros el reloj debe decir Time: 2. Usa seconds = frames // 60."),
      every5: T("Every 5 seconds (frames % 300 == 0), move the star to a random spot.", "Cada 5 segundos (frames % 300 == 0), mueve la estrella a un lugar al azar."),
    },
    hints: [
      T("/ gives decimals (2.5). // gives whole numbers (2). Clocks want whole seconds.", "/ da decimales (2.5). // da números enteros (2). Los relojes quieren segundos enteros."),
      T("% is the remainder after dividing. 600 % 300 is 0, 601 % 300 is 1.", "% es el residuo de dividir. 600 % 300 es 0, 601 % 300 es 1."),
      ex(`    seconds = frames // 60\n    ...\n    if frames % 300 == 0:\n        star.x = random.randint(30, 370)${randY("star", "        ")}`),
    ],
  };

  // ---------------------------------------------------------------- QUEST 4 · Beat the Clock (after L8)
  L.q4 = {
    title: T("Side quest: Beat the Clock", "Misión extra: Contra reloj"),
    goals: {
      en: ["Work out the time left: time_left = TIME_LIMIT - frames // 60.", "When time_left is 0 or less, call game_over(\"Time's up!\")."],
      es: ["Calcula el tiempo restante: time_left = TIME_LIMIT - frames // 60.", "Cuando time_left sea 0 o menos, llama a game_over(\"Time's up!\")."],
    },
    scaffold: (c) => `
${mark("q4", c("Beat the Clock", "Contra reloj"))}
TIME_LIMIT = 90                       # ${c("seconds to play", "segundos para jugar")}

@every_frame
def time_limit():
    time_left = TIME_LIMIT            # ${c("subtract the seconds so far: TIME_LIMIT - frames // 60", "resta los segundos que van: TIME_LIMIT - frames // 60")}
    text("Left: " + str(time_left), 300, 76)
    # ${c("if time_left <= 0: game_over(\"Time's up!\")", "si time_left <= 0: game_over(\"Time's up!\")")}
    pass
`,
    solve: [["time_left = TIME_LIMIT ", "time_left = TIME_LIMIT - frames // 60 "], ["    pass\n", "    if time_left <= 0:\n        game_over(\"Time's up!\")\n"]],
    check: PRE() + `
frames = 600
_step(1)
if not any(t == "Left: " + str(TIME_LIMIT - 10) for t in ${texts}):
    result = "left"
else:
    frames = TIME_LIMIT * 60
    _step(1)
    if not _pq._state["over"]:
        result = "over"
`,
    fails: {
      left: T("After 10 seconds it should say Left: 80. Use TIME_LIMIT - frames // 60.", "Después de 10 segundos debe decir Left: 80. Usa TIME_LIMIT - frames // 60."),
      over: T("When time_left gets to 0, call game_over(\"Time's up!\").", "Cuando time_left llegue a 0, llama a game_over(\"Time's up!\")."),
    },
    hints: [
      T("frames // 60 is how many seconds have gone by (from your Level 8 clock).", "frames // 60 es cuántos segundos han pasado (de tu reloj del Nivel 8)."),
      T("<= means less than OR equal, so it still works if the time skips past 0.", "<= significa menor O igual, así que funciona aunque el tiempo pase de 0."),
      ex("    time_left = TIME_LIMIT - frames // 60\n    ...\n    if time_left <= 0:\n        game_over(\"Time's up!\")"),
    ],
  };

  // ---------------------------------------------------------------- L9 · Name Tag (strings)
  L.l9 = {
    title: T("Name Tag", "Etiqueta de nombre"),
    goals: {
      en: ["Put your name (or a gamer tag) in PLAYER_NAME.", "Make tag shout: tag = PLAYER_NAME.upper()", "Show it with an f-string: text(f\"{tag}: {score}\", 10, 76)"],
      es: ["Pon tu nombre (o apodo de jugador) en PLAYER_NAME.", "Haz que tag grite: tag = PLAYER_NAME.upper()", "Muéstralo con un f-string: text(f\"{tag}: {score}\", 10, 76)"],
    },
    scaffold: (c) => `
${mark("l9", c("Name Tag", "Etiqueta de nombre"))}
# ${c('STRINGS are text. An f-string puts variables right inside the text: f"Score: {score}"', 'Los STRINGS son texto. Un f-string pone variables dentro del texto: f"Score: {score}"')}
PLAYER_NAME = "???"                   # ${c("your name or gamer tag", "tu nombre o apodo")}
tag = PLAYER_NAME                     # ${c("make it CAPITALS: PLAYER_NAME.upper()", "ponlo en MAYÚSCULAS: PLAYER_NAME.upper()")}

@every_frame
def name_tag():
    text("", 10, 76)                  # ${c('use an f-string: f"{tag}: {score}"', 'usa un f-string: f"{tag}: {score}"')}
`,
    solve: [['PLAYER_NAME = "???"', 'PLAYER_NAME = "Ace"'], ["tag = PLAYER_NAME ", "tag = PLAYER_NAME.upper() "], ['text("", 10, 76)', 'text(f"{tag}: {score}", 10, 76)']],
    check: PRE() + `
if str(globals().get("PLAYER_NAME", "???")).strip() in ("", "???"):
    result = "name"
elif tag != PLAYER_NAME.upper():
    result = "upper"
else:
    star.x = -900
    score = 7
    _step(1)
    if not any(tag in t and "7" in t for t in ${texts}):
        result = "show"
`,
    fails: {
      name: T("Give PLAYER_NAME a name instead of ???.", "Dale a PLAYER_NAME un nombre en vez de ???."),
      upper: T("tag should be PLAYER_NAME in capitals: PLAYER_NAME.upper()", "tag debe ser PLAYER_NAME en mayúsculas: PLAYER_NAME.upper()"),
      show: T("Show tag and score on screen: text(f\"{tag}: {score}\", 10, 76)", "Muestra tag y score en pantalla: text(f\"{tag}: {score}\", 10, 76)"),
    },
    hints: [
      T(".upper() is a string METHOD: it gives back the same text in CAPITALS.", ".upper() es un MÉTODO de string: devuelve el mismo texto en MAYÚSCULAS."),
      T("An f-string starts with f before the quote. Anything in { } is replaced by its value.", "Un f-string empieza con f antes de la comilla. Lo que esté entre { } se cambia por su valor."),
      ex('PLAYER_NAME = "Ace"\ntag = PLAYER_NAME.upper()\n...\n    text(f"{tag}: {score}", 10, 76)'),
    ],
  };

  // ---------------------------------------------------------------- L10 · Safe Spawn (while loops)
  L.l10 = {
    title: T("Safe Spawn", "Aparición segura"),
    goals: {
      en: [`In move_star(): use a while loop to keep picking a new spot while the star is less than 100 from ${W} (abs(star.x - ${W}.x) < 100).`, "In lucky() (Level 7): replace the random lines with move_star()."],
      es: [`En move_star(): usa un bucle while para elegir otro lugar mientras la estrella esté a menos de 100 de ${W} (abs(star.x - ${W}.x) < 100).`, "En lucky() (Nivel 7): cambia las líneas de azar por move_star()."],
    },
    scaffold: (c) => `
${mark("l10", c("Safe Spawn", "Aparición segura"))}
# ${c("A WHILE LOOP repeats as long as its question is True.", "Un BUCLE WHILE se repite mientras su pregunta sea True.")}
def move_star():
    star.x = random.randint(30, 370)${randY("star", "    ")}
    # ${c(`too close? while abs(star.x - ${W}.x) < 100: pick a new star.x`, `¿muy cerca? while abs(star.x - ${W}.x) < 100: elige otra star.x`)}
    pass
# ${c("Then in lucky(), use move_star() instead of the random lines.", "Luego en lucky(), usa move_star() en vez de las líneas de azar.")}
`,
    solve: [["    pass\n", `    while abs(star.x - ${W}.x) < 100:\n        star.x = random.randint(30, 370)\n`],
      [`^        star.x = random.randint(30, 370)${randY("star", "        ")}\n`, "        move_star()\n"]],
    check: PRE() + `
lucky_body = code_only.split("def lucky")[1].split("\\ndef ")[0] if "def lucky" in code_only else ""
${W}.x = 200
ok = True
for _i in range(60):
    move_star()
    if abs(star.x - ${W}.x) < 100:
        ok = False
if not ok:
    result = "while"
elif "move_star()" not in lucky_body:
    result = "use"
`,
    fails: {
      while: T(`The star still lands within 100 of ${W}. Add the while loop.`, `La estrella todavía cae a menos de 100 de ${W}. Agrega el bucle while.`),
      use: T("In lucky(), call move_star() when the star is caught.", "En lucky(), llama a move_star() cuando atrapes la estrella."),
    },
    hints: [
      T("abs() means 'how far apart', whether the number is positive or negative: abs(-30) is 30.", "abs() significa 'qué tan lejos', sea positivo o negativo: abs(-30) es 30."),
      T("Inside the while loop, pick a new star.x. It keeps going until the star is far enough away.", "Dentro del while, elige una nueva star.x. Se repite hasta que la estrella esté lo bastante lejos."),
      ex(`    while abs(star.x - ${W}.x) < 100:\n        star.x = random.randint(30, 370)`),
    ],
  };

  // ---------------------------------------------------------------- QUEST 5 · Gem Shower (after L10)
  const gy = ry ? `random.randint(${ry[0]}, ${ry[1]})` : String(C.fixY);
  L.q5 = {
    title: T("Side quest: Gem Shower", "Misión extra: Lluvia de gemas"),
    goals: {
      en: ["Make the while loop add gems until there are 5: while len(gems) < 5:", `In gem_shower(): if ${W} touches a gem, hide it and add 2 to score.`],
      es: ["Haz que el while agregue gemas hasta que haya 5: while len(gems) < 5:", `En gem_shower(): si ${W} toca una gema, escóndela y suma 2 a score.`],
    },
    scaffold: (c) => `
${mark("q5", c("Gem Shower", "Lluvia de gemas"))}
gems = []
while len(gems) < 0:                  # ${c("change 0 to 5", "cambia 0 por 5")}
    gems.append(Sprite("gem", x=random.randint(30, 370), y=${gy}))

@every_frame
def gem_shower():
    global score
    for g in gems:
        # ${c(`if ${W} touches g: hide it and add 2 to score`, `si ${W} toca g: escóndela y suma 2 a score`)}
        pass
`,
    solve: [["len(gems) < 0:", "len(gems) < 5:"], ["        pass\n", `        if ${W}.touching(g):\n            g.hide()\n            score += 2\n`]],
    check: PRE(["gems"]) + `
if len(gems) != 5:
    result = "count"
else:
    for g in gems[1:]:
        g.x = -900
    g = gems[0]
    g.show()
    g.x, g.y = ${sx}, ${sy}
    s0 = score
${placeWho(sx, sy, 4)}    _step(1)
    if score != s0 + 2:
        result = "catch"
    elif g.visible:
        result = "hide"
`,
    fails: {
      count: T("There should be exactly 5 gems. Change the 0 in the while line to 5.", "Debe haber exactamente 5 gemas. Cambia el 0 de la línea while por 5."),
      catch: T(`Touching a gem should add exactly 2 to score.`, `Tocar una gema debe sumar exactamente 2 a score.`),
      hide: T("Hide the gem once it's caught: g.hide()", "Esconde la gema al atraparla: g.hide()"),
    },
    hints: [
      T("The while loop keeps adding gems as long as len(gems) < 5 is True.", "El while sigue agregando gemas mientras len(gems) < 5 sea True."),
      T("Inside the for loop, g is one gem. Use an if with touching().", "Dentro del for, g es una gema. Usa un if con touching()."),
      ex(`        if ${W}.touching(g):\n            g.hide()\n            score += 2`),
    ],
  };

  // ---------------------------------------------------------------- L11 · Stages
  L.l11 = {
    title: T("Stages", "Etapas"),
    goals: {
      en: ["Every 10 points is a new stage: new_stage = 1 + score // 10.", "When the stage goes up, change the background: background(STAGE_COLORS[stage % len(STAGE_COLORS)])."],
      es: ["Cada 10 puntos es una etapa nueva: new_stage = 1 + score // 10.", "Cuando suba la etapa, cambia el fondo: background(STAGE_COLORS[stage % len(STAGE_COLORS)])."],
    },
    scaffold: (c) => `
${mark("l11", c("Stages", "Etapas"))}
STAGE_COLORS = ["${C.bg}", "#2d3436", "#6c5ce7", "#b33939"]
stage = 1

@every_frame
def stages():
    global stage
    new_stage = 1                     # ${c("every 10 points is a new stage: 1 + score // 10", "cada 10 puntos es una etapa nueva: 1 + score // 10")}
    if new_stage > stage:
        stage = new_stage
        play("win")
        # ${c("change the background: background(STAGE_COLORS[stage % len(STAGE_COLORS)])", "cambia el fondo: background(STAGE_COLORS[stage % len(STAGE_COLORS)])")}
        pass
    text("Stage " + str(stage), 300, 100)
`,
    solve: [["new_stage = 1 ", "new_stage = 1 + score // 10 "], ["        pass\n", "        background(STAGE_COLORS[stage % len(STAGE_COLORS)])\n"]],
    check: PRE() + `
${placeWho(sx, sy)}stage = 1
score = 10
background("#000001")
_step(1)
if stage != 2:
    result = "stage"
elif _pq._state["bg"] not in STAGE_COLORS:
    result = "color"
`,
    fails: {
      stage: T("At 10 points the stage should be 2. Use new_stage = 1 + score // 10.", "Con 10 puntos la etapa debe ser 2. Usa new_stage = 1 + score // 10."),
      color: T("When the stage goes up, change the background to a colour from STAGE_COLORS.", "Cuando suba la etapa, cambia el fondo a un color de STAGE_COLORS."),
    },
    hints: [
      T("score // 10 is 0 for 0–9 points, 1 for 10–19, 2 for 20–29...", "score // 10 es 0 de 0 a 9 puntos, 1 de 10 a 19, 2 de 20 a 29..."),
      T("STAGE_COLORS[0] is the first colour. % len(STAGE_COLORS) wraps back to 0 after the last one.", "STAGE_COLORS[0] es el primer color. % len(STAGE_COLORS) vuelve a 0 después del último."),
      ex("    new_stage = 1 + score // 10\n    ...\n        background(STAGE_COLORS[stage % len(STAGE_COLORS)])"),
    ],
  };

  // ---------------------------------------------------------------- L12 · Power-Up (timers, booleans)
  const [px, py] = C.power;
  L.l12 = {
    title: T("Power-Up", "Poder especial"),
    goals: {
      en: ["When the power-up is grabbed, start the timer: power_timer = 300 (5 seconds).", "While power_timer > 0, count it down by 1 each frame.", "In lucky() (Level 7): if power_timer > 0, the star is worth 10, else 5."],
      es: ["Al agarrar el poder, empieza el temporizador: power_timer = 300 (5 segundos).", "Mientras power_timer > 0, réstale 1 en cada cuadro.", "En lucky() (Nivel 7): si power_timer > 0, la estrella vale 10, si no, 5."],
    },
    scaffold: (c) => `
${mark("l12", c("Power-Up", "Poder especial"))}
power = Sprite("heart", x=${px}, y=${py})
power_timer = 0                       # ${c("frames of power left. Above 0 = powered up!", "cuadros de poder que quedan. ¡Más de 0 = con poder!")}

@every_frame
def power_up():
    global power_timer
    if ${W}.touching(power):
        power.hide()
        play("zap")
        power_timer = 0               # ${c("5 seconds of power: 300 frames", "5 segundos de poder: 300 cuadros")}
    if power_timer > 0:
        # ${c("count down: take 1 away from power_timer", "cuenta atrás: réstale 1 a power_timer")}
        pass
        text("POWER x2!", 10, 100)
# ${c("Then in lucky(): if power_timer > 0, add 10 instead of 5", "Luego en lucky(): si power_timer > 0, suma 10 en vez de 5")}
`,
    solve: [["power_timer = 0               #", "power_timer = 300             #"], ["        pass\n        text(\"POWER", "        power_timer -= 1\n        text(\"POWER"],
      ["^        score += 5\n", "        if power_timer > 0:\n            score += 10\n        else:\n            score += 5\n"]],
    check: PRE(["power"]) + `
power_timer = 0
power.show()
power.x, power.y = ${px}, ${py}
${placeWho(px, py)}_step(1)
if power_timer < 250 or power.visible:
    result = "grab"
else:
    t0 = power_timer
${placeWho(sx, sy, 4)}    _step(10)
    if power_timer != t0 - 10:
        result = "count"
    else:
        power_timer = 100
        s0 = score
        star.show()
        star.x, star.y = ${sx}, ${sy}
${placeWho(sx, sy, 8)}        _step(1)
        if score != s0 + 10:
            result = "double"
`,
    fails: {
      grab: T("Grabbing the power-up should hide it and set power_timer to 300.", "Agarrar el poder debe esconderlo y poner power_timer en 300."),
      count: T("While power_timer > 0, take 1 away every frame: power_timer -= 1", "Mientras power_timer > 0, réstale 1 en cada cuadro: power_timer -= 1"),
      double: T("While powered up, the star should be worth 10. Change lucky() in Level 7.", "Con poder, la estrella debe valer 10. Cambia lucky() en el Nivel 7."),
    },
    hints: [
      T("A TIMER is a number you count down. When it reaches 0, the power is over.", "Un TEMPORIZADOR es un número que cuentas hacia atrás. Cuando llega a 0, se acaba el poder."),
      T("Find score += 5 in lucky() and put an if / else around it.", "Busca score += 5 en lucky() y ponle un if / else alrededor."),
      ex("        power_timer = 300\n    ...\n        power_timer -= 1\n\n# in lucky():\n        if power_timer > 0:\n            score += 10\n        else:\n            score += 5"),
    ],
  };

  // ---------------------------------------------------------------- QUEST 6 · Pop-Up Messages (after L12)
  L.q6 = {
    title: T("Side quest: Pop-Up Messages", "Misión extra: Mensajes emergentes"),
    goals: {
      en: ["Finish say(words): store words in message and set message_timer to 120.", "The say(...) line at the bottom will then pop up a message for 2 seconds."],
      es: ["Termina say(words): guarda words en message y pon message_timer en 120.", "La línea say(...) de abajo mostrará un mensaje por 2 segundos."],
    },
    scaffold: (c) => `
${mark("q6", c("Pop-Up Messages", "Mensajes emergentes"))}
message = ""
message_timer = 0

def say(words):
    global message, message_timer
    # ${c("store words in message, and set message_timer to 120 (2 seconds)", "guarda words en message y pon message_timer en 120 (2 segundos)")}
    pass

@every_frame
def show_message():
    global message_timer
    if message_timer > 0:
        message_timer -= 1
        text(message, 110, 210, 26, "yellow")

say("Ready, " + TITLE + "?")
`,
    solve: [["    pass\n\n@every_frame\ndef show_message", "    message = words\n    message_timer = 120\n\n@every_frame\ndef show_message"]],
    check: PRE() + `
say("Hello there")
if message != "Hello there":
    result = "store"
elif message_timer != 120:
    result = "timer"
else:
    _step(1)
    if not any("Hello there" in t for t in ${texts}):
        result = "store"
`,
    fails: {
      store: T("say(words) should store words in message.", "say(words) debe guardar words en message."),
      timer: T("say(words) should set message_timer to 120.", "say(words) debe poner message_timer en 120."),
    },
    hints: [
      T("words is the PARAMETER: it holds whatever text was passed in, like \"Ready?\".", "words es el PARÁMETRO: guarda el texto que te pasaron, como \"¿Listo?\"."),
      T("The global line lets say() change message and message_timer.", "La línea global deja que say() cambie message y message_timer."),
      ex("def say(words):\n    global message, message_timer\n    message = words\n    message_timer = 120"),
    ],
  };

  // ---------------------------------------------------------------- BOSS 3 · Glitch Ghost (after L12)
  B.boss3 = {
    starter: (c) => `from pq import *

# ${c("THE GLITCH GHOST scrambled this game! Find and fix 4 bugs.", "¡EL FANTASMA GLITCH revolvió este juego! Encuentra y arregla 4 bichos.")}
TITLE = "Glitch Run
background("${theme[2]}")
player = Sprite("${theme[0]}", x=200, y=320)
prize = Sprite("star", x=random.randint(370, 30), y=200)
score = 0
frames = 0

@every_frame
def play_game():
    global score, frames
    frames += 1
    seconds = frames / 60
    if key_down("left"):
        player.x -= 4
    if key_down("right"):
        player.x += 4
    if player.touching(prize):
        score += 1
        prize.x = random.randint(30, 370)
    text("Score: {score}", 10, 28)
    text("Time: " + str(seconds), 280, 28)
`,
    solve: [['TITLE = "Glitch Run\n', 'TITLE = "Glitch Run"\n'], ["random.randint(370, 30)", "random.randint(30, 370)"], ['text("Score: {score}"', 'text(f"Score: {score}"'], ["seconds = frames / 60", "seconds = frames // 60"]],
    check: `
import pq as _pq
bad = []
frames = 89
_step(1)
_t = [t[0] for t in _pq._texts]
if any("{score}" in t for t in _t):
    bad.append("fstring")
if not any(t == "Time: 1" for t in _t):
    bad.append("seconds")
_extra = len(bad)
result = bad[0] if bad else None
`,
    fails: {
      fstring: T("Bug found: the screen shows {score} instead of the number. That text needs an f in front.", "Bicho encontrado: la pantalla muestra {score} en vez del número. A ese texto le falta una f al frente."),
      seconds: T("Bug found: the clock shows decimals like 1.5. Use // for whole seconds.", "Bicho encontrado: el reloj muestra decimales como 1.5. Usa // para segundos enteros."),
    },
    hints: [
      T("Press Run and read the error first. Fix one bug at a time, top to bottom.", "Presiona Ejecutar y lee el error. Arregla un bicho a la vez, de arriba abajo."),
      T("Four bugs: a missing quote, random.randint with the numbers backwards, a missing f, and / instead of //.", "Cuatro bichos: una comilla que falta, random.randint con los números al revés, una f que falta y / en vez de //."),
      T("Fixes: \"Glitch Run\" · random.randint(30, 370) · f\"Score: {score}\" · frames // 60", "Arreglos: \"Glitch Run\" · random.randint(30, 370) · f\"Score: {score}\" · frames // 60"),
    ],
  };

  // ---------------------------------------------------------------- L13 · Points Table (dictionaries)
  L.l13 = {
    title: T("Points Table", "Tabla de puntos"),
    goals: {
      en: ["Change the power-up's points in POINTS from 0 to 3.", "In lucky() (Level 7): use POINTS[\"star\"] instead of 5, and POINTS[\"star\"] * 2 instead of 10.", "In power_up() (Level 12): add POINTS[\"power\"] to score when it's grabbed (add score to its global line)."],
      es: ["Cambia los puntos del poder en POINTS de 0 a 3.", "En lucky() (Nivel 7): usa POINTS[\"star\"] en vez de 5, y POINTS[\"star\"] * 2 en vez de 10.", "En power_up() (Nivel 12): suma POINTS[\"power\"] a score al agarrarlo (agrega score a su línea global)."],
    },
    scaffold: (c) => `
${mark("l13", c("Points Table", "Tabla de puntos"))}
# ${c('A DICTIONARY matches KEYS to VALUES, like a menu. POINTS["star"] looks up 5.', 'Un DICCIONARIO une CLAVES con VALORES, como un menú. POINTS["star"] busca el 5.')}
POINTS = {"star": 5, "power": 0}      # ${c("make the power-up worth 3", "haz que el poder valga 3")}
# ${c('Now use POINTS["star"] in lucky() and POINTS["power"] in power_up().', 'Ahora usa POINTS["star"] en lucky() y POINTS["power"] en power_up().')}
`,
    solve: [['"power": 0}', '"power": 3}'], ["^score += 10\n", 'score += POINTS["star"] * 2\n'], ["^score += 5\n", 'score += POINTS["star"]\n'],
      ["^    global power_timer\n", "    global power_timer, score\n"], ["^        power.hide()\n", '        power.hide()\n        score += POINTS["power"]\n']],
    check: PRE(["power"]) + `
power_timer = 0
if POINTS.get("power", 0) <= 0:
    result = "value"
else:
    POINTS["star"] = 7
    s0 = score
    star.show()
    star.x, star.y = ${sx}, ${sy}
${placeWho(sx, sy, 4)}    _step(1)
    if score != s0 + 7:
        result = "star"
    else:
        POINTS["power"] = 4
        star.x = -900
        power.show()
        power.x, power.y = ${px}, ${py}
${placeWho(px, py, 8)}        s0 = score
        _step(1)
        if score != s0 + 4:
            result = "power"
`,
    fails: {
      value: T("Give \"power\" more than 0 points in POINTS.", "Dale a \"power\" más de 0 puntos en POINTS."),
      star: T("lucky() should add POINTS[\"star\"], not a plain 5.", "lucky() debe sumar POINTS[\"star\"], no un 5 fijo."),
      power: T("Grabbing the power-up should add POINTS[\"power\"] to score.", "Agarrar el poder debe sumar POINTS[\"power\"] a score."),
    },
    hints: [
      T("POINTS[\"star\"] is a LOOKUP: Python finds the key \"star\" and gives back its value.", "POINTS[\"star\"] es una BÚSQUEDA: Python encuentra la clave \"star\" y devuelve su valor."),
      T("Now you can change every star's points in ONE place: the dictionary.", "Ahora puedes cambiar los puntos de todas las estrellas en UN lugar: el diccionario."),
      ex('POINTS = {"star": 5, "power": 3}\n# lucky():\n            score += POINTS["star"] * 2\n        else:\n            score += POINTS["star"]\n# power_up():\n    global power_timer, score\n        power.hide()\n        score += POINTS["power"]'),
    ],
  };

  // ---------------------------------------------------------------- L14 · Foe Types (dictionaries + enemies)
  const [fy1, fy2, fy3] = C.foeY;
  const hitCode = {
    hurt: `        if ${W}.touching(f):              # ${"{HIT}"}\n            play("hurt")\n            ${W}.x, ${W}.y = ${C.home}\n`,
    ball: `        if ball.touching(f):              # ${"{HIT}"}\n            f.hide()\n            ball.vy = -ball.vy\n            play("boom")\n`,
    shoot: `        for b in bullets:                 # ${"{HIT}"}\n            if b.touching(f):\n                b.hide()\n                f.hide()\n                play("boom")\n`,
  }[C.hit];
  const hitNote = T("already done for you: what happens when you meet a foe", "ya está hecho: lo que pasa al encontrar un enemigo");
  L.l14 = {
    title: T("Foe Types", "Tipos de enemigos"),
    goals: {
      en: ["In spawn_foe(): look up the foe's speed in the dictionary: f.vx = FOE_SPEEDS[kind].", "In foe_moves(): bounce at the edges: if f.x < 20 or f.x > 380, flip f.vx.", "Add a third kind to FOE_SPEEDS (\"ghost\": 2) and spawn it: spawn_foe(\"ghost\", " + fy3 + ")."],
      es: ["En spawn_foe(): busca la velocidad en el diccionario: f.vx = FOE_SPEEDS[kind].", "En foe_moves(): rebota en los bordes: si f.x < 20 o f.x > 380, invierte f.vx.", "Agrega un tercer tipo a FOE_SPEEDS (\"ghost\": 2) y créalo: spawn_foe(\"ghost\", " + fy3 + ")."],
    },
    scaffold: (c) => `
${mark("l14", c("Foe Types", "Tipos de enemigos"))}
FOE_SPEEDS = {"slime": 1, "bat": 3}   # ${c("each kind of foe and how fast it moves", "cada tipo de enemigo y qué tan rápido va")}
foes = []

def spawn_foe(kind, y):
    f = Sprite(kind, x=30, y=y)
    f.vx = 0                          # ${c("look up this kind's speed: FOE_SPEEDS[kind]", "busca la velocidad de este tipo: FOE_SPEEDS[kind]")}
    foes.append(f)

spawn_foe("slime", ${fy1})
spawn_foe("bat", ${fy2})

@every_frame
def foe_moves():
    for f in foes:
        f.x = f.x + f.vx
        # ${c("bounce: if f.x < 20 or f.x > 380, flip f.vx", "rebote: si f.x < 20 o f.x > 380, invierte f.vx")}
        pass
${hitCode.replace("{HIT}", c(hitNote.en, hitNote.es))}`,
    solve: [['{"slime": 1, "bat": 3}', '{"slime": 1, "bat": 3, "ghost": 2}'], ["f.vx = 0 ", "f.vx = FOE_SPEEDS[kind] "], [`spawn_foe("bat", ${fy2})\n`, `spawn_foe("bat", ${fy2})\nspawn_foe("ghost", ${fy3})\n`],
      ["        pass\n", "        if f.x < 20 or f.x > 380:\n            f.vx = -f.vx\n"]],
    check: PRE(["foes"]) + `
if len(FOE_SPEEDS) < 3 or len(foes) < 3:
    result = "third"
elif any(f.vx != FOE_SPEEDS.get(f.name) for f in foes):
    result = "lookup"
else:
    for f in foes:
        f.y = -500
    f = foes[0]
    f.x, f.vx = 385, 2
    _step(1)
    if f.vx >= 0:
        result = "bounce"
`,
    fails: {
      lookup: T("Each foe's speed should come from the dictionary: f.vx = FOE_SPEEDS[kind]", "La velocidad de cada enemigo debe venir del diccionario: f.vx = FOE_SPEEDS[kind]"),
      bounce: T("Foes should turn around at the edges: flip f.vx when f.x < 20 or f.x > 380.", "Los enemigos deben dar la vuelta en los bordes: invierte f.vx cuando f.x < 20 o f.x > 380."),
      third: T("Add a third kind of foe to FOE_SPEEDS and spawn one.", "Agrega un tercer tipo de enemigo a FOE_SPEEDS y crea uno."),
    },
    hints: [
      T("kind is the PARAMETER, like \"slime\". FOE_SPEEDS[kind] looks up that kind's speed.", "kind es el PARÁMETRO, como \"slime\". FOE_SPEEDS[kind] busca la velocidad de ese tipo."),
      T("To add to a dictionary, add another \"key\": value pair inside the { }, with a comma.", "Para agregar al diccionario, pon otro par \"clave\": valor dentro de { }, con una coma."),
      ex(`FOE_SPEEDS = {"slime": 1, "bat": 3, "ghost": 2}\n    f.vx = FOE_SPEEDS[kind]\nspawn_foe("ghost", ${fy3})\n        if f.x < 20 or f.x > 380:\n            f.vx = -f.vx`),
    ],
  };

  // ---------------------------------------------------------------- QUEST 7 · Angry Foes (after L14)
  L.q7 = {
    title: T("Side quest: Angry Foes", "Misión extra: Enemigos enojados"),
    goals: {
      en: ["Every 10 seconds (frames % 600 == 0), make every foe 1 faster.", "Foes going right (f.vx > 0) get +1. Foes going left get -1."],
      es: ["Cada 10 segundos (frames % 600 == 0), haz cada enemigo 1 más rápido.", "Los que van a la derecha (f.vx > 0) +1. Los que van a la izquierda -1."],
    },
    scaffold: (c) => `
${mark("q7", c("Angry Foes", "Enemigos enojados"))}
@every_frame
def angry_foes():
    if frames % 600 == 0:
        play("boom")
        # ${c("for every foe: if f.vx > 0, add 1 to f.vx, else take 1 away", "para cada enemigo: si f.vx > 0, suma 1 a f.vx, si no, réstale 1")}
        pass
`,
    solve: [["        pass\n", "        for f in foes:\n            if f.vx > 0:\n                f.vx += 1\n            else:\n                f.vx -= 1\n"]],
    check: PRE(["foes"]) + `
for f in foes:
    f.y = -500
foes[0].x, foes[0].vx = 200, 2
foes[1].x, foes[1].vx = 200, -2
frames = 599
_step(1)
if foes[0].vx != 3 or foes[1].vx != -3:
    result = "faster"
`,
    fails: { faster: T("Every 10 seconds, foes going right should get +1 and foes going left -1.", "Cada 10 segundos, los enemigos que van a la derecha deben tener +1 y los de la izquierda -1.") },
    hints: [
      T("You need a for loop over foes, with an if / else inside.", "Necesitas un bucle for sobre foes, con un if / else adentro."),
      T("A negative vx means the foe is going left. Making it MORE negative makes it faster.", "Un vx negativo significa que va a la izquierda. Hacerlo MÁS negativo lo hace más rápido."),
      ex("        for f in foes:\n            if f.vx > 0:\n                f.vx += 1\n            else:\n                f.vx -= 1"),
    ],
  };

  // ---------------------------------------------------------------- L15 · Difficulty (nested dictionaries)
  L.l15 = {
    title: T("Difficulty", "Dificultad"),
    goals: {
      en: ["Look up the mode you picked: settings = MODES[mode].", "In the for loop: give every foe the mode's speed: f.vx = settings[\"foe_speed\"].", "Use the mode's points: POINTS[\"star\"] = settings[\"star_points\"]. Then try mode = \"hard\"!"],
      es: ["Busca el modo que elegiste: settings = MODES[mode].", "En el bucle for: dale a cada enemigo la velocidad del modo: f.vx = settings[\"foe_speed\"].", "Usa los puntos del modo: POINTS[\"star\"] = settings[\"star_points\"]. ¡Luego prueba mode = \"hard\"!"],
    },
    scaffold: (c) => `
${mark("l15", c("Difficulty", "Dificultad"))}
# ${c("A dictionary can hold OTHER dictionaries! Each mode has its own settings.", "¡Un diccionario puede guardar OTROS diccionarios! Cada modo tiene sus ajustes.")}
MODES = {
    "easy": {"foe_speed": 1, "star_points": 5},
    "hard": {"foe_speed": 3, "star_points": 10},
}
mode = "easy"                         # ${c('try "hard"!', '¡prueba "hard"!')}
settings = MODES["easy"]              # ${c("look up the mode you picked: MODES[mode]", "busca el modo que elegiste: MODES[mode]")}

for f in foes:
    # ${c('give every foe this mode\'s speed: f.vx = settings["foe_speed"]', 'dale a cada enemigo la velocidad del modo: f.vx = settings["foe_speed"]')}
    pass
POINTS["star"] = 5                    # ${c('use settings["star_points"] instead of 5', 'usa settings["star_points"] en vez de 5')}
`,
    solve: [['settings = MODES["easy"]', "settings = MODES[mode]"], ["    pass\nPOINTS", '    f.vx = settings["foe_speed"]\nPOINTS'], ['POINTS["star"] = 5 ', 'POINTS["star"] = settings["star_points"] ']],
    check: PRE(["foes"]) + `
if not re.search(r"settings\\s*=\\s*MODES\\[\\s*mode\\s*\\]", code_only):
    result = "lookup"
elif POINTS.get("star") != settings.get("star_points"):
    result = "points"
elif not re.search(r"\\.vx\\s*=\\s*settings\\[", code_only):
    result = "speed"
`,
    fails: {
      lookup: T("Use the variable mode to pick the settings: settings = MODES[mode]", "Usa la variable mode para elegir los ajustes: settings = MODES[mode]"),
      speed: T("Give each foe the mode's speed: f.vx = settings[\"foe_speed\"]", "Dale a cada enemigo la velocidad del modo: f.vx = settings[\"foe_speed\"]"),
      points: T("Set POINTS[\"star\"] = settings[\"star_points\"].", "Pon POINTS[\"star\"] = settings[\"star_points\"]."),
    },
    hints: [
      T("MODES[mode] uses the VALUE of mode (\"easy\" or \"hard\") as the key. No quotes around mode!", "MODES[mode] usa el VALOR de mode (\"easy\" o \"hard\") como clave. ¡Sin comillas alrededor de mode!"),
      T("settings is a dictionary too, so settings[\"foe_speed\"] looks up a number.", "settings también es un diccionario, así que settings[\"foe_speed\"] busca un número."),
      ex('settings = MODES[mode]\nfor f in foes:\n    f.vx = settings["foe_speed"]\nPOINTS["star"] = settings["star_points"]'),
    ],
  };

  // ---------------------------------------------------------------- L16 · Collection Log (update dictionaries, .items())
  L.l16 = {
    title: T("Collection Log", "Registro de colección"),
    goals: {
      en: ["In lucky() (Level 7): add 1 to collected[\"star\"] when the star is caught.", "In power_up() (Level 12): add 1 to collected[\"power\"] when it's grabbed.", "In show_log(): loop over collected.items() and show each one with text(f\"{name}: {count}\", 10, y), adding 24 to y each time."],
      es: ["En lucky() (Nivel 7): suma 1 a collected[\"star\"] al atrapar la estrella.", "En power_up() (Nivel 12): suma 1 a collected[\"power\"] al agarrarlo.", "En show_log(): recorre collected.items() y muestra cada uno con text(f\"{name}: {count}\", 10, y), sumando 24 a y cada vez."],
    },
    scaffold: (c) => `
${mark("l16", c("Collection Log", "Registro de colección"))}
collected = {"star": 0, "power": 0}   # ${c("how many of each thing you've caught", "cuántos de cada cosa has atrapado")}
# ${c('In lucky(): collected["star"] += 1     In power_up(): collected["power"] += 1', 'En lucky(): collected["star"] += 1     En power_up(): collected["power"] += 1')}

@every_frame
def show_log():
    y = 124
    # ${c('for name, count in collected.items(): show f"{name}: {count}" at (10, y), then y += 24', 'for name, count in collected.items(): muestra f"{name}: {count}" en (10, y), luego y += 24')}
    pass
`,
    solve: [["^touching(star):\n", 'touching(star):\n        collected["star"] += 1\n'], ["^        power.hide()\n", '        power.hide()\n        collected["power"] += 1\n'],
      ["    pass\n", '    for name, count in collected.items():\n        text(f"{name}: {count}", 10, y)\n        y += 24\n']],
    check: PRE(["power"]) + `
power_timer = 0
collected["star"] = 0
collected["power"] = 0
star.show()
star.x, star.y = ${sx}, ${sy}
${placeWho(sx, sy)}_step(1)
if collected["star"] != 1:
    result = "star"
else:
    star.x = -900
    power.show()
    power.x, power.y = ${px}, ${py}
${placeWho(px, py, 4)}    _step(1)
    if collected["power"] != 1:
        result = "power"
    else:
        _ts = ${texts}
        if not ("star: 1" in _ts and "power: 1" in _ts):
            result = "show"
`,
    fails: {
      star: T("Catching the star should add 1 to collected[\"star\"].", "Atrapar la estrella debe sumar 1 a collected[\"star\"]."),
      power: T("Grabbing the power-up should add 1 to collected[\"power\"].", "Agarrar el poder debe sumar 1 a collected[\"power\"]."),
      show: T("Show every entry with text(f\"{name}: {count}\", 10, y) inside a for loop over collected.items().", "Muestra cada entrada con text(f\"{name}: {count}\", 10, y) dentro de un for sobre collected.items()."),
    },
    hints: [
      T("collected[\"star\"] += 1 finds the value for \"star\" and adds 1 to it.", "collected[\"star\"] += 1 busca el valor de \"star\" y le suma 1."),
      T(".items() gives you each KEY and VALUE together: for name, count in collected.items():", ".items() te da cada CLAVE y VALOR juntos: for name, count in collected.items():"),
      ex('    for name, count in collected.items():\n        text(f"{name}: {count}", 10, y)\n        y += 24'),
    ],
  };

  // ---------------------------------------------------------------- QUEST 8 · Achievements (after L16)
  L.q8 = {
    title: T("Side quest: Achievements", "Misión extra: Logros"),
    goals: {
      en: ["Unlock \"First Star\" when collected[\"star\"] >= 1.", "Unlock \"Power Player\" when collected[\"power\"] >= 1.", "Unlock \"High Scorer\" when score >= 50."],
      es: ["Desbloquea \"First Star\" cuando collected[\"star\"] >= 1.", "Desbloquea \"Power Player\" cuando collected[\"power\"] >= 1.", "Desbloquea \"High Scorer\" cuando score >= 50."],
    },
    scaffold: (c) => `
${mark("q8", c("Achievements", "Logros"))}
badges = {"First Star": False, "Power Player": False, "High Scorer": False}

@every_frame
def achievements():
    # ${c('if collected["star"] >= 1: badges["First Star"] = True   (and the same idea for the other two)', 'si collected["star"] >= 1: badges["First Star"] = True   (y la misma idea para los otros dos)')}
    pass
    unlocked = list(badges.values()).count(True)
    text("Badges: " + str(unlocked) + "/" + str(len(badges)), 290, 124, 16)
`,
    solve: [["    pass\n    unlocked", '    if collected["star"] >= 1:\n        badges["First Star"] = True\n    if collected["power"] >= 1:\n        badges["Power Player"] = True\n    if score >= 50:\n        badges["High Scorer"] = True\n    unlocked']],
    check: PRE() + `
for k in badges:
    badges[k] = False
collected["star"], collected["power"] = 1, 0
score = 0
_step(1)
if not badges.get("First Star") or badges.get("Power Player"):
    result = "first"
else:
    collected["power"] = 1
    _step(1)
    if not badges.get("Power Player"):
        result = "power"
    else:
        score = 50
        _step(1)
        if not badges.get("High Scorer"):
            result = "high"
`,
    fails: {
      first: T("\"First Star\" should unlock once collected[\"star\"] is 1 or more (and only then).", "\"First Star\" debe desbloquearse cuando collected[\"star\"] sea 1 o más (y solo entonces)."),
      power: T("\"Power Player\" should unlock when collected[\"power\"] >= 1.", "\"Power Player\" debe desbloquearse cuando collected[\"power\"] >= 1."),
      high: T("\"High Scorer\" should unlock when score >= 50.", "\"High Scorer\" debe desbloquearse cuando score >= 50."),
    },
    hints: [
      T("Each badge is a True/False value in the dictionary. Set it to True to unlock it.", "Cada logro es un valor True/False en el diccionario. Ponlo en True para desbloquearlo."),
      T("You need three ifs, one per badge.", "Necesitas tres if, uno por logro."),
      ex('    if collected["star"] >= 1:\n        badges["First Star"] = True\n    if collected["power"] >= 1:\n        badges["Power Player"] = True\n    if score >= 50:\n        badges["High Scorer"] = True'),
    ],
  };

  // ---------------------------------------------------------------- BOSS 4 · Key Keeper (after L16)
  B.boss4 = {
    starter: (c) => `from pq import *

# ${c("THE KEY KEEPER locked up this game's dictionaries! Find and fix 4 bugs.", "¡EL GUARDIÁN DE LLAVES cerró los diccionarios de este juego! Encuentra y arregla 4 bichos.")}
background("${theme[2]}")
player = Sprite("${theme[0]}", x=200, y=320)
gem = Sprite("gem", x=200, y=320)
POINTS = {"gem": 3 "star": 5}
bonus = POINTS("gem")
collected = {"gem": 0, "star": 0}
score = 0

@every_frame
def grab():
    global score
    if player.touching(gem):
        score += POINTS["gem"]
        collected["gems"] += 1
        gem.x = random.randint(30, 370)

@every_frame
def show_log():
    y = 28
    for name, count in collected.items:
        text(f"{name}: {count}", 10, y)
        y += 24
`,
    solve: [['{"gem": 3 "star": 5}', '{"gem": 3, "star": 5}'], ['POINTS("gem")', 'POINTS["gem"]'], ['collected["gems"]', 'collected["gem"]'], ["collected.items:", "collected.items():"]],
    check: `
bad = []
gem.x, gem.y = player.x, player.y
try:
    grab()
except Exception:
    bad.append("key")
try:
    show_log()
except Exception:
    bad.append("items")
_extra = len(bad)
result = bad[0] if bad else None
`,
    fails: {
      key: T("Bug found: catching the gem crashes. One key is spelled differently from the dictionary.", "Bicho encontrado: atrapar la gema falla. Una clave está escrita distinto que en el diccionario."),
      items: T("Bug found: the log can't loop over collected. .items needs ( ) to run.", "Bicho encontrado: el registro no puede recorrer collected. .items necesita ( ) para ejecutarse."),
    },
    hints: [
      T("Press Run and read the error first. Fix one bug at a time, top to bottom.", "Presiona Ejecutar y lee el error. Arregla un bicho a la vez, de arriba abajo."),
      T("Four bugs: a missing comma, ( ) where [ ] belongs, a key that doesn't exist, and a method with no ( ).", "Cuatro bichos: una coma que falta, ( ) donde van [ ], una clave que no existe y un método sin ( )."),
      T('Fixes: {"gem": 3, "star": 5} · POINTS["gem"] · collected["gem"] · collected.items()', 'Arreglos: {"gem": 3, "star": 5} · POINTS["gem"] · collected["gem"] · collected.items()'),
    ],
  };

  // ---------------------------------------------------------------- L17 · Juice It Up (animation math)
  L.l17 = {
    title: T("Juice It Up", "Dale vida"),
    goals: {
      en: ["Make the star pulse: star.size = 1 + (frames % 60) / 120.", "Make the power-up bob: power.y = power_base + (frames // 15) % 2 * 4."],
      es: ["Haz que la estrella palpite: star.size = 1 + (frames % 60) / 120.", "Haz que el poder flote: power.y = power_base + (frames // 15) % 2 * 4."],
    },
    scaffold: (c) => `
${mark("l17", c("Juice It Up", "Dale vida"))}
# ${c("JUICE = little movements that make a game feel alive. Math makes them repeat.", "VIDA = pequeños movimientos que hacen que el juego se sienta vivo. Las matemáticas los repiten.")}
power_base = power.y

@every_frame
def wobble():
    star.size = 1                     # ${c("pulse 1 → 1.5: 1 + (frames % 60) / 120", "palpita 1 → 1.5: 1 + (frames % 60) / 120")}
    power.y = power_base              # ${c("bob up and down: power_base + (frames // 15) % 2 * 4", "sube y baja: power_base + (frames // 15) % 2 * 4")}
`,
    solve: [["star.size = 1 ", "star.size = 1 + (frames % 60) / 120 "], ["power.y = power_base ", "power.y = power_base + (frames // 15) % 2 * 4 "]],
    check: PRE(["power"]) + `
sizes, ys = set(), set()
power.x = -900
for _i in range(60):
    _step(1)
    sizes.add(round(star.size, 3))
    ys.add(power.y)
if len(sizes) < 5 or max(sizes) > 2 or min(sizes) < 0.5:
    result = "pulse"
elif len(ys) < 2:
    result = "bob"
`,
    fails: {
      pulse: T("The star's size should keep changing between 1 and 1.5: 1 + (frames % 60) / 120", "El tamaño de la estrella debe cambiar entre 1 y 1.5: 1 + (frames % 60) / 120"),
      bob: T("The power-up should bob: power_base + (frames // 15) % 2 * 4", "El poder debe subir y bajar: power_base + (frames // 15) % 2 * 4"),
    },
    hints: [
      T("frames % 60 counts 0, 1, 2 ... 59, then starts again at 0. That's what makes it repeat.", "frames % 60 cuenta 0, 1, 2 ... 59 y vuelve a 0. Eso hace que se repita."),
      T("(frames // 15) % 2 flips between 0 and 1 every 15 frames.", "(frames // 15) % 2 cambia entre 0 y 1 cada 15 cuadros."),
      ex("    star.size = 1 + (frames % 60) / 120\n    power.y = power_base + (frames // 15) % 2 * 4"),
    ],
  };

  // ---------------------------------------------------------------- L18 · Wave Attack (lists of dictionaries)
  L.l18 = {
    title: T("Wave Attack", "Ataque en oleada"),
    goals: {
      en: ["Add a third foe to WAVE: {\"kind\": \"ghost\", \"y\": " + fy3 + "}.", "When the wave starts, spawn every foe in WAVE: for w in WAVE: spawn_foe(w[\"kind\"], w[\"y\"])."],
      es: ["Agrega un tercer enemigo a WAVE: {\"kind\": \"ghost\", \"y\": " + fy3 + "}.", "Cuando empiece la oleada, crea cada enemigo de WAVE: for w in WAVE: spawn_foe(w[\"kind\"], w[\"y\"])."],
    },
    scaffold: (c) => `
${mark("l18", c("Wave Attack", "Ataque en oleada"))}
# ${c("A LIST of DICTIONARIES: each foe in the wave has a kind and a y.", "Una LISTA de DICCIONARIOS: cada enemigo de la oleada tiene un tipo y una y.")}
WAVE = [
    {"kind": "slime", "y": ${fy1}},
    {"kind": "bat", "y": ${fy2}},
]
wave_sent = False

@every_frame
def send_wave():
    global wave_sent
    if stage >= 3 and not wave_sent:  # ${c("once, when you reach stage 3", "una vez, al llegar a la etapa 3")}
        wave_sent = True
        play("boom")
        # ${c('spawn every foe in WAVE: for w in WAVE: spawn_foe(w["kind"], w["y"])', 'crea cada enemigo de WAVE: for w in WAVE: spawn_foe(w["kind"], w["y"])')}
        pass
`,
    solve: [[`    {"kind": "bat", "y": ${fy2}},\n`, `    {"kind": "bat", "y": ${fy2}},\n    {"kind": "ghost", "y": ${fy3}},\n`], ["        pass\n", '        for w in WAVE:\n            spawn_foe(w["kind"], w["y"])\n']],
    check: PRE(["foes"]) + `
if len(WAVE) < 3:
    result = "add"
elif any(w.get("kind") not in FOE_SPEEDS for w in WAVE):
    result = "kind"
else:
    wave_sent = False
    n = len(foes)
    score = 30
    _step(1)
    if len(foes) != n + len(WAVE):
        result = "spawn"
    else:
        _step(1)
        if len(foes) != n + len(WAVE):
            result = "once"
`,
    fails: {
      add: T("Add a third foe dictionary to WAVE.", "Agrega un tercer diccionario de enemigo a WAVE."),
      kind: T("Every \"kind\" in WAVE needs a speed in FOE_SPEEDS (Level 14).", "Cada \"kind\" de WAVE necesita una velocidad en FOE_SPEEDS (Nivel 14)."),
      spawn: T("When the wave starts, spawn one foe for every entry in WAVE.", "Cuando empiece la oleada, crea un enemigo por cada entrada de WAVE."),
      once: T("The wave should only happen once. Keep the wave_sent lines.", "La oleada solo debe pasar una vez. Deja las líneas de wave_sent."),
    },
    hints: [
      T("w is one dictionary from the list, like {\"kind\": \"bat\", \"y\": " + fy2 + "}. w[\"kind\"] gives \"bat\".", "w es un diccionario de la lista, como {\"kind\": \"bat\", \"y\": " + fy2 + "}. w[\"kind\"] da \"bat\"."),
      T("Each dictionary in the list needs { }, a comma between pairs, and a comma after it.", "Cada diccionario de la lista necesita { }, una coma entre pares y una coma después."),
      ex(`    {"kind": "ghost", "y": ${fy3}},\n...\n        for w in WAVE:\n            spawn_foe(w["kind"], w["y"])`),
    ],
  };

  // ---------------------------------------------------------------- QUEST 9 · Sparkle Burst (after L18)
  L.q9 = {
    title: T("Side quest: Sparkle Burst", "Misión extra: Explosión de chispas"),
    goals: {
      en: ["Finish burst(x, y): make 8 sparks at (x, y), each with a random s.vx and s.vy from -4 to 4.", "In lucky() (Level 7): call burst(star.x, star.y) when the star is caught."],
      es: ["Termina burst(x, y): crea 8 chispas en (x, y), cada una con s.vx y s.vy al azar de -4 a 4.", "En lucky() (Nivel 7): llama a burst(star.x, star.y) al atrapar la estrella."],
    },
    scaffold: (c) => `
${mark("q9", c("Sparkle Burst", "Explosión de chispas"))}
sparks = []

def burst(x, y):
    for i in range(8):
        s = Box(x, y, 5, 5, "yellow")
        # ${c("give s a random speed: s.vx = random.randint(-4, 4) and the same for s.vy", "dale a s una velocidad al azar: s.vx = random.randint(-4, 4) y lo mismo para s.vy")}
        sparks.append(s)

@every_frame
def move_sparks():
    for s in sparks:
        s.x += s.vx
        s.y += s.vy
    cleanup(sparks)
# ${c("Then in lucky(): burst(star.x, star.y) when you catch the star", "Luego en lucky(): burst(star.x, star.y) al atrapar la estrella")}
`,
    solve: [["        sparks.append(s)\n", "        s.vx = random.randint(-4, 4)\n        s.vy = random.randint(-4, 4)\n        sparks.append(s)\n"], ["^touching(star):\n", "touching(star):\n        burst(star.x, star.y)\n"]],
    check: PRE() + `
n = len(sparks)
burst(100, 100)
new = sparks[n:]
if len(new) != 8 or len({(s.vx, s.vy) for s in new}) < 3:
    result = "random"
else:
    for s in new:
        s.hide()
    cleanup(sparks)
    n = len(sparks)
    star.show()
    star.x, star.y = ${sx}, ${sy}
${placeWho(sx, sy, 4)}    _step(1)
    if len(sparks) < n + 8:
        result = "call"
`,
    fails: {
      random: T("Each of the 8 sparks needs a random speed: s.vx = random.randint(-4, 4) and s.vy too.", "Cada una de las 8 chispas necesita velocidad al azar: s.vx = random.randint(-4, 4) y también s.vy."),
      call: T("Call burst(star.x, star.y) in lucky() when the star is caught.", "Llama a burst(star.x, star.y) en lucky() al atrapar la estrella."),
    },
    hints: [
      T("random.randint(-4, 4) can be negative (left/up) or positive (right/down), so the sparks fly every way.", "random.randint(-4, 4) puede ser negativo (izquierda/arriba) o positivo (derecha/abajo), así las chispas vuelan para todos lados."),
      T("Put the burst(...) line right under if ... touching(star): in lucky(), before the star moves.", "Pon la línea burst(...) justo debajo de if ... touching(star): en lucky(), antes de que la estrella se mueva."),
      ex("        s.vx = random.randint(-4, 4)\n        s.vy = random.randint(-4, 4)\n# lucky():\n        burst(star.x, star.y)"),
    ],
  };

  // ---------------------------------------------------------------- L19 · Smart Foes (chasing)
  L.l19 = {
    title: T("Smart Foes", "Enemigos listos"),
    goals: {
      en: [`If a foe is close to ${P} (abs(f.x - ${P}.x) < CHASE_RANGE), move it 1 step toward ${P}.`, `Toward means: if f.x < ${P}.x, add 1 to f.x, else take 1 away.`],
      es: [`Si un enemigo está cerca de ${P} (abs(f.x - ${P}.x) < CHASE_RANGE), muévelo 1 paso hacia ${P}.`, `Hacia significa: si f.x < ${P}.x, suma 1 a f.x, si no, réstale 1.`],
    },
    scaffold: (c) => `
${mark("l19", c("Smart Foes", "Enemigos listos"))}
CHASE_RANGE = 150                     # ${c("how close a foe must be to start chasing", "qué tan cerca debe estar un enemigo para perseguir")}

@every_frame
def chase():
    for f in foes:
        # ${c(`if abs(f.x - ${P}.x) < CHASE_RANGE: step toward ${P} (if f.x < ${P}.x: f.x += 1, else: f.x -= 1)`, `si abs(f.x - ${P}.x) < CHASE_RANGE: da un paso hacia ${P} (si f.x < ${P}.x: f.x += 1, si no: f.x -= 1)`)}
        pass
`,
    solve: [["        pass\n", `        if abs(f.x - ${P}.x) < CHASE_RANGE:\n            if f.x < ${P}.x:\n                f.x += 1\n            else:\n                f.x -= 1\n`]],
    check: PRE(["foes"]) + `
for f in foes:
    f.y, f.vx = -500, 0
frames = 1
${P}.x = 200
f = foes[0]
f.x = 100
_step(1)
if f.x != 101:
    result = "toward"
else:
    f.x = 300
    _step(1)
    if f.x != 299:
        result = "toward"
    else:
        f.x = 380
        ${P}.x = 20
        _step(1)
        if f.x != 380:
            result = "range"
`,
    fails: {
      toward: T(`A nearby foe should move 1 step toward ${P} every frame.`, `Un enemigo cercano debe moverse 1 paso hacia ${P} en cada cuadro.`),
      range: T("Foes farther than CHASE_RANGE should not chase.", "Los enemigos más lejos que CHASE_RANGE no deben perseguir."),
    },
    hints: [
      T(`abs(f.x - ${P}.x) is the distance between them, left or right.`, `abs(f.x - ${P}.x) es la distancia entre ellos, a la izquierda o a la derecha.`),
      T("You need an if inside an if: first 'is it close?', then 'which way?'.", "Necesitas un if dentro de otro if: primero '¿está cerca?', luego '¿hacia dónde?'."),
      ex(`        if abs(f.x - ${P}.x) < CHASE_RANGE:\n            if f.x < ${P}.x:\n                f.x += 1\n            else:\n                f.x -= 1`),
    ],
  };

  // ---------------------------------------------------------------- L20 · Hall of Fame (find the max)
  L.l20 = {
    title: T("Hall of Fame", "Salón de la fama"),
    goals: {
      en: ["Add 2 more players to HALL (each one is {\"name\": ..., \"score\": ...}).", "In hall_of_fame(): loop over HALL and keep the entry with the biggest \"score\" in top."],
      es: ["Agrega 2 jugadores más a HALL (cada uno es {\"name\": ..., \"score\": ...}).", "En hall_of_fame(): recorre HALL y guarda en top la entrada con el \"score\" más grande."],
    },
    scaffold: (c) => `
${mark("l20", c("Hall of Fame", "Salón de la fama"))}
HALL = [
    {"name": "Ada", "score": 12},
    {"name": "Grace", "score": 25},
    {"name": "Alan", "score": 18},
]

@every_frame
def hall_of_fame():
    top = HALL[0]
    # ${c('FIND THE MAX: for p in HALL: if p["score"] > top["score"]: top = p', 'BUSCA EL MÁXIMO: for p in HALL: if p["score"] > top["score"]: top = p')}
    pass
    if score > top["score"]:
        text("NEW RECORD!", 130, 150, 28, "gold")
    else:
        text("Top: " + top["name"] + " " + str(top["score"]), 250, 148, 16)
`,
    solve: [['    {"name": "Alan", "score": 18},\n', '    {"name": "Alan", "score": 18},\n    {"name": "Maya", "score": 30},\n    {"name": "Leo", "score": 9},\n'], ['    pass\n    if score > top', '    for p in HALL:\n        if p["score"] > top["score"]:\n            top = p\n    if score > top']],
    check: PRE() + `
if len(HALL) < 5:
    result = "add"
else:
    HALL[:] = [{"name": "Xi", "score": 3}, {"name": "Yo", "score": 40}, {"name": "Zed", "score": 7}, {"name": "Ann", "score": 12}, {"name": "Bo", "score": 1}]
    score = 0
${placeWho(sx, sy, 4)}    _step(1)
    if not any("Yo 40" in t for t in ${texts}):
        result = "max"
`,
    fails: {
      add: T("Add 2 more players to HALL (5 or more in total).", "Agrega 2 jugadores más a HALL (5 o más en total)."),
      max: T("top should end up as the entry with the highest score. Loop over HALL and compare.", "top debe terminar siendo la entrada con el puntaje más alto. Recorre HALL y compara."),
    },
    hints: [
      T("Start with the first player as the best so far. Then check each player: are they better?", "Empieza con el primer jugador como el mejor hasta ahora. Luego revisa cada jugador: ¿es mejor?"),
      T("p[\"score\"] > top[\"score\"] compares two scores. If it's True, p is the new top.", "p[\"score\"] > top[\"score\"] compara dos puntajes. Si es True, p es el nuevo top."),
      ex('    for p in HALL:\n        if p["score"] > top["score"]:\n            top = p'),
    ],
  };

  // ---------------------------------------------------------------- QUEST 10 · Secret Code (strings)
  L.q10 = {
    title: T("Side quest: Secret Code", "Misión extra: Código secreto"),
    goals: {
      en: ["Add a letter for the other arrows: \"D\" for down, \"L\" for left, \"R\" for right.", "When typed == SECRET: play(\"win\") and add 25 to score."],
      es: ["Agrega una letra para las otras flechas: \"D\" abajo, \"L\" izquierda, \"R\" derecha.", "Cuando typed == SECRET: play(\"win\") y suma 25 a score."],
    },
    scaffold: (c) => `
${mark("q10", c("Secret Code", "Código secreto"))}
SECRET = "UUDD"                       # ${c("U = up, D = down, L = left, R = right", "U = arriba, D = abajo, L = izquierda, R = derecha")}
typed = ""

@every_frame
def secret_code():
    global typed, score
    if key_pressed("up"):
        typed += "U"
    # ${c('add the other arrows: "D", "L", "R"', 'agrega las otras flechas: "D", "L", "R"')}
    typed = typed[-4:]                # ${c("SLICING: keep only the last 4 letters", "REBANAR: guarda solo las últimas 4 letras")}
    if typed == SECRET:
        typed = ""
        # ${c('reward: play("win") and add 25 to score', 'premio: play("win") y suma 25 a score')}
        pass
`,
    solve: [['        typed += "U"\n', '        typed += "U"\n    if key_pressed("down"):\n        typed += "D"\n    if key_pressed("left"):\n        typed += "L"\n    if key_pressed("right"):\n        typed += "R"\n'], ["        pass\n", '        play("win")\n        score += 25\n']],
    check: PRE() + `
typed = ""
for k in ["up", "down", "left", "right"]:
    _step(1, keys=[k])
    _step(1)
if typed != "UDLR":
    result = "keys"
else:
    typed = ""
    s0 = score
    for k in ["up", "up", "down", "down"]:
        _step(1, keys=[k])
        _step(1)
    if score < s0 + 25:
        result = "reward"
`,
    fails: {
      keys: T("Each arrow should add its letter to typed: U, D, L, R.", "Cada flecha debe agregar su letra a typed: U, D, L, R."),
      reward: T("Typing the secret should add 25 to score.", "Escribir el código debe sumar 25 a score."),
    },
    hints: [
      T("typed += \"D\" adds D to the end of the string.", "typed += \"D\" agrega D al final del string."),
      T("typed[-4:] keeps the last 4 letters, so old presses fall off the front.", "typed[-4:] guarda las últimas 4 letras, así las teclas viejas se caen del frente."),
      ex('    if key_pressed("down"):\n        typed += "D"\n...\n        play("win")\n        score += 25'),
    ],
  };

  // ---------------------------------------------------------------- BOSS 5 · Bug Beast King (after L20)
  B.boss5 = {
    starter: (c) => `from pq import *

# ${c("THE BUG BEAST KING is here! Fix 4 bugs to win the whole unit.", "¡LLEGÓ EL REY BESTIA DE BICHOS! Arregla 4 bichos para ganar toda la unidad.")}
background("${theme[2]}")
player = Sprite("${theme[0]}", x=200, y=320)
score = 0
foes = []
for i in range(1, 5):
    foes.append(Sprite("slime", x=40 + i * 70, y=120))

@every_frame
def controls():
    if key_down("left"):
        player.x -= 4
    if key_down("right"):
        player.x += 4

@every_frame
def keep_inside():
    while player.x > 380:
        player.x = player.x + 1

@every_frame
def stomp():
    for f in foes:
        if player.touching(f):
            f.hide()
            score += 1
    if score = len(foes):
        game_over("You win!")
`,
    solve: [["if score = len(foes):", "if score == len(foes):"], ["range(1, 5)", "range(5)"], ["player.x = player.x + 1", "player.x = player.x - 1"], ["def stomp():\n", "def stomp():\n    global score\n"]],
    check: `
import pq as _pq
bad = []
if len(foes) != 5:
    bad.append("count")
player.x = 390
try:
    _pq._guarded(keep_inside, 20000)
    if player.x > 380:
        bad.append("while")
except BaseException:
    bad.append("while")
player.x = 200
foes[0].x, foes[0].y = 200, 320
foes[0].show()
try:
    stomp()
except Exception:
    bad.append("global")
_extra = len(bad)
result = bad[0] if bad else None
`,
    fails: {
      count: T("Bug found: there should be 5 foes, but range(1, 5) only makes 4. Ranges start at 0.", "Bicho encontrado: debe haber 5 enemigos, pero range(1, 5) solo crea 4. Los range empiezan en 0."),
      while: T("Bug found: the while loop never ends! It pushes the player further right instead of back.", "Bicho encontrado: ¡el bucle while nunca termina! Empuja al jugador más a la derecha en vez de regresarlo."),
      global: T("Bug found: stomp() changes score without permission. Add global score.", "Bicho encontrado: stomp() cambia score sin permiso. Agrega global score."),
    },
    hints: [
      T("Press Run and read the error first. Fix one bug at a time, top to bottom.", "Presiona Ejecutar y lee el error. Arregla un bicho a la vez, de arriba abajo."),
      T("Four bugs: = instead of ==, a range that's one short, a while loop going the wrong way, and a missing global.", "Cuatro bichos: = en vez de ==, un range que se queda corto, un while que va al revés y un global que falta."),
      T("Fixes: score == len(foes) · range(5) · player.x - 1 · global score", "Arreglos: score == len(foes) · range(5) · player.x - 1 · global score"),
    ],
  };

  return { levels: L, bosses: B };
}
