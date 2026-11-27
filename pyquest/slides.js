// Concept slides: a short introduction shown the first time a student opens each level.
// Students can open them again from the level page at any time ("📖 Concept slides").
// Each slide has a title, a short explanation, optional example code, and an optional picture.
// The last slide of each deck is a quick check question (no XP, just practice).
// Code examples work in every game type, so they use general names (player, coins, score).

const T = (en, es) => ({ en, es });

// Level slides. A slide with `concept` is where that concept is first taught in depth.
export const SLIDES = {
  l1: [
    { title: T("What is code?", "¿Qué es el código?"),
      body: T("Code is a list of instructions for the computer. Python reads your code from the top down, one line at a time, and does exactly what it says. Not what you meant — what you wrote!",
        "El código es una lista de instrucciones para la computadora. Python lee tu código de arriba hacia abajo, una línea a la vez, y hace exactamente lo que dice. No lo que quisiste decir: ¡lo que escribiste!"),
      code: T('print("Hello!")\nprint("I am making a game")', 'print("¡Hola!")\nprint("Estoy haciendo un juego")') },
    { concept: "variables", title: T("Variables", "Variables"),
      body: T("A variable is a labelled box that holds a value. The name goes on the left, then =, then the value. Later you can use the name instead of the value, and change it whenever you want.",
        "Una variable es una caja con etiqueta que guarda un valor. El nombre va a la izquierda, luego =, luego el valor. Después puedes usar el nombre en lugar del valor y cambiarlo cuando quieras."),
      code: T("speed = 4\nlives = 3\nspeed = 6     # now speed holds 6", "speed = 4\nlives = 3\nspeed = 6     # ahora speed guarda 6"),
      pic: "box" },
    { title: T("Numbers and text", "Números y texto"),
      body: T("Numbers are written plain: 4, 0.5, 100. Text (called a STRING) goes inside quotes: \"Sky Jumper\". Without quotes, Python thinks a word is the name of a variable.",
        "Los números se escriben solos: 4, 0.5, 100. El texto (llamado STRING) va entre comillas: \"Sky Jumper\". Sin comillas, Python piensa que una palabra es el nombre de una variable."),
      code: T('TITLE = "Sky Jumper"   # a string\nJUMP = 10              # a number\nprint(TITLE)           # shows: Sky Jumper\nprint("TITLE")         # shows: TITLE',
        'TITLE = "Sky Jumper"   # un string\nJUMP = 10              # un número\nprint(TITLE)           # muestra: Sky Jumper\nprint("TITLE")         # muestra: TITLE') },
    { title: T("Where things go on the screen", "Dónde van las cosas en la pantalla"),
      body: T("The game screen is 400 by 400. x counts across from the left. y counts DOWN from the top, so a bigger y is lower on the screen. A Sprite is a picture placed at an x and a y.",
        "La pantalla del juego mide 400 por 400. x cuenta de izquierda a derecha. y cuenta HACIA ABAJO desde arriba, así que una y más grande está más abajo. Un Sprite es una imagen puesta en una x y una y."),
      code: 'player = Sprite("hero", x=60, y=300)',
      pic: "grid" },
    { quiz: true,
      title: T("Quick check", "Repaso rápido"),
      q: T("TITLE = \"Robo Run\". What does print(TITLE) show?", "TITLE = \"Robo Run\". ¿Qué muestra print(TITLE)?"),
      options: [T("Robo Run", "Robo Run"), T("TITLE", "TITLE"), T("An error", "Un error")], answer: 0,
      why: T("TITLE has no quotes, so Python looks inside the variable and prints what it holds.", "TITLE no tiene comillas, así que Python mira dentro de la variable e imprime lo que guarda.") },
  ],

  l2: [
    { concept: "loops", title: T("The game loop", "El ciclo del juego"),
      body: T("A game is like a flip book. About 60 times every second it moves things a tiny bit and redraws the screen. That repeating cycle is called the GAME LOOP.",
        "Un juego es como un libro animado. Unas 60 veces por segundo mueve las cosas un poquito y vuelve a dibujar la pantalla. Ese ciclo que se repite se llama el CICLO DEL JUEGO."),
      pic: "loop" },
    { concept: "functions", title: T("Functions: a named job", "Funciones: una tarea con nombre"),
      body: T("def makes a FUNCTION: a set of lines with a name. The lines that belong to it are indented (pushed in) by 4 spaces. Indenting matters in Python — it shows what is inside.",
        "def crea una FUNCIÓN: un grupo de líneas con nombre. Las líneas que le pertenecen tienen sangría (están metidas) 4 espacios. La sangría importa en Python: muestra qué está adentro."),
      code: T("def fall():\n    player.y += 2      # inside fall\nprint(\"hi\")          # NOT inside fall", "def fall():\n    player.y += 2      # dentro de fall\nprint(\"hola\")        # NO está dentro de fall") },
    { title: T("@every_frame", "@every_frame"),
      body: T("Put @every_frame on the line above def, and the game runs that function on every frame — 60 times a second. That is how you make things move by themselves.",
        "Pon @every_frame en la línea de arriba de def, y el juego ejecuta esa función en cada cuadro: 60 veces por segundo. Así haces que las cosas se muevan solas."),
      code: "@every_frame\ndef fall():\n    player.y += 2" },
    { title: T("Changing a variable a little", "Cambiar una variable poquito a poco"),
      body: T("+= means \"add to what is already there\". x += 3 moves something 3 steps right. -= takes away. Do it every frame and it slides smoothly across the screen.",
        "+= significa \"suma a lo que ya hay\". x += 3 mueve algo 3 pasos a la derecha. -= resta. Hazlo en cada cuadro y se desliza suavemente por la pantalla."),
      code: T("player.x += 3    # right\nplayer.x -= 3    # left\nplayer.y += 3    # down (y goes down!)", "player.x += 3    # derecha\nplayer.x -= 3    # izquierda\nplayer.y += 3    # abajo (¡y crece hacia abajo!)") },
    { quiz: true,
      title: T("Quick check", "Repaso rápido"),
      q: T("A function has @every_frame above it. How often does it run?", "Una función tiene @every_frame arriba. ¿Cada cuánto se ejecuta?"),
      options: [T("Once, when the game starts", "Una vez, al empezar el juego"), T("About 60 times a second", "Unas 60 veces por segundo"), T("Only when you press a key", "Solo cuando presionas una tecla")], answer: 1,
      why: T("@every_frame hooks the function into the game loop, which runs every frame.", "@every_frame conecta la función al ciclo del juego, que se ejecuta en cada cuadro.") },
  ],

  l3: [
    { title: T("Events", "Eventos"),
      body: T("An EVENT is something that happens while the game runs: a key press, a tap, two things bumping. Your code checks for events and reacts to them.",
        "Un EVENTO es algo que pasa mientras el juego corre: presionar una tecla, un toque, dos cosas que chocan. Tu código revisa los eventos y reacciona."),
      pic: "keys" },
    { concept: "conditionals", title: T("if: make a decision", "if: tomar una decisión"),
      body: T("if checks a question that is True or False. If it's True, the indented lines run. If it's False, Python skips them. Don't forget the colon : at the end!",
        "if revisa una pregunta que es True (verdadero) o False (falso). Si es True, se ejecutan las líneas con sangría. Si es False, Python las salta. ¡No olvides los dos puntos : al final!"),
      code: 'if key_down("right"):\n    player.x += 4' },
    { title: T("Held or tapped?", "¿Sostenida o presionada una vez?"),
      body: T("key_down is True the whole time a key is held — good for walking. key_pressed is True only on the first moment — good for one jump or one shot.",
        "key_down es True todo el tiempo que sostienes la tecla: bueno para caminar. key_pressed es True solo en el primer momento: bueno para un salto o un disparo."),
      code: T('if key_down("left"):      # hold to walk\n    player.x -= 4\nif key_pressed("space"):  # tap to jump\n    player.vy = -10',
        'if key_down("left"):      # sostén para caminar\n    player.x -= 4\nif key_pressed("space"):  # toca para saltar\n    player.vy = -10') },
    { title: T("else and elif", "else y elif"),
      body: T("else runs when the if was False. elif (\"else if\") asks another question. Python checks them top to bottom and runs only the first one that's True.",
        "else se ejecuta cuando el if fue False. elif (\"si no, si\") hace otra pregunta. Python las revisa de arriba hacia abajo y ejecuta solo la primera que sea True."),
      code: 'if key_down("left"):\n    player.x -= 4\nelif key_down("right"):\n    player.x += 4\nelse:\n    player.x += 0' },
    { title: T("Comparing", "Comparar"),
      body: T("These make True/False questions: == equal (two = signs!), != not equal, < less than, > greater than, <= and >=. One = stores a value; two == asks a question.",
        "Estos hacen preguntas de True/False: == igual (¡dos signos =!), != distinto, < menor que, > mayor que, <= y >=. Un = guarda un valor; dos == hacen una pregunta."),
      code: T("if player.x > 400:     # off the right edge?\n    player.x = 0       # wrap around", "if player.x > 400:     # ¿salió por la derecha?\n    player.x = 0       # vuelve al inicio") },
    { quiz: true,
      title: T("Quick check", "Repaso rápido"),
      q: T("You want ONE jump each time space is pressed. Which do you use?", "Quieres UN salto cada vez que presionas espacio. ¿Cuál usas?"),
      options: [T('key_down("space")', 'key_down("space")'), T('key_pressed("space")', 'key_pressed("space")'), T("else", "else")], answer: 1,
      why: T("key_pressed is only True on the first frame, so holding the key won't jump again and again.", "key_pressed solo es True en el primer cuadro, así que sostener la tecla no salta una y otra vez.") },
  ],

  l4: [
    { concept: "lists", title: T("Lists", "Listas"),
      body: T("A LIST holds many values in one variable. Write them inside square brackets [ ], with commas between. One list can hold every enemy, brick or platform in your game.",
        "Una LISTA guarda muchos valores en una variable. Escríbelos entre corchetes [ ], separados por comas. Una lista puede guardar todos los enemigos, ladrillos o plataformas de tu juego."),
      code: 'colors = ["red", "blue", "gold"]\nplatforms = [ground]',
      pic: "list" },
    { title: T("Adding to a list", "Agregar a una lista"),
      body: T(".append() adds a new item to the end of a list. len() tells you how many items it has.",
        ".append() agrega un elemento nuevo al final de una lista. len() te dice cuántos elementos tiene."),
      code: T("enemies = []\nenemies.append(Sprite(\"slime\", x=100, y=50))\nprint(len(enemies))   # 1", "enemies = []\nenemies.append(Sprite(\"slime\", x=100, y=50))\nprint(len(enemies))   # 1") },
    { concept: "loops", title: T("for loops", "Bucles for"),
      body: T("A FOR LOOP does the same job once for each item in a list. Each time around, the loop variable (here, e) is the next item.",
        "Un BUCLE FOR hace la misma tarea una vez por cada elemento de una lista. En cada vuelta, la variable del bucle (aquí, e) es el siguiente elemento."),
      code: T("for e in enemies:\n    e.y += 2      # every enemy moves down", "for e in enemies:\n    e.y += 2      # cada enemigo baja") },
    { title: T("range(): repeat a number of times", "range(): repetir cierto número de veces"),
      body: T("range(4) gives the numbers 0, 1, 2, 3 — four of them, starting at 0. Use i to space things out so they don't all land in the same spot.",
        "range(4) da los números 0, 1, 2, 3: cuatro números, empezando en 0. Usa i para separar las cosas y que no queden todas en el mismo lugar."),
      code: 'for i in range(4):\n    brick = Box(60 + i * 90, 40, 80, 20, "orange")\n    bricks.append(brick)' },
    { quiz: true,
      title: T("Quick check", "Repaso rápido"),
      q: T("What numbers does range(3) give?", "¿Qué números da range(3)?"),
      options: [T("1, 2, 3", "1, 2, 3"), T("0, 1, 2", "0, 1, 2"), T("0, 1, 2, 3", "0, 1, 2, 3")], answer: 1,
      why: T("range starts at 0 and stops just before the number you give it.", "range empieza en 0 y se detiene justo antes del número que le das.") },
  ],

  l5: [
    { title: T("True and False", "True y False"),
      body: T("Python has two special values: True and False. They're called BOOLEANS. Every if is really asking: is this True?",
        "Python tiene dos valores especiales: True y False. Se llaman BOOLEANOS. Cada if en realidad pregunta: ¿esto es True?") },
    { title: T("touching()", "touching()"),
      body: T("player.touching(coin) answers True when the two pictures overlap, and False when they don't. That makes it perfect inside an if.",
        "player.touching(coin) responde True cuando las dos imágenes se encimen, y False cuando no. Por eso es perfecto dentro de un if."),
      code: 'for c in coins:\n    if player.touching(c):\n        c.hide()\n        play("coin")',
      pic: "touch" },
    { title: T("Keeping score", "Llevar el puntaje"),
      body: T("A score is just a number variable. Add to it when something good happens, and show it on the screen with text() every frame.",
        "Un puntaje es solo una variable de número. Súmale cuando pase algo bueno y muéstralo en la pantalla con text() en cada cuadro."),
      code: 'score = 0\n...\nscore += 1\ntext("Score: " + str(score), 10, 28)' },
    { title: T("global", "global"),
      body: T("A function can read a variable from outside, but to CHANGE it, the first line of the function must say global and the name. Forget it and Python gets confused about which score you mean.",
        "Una función puede leer una variable de afuera, pero para CAMBIARLA, la primera línea de la función debe decir global y el nombre. Si lo olvidas, Python se confunde sobre cuál score quieres decir."),
      code: "@every_frame\ndef collect():\n    global score\n    score += 1" },
    { quiz: true,
      title: T("Quick check", "Repaso rápido"),
      q: T("What does player.touching(coin) give back?", "¿Qué devuelve player.touching(coin)?"),
      options: [T("A number of points", "Un número de puntos"), T("True or False", "True o False"), T("The coin's name", "El nombre de la moneda")], answer: 1,
      why: T("touching() is a yes/no question, so its answer is a boolean: True or False.", "touching() es una pregunta de sí o no, así que su respuesta es un booleano: True o False.") },
  ],

  side1: [
    { title: T("Lives: counting down", "Vidas: contar hacia atrás"),
      body: T("Lives work like score, but backwards. Start with a number and subtract 1 each time something bad happens.",
        "Las vidas funcionan como el puntaje, pero al revés. Empieza con un número y resta 1 cada vez que pase algo malo."),
      code: 'lives = 3\n...\nif player.touching(enemy):\n    lives -= 1\n    play("hurt")' },
    { title: T("Ending the game", "Terminar el juego"),
      body: T("Use an if to check when lives run out, then call game_over() with a message. <= means \"less than or equal\", so it still works if lives skips past 0.",
        "Usa un if para revisar cuándo se acaban las vidas y luego llama a game_over() con un mensaje. <= significa \"menor o igual\", así que funciona aunque lives pase de 0."),
      code: 'if lives <= 0:\n    game_over("Out of lives!")' },
    { quiz: true,
      title: T("Quick check", "Repaso rápido"),
      q: T("lives is 1 and the player gets hit. Which line makes it 0?", "lives vale 1 y golpean al jugador. ¿Qué línea lo deja en 0?"),
      options: [T("lives += 1", "lives += 1"), T("lives == 0", "lives == 0"), T("lives -= 1", "lives -= 1")], answer: 2,
      why: T("-= 1 takes one away. == only asks a question; it doesn't change anything.", "-= 1 resta uno. == solo hace una pregunta; no cambia nada.") },
  ],

  l6: [
    { title: T("Why functions?", "¿Por qué funciones?"),
      body: T("If you copy the same lines over and over, a bug has to be fixed in every copy. Put the job in a FUNCTION once, then CALL it by name whenever you need it.",
        "Si copias las mismas líneas una y otra vez, un error se tiene que arreglar en cada copia. Pon la tarea en una FUNCIÓN una vez y LLÁMALA por su nombre cuando la necesites.") },
    { title: T("Parameters: inputs", "Parámetros: entradas"),
      body: T("PARAMETERS go inside the ( ) of def. They're like blanks to fill in. When you call the function, the values you pass fill the blanks.",
        "Los PARÁMETROS van dentro de los ( ) de def. Son como espacios en blanco para llenar. Cuando llamas la función, los valores que pasas llenan los espacios."),
      code: T('def make_enemy(x, y):\n    e = Sprite("slime", x=x, y=y)\n    enemies.append(e)\n\nmake_enemy(100, 50)     # call it\nmake_enemy(300, 50)     # and again!',
        'def make_enemy(x, y):\n    e = Sprite("slime", x=x, y=y)\n    enemies.append(e)\n\nmake_enemy(100, 50)     # llámala\nmake_enemy(300, 50)     # ¡y otra vez!'),
      pic: "machine" },
    { title: T("return: an answer back", "return: devolver una respuesta"),
      body: T("return sends a value back to whoever called the function. Then you can store it in a variable or use it in an if.",
        "return manda un valor de regreso a quien llamó la función. Luego puedes guardarlo en una variable o usarlo en un if."),
      code: "def double(n):\n    return n * 2\n\npoints = double(5)    # points is 10" },
    { quiz: true,
      title: T("Quick check", "Repaso rápido"),
      q: T("def grow(size): ... When you write grow(3), what is size?", "def grow(size): ... Cuando escribes grow(3), ¿qué vale size?"),
      options: [T("3", "3"), T("size", "size"), T("Nothing yet", "Nada todavía")], answer: 0,
      why: T("The value you pass in the call (3) fills the parameter (size).", "El valor que pasas en la llamada (3) llena el parámetro (size).") },
  ],

  boss: [
    { concept: "debugging", title: T("What is a bug?", "¿Qué es un bicho (bug)?"),
      body: T("A BUG is a mistake in code. Every programmer makes them, every day. Finding and fixing them is called DEBUGGING, and it's a real skill you can get good at.",
        "Un BUG (bicho) es un error en el código. Todos los programadores los cometen, todos los días. Encontrarlos y arreglarlos se llama DEPURAR, y es una habilidad real en la que puedes mejorar.") },
    { title: T("Error messages are clues", "Los mensajes de error son pistas"),
      body: T("When Python stops, it tells you the LINE number and what went wrong. Go to that line first. The real mistake is usually there or just above it.",
        "Cuando Python se detiene, te dice el número de LÍNEA y qué salió mal. Ve primero a esa línea. El error real casi siempre está ahí o justo arriba."),
      code: T("# Oops! Line 4: missing a colon :\n# Oops! Line 7: Python doesn't know 'scroe'", "# ¡Uy! Línea 4: faltan los dos puntos :\n# ¡Uy! Línea 7: Python no conoce 'scroe'") },
    { title: T("Three kinds of bugs", "Tres tipos de bichos"),
      body: T("SYNTAX bugs: typos Python can't read (missing : or quotes). NAME bugs: a misspelled variable. LOGIC bugs: the code runs but does the wrong thing — these give no error, so you have to test and watch.",
        "Bichos de SINTAXIS: errores de escritura que Python no puede leer (faltan : o comillas). Bichos de NOMBRE: una variable mal escrita. Bichos de LÓGICA: el código corre pero hace algo incorrecto; estos no dan error, así que tienes que probar y observar.") },
    { title: T("A debugging plan", "Un plan para depurar"),
      body: T("1. Run it. 2. Read the message or watch what's wrong. 3. Guess why. 4. Change ONE thing. 5. Run again. Add print() to peek at a variable's value.",
        "1. Ejecútalo. 2. Lee el mensaje u observa qué está mal. 3. Adivina por qué. 4. Cambia UNA cosa. 5. Ejecuta otra vez. Agrega print() para ver el valor de una variable."),
      code: "print(player.x, score)    # peek inside!" },
    { quiz: true,
      title: T("Quick check", "Repaso rápido"),
      q: T("The game runs with no error, but the score never goes up. What kind of bug is it?", "El juego corre sin error, pero el puntaje nunca sube. ¿Qué tipo de bicho es?"),
      options: [T("Syntax", "Sintaxis"), T("Logic", "Lógica"), T("No bug", "No hay bicho")], answer: 1,
      why: T("The code runs fine but does the wrong thing — that's a logic bug.", "El código corre bien pero hace algo incorrecto: es un bicho de lógica.") },
  ],

  mygame: [
    { title: T("A way to win", "Una forma de ganar"),
      body: T("A great game has a goal. Use an if to check when the player has won — like collecting every coin — and end the game with a happy message.",
        "Un gran juego tiene una meta. Usa un if para revisar cuándo ganó el jugador, como juntar todas las monedas, y termina el juego con un mensaje alegre."),
      code: 'if score >= 10:\n    play("win")\n    game_over("You win!")' },
    { title: T("Make it yours", "Hazlo tuyo"),
      body: T("Change colors with background(), add sound with play() and music(), pick new sprites, or add a new enemy or power-up. Small touches make a game feel like yours.",
        "Cambia colores con background(), agrega sonido con play() y music(), elige sprites nuevos o agrega un enemigo o poder nuevo. Los pequeños detalles hacen que un juego se sienta tuyo."),
      code: T('background("#1d0f2b")\nmusic("fast")\nplay("zap")', 'background("#1d0f2b")\nmusic("fast")\nplay("zap")') },
    { title: T("Playtest", "Prueba con alguien"),
      body: T("Programmers test their work with real players. Ask a friend to play without helping them. Watch where they get stuck, then fix it. Testing is part of the design process.",
        "Los programadores prueban su trabajo con jugadores reales. Pide a un amigo que juegue sin ayudarle. Observa dónde se atora y arréglalo. Probar es parte del proceso de diseño.") },
    { title: T("Publish", "Publicar"),
      body: T("When you're proud of it, give it a title and publish it to the class arcade so classmates can play. You can still keep improving it after.",
        "Cuando estés orgulloso, ponle título y publícalo en el arcade de la clase para que tus compañeros lo jueguen. Puedes seguir mejorándolo después.") },
    { quiz: true,
      title: T("Quick check", "Repaso rápido"),
      q: T("Your friend keeps falling at the same spot. What's the best next step?", "Tu amigo se cae siempre en el mismo lugar. ¿Qué es lo mejor que puedes hacer?"),
      options: [T("Tell them to try harder", "Decirle que se esfuerce más"), T("Change that part and test again", "Cambiar esa parte y probar otra vez"), T("Publish it anyway", "Publicarlo de todos modos")], answer: 1,
      why: T("Playtesting shows you what to fix. Change it, then test again.", "Las pruebas te muestran qué arreglar. Cámbialo y prueba otra vez.") },
  ],
};

// ---------- concept introductions ----------
// One card per concept. Every level's deck starts with an overview of the concepts it uses, then a card for
// each one (unless the level's own slides already teach it), so students meet the idea every time it comes up.
// Students can also tap a concept chip on the level page to see its card on its own.
export const CONCEPT_CARDS = {
  variables: {
    pic: "box",
    short: T("Named boxes that hold values, like score or speed.", "Cajas con nombre que guardan valores, como score o speed."),
    body: T("A VARIABLE is a named box that holds a value. Make one with a name, =, and a value. Use the name to read it, and change it any time. Games are full of them: speed, score, lives, x and y.",
      "Una VARIABLE es una caja con nombre que guarda un valor. Créala con un nombre, = y un valor. Usa el nombre para leerla y cámbiala cuando quieras. Los juegos están llenos de ellas: speed, score, lives, x e y."),
    code: T("score = 0       # make it\nscore += 1      # change it\nprint(score)    # use it: shows 1", "score = 0       # créala\nscore += 1      # cámbiala\nprint(score)    # úsala: muestra 1"),
  },
  conditionals: {
    pic: "fork",
    short: T("if / else: let the game make decisions.", "if / else: deja que el juego tome decisiones."),
    body: T("A CONDITIONAL lets your game make a decision. if checks a question that is True or False. When it's True, the indented lines run; else runs when it's False. Events like key presses and crashes are checked with if.",
      "Un CONDICIONAL deja que tu juego tome una decisión. if revisa una pregunta que es True o False. Cuando es True, se ejecutan las líneas con sangría; else se ejecuta cuando es False. Los eventos como teclas y choques se revisan con if."),
    code: T('if key_down("right"):\n    player.x += 4\nelse:\n    player.x += 0', 'if key_down("right"):\n    player.x += 4\nelse:\n    player.x += 0'),
  },
  loops: {
    pic: "loop",
    short: T("Repeat code: the game loop and for loops.", "Repetir código: el ciclo del juego y los bucles for."),
    body: T("A LOOP repeats code so you don't have to write it again and again. Your game has two kinds: the GAME LOOP (@every_frame runs 60 times a second) and the FOR LOOP (do the same job for each item in a list).",
      "Un BUCLE repite código para que no tengas que escribirlo una y otra vez. Tu juego tiene dos tipos: el CICLO DEL JUEGO (@every_frame se ejecuta 60 veces por segundo) y el BUCLE FOR (hace la misma tarea con cada elemento de una lista)."),
    code: T("for e in enemies:     # each enemy...\n    e.y += 2          # ...moves down", "for e in enemies:     # cada enemigo...\n    e.y += 2          # ...baja"),
  },
  lists: {
    pic: "list",
    short: T("Many things in one variable, inside [ ].", "Muchas cosas en una variable, dentro de [ ]."),
    body: T("A LIST holds many values in one variable, inside square brackets [ ]. .append() adds one more to the end. Lists keep track of every coin, brick, enemy or laser in your game.",
      "Una LISTA guarda muchos valores en una variable, dentro de corchetes [ ]. .append() agrega uno más al final. Las listas llevan la cuenta de cada moneda, ladrillo, enemigo o láser de tu juego."),
    code: 'coins = []\ncoins.append(Sprite("coin", x=100, y=200))\nprint(len(coins))   # 1',
  },
  functions: {
    pic: "machine",
    short: T("A named job you write once and use again.", "Una tarea con nombre que escribes una vez y reutilizas."),
    body: T("A FUNCTION is a named job. Write it once with def, and the indented lines belong to it. Then CALL it by name to run it — as many times as you like. Parameters in ( ) let you pass it inputs.",
      "Una FUNCIÓN es una tarea con nombre. Escríbela una vez con def, y las líneas con sangría le pertenecen. Luego LLÁMALA por su nombre para ejecutarla, cuantas veces quieras. Los parámetros en ( ) te dejan darle entradas."),
    code: T('def cheer(name):\n    print("Go, " + name + "!")\n\ncheer("Maya")    # Go, Maya!\ncheer("Leo")     # Go, Leo!', 'def cheer(name):\n    print("¡Vamos, " + name + "!")\n\ncheer("Maya")    # ¡Vamos, Maya!\ncheer("Leo")     # ¡Vamos, Leo!'),
  },
  debugging: {
    short: T("Finding and fixing mistakes in code.", "Encontrar y arreglar errores en el código."),
    body: T("DEBUGGING means finding and fixing mistakes (bugs). Read the error message and go to its line number. If there's no error but the game acts wrong, change one thing at a time and test again. print() lets you peek at values.",
      "DEPURAR significa encontrar y arreglar errores (bugs). Lee el mensaje de error y ve al número de línea. Si no hay error pero el juego hace algo raro, cambia una cosa a la vez y prueba otra vez. print() te deja ver los valores."),
    code: T("print(player.x, score)    # peek inside!", "print(player.x, score)    # ¡mira adentro!"),
  },
};

// Which concepts each level uses (what students will actually type or read in that level's code).
export const USES = {
  l1: ["variables"],
  l2: ["variables", "functions", "loops"],
  l3: ["conditionals", "variables"],
  l4: ["lists", "loops"],
  l5: ["conditionals", "loops", "variables", "lists"],
  side1: ["variables", "conditionals"],
  l6: ["functions", "lists", "loops"],
  boss: ["debugging", "variables", "conditionals", "loops"],
  mygame: ["conditionals", "functions", "loops", "lists", "variables"],
};

// A single concept card as a slide.
export const conceptSlide = (cid, names) => ({ ...CONCEPT_CARDS[cid], conceptCard: cid, title: names[cid] });

// The full deck for a level: overview → a card per concept it uses (skipping any its own slides teach) → its own slides.
export function deckFor(id, names) {
  const own = SLIDES[id] || [];
  const uses = USES[id] || [];
  if (!uses.length) return own;
  const taught = new Set(own.map((s) => s.concept).filter(Boolean));
  return [
    { overview: uses, title: T("Concepts in this level", "Conceptos de este nivel") },
    ...uses.filter((c) => !taught.has(c)).map((c) => conceptSlide(c, names)),
    ...own,
  ];
}

// Small pictures for some slides. They use the page's colours so they match every world skin.
const W = 'xmlns="http://www.w3.org/2000/svg" role="img"';
export const PICS = {
  box: (lang) => `<svg ${W} viewBox="0 0 300 120" aria-label="${lang === "es" ? "Una caja llamada speed que guarda 4" : "A box labelled speed holding 4"}">
    <rect x="90" y="30" width="120" height="70" rx="10" fill="var(--panel2)" stroke="var(--support)" stroke-width="3"/>
    <rect x="110" y="12" width="80" height="28" rx="6" fill="var(--gold)"/><text x="150" y="32" text-anchor="middle" font-weight="800" fill="#3a2a00" font-size="16">speed</text>
    <text x="150" y="80" text-anchor="middle" font-size="34" font-weight="800" fill="var(--ink)">4</text></svg>`,
  fork: (lang) => `<svg ${W} viewBox="0 0 300 150" aria-label="${lang === "es" ? "Una pregunta con dos caminos: True y False" : "A question with two paths: True and False"}">
    <rect x="95" y="10" width="110" height="38" rx="10" fill="var(--panel2)" stroke="var(--gold)" stroke-width="3"/><text x="150" y="35" text-anchor="middle" font-weight="800" fill="var(--ink)" font-size="15">if ... ?</text>
    <path d="M130 50 L70 100 M170 50 L230 100" stroke="var(--line)" stroke-width="4"/>
    <rect x="20" y="100" width="100" height="36" rx="10" fill="color-mix(in srgb, var(--good) 30%, var(--panel))"/><text x="70" y="124" text-anchor="middle" font-weight="800" fill="var(--good)" font-size="15">True → run</text>
    <rect x="180" y="100" width="100" height="36" rx="10" fill="color-mix(in srgb, var(--bad) 30%, var(--panel))"/><text x="230" y="124" text-anchor="middle" font-weight="800" fill="var(--bad)" font-size="15">${lang === "es" ? "False → salta" : "False → skip"}</text></svg>`,
  grid: (lang) => `<svg ${W} viewBox="0 0 300 250" aria-label="${lang === "es" ? "La pantalla: x crece a la derecha, y crece hacia abajo" : "The screen: x grows to the right, y grows downward"}">
    <rect x="50" y="30" width="200" height="200" fill="var(--panel2)" stroke="var(--line)" stroke-width="2"/>
    ${[1, 2, 3].map((i) => `<line x1="${50 + i * 50}" y1="30" x2="${50 + i * 50}" y2="230" stroke="var(--line)"/><line x1="50" y1="${30 + i * 50}" x2="250" y2="${30 + i * 50}" stroke="var(--line)"/>`).join("")}
    <text x="44" y="24" font-size="13" fill="var(--muted)" text-anchor="end">0,0</text><text x="254" y="24" font-size="13" fill="var(--muted)">400</text><text x="44" y="236" font-size="13" fill="var(--muted)" text-anchor="end">400</text>
    <path d="M60 18 H230" stroke="var(--gold)" stroke-width="3" marker-end="url(#ah)"/><text x="150" y="14" font-weight="800" fill="var(--gold)" text-anchor="middle">x →</text>
    <path d="M30 40 V210" stroke="var(--support)" stroke-width="3" marker-end="url(#ah2)"/><text x="18" y="130" font-weight="800" fill="var(--support)" text-anchor="middle">y</text><text x="18" y="148" font-weight="800" fill="var(--support)" text-anchor="middle">↓</text>
    <circle cx="80" cy="180" r="9" fill="var(--accent)"/><text x="94" y="185" font-size="13" fill="var(--ink)">x=60, y=300</text>
    <defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--gold)"/></marker>
    <marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--support)"/></marker></defs></svg>`,
  loop: (lang) => {
    const s = lang === "es" ? ["Revisar teclas", "Mover cosas", "Revisar choques", "Dibujar"] : ["Check keys", "Move things", "Check hits", "Draw"];
    const pos = [[150, 30], [260, 110], [150, 190], [40, 110]];
    return `<svg ${W} viewBox="-20 0 340 220" aria-label="${lang === "es" ? "El ciclo del juego: " : "The game loop: "}${s.join(", ")}">
      <circle cx="150" cy="110" r="78" fill="none" stroke="var(--support)" stroke-width="3" stroke-dasharray="8 6"/>
      <text x="150" y="106" text-anchor="middle" font-weight="800" fill="var(--gold)" font-size="15">60×</text><text x="150" y="124" text-anchor="middle" fill="var(--muted)" font-size="12">${lang === "es" ? "por segundo" : "per second"}</text>
      ${s.map((w, i) => `<g><rect x="${pos[i][0] - 52}" y="${pos[i][1] - 15}" width="104" height="30" rx="8" fill="var(--panel2)" stroke="var(--line)"/><text x="${pos[i][0]}" y="${pos[i][1] + 5}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">${i + 1}. ${w}</text></g>`).join("")}</svg>`;
  },
  keys: (lang) => `<svg ${W} viewBox="0 0 300 110" aria-label="${lang === "es" ? "Teclas de flecha y espacio" : "Arrow keys and space bar"}">
    ${[["◀", 60, 50], ["▲", 110, 10], ["▼", 110, 50], ["▶", 160, 50]].map(([k, x, y]) => `<rect x="${x}" y="${y}" width="44" height="36" rx="7" fill="var(--panel2)" stroke="var(--support)" stroke-width="2"/><text x="${x + 22}" y="${y + 24}" text-anchor="middle" fill="var(--ink)" font-size="16">${k}</text>`).join("")}
    <rect x="215" y="50" width="70" height="36" rx="7" fill="var(--panel2)" stroke="var(--gold)" stroke-width="2"/><text x="250" y="73" text-anchor="middle" fill="var(--ink)" font-size="13" font-weight="700">${lang === "es" ? "espacio" : "space"}</text></svg>`,
  list: (lang) => `<svg ${W} viewBox="0 0 320 100" aria-label="${lang === "es" ? "Una lista con tres elementos, numerados 0, 1 y 2" : "A list with three items, numbered 0, 1 and 2"}">
    <text x="10" y="58" font-weight="800" fill="var(--gold)" font-size="16">colors =</text>
    ${["red", "blue", "gold"].map((c, i) => `<rect x="${95 + i * 72}" y="30" width="66" height="42" rx="7" fill="var(--panel2)" stroke="var(--support)" stroke-width="2"/><text x="${128 + i * 72}" y="56" text-anchor="middle" fill="var(--ink)" font-size="14">"${c}"</text><text x="${128 + i * 72}" y="92" text-anchor="middle" fill="var(--muted)" font-size="12">${i}</text>`).join("")}</svg>`,
  touch: (lang) => `<svg ${W} viewBox="0 0 300 110" aria-label="${lang === "es" ? "Dos cajas encimadas: touching es True" : "Two overlapping boxes: touching is True"}">
    <rect x="70" y="20" width="70" height="70" rx="6" fill="var(--support)" opacity=".75"/><rect x="115" y="40" width="50" height="50" rx="25" fill="var(--gold)" opacity=".85"/>
    <text x="230" y="62" text-anchor="middle" font-weight="800" fill="var(--good)" font-size="20">True</text></svg>`,
  machine: (lang) => `<svg ${W} viewBox="0 0 320 110" aria-label="${lang === "es" ? "Valores entran a la función make_enemy y sale un enemigo" : "Values go into the make_enemy function and an enemy comes out"}">
    <text x="10" y="60" fill="var(--gold)" font-weight="800" font-size="15">100, 50 →</text>
    <rect x="100" y="25" width="130" height="60" rx="12" fill="var(--panel2)" stroke="var(--support)" stroke-width="3"/><text x="165" y="60" text-anchor="middle" fill="var(--ink)" font-weight="800" font-size="14">make_enemy</text>
    <text x="242" y="60" fill="var(--good)" font-weight="800" font-size="15">→ 👾</text></svg>`,
};
