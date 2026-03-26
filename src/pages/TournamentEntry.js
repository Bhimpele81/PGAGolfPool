import React, { useState, useEffect, useCallback } from 'react';
import { fetchLeaderboard, isFrozen, unfreezeLeaderboard, freezeLeaderboard } from '../utils/espnGolfApi';

export default function TournamentEntry() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [frozen, setFrozen] = useState(isFrozen());

  const update = useCallback(async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    setLeaderboard(data);
    setLastUpdated(new Date().toLocaleTimeString());
    setFrozen(isFrozen());
    setLoading(false);
  }, []);

  useEffect(() => {
    update();
    if (frozen) return; // don't auto-refresh when frozen
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [update, frozen]);

  const handleFreeze = () => {
    freezeLeaderboard(leaderboard);
    setFrozen(true);
  };

  const handleUnfreeze = () => {
    unfreezeLeaderboard();
    setFrozen(false);
    update();
  };

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
        <div className="page-title" style={{marginBottom:0}}>📊 ESPN Leaderboard</div>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          {frozen ? (
            <>
              <span style={{background:'rgba(96,165,250,0.15)',border:'1px solid #60a5fa',color:'#60a5fa',borderRadius:'12px',padding:'3px 10px',fontSize:'12px',fontWeight:600}}>
                ❄️ Final Results
              </span>
              <button className="btn btn-secondary" style={{fontSize:'12px',padding:'4px 10px'}} onClick={handleUnfreeze}>
                🔓 Unfreeze
              </button>
            </>
          ) : (
            <button className="btn btn-secondary" style={{fontSize:'12px',padding:'4px 10px'}} onClick={handleFreeze} disabled={leaderboard.length === 0}>
              🧊 Freeze
            </button>
          )}
          <span className="status-bar">
            {loading ? '🔄 Updating...' : lastUpdated ? (frozen ? `⏱ Frozen at: ${lastUpdated}` : `⏱ Last updated: ${lastUpdated} • auto-refreshes every 60s`) : ''}
          </span>
        </div>
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