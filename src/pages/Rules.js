import React from 'react';

export default function Rules() {
  return (
    <div>
      <div className="page-title">📖 Pool Rules</div>
      <div className="card">
        <div className="card-body">
          <div className="rules-section">
            <h3>How It Works</h3>
            <ul>
              <li>Each player (Bill and Don) selects <strong>8 golfers</strong> from the live ESPN leaderboard.</li>
              <li>Your <strong>best 3 finishers</strong> count toward your cumulative score.</li>
              <li><strong>Strokes</strong> = score to par (e.g. -11, -8, E). Lower is better.</li>
              <li><strong>Place</strong> = leaderboard position. <strong>Thru</strong> = holes completed (live).</li>
              <li>Click <strong>🔒 Lock Picks</strong> once both players have selected their 8 golfers.</li>
              <li>Scores <strong>update automatically every 60 seconds</strong> — no refresh needed.</li>
              <li>Use <strong>🔓 Edit Picks</strong> if you need to make changes before the tournament starts.</li>
            </ul>
          </div>
          <div className="rules-section">
            <h3>Payouts</h3>
            <table className="data-table">
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
              <li>Live scores are pulled automatically from the ESPN Golf Leaderboard JSON API.</li>
              <li>Best 3 golfers per player are highlighted with a ⭐ on the leaderboard.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}