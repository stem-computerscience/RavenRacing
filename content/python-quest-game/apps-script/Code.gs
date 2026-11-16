/**
 * Python Quest — class progress sheet.
 *
 * Paste this whole file into Extensions → Apps Script of a new Google
 * Sheet, change TEACHER_KEY below, then Deploy → New deployment →
 * Web app (Execute as: Me, Who has access: Anyone). Copy the web app
 * URL into js/config.js. Full steps are in README.md.
 */

// Change this! You type it on teacher.html to see everyone's progress.
const TEACHER_KEY = 'change-me-to-something-secret';

const SHEET_NAME = 'Progress';
const HEADER = ['id', 'name', 'period', 'theme', 'xp', 'levels', 'done', 'hints', 'updated'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADER);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Keep student-typed text from being read as a spreadsheet formula.
function clean_(v, max) {
  let s = String(v == null ? '' : v).slice(0, max || 60);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function rows_() {
  const values = sheet_().getDataRange().getValues();
  values.shift();
  return values.filter(r => r[0]).map(r => ({
    id: String(r[0]), name: String(r[1]), period: String(r[2]), theme: String(r[3]),
    xp: Number(r[4]) || 0, levels: Number(r[5]) || 0, done: String(r[6] || ''),
    hints: Number(r[7]) || 0, updated: r[8] instanceof Date ? r[8].toISOString() : String(r[8] || '')
  }));
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'board') {
    let r = rows_();
    if (p.period) r = r.filter(x => x.period === String(p.period));
    r.sort((a, b) => b.xp - a.xp);
    return json_({ ok: true, board: r.slice(0, 50).map(x => ({ name: x.name, period: x.period, xp: x.xp, levels: x.levels })) });
  }
  if (p.action === 'get') {
    const r = rows_().find(x => x.id === String(p.id));
    return json_({ ok: true, player: r ? { done: r.done, xp: r.xp } : null });
  }
  if (p.action === 'all') {
    if (!p.key || p.key !== TEACHER_KEY || TEACHER_KEY === 'change-me-to-something-secret') return json_({ ok: false, error: 'bad_key' });
    return json_({ ok: true, players: rows_() });
  }
  return json_({ ok: true, app: 'Python Quest' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.action !== 'save' || !d.id) return json_({ ok: false });
    const id = String(d.id).slice(0, 80);
    const sh = sheet_();
    const ids = sh.getRange(1, 1, Math.max(1, sh.getLastRow()), 1).getValues().map(r => String(r[0]));
    const row = ids.indexOf(id) + 1;
    const values = [clean_(id, 80), clean_(d.name, 40), clean_(d.period, 10), clean_(d.theme, 20),
                    Number(d.xp) || 0, Number(d.levels) || 0, clean_(d.done, 400), Number(d.hints) || 0, new Date()];
    if (row < 1) sh.appendRow(values);
    else sh.getRange(row, 1, 1, values.length).setValues([values]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
