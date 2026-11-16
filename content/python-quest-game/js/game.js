// Python Quest — game screens and flow.
(function () {
  const PQ = window.PQ;
  const CFG = window.PQ_CONFIG || {};
  const LEVELS = window.PQ_LEVELS;
  const THEMES = window.PQ_THEMES;
  const WORLDS = window.PQ_WORLDS;
  const RANKS = window.PQ_RANKS;
  const TYPE_LABEL = { code: "Code", predict: "Predict", fix: "Debug", grid: "Maze" };

  // ---------------------------------------------------------------- helpers
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  function theme() { return THEMES[(player && player.theme) || "space"]; }
  function tpl(s) {
    const v = theme().vocab;
    return String(s).replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));
  }
  function inline(s) {
    return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  }
  // Tiny markdown: paragraphs, "- " lists, "1. " lists, `code`, **bold**.
  function md(s) {
    return tpl(s).split(/\n\n+/).map((block) => {
      const lines = block.split("\n");
      if (lines.every((l) => /^- /.test(l))) return "<ul>" + lines.map((l) => "<li>" + inline(l.slice(2)) + "</li>").join("") + "</ul>";
      if (lines.every((l) => /^\d+\. /.test(l))) return "<ol>" + lines.map((l) => "<li>" + inline(l.replace(/^\d+\. /, "")) + "</li>").join("") + "</ol>";
      return "<p>" + lines.map(inline).join("<br>") + "</p>";
    }).join("");
  }
  function hintHTML(h) {
    h = tpl(h);
    if (h.indexOf("\n") >= 0) return '<pre class="code-view small">' + highlight(h) + "</pre>";
    return inline(h);
  }

  // ---------------------------------------------------------------- state
  let profiles = store.get("pq.profiles", {});
  let player = null;
  let level = null;
  let running = false;

  function saveProfiles() { store.set("pq.profiles", profiles); }
  function idFor(name, period) { return name.trim().toLowerCase().replace(/\s+/g, " ") + "|" + period; }
  function xpOf(p) { return LEVELS.reduce((t, l) => t + (p.done[l.id] ? l.xp : 0), 0); }
  const MAX_XP = LEVELS.reduce((t, l) => t + l.xp, 0);
  function rankOf(xp) { let r = RANKS[0]; RANKS.forEach((x) => { if (xp >= x[0]) r = x; }); return r; }
  function nextRank(xp) { return RANKS.find((x) => x[0] > xp); }
  function summary(p) {
    const ids = LEVELS.filter((l) => p.done[l.id]).map((l) => l.id);
    const hints = Object.values(p.hints || {}).reduce((a, b) => a + b, 0);
    return { id: p.id, name: p.name, period: p.period, theme: p.theme, xp: xpOf(p), levels: ids.length,
             done: ids.join(" "), hints: hints, updated: new Date().toISOString() };
  }

  function show(screen) {
    ["signin", "map", "level"].forEach((s) => { $("screen-" + s).hidden = s !== screen; });
    window.scrollTo(0, 0);
  }
  function applyTheme() { document.body.dataset.quest = player ? player.theme : "none"; }

  // ---------------------------------------------------------------- sign in
  let pickedTheme = null;
  function renderSignin() {
    player = null; applyTheme();
    $("class-name").textContent = CFG.className || "";
    const sel = $("in-period");
    sel.innerHTML = '<option value="" disabled selected>Pick…</option>' +
      (CFG.periods || []).map((p) => '<option value="' + esc(p) + '">Period ' + esc(p) + "</option>").join("");

    const list = $("returning-list"); list.innerHTML = "";
    const ps = Object.values(profiles).sort((a, b) => (b.last || 0) - (a.last || 0));
    $("returning").hidden = !ps.length;
    $("new-player-label").textContent = ps.length ? "Or start a new player" : "New player";
    ps.slice(0, 6).forEach((p) => {
      const b = el("button", "returning-btn");
      b.dataset.quest = p.theme;
      b.type = "button";
      const n = el("b", null, p.name);
      const meta = el("span", null, "Period " + p.period + " · " + xpOf(p) + " XP · " + THEMES[p.theme].name);
      b.append(n, meta);
      b.onclick = () => signIn(p);
      list.append(b);
    });

    const picks = $("theme-picks"); picks.innerHTML = "";
    Object.keys(THEMES).forEach((k) => {
      const t = THEMES[k];
      const b = el("button", "theme-card");
      b.type = "button"; b.dataset.quest = k; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false");
      b.innerHTML = '<span class="theme-glyph" aria-hidden="true">' + t.glyph.hero + "</span><b>" + esc(t.name) + "</b><span>" + esc(t.pitch) + "</span>";
      b.onclick = () => {
        pickedTheme = k;
        picks.querySelectorAll(".theme-card").forEach((c) => c.setAttribute("aria-checked", c === b ? "true" : "false"));
      };
      picks.append(b);
    });
    pickedTheme = null;
    show("signin");
  }

  $("signin-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("in-name").value.trim().replace(/\s+/g, " ");
    const period = $("in-period").value;
    const msg = $("signin-msg");
    if (name.length < 2) { msg.textContent = "Type your first name and last initial."; return; }
    if (!period) { msg.textContent = "Pick your class period."; return; }
    if (!pickedTheme) { msg.textContent = "Pick an adventure."; return; }
    msg.textContent = "";
    const id = idFor(name, period);
    const p = profiles[id] || { id, name, period, theme: pickedTheme, done: {}, hints: {}, tries: {}, drafts: {}, created: Date.now() };
    p.theme = pickedTheme;
    profiles[id] = p;
    signIn(p);
  });

  async function signIn(p) {
    player = p; p.last = Date.now(); saveProfiles(); store.set("pq.current", p.id);
    applyTheme(); renderMap(); show("map");
    // pick up progress made on another computer
    const remote = await PQ.sync.get(p.id);
    if (remote && remote.done) {
      let changed = false;
      String(remote.done).split(/\s+/).filter(Boolean).forEach((lid) => {
        if (!p.done[lid] && LEVELS.some((l) => l.id === lid)) { p.done[lid] = { at: Date.now(), synced: true }; changed = true; }
      });
      if (changed) { saveProfiles(); if (!$("screen-map").hidden) renderMap(); }
    }
    pushProgress();
  }

  // ---------------------------------------------------------------- sync
  let syncState = PQ.sync.enabled ? "idle" : "off";
  async function pushProgress() {
    if (!player || !PQ.sync.enabled) { updateSyncNote(); return; }
    syncState = "saving"; updateSyncNote();
    const ok = await PQ.sync.save(summary(player));
    syncState = ok ? "saved" : "failed"; updateSyncNote();
  }
  function updateSyncNote() {
    const n = $("sync-note");
    n.textContent = {
      off: "Progress is saved on this computer. Use Turn in to send it to your teacher.",
      idle: "", saving: "Saving to your class…",
      saved: "Progress saved to your class.",
      failed: "Couldn't reach your class sheet. Your progress is safe on this computer — use Turn in if your teacher asks."
    }[syncState];
  }

  // ---------------------------------------------------------------- map
  function updateHud() {
    const xp = xpOf(player), r = rankOf(xp), nr = nextRank(xp);
    $("hud-name").textContent = player.name + " · Period " + player.period;
    $("hud-rank").textContent = r[1];
    $("hud-xp").textContent = xp; $("hud-xp2").textContent = xp;
    const pct = nr ? ((xp - r[0]) / (nr[0] - r[0])) * 100 : 100;
    $("hud-xpbar").style.width = Math.max(3, pct) + "%";
    $("hud-xpbar").parentElement.title = nr ? (nr[0] - xp) + " XP to " + nr[1] : "Top rank!";
  }

  function renderMap() {
    updateHud(); updateSyncNote();
    const t = theme();
    const map = $("map"); map.innerHTML = "";
    WORLDS.forEach((w, wi) => {
      const lv = LEVELS.filter((l) => l.world === w.n);
      const done = lv.filter((l) => player.done[l.id]).length;
      const sec = el("section", "world" + (done === lv.length ? " world-done" : ""));
      const head = el("div", "world-head");
      const h = el("h2");
      h.innerHTML = '<span class="world-num">World ' + w.n + "</span> " + esc(t.worlds[wi]);
      const meta = el("div", "world-meta");
      meta.innerHTML = '<span class="chip">' + esc(w.topic) + '</span><span class="world-count">' + done + " / " + lv.length + "</span>" +
        (done === lv.length ? '<span class="badge">World badge</span>' : "");
      head.append(h, meta);
      const intro = el("p", "world-intro", t.intros[wi]);
      const path = el("ol", "path");
      lv.forEach((l, i) => {
        const li = el("li");
        const b = el("button", "node" + (l.boss ? " node-boss" : "") + (player.done[l.id] ? " node-done" : ""));
        b.type = "button";
        b.innerHTML = '<span class="node-num">' + (player.done[l.id] ? "✓" : l.boss ? "★" : i + 1) + "</span>" +
          '<span class="node-title">' + esc(tpl(l.title).replace(/^BOSS:\s*/, "")) + "</span>" +
          '<span class="node-meta">' + (l.boss ? "Boss" : TYPE_LABEL[l.type]) + " · " + l.xp + " XP</span>";
        b.onclick = () => openLevel(l.id);
        li.append(b); path.append(li);
      });
      sec.append(head, intro, path);
      map.append(sec);
    });
  }

  // ---------------------------------------------------------------- editor
  const KW = /\b(def|return|if|elif|else|for|while|in|and|or|not|True|False|None|import|from|break|continue|pass|class|lambda|try|except|global|is)\b/;
  const BI = /\b(print|input|int|str|len|range|float|list|append|sum|max|min|round|abs|move_right|move_left|move_up|move_down|is_wall|at_goal)\b/;
  function highlight(code) {
    const re = /(#.*$)|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/gm;
    let out = "", last = 0, m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      const s = m[0];
      if (m[1]) out += '<span class="t-com">' + esc(s) + "</span>";
      else if (m[2]) out += '<span class="t-str">' + esc(s) + "</span>";
      else if (m[3]) out += '<span class="t-num">' + esc(s) + "</span>";
      else if (KW.test(s) && s.match(KW)[0] === s) out += '<span class="t-kw">' + s + "</span>";
      else if (BI.test(s) && s.match(BI)[0] === s) out += '<span class="t-fn">' + s + "</span>";
      else out += esc(s);
      last = m.index + s.length;
    }
    return out + esc(code.slice(last));
  }

  const ta = $("code"), hl = $("hl"), gutter = $("gutter");
  function syncEditor() {
    hl.innerHTML = highlight(ta.value) + "\n";
    const n = ta.value.split("\n").length;
    let g = ""; for (let i = 1; i <= n; i++) g += i + "\n";
    gutter.textContent = g;
    syncScroll();
  }
  function syncScroll() {
    hl.style.transform = "translate(" + -ta.scrollLeft + "px," + -ta.scrollTop + "px)";
    gutter.style.transform = "translateY(" + -ta.scrollTop + "px)";
  }
  function insert(text) {
    ta.focus();
    if (!document.execCommand || !document.execCommand("insertText", false, text)) ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end");
  }
  let draftTimer = null;
  ta.addEventListener("input", () => {
    syncEditor();
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => { if (player && level) { player.drafts[level.id] = ta.value; saveProfiles(); } }, 400);
  });
  ta.addEventListener("scroll", syncScroll);
  ta.addEventListener("keydown", (e) => {
    const v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
    const lineStart = v.lastIndexOf("\n", s - 1) + 1;
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); (level.type === "grid" ? runGrid : checkCode)(); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      if (s !== en || e.shiftKey) {
        // indent / outdent every selected line
        const endLine = v.indexOf("\n", en - (en > s && v[en - 1] === "\n" ? 1 : 0));
        const blockEnd = endLine === -1 ? v.length : endLine;
        const block = v.slice(lineStart, blockEnd);
        const changed = block.split("\n").map((l) => (e.shiftKey ? l.replace(/^ {1,4}/, "") : "    " + l)).join("\n");
        ta.setSelectionRange(lineStart, blockEnd);
        insert(changed);
        ta.setSelectionRange(lineStart, lineStart + changed.length);
      } else insert("    ");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const line = v.slice(lineStart, s);
      let indent = (line.match(/^ */) || [""])[0];
      if (/:\s*(#.*)?$/.test(line)) indent += "    ";
      insert("\n" + indent);
      return;
    }
    if (e.key === "Backspace" && s === en && s > lineStart) {
      const before = v.slice(lineStart, s);
      if (/^ +$/.test(before) && before.length % 4 === 0) { e.preventDefault(); ta.setSelectionRange(s - 4, s); insert(""); }
    }
  });
  function setCode(code) { ta.value = code; syncEditor(); ta.scrollTop = 0; }

  // ---------------------------------------------------------------- console
  const con = $("console");
  function conClear() { con.innerHTML = ""; }
  function conWrite(text, cls) {
    let last = con.lastElementChild;
    if (!last || last.dataset.kind !== (cls || "out") || last.dataset.closed) { last = el("div", "con-" + (cls || "out")); last.dataset.kind = cls || "out"; con.append(last); }
    last.textContent += text;
    con.scrollTop = con.scrollHeight;
  }
  function conBreak() { const l = con.lastElementChild; if (l) l.dataset.closed = "1"; }
  function conNote(html, cls) { conBreak(); const d = el("div", "con-note " + (cls || "")); d.innerHTML = html; con.append(d); con.scrollTop = con.scrollHeight; }
  function askInput(prompt) {
    return new Promise((resolve) => {
      conBreak();
      const row = el("div", "con-input");
      const p = el("span", "con-prompt", prompt || "");
      const inp = el("input"); inp.setAttribute("aria-label", "Type your answer and press Enter");
      inp.id = "con-in-" + Date.now();
      row.append(p, inp); con.append(row); inp.focus();
      con.scrollTop = con.scrollHeight;
      inp.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        const v = inp.value; const echo = el("span", "con-typed", v);
        inp.replaceWith(echo); row.dataset.closed = "1";
        resolve(v);
      });
    });
  }
  $("btn-clear").onclick = conClear;

  // ---------------------------------------------------------------- level
  function openLevel(id) {
    level = LEVELS.find((l) => l.id === id);
    if (!level) return;
    const idx = LEVELS.indexOf(level);
    const wi = level.world - 1;
    $("level-crumb").innerHTML = "World " + level.world + " · " + esc(theme().worlds[wi]) + " <span>" + (idx % 7 + 1) + " / 7</span>";
    $("lvl-type").textContent = level.boss ? "Boss level" : TYPE_LABEL[level.type];
    $("lvl-xp").textContent = level.xp + " XP" + (player.done[id] ? " · done ✓" : "");
    $("lvl-title").textContent = tpl(level.title);
    $("lvl-story").innerHTML = inline(tpl(level.story));
    $("lvl-task").innerHTML = level.task ? md(level.task) : "";
    $("lvl-commands").hidden = level.type !== "grid";
    $("feedback").hidden = true; $("feedback").innerHTML = "";
    document.querySelector(".mission").classList.toggle("is-boss", !!level.boss);

    // hints
    const used = (player.hints[id] || 0);
    $("hint-list").innerHTML = "";
    for (let i = 0; i < used; i++) addHint(i);
    updateHintBtn();

    const isPredict = level.type === "predict", isGrid = level.type === "grid";
    $("predict").hidden = !isPredict;
    $("editor-wrap").hidden = isPredict;
    $("console-wrap").hidden = isPredict;
    $("board-wrap").hidden = !isGrid;
    $("btn-check").hidden = isGrid;
    $("btn-run").textContent = isGrid ? "▶ Run" : "▶ Try it";
    $("btn-run").className = isGrid ? "btn" : "btn btn-alt";
    document.querySelector(".editor-tip").textContent = isGrid ? "Tab indents · Ctrl+Enter runs" : "Tab indents · Ctrl+Enter checks";

    if (isPredict) renderPredict();
    else {
      setCode(player.drafts[id] != null ? player.drafts[id] : level.starter);
      conClear();
      conNote(isGrid ? "Press <b>Run</b> to watch " + esc(theme().vocab.hero) + " follow your code."
                     : "<b>Try it</b> runs your program so you can play with it. <b>Check my code</b> tests it.", "muted");
    }
    show("level");
    if (isGrid) renderBoard(); // after show(), so the board can measure its space
    if (!isPredict) setTimeout(() => ta.focus(), 50);
  }

  function addHint(i) {
    const li = el("li"); li.innerHTML = hintHTML(level.hints[i]); $("hint-list").append(li);
  }
  function updateHintBtn() {
    const used = player.hints[level.id] || 0, b = $("btn-hint");
    b.hidden = used >= level.hints.length;
    b.textContent = used === level.hints.length - 1 ? "Show big hint" : "Show hint " + (used + 1);
  }
  $("btn-hint").onclick = () => {
    const used = player.hints[level.id] || 0;
    if (used >= level.hints.length) return;
    addHint(used); player.hints[level.id] = used + 1; saveProfiles(); updateHintBtn();
  };

  function bumpTries() { player.tries[level.id] = (player.tries[level.id] || 0) + 1; saveProfiles(); }

  function feedback(kind, html) {
    const f = $("feedback"); f.hidden = false; f.className = "feedback fb-" + kind; f.innerHTML = html;
    if (window.matchMedia("(max-width: 900px)").matches) f.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function setRunning(on) {
    running = on;
    ["btn-run", "btn-check", "btn-reset", "btn-back"].forEach((i) => { $(i).disabled = on; });
  }

  // ----- predict
  function renderPredict() {
    $("predict-code").innerHTML = highlight(level.code);
    const box = $("choices"); box.innerHTML = "";
    level.choices.forEach((c, i) => {
      const b = el("button", "choice"); b.type = "button";
      b.innerHTML = "<code>" + esc(c).replace(/\n/g, "<br>") + "</code>";
      b.onclick = () => {
        if (box.dataset.solved) return;
        bumpTries();
        if (i === level.answer) {
          b.classList.add("right"); box.dataset.solved = "1";
          feedback("good", "<b>Correct!</b> " + inline(level.explain));
          complete();
        } else {
          b.classList.add("wrong"); b.disabled = true;
          feedback("bad", "<b>Not quite.</b> Trace the code one line at a time and try again. A hint might help.");
        }
      };
      box.append(b);
    });
    delete box.dataset.solved;
  }

  // ----- run (play mode)
  $("btn-run").onclick = () => (level.type === "grid" ? runGrid() : tryIt());
  async function tryIt() {
    if (running) return;
    if (!PQ.pythonReady()) return feedback("bad", "Python didn't load. Refresh the page.");
    setRunning(true); conClear(); $("feedback").hidden = true;
    const code = ta.value, pre = level.pre;
    const res = await PQ.runPython(pre + code + "\n", {
      onOutput: (t) => conWrite(t), onInput: askInput, timeLimit: 10000
    });
    conBreak();
    if (!res.ok) showError(PQ.friendlyError(res.error, pre.split("\n").length - 1, code.split("\n").length));
    else if (!PQ.visibleOutput(res.out)) conNote("(Your program finished without printing anything.)", "muted");
    else conNote("Program finished. Happy with it? Press <b>Check my code</b>.", "muted");
    setRunning(false);
  }
  function showError(err) {
    conNote('<span class="err-type">' + esc(err.type) + (err.line ? " on line " + err.line : "") + "</span> " + esc(err.raw.replace(/^\w+:\s*/, "")) +
            '<div class="err-tip">' + inline(err.tip) + "</div>", "con-err");
  }

  // ----- check
  $("btn-check").onclick = () => checkCode();
  async function checkCode() {
    if (running) return;
    if (!PQ.pythonReady()) return feedback("bad", "Python didn't load. Refresh the page.");
    setRunning(true); conClear(); bumpTries();
    conNote("Checking…", "muted");
    const r = await PQ.checkLevel(level, ta.value);
    conClear();
    const s = r.shown;
    if (s) {
      if (s.inputs.length) conNote("Test run · the player types: " + s.inputs.map((v) => "<code>" + esc(v) + "</code>").join(" → "), "muted");
      const vis = PQ.visibleOutput(s.output);
      if (vis) conWrite(vis + "\n");
      if (s.error) showError(s.error);
    }
    setRunning(false);
    if (r.pass) { feedback("good", "<b>All tests passed!</b> Nice work."); complete(); }
    else feedback("bad", "<b>Not yet.</b><ul>" + r.failures.slice(0, 3).map((f) => "<li>" + inline(f.msg) + "</li>").join("") + "</ul>");
  }

  $("btn-reset").onclick = () => {
    if (running) return;
    const b = $("btn-reset");
    if (b.dataset.armed) {
      delete b.dataset.armed; b.textContent = "Reset";
      setCode(level.starter); delete player.drafts[level.id]; saveProfiles();
      if (level.type === "grid") renderBoard();
    } else {
      b.dataset.armed = "1"; b.textContent = "Sure? Click again";
      setTimeout(() => { delete b.dataset.armed; b.textContent = "Reset"; }, 2500);
    }
  };

  // ----- grid
  let cell = 48;
  function renderBoard() {
    const m = level.grid, g = theme().glyph, board = $("board");
    const W = m[0].length, H = m.length;
    const avail = Math.max(200, $("board-wrap").clientWidth - 32);
    cell = Math.max(30, Math.min(58, Math.floor(avail / W)));
    board.style.setProperty("--cell", cell + "px");
    board.style.gridTemplateColumns = "repeat(" + W + ", var(--cell))";
    board.innerHTML = "";
    let start = [0, 0];
    m.forEach((row, y) => row.split("").forEach((c, x) => {
      const d = el("div", "cell");
      d.dataset.x = x; d.dataset.y = y;
      if (c === "#") { d.classList.add("wall"); d.textContent = g.wall; }
      if (c === "*") { d.classList.add("item"); d.textContent = g.item; }
      if (c === "G") { d.classList.add("goal"); d.textContent = g.goal; }
      if (c === "S") start = [x, y];
      board.append(d);
    }));
    const hero = el("div", "sprite", g.hero); hero.id = "sprite";
    board.append(hero);
    moveSprite(start, true);
  }
  function moveSprite(p, instant) {
    const s = $("sprite");
    if (instant) s.style.transition = "none";
    s.style.transform = "translate(" + p[0] * cell + "px," + p[1] * cell + "px)";
    if (instant) { void s.offsetWidth; s.style.transition = ""; }
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function runGrid() {
    if (running) return;
    if (!PQ.pythonReady()) return feedback("bad", "Python didn't load. Refresh the page.");
    setRunning(true); conClear(); $("feedback").hidden = true; bumpTries();
    renderBoard();
    const r = await PQ.checkLevel(level, ta.value);
    const s = r.shown, gr = s && s.grid;
    const vis = s ? PQ.visibleOutput(s.output) : "";
    if (vis) conWrite(vis + "\n");
    if (s && s.error) showError(s.error);
    if (gr) {
      const fast = gr.steps.length > 40 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      for (const p of gr.steps) {
        moveSprite(p);
        const c = document.querySelector('.cell.item[data-x="' + p[0] + '"][data-y="' + p[1] + '"]');
        if (c) c.classList.add("got");
        await wait(fast ? 60 : 260);
      }
      if (gr.crash) {
        const last = gr.steps.length ? gr.steps[gr.steps.length - 1] : gr.start;
        const mid = [last[0] + (gr.crash[0] - last[0]) * 0.4, last[1] + (gr.crash[1] - last[1]) * 0.4];
        moveSprite(mid); await wait(180);
        $("sprite").textContent = theme().glyph.crash; $("sprite").classList.add("crashed");
      } else if (gr.atGoal && !gr.missing) $("sprite").classList.add("won");
    }
    setRunning(false);
    if (r.pass) { feedback("good", "<b>You made it!</b>"); complete(); }
    else feedback("bad", "<b>Not yet.</b><ul>" + r.failures.slice(0, 3).map((f) => "<li>" + inline(f.msg) + "</li>").join("") + "</ul>");
  }

  // ---------------------------------------------------------------- completing
  function complete() {
    const already = !!player.done[level.id];
    const before = xpOf(player);
    if (!already) {
      player.done[level.id] = { at: Date.now(), tries: player.tries[level.id] || 1, hints: player.hints[level.id] || 0 };
      saveProfiles(); pushProgress();
    }
    const after = xpOf(player);
    updateHud();
    $("lvl-xp").textContent = level.xp + " XP · done ✓";
    const idx = LEVELS.indexOf(level), next = LEVELS[idx + 1];
    const rankUp = rankOf(after)[1] !== rankOf(before)[1];
    const worldDone = LEVELS.filter((l) => l.world === level.world).every((l) => player.done[l.id]);
    let html = '<div class="win">';
    html += '<div class="win-glyph" aria-hidden="true">' + (level.boss ? theme().glyph.goal : theme().glyph.item) + "</div>";
    html += '<h2 id="modal-title">' + (level.boss ? "Boss defeated!" : "Mission complete!") + "</h2>";
    html += already ? "<p>You already earned this one. Great practice!</p>" : '<p class="win-xp">+' + level.xp + " XP</p>";
    if (!already && rankUp) html += '<p class="win-rank">New rank: <b>' + esc(rankOf(after)[1]) + "</b></p>";
    if (!already && level.boss && worldDone) html += '<p class="win-rank">You earned the <b>' + esc(theme().worlds[level.world - 1]) + "</b> world badge.</p>";
    if (!already && after === MAX_XP) html += '<p class="win-rank">You finished every level in Python Quest. Legendary!</p>';
    html += '<div class="modal-actions">';
    html += '<button class="btn btn-ghost" data-act="map">Back to map</button>';
    if (next) html += '<button class="btn" data-act="next">Next: ' + esc(tpl(next.title)) + " →</button>";
    html += "</div></div>";
    setTimeout(() => openModal(html, {
      map: () => { closeModal(); renderMap(); show("map"); },
      next: () => { closeModal(); openLevel(next.id); }
    }), level.type === "predict" ? 900 : 500);
  }

  // ---------------------------------------------------------------- modals
  let modalActions = {};
  function openModal(html, actions) {
    $("modal-body").innerHTML = html; modalActions = actions || {};
    $("modal").hidden = false;
    const first = $("modal-body").querySelector("[data-act]:last-of-type, button");
    if (first) first.focus();
  }
  function closeModal() { $("modal").hidden = true; }
  $("modal-x").onclick = closeModal;
  $("modal").addEventListener("click", (e) => {
    if (e.target === $("modal")) return closeModal();
    const a = e.target.closest("[data-act]");
    if (a && modalActions[a.dataset.act]) modalActions[a.dataset.act](a);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("modal").hidden) closeModal(); });

  $("btn-board").onclick = async () => {
    const mine = (b) => b.filter((r) => String(r.period) === String(player.period));
    openModal('<h2 id="modal-title">Leaderboard</h2><div class="tabs"><button class="tab on" data-act="period">Period ' + esc(player.period) +
      '</button><button class="tab" data-act="all">Everyone</button></div><div id="board-list" class="board-list"><p class="muted">Loading…</p></div>', {
      period: (b) => { setTab(b); drawBoard("period"); },
      all: (b) => { setTab(b); drawBoard("all"); }
    });
    let data = null;
    function setTab(b) { document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t === b)); }
    function drawBoard(which) {
      const box = $("board-list"); if (!box) return;
      let rows, note = "";
      if (data) rows = which === "all" ? data : mine(data);
      else {
        rows = Object.values(profiles).map((p) => ({ name: p.name, period: p.period, xp: xpOf(p), levels: Object.keys(p.done).length }));
        if (which === "period") rows = mine(rows);
        note = PQ.sync.enabled ? "Couldn't reach the class leaderboard, so this shows players on this computer."
                               : "Your teacher hasn't connected the class leaderboard yet, so this shows players on this computer.";
      }
      rows = rows.slice().sort((a, b) => b.xp - a.xp).slice(0, 20);
      box.innerHTML = "";
      if (note) box.append(el("p", "muted", note));
      if (!rows.length) { box.append(el("p", "muted", "No one here yet. Be the first!")); return; }
      const ol = el("ol", "lb");
      rows.forEach((r, i) => {
        const li = el("li", r.name === player.name && String(r.period) === String(player.period) ? "me" : "");
        li.append(el("span", "lb-pos", String(i + 1)), el("span", "lb-name", r.name),
                  el("span", "lb-per", which === "all" ? "P" + r.period : ""), el("span", "lb-lv", r.levels + " levels"), el("b", "lb-xp", r.xp + " XP"));
        ol.append(li);
      });
      box.append(ol);
    }
    data = await PQ.sync.board();
    drawBoard("period");
  };

  $("btn-turnin").onclick = () => {
    const code = PQ.makeCode(summary(player));
    const s = summary(player);
    openModal('<h2 id="modal-title">Turn in your progress</h2>' +
      "<p>" + (PQ.sync.enabled ? "Your progress saves to your class automatically. If your teacher asks for a code, copy this one."
                                : "Copy this code and paste it wherever your teacher asks (an assignment, a form or an email).") + "</p>" +
      '<p class="turnin-sum"><b>' + esc(player.name) + "</b> · Period " + esc(player.period) + " · " + s.levels + " levels · " + s.xp + " XP</p>" +
      '<textarea class="turnin-code" id="turnin-code" readonly rows="4"></textarea>' +
      '<div class="modal-actions"><span class="copy-msg" id="copy-msg"></span><button class="btn" data-act="copy">Copy code</button></div>', {
      copy: () => {
        const t = $("turnin-code"); t.select();
        const done = () => { $("copy-msg").textContent = "Copied!"; };
        if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, () => { try { document.execCommand("copy"); done(); } catch (e) {} });
        else { try { document.execCommand("copy"); done(); } catch (e) {} }
      }
    });
    $("turnin-code").value = code;
  };

  $("btn-theme").onclick = () => {
    let html = '<h2 id="modal-title">Change adventure</h2><p>Your progress stays the same. Only the story changes.</p><div class="theme-picks">';
    Object.keys(THEMES).forEach((k) => {
      const t = THEMES[k];
      html += '<button class="theme-card" data-quest="' + k + '" data-act="pick" data-k="' + k + '" aria-checked="' + (player.theme === k) + '">' +
        '<span class="theme-glyph" aria-hidden="true">' + t.glyph.hero + "</span><b>" + esc(t.name) + "</b><span>" + esc(t.pitch) + "</span></button>";
    });
    openModal(html + "</div>", {
      pick: (b) => { player.theme = b.dataset.k; saveProfiles(); applyTheme(); closeModal(); renderMap(); pushProgress(); }
    });
  };

  $("btn-back").onclick = () => { renderMap(); show("map"); };
  $("btn-logo").onclick = () => renderSignin();

  window.addEventListener("resize", () => { if (level && level.type === "grid" && !$("screen-level").hidden && !running) renderBoard(); });

  // ---------------------------------------------------------------- boot
  function boot() {
    const L = $("loading");
    if (!PQ.pythonReady()) { L.textContent = "Python couldn't load. Check that the vendor folder was uploaded, then refresh."; L.classList.add("loading-err"); }
    else L.hidden = true;
    const cur = store.get("pq.current", null);
    if (cur && profiles[cur]) signIn(profiles[cur]);
    else renderSignin();
  }
  boot();
})();
