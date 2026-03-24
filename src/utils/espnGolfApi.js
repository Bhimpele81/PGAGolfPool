export async function fetchLeaderboard() {
  const url = 'https://www.espn.com/golf/leaderboard';
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(proxy);
    const data = await res.json();
    const html = data.contents;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('.competitors .competitor-container');
    const results = [];
    rows.forEach(row => {
      const name = row.querySelector('.athlete-name')?.textContent?.trim();
      const scoreEl = row.querySelector('.scores .score');
      const placeEl = row.querySelector('.position');
      const thruEl = row.querySelector('.thru');
      if (!name) return;
      const rawScore = scoreEl?.textContent?.trim();
      let strokes = null;
      if (rawScore === 'E') strokes = 0;
      else if (rawScore) strokes = parseInt(rawScore.replace('+',''), 10);
      results.push({
        name,
        strokes,
        place: placeEl?.textContent?.trim() || '--',
        thru: thruEl?.textContent?.trim() || '--',
      });
    });
    return results;
  } catch (e) {
    console.error('ESPN fetch error:', e);
    return [];
  }
}