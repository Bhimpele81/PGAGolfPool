// Golf Pool scoring:
// - Golfer Win: $20 to whoever has the tournament winner
// - Best Cum Score: $20 to whoever has the lower combined score of best 3 golfers
// - Differential: $2 per stroke difference between the two best-3 totals

export function calcGolfTotals(billGolfers, donGolfers) {
  // Filter golfers with strokes filled in, sort by strokes (ascending = better in golf)
  const billWithScores = billGolfers.filter(g => g.strokes !== '' && g.strokes !== null && !isNaN(parseFloat(g.strokes)));
  const donWithScores  = donGolfers.filter(g => g.strokes !== '' && g.strokes !== null && !isNaN(parseFloat(g.strokes)));

  const billSorted = [...billWithScores].sort((a, b) => parseFloat(a.strokes) - parseFloat(b.strokes));
  const donSorted  = [...donWithScores].sort((a, b) => parseFloat(a.strokes) - parseFloat(b.strokes));

  const billBest3 = billSorted.slice(0, 3);
  const donBest3  = donSorted.slice(0, 3);

  const billCum = billBest3.reduce((sum, g) => sum + parseFloat(g.strokes), 0);
  const donCum  = donBest3.reduce((sum, g) => sum + parseFloat(g.strokes), 0);

  const billHasWinner = billGolfers.some(g => parseInt(g.place, 10) === 1);
  const donHasWinner  = donGolfers.some(g => parseInt(g.place, 10) === 1);

  // Golfer Win: +$20 if Bill has winner, -$20 if Don has winner
  const golferWin = billHasWinner ? 20 : donHasWinner ? -20 : 0;

  // Best Cum Score: lower is better (golf scoring)
  const bestCum = (billBest3.length === 3 && donBest3.length === 3)
    ? (billCum < donCum ? 20 : donCum < billCum ? -20 : 0)
    : 0;

  // Differential: $2 per stroke
  const strokeDiff = (billBest3.length === 3 && donBest3.length === 3)
    ? Math.abs(billCum - donCum)
    : 0;
  const strokeMoney = strokeDiff * 2;
  const strokeAdj = (billBest3.length === 3 && donBest3.length === 3)
    ? (billCum < donCum ? strokeMoney : donCum < billCum ? -strokeMoney : 0)
    : 0;

  const billNet = golferWin + bestCum + strokeAdj;

  return {
    billBest3, donBest3,
    billCum, donCum,
    billHasWinner, donHasWinner,
    golferWin, bestCum,
    strokeDiff, strokeMoney, strokeAdj,
    billNet
  };
}
