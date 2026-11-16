# Python Quest

A browser game that teaches middle schoolers Python. Students write real Python to finish 28 missions across four worlds, in the adventure they pick: **Space Mission**, **Dungeon Quest** or **Robot Rescue**.

| World | Concepts | Levels |
|---|---|---|
| 1 | `print`, variables, math, `input()`, `int()` | 7 |
| 2 | `if` / `elif` / `else`, `and` / `or` | 7 |
| 3 | `for`, `range()`, `while`, maze levels | 7 |
| 4 | `def`, `return`, lists | 7 |

Each world mixes four kinds of challenge — write code, predict the output, debug broken code, and program a character through a maze — and ends with a boss level. Every level has three free hints, the last one close to the answer. All levels are open, so students go at their own pace.

Python runs inside the browser (Skulpt, bundled in `vendor/`), so nothing needs installing and school filters don't have to allow a code-runner site.

## 1. Put it on GitHub Pages

1. Copy everything in this folder into your GitHub Pages repository, either at the top level or in a subfolder such as `python-quest/`.
2. Commit and push. The game is at `https://YOUR-NAME.github.io/` (or `/python-quest/` if you used a subfolder), and the teacher view is `teacher.html` beside it.
3. Edit `js/config.js` to set your class name and periods.

The game works right away. Until you do step 2 below, progress stays on each computer, and students press **Turn in** to get a code they can paste into an assignment for you. Paste those codes into the teacher dashboard to see them.

## 2. Connect a Google Sheet (leaderboard + live teacher view)

About 5 minutes, once.

1. Create a new Google Sheet (any name, for example "Python Quest Progress").
2. **Extensions → Apps Script.** Delete what's there and paste in all of `apps-script/Code.gs`.
3. On the line `const TEACHER_KEY = '...'`, change the key to a secret only you know. Save.
4. **Deploy → New deployment.** Click the gear and choose **Web app**. Set *Execute as:* **Me** and *Who has access:* **Anyone**. Click **Deploy** and approve the permissions (Google warns because you wrote the script; choose *Advanced → Go to project*).
5. Copy the **Web app URL** (it ends in `/exec`) and paste it into `sheetUrl` in `js/config.js`. Commit and push.
6. Open `teacher.html`, type your teacher key, and click **Load class**.

Students sign in with their first name, last initial and class period. Each time a student finishes a level, their row in the sheet updates, the class leaderboard updates, and they can continue on any computer by signing in with the same name and period.

**If you change `Code.gs` later**, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

### What gets stored

Name as typed, period, chosen adventure, XP, which levels are finished, total hints used, and the last time they played. No accounts, emails or passwords. Anyone with the web app URL can see the leaderboard (names, periods, XP), and a determined student could edit their own row from the browser console, so treat XP as motivation rather than a grade of record.

## Teacher dashboard

`teacher.html` shows:

- class size, average levels, who played this week, and who has finished
- a completion bar for every level, which shows where the class gets stuck
- a sortable table of students with per-world progress, hints used and last activity (red when idle for over a week)
- **Export CSV** for your gradebook

## Changing the levels

Levels are written in `levels_src.py`, which I sent separately. It contains the answer to every level, so **keep it out of your public repo**. Run `python3 levels_src.py js/levels.js` to check every reference solution with real Python and rebuild `js/levels.js`. If you edit `js/levels.js` directly, keep `pre` and `post` fields as they are; they are what the checker runs around student code.

## Files

```
index.html          the game
teacher.html        teacher dashboard
js/config.js        your settings (class name, periods, sheet URL)
js/levels.js        the 28 levels
js/themes.js        the three adventures' names, story text and characters
js/engine.js        runs and checks Python
js/game.js          game screens
js/sync.js          Google Sheet connection and turn-in codes
js/teacher.js       dashboard logic
css/                styles
vendor/             Skulpt (MIT license, see SKULPT-LICENSE.txt)
apps-script/Code.gs paste into your Google Sheet's Apps Script
```
