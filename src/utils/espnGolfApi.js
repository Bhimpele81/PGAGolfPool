const CACHE_KEY = 'golf_leaderboard_cache';
const PROXIES = [
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

function getCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); }
  catch { return null; }
}

function setCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); }
  catch {}
}

async function fetchWithProxy(apiUrl) {
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

export async function fetchLeaderboard() {
  const apiUrl = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard';
  try {
    const json = await fetchWithProxy(apiUrl);
    if (json) {
      const competitors = json?.events?.[0]?.competitions?.[0]?.competitors || [];
      if (competitors.length > 0) {
        const results = competitors.map(c => {
          const name = c.athlete?.displayName || '';
          const rawScore = c.score || 'E';
          let strokes = null;
          if (rawScore === 'E') strokes = 0;
          else if (rawScore) strokes = parseInt(rawScore.replace('+', ''), 10);
          const place = c.status?.position?.displayName || '--';
          const thru = c.status?.thru != null
            ? (c.status.thru === 0 ? 'F' : String(c.status.thru))
            : '--';
          return { name, strokes, place, thru };
        });
        const sorted = results.sort((a, b) => (a.strokes ?? 999) - (b.strokes ?? 999));
        setCache(sorted); // save latest good data
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
