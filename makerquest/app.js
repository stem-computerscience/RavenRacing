// Maker Quest app: sign-in, the student game (progress saved to the server) and the teacher dashboard.
// Talks to the same Cloudflare Worker as PyQuest, under /api/mq/*.
import { W, XP, TAG, missionById, isCore, coreOf, stepCount, doneFor, rankFor, CONCEPTS, mastery,
  SPANS, CONTENT_DAYS, TOTAL_DAYS, weekOfDay, classDates, classDayOn, clearedForPace, paceOf, niceDate, todayIso, validIso } from "./data.js";

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
const paceChip = (p) => (!p ? "" : p.behind.length ? `<span class="chip behind" title="Overdue: ${p.behind.map((n) => "World " + n).join(", ")}">Behind ${p.behind.length}</span>` : p.ahead ? `<span class="chip ahead">Ahead</span>` : `<span class="chip ahead">On track</span>`);
const mLabel = (m) => (m.t === "h" ? "Trial" : m.t === "s" ? "Side " + m.lv : "L" + m.lv);

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
    <svg viewBox="0 0 300 70" width="100%" aria-hidden="true">${[...Array(25)].map((_, i) => `<rect x="${112 + (i % 5) * 16}" y="${3 + Math.floor(i / 5) * 13}" width="9" height="9" rx="2" fill="${"0101001010000001000101110"[i] === "1" ? "#ff3b2f" : "#3a1714"}"/>`).join("")}</svg>
    <h1>micro:bit Maker Quest</h1>
    <p>Sign in with the username and password your teacher gave you. PyQuest students use the same login.</p>
    <label class="f">Username<input class="t" id="un" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
    <label class="f">Password<input class="t" id="pw" type="password" autocomplete="current-password" required></label>
    <div class="err" id="le" role="alert">${esc(msg)}</div>
    <button class="cbtn" type="submit">Sign in</button>
    <p class="lnote">Teachers: sign in with your PyQuest teacher account to open the Maker Quest dashboard.</p>
  </form></div>`;
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
    <div><h1>micro:bit Maker Quest</h1><p>Creating Apps with Devices, played as 17 worlds. Your progress saves to your account.</p></div>
    <div class="stats">
      <div class="stat"><b id="rank"></b><span>Rank</span></div>
      <div class="stat"><b id="xp"></b><span>Total</span></div>
      <div class="stat"><b id="bc"></b><span>Badges</span></div>
    </div>
    <div class="xpbar" aria-hidden="true"><i id="xpfill"></i></div>
    <div class="xpnote" id="xpnote"></div>
    <div class="pacebar" id="pacebar" hidden></div>
  </header>
  <nav class="strip" id="strip" aria-label="Worlds"></nav>
  <main class="band main">
    <aside class="side">
      <svg class="board" id="board" viewBox="0 0 300 250" role="img" aria-label="micro:bit showing this world's icon. Press A or B to change world."></svg>
      ${linkPanelHTML()}
      <div class="badges" id="notesbox" hidden></div>
      <div class="badges"><h3>Class board this week</h3><ol class="board-list" id="cboard"><li><span></span><span></span><span class="pts">Loading…</span></li></ol></div>
      <div class="badges"><h3>Badge case</h3><div class="blist" id="blist"></div></div>
    </aside>
    <section id="world" aria-live="polite"></section>
  </main>
  <footer class="band foot">Each mission matches one level of the Code.org unit and opens it in Code.org. XP: video 25 · predict 50 · skill 100 · side quest 75 each · board trial 100 · project step 150 · boss 250.</footer>`;
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

function board(icon, flash) {
  const s = $("board"); if (!s) return;
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
<g font-family="Chakra Petch,sans-serif" font-weight="700" fill="#eef2ea" text-anchor="middle"><text x="52" y="146" font-size="16">A</text><text x="248" y="146" font-size="16">B</text><text x="150" y="180" font-size="14" fill="#a7b5ad">World ${W[UI.cur].n}</text></g>
<circle cx="52" cy="101" r="26" fill="transparent" id="btnA" style="cursor:pointer"/><circle cx="248" cy="101" r="26" fill="transparent" id="btnB" style="cursor:pointer"/>`;
  s.classList.remove("flash"); if (flash) { void s.getBoundingClientRect(); s.classList.add("flash"); }
  $("btnA").onclick = () => go(UI.cur - 1); $("btnB").onclick = () => go(UI.cur + 1);
}
function strip() {
  const P = paceInfo(ME.pacing);
  $("strip").innerHTML = W.map((w, k) => { const due = P?.due(w.n), late = due && due < P.today && !clearedForPace(ME.progress, w.n);
    return `<button class="pad${k === UI.cur ? " on" : ""}${wDone(w) ? " done" : ""}${late ? " late" : ""}" data-w="${k}" type="button" aria-label="World ${w.n}: ${esc(w.g)}${locked(w) ? " (locked)" : ""}${due ? ", due " + niceDate(due) : ""}${late ? ", overdue" : ""}">${locked(w) ? `<span class="lk">Locked</span>` : ""}<span class="n">World ${w.n}</span><span class="t">${esc(w.g)}</span>${due ? `<span class="due">${late ? "Overdue · " : "Due "}${esc(niceDate(due).replace(/^\w+, /, ""))}</span>` : ""}<span class="fill"><i style="width:${wPct(w)}%"></i></span></button>`; }).join("");
  $$(".pad", $("strip")).forEach((p) => (p.onclick = () => go(+p.dataset.w)));
}
function hud() {
  const x = ME.member.xp, r = rankFor(x);
  $("rank").textContent = r.name; $("xp").textContent = x.toLocaleString() + " XP";
  $("bc").textContent = (ME.member.badges || []).length + " / 17";
  $("xpfill").style.width = (r.next ? Math.min(100, (100 * (x - r.at)) / (r.next[0] - r.at)) : 100) + "%";
  $("xpnote").textContent = r.next ? (r.next[0] - x).toLocaleString() + " XP to " + r.next[1] : "Top rank reached. Legendary.";
  $("blist").innerHTML = W.map((w) => `<span class="bdg${wDone(w) ? " got" : ""}" title="World ${w.n}">${esc(w.bd)}</span>`).join("");
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
    const ww = weekWorlds(P.week);
    html = `<b>Week ${P.week} of 9</b> · this week: World${ww.length > 1 ? "s" : ""} ${ww.join(", ")}` +
      (next ? ` · next goal: clear World ${next.n} by ${esc(niceDate(P.due(next.n)))}` : "") +
      (pace.behind.length ? ` · <span class="late-t">${pace.behind.length} world${pace.behind.length > 1 ? "s" : ""} behind (World ${pace.behind.join(", ")})</span>` : pace.ahead ? " · ahead of schedule" : " · on track");
  }
  el.innerHTML = html;
}
const url = (w, lv, sub) => "https://studio.code.org/courses/microbit-2026/units/1/lessons/" + (w + 1) + "/levels/" + lv + (sub ? "/sublevel/" + sub : "");
function mission(m, w, k) {
  const T = TAG[m.t], open = UI.open[m.id], d = mDone(m), sk = mSkip(m), lk = locked(w);
  const dis = lk ? " disabled" : "";
  const head = `<button class="mh" type="button" data-o="${m.id}" aria-expanded="${!!open}"><span class="nr">${d ? "✓" : sk ? "S" : k + 1}</span><span><span class="mt">${fmt(m.title)}</span><span class="mk"><span class="tag ${T[0]}">${T[1]}</span><span>${m.t === "h" ? "Uses your real micro:bit · bonus" : "Code.org Lesson " + w.n + ", Level " + m.lv}</span>${sk ? "<span>Skipped by your teacher</span>" : ""}</span></span><span class="xp">${m.t === "s" ? "+" + XP.s + " each" : "+" + XP[m.t] + " XP"}</span></button>`;
  let body;
  if (m.t === "s") body = `<p class="goal">Optional bonus levels. Pick any you like; each one you finish earns XP.</p><div class="sq">${m.q.map((q, i) => `<label><input type="checkbox" data-m="${m.id}" data-i="${i}"${ck(m.id, i) ? " checked" : ""}${dis}><span><b>${fmt(q[0])}</b><span>${fmt(q[1])}</span> · <a href="${url(w.n, m.lv, i + 1)}" target="_blank" rel="noopener">open</a></span></label>`).join("")}</div>`;
  else if (m.t === "h") body = `<p class="goal">${fmt(m.goal)} ${L.on ? "" : "<b>Connect your micro:bit in Board link to play.</b>"}</p><ol class="steps">${m.steps.map((s, i) => { const key = m.keys[i]; return `<li><label><input type="checkbox" data-m="${m.id}" data-i="${i}"${ck(m.id, i) ? " checked" : ""}${key || lk ? " disabled" : ""}><span>${fmt(s)}${key ? `<span class="auto">${key === "a10" ? "(" + Math.min(L.na, 10) + "/10) " : key === "b5" ? "(" + Math.min(L.nb, 5) + "/5) " : key === "sh3" ? "(" + Math.min(L.ns, 3) + "/3) " : ""}checked by the board</span>` : ""}</span></label></li>`; }).join("")}</ol>`;
  else body = `<p class="goal">${fmt(m.goal)}</p><ol class="steps">${m.steps.map((s, i) => `<li><label><input type="checkbox" data-m="${m.id}" data-i="${i}"${ck(m.id, i) ? " checked" : ""}${dis}><span>${fmt(s)}</span></label></li>`).join("")}</ol>${m.win ? `<p class="win"><b>Win condition:</b> ${fmt(m.win)}</p>` : ""}<a class="go" href="${url(w.n, m.lv)}" target="_blank" rel="noopener">Open this level in Code.org →</a>`;
  return `<article class="m${d ? " done" : ""}${m.t === "b" ? " boss" : ""}${open ? " open" : ""}">${head}<div class="mb">${body}</div></article>`;
}
function world() {
  const w = W[UI.cur], c = coreOf(w);
  $("world").innerHTML = `<div class="wh"><h2>World ${w.n}: ${esc(w.g)}</h2><p class="orig">Code.org Lesson ${w.n}: ${esc(w.o)} · ${c.filter(mDone).length} of ${c.length} missions cleared · badge: ${esc(w.bd)}${(() => { const P = paceInfo(ME.pacing), sp = SPANS[w.n]; return ` · planned for week ${weekOfDay(sp.first)}${weekOfDay(sp.last) !== weekOfDay(sp.first) ? "–" + weekOfDay(sp.last) : ""} (${sp.last - sp.first + 1} days)${P ? ", due " + esc(niceDate(P.due(w.n))) : ""}`; })()}</p></div>
  ${locked(w) ? `<p class="lockmsg">Your teacher has locked this world for now. You can read the missions, but you can't tick them off yet.</p>` : ""}
  <p class="qotd"><b>Quest question:</b> ${esc(w.q)}</p><p class="story">${fmt(w.s)}</p>
  <div class="legend">${Object.keys(TAG).map((t) => `<span class="tag ${TAG[t][0]}">${TAG[t][1]}</span>`).join("")}</div>
  <div class="missions">${w.m.map((m, k) => mission(m, w, k)).join("")}</div>`;
  $$("[data-o]", $("world")).forEach((b) => (b.onclick = () => { UI.open[b.dataset.o] = !UI.open[b.dataset.o]; saveUI(); world(); }));
  $$("input[data-m]", $("world")).forEach((cb) => (cb.onchange = () => setStep(cb.dataset.m, +cb.dataset.i, cb.checked)));
}
function render() { strip(); hud(); world(); board(W[UI.cur].i, false); paintBtns(); }
function refresh(fl) { const y = window.scrollY; strip(); hud(); world(); window.scrollTo(0, y); board(W[UI.cur].i, fl); paintBtns(); }
function go(k) { UI.cur = (k + W.length) % W.length; L.na = L.nb = L.ns = 0; L.t0 = L.temp; saveUI(); render(); mbIcon(); $("strip").children[UI.cur]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }); }

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
      if (r.newBadges?.length) { const w = W.find((x) => "w" + x.n === r.newBadges[0]); toast("Badge unlocked: " + (w?.bd || "") + "!"); mbScroll("BADGE!"); }
      else if (r.gain > 0) { toast("+" + r.gain + " XP · " + (m.t === "s" ? "side quest" : m.title)); mbScroll("+" + r.gain); }
      refresh(r.gain > 0); if (r.gain > 0) loadBoard();
    } catch (e) {
      ME.progress[mid] = before; refresh(false);
      if (e.status === 401) { store.set(TOKEN, null); return pageLogin(ERR.signed_out); }
      toast(e.message === "locked" ? ERR.locked : "Couldn't save. Check your internet and try again.");
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
function mbIcon() { if (!L.on) return; const bits = W[UI.cur].i.replace(/ /g, "").split("").map(Number); send([SYX, 0x02, 0, ...bits, END]); }
function mbScroll(t) { if (!L.on) return; const b = [...new TextEncoder().encode(String(t).slice(0, 40))]; send([SYX, 0x04, 100, ...b.flatMap((x) => [x & 0x7f, (x >> 7) & 0x7f]), END]); }
function award(key) { const w = W[UI.cur]; const m = w.m.find((x) => x.t === "h"); if (!m || locked(w)) return; const i = m.keys.indexOf(key); if (i < 0 || ck(m.id, i)) return; setStep(m.id, i, true); }
function note(t, err) { const n = $("lnote"); if (!n) return; n.textContent = t; n.classList.toggle("err", !!err); }
function paintBtns() { const a = $("btnA"), b = $("btnB"); if (a) a.setAttribute("fill", L.a ? "rgba(243,207,122,.45)" : "transparent"); if (b) b.setAttribute("fill", L.b ? "rgba(243,207,122,.45)" : "transparent"); }
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
const TABS = [["progress", "Progress"], ["pacing", "Pacing"], ["allwork", "All work"], ["mastery", "Mastery"], ["hardware", "Board trials"], ["students", "Students"], ["classes", "Classes"], ["controls", "Controls"], ["leaderboard", "Leaderboard"]];
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
    if (document.visibilityState === "visible" && Date.now() - T.at > 20000 && $("modal").hidden && !typing && !["students", "classes"].includes(T.tab)) { try { await loadTeacher(); drawTeacher(); } catch {} }
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
  ({ progress: tabProgress, pacing: tabPacing, allwork: tabAllWork, mastery: tabMastery, hardware: tabHardware, students: tabStudents, classes: tabClasses, controls: tabControls, leaderboard: tabBoard })[T.tab]($("tab"), D);
}
function addClass() {
  const { el, close } = openModal(`<h2 id="modal-title">Add a Maker Quest class</h2><label class="f">Class name<input class="t" id="cn" maxlength="40" autofocus placeholder="2Q7P micro:bit"></label><div class="err" id="cnerr" role="alert"></div><div class="row"><button class="btn pri" id="ok" type="button">Create</button><button class="btn" data-close type="button">Cancel</button></div>`, true);
  $("ok").onclick = async () => {
    const name = $("cn").value.replace(/\s+/g, " ").trim();
    try { const r = await api("POST", "/api/mq/teacher/classes", { name }); T.classId = r.id; close(); await loadTeacher(); drawTeacher(); }
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
  <div class="panel scroll"><table><thead><tr><th>Student</th>${W.map((w) => `<th title="${esc(worldName(w.n))}${D.locks.includes("w" + w.n) ? " (locked)" : ""}">W${w.n}${D.locks.includes("w" + w.n) ? " 🔒" : ""}</th>`).join("")}<th>Pace</th><th class="nr">XP</th><th class="nr">Badges</th></tr></thead><tbody>
  ${D.students.map((s) => { const sp = studentPace(s); return `<tr><td><button class="btn small" data-stu="${esc(s.id)}" type="button">${whoHTML(s)}</button><div class="lnote">${esc(rankFor(s.xp).name)}${classOf(s)}${s.inPyQuest ? " · also in PyQuest" : ""}</div></td>${W.map((w) => {
    const c = wCount(s.progress, w); const cls = c.done === c.n ? "done" : c.done + c.skip === c.n ? "skip" : c.done || c.started || c.skip ? "part" : "";
    const lab = c.done === c.n ? "✓" : c.done + c.skip === c.n ? "S" : c.done || c.started || c.skip ? `${c.done}/${c.n}` : "–";
    const late = sp?.behind.includes(w.n);
    return `<td><span class="cell ${cls}${late ? " late" : ""}" title="${esc(worldName(w.n))}: ${c.done} of ${c.n} done${c.skip ? ", " + c.skip + " skipped" : ""}${late ? " · overdue" : ""}">${lab}</span></td>`;
  }).join("")}<td>${sp ? paceChip(sp) : `<span class="lnote">no calendar</span>`}</td><td class="nr">${s.xp}</td><td class="nr">${s.badges.length}</td></tr>`; }).join("")}</tbody></table></div>
  <p class="lnote">✓ world cleared · 2/4 core missions done · S skipped with catch-up · – not started · red outline = past its due date in the Pacing calendar. Select a student to see every mission.</p>`;
  $$("[data-stu]", el).forEach((b) => (b.onclick = () => studentDrawer(b.dataset.stu)));
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
    <p class="lnote">9 weeks of daily classes: weeks 1–8 cover the 17 lessons (40 class days), week 9 is a 5-day buffer. Add holidays and other days with no class; the plan moves later to match.</p>
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
      return `<tr class="${cur ? "now" : ""}"><td><b>Week ${wk}</b>${cur ? ` <span class="chip ahead">this week</span>` : ""}</td><td style="white-space:nowrap">${esc(niceDate(a))} – ${esc(niceDate(b))}</td><td>${wk === 9 ? "Buffer: catch-up, project polish, Post-Project Test, showcase, survey" : weekWorlds(wk).map((n) => `World ${n}: ${esc(W[n].o)}${SPANS[n].last <= wk * 5 ? ` <span class="lnote">(due ${esc(niceDate(P.due(n)))})</span>` : ` <span class="lnote">(continues)</span>`}`).join("<br>")}</td></tr>`; }).join("")}
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
  el.innerHTML = `<div class="panel"><h2>Lock worlds</h2><p class="lnote">Students in ${esc(classNames()[D.classId] || "this class")} can read a locked world but can't tick off its missions.</p>
  <div class="steps" style="margin-top:10px">${W.map((w) => `<label><input type="checkbox" data-lock="w${w.n}"${D.locks.includes("w" + w.n) ? " checked" : ""}><span><b>${esc(worldName(w.n))}</b> <span class="lnote">${esc(w.o)}</span>${D.locks.includes("w" + w.n) ? " · locked" : ""}</span></label>`).join("")}</div></div>`;
  $$("[data-lock]", el).forEach((c) => (c.onchange = async () => {
    const locks = $$("[data-lock]", el).filter((x) => x.checked).map((x) => x.dataset.lock);
    try { const r = await api("PUT", `/api/mq/teacher/classes/${encodeURIComponent(D.classId)}/locks`, { locks }); T.data.locks = r.locks; tabControls(el, T.data); } catch (e) { toast(errText(e)); }
  }));
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
    <div class="panel"><h3>Every mission</h3><div class="wlist">${W.map((w) => `<div class="wrow"><b>${esc(worldName(w.n))}${s.badges.includes("w" + w.n) ? " · badge" : ""}</b><div class="cells">${w.m.map(cellFor).join("")}</div></div>`).join("")}</div>
      <p class="lnote">Green done · gold started · grey skipped. Hover a box for the mission name.</p></div>
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
  $("rp").onclick = () => { close(); resetPw(id); };
  $("rm").onclick = () => { close(); removeStudent({ id, name: s.name, inPyQuest: s.inPyQuest }); };
}

start();
