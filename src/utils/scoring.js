export function computeScoring(billData, donData) {
  const best3 = (data) => {
    const valid = data.filter(g => g.strokes != null);
    const sorted = [...valid].sort((a, b) => a.strokes - b.strokes);
    return sorted.slice(0, 3);
  };

  const billBest = best3(billData);
  const donBest = best3(donData);

  if (!billBest.length && !donBest.length) return null;

  const sum = (arr) => arr.reduce((acc, g) => acc + g.strokes, 0);
  const billTotal = billBest.length === 3 ? sum(billBest) : null;
  const donTotal = donBest.length === 3 ? sum(donBest) : null;

  // Golfer Win: who has the golfer with the lowest individual score
  const allGolfers = [...billData.map(g => ({...g, player:'Bill'})), ...donData.map(g => ({...g, player:'Don'}))];
  const validGolfers = allGolfers.filter(g => g.strokes != null);
  validGolfers.sort((a, b) => a.strokes - b.strokes);
  const golferWin = validGolfers.length ? validGolfers[0].player : '--';

  // Best Cumulative Score
  let bestCumWinner = '--';
  let differential = 0;
  if (billTotal != null && donTotal != null) {
    bestCumWinner = billTotal <= donTotal ? 'Bill' : 'Don';
    differential = Math.abs(billTotal - donTotal);
  } else if (billTotal != null) {
    bestCumWinner = 'Bill';
  } else if (donTotal != null) {
    bestCumWinner = 'Don';
  }

  return {
    golferWin,
    bestCumWinner,
    differential,
    differentialPayout: differential * 2,
    billTotal,
    donTotal,
  };
}