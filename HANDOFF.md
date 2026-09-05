# Handoff: PGAGolfPool (Bill vs Don golf major pool)

Read `CLAUDE.md` first (it loads automatically). `README.md` describes the features in detail.
This file explains how the app got here, what changed after the README was last rewritten, and what
is open. Last updated: 2026-09-05.

## Why the Claude history for this project looked empty
PGA work was done in Claude Code sessions opened from the **Aapryl-Efficacy** folder (and the parent
`GitHub` folder), so the transcripts were filed under those projects. Nothing was lost; this
document captures what mattered. Open Claude Code directly on `PGAGolfPool` from now on.

## State of the app
Complete and in use. Live at https://pgagolfpool.onrender.com. Last code change: June 23, 2026
("add dropdown for who had first pick in the previous contest"). The UI is branded for the
**2026 Open Championship**; the Supabase key is still `2026-pga-championship` on purpose.

## How it evolved (what shipped and why)
1. **Core pool**: two team panels, 8 golfers each, best-3 highlighting, three payouts
   ($20 golfer win, $20 cumulative, $2 per stroke differential), net-total banner colored by leader.
2. **Draft Mode replaced Lock Picks.** Picks are edited only with Draft Mode on; off shows the clean
   scoring view. Draft board sorts by last name (Bill asked for this explicitly; a score-sort option
   was removed). Search box with an inline clear button.
3. **ESPN live scoring** with a dual CORS proxy fallback (codetabs, then allorigins) after the
   original proxies died; direct fetch is tried first. Round-aware Thru column, tied places computed
   from scores when ESPN omits positions, golfer win only on **sole** first place, floating
   "Updating scores" banner so the table never blanks.
4. **Tee times**: first from the ESPN leaderboard HTML page (broke), then from ESPN's core API per
   competitor (current). Bill reported the times looked wrong for Eastern time; the fix was to show
   ESPN's raw time string instead of converting time zones (Safari/iOS parsed it differently).
   Tee-time cache is keyed to the live round so stale times do not carry over.
5. **Freeze / Unfreeze**: manual snapshot plus auto-freeze when Round 4 is done.
6. **Tournament changes over the season**: 2026 Masters, then PGA Championship, then US Open, then
   Open Championship. The Supabase `TOURNAMENT` key was changed to the US Open once and **reverted**
   to `2026-pga-championship` so the existing rows kept loading. Treat the key and the title as
   independent things.
7. **Passcode on Draft Mode** (Bill's request alongside the Open Championship rebrand): a 4-digit
   code, hardcoded client-side, prompted with `window.prompt`. Same code as the NASCAR Auto Update.
8. **Supabase save errors** are logged and surfaced visibly in the UI after silent failures.
9. **Previous-contest first pick** dropdown, shared through Supabase as a pseudo-player row.
10. **Mobile**: header logo and subtitle hidden, smaller nav buttons. Favicons and a web manifest for
    Safari bookmarks.
11. Bill once asked whether his Google Sheet trick, `=IMPORTHTML("https://www.espn.com/golf/leaderboard","table",1)`,
    could be used. The app uses ESPN's JSON API instead, which is more reliable than scraping HTML.

## Data-safety note (from the NASCAR incident)
When the NASCAR app lost data to a stale device overwriting Supabase, this app was audited too.
PGA was judged **not at risk**: picks are saved only on explicit user edits in Draft Mode and there is
no whole-state auto-save on load. Keep it that way.

## Operations
- Render static site, auto-deploys from `main`. UptimeRobot pings `/health.html`.
- Supabase free tier pauses inactive projects; reactivate from the dashboard if saves stop.
- The Windows clone had drifted 6 commits behind origin (it was pulled on 2026-09-05). Always pull first.

## Open items
- **Next major**: update the page title in `Dashboard.js` and decide whether to keep or change the
  `TOURNAMENT` key (changing it starts a clean slate; keeping it shows last contest's picks until
  Draft Mode clears them).
- The README still contains em dashes and does not mention the passcode, the first-pick dropdown,
  or the Open Championship branding. Update it the next time a feature ships.
- `src/pages/Login.js` and `src/utils/storage.js` are dead code; safe to delete.
- Untracked locally: `build/`, `node_modules/`, `package-lock.json` (no `.gitignore` in the repo).
  Adding a `.gitignore` for those would be harmless.

## Related projects (same owner, same patterns)
- **NascarPool**: weekly NASCAR tracker; shares the Bill/Don conventions and the passcode.
- **NCAABowlPool**: bowl season pool; single Supabase state row with realtime sync.
