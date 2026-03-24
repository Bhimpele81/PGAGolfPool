import React, { useState, useEffect, useCallback } from 'react';
import { getEntries, saveEntries } from '../utils/storage';
import { computeScoring } from '../utils/scoring';
import { fetchLeaderboard } from '../utils/espnGolfApi';

export default function Dashboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [billPicks, setBillPicks] = useState(Array(8).fill(''));
  const [donPicks, setDonPicks]   = useState(Array(8).fill(''));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const entries = getEntries();
    if (entries.bill?.length) setBillPicks([...entries.bill, ...Array(8).fill('')].slice(0,8));
    if (entries.don?.length)  setDonPicks([...entries.don,  ...Array(8).fill('')].slice(0,8));
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

  const handleSave = () => {
    saveEntries({ bill: billPicks.filter(Boolean), don: donPicks.filter(Boolean) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const enrich = (picks) =>
    picks.filter(Boolean).map(name => {
      const found = leaderboard.find(g => g.name === name);
      return { name, ...(found || { strokes: null, place: null, thru: null }) };
    });

  const billData = enrich(billPicks);
  const donData  = enrich(donPicks);
  const scoring  = computeScoring(billData, donData);

  const best3Names = (data) =>
    [...data].filter(g => g.strokes != null)
      .sort((a,b) => a.strokes - b.strokes)
      .slice(0,3).map(g => g.name);

  const fmtScore = (s) => s == null ? '--' : s > 0 ? '+'+s : s === 0 ? 'E' : String(s);

  // Golfers already picked by each player (excluding blanks)
  const billChosen = billPicks.filter(Boolean);
  const donChosen  = donPicks.filter(Boolean);

  const PickDropdown = ({ picks, setPicks, otherPicks, headerClass, player }) => (
    <div className="card">
      <div className={`section-header ${headerClass}`}>
        <span className="section-header-title">{player}'s Picks ({picks.filter(Boolean).length}/8)</span>
      </div>
      <div className="card-body">
        {picks.map((val, i) => (
          <div className="golfer-row" key={i}>
            <span>{i+1}.</span>
            <select
              className="form-select"
              value={val}
              onChange={e => {
                const copy = [...picks];
                copy[i] = e.target.value;
                setPicks(copy);
              }}
            >
              <option value="">-- Select Golfer --</option>
              {leaderboard.map(g => {
                const takenByMe    = picks.includes(g.name) && picks[i] !== g.name;
                const takenByOther = otherPicks.includes(g.name);
                if (takenByMe) return null;
                return (
                  <option key={g.name} value={g.name} disabled={takenByOther}>
                    {g.name} ({fmtScore(g.strokes)}) {takenByOther ? '✗' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        ))}
      </div>
    </div>
  );

  const PlayerScorecard = ({ player, data, headerClass }) => {
    const sorted = [...data].sort((a,b) => (a.strokes ?? 999) - (b.strokes ?? 999));
    const best3  = best3Names(data);
    return (
      <div className="card">
        <div className={`section-header ${headerClass}`}>
          <span className="section-header-title">{player}'s Scorecard</span>
          <span style={{marginLeft:'auto',fontSize:'12px',color:'var(--text-muted)'}}>⭐ = counts</span>
        </div>
        <table className="data-table">
          <thead><tr><th>Golfer</th><th>Strokes</th><th>Place</th><th>Thru</th></tr></thead>
          <tbody>
            {sorted.length === 0
              ? <tr><td colSpan={4} style={{color:'var(--text-muted)',padding:'12px'}}>No picks saved yet</td></tr>
              : sorted.map(g => (
                <tr key={g.name} className={best3.includes(g.name) ? 'highlight' : ''}>
                  <td>{best3.includes(g.name) ? '⭐ ' : ''}{g.name}</td>
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
      {/* Header row */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
        <div className="page-title" style={{marginBottom:0}}>⛳ Dashboard</div>
        <span className="status-bar">
          {loading ? '🔄 Fetching scores...' : lastUpdated ? `⏱ Updated: ${lastUpdated} • auto-refreshes every 60s` : ''}
        </span>
      </div>

      {/* Draft pickers */}
      <div className="draft-grid">
        <PickDropdown player="Bill" picks={billPicks} setPicks={setBillPicks} otherPicks={donChosen}  headerClass="bill-header" />
        <PickDropdown player="Don"  picks={donPicks}  setPicks={setDonPicks}  otherPicks={billChosen} headerClass="don-header" />
      </div>
      <div className="action-bar" style={{marginBottom:'24px'}}>
        <button className="btn btn-primary" onClick={handleSave}>{saved ? '✅ Saved!' : 'Save Picks'}</button>
      </div>

      {/* Scorecards */}
      <div className="player-tables-grid">
        <PlayerScorecard player="Bill" data={billData} headerClass="bill-header" />
        <PlayerScorecard player="Don"  data={donData}  headerClass="don-header" />
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

      {leaderboard.length === 0 && !loading && (
        <div className="card"><div className="card-body" style={{color:'var(--text-muted)'}}>No tournament in progress or ESPN data unavailable.</div></div>
      )}
    </div>
  );
}