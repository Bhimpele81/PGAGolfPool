import React, { useState, useEffect, useCallback } from 'react';
import { getEntries, saveEntries } from '../utils/storage';
import { computeScoring } from '../utils/scoring';
import { fetchLeaderboard } from '../utils/espnGolfApi';

export default function Dashboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [billPicks, setBillPicks] = useState([]);
  const [donPicks, setDonPicks]   = useState([]);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const entries = getEntries();
    setBillPicks(entries.bill || []);
    setDonPicks(entries.don  || []);
    setLocked(entries.locked || false);
  }, []);

  const update = useCallback(async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    const sorted = [...data].sort((a, b) => (a.strokes ?? 999) - (b.strokes ?? 999));
    setLeaderboard(sorted);
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => {
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [update]);

  const handleLock = () => {
    saveEntries({ bill: billPicks, don: donPicks, locked: true });
    setLocked(true);
  };

  const handleUnlock = () => {
    saveEntries({ bill: billPicks, don: donPicks, locked: false });
    setLocked(false);
  };

  const togglePick = (setter, picks, name) => {
    if (picks.includes(name)) {
      setter(picks.filter(n => n !== name));
    } else if (picks.length < 8) {
      setter([...picks, name]);
    }
  };

  const enrich = (picks) =>
    picks.map(name => {
      const found = leaderboard.find(g => g.name === name);
      return { name, ...(found || { strokes: null, place: null, thru: null }) };
    }).sort((a, b) => (a.strokes ?? 999) - (b.strokes ?? 999));

  const billData = enrich(billPicks);
  const donData  = enrich(donPicks);
  const scoring  = computeScoring(billData, donData);

  const best3Names = (data) =>
    [...data].filter(g => g.strokes != null)
      .sort((a, b) => a.strokes - b.strokes)
      .slice(0, 3).map(g => g.name);

  const billBest3 = best3Names(billData);
  const donBest3  = best3Names(donData);
  const fmtScore  = (s) => s == null ? '--' : s > 0 ? '+' + s : s === 0 ? 'E' : String(s);

  // Pad whichever team has fewer picks so both cards have equal rows
  const maxLen = Math.max(billData.length, donData.length, 1);
  const pad = (arr) => {
    const blanks = Array(Math.max(0, maxLen - arr.length)).fill(null);
    return [...arr, ...blanks];
  };
  const billPadded = pad(billData);
  const donPadded  = pad(donData);

  const TeamPanel = ({ player, rows, best3, picks, accentColor, headerBg }) => {
    const totalStrokes = rows.filter(g => g && best3.includes(g.name) && g.strokes != null)
      .reduce((sum, g) => sum + g.strokes, 0);
    const hasScores = rows.some(g => g && g.strokes != null);
    return (
      <div className="card" style={{flex:1,minWidth:'280px',display:'flex',flexDirection:'column',marginBottom:0}}>
        <div className="card-header" style={{background: headerBg, borderRadius:'8px 8px 0 0'}}>
          <span className="card-title" style={{color:'#fff',fontSize:'16px',fontWeight:700}}>{player}</span>
          <span style={{marginLeft:'auto',color:'rgba(255,255,255,0.8)',fontSize:'13px'}}>{picks.length}/8 picks</span>
        </div>
        <table className="data-table" style={{flex:1}}>
          <thead>
            <tr><th style={{textAlign:'left'}}>Golfer</th><th>Strokes</th><th>Place</th><th>Thru</th></tr>
          </thead>
          <tbody>
            {rows.map((g, i) =>
              g ? (
                <tr key={i} style={best3.includes(g.name) ? {background:'rgba(34,197,94,0.10)',fontWeight:600} : {}}>
                  <td style={{textAlign:'left'}}>{best3.includes(g.name) ? '⭐ ' : ''}{g.name}</td>
                  <td style={{color: g.strokes < 0 ? '#4ade80' : g.strokes > 0 ? '#f87171' : 'inherit'}}>{fmtScore(g.strokes)}</td>
                  <td>{g.place ?? '--'}</td>
                  <td>{g.thru ?? '--'}</td>
                </tr>
              ) : (
                <tr key={i}><td style={{textAlign:'left',color:'var(--text-dim)'}}>--</td><td></td><td></td><td></td></tr>
              )
            )}
          </tbody>
        </table>
        {hasScores && (
          <div style={{padding:'8px 16px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',fontSize:'13px'}}>
            <span style={{color:'var(--text-muted)'}}>Best 3 Score:</span>
            <span style={{fontWeight:700,color:accentColor}}>{fmtScore(totalStrokes)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Page header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
        <div className="page-title" style={{marginBottom:0}}>2026 Masters Tournament</div>
        <span className="status-bar">
          {loading ? '🔄 Fetching...' : lastUpdated ? `⏱ ${lastUpdated} • auto-refreshes every 60s` : ''}
        </span>
      </div>

      {/* Running Totals — always visible once picks exist */}
      {scoring && (
        <div className="card" style={{marginBottom:'16px'}}>
          <div className="card-header">
            <span className="card-title">🏆 Running Totals</span>
            <span style={{marginLeft:'auto',fontSize:'12px',color:'var(--text-muted)'}}>{locked ? '🔒 Picks Locked' : '🟡 Picks Unlocked'}</span>
          </div>
          <div className="card-body">
            <div className="scoring-summary">
              <div className="score-box"><div className="label" style={{color:'#60a5fa'}}>Bill Best 3</div><div className="value">{fmtScore(scoring.billTotal)}</div></div>
              <div className="score-box"><div className="label" style={{color:'#f87171'}}>Don Best 3</div><div className="value">{fmtScore(scoring.donTotal)}</div></div>
              <div className="score-box"><div className="label">🏆 Lowest Golfer</div><div className="value">{scoring.golferWin}</div></div>
              <div className="score-box"><div className="label">📊 Best Cum. Score</div><div className="value">{scoring.bestCumWinner}</div></div>
              <div className="score-box"><div className="label">💰 Differential</div><div className="value" style={{fontSize:'16px'}}>{scoring.differential} strokes (${scoring.differentialPayout})</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Bill and Don panels — equal rows */}
      <div className="team-panels">
        <TeamPanel player="Bill" rows={billPadded} best3={billBest3} picks={billPicks} accentColor="#60a5fa" headerBg="#1e3a5f" />
        <TeamPanel player="Don"  rows={donPadded}  best3={donBest3}  picks={donPicks}  accentColor="#f87171" headerBg="#5f1e1e" />
      </div>

      {/* Lock/Unlock — always visible */}
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'16px'}}>
        {!locked
          ? <button className="btn btn-green" onClick={handleLock} disabled={billPicks.length===0 && donPicks.length===0}>🔒 Lock Picks</button>
          : <button className="btn btn-secondary" onClick={handleUnlock}>🔓 Edit Picks</button>
        }
      </div>

      {/* ESPN Leaderboard — always visible */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">ESPN Leaderboard{!locked ? ' — Select Picks' : ''}</span>
          <span style={{marginLeft:'auto',fontSize:'12px',color:'var(--text-muted)'}}>Bill ({billPicks.length}/8) • Don ({donPicks.length}/8)</span>
        </div>
        {leaderboard.length === 0 ? (
          <div className="card-body" style={{color:'var(--text-muted)'}}>
            {loading ? 'Loading leaderboard...' : 'No tournament data available.'}
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{textAlign:'left'}}>Place</th>
                  <th style={{textAlign:'left'}}>Golfer</th>
                  <th>Strokes</th>
                  <th>Thru</th>
                  <th>Bill</th>
                  <th>Don</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((g, i) => {
                  const billHas    = billPicks.includes(g.name);
                  const donHas     = donPicks.includes(g.name);
                  const isBillBest = locked && billBest3.includes(g.name);
                  const isDonBest  = locked && donBest3.includes(g.name);
                  const highlight  = isBillBest || isDonBest;
                  return (
                    <tr key={i} style={highlight ? {background:'rgba(34,197,94,0.07)'} : billHas||donHas ? {background:'rgba(255,255,255,0.03)'} : {}}>
                      <td style={{textAlign:'left'}}>{g.place}</td>
                      <td style={{textAlign:'left',fontWeight: billHas||donHas ? 600 : 400}}>
                        {g.name}
                        {isBillBest && <span style={{marginLeft:'6px',color:'#60a5fa',fontSize:'11px',fontWeight:700}}>Bill⭐</span>}
                        {isDonBest  && <span style={{marginLeft:'6px',color:'#f87171',fontSize:'11px',fontWeight:700}}>Don⭐</span>}
                      </td>
                      <td>{fmtScore(g.strokes)}</td>
                      <td>{g.thru}</td>
                      <td>
                        {locked
                          ? (billHas ? <span style={{color:'#60a5fa',fontWeight:700,fontSize:'16px'}}>✓</span> : '')
                          : <input type="checkbox" checked={billHas} onChange={() => togglePick(setBillPicks, billPicks, g.name)} style={{cursor:'pointer',width:'16px',height:'16px'}} />
                        }
                      </td>
                      <td>
                        {locked
                          ? (donHas ? <span style={{color:'#f87171',fontWeight:700,fontSize:'16px'}}>✓</span> : '')
                          : <input type="checkbox" checked={donHas} onChange={() => togglePick(setDonPicks, donPicks, g.name)} style={{cursor:'pointer',width:'16px',height:'16px'}} />
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}