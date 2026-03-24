import React, { useState, useEffect } from 'react';
import { getEntries } from '../utils/storage';
import { computeScoring } from '../utils/scoring';
import { fetchLeaderboard } from '../utils/espnGolfApi';

export default function Dashboard() {
  const [billPicks, setBillPicks] = useState([]);
  const [donPicks, setDonPicks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const entries = getEntries();
    setBillPicks(entries.bill || []);
    setDonPicks(entries.don || []);
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    setLeaderboard(data);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  };

  const enrich = (picks) =>
    picks.map(name => {
      const found = leaderboard.find(g => g.name.toLowerCase().includes(name.toLowerCase()));
      return { name, ...(found || { strokes: null, place: null, thru: null }) };
    });

  const billData = enrich(billPicks);
  const donData = enrich(donPicks);
  const scoring = computeScoring(billData, donData);

  const best3Names = (data) => {
    const valid = [...data].filter(g => g.strokes != null).sort((a,b) => a.strokes - b.strokes);
    return valid.slice(0,3).map(g => g.name);
  };

  const PlayerTable = ({ player, data, headerClass }) => {
    const sorted = [...data].sort((a,b) => (a.strokes ?? 999) - (b.strokes ?? 999));
    const best3 = best3Names(data);
    return (
      <div className="card">
        <div className={`section-header ${headerClass}`}>
          <span className="section-header-title">{player}'s Team</span>
          {scoring && <span style={{marginLeft:'auto',fontSize:'12px',color:'var(--text-muted)'}}>Best 3 highlighted</span>}
        </div>
        <table className="data-table">
          <thead><tr><th>Golfer</th><th>Strokes</th><th>Place</th><th>Thru</th></tr></thead>
          <tbody>
            {sorted.map(g => (
              <tr key={g.name} className={best3.includes(g.name) ? 'highlight' : ''}>
                <td>{g.name}{best3.includes(g.name) ? ' ★' : ''}</td>
                <td>{g.strokes != null ? (g.strokes > 0 ? '+'+g.strokes : g.strokes === 0 ? 'E' : g.strokes) : '--'}</td>
                <td>{g.place ?? '--'}</td>
                <td>{g.thru ?? '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="page-title">🏌️ Dashboard</div>
      <div className="action-bar">
        <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
          {loading ? 'Updating...' : '⚡ Auto Update'}
        </button>
        {lastUpdated && <span className="status-bar">Last updated: {lastUpdated}</span>}
      </div>
      <div className="player-tables-grid">
        <PlayerTable player="Bill" data={billData} headerClass="bill-header" />
        <PlayerTable player="Don" data={donData} headerClass="don-header" />
      </div>
      {scoring && (
        <div className="card">
          <div className="card-header"><span className="card-title">Scoring Summary</span></div>
          <div className="card-body">
            <div className="scoring-summary">
              <div className="score-box"><div className="label">🏆 Golfer Win</div><div className="value">{scoring.golferWin}</div></div>
              <div className="score-box"><div className="label">📊 Best Cum. Score</div><div className="value">{scoring.bestCumWinner}</div></div>
              <div className="score-box"><div className="label">💰 Differential ({scoring.differential} strokes)</div><div className="value">${scoring.differentialPayout}</div></div>
            </div>
          </div>
        </div>
      )}
      {billPicks.length === 0 && donPicks.length === 0 && (
        <div className="alert alert-success">No picks yet — go to Draft Picks to enter golfers!</div>
      )}
    </div>
  );
}