// Level information shared by every game type: the guide's story, the standards, and generic titles
// (used on the map before a student has picked a game type). Each game type's own code, goals,
// checks and hints live in games.js. Standards: 2026 CSTA PK-12 middle school codes (July 2026).

const T = (en, es) => ({ en, es });

export const LEVELS = {
  l1: {
    title: T("Setup", "Preparación"), csta: ["MS-PRO-VD-16"],
    story: T("Welcome, game maker! Every game you've ever played is made of code. Pick the kind of game you want to build, give it a name, and set your first variables.",
      "¡Bienvenido, creador de juegos! Todos los juegos están hechos de código. Elige el tipo de juego que quieres crear, ponle nombre y define tus primeras variables."),
  },
  l2: {
    title: T("The Game Loop", "El ciclo del juego"), csta: ["MS-PRO-VD-16", "MS-PRO-RD-17"],
    story: T("Games redraw the screen about 60 times a second. A function tagged @every_frame runs every single time: that's the game loop. Use it to bring your game to life.",
      "Los juegos dibujan la pantalla unas 60 veces por segundo. Una función con @every_frame se ejecuta cada vez: ese es el ciclo del juego. Úsalo para dar vida a tu juego."),
  },
  l3: {
    title: T("Controls", "Controles"), csta: ["MS-PRO-RD-17"],
    story: T("Pressing a key is an EVENT. An if statement lets your game decide what to do when it happens. Give your player control!",
      "Presionar una tecla es un EVENTO. Un if deja que tu juego decida qué hacer cuando pasa. ¡Dale el control a tu jugador!"),
  },
  l4: {
    title: T("Lots of Things", "Muchas cosas"), csta: ["MS-PRO-RD-17", "MS-PRO-VD-16"],
    story: T("One thing is boring. Lots is a party! A LIST holds many things in one variable, and a FOR LOOP does the same job for each one. That's how real games handle every enemy, brick and platform.",
      "Una cosa es aburrida. ¡Muchas son una fiesta! Una LISTA guarda muchas cosas en una variable, y un BUCLE FOR hace lo mismo con cada una. Así manejan los juegos cada enemigo, ladrillo y plataforma."),
  },
  l5: {
    title: T("Collisions", "Choques"), csta: ["MS-ALG-PS-01", "MS-ALG-PS-03"],
    story: T("Time to make it a real game. touching() answers True or False, which is perfect for an if, and a score keeps track of how well you're doing.",
      "Es hora de hacerlo un juego de verdad. touching() responde True o False, perfecto para un if, y el puntaje lleva la cuenta de qué tan bien vas."),
  },
  side1: {
    title: T("Lives", "Vidas"), csta: ["MS-PRO-RD-17"],
    story: T("Bonus mission for speedy coders! Add danger with lives, and end the game when they run out.",
      "¡Misión extra para los rápidos! Agrega peligro con vidas y termina el juego cuando se acaben."),
  },
  l6: {
    title: T("Functions", "Funciones"), csta: ["MS-PRO-PD-12"],
    story: T("Programmers hate repeating themselves. Package a job into a FUNCTION with PARAMETERS (inputs), then use it again and again.",
      "A los programadores no les gusta repetirse. Pon una tarea en una FUNCIÓN con PARÁMETROS (entradas) y úsala una y otra vez."),
  },
  boss: {
    title: T("Boss: The Bug Beast", "Jefe: La Bestia de Bichos"), csta: ["MS-PRO-TR-19"], bugs: 4,
    story: T("The Bug Beast broke a game just like yours! It hid 4 bugs in the code. Every bug you fix knocks off a chunk of its health. Error messages are clues.",
      "¡La Bestia de Bichos rompió un juego como el tuyo! Escondió 4 errores en el código. Cada error que arreglas le quita vida. Los mensajes de error son pistas."),
    goals: {
      en: ["Make the code run.", "Fix the movement bug.", "Make the score go up.", "Show the score on screen."],
      es: ["Haz que el código funcione.", "Arregla el error de movimiento.", "Haz que el puntaje suba.", "Muestra el puntaje en pantalla."],
    },
  },
  q1: {
    title: T("Style Studio", "Estudio de estilo"), csta: ["MS-PRO-VD-16"],
    story: T("Side quest! Make the game feel like YOURS: sign it with your name and pick its music.",
      "¡Misión extra! Haz que el juego se sienta TUYO: fírmalo con tu nombre y elige su música."),
  },
  q2: {
    title: T("Moving Scenery", "Paisaje en movimiento"), csta: ["MS-PRO-RD-17"],
    story: T("Side quest! A loop can build scenery, and another loop can make it drift by. Instant motion!",
      "¡Misión extra! Un bucle puede construir el paisaje, y otro puede hacer que se mueva. ¡Movimiento al instante!"),
  },
  boss1: {
    title: T("Boss: Bug Beast Jr.", "Jefe: Bestia de Bichos Jr."), csta: ["MS-PRO-TR-19"], bugs: 4,
    story: T("The Bug Beast's little cousin broke a tiny game! It hid 4 bugs. Read every error message: they tell you the line.",
      "¡El primito de la Bestia rompió un juego pequeño! Escondió 4 bichos. Lee cada mensaje de error: te dice la línea."),
    goals: {
      en: ["Make the code run.", "Fix the right arrow.", "Fix the up arrow.", "Make the title show without crashing."],
      es: ["Haz que el código funcione.", "Arregla la flecha derecha.", "Arregla la flecha arriba.", "Haz que el título se muestre sin fallar."],
    },
  },
  l7: {
    title: T("Lucky Star", "Estrella de la suerte"), csta: ["MS-PRO-VD-16", "MS-ALG-PS-03"],
    story: T("Games feel fresh when things surprise you. random.randint() rolls a dice for you, so the star can appear anywhere.",
      "Los juegos se sienten nuevos cuando hay sorpresas. random.randint() tira un dado por ti, así la estrella puede aparecer en cualquier lugar."),
  },
  l8: {
    title: T("Clock", "Reloj"), csta: ["MS-PRO-VD-16"],
    story: T("Your game runs 60 frames a second, so counting frames is a clock! Two math tools help: // for whole numbers and % for remainders.",
      "Tu juego corre a 60 cuadros por segundo, ¡así que contar cuadros es un reloj! Dos herramientas ayudan: // para enteros y % para residuos."),
  },
  q4: {
    title: T("Beat the Clock", "Contra reloj"), csta: ["MS-PRO-RD-17"],
    story: T("Side quest! Add a time limit. When the clock runs out, it's game over.",
      "¡Misión extra! Agrega un límite de tiempo. Cuando se acabe el reloj, termina el juego."),
  },
  l9: {
    title: T("Name Tag", "Etiqueta de nombre"), csta: ["MS-PRO-VD-16"],
    story: T("Text in code is called a STRING. Strings have superpowers like .upper(), and f-strings drop variables right into your text.",
      "El texto en el código se llama STRING. Los strings tienen superpoderes como .upper(), y los f-strings meten variables en tu texto."),
  },
  l10: {
    title: T("Safe Spawn", "Aparición segura"), csta: ["MS-PRO-RD-17"],
    story: T("A for loop repeats a set number of times. A WHILE loop repeats until something is true, like 'keep picking until the star is far enough away'.",
      "Un bucle for se repite un número fijo de veces. Un bucle WHILE se repite hasta que algo se cumple, como 'sigue eligiendo hasta que la estrella esté lejos'."),
  },
  q5: {
    title: T("Gem Shower", "Lluvia de gemas"), csta: ["MS-PRO-RD-17"],
    story: T("Side quest! Use a while loop to fill the screen with gems, then collect them all.",
      "¡Misión extra! Usa un bucle while para llenar la pantalla de gemas y luego júntalas todas."),
  },
  l11: {
    title: T("Stages", "Etapas"), csta: ["MS-PRO-VD-16", "MS-PRO-RD-17"],
    story: T("Every 10 points, your game reaches a new stage and changes colour. A little math (score // 10) tells you which stage you're on.",
      "Cada 10 puntos tu juego llega a una nueva etapa y cambia de color. Un poco de matemáticas (score // 10) te dice en qué etapa estás."),
  },
  l12: {
    title: T("Power-Up", "Poder especial"), csta: ["MS-PRO-RD-17"],
    story: T("Grab the heart for 5 seconds of double points! A TIMER is just a number that counts down every frame.",
      "¡Agarra el corazón para tener puntos dobles por 5 segundos! Un TEMPORIZADOR es solo un número que baja en cada cuadro."),
  },
  q6: {
    title: T("Pop-Up Messages", "Mensajes emergentes"), csta: ["MS-PRO-PD-12"],
    story: T("Side quest! Build a say() function that pops a message on screen for 2 seconds.",
      "¡Misión extra! Crea una función say() que muestre un mensaje en pantalla por 2 segundos."),
  },
  boss3: {
    title: T("Boss: Glitch Ghost", "Jefe: Fantasma Glitch"), csta: ["MS-PRO-TR-19"], bugs: 4,
    story: T("The Glitch Ghost scrambled the strings and the math! Look for a missing quote, backwards numbers, a missing f, and the wrong kind of division.",
      "¡El Fantasma Glitch revolvió los strings y las matemáticas! Busca una comilla que falta, números al revés, una f que falta y la división equivocada."),
    goals: {
      en: ["Make the code run.", "Fix the random spot.", "Show the real score (not {score}).", "Show whole seconds on the clock."],
      es: ["Haz que el código funcione.", "Arregla el lugar al azar.", "Muestra el puntaje real (no {score}).", "Muestra segundos enteros en el reloj."],
    },
  },
  l13: {
    title: T("Points Table", "Tabla de puntos"), csta: ["MS-PRO-VD-16"],
    story: T("Welcome to the Data Dungeon! A DICTIONARY is like a menu: look up a name, get its value. Keep all your point values in one place.",
      "¡Bienvenido al Calabozo de datos! Un DICCIONARIO es como un menú: buscas un nombre y obtienes su valor. Guarda todos tus puntos en un solo lugar."),
  },
  l14: {
    title: T("Foe Types", "Tipos de enemigos"), csta: ["MS-PRO-VD-16", "MS-PRO-PD-12"],
    story: T("Time for enemies! A dictionary tells each kind of foe how fast to move, and one function spawns them all.",
      "¡Hora de enemigos! Un diccionario le dice a cada tipo de enemigo qué tan rápido moverse, y una función los crea a todos."),
  },
  q7: {
    title: T("Angry Foes", "Enemigos enojados"), csta: ["MS-PRO-RD-17"],
    story: T("Side quest! Every 10 seconds the foes get a little faster. Can you keep up?",
      "¡Misión extra! Cada 10 segundos los enemigos se vuelven un poco más rápidos. ¿Puedes seguirles el ritmo?"),
  },
  l15: {
    title: T("Difficulty", "Dificultad"), csta: ["MS-PRO-VD-16"],
    story: T("Easy or hard? Dictionaries can hold other dictionaries, so each mode can keep its own settings. Change one word to switch modes.",
      "¿Fácil o difícil? Los diccionarios pueden guardar otros diccionarios, así cada modo tiene sus ajustes. Cambia una palabra para cambiar de modo."),
  },
  l16: {
    title: T("Collection Log", "Registro de colección"), csta: ["MS-PRO-VD-16", "MS-PRO-RD-17"],
    story: T("Keep count of everything you catch in a dictionary, then loop over it with .items() to show the whole log.",
      "Lleva la cuenta de todo lo que atrapas en un diccionario y luego recórrelo con .items() para mostrar todo el registro."),
  },
  q8: {
    title: T("Achievements", "Logros"), csta: ["MS-PRO-VD-16"],
    story: T("Side quest! Add in-game achievements that unlock when you hit goals, just like real games.",
      "¡Misión extra! Agrega logros dentro del juego que se desbloquean al cumplir metas, como en los juegos de verdad."),
  },
  boss4: {
    title: T("Boss: The Key Keeper", "Jefe: El Guardián de Llaves"), csta: ["MS-PRO-TR-19"], bugs: 4,
    story: T("The Key Keeper locked up the dictionaries! Every bug is about how dictionaries are written or used.",
      "¡El Guardián de Llaves cerró los diccionarios! Cada bicho tiene que ver con cómo se escriben o usan los diccionarios."),
    goals: {
      en: ["Make the code run.", "Look up a value the right way.", "Catch the gem without crashing.", "Show the collection log."],
      es: ["Haz que el código funcione.", "Busca un valor de la forma correcta.", "Atrapa la gema sin que falle.", "Muestra el registro de colección."],
    },
  },
  l17: {
    title: T("Juice It Up", "Dale vida"), csta: ["MS-PRO-VD-16"],
    story: T("Final world! Game designers call little bounces and pulses JUICE. Repeating math (% and //) makes things wobble forever.",
      "¡Último mundo! Los diseñadores llaman VIDA a los rebotes y pulsos pequeños. Las matemáticas que se repiten (% y //) hacen que las cosas se muevan para siempre."),
  },
  l18: {
    title: T("Wave Attack", "Ataque en oleada"), csta: ["MS-PRO-VD-16", "MS-PRO-RD-17"],
    story: T("At stage 3, a whole wave of foes attacks! The wave is a LIST of DICTIONARIES: each one describes a foe.",
      "¡En la etapa 3 ataca toda una oleada! La oleada es una LISTA de DICCIONARIOS: cada uno describe a un enemigo."),
  },
  q9: {
    title: T("Sparkle Burst", "Explosión de chispas"), csta: ["MS-PRO-PD-12"],
    story: T("Side quest! Make sparks fly in random directions whenever you catch the star.",
      "¡Misión extra! Haz que salgan chispas en direcciones al azar cada vez que atrapes la estrella."),
  },
  l19: {
    title: T("Smart Foes", "Enemigos listos"), csta: ["MS-ALG-PS-01", "MS-PRO-RD-17"],
    story: T("Make your foes smarter: when you get close, they chase you! Just a few ifs make a simple game AI.",
      "Haz tus enemigos más listos: ¡cuando te acercas, te persiguen! Unos cuantos if hacen una IA de juego sencilla."),
  },
  l20: {
    title: T("Hall of Fame", "Salón de la fama"), csta: ["MS-ALG-PS-01", "MS-ALG-PS-03"],
    story: T("Who has the high score? Finding the biggest number in a list is a classic ALGORITHM: check each one and remember the best so far.",
      "¿Quién tiene el récord? Encontrar el número más grande de una lista es un ALGORITMO clásico: revisa cada uno y recuerda el mejor hasta ahora."),
  },
  q10: {
    title: T("Secret Code", "Código secreto"), csta: ["MS-PRO-VD-16"],
    story: T("Side quest! Hide a secret cheat code in your game. Strings remember the keys you press.",
      "¡Misión extra! Esconde un código secreto en tu juego. Los strings recuerdan las teclas que presionas."),
  },
  boss5: {
    title: T("Boss: Bug Beast King", "Jefe: Rey Bestia de Bichos"), csta: ["MS-PRO-TR-19"], bugs: 4,
    story: T("The Bug Beast King is the final boss! It mixes every kind of bug you've seen. Beat it to unlock Polish & Publish.",
      "¡El Rey Bestia de Bichos es el jefe final! Mezcla todos los tipos de bichos que has visto. Véncelo para abrir Pulir y publicar."),
    goals: {
      en: ["Make the code run.", "Make all 5 foes appear.", "Stop the never-ending while loop.", "Let stomp() change the score."],
      es: ["Haz que el código funcione.", "Haz que aparezcan los 5 enemigos.", "Detén el bucle while que nunca termina.", "Deja que stomp() cambie el puntaje."],
    },
  },
  mygame: {
    title: T("Polish & Publish", "Pulir y publicar"), csta: ["MS-PRO-TR-20", "MS-PRO-PD-14"],
    story: T("Your game is almost done. Give it a way to win, add something that's yours, test it with a friend, and publish it to the class arcade!",
      "Tu juego casi está listo. Dale una forma de ganar, agrega algo tuyo, pruébalo con un amigo y ¡publícalo en el arcade de la clase!"),
  },
};

// Snippets for the tap-to-insert helper bar (great on iPads).
export const SNIPPETS = [
  { label: "if", code: "if :\n    " }, { label: "else", code: "else:\n    " },
  { label: "for", code: "for item in items:\n    " }, { label: "def", code: "def name():\n    " },
  { label: "@every_frame", code: "@every_frame\ndef name():\n    " },
  { label: "print()", code: "print()" }, { label: "key_down()", code: 'key_down("right")' },
  { label: "key_pressed()", code: 'key_pressed("space")' }, { label: "touching()", code: "player.touching()" },
  { label: "text()", code: 'text("", 10, 28)' }, { label: "play()", code: 'play("coin")' },
  { label: "+= 1", code: " += 1" }, { label: "==", code: " == " }, { label: ":", code: ":" },
  { label: "( )", code: "()" }, { label: "[ ]", code: "[]" }, { label: '" "', code: '""' }, { label: "⇥ tab", code: "    " },
];
