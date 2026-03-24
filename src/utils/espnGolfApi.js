// ESPN golf leaderboard fetcher via CORS proxy
const CORS_PROXY = 'https://api.allorigins.win/get?url=';
const ESPN_LEADERBOARD = 'https://www.espn.com/golf/leaderboard';

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
}

function matchScore(espnName, draftName) {
  const a = normalizeName(espnName);
  const b = normalizeName(draftName);
  if (!a || !b) return 0;
  if (a === b) return 100;
  const aLast = a.split(' ').slice(-1)[0];
  const bLast = b.split(' ').slice(-1)[0];
  if (aLast === bLast && aLast.length > 3) return 80;
  if (b.split(' ').every(t => a.includes(t))) return 60;
  if (a.split(' ').every(t => b.includes(t))) return 60;
  if (aLast.includes(bLast) || bLast.includes(aLast)) return 40;
  return 0;
}

async function proxyFetch(url) {
  const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status}`);
  const json = await res.json();
  if (!json.contents) throw new Error('Proxy returned empty contents.');
  return json.contents;
}

function parseLeaderboard(html) {
  const golfers = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  // ESPN leaderboard table rows
  const rows = doc.querySelectorAll('table tbody tr, .Table__TR');
  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td, .Table__TD')).map(td => td.textContent.trim());
    if (cells.length < 4) return;
    const place   = cells[0];
    const name    = cells[1];
    const thru    = cells[2];
    const strokes = cells[3];
    if (!name || !place) return;
    // Skip header rows
    if (name.toLowerCase() === 'player' || place.toLowerCase() === 'pos') return;
    golfers.push({ place, name, thru, strokes });
  });
  if (golfers.length === 0) throw new Error('No golfers found on ESPN leaderboard. Tournament may not be in progress.');
  return golfers;
}

export async function fetchGolfResults(draftNames) {
  const html    = await proxyFetch(ESPN_LEADERBOARD);
  const golfers = parseLeaderboard(html);

  console.info(`[fetchGolfResults] golfers found: ${golfers.length}`);

  const result = {};
  for (const draftName of draftNames) {
    if (!draftName) continue;
    let bestScore = 0, bestGolfer = null;
    for (const g of golfers) {
      const score = matchScore(g.name, draftName);
      if (score > bestScore) { bestScore = score; bestGolfer = g; }
    }
    if (bestGolfer && bestScore >= 40) {
      result[draftName] = {
        place:   bestGolfer.place,
        strokes: bestGolfer.strokes,
        thru:    bestGolfer.thru
      };
    }
  }
  return result;
}
