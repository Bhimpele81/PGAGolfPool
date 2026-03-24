// Uses ESPN's internal golf leaderboard JSON API via allorigins proxy
export async function fetchLeaderboard() {
  const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard';
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(espnUrl)}`;
  try {
    const res = await fetch(proxy);
    const data = await res.json();
    const json = JSON.parse(data.contents);
    const results = [];

    const events = json?.events || [];
    if (!events.length) return [];

    const competitions = events[0]?.competitions || [];
    if (!competitions.length) return [];

    const competitors = competitions[0]?.competitors || [];

    competitors.forEach(c => {
      const firstName = c.athlete?.displayName?.split(' ')[0] || '';
      const lastName  = c.athlete?.displayName?.split(' ').slice(1).join(' ') || '';
      const name = c.athlete?.displayName || '';
      const rawScore = c.score || 'E';
      let strokes = null;
      if (rawScore === 'E') strokes = 0;
      else if (rawScore) strokes = parseInt(rawScore.replace('+', ''), 10);
      const place = c.status?.position?.displayName || c.sortOrder?.toString() || '--';
      const thru  = c.status?.thru != null ? (c.status.thru === 0 ? 'F' : String(c.status.thru)) : '--';
      results.push({ name, strokes, place, thru });
    });

    // Sort by strokes ascending
    results.sort((a, b) => (a.strokes ?? 999) - (b.strokes ?? 999));
    return results;
  } catch (e) {
    console.error('ESPN API error:', e);
    return [];
  }
}