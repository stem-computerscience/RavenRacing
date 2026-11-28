// Maker Quest app: sign-in, the student game (progress saved to the server) and the teacher dashboard.
// Talks to the same Cloudflare Worker as PyQuest, under /api/mq/*.
import { W, XP, TAG, missionById, isCore, coreOf, stepCount, doneFor, rankFor, CONCEPTS, mastery,
  SPANS, CONTENT_DAYS, TOTAL_DAYS, weekOfDay, classDates, classDayOn, clearedForPace, paceOf, niceDate, todayIso, validIso,
  BOSSES, bossById, BOSS_SPANS, BOSS_XP, bossOpen, bossDefeated } from "./data.js";

const API = String(window.MQ_CONFIG?.api || "").replace(/\/$/, "");
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };
const TOKEN = "mq-token";
const authHeaders = () => { const t = store.get(TOKEN); return t ? { authorization: "Bearer " + t } : {}; };
async function api(method, path, body) {
  if (!body && (method === "POST" || method === "PUT")) body = {};   // the server only takes JSON bodies
  const res = await fetch(API + path, { method, headers: { ...authHeaders(), ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, credentials: API ? "omit" : "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || "server_error"); e.status = res.status; e.data = data; throw e; }
  return data;
}
const $ = (id) => document.getElementById(id);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
const app = $("app");
const ERR = {
  bad_login: "That username or password didn't match. Ask your teacher if you forgot.",
  not_in_app: "You're not in a Maker Quest class yet. Ask your teacher to add you.",
  locked: "Your teacher has locked this world for now.",
  signed_out: "You were signed out. Please sign in again.",
  dive_locked: "Clear this world's missions first to unlock its Deeper Dive.",
  boss_not_open: "This boss isn't open yet.",
  already_taken: "You've already taken this test. Ask your teacher if you can retake it.",
  class_name_taken: "You already have a class with that name.",
  class_name_empty: "Give the class a name.",
};
const errText = (e) => (e.message === "too_many_tries" ? `Too many tries. Wait ${e.data?.retryMinutes || 10} minutes, or ask your teacher to reset your password.` : ERR[e.message] || "Something went wrong. Try again.");
function toast(t) { const el = $("toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("show"), 2600); }
function openModal(html, small) {
  const m = $("modal"), box = $("mbox");
  box.className = "mbox" + (small ? " sm" : ""); box.innerHTML = html; m.hidden = false;
  const close = () => { m.hidden = true; box.innerHTML = ""; document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  $$("[data-close]", box).forEach((b) => (b.onclick = close));
  m.onclick = (e) => { if (e.target === m) close(); };
  setTimeout(() => box.querySelector("[autofocus],input,button")?.focus(), 30);
  return { el: box, close };
}
const ago = (ms) => { if (!ms) return "never"; const m = Math.round((Date.now() - ms) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : new Date(ms).toLocaleDateString(); };
const ava = (u, size = 30) => { const c = /^#[0-9a-f]{6}$/i.test(u?.avatar?.color || "") ? u.avatar.color : "#d9a640"; return `<span class="ava" style="background:${c};width:${size}px;height:${size}px">${esc((u?.name || "?").trim().charAt(0).toUpperCase())}</span>`; };
const online = (ms) => ms && Date.now() - ms < 120e3;
const WORDS = ["comet", "pixel", "robot", "laser", "rocket", "orbit", "spark", "volt", "nova", "gizmo", "maker", "radar", "turbo", "cobalt", "ember", "quartz"];
const genPw = () => WORDS[Math.floor(Math.random() * WORDS.length)] + (10 + Math.floor(Math.random() * 90));
const worldName = (n) => { const w = W.find((x) => x.n === n); return w ? `World ${w.n}: ${w.g}` : ""; };
// ---------- pacing (9 weeks: 8 of lessons + a buffer week) ----------
function paceInfo(pacing) {
  const dates = classDates(pacing); if (!dates) return null;
  const today = todayIso(), day = classDayOn(dates, today);
  return { dates, today, day, week: day ? weekOfDay(Math.min(day, TOTAL_DAYS)) : 0, due: (n) => dates[SPANS[n].last - 1] };
}
const weekWorlds = (wk) => SPANS.filter((s) => s.last >= (wk - 1) * 5 + 1 && s.first <= wk * 5).map((s) => s.n);
const weekBosses = (wk) => BOSSES.filter((b) => { const s = BOSS_SPANS[b.id]; return s.last >= (wk - 1) * 5 + 1 && s.first <= wk * 5; });
const BOSS_ICON = "10101 01110 11011 01110 10101";
// The map: 17 worlds with a boss after every 4th (one boss every 2 weeks).
const STOPS = W.flatMap((w) => { const b = BOSSES.find((x) => x.after === w.n); return b ? [{ kind: "w", w }, { kind: "b", b }] : [{ kind: "w", w }]; });
const stopIcon = (st) => (st.kind === "w" ? st.w.i : BOSS_ICON);
const bossInfo = (progress, id) => { const c = progress[id]?.steps; const o = c && !Array.isArray(c) ? c : {}; return { attempts: o.attempts || 0, best: o.best ?? null, total: o.total || bossById[id].questions.length, correct: o.correct || [], answers: o.answers || [], retake: !!o.retake, last: o.last ?? null }; };
const paceChip = (p) => (!p ? "" : p.bossesBehind?.length && !p.behind.length ? `<span class="chip behind" title="Boss tests not beaten: ${p.bossesBehind.map((b) => "Boss " + bossById[b].n).join(", ")}">Boss due</span>` : p.behind.length ? `<span class="chip behind" title="Overdue: ${p.behind.map((n) => "World " + n).join(", ")}">Behind ${p.behind.length}</span>` : p.ahead ? `<span class="chip ahead">Ahead</span>` : `<span class="chip ahead">On track</span>`);
const mLabel = (m) => (m.t === "h" ? "Trial" : m.t === "d" ? "Dive" : m.t === "s" ? "Side " + m.lv : "L" + m.lv);

// ---------- start ----------
async function start() {
  if (!store.get(TOKEN)) return pageLogin();
  try {
    const me = await api("GET", "/api/mq/me");
    if (me.user.role === "teacher") return pageTeacher(me);
    return pageStudent(me);
  } catch (e) {
    store.set(TOKEN, null);
    pageLogin(e.message === "not_in_app" ? ERR.not_in_app : "");
  }
}
async function signOut() {
  try { await api("POST", "/api/logout"); } catch {}
  store.set(TOKEN, null); L.on && disconnect(); location.hash = ""; pageLogin();
}

function pageLogin(msg = "") {
  clearInterval(poll);
  app.innerHTML = `<div class="loginwrap"><form class="login" id="lf">
    <div class="loginboard">${photoBoard("01010 01010 00000 10001 01110", { label: "A real micro:bit with a smiley face lit" })}</div>
    <h1>micro:bit Maker Quest</h1>
    <p>Sign in with the username and password your teacher gave you. PyQuest students use the same login.</p>
    <label class="f">Username<input class="t" id="un" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
    <label class="f">Password<input class="t" id="pw" type="password" autocomplete="current-password" required></label>
    <div class="err" id="le" role="alert">${esc(msg)}</div>
    <button class="cbtn" type="submit">Sign in</button>
    <p class="lnote">Teachers: sign in with your PyQuest teacher account to open the Maker Quest dashboard.</p>
    <p class="lnote">${photoCredit()}</p>
  </form></div>`;
  watchPhoto(app);
  $("lf").onsubmit = async (e) => {
    e.preventDefault();
    $("le").textContent = "";
    try {
      const r = await api("POST", "/api/login", { username: $("un").value.trim(), password: $("pw").value, app: "makerquest" });
      store.set(TOKEN, r.token); start();
    } catch (err) { $("le").textContent = errText(err); $("pw").value = ""; }
  };
  $("un").focus();
}

// =====================================================================
// Student game
// =====================================================================
let ME = null, UI = { cur: 0, open: {} }, poll = null;
try { Object.assign(UI, JSON.parse(store.get("mq-ui") || "{}")); } catch {}
const saveUI = () => store.set("mq-ui", JSON.stringify(UI));
const prog = (id) => ME.progress[id] || { status: "", steps: [] };
const ck = (id, i) => prog(id).steps.includes(i);
const mDone = (m) => prog(m.id).status === "done";
const mSkip = (m) => prog(m.id).status === "skipped";
const wDone = (w) => (ME.member.badges || []).includes("w" + w.n);
const wPct = (w) => { const c = coreOf(w); return Math.round((100 * c.filter((m) => mDone(m) || mSkip(m)).length) / c.length); };
const locked = (w) => (ME.locks || []).includes("w" + w.n);

async function pageStudent(me) {
  ME = me;
  app.innerHTML = `<div class="top"><span>${ava(ME.user, 24)}</span><b>${esc(ME.user.name)}</b><span>${esc(ME.className)}</span><span class="sp"></span><button class="ghost" id="so" type="button">Sign out</button></div>
  <header class="band hud">
    <div><h1>micro:bit Maker Quest</h1><p>Creating Apps with Devices: 17 planets across 4 star systems, with a boss guarding each one. Your progress saves to your account.</p></div>
    <div class="stats">
      <div class="stat"><b id="rank"></b><span>Rank</span></div>
      <div class="stat"><b id="xp"></b><span>Total</span></div>
      <div class="stat"><b id="bc"></b><span>Badges</span></div>
    </div>
    <div class="xpbar" aria-hidden="true"><i id="xpfill"></i></div>
    <div class="xpnote" id="xpnote"></div>
    <div class="pacebar" id="pacebar" hidden></div>
  </header>
  <section class="space"><div class="sectors" id="sectors" role="tablist" aria-label="Star systems"></div><div class="mapwrap" id="strip"></div><nav class="hop" id="hop" aria-label="Move between planets"></nav></section>
  <main class="band main">
    <aside class="side">
      <div class="boardwrap"><div id="board" class="boardbox"></div><p class="boardcap" id="boardcap"></p></div>
      ${linkPanelHTML()}
      <div class="badges" id="notesbox" hidden></div>
      <div class="badges"><h3>Class board this week</h3><ol class="board-list" id="cboard"><li><span></span><span></span><span class="pts">Loading…</span></li></ol></div>
      <div class="badges"><h3>Badge case</h3><div class="blist" id="blist"></div></div>
    </aside>
    <section id="world" aria-live="polite"></section>
  </main>
  <footer class="band foot">Each mission matches one level of the Code.org unit and opens it in Code.org. XP: video 25 · predict 50 · skill 100 · Code.org side quest 75 each · board trial 100 · project step 150 · Deeper Dive 150 · checkpoint 250 · boss 300.</footer>`;
  $("so").onclick = signOut;
  wireLink();
  if (!Object.keys(ME.progress).length && !Object.keys(UI.open).length) UI.open["0-1"] = true;
  render(); notes(); loadBoard();
  clearInterval(poll);
  poll = setInterval(async () => {
    if (document.visibilityState !== "visible" || saving) return;
    try { const fresh = await api("GET", "/api/mq/me"); if (saving) return; ME = fresh; refresh(false); notes(); loadBoard(); }
    catch (e) { if (e.status === 401 || e.status === 403) { store.set(TOKEN, null); pageLogin(errText(e)); } }
  }, 60000);
}
function notes() {
  const box = $("notesbox"); if (!box) return;
  const list = (ME.notes || []).slice(0, 3);
  box.hidden = !list.length;
  box.innerHTML = `<h3>Notes from your teacher</h3><div class="notes">${list.map((n) => `<div class="note">${n.seen ? "" : "<b>New · </b>"}${esc(n.body)}<div class="lnote">${n.lesson_id && missionById[n.lesson_id] ? esc(worldName(missionById[n.lesson_id].world) + " · " + missionById[n.lesson_id].title) + " · " : ""}${ago(n.created_at)}</div></div>`).join("")}</div>`;
  if (list.some((n) => !n.seen)) { api("POST", "/api/mq/notes/seen").catch(() => {}); toast("You have a note from your teacher"); ME.notes.forEach((n) => (n.seen = 1)); }
}
async function loadBoard() {
  try {
    const b = await api("GET", "/api/mq/leaderboard");
    const rows = [...b.rows]; if (b.me && !rows.some((r) => r.id === b.me.id)) rows.push(b.me);
    $("cboard").innerHTML = rows.length ? rows.map((r) => `<li class="${r.id === ME.user.id ? "me" : ""}"><span class="r">${r.rank}</span>${ava(r, 26)}<span>${esc(r.name)}</span><span class="pts">${r.weekXp} XP</span></li>`).join("") : `<li><span></span><span></span><span class="pts">No XP yet this week</span></li>`;
  } catch {}
}

// ---------- the real micro:bit ----------
// microbit.org's picture of a real micro:bit V2, front and back side by side (1688×734).
// Lit LEDs are drawn exactly over the front's own LEDs, so the board shows each world's icon,
// scrolls and button presses on real hardware. White background, pin holes and notches are made see-through.
const PHOTO = {
  src: "https://cdn.sanity.io/images/ajwvhvgo/production/69cda3f409b82d272fd8cc2ad9e95d731dbe3865-1688x734.png?w=1400&auto=format",
  page: "https://microbit.org/get-started/features/overview/",
  credit: "micro:bit images: Micro:bit Educational Foundation, microbit.org",
  // Measured in the 1688×734 image.
  tl: [307.7, 287.7], tr: [540.8, 287.7], bl: [307.7, 519.9], br: [540.8, 519.9],
  a: [130.6, 389.3], b: [706.7, 389.3],
  front: { view: "40 50 775 655", clip: '<rect x="53.6" y="84.5" width="748" height="608.5" rx="26"/><rect x="418" y="62" width="126" height="30"/>' },
  back: { view: "886 50 778 655", clip: '<rect x="900" y="84.5" width="750" height="608.5" rx="26"/><rect x="1220" y="62" width="106" height="30"/>' },
};
let photoOk = true;
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const ledAt = (r, c) => lerp(lerp(PHOTO.tl, PHOTO.tr, c / 4), lerp(PHOTO.bl, PHOTO.br, c / 4), r / 4);
let photoSeq = 0;
// The micro:bit with the given 5×5 pattern lit (front), or its back. ids: the A/B buttons get ids (clickable).
function photoBoard(icon, { ids = false, label = "micro:bit", side = "front" } = {}) {
  const k = "pb" + ++photoSeq, bits = icon.replace(/ /g, ""), S = PHOTO[side];
  let leds = "";
  if (side === "front") for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (bits[r * 5 + c] === "1") {
    const [x, y] = ledAt(r, c);
    leds += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="24" fill="#ff2d1a" opacity=".45" filter="url(#${k}g)"/><rect class="lit" x="${(x - 6.5).toFixed(1)}" y="${(y - 11).toFixed(1)}" width="13" height="22" rx="3" fill="#ff4a30"/><rect x="${(x - 3).toFixed(1)}" y="${(y - 8).toFixed(1)}" width="6" height="16" rx="2" fill="#ffd2c4" opacity=".85"/>`;
  }
  const btn = (p, id) => `<circle ${ids ? `id="${id}"` : ""} cx="${p[0]}" cy="${p[1]}" r="44" fill="transparent" stroke="transparent" stroke-width="5" ${ids ? 'style="cursor:pointer"' : ""}/>`;
  return `<svg class="photo" viewBox="${S.view}" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid meet">
    <defs><clipPath id="${k}c">${S.clip}</clipPath><filter id="${k}g" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="${k}w" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -10 -10 -10 0 29.5"/></filter></defs>
    <image href="${PHOTO.src}" x="0" y="0" width="1688" height="734" clip-path="url(#${k}c)" filter="url(#${k}w)" preserveAspectRatio="none"/>
    <g class="leds">${leds}</g>${side === "front" ? btn(PHOTO.a, "btnA") + btn(PHOTO.b, "btnB") : ""}</svg>`;
}
const photoCredit = () => `<a class="credit" href="${PHOTO.page}" target="_blank" rel="noopener">${esc(PHOTO.credit)}</a>`;
// If the photo can't load (offline, blocked network), fall back to the drawn board everywhere.
function watchPhoto(root) { root?.querySelectorAll("svg.photo image").forEach((img) => img.addEventListener("error", () => { if (!photoOk) return; photoOk = false; if (ME && $("board")) board(stopIcon(curStop()), false); }, { once: true })); }

function board(icon, flash) {
  if (photoOk) {
    const s = $("board"); if (!s) return;
    const st = curStop();
    const back = UI.side === "back", name = st.kind === "w" ? "World " + st.w.n : "Boss " + st.b.n;
    s.innerHTML = photoBoard(icon, { ids: true, side: back ? "back" : "front", label: back ? "The back of a real micro:bit V2: speaker, processor, accelerometer and compass" : "A real micro:bit showing " + name + "'s icon. Press A or B to change." });
    const cap = $("boardcap");
    if (cap) { cap.innerHTML = `<b>${name}</b> · ${back ? "the back: speaker, processor, accelerometer, compass" : "press A or B to move"} · <button class="btn small" id="flip" type="button">${back ? "Show front" : "Flip to back"}</button><br>${photoCredit()}`; $("flip").onclick = () => { UI.side = back ? "front" : "back"; saveUI(); board(stopIcon(curStop()), false); }; }
    s.classList.remove("flash"); if (flash) { void s.getBoundingClientRect(); s.classList.add("flash"); }
    if ($("btnA")) { $("btnA").onclick = () => go(UI.cur - 1); $("btnB").onclick = () => go(UI.cur + 1); }
    watchPhoto(s); paintBtns();
    return;
  }
  drawnBoard(icon, flash);
}
function drawnBoard(icon, flash) {
  const host = $("board"); if (!host) return;
  host.innerHTML = '<svg class="board" viewBox="0 0 300 250" role="img" aria-label="micro:bit showing this world\'s icon. Press A or B to change world."></svg>';
  const s = host.firstChild;
  const bits = icon.replace(/ /g, ""); let leds = "";
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) leds += `<rect class="${bits[r * 5 + c] === "1" ? "lit" : "unlit"}" x="${103 + c * 20}" y="${50 + r * 20}" width="10" height="10" rx="2"/>`;
  let pads = ""; for (let i = 0; i < 5; i++) { const x = 34 + i * 52; pads += `<rect x="${x}" y="204" width="${i % 2 ? 18 : 34}" height="34" rx="3" fill="url(#gold)"/>`; }
  s.innerHTML = `<defs><linearGradient id="pcb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22362d"/><stop offset="1" stop-color="#121d18"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3cf7a"/><stop offset="1" stop-color="#b9862c"/></linearGradient></defs>
<ellipse cx="150" cy="244" rx="128" ry="6" fill="#000" opacity=".45"/>
<path d="M22 14 H278 Q290 14 290 26 V240 H10 V26 Q10 14 22 14Z" fill="url(#pcb)" stroke="#3b5a4c" stroke-width="2"/>
<path d="M22 16 H278" stroke="#4f7565" stroke-width="2" opacity=".6"/>
${pads}<rect x="10" y="236" width="280" height="4" fill="#0a110e"/>
<g fill="#0a110e" stroke="#3b5a4c"><rect x="96" y="43" width="108" height="108" rx="6"/></g>${leds}
<g><circle cx="52" cy="101" r="24" fill="#0a110e" stroke="#3b5a4c"/><circle cx="52" cy="101" r="15" fill="#2b2b2b" stroke="#555"/><circle cx="248" cy="101" r="24" fill="#0a110e" stroke="#3b5a4c"/><circle cx="248" cy="101" r="15" fill="#2b2b2b" stroke="#555"/></g>
<g font-family="Chakra Petch,sans-serif" font-weight="700" fill="#eef2ea" text-anchor="middle"><text x="52" y="146" font-size="16">A</text><text x="248" y="146" font-size="16">B</text><text x="150" y="180" font-size="14" fill="#a7b5ad">${curStop().kind === "w" ? "World " + curStop().w.n : "Boss " + curStop().b.n}</text></g>
<circle cx="52" cy="101" r="26" fill="transparent" id="btnA" style="cursor:pointer"/><circle cx="248" cy="101" r="26" fill="transparent" id="btnB" style="cursor:pointer"/>`;
  s.classList.remove("flash"); if (flash) { void s.getBoundingClientRect(); s.classList.add("flash"); }
  $("btnA").onclick = () => go(UI.cur - 1); $("btnB").onclick = () => go(UI.cur + 1);
}
const curStop = () => STOPS[UI.cur] || STOPS[0];
function bossPad(b, k, P) {
  const st = bossInfo(ME.progress, b.id), beaten = bossDefeated(ME.progress, b.id), open = bossOpen(ME.progress, b.id, P?.dates, P?.today || todayIso()), lk = (ME.locks || []).includes(b.id);
  const day = P ? P.dates[BOSS_SPANS[b.id].first - 1] : null;
  const sub = beaten ? "Beaten!" : lk ? "Locked" : st.attempts ? `Test ${st.best}/${st.total}` : open ? "Ready to fight" : day ? "Boss day " + niceDate(day).replace(/^\w+, /, "") : "Clear Worlds " + b.worlds[0] + "–" + b.worlds.at(-1);
  return `<button class="pad bosspad${k === UI.cur ? " on" : ""}${beaten ? " done" : ""}" data-w="${k}" type="button" aria-label="Boss ${b.n}: ${esc(b.name)}, ${esc(sub)}"><span class="n">Boss ${b.n}</span><span class="t">${esc(b.name)}</span><span class="due">${esc(sub)}</span><span class="fill"><i style="width:${beaten ? 100 : st.best != null ? (70 * st.best) / st.total : 0}%"></i></span></button>`;
}
// ---------- the star map (like PyQuest's world map, but planets) ----------
// 4 star systems, one per boss. Each shows its planets (worlds) on a flight path, a Deeper Dive moon
// orbiting each planet, and the boss planet at the end. A rocket marks the planet you're on.
const SECTORS = BOSSES.map((b, i) => ({ i, b, name: ["Inner Orbit", "Asteroid Belt", "Nebula Reach", "Outer Rim"][i], hue: ["#2a1f6b", "#0f3b4f", "#4a1747", "#4a2a0c"][i], glow: ["#7a5cff", "#2fd3c6", "#ff5fb0", "#ffa53f"][i] }));
const sectorOf = (k) => { const st = STOPS[k]; const n = st.kind === "b" ? st.b.after : st.w.n; return SECTORS.findIndex((x) => n <= x.b.after); };
// Each planet's look: base color, then a feature (bands, ring, craters).
const PLANETS = [["#ff8a3d", "bands"], ["#b86bff", "ring"], ["#ff4d4d", "craters"], ["#2fc9c0", "bands"], ["#ffcf3f", "ring"], ["#4f86ff", "craters"],
  ["#5fd16f", "bands"], ["#ff6fa3", "ring"], ["#ff9f43", "bands"], ["#9d8bff", "ring"], ["#f2d94e", "craters"], ["#4fc1e9", "ring"],
  ["#e8452c", "craters"], ["#6fe3a8", "bands"], ["#f5b642", "ring"], ["#6fb0ff", "bands"], ["#fd6fa8", "ring"]];
const SLOTS = { 5: [[95, 300], [280, 170], [465, 300], [650, 170], [835, 300]], 4: [[155, 290], [375, 165], [595, 290], [815, 165]] };
let starSeed = 7;
const rnd = () => (starSeed = (starSeed * 16807) % 2147483647) / 2147483647;
function starfield(sec, W, H) {
  starSeed = 11 + sec.i * 97; let st = "";
  for (let i = 0; i < 140; i++) { const r = rnd() < 0.08 ? 1.8 : rnd() * 1.1 + 0.3; st += `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H).toFixed(0)}" r="${r.toFixed(1)}" fill="#fff" opacity="${(0.35 + rnd() * 0.6).toFixed(2)}"/>`; }
  return `<defs><radialGradient id="neb${sec.i}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${sec.glow}" stop-opacity=".45"/><stop offset="1" stop-color="${sec.glow}" stop-opacity="0"/></radialGradient>
    <linearGradient id="sky${sec.i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#05060f"/><stop offset=".55" stop-color="${sec.hue}"/><stop offset="1" stop-color="#05060f"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#sky${sec.i})"/><ellipse cx="${W * 0.3}" cy="${H * 0.35}" rx="320" ry="160" fill="url(#neb${sec.i})"/><ellipse cx="${W * 0.8}" cy="${H * 0.75}" rx="260" ry="120" fill="url(#neb${sec.i})"/>${st}`;
}
function planetSVG(n, r, dim) {
  const [col, kind] = PLANETS[n], id = "pl" + n + (dim ? "d" : "");
  const base = dim ? "#4a5560" : col;
  let feat = "";
  if (kind === "bands") feat = `<g clip-path="url(#${id}c)" opacity=".35">${[-0.45, -0.1, 0.25, 0.6].map((t, i) => `<ellipse cx="0" cy="${(t * r).toFixed(1)}" rx="${r * 1.2}" ry="${(r * (i % 2 ? 0.09 : 0.14)).toFixed(1)}" fill="${i % 2 ? "#fff" : "#000"}"/>`).join("")}</g>`;
  if (kind === "craters") feat = `<g opacity=".28">${[[-0.35, -0.2, 0.22], [0.3, 0.25, 0.16], [0.05, -0.45, 0.12], [-0.15, 0.45, 0.1]].map(([x, y, s]) => `<circle cx="${(x * r).toFixed(1)}" cy="${(y * r).toFixed(1)}" r="${(s * r).toFixed(1)}" fill="#000"/>`).join("")}</g>`;
  const ring = kind === "ring";
  const ringBack = ring ? `<path d="M${-r * 1.55} 0 A${r * 1.55} ${r * 0.38} 0 0 1 ${r * 1.55} 0" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="${r * 0.13}" transform="rotate(-16)"/>` : "";
  const ringFront = ring ? `<path d="M${-r * 1.55} 0 A${r * 1.55} ${r * 0.38} 0 0 0 ${r * 1.55} 0" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="${r * 0.13}" transform="rotate(-16)"/>` : "";
  return `<defs><radialGradient id="${id}g" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".25" stop-color="${base}"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient><clipPath id="${id}c"><circle r="${r}"/></clipPath></defs>
    ${ringBack}<circle r="${r}" fill="${base}"/><circle r="${r}" fill="url(#${id}g)"/>${feat}${ringFront}`;
}
function bossPlanetSVG(r, beaten) {
  const c = beaten ? "#3e8f66" : "#b3261e";
  return `<defs><radialGradient id="bpg${beaten ? 1 : 0}" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#ff9a7a" stop-opacity=".6"/><stop offset=".3" stop-color="${c}"/><stop offset="1" stop-color="#1a0505"/></radialGradient></defs>
    ${beaten ? "" : `<circle r="${r * 1.35}" fill="${c}" opacity=".22"/>`}<circle r="${r}" fill="url(#bpg${beaten ? 1 : 0})"/>
    ${[[-0.55, -0.55], [0.6, -0.4], [0.15, 0.65], [-0.6, 0.35]].map(([x, y]) => `<path d="M${x * r} ${y * r} l${x * r * 0.35} ${y * r * 0.35}" stroke="${c}" stroke-width="${r * 0.12}" stroke-linecap="round"/>`).join("")}
    ${beaten ? `<path d="M${-r * 0.4} ${-r * 0.15} q${r * 0.12} ${-r * 0.12} ${r * 0.24} 0 M${r * 0.16} ${-r * 0.15} q${r * 0.12} ${-r * 0.12} ${r * 0.24} 0" stroke="#082" stroke-width="5" fill="none" stroke-linecap="round"/>`
      : `<path d="M${-r * 0.48} ${-r * 0.32} L${-r * 0.12} ${-r * 0.12} L${-r * 0.48} ${-r * 0.02}Z M${r * 0.48} ${-r * 0.32} L${r * 0.12} ${-r * 0.12} L${r * 0.48} ${-r * 0.02}Z" fill="#ffe14d"/>`}
    <path d="M${-r * 0.42} ${r * 0.3} L${r * 0.42} ${r * 0.3} ${beaten ? `Q0 ${r * 0.62} ${-r * 0.42} ${r * 0.3}` : `L${r * 0.3} ${r * 0.46} L${r * 0.15} ${r * 0.3} L0 ${r * 0.46} L${-r * 0.15} ${r * 0.3} L${-r * 0.3} ${r * 0.46}Z`}" fill="${beaten ? "#0b3" : "#fff"}" opacity=".9"/>`;
}
const ROCKET = `<g class="rocket"><path d="M0 -26 C10 -16 12 -2 10 12 L-10 12 C-12 -2 -10 -16 0 -26Z" fill="#e9eef2"/><circle cy="-6" r="5" fill="#4fc1e9" stroke="#26313a" stroke-width="2"/><path d="M-10 4 L-18 16 L-10 14Z M10 4 L18 16 L10 14Z" fill="#ff4d4d"/><path d="M-6 12 Q0 30 6 12Z" fill="#ffb02e"/></g>`;
function mapSVG(si) {
  const sec = SECTORS[si], W = 1120, H = 450, P = paceInfo(ME.pacing), today = P?.today || todayIso();
  const ks = STOPS.map((st, k) => ({ st, k })).filter(({ k }) => sectorOf(k) === si);
  const worlds = ks.filter((x) => x.st.kind === "w"), bossK = ks.find((x) => x.st.kind === "b");
  const slots = SLOTS[worlds.length] || SLOTS[5];
  const pos = worlds.map((x, i) => slots[i]), bpos = [1030, 225];
  const pts = [...pos, bpos];
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += ` C${x0 + (x1 - x0) * 0.5} ${y0}, ${x0 + (x1 - x0) * 0.5} ${y1}, ${x1} ${y1}`; }
  const nodes = worlds.map(({ st, k }, i) => {
    const w = st.w, [x, y] = pos[i], up = y < 230;
    const done = wDone(w), cleared = clearedForPace(ME.progress, w.n), cur = k === UI.cur, lk = locked(w);
    const due = P?.due(w.n), late = due && due < today && !cleared;
    const dive = w.m.find((m) => m.t === "d"), diveDone = dive && mDone(dive), diveOpen = cleared;
    const [mx, my] = [x + 52, up ? y + 64 : y - 64];
    const sub = done ? "★ Planet cleared" : lk ? "Locked" : late ? "Overdue" : due ? "Due " + niceDate(due).replace(/^\w+, /, "") : `${coreOf(w).filter(mDone).length}/${coreOf(w).length} missions`;
    return `<path d="M${x} ${y} Q${(x + mx) / 2 + (mx > x ? 12 : -12)} ${y} ${mx} ${my}" fill="none" stroke="#f3cf7a" stroke-opacity="${diveOpen ? 0.7 : 0.25}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
      <g class="moon${diveOpen ? "" : " dim"}" transform="translate(${mx} ${my})" tabindex="0" role="link" data-k="${k}" data-dive="${dive?.id || ""}" aria-label="Deeper Dive moon of World ${w.n}: ${diveDone ? "done" : diveOpen ? "unlocked" : "locked until the planet is cleared"}">
        <circle r="15" fill="${diveOpen ? "#cfd8e3" : "#4a5560"}"/><circle cx="-4" cy="-4" r="4" fill="#000" opacity=".2"/><circle cx="5" cy="4" r="3" fill="#000" opacity=".2"/>
        ${diveDone ? `<text y="5" text-anchor="middle" font-size="14" fill="#3a2a00">★</text>` : diveOpen ? "" : `<text y="5" text-anchor="middle" font-size="11" fill="#cfd8e3">🔒</text>`}
        <text class="mlabel" y="${up ? 32 : -22}" text-anchor="middle">Deeper Dive</text></g>
      <g class="node${cur ? " current" : ""}${lk ? " dim" : ""}${late ? " late" : ""}" transform="translate(${x} ${y})" tabindex="0" role="link" data-k="${k}" aria-label="World ${w.n}: ${esc(w.g)}, ${esc(sub)}">
        ${cur ? `<circle class="ring" r="58" fill="none" stroke="#f3cf7a" stroke-width="4" stroke-dasharray="6 6"/>` : late ? `<circle r="54" fill="none" stroke="#ff4d4d" stroke-width="3"/>` : ""}
        ${planetSVG(w.n, 42, lk)}
        <text y="12" text-anchor="middle" class="pnum">${w.n}</text>
        ${done ? `<g transform="translate(34 -36)"><circle r="14" fill="#f3cf7a"/><text text-anchor="middle" y="6" font-size="17" fill="#3a2a00">★</text></g>` : ""}
        ${cur ? `<g transform="translate(-58 -46) rotate(-30)">${ROCKET}</g>` : ""}
        <text class="label" text-anchor="middle" y="${up ? -64 : 72}">World ${w.n}: ${esc(w.g)}</text>
        <text class="sub${late ? " bad" : ""}" text-anchor="middle" y="${up ? -46 : 92}">${esc(sub)}</text></g>`;
  }).join("");
  const b = bossK.st.b, bi = bossInfo(ME.progress, b.id), beaten = bossDefeated(ME.progress, b.id), bcur = bossK.k === UI.cur;
  const bday = P ? P.dates[BOSS_SPANS[b.id].first - 1] : null, bopen = bossOpen(ME.progress, b.id, P?.dates, today), blk = (ME.locks || []).includes(b.id);
  const bsub = beaten ? "★ Defeated!" : blk ? "Locked" : bi.attempts ? `Test ${bi.best}/${bi.total}` : bopen ? "Ready to fight!" : bday ? "Boss day " + niceDate(bday).replace(/^\w+, /, "") : "Clear the planets";
  const boss = `<g class="node boss${bcur ? " current" : ""}" transform="translate(${bpos[0]} ${bpos[1]})" tabindex="0" role="link" data-k="${bossK.k}" aria-label="Boss ${b.n}: ${esc(b.name)}, ${esc(bsub)}">
      ${bcur ? `<circle class="ring" r="72" fill="none" stroke="#f3cf7a" stroke-width="4" stroke-dasharray="6 6"/>` : ""}
      ${bossPlanetSVG(54, beaten)}${bcur ? `<g transform="translate(-70 -54) rotate(-30)">${ROCKET}</g>` : ""}
      <text class="label" text-anchor="middle" y="84">Boss ${b.n}</text><text class="label" text-anchor="middle" y="104">${esc(b.name)}</text><text class="sub${bopen && !beaten ? " hot" : ""}" text-anchor="middle" y="124">${esc(bsub)}</text></g>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Star map: ${esc(sec.name)}">${starfield(sec, W, H)}
    <text x="24" y="38" class="secname">System ${si + 1}: ${esc(sec.name)}</text><text x="24" y="60" class="secsub">Worlds ${b.worlds[0]}–${b.worlds.at(-1)} · Boss ${b.n} guards the way out</text>
    <path d="${d}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="16" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${sec.glow}" stroke-opacity=".8" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round"/>
    ${nodes}${boss}</svg>`;
}
const stopName = (st) => (st.kind === "w" ? `World ${st.w.n}: ${st.w.g}` : `Boss ${st.b.n}: ${st.b.name}`);
// Previous / next buttons: under the map, and again at the end of each planet's missions.
function hopHTML(where) {
  const k = UI.cur, prev = STOPS[k - 1], next = STOPS[k + 1];
  return `<button class="hopbtn" type="button" data-hop="-1"${prev ? "" : " disabled"} aria-label="${prev ? "Go to " + esc(stopName(prev)) : "This is the first planet"}"><span class="arr">←</span><span><small>Previous ${prev?.kind === "b" ? "boss" : "planet"}</small><b>${prev ? esc(stopName(prev)) : "Start of the quest"}</b></span></button>
    ${where === "map" ? `<span class="hopnow">You're on <b>${esc(stopName(STOPS[k]))}</b> · ${k + 1} of ${STOPS.length}</span>` : ""}
    <button class="hopbtn next" type="button" data-hop="1"${next ? "" : " disabled"} aria-label="${next ? "Go to " + esc(stopName(next)) : "This is the last stop"}"><span><small>Next ${next?.kind === "b" ? "boss" : "planet"}</small><b>${next ? esc(stopName(next)) : "End of the quest"}</b></span><span class="arr">→</span></button>`;
}
function wireHop(el, scroll) {
  $$("[data-hop]", el).forEach((b) => (b.onclick = () => { go(UI.cur + +b.dataset.hop); if (scroll) $("world").scrollIntoView({ behavior: "smooth", block: "start" }); }));
}
function strip() {
  $("hop").innerHTML = hopHTML("map"); wireHop($("hop"), false);
  const si = UI.sector ?? sectorOf(UI.cur);
  $("sectors").innerHTML = SECTORS.map((sec, i) => {
    const ws = sec.b.worlds.map((n) => W[n]), cleared = ws.filter((w) => wDone(w)).length, beat = bossDefeated(ME.progress, sec.b.id);
    return `<button type="button" role="tab" aria-selected="${i === si}" data-sec="${i}" class="${i === si ? "on" : ""}" style="--g:${sec.glow}"><b>System ${i + 1}: ${esc(sec.name)}</b><span>${cleared}/${ws.length} planets · Boss ${sec.b.n} ${beat ? "★" : "–"}</span></button>`;
  }).join("");
  $("strip").innerHTML = mapSVG(si);
  $$("[data-sec]", $("sectors")).forEach((b) => (b.onclick = () => { UI.sector = +b.dataset.sec; saveUI(); strip(); }));
  $$("[data-k]", $("strip")).forEach((g) => {
    const open = () => { UI.sector = null; if (g.dataset.dive) UI.open[g.dataset.dive] = true; go(+g.dataset.k); $("world").scrollIntoView({ behavior: "smooth", block: "start" }); };
    g.onclick = open; g.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
  });
}
function hud() {
  const x = ME.member.xp, r = rankFor(x);
  $("rank").textContent = r.name; $("xp").textContent = x.toLocaleString() + " XP";
  $("bc").textContent = (ME.member.badges || []).length + " / " + (W.length + BOSSES.length);
  $("xpfill").style.width = (r.next ? Math.min(100, (100 * (x - r.at)) / (r.next[0] - r.at)) : 100) + "%";
  $("xpnote").textContent = r.next ? (r.next[0] - x).toLocaleString() + " XP to " + r.next[1] : "Top rank reached. Legendary.";
  $("blist").innerHTML = STOPS.map((st) => st.kind === "w" ? `<span class="bdg${wDone(st.w) ? " got" : ""}" title="World ${st.w.n}">${esc(st.w.bd)}</span>` : `<span class="bdg boss${bossDefeated(ME.progress, st.b.id) ? " got" : ""}" title="Boss ${st.b.n}">${esc(st.b.name)} slayer</span>`).join("");
  paceBanner();
}
function paceBanner() {
  const el = $("pacebar"), P = paceInfo(ME.pacing);
  el.hidden = !P; if (!P) return;
  const pace = paceOf(ME.progress, P.dates, P.today);
  const next = W.find((w) => !clearedForPace(ME.progress, w.n));
  let html;
  if (P.day === 0) html = `<b>Class starts ${esc(niceDate(P.dates[0]))}.</b> Week 1 is Worlds ${weekWorlds(1).join(", ")}.`;
  else if (P.day > TOTAL_DAYS || (P.day === TOTAL_DAYS && P.today > P.dates.at(-1))) html = `<b>The 9 weeks are done.</b> Nice work, maker.`;
  else if (P.day > CONTENT_DAYS) html = `<b>Week 9: buffer week.</b> ${pace.behind.length ? `Finish World ${pace.behind.join(", World ")} first, then` : "Polish your final project,"} try Board trials and side quests.`;
  else {
    const ww = weekWorlds(P.week), wb = weekBosses(P.week);
    html = `<b>Week ${P.week} of 9</b> · this week: World${ww.length > 1 ? "s" : ""} ${ww.join(", ")}${wb.map((b) => ` + Boss ${b.n} on ${esc(niceDate(P.dates[BOSS_SPANS[b.id].first - 1]))}`).join("")}` +
      (next ? ` · next goal: clear World ${next.n} by ${esc(niceDate(P.due(next.n)))}` : "") +
      (pace.behind.length ? ` · <span class="late-t">${pace.behind.length} world${pace.behind.length > 1 ? "s" : ""} behind (World ${pace.behind.join(", ")})</span>` : pace.bossesBehind.length ? ` · <span class="late-t">Boss ${pace.bossesBehind.map((b) => bossById[b].n).join(", ")} still to beat</span>` : pace.ahead ? " · ahead of schedule" : " · on track");
  }
  el.innerHTML = html;
}
const url = (w, lv, sub) => "https://studio.code.org/courses/microbit-2026/units/1/lessons/" + (w + 1) + "/levels/" + lv + (sub ? "/sublevel/" + sub : "");
function mission(m, w, k) {
  const T = TAG[m.t], open = UI.open[m.id], d = mDone(m), sk = mSkip(m), diveLocked = m.t === "d" && !clearedForPace(ME.progress, w.n), lk = locked(w) || diveLocked;
  const dis = lk ? " disabled" : "";
  const head = `<button class="mh" type="button" data-o="${m.id}" aria-expanded="${!!open}"><span class="num">${d ? "✓" : sk ? "S" : k + 1}</span><span><span class="mt">${fmt(m.title)}</span><span class="mk"><span class="tag ${T[0]}">${T[1]}</span><span>${m.t === "h" ? "Uses your real micro:bit · bonus" : m.t === "d" ? (diveLocked ? "Locked: clear this world's missions to unlock" : "Side quest for early finishers · unlocked!") : "Code.org Lesson " + w.n + ", Level " + m.lv}</span>${sk ? "<span>Skipped by your teacher</span>" : ""}</span></span><span class="xp">${m.t === "s" ? "+" + XP.s + " each" : "+" + XP[m.t] + " XP"}</span></button>`;
  let body;
  if (m.t === "s") body = `<p class="goal">Optional bonus levels. Pick any you like; each one you finish earns XP.</p><div class="sq">${m.q.map((q, i) => `<label><input type="checkbox" data-m="${m.id}" data-i="${i}"${ck(m.id, i) ? " checked" : ""}${dis}><span><b>${fmt(q[0])}</b><span>${fmt(q[1])}</span> · <a href="${url(w.n, m.lv, i + 1)}" target="_blank" rel="noopener">open</a></span></label>`).join("")}</div>`;
  else if (m.t === "h") body = `<p class="goal">${fmt(m.goal)} ${L.on ? "" : "<b>Connect your micro:bit in Board link to play.</b>"}</p><ol class="steps">${m.steps.map((s, i) => { const key = m.keys[i]; return `<li><label><input type="checkbox" data-m="${m.id}" data-i="${i}"${ck(m.id, i) ? " checked" : ""}${key || lk ? " disabled" : ""}><span>${fmt(s)}${key ? `<span class="auto">${key === "a10" ? "(" + Math.min(L.na, 10) + "/10) " : key === "b5" ? "(" + Math.min(L.nb, 5) + "/5) " : key === "sh3" ? "(" + Math.min(L.ns, 3) + "/3) " : ""}checked by the board</span>` : ""}</span></label></li>`; }).join("")}</ol>`;
  else body = `${diveLocked ? `<p class="lockmsg">Finish every core mission in World ${w.n} to unlock this challenge. It's here for when you're done early.</p>` : ""}<p class="goal">${fmt(m.goal)}</p><ol class="steps">${m.steps.map((s, i) => `<li><label><input type="checkbox" data-m="${m.id}" data-i="${i}"${ck(m.id, i) ? " checked" : ""}${dis}><span>${fmt(s)}</span></label></li>`).join("")}</ol>${m.win ? `<p class="win"><b>Win condition:</b> ${fmt(m.win)}</p>` : ""}${m.t === "d" ? `<p class="lnote">Build it in your own App Lab project. Deeper Dives are optional and don't count toward pace.</p>` : `<a class="go" href="${url(w.n, m.lv)}" target="_blank" rel="noopener">Open this level in Code.org →</a>`}`;
  return `<article class="m${d ? " done" : ""}${m.t === "b" ? " boss" : ""}${m.t === "d" ? " dive" + (diveLocked ? " dlock" : "") : ""}${open ? " open" : ""}">${head}<div class="mb">${body}</div></article>`;
}
function bossView(b) {
  const P = paceInfo(ME.pacing), st = bossInfo(ME.progress, b.id), beaten = bossDefeated(ME.progress, b.id);
  const lk = (ME.locks || []).includes(b.id), open = !lk && bossOpen(ME.progress, b.id, P?.dates, P?.today || todayIso());
  const bm = b.buildMission, buildDone = prog(bm.id).status === "done", day = P ? P.dates[BOSS_SPANS[b.id].first - 1] : null;
  const canTake = open && (st.attempts === 0 || st.retake);
  const hp = beaten ? 0 : Math.max(0, 100 - (st.best != null ? (70 * st.best) / st.total : 0) - (buildDone ? 30 : 0));
  UI.ans ||= {}; const ans = (UI.ans[b.id] ||= []);
  $("world").innerHTML = `<div class="wh"><h2>Boss ${b.n}: ${esc(b.name)}</h2><p class="orig">Test on Worlds ${b.worlds[0]}–${b.worlds.at(-1)} · a full class period${day ? " · boss day " + esc(niceDate(day)) : ""} · +${BOSS_XP} XP and a badge</p></div>
  <div class="bossbar"><div class="bossphoto">${photoBoard(BOSS_ICON, { label: "A real micro:bit showing the boss" })}</div>
    <div style="flex:1"><b>${beaten ? "Defeated!" : "Boss health"}</b><div class="xpbar" style="margin-top:6px"><i style="width:${hp}%;background:var(--led)"></i></div>
    <p class="lnote">${beaten ? "You beat this boss. Nice work, maker." : "Beat it with 70% or better on the test (9 of 12) and a finished build challenge."}</p></div></div>
  <p class="story">${esc(b.story)}</p>
  ${lk ? `<p class="lockmsg">Your teacher has locked this boss for now.</p>` : !open ? `<p class="lockmsg">Opens when you clear Worlds ${b.worlds[0]}–${b.worlds.at(-1)}${day ? ", or on boss day (" + esc(niceDate(day)) + ")" : ""}. Until then, finish your missions and try the Deeper Dives.</p>` : ""}
  <div class="missions">
    <article class="m boss open"><div class="mh" style="cursor:default"><span class="num">${buildDone ? "✓" : 1}</span><span><span class="mt">Part 1 · Build: ${esc(bm.title)}</span><span class="mk"><span class="tag tb">Boss build</span><span>Your own App Lab project</span></span></span><span class="xp">${bm.steps.filter((_, i) => ck(bm.id, i)).length}/${bm.steps.length}</span></div>
      <div class="mb"><p class="goal">${fmt(bm.goal)}</p><ol class="steps">${bm.steps.map((x, i) => `<li><label><input type="checkbox" data-m="${bm.id}" data-i="${i}"${ck(bm.id, i) ? " checked" : ""}${open ? "" : " disabled"}><span>${fmt(x)}</span></label></li>`).join("")}</ol><p class="win"><b>Win condition:</b> ${fmt(bm.win)}</p></div></article>
    <article class="m boss open"><div class="mh" style="cursor:default"><span class="num">${st.best != null && st.best / st.total >= 0.7 ? "✓" : 2}</span><span><span class="mt">Part 2 · Test: ${b.questions.length} questions</span><span class="mk"><span class="tag tb">Boss test</span><span>${st.attempts ? `Best score ${st.best}/${st.total}${st.attempts > 1 ? " · " + st.attempts + " tries" : ""}` : "One try, unless your teacher allows a retake"}</span></span></span><span class="xp">${st.best != null ? Math.round((100 * st.best) / st.total) + "%" : ""}</span></div>
      <div class="mb">${canTake ? `<form id="bossform" class="quiz">${b.questions.map((q, i) => `<fieldset><legend><b>${i + 1}.</b> ${esc(q[0])}</legend>${q[1].map((c, j) => `<label><input type="radio" name="q${i}" value="${j}"${ans[i] === j ? " checked" : ""}> <span>${esc(c)}</span></label>`).join("")}</fieldset>`).join("")}
          <div class="row"><button class="cbtn" type="submit">Submit test</button><span class="lnote" id="qleft"></span></div></form>`
        : st.attempts ? `<p>${st.best / st.total >= 0.7 ? "<b>Passed!</b>" : "<b>Not passed yet.</b> Ask your teacher about a retake."} Your last try: ${st.last ?? st.best}/${st.total}.</p><ol class="qres">${b.questions.map((q, i) => `<li class="${st.correct[i] ? "ok" : "no"}">${st.correct[i] ? "✓" : "✗"} ${esc(q[0])}</li>`).join("")}</ol>`
        : `<p class="lnote">The test opens with the boss.</p>`}</div></article>
  </div>
  <nav class="hop hopend" aria-label="Move between planets">${hopHTML("end")}</nav>`;
  wireHop($("world"), true);
  $$("input[data-m]", $("world")).forEach((cb) => (cb.onchange = () => setStep(cb.dataset.m, +cb.dataset.i, cb.checked)));
  watchPhoto($("world"));
  const f = $("bossform"); if (!f) return;
  const left = () => { const n = b.questions.filter((_, i) => ans[i] == null).length; $("qleft").textContent = n ? n + " unanswered" : "All answered"; };
  left();
  $$("input[type=radio]", f).forEach((r) => (r.onchange = () => { ans[+r.name.slice(1)] = +r.value; left(); }));
  f.onsubmit = (e) => {
    e.preventDefault();
    const blank = b.questions.filter((_, i) => ans[i] == null).length;
    const { close } = openModal(`<h2 id="modal-title">Submit your test?</h2><p>${blank ? `<b>${blank} question${blank > 1 ? "s are" : " is"} unanswered.</b> ` : ""}You get one try unless your teacher allows a retake.</p><div class="row"><button class="btn pri" id="y" type="button">Submit</button><button class="btn" data-close type="button" autofocus>Keep working</button></div>`, true);
    $("y").onclick = async () => {
      $("y").disabled = true;
      try {
        const r = await api("POST", "/api/mq/boss/" + b.id, { answers: b.questions.map((_, i) => ans[i] ?? -1) });
        close(); ME.progress = r.progress; ME.member = r.member; delete UI.ans[b.id];
        if (r.defeated) { toast(`Boss defeated! +${r.gain} XP`); mbScroll("BOSS DOWN!"); }
        else toast(`Score: ${r.score}/${r.total}${r.passed ? " · passed! Finish the build to win." : ""}`);
        refresh(!!r.defeated); loadBoard();
      } catch (err) { close(); toast(errText(err)); }
    };
  };
}
function world() {
  const stop = curStop();
  if (stop.kind === "b") return bossView(stop.b);
  const w = stop.w, c = coreOf(w);
  $("world").innerHTML = `<div class="wh"><h2>World ${w.n}: ${esc(w.g)}</h2><p class="orig">Code.org Lesson ${w.n}: ${esc(w.o)} · ${c.filter(mDone).length} of ${c.length} missions cleared · badge: ${esc(w.bd)}${(() => { const P = paceInfo(ME.pacing), sp = SPANS[w.n]; return ` · planned for week ${weekOfDay(sp.first)}${weekOfDay(sp.last) !== weekOfDay(sp.first) ? "–" + weekOfDay(sp.last) : ""} (${sp.last - sp.first + 1} days)${P ? ", due " + esc(niceDate(P.due(w.n))) : ""}`; })()}</p></div>
  ${locked(w) ? `<p class="lockmsg">Your teacher has locked this world for now. You can read the missions, but you can't tick them off yet.</p>` : ""}
  <p class="qotd"><b>Quest question:</b> ${esc(w.q)}</p><p class="story">${fmt(w.s)}</p>
  <div class="legend">${Object.keys(TAG).map((t) => `<span class="tag ${TAG[t][0]}">${TAG[t][1]}</span>`).join("")}</div>
  <div class="missions">${w.m.map((m, k) => mission(m, w, k)).join("")}</div>
  <nav class="hop hopend" aria-label="Move between planets">${hopHTML("end")}</nav>`;
  wireHop($("world"), true);
  $$("[data-o]", $("world")).forEach((b) => (b.onclick = () => { UI.open[b.dataset.o] = !UI.open[b.dataset.o]; saveUI(); world(); }));
  $$("input[data-m]", $("world")).forEach((cb) => (cb.onchange = () => setStep(cb.dataset.m, +cb.dataset.i, cb.checked)));
}
function render() { strip(); hud(); world(); board(stopIcon(curStop()), false); paintBtns(); }
function refresh(fl) { const y = window.scrollY; strip(); hud(); world(); window.scrollTo(0, y); board(stopIcon(curStop()), fl); paintBtns(); }
function go(k) { UI.cur = (k + STOPS.length) % STOPS.length; UI.sector = null; L.na = L.nb = L.ns = 0; L.t0 = L.temp; saveUI(); render(); mbIcon(); }

// Saves go one at a time so quick clicks can't arrive out of order.
let saving = 0, chain = Promise.resolve();
function setStep(mid, i, on) {
  const m = missionById[mid]; if (!m) return;
  const before = { ...prog(mid), steps: [...prog(mid).steps] };
  const steps = new Set(before.steps); on ? steps.add(i) : steps.delete(i);
  const list = [...steps].sort((a, b) => a - b);
  ME.progress[mid] = { ...before, steps: list, status: before.status === "done" || doneFor(m, list) ? "done" : before.status || "started" };
  refresh(false);
  saving++;
  chain = chain.then(async () => {
    try {
      const r = await api("PUT", "/api/mq/progress/" + encodeURIComponent(mid), { steps: list });
      ME.progress[mid] = { ...ME.progress[mid], ...r.row }; ME.member = r.member;
      if (r.defeated) { toast(`Boss defeated! +${r.gain} XP`); mbScroll("BOSS DOWN!"); }
      else if (r.newBadges?.length) { const w = W.find((x) => "w" + x.n === r.newBadges[0]); toast("Badge unlocked: " + (w?.bd || "") + "!"); mbScroll("BADGE!"); }
      else if (r.gain > 0) { toast("+" + r.gain + " XP · " + (m.t === "s" ? "side quest" : m.title)); mbScroll("+" + r.gain); }
      refresh(r.gain > 0); if (r.gain > 0) loadBoard();
    } catch (e) {
      ME.progress[mid] = before; refresh(false);
      if (e.status === 401) { store.set(TOKEN, null); return pageLogin(ERR.signed_out); }
      toast(ERR[e.message] || "Couldn't save. Check your internet and try again.");
    } finally { saving--; }
  });
}

// ---------- Board link: Web Serial + micro:bit Firmata (the firmware Code.org Maker Setup installs) ----------
const L = { on: false, port: null, wr: null, rd: null, a: false, b: false, light: null, temp: null, t0: null, x: 0, y: 0, na: 0, nb: 0, ns: 0, pins: [1, 1, 1], ver: false };
const SYX = 0xf0, END = 0xf7;
function linkPanelHTML() {
  return `<div class="link" id="link">
    <div class="lrow"><h3>Board link</h3><span class="pill" id="lstat">Not connected</span></div>
    <div class="lrow"><button class="cbtn" id="conn" type="button">Connect micro:bit</button><button class="ghost" id="disc" type="button" hidden>Disconnect</button></div>
    <p class="lnote" id="lnote">Plug in a micro:bit that has run Code.org's Maker Setup, then connect with Chrome or Edge. Close any App Lab tab using the board first.</p>
    <div class="read" id="read" hidden>
      <div id="rA"><b>up</b><span>Button A</span></div><div id="rB"><b>up</b><span>Button B</span></div>
      <div><b id="rL">–</b><span>Light 0–255</span></div><div><b id="rT">–</b><span>Temp °C</span></div>
      <div><b id="rX">–</b><span>Tilt x</span></div><div><b id="rY">–</b><span>Tilt y</span></div>
      <div><b id="rS">0</b><span>Shakes</span></div><div><b id="rP">– – –</b><span>Pins 0 1 2</span></div>
    </div>
    <form class="msg" id="msgf" hidden><input id="msgi" maxlength="40" placeholder="Message to scroll" aria-label="Message to scroll on the micro:bit"><button class="cbtn" type="submit">Send</button></form>
    <button class="ghost" id="blink" type="button" hidden>Blink pin 0 LED</button>
  </div>`;
}
async function send(arr) { if (!L.wr) return; try { await L.wr.write(new Uint8Array(arr)); } catch { lost(); } }
function mbIcon() { if (!L.on) return; const bits = stopIcon(curStop()).replace(/ /g, "").split("").map(Number); send([SYX, 0x02, 0, ...bits, END]); }
function mbScroll(t) { if (!L.on) return; const b = [...new TextEncoder().encode(String(t).slice(0, 40))]; send([SYX, 0x04, 100, ...b.flatMap((x) => [x & 0x7f, (x >> 7) & 0x7f]), END]); }
function award(key) { const stop = curStop(); if (stop.kind !== "w") return; const w = stop.w; const m = w.m.find((x) => x.t === "h"); if (!m || locked(w)) return; const i = m.keys.indexOf(key); if (i < 0 || ck(m.id, i)) return; setStep(m.id, i, true); }
function note(t, err) { const n = $("lnote"); if (!n) return; n.textContent = t; n.classList.toggle("err", !!err); }
function paintBtns() {
  const a = $("btnA"), b = $("btnB"), photo = !!a?.closest("svg.photo");
  for (const [el, on] of [[a, L.a], [b, L.b]]) { if (!el) continue; if (photo) { el.setAttribute("stroke", on ? "#f3cf7a" : "transparent"); el.setAttribute("fill", on ? "rgba(243,207,122,.25)" : "transparent"); } else el.setAttribute("fill", on ? "rgba(243,207,122,.45)" : "transparent"); }
}
function showRead() {
  if (!$("rA")) return;
  $("rA").classList.toggle("hot", L.a); $("rA").firstChild.textContent = L.a ? "down" : "up"; $("rB").classList.toggle("hot", L.b); $("rB").firstChild.textContent = L.b ? "down" : "up";
  $("rL").textContent = L.light ?? "–"; $("rT").textContent = L.temp ?? "–"; $("rX").textContent = L.x; $("rY").textContent = L.y; $("rS").textContent = L.ns; $("rP").textContent = L.pins.map((p) => (p ? "·" : "●")).join(" ");
}
function liveCount() { if ($("world")?.querySelector(".auto")) world(); }
function onEvt(src, ev) {
  if (src === 1 || src === 2) {
    const d = ev === 1, u = ev === 2; if (!d && !u) return;
    if (src === 1) L.a = d; else L.b = d;
    if (d) { if (src === 1) { L.na++; award("a"); if (L.na >= 10) award("a10"); } else { L.nb++; award("b"); if (L.nb >= 5) award("b5"); } if (L.a && L.b) award("ab"); liveCount(); }
    paintBtns(); showRead();
  } else if ((src === 13 || src === 27) && ev === 11) { L.ns++; showRead(); if (L.ns >= 3) award("sh3"); liveCount(); }
  else if ((src === 7 || src === 6) && ev === 1) mbIcon();
}
function onAnalog(ch, v) {
  if (v > 8191) v -= 16384;
  if (ch === 8) { L.x = v; if (v < -400) award("tl"); if (v > 400) award("tr"); }
  else if (ch === 9) { L.y = v; if (v < -400) award("tf"); }
  else if (ch === 11) { L.light = v; if (v < 15) award("dark"); if (v > 150) award("bright"); }
  else if (ch === 12) { L.temp = v; if (L.t0 == null) L.t0 = v; if (v >= L.t0 + 1) award("warm"); }
  showRead();
}
function onDigital(port, mask) { if (port !== 0) return; const np = [0, 1, 2].map((i) => (mask >> i) & 1); np.forEach((p, i) => { if (!p && L.pins[i]) award("p" + i); }); L.pins = np; showRead(); }
const ps = { cmd: null, args: [], sx: false };
function parse(chunk) {
  for (const b of chunk) {
    if (b & 0x80) { if (b === END && ps.sx) { sysex(ps.args); ps.sx = false; ps.cmd = null; continue; } if (b === SYX) { ps.sx = true; ps.args = []; continue; } ps.sx = false; ps.cmd = b; ps.args = []; continue; }
    if (ps.sx) { if (ps.args.length < 300) ps.args.push(b); continue; }
    if (ps.cmd == null) continue;
    ps.args.push(b);
    if (ps.args.length === 2) { const c = ps.cmd, a = ps.args, v = a[0] | (a[1] << 7); if ((c & 0xf0) === 0xe0) onAnalog(c & 0x0f, v); else if ((c & 0xf0) === 0x90) onDigital(c & 0x0f, v); else if (c === 0xf9) L.ver = true; ps.args = []; }
  }
}
function sysex(a) { if (a[0] === 0x0d && a.length >= 7) onEvt(a[1] | (a[2] << 7) | (a[3] << 14), a[4] | (a[5] << 7) | (a[6] << 14)); if (a[0] === 0x79) L.ver = true; }
async function readLoop() {
  while (L.port && L.port.readable) {
    L.rd = L.port.readable.getReader();
    try { for (;;) { const { value, done } = await L.rd.read(); if (done) break; if (value) parse(value); } } catch {} finally { try { L.rd.releaseLock(); } catch {} }
    if (!L.on) break;
  }
  lost();
}
async function connect() {
  if (!("serial" in navigator)) { note("This browser can't reach USB devices. Use Chrome or Edge on a laptop or desktop.", true); return; }
  try { L.port = await navigator.serial.requestPort({ filters: [{ usbVendorId: 0x0d28 }] }); }
  catch (e) { note(e.name === "NotFoundError" ? "No board picked. Plug in your micro:bit and try again." : e.name === "SecurityError" ? "This page isn't allowed to use USB here." : "Couldn't open the board picker: " + e.message, e.name !== "NotFoundError"); return; }
  try { await L.port.open({ baudRate: 57600 }); } catch { note("The board is busy. Close App Lab or any other tab using it, unplug and replug, then try again.", true); L.port = null; return; }
  L.wr = L.port.writable.getWriter(); L.on = true; L.ver = false; L.na = L.nb = L.ns = 0; L.t0 = null; readLoop();
  await send([0xf9, 0, 0]); await send([SYX, 0x79, END]); await send([SYX, 0x7a, 100, 0, END]);
  await send([0xf4, 11, 0x02]); for (const ch of [8, 9, 11, 12]) await send([0xc0 | ch, 1]);
  for (const p of [0, 1, 2]) await send([0xf4, p, 0x0b]); await send([0xd0, 1]);
  $("lstat").textContent = "Connected"; $("lstat").className = "pill on";
  for (const id of ["conn"]) $(id).hidden = true; for (const id of ["disc", "read", "msgf", "blink"]) $(id).hidden = false;
  note("Linked! Your LEDs show this world's icon. Board trials now check themselves."); mbIcon(); award("conn"); refresh(false);
  setTimeout(() => { if (L.on && !L.ver) { $("lstat").textContent = "No reply"; $("lstat").className = "pill warn"; note("The board isn't answering. Run Code.org's Maker Setup once so it has the right firmware, then reconnect.", true); } }, 3500);
}
async function disconnect() { L.on = false; try { L.rd && (await L.rd.cancel()); } catch {} try { L.wr && L.wr.releaseLock(); } catch {} try { L.port && (await L.port.close()); } catch {} L.port = L.wr = L.rd = null; lost(); }
function lost() {
  L.on = false; L.a = L.b = false;
  if (!$("lstat")) return;
  $("lstat").textContent = "Not connected"; $("lstat").className = "pill"; $("conn").hidden = false;
  for (const id of ["disc", "read", "msgf", "blink"]) $(id).hidden = true;
  paintBtns(); if ($("world")) world();
}
function wireLink() {
  $("conn").onclick = connect;
  $("disc").onclick = () => { disconnect(); note("Disconnected. You can now use the board in App Lab."); };
  $("msgf").onsubmit = (e) => { e.preventDefault(); const t = $("msgi").value.trim(); if (!t) return; mbScroll(t); award("msg"); };
  $("blink").onclick = async () => { for (let i = 0; i < 6; i++) { await send([0xf4, 0, 0x01]); await send([0xf5, 0, i % 2 ? 0 : 1]); await new Promise((r) => setTimeout(r, 300)); } await send([0xf4, 0, 0x0b]); award("led"); };
  if (!("serial" in navigator)) note("To connect a micro:bit, open Maker Quest in Chrome or Edge on a laptop or desktop.");
}
if (navigator.serial) navigator.serial.addEventListener("disconnect", () => { L.on = false; L.port = null; lost(); note("The board was unplugged.", true); });
document.addEventListener("keydown", (e) => { if (!ME || !$("strip") || !$("modal").hidden || e.target.closest("input,textarea,select")) return; if (e.key === "ArrowLeft") go(UI.cur - 1); if (e.key === "ArrowRight") go(UI.cur + 1); });

// =====================================================================
// Teacher dashboard
// =====================================================================
const T = { classId: store.get("mq-teacher-class") || "", tab: "progress", data: null, at: 0, showPw: false, pw: null, me: null, sort: "name" };
const TABS = [["progress", "Progress"], ["lessons", "Lessons"], ["pacing", "Pacing"], ["allwork", "All work"], ["mastery", "Mastery"], ["hardware", "Board trials"], ["students", "Students"], ["classes", "Classes"], ["controls", "Controls"], ["leaderboard", "Leaderboard"]];
const allMode = () => T.data?.classId === "all";
const classNames = () => Object.fromEntries((T.data?.classes || []).map((c) => [c.id, c.name]));
const nStu = (n) => n + (n === 1 ? " student" : " students");
async function loadTeacher() {
  T.data = await api("GET", "/api/mq/teacher/overview?class=" + encodeURIComponent(T.classId || ""));
  T.classId = T.data.classId || ""; store.set("mq-teacher-class", T.classId); T.at = Date.now();
}
const savedAt = (s) => Math.max(0, ...Object.values(s.progress).map((p) => p.updated_at || 0));
const workingOn = (p) => { for (const w of W) for (const m of coreOf(w)) if (!["done", "skipped"].includes(p[m.id]?.status)) return m; return null; };
const wCount = (p, w) => { const c = coreOf(w); return { done: c.filter((m) => p[m.id]?.status === "done").length, skip: c.filter((m) => p[m.id]?.status === "skipped").length, started: c.filter((m) => p[m.id]?.status === "started").length, n: c.length }; };

async function pageTeacher(me) {
  T.me = me?.user || T.me;
  try { await loadTeacher(); } catch (e) { if (e.status === 401) { store.set(TOKEN, null); return pageLogin(ERR.signed_out); } app.innerHTML = `<div class="page"><p class="panel">Couldn't load the dashboard. ${esc(errText(e))}</p></div>`; return; }
  drawTeacher();
  clearInterval(poll);
  poll = setInterval(async () => {
    const a = $("ago"); if (a) a.textContent = "updated " + Math.round((Date.now() - T.at) / 1000) + "s ago";
    const typing = document.activeElement?.matches?.("input,textarea,select");
    if (document.visibilityState === "visible" && Date.now() - T.at > 20000 && $("modal").hidden && !typing && !["students", "classes", "lessons", "pacing"].includes(T.tab)) { try { await loadTeacher(); drawTeacher(); } catch {} }
  }, 5000);
}
function drawTeacher() {
  const D = T.data;
  const total = D.classes.reduce((n, c) => n + c.students, 0);
  app.innerHTML = `<div class="top"><span>${ava(T.me, 24)}</span><b>${esc(T.me?.name || "Teacher")}</b><span>Maker Quest teacher dashboard</span><span class="sp"></span><a href="../pyquest/#teacher">PyQuest dashboard</a><button class="ghost" id="so" type="button">Sign out</button></div>
  <div class="page">
    <div class="row"><h1 style="font-size:clamp(28px,3.6vw,40px)">Maker Quest dashboard</h1><span class="sp"></span>
      ${D.classes.length ? `<select class="t" id="cls" aria-label="Class">${D.classes.length > 1 ? `<option value="all"${D.classId === "all" ? " selected" : ""}>All classes (${nStu(total)})</option>` : ""}${D.classes.map((c) => `<option value="${esc(c.id)}"${c.id === D.classId ? " selected" : ""}>${esc(c.name)} (${nStu(c.students)})</option>`).join("")}</select>` : ""}
      <button class="btn" id="addcls" type="button">+ Add class</button>
      <span class="chip"><span class="dot"></span>Live · <span id="ago">updated 0s ago</span></span></div>
    ${D.classes.length ? `<div class="tabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" type="button" data-tab="${k}" aria-selected="${T.tab === k}">${l}</button>`).join("")}</div><section id="tab"></section>`
      : `<div class="panel"><h2>Start with a class</h2><p>Maker Quest classes are separate from your PyQuest classes. Make one for each period that uses micro:bits, then add students in the Students tab. PyQuest students can join with the login they already have.</p><button class="btn pri" id="first" type="button">+ Add your first class</button></div>`}
  </div>`;
  $("so").onclick = signOut;
  $("addcls").onclick = addClass; $("first") && ($("first").onclick = addClass);
  if (!D.classes.length) return;
  $("cls").onchange = async (e) => { T.classId = e.target.value; T.showPw = false; T.pw = null; await loadTeacher(); drawTeacher(); };
  $$("[data-tab]").forEach((b) => (b.onclick = () => { T.tab = b.dataset.tab; drawTeacher(); }));
  ({ progress: tabProgress, lessons: tabLessons, pacing: tabPacing, allwork: tabAllWork, mastery: tabMastery, hardware: tabHardware, students: tabStudents, classes: tabClasses, controls: tabControls, leaderboard: tabBoard })[T.tab]($("tab"), D);
}
function addClass() {
  const { el, close } = openModal(`<h2 id="modal-title">Add a Maker Quest class</h2><label class="f">Class name<input class="t" id="cn" maxlength="40" autofocus placeholder="2Q7P micro:bit"></label><label style="display:flex;gap:10px;align-items:flex-start;margin:10px 0 4px;cursor:pointer"><input type="checkbox" id="cnlock" checked style="margin-top:4px"> <span>Start with every world and boss locked. Unlock them in Controls as the class gets there.</span></label><div class="err" id="cnerr" role="alert"></div><div class="row"><button class="btn pri" id="ok" type="button">Create</button><button class="btn" data-close type="button">Cancel</button></div>`, true);
  $("ok").onclick = async () => {
    const name = $("cn").value.replace(/\s+/g, " ").trim();
    try { const r = await api("POST", "/api/mq/teacher/classes", { name, locked: $("cnlock").checked }); T.classId = r.id; if (r.locks?.length) T.tab = "controls"; close(); await loadTeacher(); drawTeacher(); if (r.locks?.length) toast("Class created with everything locked. Unlock World 0 to begin."); }
    catch (e) { $("cnerr").textContent = errText(e); }
  };
}
const classPace = (classId) => paceInfo(T.data?.classes.find((c) => c.id === classId)?.pacing);
const studentPace = (s) => { const P = classPace(s.class_id); return P ? paceOf(s.progress, P.dates, P.today) : null; };
const whoHTML = (s) => `<span class="who">${ava(s)}<b>${esc(s.name)}</b>${online(s.last_seen) ? `<span class="dot" title="online"></span>` : ""}</span>`;
const classOf = (s) => (allMode() ? " · " + esc(classNames()[s.class_id] || "") : "");

function tabProgress(el, D) {
  if (!D.students.length) { el.innerHTML = `<p class="panel">No students yet. Add them in the Students tab.</p>`; return; }
  const quiet = D.students.filter((s) => !s.last_seen || Date.now() - s.last_seen > 7 * 864e5);
  el.innerHTML = `${quiet.length ? `<p class="lockmsg">Not seen in the last 7 days: ${quiet.map((s) => esc(s.name)).join(", ")}</p>` : ""}
  <div class="panel scroll"><table><thead><tr><th>Student</th>${STOPS.map((st) => st.kind === "b" ? `<th class="bth" title="Boss ${st.b.n}: ${esc(st.b.name)} (test score, best of ${st.b.questions.length})">B${st.b.n}${D.locks.includes(st.b.id) ? " 🔒" : ""}</th>` : `<th title="${esc(worldName(st.w.n))}${D.locks.includes("w" + st.w.n) ? " (locked)" : ""}">W${st.w.n}${D.locks.includes("w" + st.w.n) ? " 🔒" : ""}</th>`).join("")}<th>Pace</th><th class="nr">XP</th><th class="nr">Badges</th></tr></thead><tbody>
  ${D.students.map((s) => { const sp = studentPace(s); return `<tr><td><button class="btn small" data-stu="${esc(s.id)}" type="button">${whoHTML(s)}</button><div class="lnote">${esc(rankFor(s.xp).name)}${classOf(s)}${s.inPyQuest ? " · also in PyQuest" : ""}</div></td>${STOPS.map((st) => {
    if (st.kind === "b") { const bi = bossInfo(s.progress, st.b.id), beat = bossDefeated(s.progress, st.b.id), late = sp?.bossesBehind?.includes(st.b.id);
      return `<td><span class="cell ${beat ? "done" : bi.attempts ? "part" : ""}${late ? " late" : ""}" title="Boss ${st.b.n}: ${beat ? "beaten" : bi.attempts ? "test taken, not beaten yet" : "not taken"}${bi.retake ? " · retake allowed" : ""}">${bi.best != null ? bi.best + "/" + bi.total : "–"}${beat ? " ✓" : ""}</span></td>`; }
    const w = st.w;
    const c = wCount(s.progress, w); const cls = c.done === c.n ? "done" : c.done + c.skip === c.n ? "skip" : c.done || c.started || c.skip ? "part" : "";
    const lab = c.done === c.n ? "✓" : c.done + c.skip === c.n ? "S" : c.done || c.started || c.skip ? `${c.done}/${c.n}` : "–";
    const late = sp?.behind.includes(w.n);
    return `<td><span class="cell ${cls}${late ? " late" : ""}" title="${esc(worldName(w.n))}: ${c.done} of ${c.n} done${c.skip ? ", " + c.skip + " skipped" : ""}${late ? " · overdue" : ""}">${lab}</span></td>`;
  }).join("")}<td>${sp ? paceChip(sp) : `<span class="lnote">no calendar</span>`}</td><td class="nr">${s.xp}</td><td class="nr">${s.badges.length}</td></tr>`; }).join("")}</tbody></table></div>
  <p class="lnote">✓ world cleared · 2/4 core missions done · S skipped with catch-up · – not started · B columns = boss test score (✓ = boss beaten: 70%+ and build done) · red outline = past its due date in the Pacing calendar. Select a student to see every mission.</p>`;
  $$("[data-stu]", el).forEach((b) => (b.onclick = () => studentDrawer(b.dataset.stu)));
}
// Every world, mission and boss as students see it (read-only), with who in the class has finished each one.
async function bossKeys() { if (!T.keys) { try { T.keys = (await api("GET", "/api/mq/teacher/bosskeys")).keys; } catch { T.keys = {}; } } return T.keys; }
function tabLessons(el, D) {
  const P = allMode() ? null : paceInfo(D.pacing);
  if (T.ls == null) { const wk = P && P.day >= 1 && P.day <= CONTENT_DAYS ? weekWorlds(P.week)[0] : 0; T.ls = STOPS.findIndex((x) => x.kind === "w" && x.w.n === wk); }
  const stop = STOPS[T.ls] || STOPS[0], kids = D.students, n = kids.length;
  const names = (list) => list.length ? list.map((s) => `<button class="btn small" data-stu="${esc(s.id)}" type="button">${esc(s.name)}</button>`).join(" ") : `<span class="lnote">nobody</span>`;
  const pads = STOPS.map((x, k) => {
    if (x.kind === "b") { const beat = kids.filter((s) => bossDefeated(s.progress, x.b.id)).length; return `<button class="pad bosspad${k === T.ls ? " on" : ""}" data-ls="${k}" type="button"><span class="n">Boss ${x.b.n}</span><span class="t">${esc(x.b.name)}</span><span class="due">${n ? `${beat}/${n} beaten` : "test + build"}</span><span class="fill"><i style="width:${n ? (100 * beat) / n : 0}%"></i></span></button>`; }
    const cleared = kids.filter((s) => clearedForPace(s.progress, x.w.n)).length;
    return `<button class="pad${k === T.ls ? " on" : ""}" data-ls="${k}" type="button"><span class="n">World ${x.w.n}</span><span class="t">${esc(x.w.g)}</span><span class="due">${n ? `${cleared}/${n} cleared` : `${coreOf(x.w).length} missions`}</span><span class="fill"><i style="width:${n ? (100 * cleared) / n : 0}%"></i></span></button>`;
  }).join("");
  const prevNext = `<button class="btn small" id="lprev" type="button">← Back</button><button class="btn small" id="lnext" type="button">Next →</button>`;
  let main;
  if (stop.kind === "b") {
    const b = stop.b, bm = b.buildMission, key = T.keys?.[b.id];
    const takers = kids.filter((s) => bossInfo(s.progress, b.id).attempts);
    const pct = (i) => takers.length ? Math.round((100 * takers.filter((s) => bossInfo(s.progress, b.id).correct[i]).length) / takers.length) : null;
    const buildDone = kids.filter((s) => s.progress[bm.id]?.status === "done");
    main = `<div class="wh" style="margin-top:14px"><div class="row"><h2>Boss ${b.n}: ${esc(b.name)}</h2><span class="sp"></span>${prevNext}</div>
      <p class="orig">Test on Worlds ${b.worlds[0]}–${b.worlds.at(-1)} · boss day = class day ${BOSS_SPANS[b.id].first} (week ${weekOfDay(BOSS_SPANS[b.id].first)})${P ? ", " + esc(niceDate(P.dates[BOSS_SPANS[b.id].first - 1])) : ""} · pass = 9 of 12 + build done${D.locks?.includes(b.id) ? " · locked for this class" : ""}</p></div>
      <p class="story">${esc(b.story)}</p>
      <div class="panel scroll"><h2>Results</h2>${n ? `<table><thead><tr><th>Student</th><th class="nr">Best</th><th class="nr">Tries</th><th>Build</th><th>Status</th><th></th></tr></thead><tbody>${kids.map((s) => { const bi = bossInfo(s.progress, b.id); return `<tr><td>${whoHTML(s)}</td><td class="nr">${bi.best != null ? bi.best + "/" + bi.total : "–"}</td><td class="nr">${bi.attempts || ""}</td><td>${s.progress[bm.id]?.status === "done" ? "Done" : (s.progress[bm.id]?.steps?.length || 0) + "/" + bm.steps.length}</td><td>${bossDefeated(s.progress, b.id) ? `<span class="chip ahead">Beaten</span>` : bi.retake ? `<span class="chip">Retake allowed</span>` : bi.attempts ? `<span class="chip behind">Not beaten</span>` : ""}</td><td>${bi.attempts && !bi.retake && !bossDefeated(s.progress, b.id) ? `<button class="btn small" data-retake="${esc(s.id)}" type="button">Allow retake</button>` : ""}</td></tr>`; }).join("")}</tbody></table>` : `<p class="lnote">No students yet.</p>`}</div>
      <article class="m boss open"><div class="mh" style="cursor:default"><span class="num">1</span><span><span class="mt">Part 1 · Build: ${esc(bm.title)}</span><span class="mk"><span class="tag tb">Boss build</span><span>${buildDone.length}/${n} done</span></span></span></div>
        <div class="mb"><p class="goal">${fmt(bm.goal)}</p><ol class="tsteps">${bm.steps.map((x) => `<li>${fmt(x)}</li>`).join("")}</ol><p class="win"><b>Win condition:</b> ${fmt(bm.win)}</p></div></article>
      <article class="m boss open"><div class="mh" style="cursor:default"><span class="num">2</span><span><span class="mt">Part 2 · Test with answer key</span><span class="mk"><span class="tag tb">Boss test</span><span>${takers.length}/${n} taken · % = share of takers who got it right</span></span></span></div>
        <div class="mb"><ol class="tsteps keyq">${b.questions.map((q, i) => `<li><b>${esc(q[0])}</b>${pct(i) != null ? ` <span class="chip${pct(i) < 60 ? " behind" : " ahead"}">${pct(i)}% right</span>` : ""}<ul>${q[1].map((c, j) => `<li class="${key && key[i] === j ? "correct" : ""}">${esc(c)}${key && key[i] === j ? " ✓ correct" : ""}</li>`).join("")}</ul></li>`).join("")}</ol>
        ${key ? "" : `<p class="lnote">Loading the answer key…</p>`}</div></article>`;
  } else {
    const w = stop.w, sp = SPANS[w.n];
    const st = (m, s) => s.progress[m.id]?.status;
    const card = (m, k) => {
      const T2 = TAG[m.t];
      const done = kids.filter((s) => st(m, s) === "done"), skip = kids.filter((s) => st(m, s) === "skipped"), started = kids.filter((s) => st(m, s) === "started"), none = kids.filter((s) => !st(m, s));
      const sideCount = (i) => kids.filter((s) => s.progress[m.id]?.steps?.includes(i)).length;
      const body = m.t === "s"
        ? `<p class="goal">Optional Code.org practice; students pick any. Each one earns ${XP.s} XP.</p><ul class="tsteps">${m.q.map((q, i) => `<li><b>${fmt(q[0])}</b>: ${fmt(q[1])} <span class="lnote">· ${sideCount(i)}/${n} done ·</span> <a href="${url(w.n, m.lv, i + 1)}" target="_blank" rel="noopener">open</a></li>`).join("")}</ul>`
        : `${m.t === "d" ? `<p class="lnote">Unlocks for a student once they clear this world's core missions.</p>` : ""}<p class="goal">${fmt(m.goal)}</p><ol class="tsteps">${m.steps.map((x, i) => `<li>${fmt(x)}${m.t === "h" && m.keys[i] ? ` <span class="auto">checked by the board</span>` : ""}</li>`).join("")}</ol>${m.win ? `<p class="win"><b>Win condition:</b> ${fmt(m.win)}</p>` : ""}${m.t === "h" ? `<p class="lnote">Board trial: needs a micro:bit connected in Chrome or Edge. Bonus, doesn't count for badges or pace.</p>` : m.t === "d" ? "" : `<a class="go" href="${url(w.n, m.lv)}" target="_blank" rel="noopener">Open this level in Code.org →</a>`}`;
      const who = m.t === "s" ? "" : `<details class="who-done"><summary>Who's finished</summary><p><b>Done (${done.length}):</b> ${names(done)}</p>${started.length ? `<p><b>Started (${started.length}):</b> ${names(started)}</p>` : ""}${skip.length ? `<p><b>Skipped (${skip.length}):</b> ${names(skip)}</p>` : ""}<p><b>Not started (${none.length}):</b> ${names(none)}</p></details>`;
      return `<article class="m open${m.t === "b" ? " boss" : ""}${m.t === "d" ? " dive" : ""}"><div class="mh" style="cursor:default"><span class="num">${k + 1}</span><span><span class="mt">${fmt(m.title)}</span><span class="mk"><span class="tag ${T2[0]}">${T2[1]}</span><span>${m.t === "h" ? "Board trial · bonus" : m.t === "d" ? "Side quest for early finishers" : "Code.org Lesson " + w.n + ", Level " + m.lv}</span></span></span><span class="xp">${m.t === "s" ? "+" + XP.s + " each" : "+" + XP[m.t] + " XP"}</span></div>
        <div class="mb">${m.t !== "s" && n ? `<div class="row" style="margin-bottom:8px"><span class="chip ahead">${done.length}/${n} done</span>${started.length ? `<span class="chip">${started.length} started</span>` : ""}${skip.length ? `<span class="chip">${skip.length} skipped</span>` : ""}</div>` : ""}${body}${n ? who : ""}</div></article>`;
    };
    main = `<div class="wh" style="margin-top:14px"><div class="row"><h2>World ${w.n}: ${esc(w.g)}</h2><span class="sp"></span>${prevNext}</div>
      <p class="orig">Code.org Lesson ${w.n}: ${esc(w.o)} · ${coreOf(w).length} core missions · badge: ${esc(w.bd)} · planned for week ${weekOfDay(sp.first)}${weekOfDay(sp.last) !== weekOfDay(sp.first) ? "–" + weekOfDay(sp.last) : ""}, class days ${sp.first}–${sp.last}${P ? ", due " + esc(niceDate(P.due(w.n))) : ""}${D.locks?.includes("w" + w.n) ? " · locked for this class" : ""}</p></div>
      <p class="qotd"><b>Quest question:</b> ${esc(w.q)}</p><p class="story">${fmt(w.s)}</p>
      <div class="missions">${w.m.map(card).join("")}</div>`;
  }
  el.innerHTML = `<nav class="strip" style="margin:0 calc(-1 * max(4vw,16px));" aria-label="Worlds and bosses">${pads}</nav>${main}`;
  const go2 = (k) => { T.ls = (k + STOPS.length) % STOPS.length; tabLessons(el, D); el.scrollIntoView({ block: "start" }); };
  $$("[data-ls]", el).forEach((b) => (b.onclick = () => go2(+b.dataset.ls)));
  $("lprev").onclick = () => go2(T.ls - 1); $("lnext").onclick = () => go2(T.ls + 1);
  $$("[data-stu]", el).forEach((b) => (b.onclick = () => studentDrawer(b.dataset.stu)));
  $$("[data-retake]", el).forEach((b) => (b.onclick = () => allowRetake(b.dataset.retake, stop.b.id, () => tabLessons(el, T.data))));
  el.querySelector(`.pad[data-ls="${T.ls}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
  if (stop.kind === "b" && !T.keys) bossKeys().then(() => { if (T.tab === "lessons") tabLessons(el, T.data); });
}
async function allowRetake(studentId, bossId, after) {
  try { await api("POST", `/api/mq/teacher/students/${encodeURIComponent(studentId)}/retake`, { boss: bossId }); toast("Retake allowed. Their best score is kept."); await loadTeacher(); after?.(); }
  catch (e) { toast(errText(e)); }
}
function tabPacing(el, D) {
  if (allMode()) {
    el.innerHTML = `<div class="panel"><h2>Pacing</h2><p>Pick one class at the top to set its calendar.</p><table><thead><tr><th>Class</th><th>Starts</th><th>Last lesson day</th><th>Buffer week ends</th></tr></thead><tbody>${D.classes.map((c) => { const P = paceInfo(c.pacing); return `<tr><td>${esc(c.name)}</td><td>${P ? esc(niceDate(P.dates[0])) : "Not set"}</td><td>${P ? esc(niceDate(P.dates[CONTENT_DAYS - 1])) : ""}</td><td>${P ? esc(niceDate(P.dates.at(-1))) : ""}</td></tr>`; }).join("")}</tbody></table></div>`;
    return;
  }
  if (!T.pdraft || T.pdraft.classId !== D.classId) T.pdraft = { classId: D.classId, start: D.pacing?.start || "", off: [...(D.pacing?.off || [])] };
  const dr = T.pdraft, P = paceInfo(dr.start ? dr : null), saved = JSON.stringify({ s: D.pacing?.start || "", o: D.pacing?.off || [] }) === JSON.stringify({ s: dr.start, o: [...dr.off].sort() });
  const paces = P ? D.students.map((s) => ({ s, p: paceOf(s.progress, P.dates, P.today) })) : [];
  const behind = paces.filter((x) => x.p.behind.length);
  const weeks = P ? Array.from({ length: 9 }, (_, i) => i + 1) : [];
  el.innerHTML = `<div class="panel"><h2>Class calendar</h2>
    <p class="lnote">9 weeks of daily classes: weeks 1–8 cover the 17 lessons and a boss test at the end of weeks 2, 4, 6 and 8 (40 class days); week 9 is a 5-day buffer. Add holidays and other days with no class; the plan moves later to match.</p>
    <div class="row" style="margin-top:10px;align-items:end">
      <label class="f">First class day<input class="t" type="date" id="pstart" value="${esc(dr.start)}"></label>
      <label class="f">Day off<input class="t" type="date" id="poff1"></label><button class="btn" id="poffadd" type="button">Add day off</button>
      <label class="f">Break from<input class="t" type="date" id="pfrom"></label><label class="f">to<input class="t" type="date" id="pto"></label><button class="btn" id="prange" type="button">Add break</button>
    </div>
    <div class="row" style="margin-top:10px">${dr.off.length ? [...dr.off].sort().map((d) => `<span class="chip">${esc(niceDate(d))} <button class="btn small" data-rmoff="${esc(d)}" type="button" aria-label="Remove ${esc(niceDate(d))}">×</button></span>`).join("") : `<span class="lnote">No days off yet.</span>`}</div>
    <div class="row" style="margin-top:12px"><button class="btn pri" id="psave" type="button"${saved ? " disabled" : ""}>${saved ? "Saved" : "Save calendar"}</button>${D.pacing ? `<button class="btn" id="pclear" type="button">Clear calendar</button>` : ""}<span class="err" id="perr"></span></div></div>
  ${P ? `<div class="panel"><h2>${P.day === 0 ? "Starts " + esc(niceDate(P.dates[0])) : P.day > CONTENT_DAYS ? "Buffer week" : "Today: week " + P.week + ", day " + P.day + " of " + TOTAL_DAYS}</h2>
    <p>${D.students.length ? `${paces.length - behind.length} of ${paces.length} students on track.${behind.length ? " Behind: " + behind.map((x) => `${esc(x.s.name)} (${x.p.behind.length})`).join(", ") + "." : ""}` : "No students yet."}</p></div>
  <div class="panel scroll"><h2>Week by week</h2><table><thead><tr><th>Week</th><th>Dates</th><th>Worlds (due date)</th></tr></thead><tbody>
    ${weeks.map((wk) => { const a = P.dates[(wk - 1) * 5], b = P.dates[wk * 5 - 1]; const cur = P.day && weekOfDay(Math.min(P.day, TOTAL_DAYS)) === wk && P.today <= P.dates.at(-1);
      return `<tr class="${cur ? "now" : ""}"><td><b>Week ${wk}</b>${cur ? ` <span class="chip ahead">this week</span>` : ""}</td><td style="white-space:nowrap">${esc(niceDate(a))} – ${esc(niceDate(b))}</td><td>${wk === 9 ? "Buffer: catch-up, project polish, Post-Project Test, showcase, survey" : weekWorlds(wk).map((n) => `World ${n}: ${esc(W[n].o)}${SPANS[n].last <= wk * 5 ? ` <span class="lnote">(due ${esc(niceDate(P.due(n)))})</span>` : ` <span class="lnote">(continues)</span>`}`).concat(weekBosses(wk).map((b) => `<b>Boss ${b.n} test: ${esc(b.name)}</b> <span class="lnote">(${esc(niceDate(P.dates[BOSS_SPANS[b.id].first - 1]))}, Worlds ${b.worlds[0]}–${b.worlds.at(-1)})</span>`)).join("<br>")}</td></tr>`; }).join("")}
  </tbody></table></div>` : `<p class="panel">Pick the first class day to see the 9-week calendar with real dates.</p>`}`;
  const redraw = () => tabPacing(el, D);
  $("pstart").onchange = (e) => { dr.start = e.target.value; redraw(); };
  $("poffadd").onclick = () => { const v = $("poff1").value; if (validIso(v) && !dr.off.includes(v)) dr.off.push(v); redraw(); };
  $("prange").onclick = () => { const a = $("pfrom").value, b = $("pto").value; if (!validIso(a) || !validIso(b) || b < a) { $("perr").textContent = "Pick a start and end date."; return; }
    for (let t = Date.parse(a + "T00:00:00Z"); t <= Date.parse(b + "T00:00:00Z") && dr.off.length < 150; t += 864e5) { const d = new Date(t), iso = d.toISOString().slice(0, 10); if (d.getUTCDay() % 6 && !dr.off.includes(iso)) dr.off.push(iso); }
    redraw(); };
  $$("[data-rmoff]", el).forEach((b) => (b.onclick = () => { dr.off = dr.off.filter((d) => d !== b.dataset.rmoff); redraw(); }));
  $("psave").onclick = async () => {
    if (!validIso(dr.start)) { $("perr").textContent = "Pick the first class day."; return; }
    try { const r = await api("PUT", `/api/mq/teacher/classes/${encodeURIComponent(D.classId)}/pacing`, { start: dr.start, off: dr.off }); dr.off = r.pacing.off; await loadTeacher(); drawTeacher(); toast("Calendar saved"); }
    catch (e) { $("perr").textContent = errText(e); }
  };
  $("pclear") && ($("pclear").onclick = async () => { try { await api("PUT", `/api/mq/teacher/classes/${encodeURIComponent(D.classId)}/pacing`, { start: null }); T.pdraft = null; await loadTeacher(); drawTeacher(); toast("Calendar cleared"); } catch (e) { toast(errText(e)); } });
}
function tabAllWork(el, D) {
  const list = [...D.students].sort((a, b) => T.sort === "saved" ? savedAt(b) - savedAt(a) : T.sort === "xp" ? b.xp - a.xp : a.name.localeCompare(b.name));
  el.innerHTML = `<div class="row"><h2 style="font-size:22px">All work (${list.length})</h2><span class="sp"></span><label class="row" style="font-weight:700">Sort by <select class="t" id="ws"><option value="name">Name</option><option value="saved">Last saved</option><option value="xp">XP</option></select></label></div>
  ${list.length ? "" : `<p class="panel">No students yet.</p>`}
  <div class="cards">${list.map((s) => { const m = workingOn(s.progress), trials = W.flatMap((w) => w.m.filter((x) => x.t === "h")).filter((x) => s.progress[x.id]?.status === "done").length; return `<article class="card">
    <div class="row">${whoHTML(s)}<span class="sp"></span>${paceChip(studentPace(s))}<span class="chip">${s.xp} XP</span></div>
    <div class="lnote">${esc(rankFor(s.xp).name)}${classOf(s)} · last saved ${ago(savedAt(s))}</div>
    <div class="mini" aria-label="World progress">${W.map((w) => { const c = wCount(s.progress, w); return `<i class="${c.done === c.n ? "d" : c.done || c.started ? "p" : ""}" title="${esc(worldName(w.n))}"></i>`; }).join("")}</div>
    <div><b>Working on:</b> ${m ? esc(worldName(m.world) + " · " + m.title) : "Everything cleared!"}</div>
    <div class="lnote">${s.badges.length} badges · ${trials} board trials</div>
    <button class="btn pri small" data-stu="${esc(s.id)}" type="button">See work</button></article>`; }).join("")}</div>`;
  $("ws").value = T.sort; $("ws").onchange = (e) => { T.sort = e.target.value; tabAllWork(el, D); };
  $$("[data-stu]", el).forEach((b) => (b.onclick = () => studentDrawer(b.dataset.stu)));
}
async function downloadCsv() {
  const res = await fetch(API + "/api/mq/teacher/export.csv?class=" + encodeURIComponent(T.classId || "all"), { headers: authHeaders(), credentials: API ? "omit" : "same-origin" });
  if (!res.ok) return toast("Couldn't make the file. Try again.");
  const name = (res.headers.get("content-disposition") || "").match(/filename="([^"]+)"/)?.[1] || "makerquest.csv";
  const a = document.createElement("a"); a.href = URL.createObjectURL(await res.blob()); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
function tabMastery(el, D) {
  const rows = D.students.map((s) => ({ s, m: mastery(s.progress) })), tot = rows.length || 1;
  const lab = { beginning: "Beginning", developing: "Developing", mastered: "Mastered" };
  el.innerHTML = `<div class="row"><span class="sp"></span><button class="btn pri small" id="csv" type="button">Download for gradebook (CSV)</button></div>
  <div class="panel"><h2>Mastery by concept</h2><div class="bars">${CONCEPTS.map((c) => { const n = rows.filter((r) => r.m[c.id] === "mastered").length, dv = rows.filter((r) => r.m[c.id] === "developing").length; return `<div class="bar"><b>${esc(c.name)}${c.csta ? ` <span class="lnote">${esc(c.csta)}</span>` : ""}</b><span class="track"><i style="width:${(n / tot) * 100}%;background:var(--ok)"></i><i style="width:${(dv / tot) * 100}%;background:var(--gold)"></i></span><span class="nr">${n}/${rows.length}</span></div>`; }).join("")}</div></div>
  <div class="panel scroll"><table><thead><tr><th>Student</th>${CONCEPTS.map((c) => `<th>${esc(c.name)}</th>`).join("")}</tr></thead><tbody>
  ${rows.map(({ s, m }) => `<tr><td>${whoHTML(s)}</td>${CONCEPTS.map((c) => `<td><span class="chip m-${m[c.id]}">${lab[m[c.id]]}</span></td>`).join("")}</tr>`).join("")}</tbody></table></div>
  <p class="lnote">Mastered: every core mission in the concept's worlds is finished. Developing: some are. Skipped missions don't count. The CSV also has each world's % and every mission's status.</p>`;
  $("csv").onclick = downloadCsv;
}
function tabHardware(el, D) {
  const trials = W.flatMap((w) => w.m.filter((m) => m.t === "h"));
  const n = D.students.length || 1;
  const linked = D.students.filter((s) => s.progress["2-h"]?.steps?.includes(0));
  el.innerHTML = `<div class="panel"><h2>Board trials</h2><p class="lnote">Bonus missions that tick themselves when a student's real micro:bit does the action (buttons, light, tilt, wires). They need Chrome or Edge on a laptop.</p>
  <div class="bars" style="margin-top:12px">${trials.map((m) => { const d = D.students.filter((s) => s.progress[m.id]?.status === "done").length, st = D.students.filter((s) => s.progress[m.id] && s.progress[m.id].status !== "done").length; return `<div class="bar"><b>${esc(m.title)} <span class="lnote">World ${m.world}</span></b><span class="track"><i style="width:${(d / n) * 100}%;background:var(--ok)"></i><i style="width:${(st / n) * 100}%;background:var(--gold)"></i></span><span class="nr">${d}/${D.students.length}</span></div>`; }).join("")}</div></div>
  <div class="panel"><h2>Linked a board (${linked.length} of ${D.students.length})</h2><p>${linked.length ? linked.map((s) => esc(s.name)).join(", ") : "Nobody has connected a micro:bit yet. The First Contact trial in World 2 records it."}</p></div>`;
}
function printCards(list) {
  $("printcards")?.remove();
  const box = document.createElement("div"); box.id = "printcards";
  box.innerHTML = list.map((c) => `<div class="pcard"><div><b>micro:bit Maker Quest</b> · ${esc(location.host + location.pathname)}</div><div class="w">${esc(c.name)}</div><div>Username<br><code>${esc(c.username)}</code></div><div>Password<br><code>${esc(c.password || "(same as PyQuest)")}</code></div></div>`).join("");
  document.body.appendChild(box);
  setTimeout(() => { try { window.print(); } catch {} }, 100);
}
function tabStudents(el, D) {
  const N = classNames();
  el.innerHTML = `<div class="panel"><h2>Add students</h2><p class="lnote">One per line: <code>username, First name + last initial, password</code>. Leave the password blank to make one. A username that already exists (a PyQuest student) joins with the login they already have: just type the username.</p>
    <div class="row" style="margin:10px 0"><label class="f">Add to class<select class="t" id="toclass">${D.classes.map((c) => `<option value="${esc(c.id)}"${c.id === D.classId || (allMode() && c === D.classes[0]) ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label></div>
    <textarea class="t" id="bulk" placeholder="maya.r, Maya R., star42&#10;jordan.k"></textarea>
    <div class="row" style="margin-top:10px"><button class="btn pri" id="mk" type="button">Add students</button><span class="sp"></span>${D.students.length ? `<button class="btn small" id="allcards" type="button">New passwords for everyone + print cards</button>` : ""}</div><div id="mkres"></div></div>
  ${D.students.length ? `<div class="row"><button class="btn small" id="showpw" type="button" aria-pressed="${T.showPw}">${T.showPw ? "Hide passwords" : "Show passwords"}</button>${T.showPw ? `<button class="btn small" id="printshown" type="button">Print login cards</button><span class="lnote">Passwords are visible on screen.</span>` : ""}</div>` : ""}
  <div class="panel scroll"><h2>Students (${D.students.length})</h2><table><thead><tr><th>Student</th><th>Username</th><th>Class</th>${T.showPw ? "<th>Password</th>" : ""}<th class="nr">XP</th><th></th></tr></thead><tbody>
  ${D.students.length ? "" : `<tr><td colspan="5" class="lnote">No students yet.</td></tr>`}
  ${D.students.map((s) => `<tr><td>${whoHTML(s)}${s.inPyQuest ? ` <span class="chip">also in PyQuest</span>` : ""}</td><td><code>${esc(s.username)}</code></td><td>${esc(N[s.class_id] || "")}</td>${T.showPw ? `<td>${T.pw?.[s.id] ? `<code>${esc(T.pw[s.id])}</code>` : `<span class="lnote">reset to see</span>`}</td>` : ""}<td class="nr">${s.xp}</td>
    <td><div class="row"><button class="btn pri small" data-stu="${esc(s.id)}" type="button">See work</button><button class="btn small" data-pw="${esc(s.id)}" type="button">Reset password</button><button class="btn small" data-del="${esc(s.id)}" type="button">Remove</button></div></td></tr>`).join("")}</tbody></table></div>`;
  $("mk").onclick = async () => {
    const lines = $("bulk").value.split("\n").map((l) => l.split(",").map((x) => x.trim())).filter((p) => p[0]);
    if (!lines.length) return;
    const students = lines.map(([username, name, password]) => ({ username, name: name || username, password: password || (name ? genPw() : "") }));
    // A line with only a username is an existing account joining; a line with a name makes a new account.
    for (const s of students) if (!s.password && s.name !== s.username) s.password = genPw();
    try {
      const r = await api("POST", "/api/mq/teacher/students", { classId: $("toclass").value, students });
      const made = students.filter((s) => r.created.includes(s.username));
      const why = { bad_username: "username must be 3–24 letters, numbers, . _ -", bad_password: "new accounts need a name and a password of 4+ characters", username_taken: "that's a teacher account", already_in_maker_quest: "already in Maker Quest" };
      const res = `<p class="ok">Created ${r.created.length} new account${r.created.length === 1 ? "" : "s"}${r.joined.length ? ` · ${r.joined.length} existing student${r.joined.length === 1 ? "" : "s"} joined (${r.joined.map(esc).join(", ")})` : ""}.</p>
        ${made.length ? `<div class="scroll"><table><thead><tr><th>Student</th><th>Username</th><th>Password</th></tr></thead><tbody>${made.map((s) => `<tr><td>${esc(s.name)}</td><td><code>${esc(s.username)}</code></td><td><code>${esc(s.password)}</code></td></tr>`).join("")}</tbody></table></div><p class="lnote">Copy or print this list now. You can also see passwords later with Show passwords.</p><button class="btn pri" id="printmade" type="button">Print login cards</button>` : ""}
        ${r.problems.length ? `<p class="err">Couldn't add: ${r.problems.map((p) => `${esc(p.username)} (${esc(why[p.error] || p.error)})`).join(", ")}</p>` : ""}`;
      await loadTeacher(); drawTeacher();
      $("mkres").innerHTML = res; $("printmade")?.addEventListener("click", () => printCards(made));
    } catch (e) { $("mkres").innerHTML = `<p class="err">${esc(errText(e))}</p>`; }
  };
  $("showpw")?.addEventListener("click", async () => {
    if (T.showPw) { T.showPw = false; T.pw = null; return tabStudents(el, D); }
    try { T.pw = (await api("GET", "/api/mq/teacher/passwords?class=" + encodeURIComponent(T.classId || "all"))).passwords; T.showPw = true; tabStudents(el, D); } catch { toast("Couldn't load passwords."); }
  });
  $("printshown")?.addEventListener("click", () => { const list = D.students.filter((s) => T.pw?.[s.id]).map((s) => ({ name: s.name, username: s.username, password: T.pw[s.id] })); if (list.length < D.students.length) toast((D.students.length - list.length) + " students need a password reset before their card shows it"); if (list.length) printCards(list); });
  $("allcards") && ($("allcards").onclick = () => {
    const { el: m, close } = openModal(`<h2 id="modal-title">New passwords for everyone</h2><p>Every student in this view gets a new password and their cards print. Their old password stops working, in PyQuest too, because it's the same account.</p><div class="row"><button class="btn bad" id="y" type="button">Make new passwords</button><button class="btn" data-close type="button" autofocus>Cancel</button></div>`, true);
    $("y").onclick = async () => { $("y").disabled = true; const list = []; for (const s of D.students) { const password = genPw(); try { await api("POST", `/api/mq/teacher/students/${encodeURIComponent(s.id)}/password`, { password }); list.push({ name: s.name, username: s.username, password }); } catch {} } close(); printCards(list); };
  });
  $$("[data-stu]", el).forEach((b) => (b.onclick = () => studentDrawer(b.dataset.stu)));
  $$("[data-pw]", el).forEach((b) => (b.onclick = () => resetPw(b.dataset.pw)));
  $$("[data-del]", el).forEach((b) => (b.onclick = () => removeStudent(D.students.find((s) => s.id === b.dataset.del))));
}
function resetPw(id) {
  const { el, close } = openModal(`<h2 id="modal-title">Reset password</h2><label class="f">New password<input class="t" id="np" value="${genPw()}" minlength="4" maxlength="64"></label><p class="lnote">This is one account for Maker Quest and PyQuest, so the new password works in both.</p><div class="err" id="nperr"></div><div class="row"><button class="btn pri" id="ok" type="button">Save</button><button class="btn" data-close type="button">Cancel</button></div>`, true);
  $("ok").onclick = async () => {
    const pw = $("np").value;
    try { await api("POST", `/api/mq/teacher/students/${encodeURIComponent(id)}/password`, { password: pw }); toast("New password: " + pw); close(); if (T.showPw) { T.pw = { ...(T.pw || {}), [id]: pw }; if (T.tab === "students") tabStudents($("tab"), T.data); } }
    catch (e) { $("nperr").textContent = e.message === "bad_password" ? "Use 4 to 64 characters." : errText(e); }
  };
}
function removeStudent(s) {
  if (!s) return;
  const { el, close } = openModal(`<h2 id="modal-title">Remove ${esc(s.name)} from Maker Quest?</h2><p>Their Maker Quest progress, XP and notes are deleted. ${s.inPyQuest ? "They stay in PyQuest with the same login." : "They aren't in PyQuest, so their account is deleted too."} This can't be undone.</p><div class="row"><button class="btn bad" id="y" type="button">Remove</button><button class="btn" data-close type="button" autofocus>Cancel</button></div>`, true);
  $("y").onclick = async () => { try { await api("DELETE", "/api/mq/teacher/students/" + encodeURIComponent(s.id)); close(); await loadTeacher(); drawTeacher(); toast("Removed " + s.name); } catch (e) { toast(errText(e)); } };
}
async function tabClasses(el) {
  el.innerHTML = `<p class="lnote">Loading…</p>`;
  const all = await api("GET", "/api/mq/teacher/overview?class=all");
  const by = {}; for (const s of all.students) (by[s.class_id] ||= []).push(s);
  el.innerHTML = `<div class="row"><h2 style="font-size:22px">Classes (${all.classes.length})</h2><span class="sp"></span><button class="btn pri small" id="addcls2" type="button">+ Add class</button></div>
  ${all.classes.map((c) => { const kids = by[c.id] || []; return `<section class="panel"><div class="row"><h3 style="font-size:19px">${esc(c.name)}</h3><span class="chip">${nStu(c.students)}</span><span class="sp"></span>
    <button class="btn small" data-view="${esc(c.id)}" type="button">View class</button><button class="btn small" data-rename="${esc(c.id)}" type="button">Rename</button><button class="btn small" data-delclass="${esc(c.id)}" type="button">Delete class</button></div>
    ${kids.length ? `<div class="scroll" style="margin-top:8px"><table><thead><tr><th>Student</th><th>Username</th><th>Rank</th><th class="nr">XP</th><th></th></tr></thead><tbody>${kids.map((k) => `<tr><td>${whoHTML(k)}</td><td><code>${esc(k.username)}</code></td><td>${esc(rankFor(k.xp).name)}</td><td class="nr">${k.xp}</td><td><button class="btn pri small" data-stu="${esc(k.id)}" type="button">See work</button></td></tr>`).join("")}</tbody></table></div>` : `<p class="lnote">No students in this class yet.</p>`}</section>`; }).join("")}`;
  $("addcls2").onclick = addClass;
  $$("[data-stu]", el).forEach((b) => (b.onclick = () => studentDrawer(b.dataset.stu)));
  $$("[data-view]", el).forEach((b) => (b.onclick = async () => { T.classId = b.dataset.view; T.tab = "progress"; await loadTeacher(); drawTeacher(); }));
  $$("[data-rename]", el).forEach((b) => (b.onclick = () => {
    const c = all.classes.find((x) => x.id === b.dataset.rename);
    const { close } = openModal(`<h2 id="modal-title">Rename class</h2><label class="f">Class name<input class="t" id="rn" maxlength="40" value="${esc(c.name)}" autofocus></label><div class="err" id="rnerr"></div><div class="row"><button class="btn pri" id="ok" type="button">Save</button><button class="btn" data-close type="button">Cancel</button></div>`, true);
    $("ok").onclick = async () => { try { await api("PUT", "/api/mq/teacher/classes/" + encodeURIComponent(c.id), { name: $("rn").value }); close(); await loadTeacher(); drawTeacher(); } catch (e) { $("rnerr").textContent = errText(e); } };
  }));
  $$("[data-delclass]", el).forEach((b) => (b.onclick = () => {
    const c = all.classes.find((x) => x.id === b.dataset.delclass), others = all.classes.filter((x) => x.id !== c.id);
    const { close } = openModal(`<h2 id="modal-title">Delete class: ${esc(c.name)}</h2>
      ${c.students ? `<p>This class has ${nStu(c.students)}. What should happen to them?</p>
        ${others.length ? `<label class="row"><input type="radio" name="how" value="move" checked> Move them to <select class="t" id="dest">${others.map((o) => `<option value="${esc(o.id)}">${esc(o.name)}</option>`).join("")}</select></label>` : ""}
        <label class="row"><input type="radio" name="how" value="delete"${others.length ? "" : " checked"}> Take them out of Maker Quest and delete their Maker Quest work (PyQuest accounts stay)</label>
        <label class="f" id="cb"${others.length ? " hidden" : ""}>Type the class name to confirm<input class="t" id="cname" autocomplete="off"></label>` : `<p>This class is empty.</p>`}
      <div class="err" id="delerr"></div><div class="row"><button class="btn bad" id="ok" type="button">Delete class</button><button class="btn" data-close type="button" autofocus>Cancel</button></div>`, true);
    $$("input[name=how]").forEach((r) => (r.onchange = () => { $("cb").hidden = $$("input[name=how]").find((x) => x.checked)?.value !== "delete"; }));
    $("ok").onclick = async () => {
      const how = $$("input[name=how]").find((x) => x.checked)?.value;
      const body = !c.students ? {} : how === "move" ? { moveTo: $("dest").value } : { deleteStudents: true, confirmName: $("cname").value };
      if (how === "delete" && body.confirmName.trim().toLowerCase() !== c.name.trim().toLowerCase()) { $("delerr").textContent = `Type "${c.name}" to confirm.`; return; }
      try { const r = await api("POST", `/api/mq/teacher/classes/${encodeURIComponent(c.id)}/delete`, body); close(); if (T.classId === c.id) T.classId = ""; toast(r.moved ? `Moved ${nStu(r.moved)}` : r.deleted ? `Removed ${nStu(r.deleted)}` : "Class deleted"); await loadTeacher(); drawTeacher(); }
      catch (e) { $("delerr").textContent = errText(e); }
    };
  }));
}
function tabControls(el, D) {
  if (allMode()) { el.innerHTML = `<div class="panel"><h2>Controls</h2><p>Pick one class at the top to lock or unlock its worlds.</p></div>`; return; }
  el.innerHTML = `<div class="panel"><div class="row"><h2>Lock worlds and bosses</h2><span class="sp"></span><button class="btn small" id="unext" type="button">Unlock next</button><button class="btn small" id="uall" type="button">Unlock all</button><button class="btn small" id="lall" type="button">Lock all</button></div><p class="lnote">Students in ${esc(classNames()[D.classId] || "this class")} can read a locked world but can't tick off its missions. A locked boss can't be fought until you unlock it (otherwise it opens on boss day or when a student clears its worlds).</p>
  <div class="steps" style="margin-top:10px">${BOSSES.map((b) => `<label><input type="checkbox" data-lock="${b.id}"${D.locks.includes(b.id) ? " checked" : ""}><span><b>Boss ${b.n}: ${esc(b.name)}</b> <span class="lnote">test on Worlds ${b.worlds[0]}–${b.worlds.at(-1)}. Lock it to hold the test until you're ready.</span>${D.locks.includes(b.id) ? " · locked" : ""}</span></label>`).join("")}${W.map((w) => `<label><input type="checkbox" data-lock="w${w.n}"${D.locks.includes("w" + w.n) ? " checked" : ""}><span><b>${esc(worldName(w.n))}</b> <span class="lnote">${esc(w.o)}</span>${D.locks.includes("w" + w.n) ? " · locked" : ""}</span></label>`).join("")}</div></div>`;
  const save = async (locks, msg) => { try { const r = await api("PUT", `/api/mq/teacher/classes/${encodeURIComponent(D.classId)}/locks`, { locks }); T.data.locks = r.locks; tabControls(el, T.data); if (msg) toast(msg); } catch (e) { toast(errText(e)); } };
  $$("[data-lock]", el).forEach((c) => (c.onchange = () => save($$("[data-lock]", el).filter((x) => x.checked).map((x) => x.dataset.lock))));
  $("uall").onclick = () => save([], "Everything unlocked");
  $("lall").onclick = () => save([...BOSSES.map((b) => b.id), ...W.map((w) => "w" + w.n)], "Everything locked");
  // Unlock the next locked stop on the map, in order (a boss comes after its worlds).
  $("unext").onclick = () => { const order = STOPS.map((st) => (st.kind === "w" ? "w" + st.w.n : st.b.id)); const nx = order.find((id) => D.locks.includes(id));
    if (!nx) return toast("Everything is already unlocked");
    save(D.locks.filter((l) => l !== nx), "Unlocked " + (nx.startsWith("w") ? worldName(+nx.slice(1)) : "Boss " + bossById[nx].n)); };
}
function tabBoard(el, D) {
  el.innerHTML = `<div class="panel"><h2>This week's XP</h2>${D.board.length ? `<ol class="board-list">${D.board.map((r) => `<li><span class="r">${r.rank}</span>${ava(r)}<span>${esc(r.name)}</span><span class="pts">${r.weekXp} XP this week · ${r.xp} total</span></li>`).join("")}</ol>` : "<p>No students yet.</p>"}</div>`;
}

async function studentDrawer(id) {
  let d;
  try { d = await api("GET", "/api/mq/teacher/students/" + encodeURIComponent(id)); } catch (e) { return toast(errText(e)); }
  const s = d.student, p = d.progress, m = workingOn(p), N = classNames();
  const cellFor = (x) => { const r = p[x.id], n = stepCount(x), got = r?.steps?.length || 0; const st = r?.status; const cls = st === "done" ? "done" : st === "skipped" ? "skip" : got ? "part" : ""; return `<span class="cell ${cls}" title="${esc(x.title)} · ${st === "done" ? "done" : st === "skipped" ? "skipped" : got + " of " + n + " ticked"}">${mLabel(x)}</span>`; };
  const { el, close } = openModal(`<div class="row">${ava(s, 44)}<div><h2 id="modal-title" style="font-size:26px">${esc(s.name)}</h2><span class="lnote">${esc(s.username)} · ${esc(s.className)} · last seen ${ago(s.lastSeen)}${s.inPyQuest ? " · also in PyQuest" : ""}</span></div><span class="sp"></span><button class="btn small" data-close type="button">Close</button></div>
    <div class="row"><span class="chip">${esc(s.rank)}</span><span class="chip">${s.xp} XP</span><span class="chip">${s.badges.length} badges</span>${(() => { const P = classPace(s.classId); return P ? paceChip(paceOf(p, P.dates, P.today)) : ""; })()}<span class="chip">Working on: ${m ? esc(worldName(m.world) + " · " + m.title) : "everything cleared"}</span></div>
    <div class="panel"><h3>Boss tests</h3><div class="wlist">${BOSSES.map((b) => { const bi = bossInfo(p, b.id), beat = bossDefeated(p, b.id), bd = p[b.buildMission.id]; return `<div class="wrow"><b>Boss ${b.n}: ${esc(b.name)}</b><div class="row">${bi.best != null ? `<span class="chip${bi.best / bi.total >= 0.7 ? " ahead" : " behind"}">Test ${bi.best}/${bi.total}${bi.attempts > 1 ? " · " + bi.attempts + " tries" : ""}</span>` : `<span class="chip">Test not taken</span>`}<span class="chip">Build ${bd?.status === "done" ? "done" : (bd?.steps?.length || 0) + "/" + b.buildMission.steps.length}</span>${beat ? `<span class="chip ahead">Beaten</span>` : ""}${bi.retake ? `<span class="chip">Retake allowed</span>` : bi.attempts && !beat ? `<button class="btn small" data-rt="${b.id}" type="button">Allow retake</button>` : ""}</div></div>`; }).join("")}</div></div>
    <div class="panel"><h3>Every mission</h3><div class="wlist">${W.map((w) => `<div class="wrow"><b>${esc(worldName(w.n))}${s.badges.includes("w" + w.n) ? " · badge" : ""}</b><div class="cells">${w.m.map(cellFor).join("")}</div></div>`).join("")}</div>
      <p class="lnote">Green done · gold started · grey skipped. Hover a box for the mission name. "Dive" = Deeper Dive side quest.</p></div>
    <div class="panel"><h3>Leave a note</h3><div class="notes">${d.notes.length ? d.notes.map((n) => `<div class="note">${esc(n.body)}<div class="lnote">${n.seen ? "Seen" : "Not seen yet"} · ${ago(n.created_at)}</div></div>`).join("") : `<p class="lnote">No notes yet.</p>`}</div>
      <textarea class="t" id="nt" maxlength="500" style="min-height:70px;margin-top:8px" placeholder="Great job on World 4! Try the Board trial next."></textarea>
      <div class="row" style="margin-top:8px"><select class="t" id="ntw" aria-label="About which world"><option value="general">General</option>${W.map((w) => `<option value="${coreOf(w)[0].id}">${esc(worldName(w.n))}</option>`).join("")}</select><button class="btn pri" id="ntok" type="button">Send note</button></div></div>
    <div class="panel"><h3>Teacher tools</h3>
      <div class="row"><label class="row">Bonus XP <input class="t" id="bx" type="number" min="-100" max="100" value="10" style="width:90px"></label><input class="t" id="br" maxlength="60" placeholder="Reason (e.g. helped a classmate)" style="max-width:280px"><button class="btn" id="bok" type="button">Give</button></div>
      <div class="row" style="margin-top:10px"><label class="row">Catch-up: skip ahead to <select class="t" id="sk">${W.filter((w) => w.n > 0).map((w) => `<option value="w${w.n}">${esc(worldName(w.n))}</option>`).join("")}</select></label><button class="btn" id="skok" type="button">Skip ahead</button></div>
      <p class="lnote">Skipped missions earn no XP and don't count toward badges or mastery.</p>
      ${T.data.classes.length > 1 ? `<div class="row" style="margin-top:10px"><label class="row">Move to class <select class="t" id="mv">${T.data.classes.map((c) => `<option value="${esc(c.id)}"${c.id === s.classId ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label><button class="btn" id="mvok" type="button">Move</button></div>` : ""}
      <div class="row" style="margin-top:10px"><button class="btn" id="rp" type="button">Reset password</button><button class="btn bad" id="rm" type="button">Remove from Maker Quest</button></div></div>`);
  const again = async (msg) => { if (msg) toast(msg); await loadTeacher(); drawTeacher(); studentDrawer(id); };
  $("ntok").onclick = async () => { const body = $("nt").value.trim(); if (!body) return; try { await api("POST", "/api/mq/teacher/notes", { studentId: id, body, lessonId: $("ntw").value }); again("Note sent"); } catch (e) { toast(errText(e)); } };
  $("bok").onclick = async () => { try { await api("POST", `/api/mq/teacher/students/${encodeURIComponent(id)}/bonus`, { amount: +$("bx").value, reason: $("br").value }); again("Bonus given"); } catch (e) { toast(e.message === "bad_amount" ? "Use a number from -100 to 100 (not 0)." : errText(e)); } };
  $("skok").onclick = async () => { try { const r = await api("POST", `/api/mq/teacher/students/${encodeURIComponent(id)}/skip`, { world: $("sk").value }); again(`Skipped ${r.skipped} missions`); } catch (e) { toast(errText(e)); } };
  $("mvok") && ($("mvok").onclick = async () => { try { await api("PUT", `/api/mq/teacher/students/${encodeURIComponent(id)}/class`, { classId: $("mv").value }); again("Moved to " + (N[$("mv").value] || "class")); } catch (e) { toast(errText(e)); } });
  $$("[data-rt]", el).forEach((b) => (b.onclick = () => allowRetake(id, b.dataset.rt, () => { drawTeacher(); studentDrawer(id); })));
  $("rp").onclick = () => { close(); resetPw(id); };
  $("rm").onclick = () => { close(); removeStudent({ id, name: s.name, inPyQuest: s.inPyQuest }); };
}

start();
