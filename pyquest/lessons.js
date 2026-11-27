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
    title: T("Side Quest", "Misión extra"), csta: ["MS-PRO-RD-17"],
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
