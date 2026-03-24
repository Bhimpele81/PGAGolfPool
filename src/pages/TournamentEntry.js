import React, { useState } from 'react';
import { fetchLeaderboard } from '../utils/espnGolfApi';

export default function TournamentEntry() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const handleFetch = async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    setLeaderboard(data);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  };

  return (
    <div className="page">
      <h2>ESPN Leaderboard</h2>
      <div style={{display:'flex',gap:'1rem',alignItems:'center',marginBottom:'1rem'}}>
        <button className="btn" onClick={handleFetch} disabled={loading}>
          {loading ? 'Loading...' : '⚡ Fetch Live Leaderboard'}
        </button>
        {lastUpdated && <span className="status-bar">Last updated: {lastUpdated}</span>}
      </div>
      {leaderboard.length > 0 && (
        <div className="card">
          <table>
            <thead><tr><th>Place</th><th>Golfer</th><th>Strokes (To Par)</th><th>Thru</th></tr></thead>
            <tbody>
              {leaderboard.map((g, i) => (
                <tr key={i}>
                  <td>{g.place}</td>
                  <td>{g.name}</td>
                  <td>{g.strokes != null ? (g.strokes > 0 ? '+'+g.strokes : g.strokes) : '--'}</td>
                  <td>{g.thru}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}