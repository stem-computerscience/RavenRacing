const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
const year = document.querySelector('#year');

if (year) year.textContent = new Date().getFullYear();

if (menuButton && navLinks) {
  const mobile = window.matchMedia('(max-width: 940px)');
  function setOpen(open, restoreFocus = false) {
    if (restoreFocus) menuButton.focus();
    menuButton.setAttribute('aria-expanded', String(open));
    navLinks.hidden = mobile.matches && !open;
  }
  function syncLayout() {
    const focusInNav = navLinks.contains(document.activeElement);
    menuButton.hidden = !mobile.matches;
    setOpen(false, mobile.matches && focusInNav);
  }
  menuButton.addEventListener('click', () => {
    setOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches && !navLinks.hidden) {
      setOpen(false, true);
    }
  });
  navLinks.addEventListener('click', event => {
    if (mobile.matches && event.target.closest('a')) setOpen(false, true);
  });
  mobile.addEventListener('change', syncLayout);
  syncLayout();
}

// Race countdown (home page). School calendar mirrors content/countdown/countdown.html.
const raceTimers = document.querySelectorAll('.race-timer');
if (raceTimers.length) {
  const RACES = {
    dec: { day: '2026-12-12', start: new Date('2026-12-12T07:00:00-05:00'), end: new Date('2026-12-13T00:00:00-05:00') },
    apr: { day: '2027-04-17', start: new Date('2027-04-17T07:00:00-04:00'), end: new Date('2027-04-18T00:00:00-04:00') }
  };
  // Savannah-Chatham County Public Schools 2026-27 (students Aug 3 - May 21).
  const FIRST = '2026-08-03', LAST = '2027-05-21';
  const NO_SCHOOL = new Set(['2026-09-07', '2026-10-08', '2026-11-03', '2027-02-12', '2026-10-09', '2026-10-12', '2026-11-11',
    '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27',
    '2026-12-21', '2026-12-22', '2026-12-23', '2026-12-24', '2026-12-25', '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31',
    '2027-01-01', '2027-01-04', '2027-01-18', '2027-02-15', '2027-03-17', '2027-03-26',
    '2027-03-29', '2027-03-30', '2027-03-31', '2027-04-01', '2027-04-02']);
  // After dismissal (3:30 PM Eastern) today no longer counts.
  const DISMISSAL = 15 * 60 + 30;
  const etParts = now => {
    const p = {};
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(now).forEach(x => { p[x.type] = x.value; });
    return { day: `${p.year}-${p.month}-${p.day}`, minutes: +p.hour * 60 + +p.minute };
  };
  const addDay = (ds, n) => { const t = new Date(ds + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  const isSchool = ds => { const w = new Date(ds + 'T12:00:00Z').getUTCDay(); return ds >= FIRST && ds <= LAST && w > 0 && w < 6 && !NO_SCHOOL.has(ds); };
  const schoolDaysLeft = (race, now) => {
    const et = etParts(now);
    let d = et.minutes >= DISMISSAL ? addDay(et.day, 1) : et.day, n = 0;
    for (; d < race.day; d = addDay(d, 1)) if (isSchool(d)) n++;
    return n;
  };
  const pad = n => String(n).padStart(2, '0');
  const unit = (v, l) => `<div class="race-unit"><div class="race-num">${v}</div><div class="race-lbl">${l}</div></div>`;

  const tick = () => {
    const now = new Date();
    raceTimers.forEach(el => {
      const race = RACES[el.dataset.race];
      let html;
      if (now >= race.end) html = '<div class="race-status">Done ✓</div>';
      else if (now >= race.start) html = '<div class="race-status">Race day!</div>';
      else {
        const sd = schoolDaysLeft(race, now);
        let s = Math.floor((race.start - now) / 1000) % 86400;
        const h = Math.floor(s / 3600); s -= h * 3600;
        const m = Math.floor(s / 60); s -= m * 60;
        html = unit(sd, sd === 1 ? 'School Day' : 'School Days') + unit(pad(h), 'Hrs') + unit(pad(m), 'Min') + unit(pad(s), 'Sec');
        el.classList.toggle('alert', sd <= 5);
        el.classList.toggle('warn', sd > 5 && sd <= 15);
      }
      if (now >= race.start) el.classList.remove('alert', 'warn');
      if (el.innerHTML !== html) el.innerHTML = html;
    });
  };
  tick();
  setInterval(tick, 1000);
}
