import React, { useState, useEffect, useCallback } from 'react';
import { getEntries, saveEntries } from '../utils/storage';
import { computeScoring } from '../utils/scoring';
import { fetchLeaderboard } from '../utils/espnGolfApi';

export default function Dashboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [billPicks, setBillPicks] = useState([]);
  const [donPicks, setDonPicks] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const entries = getEntries();
    setBillPicks(entries.bill || []);
    setDonPicks(entries.don || []);
  }, []);

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

  const handleSavePicks = () => {
    saveEntries({ bill: billPicks, don: donPicks });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const togglePick = (player, name) => {
    if (player === 'bill') {
      setBillPicks(prev =>
        prev.includes(name) ? prev.filter(n => n !== name) : prev.length < 8 ? [...prev, name] : prev
      );
    } else {
      setDonPicks(prev =>
        prev.includes(name) ? prev.filter(n => n !== name) : prev.length < 8 ? [...prev, name] : prev
      );
    }
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
    const valid = [...data].filter(g => g.strokes != null).sort((a, b) => a.strokes - b.strokes);
    return valid.slice(0, 3).map(g => g.name);
  };

  const fmtScore = (s) => s == null ? '--' : s > 0 ? '+' + s : s === 0 ? 'E' : String(s);

  const PlayerTeam = ({ player, picks, headerClass }) => {
    const data = enrich(picks);
    const sorted = [...data].sort((a, b) => (a.strokes ?? 999) - (b.strokes ?? 999));
    const best3 = best3Names(data);
    return (
      <div className="card">
        <div className={`section-header ${headerClass}`}>
          <span className="section-header-title">{player}'s Team ({picks.length}/8)</span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>★ = counts</span>
        </div>
        <table className="data-table">
          <thead><tr><th>Golfer</th><th>Strokes</th><th>Place</th><th>Thru</th></tr></thead>
          <tbody>
            {sorted.length === 0
              ? <tr><td colSpan={4} style={{ color: 'var(--text-muted)', padding: '12px' }}>No golfers selected yet</td></tr>
              : sorted.map(g => (
                <tr key={g.name} className={best3.includes(g.name) ? 'highlight' : ''}>
                  <td>{best3.includes(g.name) ? '★ ' : ''}{g.name}</td>
                  <td>{fmtScore(g.strokes)}</td>
                  <td>{g.place ?? '--'}</td>
                  <td>{g.thru ?? '--'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div className="page-title" style={{ marginBottom: 0 }}>🏌️ Dashboard</div>
        <span className="status-bar">
          {loading ? '🔄 Fetching scores...' : lastUpdated ? `⏱ Updated: ${lastUpdated} • refreshes every 60s` : ''}
        </span>
      </div>

      {/* Team scorecards */}
      <div className="player-tables-grid">
        <PlayerTeam player="Bill" picks={billPicks} headerClass="bill-header" />
        <PlayerTeam player="Don" picks={donPicks} headerClass="don-header" />
      </div>

      {/* Scoring summary */}
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

      {/* ESPN Leaderboard with pick toggles */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">ESPN Leaderboard — Click to assign golfers</span>
          {(billPicks.length > 0 || donPicks.length > 0) && (
            <button className="btn btn-green btn-sm" onClick={handleSavePicks}>
              {saved ? '✅ Saved!' : 'Save Picks'}
            </button>
          )}
        </div>
        {leaderboard.length === 0 ? (
          <div className="card-body" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Loading leaderboard...' : 'No tournament data available.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Place</th>
                <th>Golfer</th>
                <th>Strokes</th>
                <th>Thru</th>
                <th style={{ textAlign: 'center', color: '#60a5fa' }}>Bill</th>
                <th style={{ textAlign: 'center', color: '#f87171' }}>Don</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((g, i) => (
                <tr key={i}>
                  <td>{g.place}</td>
                  <td>{g.name}</td>
                  <td>{fmtScore(g.strokes)}</td>
                  <td>{g.thru}</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={billPicks.includes(g.name)}
                      onChange={() => togglePick('bill', g.name)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={donPicks.includes(g.name)}
                      onChange={() => togglePick('don', g.name)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}