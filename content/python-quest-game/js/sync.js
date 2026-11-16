// Talks to the teacher's Google Sheet (via Apps Script) and makes
// turn-in codes. Everything here fails quietly: the game never
// depends on the network.
(function () {
  const PQ = (window.PQ = window.PQ || {});
  const cfg = window.PQ_CONFIG || {};
  const url = (cfg.sheetUrl || "").trim();

  PQ.sync = {
    enabled: !!url,

    async save(summary) {
      if (!url) return false;
      try {
        // text/plain keeps this a "simple" request, which Apps Script accepts from any site.
        const r = await fetch(url, { method: "POST", body: JSON.stringify(Object.assign({ action: "save" }, summary)) });
        const j = await r.json();
        return !!j.ok;
      } catch (e) { return false; }
    },

    async get(id) {
      if (!url) return null;
      try {
        const r = await fetch(url + "?action=get&id=" + encodeURIComponent(id));
        const j = await r.json();
        return j.ok ? j.player : null;
      } catch (e) { return null; }
    },

    async board(period) {
      if (!url) return null;
      try {
        const r = await fetch(url + "?action=board" + (period ? "&period=" + encodeURIComponent(period) : ""));
        const j = await r.json();
        return j.ok ? j.board : null;
      } catch (e) { return null; }
    },

    async all(key) {
      if (!url) return { ok: false, error: "no_url" };
      try {
        const r = await fetch(url + "?action=all&key=" + encodeURIComponent(key));
        return await r.json();
      } catch (e) { return { ok: false, error: "network" }; }
    }
  };

  // ---- turn-in codes: a short, copyable summary a student can hand in
  function checksum(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h; }
  function b64(s) { return btoa(unescape(encodeURIComponent(s))); }
  function unb64(s) { return decodeURIComponent(escape(atob(s))); }

  PQ.makeCode = function (summary) {
    const body = JSON.stringify({ n: summary.name, p: summary.period, t: summary.theme, d: summary.done, h: summary.hints, u: summary.updated });
    const enc = b64(body);
    return "PQ-" + enc + "-" + checksum(enc);
  };

  PQ.readCode = function (code) {
    const m = String(code).trim().match(/^PQ-([A-Za-z0-9+/=]+)-(\d+)$/);
    if (!m) return null;
    if (checksum(m[1]) !== +m[2]) return null;
    try {
      const o = JSON.parse(unb64(m[1]));
      return { name: o.n, period: String(o.p), theme: o.t, done: o.d || "", hints: o.h || 0, updated: o.u };
    } catch (e) { return null; }
  };
})();
