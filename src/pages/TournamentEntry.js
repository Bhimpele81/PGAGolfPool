import React, { useState, useEffect, useCallback } from 'react';
import { fetchLeaderboard } from '../utils/espnGolfApi';

export default function TournamentEntry() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const update = useCallback(async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    setLeaderboard(data);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => {
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [update]);

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
        <div className="page-title" style={{marginBottom:0}}>📊 ESPN Leaderboard</div>
        <span className="status-bar">
          {loading ? '🔄 Updating...' : lastUpdated ? `⏱ Last updated: ${lastUpdated} • auto-refreshes every 60s` : ''}
        </span>
      </div>
      {leaderboard.length > 0 ? (
        <div className="card">
          <div className="card-header"><span className="card-title">Live Standings</span></div>
          <table className="data-table">
            <thead><tr><th>Place</th><th>Golfer</th><th>Strokes</th><th>Thru</th></tr></thead>
            <tbody>
              {leaderboard.map((g, i) => (
                <tr key={i}>
                  <td>{g.place}</td>
                  <td>{g.name}</td>
                  <td>{g.strokes != null ? (g.strokes > 0 ? '+'+g.strokes : g.strokes === 0 ? 'E' : g.strokes) : '--'}</td>
                  <td>{g.thru}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <div className="card"><div className="card-body" style={{color:'var(--text-muted)'}}>No tournament in progress or data unavailable.</div></div>
      )}
    </div>
  );
}