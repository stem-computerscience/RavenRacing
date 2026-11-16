// Python Quest engine: runs student Python in the browser (Skulpt)
// and checks it against each level's tests.
(function () {
  const PQ = (window.PQ = window.PQ || {});

  function builtinRead(f) {
    if (!Sk.builtinFiles || !Sk.builtinFiles.files[f]) throw "File not found: '" + f + "'";
    return Sk.builtinFiles.files[f];
  }

  PQ.pythonReady = function () {
    return typeof window.Sk !== "undefined" && !!Sk.importMainWithBody;
  };

  // opts: {inputs: string[] | null, onOutput(text), onInput(prompt) -> Promise<string>, timeLimit}
  PQ.runPython = function (src, opts) {
    opts = opts || {};
    let out = "";
    const feed = opts.inputs ? opts.inputs.slice() : null;
    Sk.configure({
      output: function (t) { out += t; if (opts.onOutput) opts.onOutput(t); },
      read: builtinRead,
      __future__: Sk.python3,
      inputfunTakesPrompt: true,
      inputfun: function (prompt) {
        if (feed) return feed.length ? feed.shift() : "";
        return opts.onInput(prompt).then(function (v) { Sk.execStart = Date.now(); return v; });
      },
      // execLimit makes Skulpt stop runaway loops with TimeLimitError;
      // yieldLimit lets the page stay responsive while code runs.
      execLimit: opts.timeLimit || 3000,
      yieldLimit: 100
    });
    Sk.execStart = Date.now();
    return Sk.misceval
      .asyncToPromise(function () { return Sk.importMainWithBody("<stdin>", false, src, true); })
      .then(function () { return { ok: true, out: out }; },
            function (e) { return { ok: false, out: out, error: e }; });
  };

  function lineCount(s) { return s.split("\n").length - 1; }

  // Turn a Skulpt exception into something a 12-year-old can act on.
  PQ.friendlyError = function (e, offset, studentLines) {
    let raw = "";
    try { raw = e && e.toString ? e.toString() : String(e); } catch (_) { raw = String(e); }
    let line = null;
    try {
      if (e && e.traceback) {
        for (const tb of e.traceback) {
          const l = tb.lineno - offset;
          if (l >= 1 && l <= studentLines) { line = l; break; }
        }
      }
    } catch (_) {}
    if (line === null) {
      const m = raw.match(/on line (\d+)/);
      if (m) { const l = +m[1] - offset; if (l >= 1 && l <= studentLines) line = l; }
    }
    raw = raw.replace(/ on line -?\d+/g, "").replace(/\s+$/, "");
    const type = (raw.match(/^(\w+)/) || [])[1] || "Error";
    let tip = "Read the message carefully and look at the line it points to.";
    if (/TimeLimit|Timeout/i.test(type) || /time limit/i.test(raw))
      return { type: "Too slow", line: null, raw: "Your program ran too long and was stopped.",
               tip: "A loop probably never ends. Make sure something inside the loop changes so the condition eventually becomes False." };
    if (type === "SyntaxError") tip = "Python couldn't read this line. Check for a missing colon `:`, quote, or bracket — or a missing comma between things.";
    else if (type === "IndentationError") tip = "The spaces at the start of the line are off. Lines inside an `if`, loop, or `def` need 4 spaces; other lines need none.";
    else if (type === "NameError") tip = "Python doesn't know that name. Check the spelling (capitals matter!), or put quotes around it if it's meant to be text.";
    else if (type === "TypeError" && /str|concatenate|\+/.test(raw)) tip = "You're mixing text and numbers. Use `int()` to turn text into a number, or `str()` to turn a number into text.";
    else if (type === "TypeError") tip = "Something got the wrong kind of value, or a function got the wrong number of things in its parentheses.";
    else if (type === "ValueError") tip = "`int()` got something that isn't a whole number. Did the player type digits?";
    else if (type === "IndexError") tip = "You asked for a list position that doesn't exist. Remember lists start at 0.";
    else if (type === "ZeroDivisionError") tip = "You divided by zero, which Python can't do.";
    else if (type === "AttributeError") tip = "That value doesn't have that ability. Check the spelling after the dot.";
    else if (type === "KeyError") tip = "That key isn't in the dictionary.";
    return { type: type, line: line, raw: raw, tip: tip };
  };

  PQ.stripComments = function (code) {
    return code.split("\n").map(function (l) { return l.replace(/#.*$/, ""); }).join("\n");
  };
  PQ.countLines = function (code) {
    return PQ.stripComments(code).split("\n").filter(function (l) { return l.trim(); }).length;
  };

  // Lines a student sees (checker lines hidden), normalized for comparing.
  function shownLines(s) {
    return s.split("\n").filter(function (l) { return l.indexOf("__") !== 0; });
  }
  function pairs(s) {
    const lines = shownLines(s).map(function (l) { const r = l.trim(); return { raw: r, n: r.replace(/\s+/g, " ").toLowerCase() }; });
    while (lines.length && lines[lines.length - 1].n === "") lines.pop();
    while (lines.length && lines[0].n === "") lines.shift();
    return lines;
  }
  function norm(s) { return pairs(s).map(function (p) { return p.n; }); }
  PQ.visibleOutput = function (s) { return shownLines(s).join("\n").replace(/\n+$/, ""); };

  function compareOutput(got, expect) {
    const g = pairs(got), x = pairs(expect);
    if (!g.length) return "Your program didn't print anything.";
    const n = Math.max(g.length, x.length);
    for (let i = 0; i < n; i++) {
      if (g[i] && x[i] && g[i].n === x[i].n) continue;
      if (!g[i]) return "Line " + (i + 1) + " is missing. It should be `" + x[i].raw + "`.";
      if (!x[i]) return "Your program printed an extra line: `" + g[i].raw + "`.";
      return "Line " + (i + 1) + " should be `" + x[i].raw + "` but your program printed `" + (g[i].raw || "(blank line)") + "`.";
    }
    return null;
  }

  PQ.gridResult = function (map, out) {
    const lines = out.split("\n").filter(function (l) { return l.indexOf("__GRID__") === 0; });
    const body = lines.length ? lines[lines.length - 1].slice(8) : "";
    const path = body ? body.split(",") : [];
    let pos = null, goal = null; const items = new Set();
    map.forEach(function (row, y) { row.split("").forEach(function (c, x) {
      if (c === "S") pos = [x, y]; if (c === "G") goal = [x, y]; if (c === "*") items.add(x + ":" + y);
    }); });
    const start = pos.slice(); const steps = []; const got = new Set(); let crash = null;
    for (const p of path) {
      const parts = p.split(":");
      if (parts.length === 3) { crash = [+parts[0], +parts[1]]; break; }
      pos = [+parts[0], +parts[1]]; steps.push(pos.slice());
      if (items.has(pos[0] + ":" + pos[1])) got.add(pos[0] + ":" + pos[1]);
    }
    return { start: start, steps: steps, crash: crash, atGoal: pos[0] === goal[0] && pos[1] === goal[1],
             missing: items.size - got.size, totalItems: items.size, tooMany: path.length > 400 };
  };

  // Check a level. Returns {pass, failures:[{msg, kind}], output, inputs, error, grid}
  PQ.checkLevel = async function (level, code) {
    const failures = [];
    const clean = PQ.stripComments(code);
    (level.require || []).forEach(function (r) { if (!new RegExp(r.re).test(clean)) failures.push({ kind: "rule", msg: r.msg }); });
    (level.forbid || []).forEach(function (r) { if (new RegExp(r.re).test(clean)) failures.push({ kind: "rule", msg: r.msg }); });
    if (level.maxLines && PQ.countLines(code) > level.maxLines)
      failures.push({ kind: "rule", msg: "Use " + level.maxLines + " lines of code or fewer (you have " + PQ.countLines(code) + "). Look for a pattern to repeat." });

    const offset = lineCount(level.pre);
    const studentLines = code.split("\n").length;
    let shown = null;
    for (let i = 0; i < level.tests.length; i++) {
      const t = level.tests[i];
      const src = level.pre + code + "\n" + t.post;
      const res = await PQ.runPython(src, { inputs: t.inputs || [], timeLimit: 3000 });
      const testFails = [];
      const label = t.inputs && t.inputs.length ? "When the player types " + t.inputs.map(function (v) { return "`" + v + "`"; }).join(", ") + ": " : "";
      let grid = null, error = null;
      if (!res.ok) {
        error = PQ.friendlyError(res.error, offset, studentLines);
        testFails.push({ kind: "error", msg: label + error.type + (error.line ? " on line " + error.line : "") + ". " + error.tip });
      } else {
        res.out.split("\n").forEach(function (l) { if (l.indexOf("__FAIL__") === 0) testFails.push({ kind: "check", msg: label + l.slice(8) }); });
        if (t.expect !== undefined) { const d = compareOutput(res.out, t.expect); if (d) testFails.push({ kind: "output", msg: label + d }); }
        if (t.match) {
          const joined = norm(res.out).join("\n");
          if (!new RegExp(t.match, "im").test(joined)) testFails.push({ kind: "output", msg: label + "The output doesn't look right yet. Check the example in the mission." });
        }
        if (level.type === "grid") {
          grid = PQ.gridResult(level.grid, res.out);
          if (grid.crash) testFails.push({ kind: "grid", msg: "Bonk! You ran into a wall." });
          else if (!grid.atGoal) testFails.push({ kind: "grid", msg: "You didn't end on the goal." });
          if (!grid.crash && grid.missing) testFails.push({ kind: "grid", msg: "You missed " + grid.missing + " of " + grid.totalItems + " items." });
        }
      }
      const record = { output: res.out, inputs: t.inputs || [], error: error, grid: grid, fails: testFails };
      if (!shown || (testFails.length && !shown.fails.length)) shown = record;
      testFails.forEach(function (f) { failures.push(f); });
      if (testFails.length) break; // one failing example at a time is easier to read
    }
    return { pass: failures.length === 0, failures: failures, shown: shown };
  };
})();
