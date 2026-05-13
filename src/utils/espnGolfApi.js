const CACHE_KEY        = 'golf_leaderboard_cache';
const FREEZE_KEY       = 'golf_leaderboard_frozen';
const FREEZE_DATA_KEY  = 'golf_leaderboard_frozen_data';
const TEE_CACHE_KEY    = 'golf_teetimes_cache';
const TEE_ROUND_KEY    = 'golf_teetimes_round';

// Module-level state populated each time fetchLeaderboard() runs
let _eventId      = null;
let _competitorMap = {}; // displayName → athleteId

export function isFrozen() {
  try { return JSON.parse(localStorage.getItem(FREEZE_KEY) || 'false'); }
  catch { return false; }
}

export function getFrozenData() {
  try { return JSON.parse(localStorage.getItem(FREEZE_DATA_KEY) || 'null'); }
  catch { return null; }
}

export function freezeLeaderboard(data) {
  try {
    localStorage.setItem(FREEZE_KEY, 'true');
    localStorage.setItem(FREEZE_DATA_KEY, JSON.stringify(data));
  } catch {}
}

export function unfreezeLeaderboard() {
  try {
    localStorage.removeItem(FREEZE_KEY);
    localStorage.removeItem(FREEZE_DATA_KEY);
    localStorage.removeItem(TEE_CACHE_KEY);
    localStorage.removeItem(TEE_ROUND_KEY);
  } catch {}
}

const PROXIES = [
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
];

export function getCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); }
  catch { return null; }
}

function setCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); }
  catch {}
}

async function fetchWithProxy(apiUrl) {
  // Try direct fetch first — ESPN's public API allows browser access without CORS proxy
  try {
    const res = await fetch(apiUrl, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json) return json;
    }
  } catch (e) {
    // CORS blocked — fall through to proxies
  }

  // Fall back to proxies if direct fetch fails
  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy(apiUrl), { cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      const json = typeof data.contents === 'string' ? JSON.parse(data.contents) : data;
      return json;
    } catch (e) {
      continue;
    }
  }
  return null;
}

// ─── Tee-time helpers ────────────────────────────────────────────────────────

function formatTeeTime(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
      timeZone: 'America/New_York',
    });
  } catch (e) { return null; }
}

function getTeeTimesCache(round) {
  try {
    const cachedRound = localStorage.getItem(TEE_ROUND_KEY);
    if (cachedRound !== String(round)) return {}; // stale — different round
    return JSON.parse(localStorage.getItem(TEE_CACHE_KEY) || '{}');
  } catch { return {}; }
}

function setTeeTimesCache(teeTimes, round) {
  try {
    localStorage.setItem(TEE_CACHE_KEY, JSON.stringify(teeTimes));
    localStorage.setItem(TEE_ROUND_KEY, String(round));
  } catch {}
}

/**
 * Fetch tee times for any golfers whose thru is '--'.
 * Call this AFTER fetchLeaderboard() — it relies on _eventId / _competitorMap
 * populated during that call.
 *
 * Returns a map of { playerName: '10:15 AM' } for golfers who haven't started.
 * Fails silently (returns {}) if the core API is CORS-blocked.
 */
export async function fetchTeeTimes(leaderboard, currentRound = 1) {
  if (!_eventId || !leaderboard.length) return {};

  const notStarted = leaderboard.filter(g => g.thru === '--' && _competitorMap[g.name]);
  if (!notStarted.length) return {};

  // Serve from cache when possible
  const cached = getTeeTimesCache(currentRound);
  const uncached = notStarted.filter(g => !cached[g.name]);
  if (!uncached.length) return cached;

  const makeUrl = (name) =>
    `https://sports.core.api.espn.com/v2/sports/golf/leagues/pga/events/${_eventId}` +
    `/competitions/${_eventId}/competitors/${_competitorMap[name]}/status`;

  // ── CORS probe: try one request before committing to the rest ──
  const first = uncached[0];
  try {
    const res = await fetch(makeUrl(first.name), { cache: 'no-store' });
    if (!res.ok) return cached;
    const d = await res.json();
    if (d.teeTime) cached[first.name] = formatTeeTime(d.teeTime);
  } catch (e) {
    // CORS blocked or network error — return whatever we had cached
    return cached;
  }

  // ── Fetch the rest in parallel ──
  await Promise.allSettled(
    uncached.slice(1).map(async (g) => {
      try {
        const res = await fetch(makeUrl(g.name), { cache: 'no-store' });
        if (res.ok) {
          const d = await res.json();
          if (d.teeTime) cached[g.name] = formatTeeTime(d.teeTime);
        }
      } catch (e) { /* skip */ }
    })
  );

  setTeeTimesCache(cached, currentRound);
  return cached;
}

// ─── Main leaderboard fetch ───────────────────────────────────────────────────

export async function fetchLeaderboard() {
  // If frozen, return frozen data immediately — don't call ESPN
  if (isFrozen()) {
    const frozenData = getFrozenData();
    if (frozenData) return frozenData;
  }

  const apiUrl = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard';
  try {
    const json = await fetchWithProxy(apiUrl);
    if (json) {
      const competition   = json?.events?.[0]?.competitions?.[0];
      const competitors   = competition?.competitors || [];
      const eventId       = json?.events?.[0]?.id;
      const currentRound  = competition?.status?.period || 1;

      // Store for use by fetchTeeTimes()
      if (eventId) _eventId = eventId;
      _competitorMap = {};

      if (competitors.length > 0) {
        const results = competitors.map(c => {
          const name = c.athlete?.displayName || '';

          // Build competitor → id map for tee-time lookups
          if (c.id && name) _competitorMap[name] = c.id;

          const rawScore = c.score || 'E';
          let strokes = null;
          if (rawScore === 'E') strokes = 0;
          else if (rawScore) strokes = parseInt(rawScore.replace('+', ''), 10);

          const espnPlace       = c.status?.position?.displayName || null;
          const currentRoundData = c.linescores?.find(l => l.period === currentRound);

          let thru = '--';
          if (c.status?.thru != null) {
            thru = c.status.thru === 0 ? 'F' : String(c.status.thru);
          } else if (currentRoundData?.linescores?.length > 0) {
            const holesPlayed = currentRoundData.linescores.length;
            thru = holesPlayed >= 18 ? 'F' : String(holesPlayed);
          }
          // (tee times for '--' golfers are filled in by fetchTeeTimes() after this returns)

          return { name, strokes, espnPlace, thru };
        });

        const sorted = results.sort((a, b) => (a.strokes ?? 999) - (b.strokes ?? 999));

        // Calculate tied places from scores when ESPN doesn't provide them
        sorted.forEach((g, i) => {
          if (g.espnPlace) {
            g.place = g.espnPlace;
          } else if (g.strokes == null) {
            g.place = '--';
          } else {
            const sameScore = sorted.filter(x => x.strokes === g.strokes).length;
            const firstIdx  = sorted.findIndex(x => x.strokes === g.strokes) + 1;
            g.place = sameScore > 1 ? `T${firstIdx}` : String(firstIdx);
          }
          delete g.espnPlace;
        });

        // Auto-freeze only if it's Round 4 and the leader has finished
        if (currentRound === 4 && sorted[0]?.thru === 'F') {
          freezeLeaderboard(sorted);
        }
        setCache(sorted);
        return sorted;
      }
    }
  } catch (e) {
    console.error('ESPN API error:', e);
  }

  // Try cache first before falling back to demo
  const cached = getCache();
  if (cached && cached.length > 0) {
    console.log('No live data — using cached leaderboard.');
    return cached;
  }

  // Last resort: demo field
  console.warn('No live or cached data. Using demo field.');
  return [
    { name: 'Scottie Scheffler',   strokes: -12, place: '1',   thru: 'F' },
    { name: 'Rory McIlroy',        strokes: -10, place: '2',   thru: 'F' },
    { name: 'Xander Schauffele',   strokes: -9,  place: 'T3',  thru: 'F' },
    { name: 'Collin Morikawa',     strokes: -9,  place: 'T3',  thru: 'F' },
    { name: 'Jon Rahm',            strokes: -8,  place: 'T5',  thru: 'F' },
    { name: 'Viktor Hovland',      strokes: -8,  place: 'T5',  thru: 'F' },
    { name: 'Brooks Koepka',       strokes: -7,  place: 'T7',  thru: 'F' },
    { name: 'Patrick Cantlay',     strokes: -7,  place: 'T7',  thru: 'F' },
    { name: 'Ludvig Aberg',        strokes: -6,  place: 'T9',  thru: 'F' },
    { name: 'Tommy Fleetwood',     strokes: -6,  place: 'T9',  thru: 'F' },
    { name: 'Jordan Spieth',       strokes: -5,  place: 'T11', thru: 'F' },
    { name: 'Justin Thomas',       strokes: -5,  place: 'T11', thru: 'F' },
    { name: 'Tony Finau',          strokes: -4,  place: 'T13', thru: 'F' },
    { name: 'Shane Lowry',         strokes: -4,  place: 'T13', thru: 'F' },
    { name: 'Hideki Matsuyama',    strokes: -3,  place: 'T15', thru: 'F' },
    { name: 'Max Homa',            strokes: -3,  place: 'T15', thru: 'F' },
    { name: 'Jason Day',           strokes: -2,  place: 'T17', thru: 'F' },
    { name: 'Cameron Smith',       strokes: -2,  place: 'T17', thru: 'F' },
    { name: 'Russell Henley',      strokes: -1,  place: 'T19', thru: 'F' },
    { name: 'Tyrrell Hatton',      strokes: -1,  place: 'T19', thru: 'F' },
    { name: 'Dustin Johnson',      strokes:  0,  place: 'T21', thru: 'F' },
    { name: 'Adam Scott',          strokes:  0,  place: 'T21', thru: 'F' },
    { name: 'Phil Mickelson',      strokes:  1,  place: 'T23', thru: 'F' },
    { name: 'Rickie Fowler',       strokes:  2,  place: 'T24', thru: 'F' },
  ];
}
