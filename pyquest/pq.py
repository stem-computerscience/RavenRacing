# pq — the tiny game library students import with `from pq import *`.
# Runs inside Pyodide in a sandboxed frame; also runs under normal CPython for tests.
import sys, random, math, difflib, json, builtins

WIDTH = 400
HEIGHT = 400

_things = []      # every Sprite and Box, in the order they were made
_hooks = []       # functions tagged with @every_frame, in the order they were defined
_texts = []
_keys = set()     # keys held right now
_tapped = set()   # keys that went down since the last frame (so quick taps aren't missed)
_prev = set()     # keys held last frame
_pressed = set()  # keys that went down this frame
_sounds = []
_out = []
_state = {"bg": "#0b2230", "over": None, "music": None, "source": ""}


class _Thing:
    """Shared by Sprite and Box: position, speed, showing/hiding and touching."""
    vx = 0
    vy = 0
    grounded = False

    def touching(self, other):
        if not (self.visible and other.visible):
            return False
        return (abs(self.x - other.x) < (self.w + other.w) / 2 and
                abs(self.y - other.y) < (self.h + other.h) / 2)

    def move(self, dx=0, dy=0):
        self.x += dx
        self.y += dy

    def hide(self):
        self.visible = False

    def show(self):
        self.visible = True


class Sprite(_Thing):
    """A picture in your game. Move it by changing .x and .y (the centre of the picture)."""

    def __init__(self, name="star", x=200, y=200, size=1):
        self.name = str(name)
        self.x = x
        self.y = y
        self.size = size
        self.visible = True
        _things.append(self)

    @property
    def w(self):          # touching uses a slightly smaller box, so it feels fair
        return 26 * self.size

    h = w

    @property
    def tall(self):       # the picture's real height, for standing on platforms
        return 32 * self.size

    def __repr__(self):
        return f"Sprite('{self.name}', x={self.x}, y={self.y})"


class Box(_Thing):
    """A coloured rectangle: platforms, bricks, paddles, roads. x and y are its centre."""

    def __init__(self, x=200, y=200, w=80, h=16, color="white"):
        self.x = x
        self.y = y
        self.w = w
        self.h = h
        self.color = str(color)
        self.visible = True
        _things.append(self)

    @property
    def tall(self):
        return self.h

    def __repr__(self):
        return f"Box(x={self.x}, y={self.y}, w={self.w}, h={self.h})"


def every_frame(fn):
    """Put @every_frame above a function and the game runs it 60 times a second."""
    _hooks.append(fn)
    return fn


def key_down(key):
    """True while a key is held: 'left', 'right', 'up', 'down' or 'space'."""
    return str(key).lower() in _keys


def key_pressed(key):
    """True only on the frame a key is first pressed (one hop, one jump, one shot)."""
    return str(key).lower() in _pressed


def stand_on(thing, boxes):
    """Stops `thing` falling through any box in the list. Returns True if it's standing on one."""
    thing.grounded = False
    feet = thing.y + thing.tall / 2
    for b in boxes:
        if not b.visible or abs(thing.x - b.x) >= (thing.w + b.w) / 2:
            continue
        top = b.y - b.h / 2
        if thing.vy >= 0 and feet >= top and feet - thing.vy <= top + 1:
            thing.y = top - thing.tall / 2
            thing.vy = 0
            thing.grounded = True
            feet = thing.y + thing.tall / 2
    return thing.grounded


def on_ground(thing):
    """True if stand_on() put `thing` on a platform this frame."""
    return bool(getattr(thing, "grounded", False))


def cleanup(things):
    """Removes hidden things, and things far off the screen, from a list."""
    things[:] = [t for t in things if t.visible and -60 < t.x < WIDTH + 60 and -60 < t.y < HEIGHT + 60]


def text(message, x=10, y=28, size=20, color="white"):
    _texts.append([str(message), x, y, size, str(color)])


def background(color):
    _state["bg"] = str(color)


def play(sound):
    """Sounds: 'coin', 'boom', 'jump', 'zap', 'hurt', 'win'"""
    _sounds.append(str(sound))


def music(tune):
    """Tunes: 'chill', 'fast' or 'off'"""
    _state["music"] = str(tune)


def game_over(message="Game over!"):
    _state["over"] = str(message)


def random_x():
    return random.randint(20, WIDTH - 20)


def _print(*args, sep=" ", end="\n"):
    _out.append(sep.join(str(a) for a in args) + ("" if end == "\n" else end))
    del _out[:-200]


__all__ = ["Sprite", "Box", "every_frame", "key_down", "key_pressed", "stand_on", "on_ground", "cleanup",
           "text", "background", "play", "music", "game_over", "random_x", "WIDTH", "HEIGHT", "random", "math"]

# ---------- runtime (not for students) ----------
FILE = "<your code>"


class TooLong(Exception):
    pass


_budget = [0]


def _tracer(frame, event, arg):
    if frame.f_code.co_filename != FILE:
        return None
    if event == "line":
        _budget[0] -= 1
        if _budget[0] < 0:
            raise TooLong()
    return _tracer


def _guarded(fn, budget):
    _budget[0] = budget
    sys.settrace(_tracer)
    try:
        return fn()
    finally:
        sys.settrace(None)


def reset():
    for x in (_things, _hooks, _texts, _keys, _tapped, _prev, _pressed, _sounds, _out):
        x.clear()
    _state.update(bg="#0b2230", over=None, music=None)


def tap(key):
    """The app calls this when a key goes down, so a tap shorter than a frame still counts."""
    _tapped.add(str(key))


def new_namespace():
    ns = {"__name__": "__main__", "__builtins__": builtins}
    ns["print"] = _print
    return ns


def run(code, ns):
    """Run student code once. Returns None or an error dict."""
    reset()
    _state["source"] = code
    try:
        compiled = compile(code, FILE, "exec")
        _guarded(lambda: exec(compiled, ns), 400_000)
        return None
    except BaseException as e:  # noqa: BLE001 - we explain every error to the student
        return explain(e, ns)


def set_lang(lang):
    LANG[0] = "es" if lang == "es" else "en"


def _scene():
    boxes = [["b", t.x, t.y, t.w, t.h, t.color] for t in _things if isinstance(t, Box) and t.visible]
    sprites = [["s", t.name, t.x, t.y, t.size] for t in _things if isinstance(t, Sprite) and t.visible]
    return boxes + sprites


def snapshot():
    """What's on screen right now, without running the game loop."""
    return json.dumps({"bg": _state["bg"], "over": None, "music": None, "things": _scene(),
                       "texts": _texts, "sounds": [], "out": [], "error": None})


def _tick(ns):
    """One frame: work out which keys were just pressed, then run update() and every @every_frame function."""
    _pressed.clear()
    _pressed.update((_keys - _prev) | _tapped)
    _tapped.clear()
    _prev.clear()
    _prev.update(_keys)

    def go():
        upd = ns.get("update")
        if callable(upd):
            upd()
        for fn in list(_hooks):
            if _state["over"]:
                break
            fn()
    _guarded(go, 80_000)


def frame(ns):
    """One game tick for the real game screen; returns what to draw as JSON."""
    _texts.clear()
    _sounds.clear()
    err = None
    if not _state["over"]:
        try:
            _tick(ns)
        except BaseException as e:  # noqa: BLE001
            err = explain(e, ns)
    out = list(_out)
    _out.clear()
    return json.dumps({"bg": _state["bg"], "over": _state["over"], "music": _state["music"],
                       "things": _scene(), "texts": _texts, "sounds": _sounds, "out": out, "error": err})


def step(ns, frames=1, keys=()):
    """Used by level checks: hold `keys` for `frames` frames (they count as pressed on the first)."""
    _keys.clear()
    _prev.clear()
    _tapped.clear()
    _keys.update(keys)
    for _ in range(frames):
        if _state["over"]:
            break
        _texts.clear()
        _tick(ns)
    _keys.clear()
    _prev.clear()


def check(check_code, ns):
    """Level checks set `result` to None (pass) or a short failure key."""
    ns["_step"] = lambda frames=1, keys=(): step(ns, frames, keys)
    ns["_printed"] = list(_out)
    ns["_source"] = _state["source"]
    ns["result"] = None
    try:
        exec(compile(check_code, "<check>", "exec"), ns)
        return {"ok": ns.get("result") is None, "fail": ns.get("result"), "extra": ns.get("_extra")}
    except BaseException as e:  # noqa: BLE001
        err = explain(e, ns)
        return {"ok": False, "fail": "error", "error": err}


# ---------- kid-friendly errors ----------
MSG = {
    "en": {
        "name": "I don't know what `{0}` is.",
        "name_hint": " Did you mean `{0}`?",
        "name_none": " Did you create it first? Check spelling and capital letters.",
        "colon": "A colon `:` is missing at the end of this line.",
        "quote": "Some text is missing its closing quote mark `\"`.",
        "open": "A bracket `{0}` was opened but never closed.",
        "close": "There's an extra closing bracket `{0}` here.",
        "comma": "Looks like a comma `,` is missing.",
        "equals": "Use `==` to compare two things, and `=` to store a value.",
        "syntax": "Python couldn't read this line. Look for typos, missing colons, quotes or brackets.",
        "indent_need": "The line after a `:` needs to be pushed in (indented) by 4 spaces.",
        "indent_extra": "This line is pushed in (indented) but it shouldn't be.",
        "indent_match": "The spaces at the start of this line don't line up with the lines above.",
        "concat": "You're joining text and a number with `+`. Wrap the number in `str( )` first.",
        "operand": "You can't do math with these two kinds of values together.",
        "missing_arg": "This function needs more inputs inside the `( )`.",
        "extra_arg": "You gave this function too many inputs inside the `( )`.",
        "not_callable": "You used `( )` on something that isn't a function.",
        "attr": "`{0}` doesn't have anything called `{1}`.",
        "attr_hint": " Did you mean `{0}`?",
        "zero": "You divided by zero. Even computers can't do that!",
        "index": "You asked for a list item that isn't there. Lists start counting at 0.",
        "value": "That value doesn't work here: {0}",
        "timeout": "Your code ran too long. Is there a loop that never stops?",
        "key": "This dictionary has no key {0}. Check the spelling and quotes, or add that key first.",
        "randint": "random.randint needs the SMALLER number first, like random.randint(30, 370).",
        "not_iter": "You can't loop over that. If it's a method like .items, add ( ) to run it: .items()",
        "global": "To change `{0}` inside a function, add `global {0}` as the first line inside that function.",
        "other": "{0}: {1}",
    },
    "es": {
        "name": "No sé qué es `{0}`.",
        "name_hint": " ¿Quisiste decir `{0}`?",
        "name_none": " ¿Lo creaste primero? Revisa la ortografía y las mayúsculas.",
        "colon": "Falta dos puntos `:` al final de esta línea.",
        "quote": "A un texto le falta la comilla de cierre `\"`.",
        "open": "Abriste un paréntesis `{0}` pero nunca lo cerraste.",
        "close": "Aquí sobra un paréntesis de cierre `{0}`.",
        "comma": "Parece que falta una coma `,`.",
        "equals": "Usa `==` para comparar y `=` para guardar un valor.",
        "syntax": "Python no pudo leer esta línea. Busca errores de escritura, dos puntos, comillas o paréntesis.",
        "indent_need": "La línea después de `:` debe tener sangría de 4 espacios.",
        "indent_extra": "Esta línea tiene sangría, pero no debería.",
        "indent_match": "Los espacios al inicio de esta línea no coinciden con las líneas de arriba.",
        "concat": "Estás uniendo texto y un número con `+`. Primero pon el número dentro de `str( )`.",
        "operand": "No puedes hacer matemáticas con estos dos tipos de valores juntos.",
        "missing_arg": "Esta función necesita más datos dentro de `( )`.",
        "extra_arg": "Le diste demasiados datos a esta función dentro de `( )`.",
        "not_callable": "Usaste `( )` con algo que no es una función.",
        "attr": "`{0}` no tiene nada llamado `{1}`.",
        "attr_hint": " ¿Quisiste decir `{0}`?",
        "zero": "Dividiste entre cero. ¡Ni las computadoras pueden hacer eso!",
        "index": "Pediste un elemento que no está en la lista. Las listas empiezan a contar en 0.",
        "value": "Ese valor no funciona aquí: {0}",
        "timeout": "Tu código tardó demasiado. ¿Hay un bucle que nunca termina?",
        "key": "Este diccionario no tiene la clave {0}. Revisa la ortografía y las comillas, o agrega esa clave primero.",
        "randint": "random.randint necesita el número MÁS PEQUEÑO primero, como random.randint(30, 370).",
        "not_iter": "No puedes recorrer eso con un bucle. Si es un método como .items, agrégale ( ): .items()",
        "global": "Para cambiar `{0}` dentro de una función, agrega `global {0}` como primera línea de esa función.",
        "other": "{0}: {1}",
    },
}
LANG = ["en"]
KNOWN = ["update", "player", "score", "lives", "speed", "platforms", "bullets", "cars", "bricks", "ball", "paddle", "TITLE"] + __all__


def _line_of(e):
    if isinstance(e, SyntaxError) and e.filename == FILE:
        return e.lineno
    tb, line = e.__traceback__, None
    while tb:
        if tb.tb_frame.f_code.co_filename == FILE:
            line = tb.tb_lineno
        tb = tb.tb_next
    return line


def explain(e, ns):
    m = MSG.get(LANG[0], MSG["en"])
    kind = type(e).__name__
    text_ = str(e)
    if isinstance(e, TooLong):
        kind, msg = "Timeout", m["timeout"]
    elif isinstance(e, IndentationError):
        low = text_.lower()
        msg = m["indent_need"] if "expected an indented" in low else m["indent_extra"] if "unexpected indent" in low else m["indent_match"]
    elif isinstance(e, SyntaxError):
        t = (e.msg or "").lower()
        if "expected ':'" in t:
            msg = m["colon"]
        elif "unterminated string" in t or "eol while" in t:
            msg = m["quote"]
        elif "was never closed" in t:
            msg = m["open"].format(t.split("'")[1] if "'" in t else "(")
        elif "unmatched" in t:
            msg = m["close"].format(t.split("'")[1] if "'" in t else ")")
        elif "forgot a comma" in t:
            msg = m["comma"]
        elif "'=='" in t or "cannot assign" in t:
            msg = m["equals"]
        else:
            msg = m["syntax"]
    elif isinstance(e, UnboundLocalError):
        name = text_.split("'")[1] if "'" in text_ else "score"
        kind, msg = "NameError", m["global"].format(name)
    elif isinstance(e, NameError):
        name = getattr(e, "name", None) or (text_.split("'")[1] if "'" in text_ else "?")
        pool = [k for k in ns.keys() if not k.startswith("_")] + KNOWN + dir(builtins)
        close = difflib.get_close_matches(name, pool, n=1, cutoff=0.6)
        msg = m["name"].format(name) + (m["name_hint"].format(close[0]) if close else m["name_none"])
    elif isinstance(e, AttributeError):
        obj = getattr(e, "obj", None)
        attr = getattr(e, "name", None) or "?"
        owner = type(obj).__name__ if obj is not None else "?"
        pool = [a for a in dir(obj) if not a.startswith("_")] if obj is not None else []
        close = difflib.get_close_matches(attr, pool, n=1, cutoff=0.5)
        msg = m["attr"].format(owner, attr) + (m["attr_hint"].format(close[0]) if close else "")
    elif isinstance(e, TypeError):
        if "concatenate str" in text_ or "can only concatenate" in text_:
            msg = m["concat"]
        elif "unsupported operand" in text_:
            msg = m["operand"]
        elif "missing" in text_ and "required" in text_:
            msg = m["missing_arg"]
        elif "positional argument" in text_ and "given" in text_:
            msg = m["extra_arg"]
        elif "not callable" in text_:
            msg = m["not_callable"]
        elif "not iterable" in text_:
            msg = m["not_iter"]
        else:
            msg = m["other"].format(kind, text_)
    elif isinstance(e, ZeroDivisionError):
        msg = m["zero"]
    elif isinstance(e, IndexError):
        msg = m["index"]
    elif isinstance(e, KeyError):
        msg = m["key"].format(text_)
    elif isinstance(e, ValueError):
        msg = m["randint"] if "empty range" in text_ else m["value"].format(text_)
    else:
        msg = m["other"].format(kind, text_)
    known = {"NameError", "SyntaxError", "IndentationError", "TypeError", "AttributeError",
             "ValueError", "ZeroDivisionError", "IndexError", "KeyError", "Timeout"}
    return {"kind": kind if kind in known else "Other", "message": msg, "line": _line_of(e)}

