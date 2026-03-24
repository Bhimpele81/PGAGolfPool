import React from 'react';

export default function Rules() {
  return (
    <div className="page">
      <h2>Pool Rules</h2>
      <div className="card">
        <div className="rules-section">
          <h3>How It Works</h3>
          <ul>
            <li>Each player (Bill and Don) drafts <strong>8 golfers</strong> per tournament.</li>
            <li>Your <strong>best 3 finishers</strong> count toward your cumulative score.</li>
            <li><strong>Strokes</strong> = score to par (e.g. -11, -8). Lower is better.</li>
            <li><strong>Place</strong> = leaderboard position. <strong>Thru</strong> = holes completed (live).</li>
          </ul>
        </div>
        <div className="rules-section">
          <h3>Payouts</h3>
          <table>
            <thead><tr><th>Category</th><th>Description</th><th>Payout</th></tr></thead>
            <tbody>
              <tr><td>🏆 Golfer Win</td><td>Whose drafted player finishes 1st overall</td><td><strong>$20</strong></td></tr>
              <tr><td>📊 Best Cum. Score</td><td>Whose best-3 combined strokes total is lower</td><td><strong>$20</strong></td></tr>
              <tr><td>💰 Differential</td><td>Stroke difference between the two best-3 totals</td><td><strong>$2 per stroke</strong></td></tr>
            </tbody>
          </table>
        </div>
        <div className="rules-section">
          <h3>Data Source</h3>
          <ul>
            <li>Live data is pulled from the ESPN Golf Leaderboard via a CORS proxy.</li>
            <li>Click <strong>⚡ Auto Update</strong> on the Dashboard to refresh scores.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}