export function computeScoring(billData, donData) {
  const best3 = (data) => {
    const valid = data.filter(g => g.strokes != null);
    const sorted = [...valid].sort((a, b) => a.strokes - b.strokes);
    return sorted.slice(0, 3);
  };

  const billBest = best3(billData);
  const donBest  = best3(donData);

  if (!billBest.length && !donBest.length) return null;

  const sum = (arr) => arr.reduce((acc, g) => acc + g.strokes, 0);
  const billTotal = billBest.length === 3 ? sum(billBest) : null;
  const donTotal  = donBest.length  === 3 ? sum(donBest)  : null;

  // Golfer Win ($20): only if a picked golfer is in sole 1st place
  const allGolfers = [
    ...billData.map(g => ({ ...g, player: 'Bill' })),
    ...donData.map(g  => ({ ...g, player: 'Don'  })),
  ];
  const inFirst = allGolfers.filter(g => g.place === '1' || g.place === 1);
  const golferWinPlayer = inFirst.length === 1 ? inFirst[0].player : null;
  const golferWinName   = inFirst.length === 1 ? inFirst[0].name   : '--';

  // Best Cumulative Score ($20): whose best-3 total is lower
  let bestCumWinner = null;
  let differential  = 0;
  if (billTotal != null && donTotal != null) {
    bestCumWinner = billTotal <= donTotal ? 'Bill' : 'Don';
    differential  = Math.abs(billTotal - donTotal);
  } else if (billTotal != null) {
    bestCumWinner = 'Bill';
  } else if (donTotal != null) {
    bestCumWinner = 'Don';
  }

  const differentialPayout = differential * 2;

  // Net Total Win: tally $20 golfer win + $20 cum win + differential payout
  const billWins = [
    golferWinPlayer === 'Bill' ? 20 : 0,
    bestCumWinner   === 'Bill' ? 20 : 0,
    bestCumWinner   === 'Bill' ?  differentialPayout : 0,
  ].reduce((a, b) => a + b, 0);

  const donWins = [
    golferWinPlayer === 'Don' ? 20 : 0,
    bestCumWinner   === 'Don' ? 20 : 0,
    bestCumWinner   === 'Don' ?  differentialPayout : 0,
  ].reduce((a, b) => a + b, 0);

  const netWinner = billWins > donWins ? 'Bill' : donWins > billWins ? 'Don' : 'Tie';
  const netAmount = Math.abs(billWins - donWins);

  return {
    golferWin: golferWinPlayer || '--',
    golferWinName,
    bestCumWinner: bestCumWinner || '--',
    differential,
    differentialPayout,
    billTotal,
    donTotal,
    billWins,
    donWins,
    netWinner,
    netAmount,
  };
}