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
      return { name, ...( found || { strokes: null, place: null, thru: null }) };
    });

  const billData = enrich(billPicks);
  const donData = enrich(donPicks);
  const scoring = computeScoring(billData, donData);

  const PlayerTable = ({ player, data }) => {
    const sorted = [...data].sort((a, b) => (a.strokes ?? 999) - (b.strokes ?? 999));
    const best3 = sorted.slice(0, 3).map(g => g.name);
    return (
      <div className="card">
        <h3 style={{marginBottom:'0.8rem',color:'#1a3c5e'}}>{player}'s Team</h3>
        <table>
          <thead><tr><th>Golfer</th><th>Strokes</th><th>Place</th><th>Thru</th></tr></thead>
          <tbody>
            {sorted.map(g => (
              <tr key={g.name} className={best3.includes(g.name) ? 'highlight' : ''}>
                <td>{g.name}</td>
                <td>{g.strokes != null ? (g.strokes > 0 ? '+'+g.strokes : g.strokes) : '--'}</td>
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
    <div className="page">
      <h2>Dashboard</h2>
      <div style={{display:'flex',gap:'1rem',marginBottom:'1rem',alignItems:'center'}}>
        <button className="btn" onClick={handleUpdate} disabled={loading}>
          {loading ? 'Updating...' : '⚡ Auto Update'}
        </button>
        {lastUpdated && <span className="status-bar">Last updated: {lastUpdated}</span>}
      </div>
      <div className="leaderboard-grid">
        <PlayerTable player="Bill" data={billData} />
        <PlayerTable player="Don" data={donData} />
      </div>
      {scoring && (
        <div className="card">
          <h3 style={{marginBottom:'1rem',color:'#1a3c5e'}}>Scoring Summary</h3>
          <div className="scoring-summary">
            <div className="score-box"><div className="label">🏆 Golfer Win</div><div className="value">{scoring.golferWin}</div></div>
            <div className="score-box"><div className="label">📊 Best Cumulative Score</div><div className="value">{scoring.bestCumWinner}</div></div>
            <div className="score-box"><div className="label">💰 Differential ({scoring.differential} strokes)</div><div className="value">${scoring.differentialPayout}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}