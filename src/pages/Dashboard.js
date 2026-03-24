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

  const togglePick = (setter, picks, name, max) => {
    if (picks.includes(name)) {
      setter(picks.filter(n => n !== name));
    } else if (picks.length < max) {
      setter([...picks, name]);
    }
  };

  const enrich = (picks) =>
    picks.map(name => {
      const found = leaderboard.find(g => g.name === name);
      return { name, ...(found || { strokes: null, place: null, thru: null }) };
    });

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

  return (
    <div>
      {/* Header row */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
        <div className="page-title" style={{marginBottom:0}}>2026 Masters Tournament</div>
        <span className="status-bar">
          {loading ? '🔄 Fetching...' : lastUpdated ? `⏱ Updated: ${lastUpdated} • auto-refreshes every 60s` : ''}
        </span>
      </div>

      {/* Scoring Summary — only shown when locked */}
      {scoring && locked && (
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

      {/* Single unified table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {locked
              ? `Picks Locked — Bill (${billPicks.length}/8) • Don (${donPicks.length}/8)`
              : `Select Picks — Bill (${billPicks.length}/8) • Don (${donPicks.length}/8)`
            }
          </span>
          <span style={{marginLeft:'auto'}}>
            {!locked
              ? <button className="btn btn-green btn-sm" onClick={handleLock} disabled={billPicks.length === 0 && donPicks.length === 0}>🔒 Lock Picks</button>
              : <button className="btn btn-secondary btn-sm" onClick={handleUnlock}>🔓 Edit Picks</button>
            }
          </span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="card-body" style={{color:'var(--text-muted)'}}>
            {loading ? 'Loading leaderboard...' : 'No tournament in progress or ESPN data unavailable.'}
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Place</th>
                  <th>Golfer</th>
                  <th>Strokes</th>
                  <th>Thru</th>
                  <th style={{textAlign:'center',color:'#60a5fa'}}>Bill</th>
                  <th style={{textAlign:'center',color:'#f87171'}}>Don</th>
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
                    <tr key={i} style={highlight ? {background:'rgba(34,197,94,0.08)'} : {}}>
                      <td>{g.place}</td>
                      <td>
                        {g.name}
                        {isBillBest && <span style={{marginLeft:'6px',color:'#60a5fa',fontSize:'11px',fontWeight:700}}>Bill ⭐</span>}
                        {isDonBest  && <span style={{marginLeft:'6px',color:'#f87171',fontSize:'11px',fontWeight:700}}>Don ⭐</span>}
                      </td>
                      <td style={{fontWeight: highlight ? 700 : 400}}>{fmtScore(g.strokes)}</td>
                      <td>{g.thru}</td>
                      <td style={{textAlign:'center'}}>
                        {locked
                          ? (billHas ? <span style={{color:'#60a5fa',fontWeight:700,fontSize:'16px'}}>✓</span> : '')
                          : <input type="checkbox" checked={billHas}
                              onChange={() => togglePick(setBillPicks, billPicks, g.name, 8)}
                              style={{cursor:'pointer',width:'16px',height:'16px'}}
                            />
                        }
                      </td>
                      <td style={{textAlign:'center'}}>
                        {locked
                          ? (donHas ? <span style={{color:'#f87171',fontWeight:700,fontSize:'16px'}}>✓</span> : '')
                          : <input type="checkbox" checked={donHas}
                              onChange={() => togglePick(setDonPicks, donPicks, g.name, 8)}
                              style={{cursor:'pointer',width:'16px',height:'16px'}}
                            />
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