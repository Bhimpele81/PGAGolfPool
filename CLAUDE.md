# PGAGolfPool: project notes for Claude Code

This file loads automatically at the start of every Claude Code session in this repo.
`README.md` is the feature reference (it lags the code a little; see HANDOFF.md for what changed
after it was last rewritten). `HANDOFF.md` has the history, gotchas, and open items.

## What this is
A two-person golf major pool tracker: **Bill vs Don**. Each drafts up to 8 golfers from the live
ESPN field; the app pulls the ESPN leaderboard every 60 seconds, highlights each player's best 3,
and settles three bets. React 18, Supabase (Postgres) for shared picks, deployed as a static site on
Render at **https://pgagolfpool.onrender.com**. Sister apps linked in the header: NASCAR Pool
(nascarpool.onrender.com) and Bowl Pool (ncaabowlpool.onrender.com).

## Where things live
- `src/App.js`: header, tabs (Dashboard, Rules), external links. No data logic here.
- `src/pages/Dashboard.js`: everything that matters. Supabase load/save of picks, Draft Mode (passcode
  gated), draft board, team panels, scoring banner, freeze controls, "who had first pick in the
  previous contest" dropdown. `const TOURNAMENT = '2026-pga-championship'` at the top is the
  Supabase key for this contest's rows (see gotchas).
- `src/utils/espnGolfApi.js`: ESPN fetch (`site.api.espn.com/.../golf/pga/scoreboard`, direct first,
  then codetabs and allorigins proxies), tee times from `sports.core.api.espn.com` per competitor,
  localStorage caches, freeze/unfreeze.
- `src/utils/scoring.js`: best-3 selection and the three payouts.
- `src/utils/supabase.js`: client. `src/utils/storage.js` and `src/pages/Login.js` are legacy and
  unused (Login still says "Masters").
- `public/health.html` is the UptimeRobot ping target.

## Deploy and run
- GitHub `Bhimpele81/PGAGolfPool`, branch **`main`**. Push and Render auto-builds. Local: `npm start`.
- Supabase table `picks` (`tournament`, `player`, `golfers text[]`, `locked`, unique on
  tournament+player). Supabase free tier pauses inactive projects; if saves fail, check the dashboard.
- Always `git pull` first. The Windows clone was 6 commits behind origin at one point, which hid the
  Open Championship rebrand and the passcode gate.

## Rules that are implemented (do not change without Bill)
- Up to **8 golfers** per player. **Best 3** (lowest strokes) count.
- **Golfer Win $20**: only when a picked golfer is in **sole** first place (no payout on a tie at the top).
- **Cumulative Score Win $20**: lower best-3 total. Equal totals show as Tied (a tie bug was fixed).
- **Stroke Differential $2 per stroke** between the two best-3 totals.
- Draft Mode is the only way to edit picks and is gated by a **4-digit passcode** hardcoded
  client-side in `Dashboard.js` (`window.prompt`). Same code the NASCAR app uses for Auto Update.
- Draft board always sorts by **last name**; search box with clear button.

## Gotchas
- **`TOURNAMENT` stays `'2026-pga-championship'` even though the UI says "2026 Open Championship."**
  It was changed to the US Open key once and reverted because existing Supabase rows would have
  disappeared. Changing the key orphans the saved picks; if a new contest truly needs a fresh slate,
  change the key on purpose and tell Bill the old picks will no longer load.
- "Who had first pick in the previous contest" is stored as a pseudo-player row
  (`player: '_firstpick_prev'`) in the same `picks` table. Do not treat it as a real player.
- The app "knows" which tournament to show because ESPN's PGA scoreboard endpoint returns the
  current event as `events[0]`. There is no tournament selector; when ESPN moves on, so does the app.
- Tee times: ESPN gives a time string; the app shows it **as ESPN provides it** (an earlier version
  converted time zones and showed wrong times on Safari/iOS). Tee-time cache is keyed to the live round.
- Auto-freeze triggers when Round 4 is detected and the leader has finished; frozen data lives in
  localStorage. Unfreeze resumes polling.
- Picks not visible on the phone but visible on the computer was a Supabase load/cache issue and is
  fixed; picks are cached in localStorage and loaded from Supabase on every visit.

## Standing rules from Bill (follow without being asked)
- **Never use em dashes** anywhere (UI text, README, comments, commits). Use commas, colons,
  parentheses, or separate sentences. The README still has several; fix them only when already editing it.
- **Do not change layout or formatting** beyond what was asked.
- Keep `README.md` in sync when a feature ships.
- **Never use the word "corpus."**
- Commit messages end with `Co-Authored-By: Claude <noreply@anthropic.com>`.

## Machines
- Windows: `C:\Users\bhimpele\Desktop\GitHub\PGAGolfPool`. Mac: `/Users/billhimpele/Documents/GitHub/PGAGolfPool`.
- **Open Claude Code directly on this folder** so its history lands here. Earlier PGA sessions were
  started from the Aapryl-Efficacy or parent GitHub folder, which is why no history showed up for
  this project.
