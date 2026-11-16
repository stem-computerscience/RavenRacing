// Python Quest — teacher dashboard.
(function () {
  const PQ = window.PQ, CFG = window.PQ_CONFIG || {}, LEVELS = window.PQ_LEVELS, THEMES = window.PQ_THEMES;
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const XP = {}; LEVELS.forEach((l) => { XP[l.id] = l.xp; });

  let sheetRows = [];
  let imported = store.get("pq.teacher.codes", {});
  let sortKey = "xp", sortDir = -1;

  function norm(r, source) {
    const done = String(r.done || "").split(/\s+/).filter((id) => XP[id]);
    return {
      name: String(r.name || "?"), period: String(r.period || ""), theme: r.theme || "",
      done: done, levels: done.length, xp: done.reduce((t, id) => t + XP[id], 0),
      hints: Number(r.hints) || 0, updated: r.updated ? new Date(r.updated) : null, source: source
    };
  }

  // Merge sheet rows and pasted codes; keep the most progressed record per student.
  function allStudents() {
    const map = {};
    const add = (s) => {
      const k = s.name.toLowerCase().replace(/\s+/g, " ") + "|" + s.period;
      const cur = map[k];
      if (!cur || s.levels > cur.levels || (s.levels === cur.levels && (s.updated || 0) > (cur.updated || 0))) map[k] = s;
    };
    sheetRows.forEach((r) => add(norm(r, "sheet")));
    Object.values(imported).forEach((r) => add(norm(r, "code")));
    return Object.values(map);
  }

  function filtered() {
    const p = $("t-period").value, q = $("t-search").value.trim().toLowerCase();
    return allStudents().filter((s) => (!p || s.period === p) && (!q || s.name.toLowerCase().includes(q)));
  }

  function ago(d) {
    if (!d || isNaN(d)) return "—";
    const m = Math.round((Date.now() - d) / 60000);
    if (m < 2) return "just now"; if (m < 60) return m + " min ago";
    const h = Math.round(m / 60); if (h < 24) return h + " h ago";
    const days = Math.round(h / 24); return days + (days === 1 ? " day ago" : " days ago");
  }

  function render() {
    const list = filtered();
    // period options
    const periods = Array.from(new Set((CFG.periods || []).concat(allStudents().map((s) => s.period)))).filter(Boolean);
    const sel = $("t-period"), cur = sel.value;
    sel.innerHTML = '<option value="">All periods</option>' + periods.map((p) => '<option value="' + p.replace(/"/g, "") + '">Period ' + p.replace(/</g, "") + "</option>").join("");
    sel.value = periods.includes(cur) ? cur : "";

    // tiles
    const tiles = $("t-tiles"); tiles.innerHTML = "";
    const avg = list.length ? list.reduce((t, s) => t + s.levels, 0) / list.length : 0;
    const week = list.filter((s) => s.updated && Date.now() - s.updated < 7 * 864e5).length;
    const finished = list.filter((s) => s.levels === LEVELS.length).length;
    [["Students", list.length], ["Average levels", avg.toFixed(1) + " / " + LEVELS.length], ["Active this week", week], ["Finished everything", finished]]
      .forEach(([k, v]) => { const d = el("div", "t-tile"); d.append(el("span", "label", k), el("b", null, String(v))); tiles.append(d); });

    // level completion strip
    const lv = $("t-levels"); lv.innerHTML = "";
    let world = 0;
    LEVELS.forEach((l) => {
      if (l.world !== world) { world = l.world; lv.append(el("span", "t-world", "W" + world)); }
      const n = list.filter((s) => s.done.includes(l.id)).length;
      const pct = list.length ? Math.round((n / list.length) * 100) : 0;
      const col = el("div", "t-lv" + (l.boss ? " boss" : ""));
      col.title = "World " + l.world + " · " + l.title + ": " + n + " of " + list.length + " (" + pct + "%)";
      const bar = el("i"); bar.style.height = Math.max(2, pct) + "%";
      col.append(el("span", "t-lv-pct", pct + "%"), el("span", "t-lv-bar"), el("span", "t-lv-id", l.id));
      col.children[1].append(bar);
      lv.append(col);
    });

    // table
    list.sort((a, b) => {
      const x = a[sortKey], y = b[sortKey];
      if (x instanceof Date || y instanceof Date) return ((x || 0) - (y || 0)) * sortDir;
      if (typeof x === "number") return (x - y) * sortDir;
      return String(x).localeCompare(String(y), undefined, { numeric: true }) * sortDir;
    });
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.classList.toggle("sorted", th.dataset.sort === sortKey);
      th.setAttribute("aria-sort", th.dataset.sort === sortKey ? (sortDir > 0 ? "ascending" : "descending") : "none");
    });
    const body = $("t-body"); body.innerHTML = "";
    list.forEach((s) => {
      const tr = el("tr");
      const name = el("td", "t-name"); name.append(el("b", null, s.name));
      if (s.source === "code") name.append(el("span", "t-src", "code"));
      const worlds = el("td", "t-worlds");
      [1, 2, 3, 4].forEach((w) => {
        const ids = LEVELS.filter((l) => l.world === w).map((l) => l.id);
        const n = ids.filter((id) => s.done.includes(id)).length;
        const d = el("span", "t-w"); d.title = "World " + w + ": " + n + " / " + ids.length;
        ids.forEach((id) => d.append(el("i", s.done.includes(id) ? "on" : "")));
        worlds.append(d);
      });
      const stale = !s.updated || Date.now() - s.updated > 7 * 864e5;
      tr.append(name, el("td", null, s.period), el("td", "num", String(s.xp)), el("td", "num", s.levels + " / " + LEVELS.length), worlds,
                el("td", "num", String(s.hints)), el("td", stale ? "t-stale" : "", ago(s.updated)),
                el("td", "t-theme", THEMES[s.theme] ? THEMES[s.theme].name : "—"));
      body.append(tr);
    });
    const empty = $("t-empty");
    empty.hidden = list.length > 0;
    empty.textContent = allStudents().length ? "No students match these filters." :
      "No students yet. Load the class sheet with your teacher key, or paste turn-in codes below.";
  }

  async function load() {
    const key = $("t-key").value.trim();
    const msg = $("t-msg");
    if (!PQ.sync.enabled) { render(); return; }
    if (!key) { msg.textContent = "Enter your teacher key to load the class sheet."; render(); return; }
    msg.textContent = "Loading…";
    const r = await PQ.sync.all(key);
    if (r.ok) {
      sheetRows = r.players || []; store.set("pq.teacher.key", key);
      msg.textContent = "Loaded " + sheetRows.length + " students from the sheet at " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ".";
    } else if (r.error === "bad_key") msg.textContent = "That teacher key doesn't match the one in your Apps Script.";
    else msg.textContent = "Couldn't reach the sheet. Check the URL in js/config.js and that the script is deployed for \"Anyone\".";
    render();
  }

  $("t-key-form").addEventListener("submit", (e) => { e.preventDefault(); load(); });
  $("t-refresh").onclick = load;
  $("t-period").onchange = render;
  $("t-search").oninput = render;
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.tabIndex = 0;
    const go = () => { const k = th.dataset.sort; sortDir = sortKey === k ? -sortDir : (k === "name" || k === "period" ? 1 : -1); sortKey = k; render(); };
    th.onclick = go; th.onkeydown = (e) => { if (e.key === "Enter") go(); };
  });

  $("t-import").onclick = () => {
    const lines = $("t-codes").value.split(/\s+/).filter(Boolean);
    let ok = 0, bad = 0;
    lines.forEach((c) => {
      const s = PQ.readCode(c);
      if (!s) { bad++; return; }
      imported[s.name.toLowerCase() + "|" + s.period] = s; ok++;
    });
    store.set("pq.teacher.codes", imported);
    $("t-import-msg").textContent = ok + " added" + (bad ? ", " + bad + " not recognized (check for missing characters)" : "") + ".";
    if (ok) $("t-codes").value = "";
    render();
  };
  $("t-clear-codes").onclick = () => {
    const b = $("t-clear-codes");
    if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = "Click again to remove"; setTimeout(() => { delete b.dataset.armed; b.textContent = "Remove pasted codes"; }, 2500); return; }
    imported = {}; store.set("pq.teacher.codes", imported); delete b.dataset.armed; b.textContent = "Remove pasted codes";
    $("t-import-msg").textContent = "Pasted codes removed."; render();
  };

  $("t-csv").onclick = () => {
    const rows = [["Name", "Period", "XP", "Levels", "Hints", "Last active", "Adventure", "Levels done"]];
    filtered().forEach((s) => rows.push([s.name, s.period, s.xp, s.levels, s.hints, s.updated ? s.updated.toISOString() : "", s.theme, s.done.join(" ")]));
    const csv = rows.map((r) => r.map((v) => {
      let t = String(v);
      if (/^[=+\-@]/.test(t)) t = "'" + t; // keep spreadsheet apps from treating names as formulas
      return '"' + t.replace(/"/g, '""') + '"';
    }).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "python-quest-progress.csv";
    document.body.append(a); a.click(); a.remove();
  };

  // boot
  $("t-source").textContent = PQ.sync.enabled
    ? "Students' progress is saved to your Google Sheet as they play. Enter your teacher key to see it."
    : "The class sheet isn't connected yet (see README.md), so this page shows only turn-in codes you paste below.";
  $("t-key-form").hidden = !PQ.sync.enabled;
  $("t-key").value = store.get("pq.teacher.key", "");
  if (PQ.sync.enabled && $("t-key").value) load(); else render();
})();
