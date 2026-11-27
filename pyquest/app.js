import { STR, fmt } from "./i18n.js";
import { LEVELS, SNIPPETS } from "./lessons.js";
import { GAME_TYPES, ensureLevel, markerRe, langPick } from "./games.js";
import { UNIT, CONCEPTS, BADGES, SHOP, HINT_COST, isUnlocked, mastery, levelFor } from "./curriculum.js";
import { spriteSVG, GUIDES } from "./sprites.js";
import { SLIDES, PICS } from "./slides.js";

// ---------- state & helpers ----------
const S = { me: null, progress: {}, locks: [], notes: [], game: null, className: "", lang: "en", status: null };
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const t = (k, ...a) => fmt(STR[S.lang]?.[k] ?? STR.en[k] ?? k, ...a);
const tx = (o) => (o && (o[S.lang] ?? o.en)) || "";
const obj = (k) => STR[S.lang]?.[k] || STR.en[k] || {};   // for nested string tables (guides, skins, tips)
const main = $("#main");
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
// Local testing only: ?pyodide=http://localhost:PORT/ serves Pyodide from a local copy.
const qp = new URLSearchParams(location.search).get("pyodide");
if (qp) store.set("pq-pyodide", qp);
const LOCAL_PY = location.hostname === "localhost" ? store.get("pq-pyodide") : null;

// The API may be on another site (see config.js), so the session is a token the app keeps and sends.
const API = String(window.PQ_CONFIG?.api || "").replace(/\/$/, "");
const authHeaders = () => { const tok = store.get("pq-token"); return tok ? { authorization: "Bearer " + tok } : {}; };
async function api(method, path, body) {
  const res = await fetch(API + path, { method, headers: { ...authHeaders(), ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, credentials: API ? "omit" : "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (data.token) store.set("pq-token", data.token);
  if (res.status === 401 && S.me && path !== "/api/login") { S.me = null; go("login"); throw new Error("signed_out"); }
  if (!res.ok) throw Object.assign(new Error(data.error || "error"), { data, status: res.status });
  return data;
}
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("show"), 2600); }
const go = (h) => { if (location.hash !== "#" + h) location.hash = h; else render(); };
const avatarHTML = (av, size = 44) => `<span class="avatar" style="background:${/^#[0-9a-f]{6}$/i.test(av?.color || "") ? av.color : "#ff6b4a"};width:${size}px;height:${size}px">${spriteSVG(av?.sprite || "ship", Math.round(size * 0.7))}</span>`;
const item = (id) => UNIT.find((u) => u.id === id);
const statusOf = (id) => S.progress[id]?.status;
const isDone = (id) => ["done", "skipped"].includes(statusOf(id));
const unlocked = (id) => isUnlocked(id, S.progress, S.locks);
const currentId = () => UNIT.find((u) => u.kind !== "side" && !isDone(u.id))?.id || "mygame";

function applyLook() {
  const u = S.me || {};
  document.body.dataset.skin = u.skin || "space";
  const a = u.a11y || {};
  document.body.classList.toggle("a11y-font", !!a.font);
  document.body.classList.toggle("a11y-spacing", !!a.spacing);
  document.body.classList.toggle("a11y-contrast", !!a.contrast);
  document.body.classList.toggle("a11y-motion", !!a.motion);
  document.documentElement.lang = S.lang;
}

// ---------- modal ----------
function openModal(html, { wide = false, onClose } = {}) {
  const m = $("#modal");
  m.innerHTML = `<div class="box ${wide ? "wide" : ""}">${html}</div>`;
  m.hidden = false;
  const close = () => { m.hidden = true; m.innerHTML = ""; onClose?.(); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  m.onclick = (e) => { if (e.target === m || e.target.closest("[data-close]")) close(); };
  setTimeout(() => (m.querySelector("[autofocus]") || m.querySelector("button, input, a"))?.focus(), 30);
  return { el: m, close };
}
function confetti() {
  if (S.me?.a11y?.motion || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("div"); c.className = "confetti";
  const cols = ["#ffd23f", "#ff6b4a", "#3fd0c9", "#ff7aa8", "#4ee08a"];
  c.innerHTML = Array.from({ length: 70 }, (_, i) => `<i style="left:${Math.random() * 100}%;background:${cols[i % 5]};animation-delay:${Math.random() * 0.6}s;animation-duration:${1.4 + Math.random()}s"></i>`).join("");
  document.body.appendChild(c); setTimeout(() => c.remove(), 3200);
}

// ---------- read aloud (built-in speech, works on Chromebooks, iPads and laptops) ----------
const speech = "speechSynthesis" in window;
function speak(text, btn) {
  if (!speech) return;
  if (speechSynthesis.speaking) { speechSynthesis.cancel(); if (btn) btn.textContent = "🔊 " + t("readAloud"); return; }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = S.lang === "es" ? "es-US" : "en-US"; u.rate = 0.95;
  u.onend = () => { if (btn) btn.textContent = "🔊 " + t("readAloud"); };
  if (btn) btn.textContent = "■ " + t("stopReading");
  speechSynthesis.speak(u);
}

// ---------- concept slides (shown the first time a level opens; reopen any time) ----------
const slidesKey = (id) => `pq-slides-${S.me?.id}-${id}`;
function showSlides(id, { onDone } = {}) {
  const deck = SLIDES[id];
  if (!deck) return;
  store.set(slidesKey(id), "1");
  let i = 0, picked = null;
  const L = levelData(id), guideName = obj("guides")[S.me.skin];
  const { el, close } = openModal(`<div class="slides" role="region" aria-roledescription="${esc(t("slides"))}" aria-labelledby="modal-title"><div id="slide"></div></div>`, { wide: true, onClose: () => { speech && speechSynthesis.cancel(); document.removeEventListener("keydown", onKey); onDone?.(); } });
  const onKey = (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
  };
  document.addEventListener("keydown", onKey);
  const move = (d) => { const n = i + d; if (n < 0 || n >= deck.length) return; speech && speechSynthesis.cancel(); i = n; picked = null; draw(); };
  const draw = () => {
    const s = deck[i], last = i === deck.length - 1;
    const code = s.code ? (typeof s.code === "string" ? s.code : tx(s.code)) : "";
    $("#slide", el).innerHTML = `
      <div class="row"><span class="chip">📖 ${esc(tx(L.title))}</span><span class="spacer"></span><span class="small muted">${t("slideOf", i + 1, deck.length)}</span>
        <button type="button" class="btn ghost small" data-close>✕ ${t("close")}</button></div>
      <div class="dots" aria-hidden="true">${deck.map((_, j) => `<i class="${j === i ? "on" : j < i ? "past" : ""}"></i>`).join("")}</div>
      <h2 id="modal-title">${esc(tx(s.title))}</h2>
      ${s.quiz ? `<p class="lead">${esc(tx(s.q))}</p>
        <div class="quiz" role="group" aria-label="${esc(tx(s.q))}">${s.options.map((o, j) => `<button type="button" class="btn ${picked === null ? "" : j === s.answer ? "go" : j === picked ? "bad" : ""}" data-j="${j}" ${picked !== null ? "disabled" : ""}><code>${esc(tx(o))}</code></button>`).join("")}</div>
        <div aria-live="polite">${picked === null ? "" : `<div class="result ${picked === s.answer ? "good" : "bad"}"><b>${picked === s.answer ? t("quizRight") : t("quizWrong")}</b> ${esc(tx(s.why))}</div>`}</div>`
      : `<div class="slidebody">${s.pic ? `<div class="pic">${PICS[s.pic](S.lang)}</div>` : ""}<div>
          <div class="guide">${spriteSVG(GUIDES[S.me.skin], 44, guideName)}<div class="bubble">${esc(tx(s.body))}</div></div>
          ${code ? `<pre class="code">${esc(code)}</pre>` : ""}</div></div>`}
      <div class="row">
        <button class="btn ghost" id="sprev" ${i === 0 ? "disabled" : ""}>← ${t("back")}</button>
        ${speech ? `<button class="btn ghost small" id="sread">🔊 ${t("readAloud")}</button>` : ""}
        <span class="spacer"></span>
        ${last ? `<button class="btn go" data-close id="sdone" autofocus>${t("startCoding")} →</button>` : `<button class="btn primary" id="snext" autofocus>${t("next")} →</button>`}
      </div>`;
    $("#sprev", el).onclick = () => move(-1);
    $("#snext", el)?.addEventListener("click", () => move(1));
    $$(".quiz button", el).forEach((b) => (b.onclick = () => { picked = +b.dataset.j; draw(); }));
    $("#sread", el)?.addEventListener("click", (e) => speak(s.quiz ? tx(s.q) + ". " + s.options.map((o) => tx(o)).join(". ") : tx(s.title) + ". " + tx(s.body), e.currentTarget));
    ($("#snext", el) || $("#sdone", el))?.focus();
  };
  draw();
  return close;
}

// ---------- the sandboxed Python game runner ----------
class Runner {
  constructor(host) {
    this.handlers = {}; this.queue = []; this.ready = false; this.pending = new Map();
    this.frame = document.createElement("iframe");
    this.frame.className = "gameframe";
    this.frame.title = "Game screen";
    this.frame.setAttribute("sandbox", "allow-scripts");
    this.frame.src = "runner.html" + (LOCAL_PY ? "?pyodide=" + encodeURIComponent(LOCAL_PY) : "");
    host.appendChild(this.frame);
    this.onMsg = (e) => {
      if (e.source !== this.frame.contentWindow || e.data?.src !== "pq-runner") return;
      const m = e.data;
      if (m.type === "ready") { this.ready = true; this.queue.splice(0).forEach((q) => this.post(q)); }
      if (m.id && this.pending.has(m.id) && (m.type === "checked" || m.type === "error" || m.type === "started" || m.type === "snap")) {
        this.pending.get(m.id)(m); this.pending.delete(m.id);
      }
      this.handlers[m.type]?.forEach((f) => f(m));
    };
    addEventListener("message", this.onMsg);
  }
  on(type, fn) { (this.handlers[type] ||= []).push(fn); return this; }
  post(m) { this.frame.contentWindow?.postMessage({ ...m, lang: S.lang }, "*"); }
  send(m) { this.ready ? this.post(m) : this.queue.push(m); }
  request(m) { const id = Math.random().toString(36).slice(2); return new Promise((res) => { this.pending.set(id, res); this.send({ ...m, id }); }); }
  run(code) { return this.request({ type: "run", code }); }
  snapshot(code) { return this.request({ type: "snapshot", code }); }
  check(code, check) { return this.request({ type: "check", code, check }); }
  stop() { this.send({ type: "stop" }); }
  key(key, down) { this.send({ type: "key", key, down }); }
  destroy() { removeEventListener("message", this.onMsg); this.frame.remove(); }
}
let activeRunner = null;
const KEYS = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", " ": "space" };
const typing = (el) => el && (el.closest(".CodeMirror") || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
addEventListener("keydown", (e) => { if (activeRunner && KEYS[e.key] && !typing(document.activeElement)) { e.preventDefault(); if (!e.repeat) activeRunner.key(KEYS[e.key], true); } });
addEventListener("keyup", (e) => { if (activeRunner && KEYS[e.key]) activeRunner.key(KEYS[e.key], false); });

function padHTML() {
  const names = obj("keys");
  return `<div class="pad" role="group" aria-label="${esc(t("gameControls"))}">${[["left", "◀"], ["up", "▲"], ["space", "●"], ["down", "▼"], ["right", "▶"]]
    .map(([k, l]) => `<button type="button" data-key="${k}"><span aria-hidden="true">${l}</span><small>${esc(names[k] || k)}</small></button>`).join("")}</div>`;
}
function wirePad(root, runner) {
  $$(".pad button", root).forEach((b) => {
    const k = b.dataset.key;
    const down = (e) => { e.preventDefault(); b.classList.add("on"); runner.key(k, true); };
    const up = () => { b.classList.remove("on"); runner.key(k, false); };
    b.addEventListener("pointerdown", down); ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, up));
  });
}

// ---------- code editor (CodeMirror when available, plain textarea otherwise) ----------
function makeEditor(host, code, { onChange, readOnly = false } = {}) {
  if (window.CodeMirror) {
    const cm = CodeMirror(host, {
      value: code, mode: "python", lineNumbers: true, indentUnit: 4, tabSize: 4, readOnly, inputStyle: "contenteditable",
      extraKeys: { Tab: (c) => c.replaceSelection("    "), "Shift-Tab": "indentLess" }, lineWrapping: false, screenReaderLabel: "Python code",
    });
    let marked = null;
    cm.on("change", () => { if (marked !== null) { cm.removeLineClass(marked, "background", "errline"); marked = null; } onChange?.(cm.getValue()); });
    setTimeout(() => cm.refresh(), 50);
    return {
      get: () => cm.getValue(), set: (v) => cm.setValue(v), focus: () => cm.focus(),
      goto: (line) => setTimeout(() => { cm.scrollIntoView({ line: Math.max(0, line - 1), ch: 0 }, 20); cm.scrollTo(null, cm.heightAtLine(Math.max(0, line - 2), "local")); }, 60),
      insert: (s) => { cm.replaceSelection(s); cm.focus(); },
      mark: (line) => { if (marked !== null) cm.removeLineClass(marked, "background", "errline"); marked = line - 1; cm.addLineClass(marked, "background", "errline"); cm.scrollIntoView({ line: marked, ch: 0 }, 80); },
    };
  }
  const ta = document.createElement("textarea");
  ta.className = "code"; ta.value = code; ta.spellcheck = false; ta.readOnly = readOnly; ta.setAttribute("aria-label", "Python code");
  ta.setAttribute("autocapitalize", "off"); ta.setAttribute("autocomplete", "off");
  ta.addEventListener("input", () => onChange?.(ta.value));
  ta.addEventListener("keydown", (e) => { if (e.key === "Tab") { e.preventDefault(); ta.setRangeText("    ", ta.selectionStart, ta.selectionEnd, "end"); onChange?.(ta.value); } });
  host.appendChild(ta);
  return {
    get: () => ta.value, set: (v) => (ta.value = v), focus: () => ta.focus(),
    goto: (line) => { ta.scrollTop = Math.max(0, (line - 2) * 24); },
    insert: (s) => { ta.setRangeText(s, ta.selectionStart, ta.selectionEnd, "end"); ta.focus(); onChange?.(ta.value); },
    mark: (line) => { const lines = ta.value.split("\n"); const start = lines.slice(0, line - 1).join("\n").length + (line > 1 ? 1 : 0); ta.focus(); ta.setSelectionRange(start, start + (lines[line - 1] || "").length); },
  };
}
// Turn `code` in friendly messages into <code> safely.
const rich = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");

// ---------- header ----------
function header(active) {
  const h = $("#top");
  if (!S.me) { h.hidden = true; return; }
  h.hidden = false;
  const u = S.me, inLevel = u.xp % 100;
  const links = u.role === "teacher"
    ? [["teacher", t("dashboard")], ["arcade", t("arcade")]]
    : [["map", t("map")], ["arcade", t("arcade")], ["shop", t("shop") + " · " + t("me")]];
  h.innerHTML = `
    <a class="brand" href="#${u.role === "teacher" ? "teacher" : "map"}">${spriteSVG(GUIDES[u.skin] || "robot", 30)}<span>${t("appName")}</span></a>
    <nav class="nav" aria-label="Main">${links.map(([k, l]) => `<a href="#${k}" ${active === k ? 'aria-current="page"' : ""}>${esc(l)}</a>`).join("")}</nav>
    <div class="hud">
      ${u.role === "student" ? `
      <span class="chip" title="${t("level")}">${t("level")} ${u.level}</span>
      <span class="xpbar" role="meter" aria-label="${t("xp")}" aria-valuenow="${inLevel}" aria-valuemin="0" aria-valuemax="100"><i style="width:${inLevel}%"></i></span>
      <span class="chip">${u.xp} ${t("xp")}</span>
      <span class="chip">${spriteSVG("coin", 18)} ${u.coins}</span>` : `<span class="chip">${esc(u.name)}</span>`}
      ${avatarHTML(u.avatar, 40)}
      <button class="btn ghost small" id="lang">${S.lang === "en" ? "Español" : "English"}</button>
      <button class="btn ghost small" id="out">${t("signOut")}</button>
    </div>`;
  $("#out", h).onclick = async () => { await api("POST", "/api/logout", {}).catch(() => {}); try { localStorage.removeItem("pq-token"); } catch {} S.me = null; go("login"); };
  $("#lang", h).onclick = async () => { S.lang = S.lang === "en" ? "es" : "en"; S.me.lang = S.lang; render(); api("PUT", "/api/profile", { lang: S.lang }).catch(() => {}); };
}

// ---------- world art ----------
function rng(seed) { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
function decor(skin, W, H) {
  const r = rng(7); let out = "";
  if (skin === "space") for (let i = 0; i < 90; i++) out += `<circle cx="${r() * W}" cy="${r() * H}" r="${r() * 1.8 + 0.4}" fill="#fff" opacity="${0.3 + r() * 0.6}"/>`;
  if (skin === "fantasy") for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H; out += `<path d="M${x} ${y} q12 -8 24 0 t24 0" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"/>`; }
  if (skin === "arcade") {
    for (let x = 0; x < W; x += 50) out += `<line x1="${x}" y1="${H * 0.62}" x2="${x * 1.6 - W * 0.3}" y2="${H}" stroke="#ff2e88" stroke-opacity=".25"/>`;
    for (let x = 0; x < W; x += 44) { const h = 40 + r() * 120; out += `<rect x="${x}" y="${H * 0.62 - h}" width="40" height="${h}" fill="#000" opacity=".25"/>`; }
  }
  if (skin === "ocean") {
    out += `<path d="M0 0 L${W * 0.2} 0 L${W * 0.45} ${H} L${W * 0.3} ${H}Z M${W * 0.55} 0 L${W * 0.7} 0 L${W * 0.9} ${H} L${W * 0.8} ${H}Z" fill="#fff" opacity=".05"/>`;
    for (let i = 0; i < 40; i++) out += `<circle cx="${r() * W}" cy="${r() * H}" r="${2 + r() * 6}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.5"/>`;
  }
  return out;
}
function nodeShape(skin, state, color) {
  const dim = state === "locked";
  const fill = dim ? "#3b4652" : color;
  if (skin === "fantasy") return `<ellipse cx="0" cy="22" rx="62" ry="20" fill="#fff" opacity=".18"/><ellipse cx="0" cy="14" rx="54" ry="24" fill="${dim ? "#6b6b5e" : "#f4d58d"}"/><path d="M-38 10 Q-20 -40 0 -36 Q26 -40 40 10Z" fill="${fill}"/>`;
  if (skin === "arcade") return `<rect x="-42" y="-44" width="84" height="88" rx="10" fill="${fill}"/><rect x="-32" y="-34" width="64" height="40" rx="6" fill="#000" opacity=".45"/>${[0, 1, 2].map((i) => `<rect x="${-30 + i * 22}" y="14" width="16" height="16" rx="3" fill="#fff" opacity="${dim ? 0.15 : 0.5}"/>`).join("")}`;
  if (skin === "ocean") return `<path d="M-50 40 Q-48 -30 0 -44 Q48 -30 50 40Z" fill="${fill}"/><circle cx="-16" cy="-18" r="8" fill="#fff" opacity=".35"/><path d="M-60 44 q8 -30 0 -60 M60 44 q-8 -30 0 -60" stroke="#2ecc71" stroke-width="6" fill="none" opacity="${dim ? 0.3 : 0.8}"/>`;
  return `<ellipse cx="0" cy="0" rx="66" ry="16" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4" transform="rotate(-14)"/><circle r="44" fill="${fill}"/><circle cx="-14" cy="-14" r="16" fill="#fff" opacity=".18"/>`;
}
const POS = { l1: [140, 500], l2: [270, 400], l3: [170, 240], l4: [380, 140], l5: [560, 250], side1: [560, 470], l6: [740, 150], boss: [880, 300], mygame: [860, 500] };
const NODE_COL = ["#ff6b4a", "#3fd0c9", "#ffd23f", "#ff7aa8", "#7bed9f", "#a29bfe", "#48dbfb", "#ff4757", "#ff9f43"];

function mapSVG() {
  const W = 1000, H = 640, skin = S.me.skin, cur = currentId();
  const main = UNIT.filter((u) => u.kind !== "side").map((u) => POS[u.id]);
  let d = `M${main[0][0]} ${main[0][1]}`;
  for (let i = 1; i < main.length; i++) { const [x0, y0] = main[i - 1], [x1, y1] = main[i]; d += ` C${x0 + (x1 - x0) * 0.5} ${y0}, ${x0 + (x1 - x0) * 0.5} ${y1}, ${x1} ${y1}`; }
  const nodes = UNIT.map((u, i) => {
    const [x, y] = POS[u.id], st = isDone(u.id) ? "done" : unlocked(u.id) ? (u.id === cur ? "current" : "open") : "locked";
    const title = levelTitle(u.id), num = UNIT.filter((v) => v.kind === "lesson").indexOf(u) + 1;
    const center = u.kind === "boss" ? spriteSVG("bugbeast", 56).replace("<svg", '<svg x="-28" y="-30"')
      : u.kind === "build" ? spriteSVG("cabinet", 56).replace("<svg", '<svg x="-28" y="-30"')
      : u.kind === "side" ? spriteSVG("rock", 40).replace("<svg", '<svg x="-20" y="-22"')
      : `<text text-anchor="middle" y="12" font-family="Fredoka" font-weight="700" font-size="36" fill="#fff" stroke="rgba(0,0,0,.35)" stroke-width="3" paint-order="stroke">${num}</text>`;
    const sub = st === "done" ? (statusOf(u.id) === "skipped" ? t("skipped") : "★ " + t("done")) : st === "locked" ? "🔒 " + t("locked") : u.kind === "side" ? t("sideQuest") : u.kind === "boss" ? t("boss") : u.kind === "build" ? t("build") : `+${u.xp} ${t("xp")}`;
    return `<g class="node ${st}" transform="translate(${x} ${y})" tabindex="0" role="link" aria-label="${esc(title)}, ${esc(sub)}" data-id="${u.id}">
      ${st === "current" ? `<circle class="ring" r="62" fill="none" stroke="var(--gold)" stroke-width="5"/>` : ""}
      ${nodeShape(skin, st, NODE_COL[i])}${center}
      ${st === "done" ? `<g transform="translate(34 -40)"><circle r="16" fill="var(--gold)"/><text text-anchor="middle" y="7" font-size="20" fill="#3a2a00">★</text></g>` : ""}
      <text class="label" text-anchor="middle" y="${u.kind === "side" ? 74 : 80}">${esc(title)}</text>
      <text class="sub" text-anchor="middle" y="${u.kind === "side" ? 94 : 100}">${esc(sub)}</text></g>`;
  }).join("");
  const [sx, sy] = POS.l5, [bx, by] = POS.side1;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("worldMap"))}">
    ${decor(skin, W, H)}
    <path d="${d}" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="18" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="var(--support)" stroke-opacity=".7" stroke-width="6" stroke-dasharray="2 16" stroke-linecap="round"/>
    <path d="M${sx} ${sy} Q${sx + 60} ${(sy + by) / 2} ${bx} ${by}" fill="none" stroke="var(--gold)" stroke-opacity=".6" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round"/>
    ${nodes}</svg>`;
}

function treeSVG(m) {
  const P = { variables: [150, 228], conditionals: [62, 160], loops: [238, 160], lists: [238, 88], functions: [100, 88], debugging: [168, 26] };
  const E = [["variables", "conditionals"], ["variables", "loops"], ["loops", "lists"], ["conditionals", "functions"], ["lists", "functions"], ["functions", "debugging"], ["conditionals", "debugging"]];
  const col = { beginning: "#55606b", developing: "var(--gold)", mastered: "var(--good)" };
  return `<svg class="tree" viewBox="0 -22 300 284" role="img" aria-label="${esc(t("skillTree"))}">
    ${E.map(([a, b]) => `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke="${m[a] !== "beginning" && m[b] !== "beginning" ? "var(--support)" : "rgba(255,255,255,.18)"}" stroke-width="5"/>`).join("")}
    ${CONCEPTS.map((c) => `<g transform="translate(${P[c.id][0]} ${P[c.id][1]})"><circle r="17" fill="${col[m[c.id]]}" stroke="rgba(0,0,0,.35)" stroke-width="3"/>
      ${m[c.id] === "mastered" ? `<text y="6" text-anchor="middle" font-size="16" fill="#062b16">★</text>` : ""}
      <text y="${c.id === "debugging" ? -22 : 32}" text-anchor="middle">${esc(tx(c))}</text><title>${esc(tx(c))}: ${t(m[c.id])}</title></g>`).join("")}
  </svg>
  <div class="row small" style="justify-content:center">${["beginning", "developing", "mastered"].map((k) => `<span class="chip"><span class="dot" style="background:${col[k]}"></span>${t(k)}</span>`).join("")}</div>`;
}

// ---------- pages ----------
async function pageLogin(mode = "login") {
  header();
  if (!S.status) S.status = await api("GET", "/api/status").catch(() => ({}));
  const art = `<svg class="scene" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${decor("space", 600, 500)}
    <circle cx="470" cy="120" r="70" fill="#ff6b4a"/><circle cx="445" cy="95" r="22" fill="#fff" opacity=".2"/><ellipse cx="470" cy="120" rx="110" ry="22" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="5" transform="rotate(-14 470 120)"/>
    <circle cx="120" cy="300" r="40" fill="#3fd0c9"/>
    ${spriteSVG("ship", 120).replace("<svg", '<svg x="250" y="210"')}${spriteSVG("star", 40).replace("<svg", '<svg x="200" y="120"')}${spriteSVG("star", 30).replace("<svg", '<svg x="380" y="300"')}${spriteSVG("coin", 34).replace("<svg", '<svg x="150" y="190"')}</svg>`;
  main.innerHTML = `<section class="login"><div class="art">${art}<h1>${t("appName")}</h1><p style="font-size:20px;max-width:30ch">${t("tagline")}</p></div>
    <form class="panel" id="f" autocomplete="on">
      ${mode === "setup" ? `<h2>${t("teacherSetup")}</h2>
        <label>${t("setupCode")}<input type="password" name="setupCode" required></label>
        <label>${t("yourName")}<input type="text" name="displayName" required maxlength="40" placeholder="Ms. Rivera"></label>
        <label>${t("className")}<input type="text" name="className" required maxlength="40" value="Period 1"></label>` : `<h2>${t("signIn")}</h2>`}
      <label>${t("username")}<input type="text" name="username" required autocomplete="username" autocapitalize="off" spellcheck="false"></label>
      <label>${t("password")}<input type="password" name="password" required autocomplete="${mode === "setup" ? "new-password" : "current-password"}" ${mode === "setup" ? 'minlength="8"' : ""}></label>
      <p class="result bad" id="err" hidden></p>
      <button class="btn primary" type="submit">${mode === "setup" ? t("createTeacher") : t("signIn")}</button>
      ${mode === "setup" ? `<a href="#login">${t("backToLogin")}</a>` : S.status?.needsSetup ? `<a href="#setup">${t("teacherSetup")}</a>` : ""}
      <button class="btn ghost small" type="button" id="lang">${S.lang === "en" ? "Español" : "English"}</button>
    </form></section>`;
  $("#lang").onclick = () => { S.lang = S.lang === "en" ? "es" : "en"; store.set("pq-lang", S.lang); render(); };
  $("#f").onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      await api("POST", mode === "setup" ? "/api/setup" : "/api/login", body);
      S.status = null; await loadMe(); go(S.me.role === "teacher" ? "teacher" : "map");
    } catch (err) {
      const el = $("#err"); el.hidden = false;
      el.textContent = err.message === "bad_login" ? t("badLogin") : err.message === "too_many_tries" ? t("tooMany", err.data?.retryMinutes || 10) : err.message.replace(/_/g, " ");
    }
  };
}

async function pageMap() {
  header("map");
  const m = mastery(S.progress);
  const cur = currentId(), L = { story: LEVELS[cur].story, title: levelData(cur).title };
  main.innerHTML = `<div class="home">
    <section>
      <div class="row hero" style="margin-bottom:12px">
        <div class="guide" style="flex:1 1 280px">${spriteSVG(GUIDES[S.me.skin], 56, obj("guides")[S.me.skin])}
          <div class="bubble"><b>${esc(obj("guides")[S.me.skin])}:</b> ${esc(tx(L.story)).split(". ")[0]}.</div></div>
        <a class="btn primary" href="#lesson-${cur}">${isDone(cur) ? t("continue") : S.progress[cur] ? t("continue") : t("start")}: ${esc(tx(L.title))}</a>
      </div>
      <h1 class="sr" style="font-size:28px">${t("worldMap")}</h1>
      <div class="mapwrap">${mapSVG()}</div>
    </section>
    <aside class="side">
      <section class="panel"><h2>${t("skillTree")}</h2>${treeSVG(m)}</section>
      <section class="panel"><h2>${t("weekly")}</h2><ol class="board" id="board"><li class="muted">…</li></ol><p class="small muted" id="myrank"></p></section>
      ${S.notes.filter((n) => !n.seen).length ? `<section class="panel"><h2>${t("teacherNote")}</h2>${S.notes.filter((n) => !n.seen).slice(0, 3).map((n) => `<p class="note">${esc(n.body)}</p>`).join("")}<button class="btn small" id="seen">OK</button></section>` : ""}
    </aside></div>`;
  $$(".node").forEach((n) => {
    const open = () => { if (n.classList.contains("locked")) return toast(t("locked")); go("lesson-" + n.dataset.id); };
    n.onclick = open; n.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
  });
  $("#seen")?.addEventListener("click", async () => { await api("POST", "/api/notes/seen", {}); S.notes.forEach((n) => (n.seen = 1)); pageMap(); });
  const lb = await api("GET", "/api/leaderboard").catch(() => null);
  if (!lb || !$("#board")) return;
  $("#board").innerHTML = lb.rows.map((r) => `<li class="${r.id === S.me.id ? "me" : ""}"><span class="rank">${r.rank}</span>${avatarHTML(r.avatar, 32)}<span>${esc(r.name)}</span><span class="pts">${r.weekXp} ${t("xp")}</span></li>`).join("") || `<li class="muted">—</li>`;
  if (lb.me && lb.me.rank > 5) $("#myrank").textContent = t("youAre", lb.me.rank, lb.total) + " · " + lb.me.weekXp + " " + t("xp");
}

// ---------- level content: the shared story + this student's own game type ----------
const gameType = () => GAME_TYPES[S.game?.template] || null;
function levelData(id) {
  const meta = LEVELS[id], g = gameType();
  if (id === "boss") {
    const b = (g || GAME_TYPES.platformer).boss;
    return { ...meta, inFile: false, check: b.check, fails: b.fails, hints: b.hints, starter: b.starter(langPick(S.lang)) };
  }
  const lv = g?.levels[id];
  return { ...meta, ...(lv || {}), title: lv?.title || meta.title, story: meta.story, inFile: true };
}
const levelTitle = (id) => tx(levelData(id).title);
const titleFromCode = (code) => (code.match(/^TITLE\s*=\s*["'](.+?)["']/m)?.[1] || "").slice(0, 40);
async function saveGameFile(extra = {}) {
  const g = S.game;
  const title = extra.title || titleFromCode(g.code) || g.title || "My Game";
  await api("PUT", "/api/game", { code: g.code, template: g.template, title });
  S.game.title = title;
}

// Level 1: choose the kind of game you'll build for the whole unit.
function pickGame(id, restarting = false) {
  header("map");
  main.innerHTML = `<div class="page">
    <div class="row"><a class="btn ghost small" href="#map">← ${t("map")}</a></div>
    <h1>${t("chooseGame")}</h1>
    <p class="muted" style="max-width:60ch">${t(restarting ? "changeGameWarn" : "chooseGameHelp")}</p>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">
      ${Object.values(GAME_TYPES).map((g) => `<button class="card" data-type="${g.id}" style="text-align:left;justify-items:start">
        ${spriteSVG(g.sprite, 56)}<h3 style="margin:4px 0 0">${esc(tx(g.name))}</h3><span class="small muted">${esc(tx(g.blurb))}</span></button>`).join("")}
    </div></div>`;
  $$("[data-type]").forEach((b) => (b.onclick = async () => {
    const template = b.dataset.type;
    // Build up to this level: earlier levels the student was skipped past get their worked answers.
    S.game = { ...(S.game || {}), template, code: ensureLevel("", template, id === "boss" ? "l6" : id, S.lang) };
    await saveGameFile({ title: tx(GAME_TYPES[template].name) });
    pageLesson(id);
  }));
}

function resetBlock(file, template, id) {
  const m = markerRe(id).exec(file);
  if (!m) return ensureLevel(file, template, id, S.lang);
  const after = file.slice(m.index + 1).search(/^# ===== /m);
  const end = after < 0 ? file.length : m.index + 1 + after;
  const start = id === "l1" ? 0 : m.index;
  let block = GAME_TYPES[template].levels[id].scaffold(langPick(S.lang));
  if (id !== "l1") block = block.replace(/^\n/, "");
  return file.slice(0, start) + block.replace(/\s*$/, "\n") + (end < file.length ? "\n" + file.slice(end) : "");
}

async function pageLesson(id) {
  const it = item(id);
  if (!it || !LEVELS[id]) return go("map");
  if (!unlocked(id) && !S.progress[id]) { toast(t("locked")); return go("map"); }
  if (id !== "boss" && !gameType()) return pickGame(id);
  header("map");
  const L = levelData(id), g = gameType() || GAME_TYPES.platformer;
  const row = S.progress[id] || { hints_used: 0, attempts: 0, status: "started" };
  let startCode;
  if (L.inFile) {
    // The student's one game file grows: add this level's block (and fill any gaps) the first time.
    const grown = ensureLevel(S.game.code || "", S.game.template, id, S.lang);
    if (grown !== S.game.code) { S.game.code = grown; saveGameFile().catch(() => {}); }
    startCode = grown;
  } else startCode = row.code || L.starter;
  const notes = S.notes.filter((n) => n.lesson_id === id);
  const guideName = obj("guides")[S.me.skin];
  main.innerHTML = `<div class="lesson">
    <section class="mission">
      <div class="row"><a class="btn ghost small" href="#map">← ${t("map")}</a><span class="chip">${it.kind === "boss" ? t("boss") : it.kind === "side" ? t("sideQuest") : it.kind === "build" ? t("build") : "+" + it.xp + " " + t("xp")}</span>${isDone(id) ? `<span class="chip">★ ${t("done")}</span>` : ""}
        <span class="chip">${spriteSVG(g.sprite, 18)} ${esc(tx(g.name))}</span></div>
      <h1 style="font-size:34px">${esc(tx(L.title))}</h1>
      ${it.kind === "boss" ? `<div class="boss" id="boss">${spriteSVG("bugbeast", 54)}<div style="flex:1"><div class="small"><b>${t("bossHealth")}</b> · <span id="bugs">${t("bugsLeft", isDone(id) ? 0 : L.bugs)}</span></div><div class="hp"><i id="hp" style="width:${isDone(id) ? 0 : 100}%"></i></div></div></div>` : ""}
      <div class="guide">${spriteSVG(GUIDES[S.me.skin], 52, guideName)}<div class="bubble"><b>${esc(guideName)}:</b> ${esc(tx(L.story))}</div></div>
      <div class="row">${SLIDES[id] ? `<button class="btn gold small" id="slidesbtn">📖 ${t("conceptSlides")}</button>` : ""}
        ${speech ? `<button class="btn ghost small" id="read">🔊 ${t("readAloud")}</button>` : ""}</div>
      <div class="panel"><h3>${t("goals")}</h3><ol class="goals">${L.goals[S.lang].map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
        ${L.inFile ? `<p class="small muted" style="margin:8px 0 0">${t("growsHere")}</p>` : ""}</div>
      ${notes.map((n) => `<div class="note"><b>${t("teacherNote")}:</b> ${esc(n.body)}</div>`).join("")}
      <div class="panel hints"><div class="row"><h3 style="margin:0">${t("hint")}s</h3><span class="spacer"></span><button class="btn gold small" id="hintbtn"></button></div><div id="hintlist"></div></div>
      ${id === "mygame" ? `<div class="panel" id="buildbox"></div>` : ""}
      ${id === "l1" ? `<button class="btn ghost small" id="changegame">${t("changeGame")}</button>` : ""}
      <div id="result" aria-live="polite"></div>
    </section>
    <section class="editor">
      <div class="snips" role="toolbar" aria-label="Insert code">${SNIPPETS.map((s, i) => `<button type="button" data-i="${i}" title="${esc(t("insertCode", s.label))}" aria-label="${esc(t("insertCode", s.label))}">${esc(s.label)}</button>`).join("")}</div>
      <div class="editbox" id="ed"></div>
      <div class="row">
        <button class="btn go" id="run">▶ ${t("run")}</button>
        <button class="btn" id="stop">■ ${t("stop")}</button>
        <button class="btn primary" id="check">✓ ${t("check")}</button>
        <span class="spacer"></span><span class="small muted" id="savestate"></span>
        <button class="btn ghost small" id="resetcode">↺ ${t("resetLevel")}</button>
      </div>
    </section>
    <section class="screen" aria-label="Game">
      <div id="frame"></div>
      <p class="small muted" style="margin:0">${t("touchHelp")}</p>
      ${padHTML()}
      <h3 style="margin:6px 0 0">${t("output")}</h3>
      <pre class="console" id="console" aria-live="polite"></pre>
    </section></div>`;

  // editor + autosave (the game file for normal levels, the boss's own code for the boss)
  let saveT = 0;
  const saveNow = async () => {
    clearTimeout(saveT); $("#savestate").textContent = t("saving");
    try {
      if (L.inFile) { S.game.code = ed.get(); await saveGameFile(); }
      else { const r = await api("PUT", "/api/progress/" + id, { event: "save", code: ed.get() }); S.progress[id] = { ...r.row, code: ed.get() }; }
      $("#savestate").textContent = t("saved");
    } catch {}
  };
  const ed = makeEditor($("#ed"), startCode, { onChange: () => { $("#savestate").textContent = ""; clearTimeout(saveT); saveT = setTimeout(saveNow, 1500); } });
  if (L.inFile) { const at = startCode.slice(0, markerRe(id).exec(startCode)?.index || 0).split("\n").length; ed.goto(at); }
  $$(".snips button").forEach((b) => (b.onclick = () => ed.insert(SNIPPETS[b.dataset.i].code)));
  $("#resetcode").onclick = () => {
    const { el, close } = openModal(`<h2 id="modal-title">↺ ${t("resetLevel")}</h2><p>${t(L.inFile ? "resetLevelHelp" : "resetBossHelp")}</p>
      <div class="row"><button class="btn primary" id="yes">OK</button><button class="btn ghost" data-close>${t("close")}</button></div>`);
    $("#yes", el).onclick = () => { ed.set(L.inFile ? resetBlock(ed.get(), S.game.template, id) : L.starter); saveNow(); close(); };
  };
  $("#changegame")?.addEventListener("click", () => {
    const { el, close } = openModal(`<h2 id="modal-title">${t("changeGame")}</h2><p>${t("changeGameWarn")}</p>
      <div class="row"><button class="btn primary" id="yes">${t("chooseGame")}</button><button class="btn ghost" data-close autofocus>${t("close")}</button></div>`);
    $("#yes", el).onclick = () => { close(); pickGame(id, true); };
  });

  // runner
  activeRunner?.destroy();
  const runner = activeRunner = new Runner($("#frame"));
  wirePad(main, runner);
  const con = $("#console");
  const print = (lines) => { con.textContent = (con.textContent + lines.join("\n") + "\n").split("\n").slice(-200).join("\n"); con.scrollTop = con.scrollHeight; };
  runner.on("print", (m) => print(m.lines)).on("fatal", () => showResult("bad", t("loadingPython")))
    .on("error", (m) => { if (m.during === "update") showError(m); })
    .on("gameover", (m) => print(["★ " + m.text]));
  const showResult = (cls, html) => { $("#result").innerHTML = `<div class="result ${cls}">${html}</div>`; };
  const showError = (m) => {
    showResult("bad", `${t("oops")} ${m.line ? `<span class="chip">${t("errorOnLine", m.line)}</span>` : ""}<br>${rich(m.message)}`);
    if (m.line) ed.mark(m.line);
    api("POST", "/api/errors", { lessonId: id, kind: m.kind }).catch(() => {});
  };
  const setBoss = (left) => {
    const hp = $("#hp"); if (!hp) return;
    const prev = parseFloat(hp.style.width);
    const pct = (left / L.bugs) * 100;
    hp.style.width = pct + "%"; $("#bugs").textContent = t("bugsLeft", left);
    if (pct < prev) { $("#boss").classList.remove("hit"); void $("#boss").offsetWidth; $("#boss").classList.add("hit"); }
  };
  const progressBody = (event) => (L.inFile ? { event } : { event, code: ed.get() });

  $("#run").onclick = async () => { con.textContent = ""; $("#result").innerHTML = ""; const r = await runner.run(ed.get()); if (r.type === "error") showError(r); saveNow(); };
  $("#stop").onclick = () => runner.stop();
  $("#check").onclick = async () => {
    con.textContent = ""; $("#check").disabled = true;
    try {
      const code = ed.get();
      saveNow();
      const r = await runner.check(code, L.check);
      api("PUT", "/api/progress/" + id, progressBody("attempt")).then((x) => (S.progress[id] = { ...S.progress[id], ...x.row })).catch(() => {});
      if (r.type === "error") { showError(r); if (it.kind === "boss") setBoss(L.bugs); return; }
      if (!r.ok) {
        if (it.kind === "boss") setBoss(r.extra ?? L.bugs);
        if (r.error) return showError(r.error);
        showResult("bad", `${t("notYet")} ${rich(tx(L.fails[r.fail]) || r.fail)}`);
        api("POST", "/api/errors", { lessonId: id, kind: "CheckFailed" }).catch(() => {});
        return;
      }
      if (it.kind === "boss") setBoss(0);
      showResult("good", t("passed"));
      const before = S.me.level;
      const res = await api("PUT", "/api/progress/" + id, progressBody("complete"));
      S.progress[id] = { ...S.progress[id], ...res.row }; S.me = res.user;
      celebrate(id, res, before);
      runner.run(code);
    } finally { $("#check").disabled = false; }
  };

  // hints
  const renderHints = () => {
    const used = S.progress[id]?.hints_used ?? row.hints_used;
    $("#hintlist").innerHTML = L.hints.slice(0, used).map((h) => {
      const [first, ...rest] = tx(h).split("\n");
      return `<div class="h">${esc(first)}${rest.length ? `<pre>${esc(rest.join("\n"))}</pre>` : ""}</div>`;
    }).join("");
    const b = $("#hintbtn");
    if (used >= L.hints.length) { b.disabled = true; b.textContent = t("noMoreHints"); return; }
    const cost = isDone(id) ? 0 : HINT_COST[used];
    b.textContent = `${used ? t("nextHint") : t("hint")} · ${cost ? t("hintCost", cost) : t("free")}`;
  };
  $("#hintbtn").onclick = async () => {
    const used = S.progress[id]?.hints_used ?? 0;
    if (isDone(id)) { S.progress[id] = { ...S.progress[id], hints_used: used + 1 }; return renderHints(); }
    const r = await api("PUT", "/api/progress/" + id, progressBody("hint"));
    S.progress[id] = { ...S.progress[id], ...r.row }; renderHints();
  };
  renderHints();
  $("#slidesbtn")?.addEventListener("click", () => showSlides(id, { onDone: () => $("#slidesbtn")?.focus() }));
  if (SLIDES[id] && !isDone(id) && !store.get(slidesKey(id))) showSlides(id, { onDone: () => ed.focus?.() });
  $("#read")?.addEventListener("click", (e) => speak(tx(L.story) + ". " + t("goals") + ": " + L.goals[S.lang].join(". "), e.currentTarget));

  if (id === "mygame") renderBuild(async (title) => { S.game.code = ed.get(); await saveGameFile({ title }); });
}

function renderBuild(saveGame) {
  const g = S.game || {};
  const link = g.share_token ? new URL("play.html?g=" + encodeURIComponent(g.share_token), location.href.split("#")[0]).href : "";
  $("#buildbox").innerHTML = `
    <label>${t("gameTitle")}<input type="text" id="gtitle" maxlength="40" value="${esc(titleFromCode(g.code || "") || g.title || "My Game")}"></label>
    <div class="row"><button class="btn" id="gsave">${t("save")}</button>
      <button class="btn ${g.published ? "ghost" : "gold"}" id="gpub">${g.published ? t("unpublish") : t("publish")}</button>
      ${g.published ? `<span class="chip">★ ${t("published")}</span>` : ""}</div>
    ${g.published && link ? `<label>${t("shareLink")}<span class="row"><input type="text" readonly value="${esc(link)}" id="glink" style="flex:1"><button class="btn small" id="gcopy">${t("copy")}</button></span></label>` : ""}
    <p class="small muted">${t("sprites")}: ${S.me.unlocked.map((s) => `<code>${esc(s)}</code>`).join(" ")}</p>`;
  $("#gsave").onclick = async () => { await saveGame($("#gtitle").value); toast(t("saved")); };
  $("#gpub").onclick = async () => {
    try {
      await saveGame($("#gtitle").value);
      const r = await api("POST", "/api/game/publish", { published: !S.game.published });
      S.game = { ...S.game, published: r.published, share_token: r.share_token };
      if (r.newBadges?.length) { confetti(); toast(t("newBadge") + " " + r.newBadges.map((b) => tx(BADGES.find((x) => x.id === b))).join(", ")); S.me.badges.push(...r.newBadges); }
      renderBuild(saveGame);
    } catch (e) { toast(e.message === "locked" ? t("locked") : e.message); }
  };
  $("#gcopy")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText($("#glink").value); toast(t("copied")); } catch { $("#glink").select(); } });
}

function celebrate(id, res, levelBefore) {
  confetti();
  const idx = UNIT.findIndex((u) => u.id === id);
  const next = UNIT.slice(idx + 1).find((u) => u.kind !== "side" && unlocked(u.id) && !isDone(u.id)) || UNIT.find((u) => unlocked(u.id) && !isDone(u.id));
  const badges = (res.newBadges || []).map((b) => BADGES.find((x) => x.id === b)).filter(Boolean);
  const { el, close } = openModal(`<div class="celebrate box" style="box-shadow:none;padding:0">
    ${spriteSVG(GUIDES[S.me.skin], 80)}
    <h2 id="modal-title">${t("passed")}</h2>
    ${res.reward ? `<div class="big">${t("xpEarned", res.reward.xp)}</div><div class="chip">${spriteSVG("coin", 18)} ${t("coinsEarned", res.reward.coins)}</div>` : ""}
    ${S.me.level > levelBefore ? `<p class="chip" style="font-size:18px">⬆ ${t("levelUp", S.me.level)}</p>` : ""}
    ${badges.map((b) => `<div class="badge"><div class="medal">★</div><b>${t("newBadge")} ${esc(tx(b))}</b><span class="small">${esc(S.lang === "es" ? b.desc_es : b.desc_en)}</span></div>`).join("")}
    <div class="row" style="justify-content:center">
      ${next ? `<button class="btn primary" id="nx" autofocus>${t("nextLesson")}: ${esc(levelTitle(next.id))}</button>` : ""}
      <button class="btn ghost" data-close>${t("close")}</button><a class="btn ghost" href="#map" data-close>${t("backToMap")}</a></div></div>`);
  header("map");
  $("#nx", el)?.addEventListener("click", () => { close(); go("lesson-" + next.id); });
}

async function pageShop() {
  header("shop");
  const u = S.me;
  const COLORS = ["#ff6b4a", "#3fd0c9", "#ffd23f", "#ff7aa8", "#7bed9f", "#a29bfe", "#48dbfb", "#2d3436"];
  main.innerHTML = `<div class="page">
    <section class="panel"><div class="row">${avatarHTML(u.avatar, 96)}<div><h1 style="font-size:34px;margin:0">${esc(u.name)}</h1><p class="muted" style="margin:0">${t("level")} ${u.level} · ${u.xp} ${t("xp")} · ${u.coins} ${t("coins")}</p></div></div></section>
    <section class="panel"><h2>${t("avatar")}</h2>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(72px,1fr))">${u.unlocked.map((s) => `<button class="card ${u.avatar.sprite === s ? "sel" : ""}" data-av="${esc(s)}" aria-pressed="${u.avatar.sprite === s}">${spriteSVG(s, 40)}<span class="small">${esc(s)}</span></button>`).join("")}</div>
      <div class="swatches" style="margin-top:12px">${COLORS.map((c, i) => `<label class="swatch"><button style="background:${c}" data-col="${c}" aria-pressed="${u.avatar.color === c}" aria-label="${esc(obj("colors")[i])}"></button><span class="small">${esc(obj("colors")[i])}</span></label>`).join("")}</div></section>
    <section class="panel"><h2>${t("world")}</h2><div class="grid">${["space", "fantasy", "arcade", "ocean"].map((k) => `<button class="card ${u.skin === k ? "sel" : ""}" data-skin="${k}" aria-pressed="${u.skin === k}">${spriteSVG(GUIDES[k], 48)}<b>${obj("skins")[k]}</b><span class="small muted">${obj("guides")[k]}</span></button>`).join("")}</div></section>
    <section class="panel"><h2>${t("sprites")}</h2><div class="grid">${SHOP.map((s) => {
      const own = u.unlocked.includes(s.id);
      return `<div class="card">${spriteSVG(s.id, 48)}<b>${esc(s.id)}</b>${own ? `<span class="chip">✓ ${t("owned")}</span>` : `<button class="btn gold small" data-buy="${s.id}" ${u.coins < s.price ? "disabled" : ""}>${t("buy")} · ${s.price} ${t("coins")}</button>`}</div>`;
    }).join("")}</div></section>
    <section class="panel"><h2>${t("badges")}</h2><div class="grid">${BADGES.map((b) => `<div class="badge ${u.badges.includes(b.id) ? "" : "off"}"><div class="medal">★</div><b>${esc(tx(b))}</b><span class="small muted">${esc(S.lang === "es" ? b.desc_es : b.desc_en)}</span></div>`).join("")}</div></section>
    <section class="panel"><h2>${t("settings")}</h2>
      <div class="toggle">${t("language")}<select id="lng" style="width:auto"><option value="en">English</option><option value="es" ${S.lang === "es" ? "selected" : ""}>Español</option></select></div>
      ${[["font", "dyslexia"], ["spacing", "spacing"], ["contrast", "contrast"], ["motion", "motion"]].map(([k, l]) => `<label class="toggle">${t(l)}<input type="checkbox" data-a11y="${k}" ${u.a11y[k] ? "checked" : ""}></label>`).join("")}
    </section></div>`;
  const save = async (patch) => { const r = await api("PUT", "/api/profile", patch); S.me = r.user; S.lang = S.me.lang; applyLook(); pageShop(); };
  $$("[data-av]").forEach((b) => (b.onclick = () => save({ avatar: { ...u.avatar, sprite: b.dataset.av } })));
  $$("[data-col]").forEach((b) => (b.onclick = () => save({ avatar: { ...u.avatar, color: b.dataset.col } })));
  $$("[data-skin]").forEach((b) => { if (b.tagName === "BUTTON") b.onclick = () => save({ skin: b.dataset.skin }); });
  $("#lng").onchange = (e) => save({ lang: e.target.value });
  $$("[data-a11y]").forEach((c) => (c.onchange = () => save({ a11y: { ...u.a11y, [c.dataset.a11y]: c.checked } })));
  $$("[data-buy]").forEach((b) => (b.onclick = async () => {
    try { const r = await api("POST", "/api/shop/buy", { item: b.dataset.buy }); S.me = r.user; confetti(); toast("✓ " + b.dataset.buy); pageShop(); }
    catch (e) { toast(e.message === "not_enough_coins" ? t("notEnough") : e.message); }
  }));
}

async function pageArcade() {
  header("arcade");
  main.innerHTML = `<div class="page"><h1>${t("classArcade")}</h1><div class="grid" id="games" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))"><p class="muted">…</p></div></div>`;
  const { games } = await api("GET", "/api/gallery");
  if (S.me.role === "student") api("GET", "/api/remix").then(({ remix }) => { if (remix && $("#games")) $("#games").insertAdjacentHTML("beforebegin", `<p><a class="btn gold" href="#remix">${t("openRemix")}: ${esc(remix.from_title)}</a></p>`); }).catch(() => {});
  $("#games").innerHTML = games.length ? games.map((g) => `<article class="cab"><div class="scr">${spriteSVG("cabinet", 64)}</div>
      <h3 style="margin:0">${esc(g.title)}</h3><div class="row small">${avatarHTML(g.avatar, 28)}<span>${esc(t("by", g.author))}</span><span class="spacer"></span><span class="muted">${esc(t("plays", g.plays))}</span></div>
      <button class="btn primary" data-play="${esc(g.id)}" data-mine="${g.mine ? 1 : 0}">▶ ${t("play")}</button></article>`).join("") : `<p class="muted">${t("noGames")}</p>`;
  $$("[data-play]").forEach((b) => (b.onclick = () => playGame(b.dataset.play, b.dataset.mine === "1")));
}

async function playGame(gameId, mine = false) {
  const g = await api("GET", "/api/gallery/" + encodeURIComponent(gameId));
  const prev = activeRunner;
  const { el } = openModal(`<div class="row"><h2 id="modal-title" style="margin:0">${esc(g.title)}</h2><span class="muted">${esc(t("by", g.author))}</span><span class="spacer"></span>${S.me.role === "student" && !mine ? `<button class="btn gold small" id="remixbtn">${t("remix")}</button>` : ""}<button class="btn ghost small" data-close>${t("close")}</button></div>
    <div id="gf" style="max-width:480px;width:100%;margin:0 auto"></div>${padHTML()}<pre class="console" id="gcon" style="height:70px"></pre>`, { onClose: () => { r.destroy(); activeRunner = prev; } });
  const r = new Runner($("#gf", el)); activeRunner = r; wirePad(el, r);
  r.on("print", (m) => { $("#gcon", el).textContent += m.lines.join("\n") + "\n"; }).on("error", (m) => { $("#gcon", el).textContent += "⚠ " + m.message + "\n"; });
  r.run(g.code);
  $("#remixbtn", el)?.addEventListener("click", () => {
    const { el: m, close } = openModal(`<h2 id="modal-title">${t("remix")}</h2><p>${esc(t("remixConfirm", g.title, g.author))}</p>
      <div class="row"><button class="btn primary" id="yes">${t("remix")}</button><button class="btn ghost" data-close>${t("close")}</button></div>`, { onClose: () => {} });
    $("#yes", m).onclick = async () => { await api("POST", "/api/remix", { gameId }); close(); go("remix"); };
  });
}

// ---------- Remix Lab: tinker with a copy of a classmate's game; your own game file is never touched ----------
async function pageRemix() {
  header("arcade");
  const { remix } = await api("GET", "/api/remix");
  if (!remix) { toast(t("noRemix")); return go("arcade"); }
  main.innerHTML = `<div class="lesson">
    <section class="mission">
      <div class="row"><a class="btn ghost small" href="#arcade">← ${t("arcade")}</a></div>
      <h1 style="font-size:34px">${t("remixLab")}</h1>
      <div class="note"><b>${esc(t("remixOf", remix.from_title, remix.from_author))}</b></div>
      <div class="panel"><p style="margin:0">${t("remixHelp")}</p></div>
      <div id="result" aria-live="polite"></div>
    </section>
    <section class="editor">
      <div class="snips" role="toolbar" aria-label="Insert code">${SNIPPETS.map((x, i) => `<button type="button" data-i="${i}" title="${esc(t("insertCode", x.label))}" aria-label="${esc(t("insertCode", x.label))}">${esc(x.label)}</button>`).join("")}</div>
      <div class="editbox" id="ed"></div>
      <div class="row"><button class="btn go" id="run">▶ ${t("run")}</button><button class="btn" id="stop">■ ${t("stop")}</button><span class="spacer"></span><span class="small muted" id="savestate"></span></div>
    </section>
    <section class="screen" aria-label="Game"><div id="frame"></div>${padHTML()}<pre class="console" id="console" aria-live="polite"></pre></section></div>`;
  let saveT = 0;
  const save = async () => { $("#savestate").textContent = t("saving"); await api("PUT", "/api/remix", { code: ed.get() }).catch(() => {}); $("#savestate").textContent = t("saved"); };
  const ed = makeEditor($("#ed"), remix.code, { onChange: () => { clearTimeout(saveT); saveT = setTimeout(save, 1500); } });
  $$(".snips button").forEach((b) => (b.onclick = () => ed.insert(SNIPPETS[b.dataset.i].code)));
  activeRunner?.destroy();
  const runner = activeRunner = new Runner($("#frame"));
  wirePad(main, runner);
  const con = $("#console");
  runner.on("print", (m) => { con.textContent += m.lines.join("\n") + "\n"; con.scrollTop = con.scrollHeight; })
    .on("error", (m) => { $("#result").innerHTML = `<div class="result bad">${t("oops")} ${m.line ? `<span class="chip">${t("errorOnLine", m.line)}</span>` : ""}<br>${rich(m.message)}</div>`; if (m.line) ed.mark(m.line); });
  $("#run").onclick = async () => { con.textContent = ""; $("#result").innerHTML = ""; if (!/^# Remix of /m.test(ed.get())) { $("#result").innerHTML = `<div class="result bad">${t("keepCredit")}</div>`; return; } const r = await runner.run(ed.get()); if (r.type === "error") runner.handlers.error[0](r); save(); };
  $("#stop").onclick = () => runner.stop();
  runner.run(remix.code);
}

// ---------- teacher dashboard ----------
const T = { tab: "progress", data: null, classId: null, at: 0, poll: 0 };
const ITEMS = UNIT.map((u, i) => ({ ...u, short: u.kind === "boss" ? "B" : u.kind === "side" ? "S" : u.kind === "build" ? "G" : String(UNIT.filter((v) => v.kind === "lesson").indexOf(u) + 1) }));
const isStuck = (p) => p && p.status === "started" && (p.attempts >= 4 || p.hints_used >= 3) && Date.now() - p.updated_at < 30 * 60e3;
const WORDS = ["star", "comet", "rocket", "pixel", "coral", "wave", "island", "dragon", "robot", "planet", "laser", "orbit"];
const genPw = () => WORDS[Math.floor(Math.random() * WORDS.length)] + (10 + Math.floor(Math.random() * 90));

async function loadTeacher() {
  T.classId ||= store.get("pq-teacher-class") || "";
  T.data = await api("GET", "/api/teacher/overview" + (T.classId ? "?class=" + encodeURIComponent(T.classId) : ""));
  T.classId = T.data.classId; T.at = Date.now();
  if (T.classId) store.set("pq-teacher-class", T.classId);
}
// Class names in the menu: numbered when two share a name, with each class's student count.
function classLabels(classes) {
  const seen = {}, count = {};
  classes.forEach((c) => (count[c.name] = (count[c.name] || 0) + 1));
  return Object.fromEntries(classes.map((c) => {
    seen[c.name] = (seen[c.name] || 0) + 1;
    return [c.id, c.name + (count[c.name] > 1 ? " #" + seen[c.name] : "")];
  }));
}
const allMode = () => T.classId === "all";
const nStu = (n) => (n === 1 ? t("oneStudent") : t("nStudents", n));
async function pageTeacher() {
  header("teacher");
  if (!T.data) await loadTeacher();
  const D = T.data, L = classLabels(D.classes);
  const total = D.classes.reduce((n, c) => n + c.students, 0);
  main.innerHTML = `<div class="page">
    <div class="row"><h1 style="margin:0">${t("dashboard")}</h1><span class="spacer"></span>
      <select id="cls" style="width:auto" aria-label="${t("className")}">
        ${D.classes.length > 1 ? `<option value="all" ${D.classId === "all" ? "selected" : ""}>${esc(t("allClasses"))} (${nStu(total)})</option>` : ""}
        ${D.classes.map((c) => `<option value="${esc(c.id)}" ${c.id === D.classId ? "selected" : ""}>${esc(L[c.id])} (${nStu(c.students)})</option>`).join("")}</select>
      <button class="btn small" id="addcls">+ ${t("addClass")}</button>

      <span class="chip"><span class="dot"></span>${t("live")} · <span id="ago">${t("updated", 0)}</span></span></div>
    <div class="tabs" role="tablist">${["progress", "allwork", "mastery", "errors", "students", "classes", "controls", "leaderboard"].map((k) => `<button role="tab" data-tab="${k}" aria-selected="${T.tab === k}">${t(k)}</button>`).join("")}</div>
    <section id="tab"></section></div>`;
  $$("[data-tab]").forEach((b) => (b.onclick = () => { T.tab = b.dataset.tab; pageTeacher(); }));
  $("#cls").onchange = async (e) => { T.classId = e.target.value; T.showPw = false; T.pw = null; await loadTeacher(); pageTeacher(); };
  $("#addcls").onclick = () => {
    const { el, close } = openModal(`<h2 id="modal-title">${t("addClass")}</h2><label>${t("className")}<input type="text" id="cn" maxlength="40" autofocus></label><div class="row"><button class="btn primary" id="ok">${t("create")}</button><button class="btn ghost" data-close>${t("close")}</button></div>`);
    $("#cn", el).insertAdjacentHTML("afterend", `<span class="small" id="cnerr" role="alert" style="color:var(--bad)"></span>`);
    $("#ok", el).onclick = async () => {
      const name = $("#cn", el).value.replace(/\s+/g, " ").trim();
      const taken = D.classes.some((c) => c.name.trim().toLowerCase() === name.toLowerCase());
      if (!name || taken) { $("#cnerr", el).textContent = name ? t("classNameTaken", name) : t("classNameEmpty"); $("#cn", el).focus(); return; }
      try { const r = await api("POST", "/api/teacher/classes", { name }); T.classId = r.id; close(); await loadTeacher(); pageTeacher(); }
      catch (e) { $("#cnerr", el).textContent = e.message === "class_name_taken" ? t("classNameTaken", name) : t("oops"); }
    };
  };
  ({ progress: tabProgress, allwork: tabAllWork, mastery: tabMastery, errors: tabErrors, students: tabStudents, classes: tabClasses, controls: tabControls, leaderboard: tabBoard })[T.tab]($("#tab"), D);
  clearInterval(T.poll);
  T.poll = setInterval(async () => {
    if (!location.hash.startsWith("#teacher")) return clearInterval(T.poll);
    const ago = $("#ago"); if (ago) ago.textContent = t("updated", Math.round((Date.now() - T.at) / 1000));
    if (document.visibilityState === "visible" && Date.now() - T.at > 20000 && $("#modal").hidden && !typing(document.activeElement) && T.tab !== "allwork" && T.tab !== "classes") { await loadTeacher().catch(() => {}); pageTeacher(); }
  }, 5000);
}
const whoHTML = (s) => `<span class="who">${avatarHTML(s.avatar, 30)}<b>${esc(s.name)}</b>${s.last_seen && Date.now() - s.last_seen < 120e3 ? `<span class="dot" title="${t("online")}"></span>` : ""}</span>`;
const classOf = (s) => (allMode() && s.class_id ? ` · ${esc(classLabels(T.data.classes)[s.class_id] || "")}` : "");

function tabProgress(el, D) {
  if (!D.students.length) { el.innerHTML = `<p class="panel">${t("noStudents")}</p>`; return; }
  const stuck = D.students.filter((s) => Object.values(s.progress).some(isStuck));
  el.innerHTML = `${stuck.length ? `<div class="result bad" style="margin:12px 0">${t("stuck")}: ${stuck.map((s) => esc(s.name)).join(", ")}</div>` : ""}
    <div class="panel scroll" style="margin-top:12px"><table><thead><tr><th>${t("student")}</th>${ITEMS.map((i) => `<th title="${esc(tx(LEVELS[i.id].title))}">${i.short}</th>`).join("")}<th class="num">${t("xp")}</th></tr></thead><tbody>
    ${D.students.map((s) => `<tr><td><button class="btn ghost small" data-stu="${esc(s.id)}">${whoHTML(s)}</button><br><span class="small muted">${GAME_TYPES[s.game_type] ? esc(tx(GAME_TYPES[s.game_type].name)) : "–"}${classOf(s)}</span>
      <br><button class="btn primary small" data-stu="${esc(s.id)}" style="margin-top:4px">👁 ${t("seeWork")}</button></td>${ITEMS.map((i) => {
      const p = s.progress[i.id]; const cls = !p ? "none" : isStuck(p) ? "stuck" : p.status;
      const lab = !p ? "–" : p.status === "done" ? "✓" : p.status === "skipped" ? "S" : "…";
      return `<td><span class="cell ${cls}" title="${esc(tx(LEVELS[i.id].title))}${p ? ` · attempts ${p.attempts} · hints ${p.hints_used}` : ""}">${lab}</span></td>`;
    }).join("")}<td class="num">${s.xp}</td></tr>`).join("")}</tbody></table></div>
    <p class="small muted">✓ ${t("done")} · … started · S ${t("skipped")} · <span class="cell stuck" style="width:auto;padding:0 6px">!</span> ${t("stuck")} (4+ tries or 3 hints)</p>`;
  $$("[data-stu]", el).forEach((b) => (b.onclick = () => studentDrawer(b.dataset.stu)));
}

function tabMastery(el, D) {
  const rows = D.students.map((s) => ({ s, m: mastery(s.progress) }));
  el.innerHTML = `<div class="row" style="margin-top:12px"><span class="spacer"></span><button class="btn gold small" id="csv">⬇ ${t("exportCsv")}</button></div>
  <div class="panel" style="margin-top:12px"><h2>${t("mastery")}</h2><div class="bars">${CONCEPTS.map((c) => {
    const n = rows.filter((r) => r.m[c.id] === "mastered").length, dv = rows.filter((r) => r.m[c.id] === "developing").length, tot = rows.length || 1;
    return `<div class="bar"><b>${esc(tx(c))} <span class="small muted">${c.csta}</span></b><span class="track" style="display:flex"><i style="width:${(n / tot) * 100}%;background:var(--good)"></i><i style="width:${(dv / tot) * 100}%;background:var(--gold)"></i></span><span class="num small">${n}/${rows.length}</span></div>`;
  }).join("")}</div></div>
  <div class="panel scroll" style="margin-top:12px"><table class="stack"><thead><tr><th>${t("student")}</th>${CONCEPTS.map((c) => `<th>${esc(tx(c))}</th>`).join("")}</tr></thead><tbody>
  ${rows.map(({ s, m }) => `<tr><td>${whoHTML(s)}</td>${CONCEPTS.map((c) => `<td data-l="${esc(tx(c))}"><span class="chip m-${m[c.id]}">${t(m[c.id])}</span></td>`).join("")}</tr>`).join("")}</tbody></table></div>
  <p class="small muted">${S.lang === "es" ? "Dominado: misiones del concepto terminadas con 0–1 pistas. Saltadas no cuentan." : "Mastered: the concept's missions finished with 0–1 hints. Skipped missions don't count."}</p>`;
  $("#csv", el).onclick = async () => {
    const res = await fetch(API + "/api/teacher/export.csv?class=" + encodeURIComponent(T.classId), { headers: authHeaders(), credentials: API ? "omit" : "same-origin" });
    if (!res.ok) return toast(t("oops"));
    const name = (res.headers.get("content-disposition") || "").match(/filename="([^"]+)"/)?.[1] || "pyquest.csv";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await res.blob()); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  };
}

function tabErrors(el, D) {
  const byKind = {};
  for (const e of D.errors) { const k = (byKind[e.kind] ||= { n: 0, students: 0, lessons: [] }); k.n += e.n; k.students = Math.max(k.students, e.students); if (e.lesson_id) k.lessons.push([e.lesson_id, e.n]); }
  const kinds = Object.entries(byKind).sort((a, b) => b[1].n - a[1].n), max = kinds[0]?.[1].n || 1;
  el.innerHTML = `<div class="panel" style="margin-top:12px"><h2>${t("errors")}</h2>${kinds.length ? `<div class="bars">${kinds.map(([k, v]) => `
    <div><div class="bar"><b>${esc(k)}</b><span class="track"><i style="width:${(v.n / max) * 100}%"></i></span><span class="num">${v.n}</span></div>
    <p class="small muted" style="margin:4px 0 8px">${t("times", v.n, v.students)} · ${v.lessons.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l, n]) => `${esc(tx(LEVELS[l]?.title))} (${n})`).join(", ")}<br>💡 ${esc(obj("tips")[k] || "")}</p></div>`).join("")}</div>` : `<p>${t("noErrors")}</p>`}</div>`;
}

function tabStudents(el, D) {
  const L = classLabels(D.classes);
  el.innerHTML = `<div class="panel" style="margin-top:12px"><h2>${t("addStudents")}</h2><p class="small muted">${t("addStudentsHelp")}</p>
    <label style="max-width:360px;margin-bottom:10px">${t("addToClass")}<select id="toclass">${D.classes.map((c) => `<option value="${esc(c.id)}" ${c.id === D.classId || (allMode() && c === D.classes[0]) ? "selected" : ""}>${esc(L[c.id])}</option>`).join("")}</select></label>
    <textarea id="bulk" rows="6" placeholder="${esc(t("sampleLine"))}" style="font-family:var(--code)"></textarea>
    <div class="row" style="margin-top:10px"><button class="btn primary" id="mk">${t("create")}</button><span class="spacer"></span>${D.students.length ? `<button class="btn ghost small" id="allcards">🖨 ${t("newPwAll")}</button>` : ""}</div><div id="mkres"></div></div>
    ${D.students.length ? `<div class="row" style="margin-top:12px"><button class="btn gold small" id="showpw" aria-pressed="${T.showPw ? "true" : "false"}">${T.showPw ? "🙈 " + t("hidePasswords") : "👁 " + t("showPasswords")}</button>
      ${T.showPw ? `<button class="btn small" id="printshown">🖨 ${t("printCards")}</button><span class="small muted">${t("passwordsVisible")}</span>` : ""}</div>` : ""}
    <div class="panel scroll" style="margin-top:12px"><h2 style="margin-top:0">${t("students")} (${D.students.length})</h2><table class="stack"><thead><tr><th>${t("student")}</th><th>${t("username")}</th><th>${t("className")}</th>${T.showPw ? `<th>${t("password")}</th>` : ""}<th class="num">${t("xp")}</th><th></th></tr></thead><tbody>
    ${D.students.length ? "" : `<tr><td colspan="5" class="muted">${t("noStudents")}</td></tr>`}
    ${D.students.map((s) => `<tr><td data-l="${t("student")}">${whoHTML(s)}</td><td data-l="${t("username")}"><code>${esc(s.username)}</code></td><td data-l="${t("className")}">${esc(L[s.class_id] || "")}</td>${T.showPw ? `<td data-l="${t("password")}">${T.pw?.[s.id] ? `<code>${esc(T.pw[s.id])}</code>` : `<span class="small muted">${t("resetToSee")}</span>`}</td>` : ""}<td class="num" data-l="${t("xp")}">${s.xp}</td>
      <td><div class="row"><button class="btn primary small" data-stu="${esc(s.id)}">👁 ${t("seeWork")}</button><button class="btn small" data-pw="${esc(s.id)}">${t("resetPw")}</button><button class="btn ghost small" data-del="${esc(s.id)}" data-name="${esc(s.name)}">${t("del")}</button></div></td></tr>`).join("")}
    </tbody></table></div>`;
  $("#mk").onclick = async () => {
    const students = $("#bulk").value.split("\n").map((l) => l.split(",").map((x) => x.trim())).filter((p) => p[0])
      .map(([username, name, password]) => ({ username, name: name || username, password: password || genPw() }));
    if (!students.length) return;
    const r = await api("POST", "/api/teacher/students", { classId: $("#toclass").value, students });
    const made = students.filter((s) => r.created.includes(s.username));
    $("#mkres").innerHTML = `<div class="result good" style="margin-top:10px">${t("created", r.created.length)}</div>
      ${made.length ? `<div class="scroll"><table><thead><tr><th>${t("student")}</th><th>${t("username")}</th><th>${t("password")}</th></tr></thead><tbody>${made.map((s) => `<tr><td>${esc(s.name)}</td><td><code>${esc(s.username)}</code></td><td><code>${esc(s.password)}</code></td></tr>`).join("")}</tbody></table></div>
      <p class="small muted">${S.lang === "es" ? "Copia o imprime esta lista ahora: las contraseñas no se vuelven a mostrar." : "Copy or print this list now — passwords aren't shown again."}</p>
      <button class="btn gold" id="printmade">🖨 ${t("printCards")}</button>` : ""}
      ${r.problems.length ? `<div class="result bad">${t("problems")} ${r.problems.map((p) => `${esc(p.username)} (${esc(p.error.replace(/_/g, " "))})`).join(", ")}</div>` : ""}`;
    $("#printmade")?.addEventListener("click", () => printCards(made));
    $("#bulk").value = ""; await loadTeacher();
    if (r.created.length) {           // redraw the list and class counts, keeping the new passwords on screen
      const keep = $("#mkres").innerHTML; await pageTeacher();
      $("#mkres").innerHTML = keep; $("#printmade")?.addEventListener("click", () => printCards(made));
    }
  };
  $("#showpw")?.addEventListener("click", async () => {
    if (T.showPw) { T.showPw = false; T.pw = null; return tabStudents(el, T.data); }
    try { T.pw = (await api("GET", "/api/teacher/passwords?class=" + encodeURIComponent(T.classId || "all"))).passwords; T.showPw = true; tabStudents(el, T.data); }
    catch { toast(t("oops")); }
  });
  $("#printshown")?.addEventListener("click", () => {
    const list = D.students.filter((x) => T.pw?.[x.id]).map((x) => ({ name: x.name, username: x.username, password: T.pw[x.id] }));
    const missing = D.students.length - list.length;
    if (missing) toast(t("cardsMissing", missing));
    if (list.length) printCards(list);
  });
  if ($("#allcards")) $("#allcards").onclick = () => {
    const { el: m, close } = openModal(`<h2 id="modal-title">${t("newPwAll")}</h2><p>${t("newPwAllHelp")}</p>
      <div class="row"><button class="btn primary" id="y">${t("newPwAll")}</button><button class="btn ghost" data-close autofocus>${t("close")}</button></div>`);
    $("#y", m).onclick = async () => {
      $("#y", m).disabled = true;
      const list = [];
      for (const st of D.students) {
        const password = genPw();
        await api("POST", `/api/teacher/students/${encodeURIComponent(st.id)}/password`, { password });
        list.push({ name: st.name, username: st.username, password });
      }
      close(); printCards(list);
    };
  };
  $$("[data-stu]", el).forEach((b) => (b.onclick = () => studentDrawer(b.dataset.stu)));
  $$("[data-pw]", el).forEach((b) => (b.onclick = () => resetPw(b.dataset.pw)));
  $$("[data-del]", el).forEach((b) => (b.onclick = () => {
    const { el: m, close } = openModal(`<h2 id="modal-title">${t("del")}</h2><p>${esc(t("confirmDel", b.dataset.name))}</p><div class="row"><button class="btn primary" id="y">${t("del")}</button><button class="btn ghost" data-close autofocus>${t("close")}</button></div>`);
    $("#y", m).onclick = async () => { await api("DELETE", "/api/teacher/students/" + encodeURIComponent(b.dataset.del)); close(); await loadTeacher(); pageTeacher(); };
  }));
}
// Printable login cards: 8 per page, cut along the dashed lines.
function printCards(list) {
  document.getElementById("printcards")?.remove();
  const box = document.createElement("div");
  box.id = "printcards";
  box.innerHTML = list.map((c) => `<div class="pcard">${spriteSVG(GUIDES[S.me.skin] || "robot", 40)}
    <div><b>${esc(t("appName"))}</b><div class="small">${esc(location.host)}</div></div>
    <div class="who">${esc(c.name)}</div>
    <div><span class="small">${esc(t("username"))}</span><br><code>${esc(c.username)}</code></div>
    <div><span class="small">${esc(t("password"))}</span><br><code>${esc(c.password)}</code></div></div>`).join("");
  document.body.appendChild(box);
  setTimeout(() => { try { window.print(); } catch {} }, 100);
}

function resetPw(id) {
  const pw = genPw();
  const { el, close } = openModal(`<h2 id="modal-title">${t("resetPw")}</h2><label>${t("newPw")}<input type="text" id="np" value="${pw}" minlength="4" maxlength="64"></label><div class="row"><button class="btn primary" id="ok">${t("save")}</button><button class="btn ghost" data-close>${t("close")}</button></div>`);
  $("#ok", el).onclick = async () => {
    try {
      const pw = $("#np", el).value;
      await api("POST", `/api/teacher/students/${encodeURIComponent(id)}/password`, { password: pw });
      toast("✓ " + pw); close();
      if (T.showPw) { T.pw = { ...(T.pw || {}), [id]: pw }; if (T.tab === "students") tabStudents($("#tab"), T.data); }
    } catch (e) { toast(e.message); }
  };
}

// ---------- All work: a card for every student with a picture of their game and their latest code ----------
const SNAPS = new Map();   // student id -> { saved_at, image } so pictures only redraw when a student saves
async function tabAllWork(el) {
  if (!el.dataset.ready) el.innerHTML = `<p class="muted" style="margin-top:12px">…</p>`;
  const { students } = await api("GET", "/api/teacher/work?class=" + encodeURIComponent(T.classId || "all"));
  const L = classLabels(T.data.classes);
  const sortBy = T.workSort || "name";
  const curOf = (st) => UNIT.find((u) => u.kind !== "side" && !["done", "skipped"].includes(st.progress[u.id]?.status))?.id || "mygame";
  const titleOf = (st, lid) => { const g = GAME_TYPES[st.template]; return g?.levels[lid]?.title ? tx(g.levels[lid].title) : tx(LEVELS[lid].title); };
  const peek = (st) => {
    if (!st.code) return "";
    const mk = markerRe(curOf(st)).exec(st.code);
    const block = mk ? st.code.slice(mk.index) : st.code;
    return block.split("\n").filter((l) => l.trim()).slice(0, 10).join("\n");
  };
  const list = [...students].sort((a, b) => sortBy === "saved" ? (b.saved_at || 0) - (a.saved_at || 0)
    : sortBy === "level" ? UNIT.findIndex((u) => u.id === curOf(a)) - UNIT.findIndex((u) => u.id === curOf(b)) : a.name.localeCompare(b.name));
  el.dataset.ready = "1";
  el.innerHTML = `<div class="row" style="margin-top:12px"><h2 style="margin:0">${t("allwork")} (${students.length})</h2><span class="spacer"></span>
      <label class="row small" style="font-weight:700">${t("sortBy")}<select id="wsort" style="width:auto">
        ${[["name", t("student")], ["saved", t("lastSaved")], ["level", t("levelCol")]].map(([k, l]) => `<option value="${k}" ${k === sortBy ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
      <button class="btn small" id="wrefresh">↻ ${t("refresh")}</button></div>
    ${students.length ? "" : `<p class="panel">${t("noStudents")}</p>`}
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr));margin-top:12px">
    ${list.map((st) => { const lid = curOf(st), p = st.progress[lid], stuck = isStuck(p), g = GAME_TYPES[st.template]; return `
      <article class="card" style="justify-items:stretch;align-content:start;text-align:left;${stuck ? "outline:3px solid var(--bad)" : ""}">
        <div class="cab" style="padding:8px"><div class="scr" style="aspect-ratio:1" id="snap-${esc(st.id)}">${SNAPS.get(st.id)?.image ? `<img src="${SNAPS.get(st.id).image}" alt="" style="width:100%;border-radius:8px;image-rendering:pixelated">` : st.code ? `<span class="small muted">…</span>` : `<span class="small muted">${t("noGameYet")}</span>`}</div></div>
        <div class="row" style="gap:6px">${whoHTML(st)}<span class="spacer"></span>${stuck ? `<span class="chip" style="background:var(--bad);color:#fff">${t("st_stuck")}</span>` : ""}</div>
        <div class="small muted">${g ? esc(tx(g.name)) : "–"}${allMode() ? " · " + esc(L[st.class_id] || "") : ""} · ${t("lastSaved")}: ${ago(st.saved_at)}</div>
        <div class="small"><b>${t("workingOn")}:</b> ${esc(titleOf(st, lid))}${p ? ` · ${t("tries")} ${p.attempts} · ${t("hint")}s ${p.hints_used}` : ""}</div>
        ${st.code ? `<pre class="console" style="height:auto;max-height:150px;font-size:12px;margin:0">${esc(peek(st))}</pre>` : ""}
        <button class="btn primary small" data-stu="${esc(st.id)}">👁 ${t("seeWork")}</button>
      </article>`; }).join("")}</div>`;
  $("#wsort", el).onchange = (e) => { T.workSort = e.target.value; tabAllWork(el); };
  $("#wrefresh", el).onclick = () => tabAllWork(el);
  $$("[data-stu]", el).forEach((b) => (b.onclick = () => studentDrawer(b.dataset.stu)));
  // Draw pictures one at a time in a hidden game runner (only for games saved since the last picture).
  const todo = list.filter((st) => st.code && SNAPS.get(st.id)?.saved_at !== st.saved_at);
  if (!todo.length) return;
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;left:-9999px;top:0;width:200px;height:200px";
  document.body.appendChild(box);
  const r = new Runner(box);
  for (const st of todo) {
    if (!el.isConnected || T.tab !== "allwork") break;
    const res = await r.snapshot(st.code);
    SNAPS.set(st.id, { saved_at: st.saved_at, image: res.image });
    const slot = document.getElementById("snap-" + st.id);
    if (slot && res.image) slot.innerHTML = `<img src="${res.image}" alt="" style="width:100%;border-radius:8px;image-rendering:pixelated">`;
  }
  r.destroy(); box.remove();
}

// ---------- Classes: every class with its roster; view, rename, delete ----------
async function tabClasses(el) {
  el.innerHTML = `<p class="muted" style="margin-top:12px">…</p>`;
  const all = await api("GET", "/api/teacher/overview?class=all");
  const L = classLabels(all.classes), by = {};
  for (const st of all.students) (by[st.class_id] ||= []).push(st);
  const only = all.classes.length === 1;
  el.innerHTML = `<div class="row" style="margin-top:12px"><h2 style="margin:0">${t("classes")} (${all.classes.length})</h2><span class="spacer"></span><button class="btn primary small" id="addcls2">+ ${t("addClass")}</button></div>
    ${all.classes.map((c) => { const kids = by[c.id] || []; return `<section class="panel" style="margin-top:12px">
      <div class="row"><h3 style="margin:0">${esc(L[c.id])}</h3><span class="chip">${nStu(c.students)}</span><span class="spacer"></span>
        <button class="btn small" data-view="${esc(c.id)}">${t("viewClass")}</button>
        <button class="btn small" data-rename="${esc(c.id)}">${t("rename")}</button>
        ${only ? "" : `<button class="btn ghost small" data-delclass="${esc(c.id)}">${t("deleteClass")}</button>`}</div>
      ${kids.length ? `<div class="scroll" style="margin-top:8px"><table class="stack"><thead><tr><th>${t("student")}</th><th>${t("username")}</th><th>${t("gameCol")}</th><th class="num">${t("level")}</th><th class="num">${t("xp")}</th><th></th></tr></thead><tbody>
        ${kids.map((k) => `<tr><td data-l="${t("student")}">${whoHTML(k)}</td><td data-l="${t("username")}"><code>${esc(k.username)}</code></td><td data-l="${t("gameCol")}">${GAME_TYPES[k.game_type] ? esc(tx(GAME_TYPES[k.game_type].name)) : "–"}</td><td class="num" data-l="${t("level")}">${levelFor(k.xp)}</td><td class="num" data-l="${t("xp")}">${k.xp}</td><td><button class="btn primary small" data-stu="${esc(k.id)}">👁 ${t("seeWork")}</button></td></tr>`).join("")}
      </tbody></table></div>` : `<p class="muted" style="margin:8px 0 0">${t("noStudentsInClass")}</p>`}</section>`; }).join("")}
    ${only ? `<p class="small muted">${t("lastClassNote")}</p>` : ""}`;
  const refresh = async () => { await loadTeacher(); await pageTeacher(); };
  $("#addcls2", el).onclick = () => $("#addcls").click();
  $$("[data-stu]", el).forEach((b) => (b.onclick = () => studentDrawer(b.dataset.stu)));
  $$("[data-view]", el).forEach((b) => (b.onclick = async () => { T.classId = b.dataset.view; T.tab = "progress"; await refresh(); }));
  $$("[data-rename]", el).forEach((b) => (b.onclick = () => {
    const c = all.classes.find((x) => x.id === b.dataset.rename);
    const { el: m, close } = openModal(`<h2 id="modal-title">${t("rename")}</h2><label>${t("className")}<input type="text" id="rn" maxlength="40" value="${esc(c.name)}" autofocus></label>
      <span class="small" id="rnerr" role="alert" style="color:var(--bad)"></span>
      <div class="row"><button class="btn primary" id="ok">${t("save")}</button><button class="btn ghost" data-close>${t("close")}</button></div>`);
    $("#ok", m).onclick = async () => {
      const name = $("#rn", m).value.replace(/\s+/g, " ").trim();
      try { await api("PUT", "/api/teacher/classes/" + encodeURIComponent(c.id), { name }); close(); await refresh(); }
      catch (e) { $("#rnerr", m).textContent = e.message === "class_name_taken" ? t("classNameTaken", name) : e.message === "class_name_empty" ? t("classNameEmpty") : t("oops"); }
    };
  }));
  $$("[data-delclass]", el).forEach((b) => (b.onclick = () => {
    const c = all.classes.find((x) => x.id === b.dataset.delclass), others = all.classes.filter((x) => x.id !== c.id);
    const { el: m, close } = openModal(`<h2 id="modal-title">${t("deleteClass")}: ${esc(L[c.id])}</h2>
      ${c.students ? `<p>${esc(t("deleteClassHas", c.students))}</p>
        <label class="toggle" style="justify-content:flex-start"><input type="radio" name="how" value="move" checked> ${t("moveStudentsTo")}
          <select id="dest" style="width:auto;margin-left:8px">${others.map((o) => `<option value="${esc(o.id)}">${esc(L[o.id])}</option>`).join("")}</select></label>
        <label class="toggle" style="justify-content:flex-start"><input type="radio" name="how" value="delete"> ${t("deleteStudentsToo")}</label>
        <label id="confirmbox" hidden>${esc(t("typeNameToConfirm", c.name))}<input type="text" id="confirmname" autocomplete="off"></label>`
      : `<p>${t("deleteEmptyClass")}</p>`}
      <span class="small" id="delerr" role="alert" style="color:var(--bad)"></span>
      <div class="row"><button class="btn primary" id="ok">${t("deleteClass")}</button><button class="btn ghost" data-close autofocus>${t("close")}</button></div>`);
    $$("input[name=how]", m).forEach((r) => (r.onchange = () => { $("#confirmbox", m).hidden = r.value !== "delete" || !r.checked; }));
    $("#ok", m).onclick = async () => {
      const how = $("input[name=how]:checked", m)?.value;
      const body = !c.students ? {} : how === "move" ? { moveTo: $("#dest", m).value } : { deleteStudents: true, confirmName: $("#confirmname", m).value };
      if (how === "delete" && body.confirmName.trim().toLowerCase() !== c.name.trim().toLowerCase()) { $("#delerr", m).textContent = t("typeNameToConfirm", c.name); return; }
      try {
        const r = await api("POST", `/api/teacher/classes/${encodeURIComponent(c.id)}/delete`, body);
        close(); if (T.classId === c.id) T.classId = "all";
        toast(r.moved ? t("classMoved", r.moved) : r.deleted ? t("classDeletedWith", r.deleted) : t("classDeleted"));
        await refresh();
      } catch (e) { $("#delerr", m).textContent = e.message.replace(/_/g, " "); }
    };
  }));
}

function tabControls(el, D) {
  if (allMode()) { el.innerHTML = `<div class="panel" style="margin-top:12px"><h2>${t("controls")}</h2><p>${t("pickOneClass")}</p></div>`; return; }
  el.innerHTML = `<div class="panel" style="margin-top:12px"><h2>${t("controls")}</h2><p class="muted">${t("lockHelp")}</p>
    ${ITEMS.map((i) => `<label class="toggle"><span>${i.short} · ${esc(tx(LEVELS[i.id].title))}</span><span class="row small">${D.locks.includes(i.id) ? "🔒 " + t("locked") : ""}<input type="checkbox" data-lock="${i.id}" ${D.locks.includes(i.id) ? "checked" : ""} aria-label="${t("lock")} ${esc(tx(LEVELS[i.id].title))}"></span></label>`).join("")}</div>`;
  $$("[data-lock]", el).forEach((c) => (c.onchange = async () => {
    const locks = $$("[data-lock]", el).filter((x) => x.checked).map((x) => x.dataset.lock);
    const r = await api("PUT", `/api/teacher/classes/${encodeURIComponent(T.classId)}/locks`, { locks }); T.data.locks = r.locks; tabControls(el, T.data);
  }));
}
function tabBoard(el, D) {
  el.innerHTML = `<div class="panel" style="margin-top:12px"><h2>${t("weekly").replace(/5/, "")}</h2><ol class="board">${D.board.map((r) => `<li><span class="rank">${r.rank}</span>${avatarHTML(r.avatar, 32)}<span>${esc(r.name)}</span><span class="pts">${r.weekXp} ${t("xp")} · ${r.xp} total</span></li>`).join("")}</ol></div>`;
}

// ---------- one student's current work and all their progress ----------
const ago = (ms) => {
  if (!ms) return "–";
  const m = Math.round((Date.now() - ms) / 60000);
  return m < 1 ? t("justNow") : m < 60 ? t("minAgo", m) : m < 1440 ? t("hrAgo", Math.round(m / 60)) : new Date(ms).toLocaleDateString(S.lang);
};
async function studentDrawer(id, view = "game") {
  let d = await api("GET", "/api/teacher/students/" + encodeURIComponent(id));
  const s = d.student, g = GAME_TYPES[d.game?.template];
  const curLevel = () => UNIT.find((u) => u.kind !== "side" && !["done", "skipped"].includes(d.progress[u.id]?.status))?.id || "mygame";
  const titleOf = (lid) => (g?.levels[lid]?.title ? tx(g.levels[lid].title) : tx(LEVELS[lid].title));
  const m = mastery(d.progress);
  const prev = activeRunner;
  const views = [["game", t("theirGame")], ["boss", t("boss")], ["remix", t("remixLab")]];
  const { el } = openModal(`<div class="row">${avatarHTML(s.avatar, 48)}<div><h2 id="modal-title" style="margin:0">${esc(s.name)}</h2>
      <span class="small muted">${esc(s.username)} · ${esc(s.className)} · ${t("lastSeen")} ${ago(s.lastSeen)}</span></div><span class="spacer"></span><button class="btn ghost small" data-close>${t("close")}</button></div>
    <div class="row">
      <span class="chip">${t("level")} ${s.level}</span><span class="chip">${s.xp} ${t("xp")}</span><span class="chip">${spriteSVG("coin", 16)} ${s.coins}</span>
      ${g ? `<span class="chip">${spriteSVG(g.sprite, 16)} ${esc(tx(g.name))}</span>` : `<span class="chip">${t("noGameYet")}</span>`}
      <span class="chip">★ ${t("workingOn")}: ${esc(titleOf(curLevel()))}</span></div>

    <h3 style="margin:8px 0 0">${t("currentWork")}</h3>
    <div class="row" role="group">${views.map(([k, l]) => `<button class="btn small ${k === view ? "primary" : "ghost"}" data-view="${k}">${esc(l)}</button>`).join("")}
      <span class="spacer"></span><span class="small muted" id="saved"></span><button class="btn small" id="trefresh">↻ ${t("refresh")}</button><button class="btn go small" id="trun">▶ ${t("run")}</button></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,320px);gap:12px" class="drawer">
      <div class="editbox" id="tcode"></div>
      <div><div id="tframe"></div>${padHTML()}<pre class="console" id="tcon" style="height:70px;margin-top:8px"></pre></div></div>

    <h3 style="margin:8px 0 0">${t("allProgress")}</h3>
    <div class="scroll"><table class="stack"><thead><tr><th>${t("levelCol")}</th><th>${t("statusCol")}</th><th class="num">${t("tries")}</th><th class="num">${t("hint")}s</th><th class="num">${t("xp")}</th><th>${t("finished")}</th></tr></thead><tbody>
      ${UNIT.map((u) => { const p = d.progress[u.id]; const st = !p ? "none" : isStuck(p) ? "stuck" : p.status;
        return `<tr><td data-l="${t("levelCol")}">${esc(titleOf(u.id))}</td>
          <td data-l="${t("statusCol")}"><span class="cell ${st}" style="width:auto;padding:0 8px">${esc(t("st_" + st))}</span></td>
          <td class="num" data-l="${t("tries")}">${p?.attempts ?? "–"}</td><td class="num" data-l="${t("hint")}s">${p?.hints_used ?? "–"}</td>
          <td class="num" data-l="${t("xp")}">${p?.xp_earned || "–"}</td><td data-l="${t("finished")}">${p?.completed_at ? esc(new Date(p.completed_at).toLocaleDateString(S.lang)) : "–"}</td></tr>`; }).join("")}
    </tbody></table></div>
    <div class="row">${CONCEPTS.map((c) => `<span class="chip m-${m[c.id]}" title="${esc(c.csta)}">${esc(tx(c))}: ${t(m[c.id])}</span>`).join("")}</div>
    <div class="row">${BADGES.map((b) => `<span class="chip" style="${s.badges.includes(b.id) ? "" : "opacity:.35"}">★ ${esc(tx(b))}</span>`).join("")}</div>
    ${d.errors.length ? `<details><summary><b>${t("recentErrors")} (${d.errors.length})</b></summary><ul class="small">${d.errors.map((e) => `<li>${esc(e.kind)} · ${esc(titleOf(e.lesson_id) || "")} · ${ago(e.created_at)}</li>`).join("")}</ul></details>` : ""}

    <div class="panel"><h3>${t("leaveNote")}</h3><textarea id="note" rows="2" maxlength="500"></textarea><button class="btn primary small" id="sendnote" style="margin-top:8px">${t("sendNote")}</button>
      ${d.notes.map((n) => `<p class="small note" style="margin-top:8px">${esc(titleOf(n.lesson_id) || n.lesson_id)}: ${esc(n.body)}</p>`).join("")}</div>
    <div class="row"><b>${t("bonus")}</b>${[5, 10, 25].map((n) => `<button class="btn gold small" data-bonus="${n}">+${n}</button>`).join("")}
      <span class="spacer"></span><label class="row" style="font-weight:700">${t("catchUp")}<select id="skipto" style="width:auto">${UNIT.slice(1).map((u) => `<option value="${u.id}">${esc(titleOf(u.id))}</option>`).join("")}</select></label><button class="btn small" id="skip">${t("skip")}</button>
      <button class="btn ghost small" id="pw">${t("resetPw")}</button></div>`, { wide: true, onClose: () => { r.destroy(); activeRunner = prev; } });

  const codeFor = (v) => v === "boss" ? (d.progress.boss?.code || (g || GAME_TYPES.platformer).boss.starter(langPick(S.lang)))
    : v === "remix" ? (d.remix?.code || "# " + t("noRemixYet")) : (d.game?.code || "# " + t("noGameYet"));
  const savedAt = (v) => v === "boss" ? d.progress.boss?.updated_at : v === "remix" ? d.remix?.updated_at : d.game?.updated_at;
  const ed = makeEditor($("#tcode", el), codeFor(view), { readOnly: true });
  const r = new Runner($("#tframe", el)); activeRunner = r; wirePad(el, r);
  const con = $("#tcon", el);
  r.on("print", (x) => (con.textContent += x.lines.join("\n") + "\n")).on("error", (x) => (con.textContent += `⚠ ${x.line ? "line " + x.line + ": " : ""}${x.message}\n`));
  const show = async () => {
    const code = codeFor(view);
    ed.set(code); $("#saved", el).textContent = t("savedAgo", ago(savedAt(view)));
    $$("[data-view]", el).forEach((b) => (b.className = "btn small " + (b.dataset.view === view ? "primary" : "ghost")));
    if (view === "game") { const mk = markerRe(curLevel()).exec(code); if (mk) ed.goto(code.slice(0, mk.index).split("\n").length); }
    con.textContent = ""; const x = await r.run(code); if (x.type === "error") con.textContent += `⚠ ${x.line ? "line " + x.line + ": " : ""}${x.message}\n`;
  };
  show();
  $$("[data-view]", el).forEach((b) => (b.onclick = () => { view = b.dataset.view; show(); }));
  $("#trun", el).onclick = async () => { con.textContent = ""; const x = await r.run(ed.get()); if (x.type === "error") con.textContent += `⚠ ${x.line ? "line " + x.line + ": " : ""}${x.message}\n`; };
  $("#trefresh", el).onclick = async () => { d = await api("GET", "/api/teacher/students/" + encodeURIComponent(id)); show(); toast("↻ " + t("refresh")); };
  $("#sendnote", el).onclick = async () => { const body = $("#note", el).value.trim(); if (!body) return; await api("POST", "/api/teacher/notes", { studentId: id, lessonId: view === "boss" ? "boss" : curLevel(), body }); toast("✓ " + t("sendNote")); $("#note", el).value = ""; };
  $$("[data-bonus]", el).forEach((b) => (b.onclick = async () => { await api("POST", `/api/teacher/students/${encodeURIComponent(id)}/bonus`, { amount: +b.dataset.bonus, reason: "teacher" }); toast(`+${b.dataset.bonus} ${t("xp")} → ${s.name}`); T.at = 0; }));
  $("#skip", el).onclick = async () => { const x = await api("POST", `/api/teacher/students/${encodeURIComponent(id)}/skip`, { lessonId: $("#skipto", el).value }); toast(`✓ ${t("skip")} (${x.skipped})`); T.at = 0; };
  $("#pw", el).onclick = () => resetPw(id);
}

// ---------- boot & routing ----------
async function loadMe() {
  const d = await api("GET", "/api/me");
  S.me = d.user; S.lang = d.user.lang || "en";
  S.progress = d.progress || {}; S.locks = d.locks || []; S.notes = d.notes || []; S.game = d.game || null; S.className = d.className || "";
  applyLook();
}
async function render() {
  const h = location.hash.slice(1) || "";
  if (activeRunner && !h.startsWith("lesson-") && h !== "remix") { activeRunner.destroy(); activeRunner = null; }
  if (speech) speechSynthesis.cancel();
  $("#modal").hidden = true;
  if (!S.me && h !== "setup") {
    try { await loadMe(); } catch { return pageLogin("login"); }
  }
  if (h === "setup") return pageLogin("setup");
  if (!S.me) return pageLogin("login");
  applyLook();
  if (S.me.role === "teacher") {
    if (h === "arcade") return pageArcade();
    return pageTeacher();
  }
  if (h.startsWith("lesson-")) return pageLesson(h.slice(7));
  if (h === "shop") return pageShop();
  if (h === "remix") return pageRemix();
  if (h === "arcade") return pageArcade();
  return pageMap();
}
S.lang = store.get("pq-lang") || ((navigator.language || "en").startsWith("es") ? "es" : "en");
addEventListener("hashchange", () => render().catch((e) => console.error(e)));
render().catch((e) => { console.error(e); main.innerHTML = `<p class="boot">Something went wrong. Reload the page.</p>`; });
