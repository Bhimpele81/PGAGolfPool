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
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const entries = getEntries();
    if (entries.bill?.length) {
      setBillPicks([...entries.bill, ...Array(8).fill('')].slice(0,8));
      setDonPicks([...entries.don,  ...Array(8).fill('')].slice(0,8));
      setLocked(entries.locked || false);
    }
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

  const handleLock = () => {
    saveEntries({ bill: billPicks.filter(Boolean), don: donPicks.filter(Boolean), locked: true });
    setLocked(true);
  };

  const handleUnlock = () => {
    saveEntries({ bill: billPicks.filter(Boolean), don: donPicks.filter(Boolean), locked: false });
    setLocked(false);
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

  const billBest3 = best3Names(billData);
  const donBest3  = best3Names(donData);

  // All picked names to grey out in dropdowns
  const billChosen = billPicks.filter(Boolean);
  const donChosen  = donPicks.filter(Boolean);

  return (
    <div>
      {/* Status */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
        <div className="page-title" style={{marginBottom:0}}>⛳ PGA Golf Pool</div>
        <span className="status-bar">
          {loading ? '🔄 Fetching scores...' : lastUpdated ? `⏱ Updated: ${lastUpdated} • auto-refreshes every 60s` : ''}
        </span>
      </div>

      {/* Scoring Summary */}
      {scoring && locked && (
        <div className="card" style={{marginBottom:'16px'}}>
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

      {/* Main leaderboard table with pick columns */}
      <div className="card">
        <div className="card-header" style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span className="card-title">ESPN Leaderboard</span>
          <span style={{marginLeft:'auto',display:'flex',gap:'8px',alignItems:'center'}}>
            {!locked
              ? <button className="btn btn-green btn-sm" onClick={handleLock} disabled={!billChosen.length && !donChosen.length}>🔒 Lock Picks</button>
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
                  const billHas = billChosen.includes(g.name);
                  const donHas  = donChosen.includes(g.name);
                  const isBillBest = billBest3.includes(g.name);
                  const isDonBest  = donBest3.includes(g.name);
                  const rowHighlight = locked && (isBillBest || isDonBest) ? {background:'rgba(34,197,94,0.07)'} : {};
                  return (
                    <tr key={i} style={rowHighlight}>
                      <td>{g.place}</td>
                      <td>
                        {g.name}
                        {locked && isBillBest && <span style={{marginLeft:'6px',color:'#60a5fa',fontSize:'11px'}}>Bill⭐</span>}
                        {locked && isDonBest  && <span style={{marginLeft:'6px',color:'#f87171',fontSize:'11px'}}>Don⭐</span>}
                      </td>
                      <td>{fmtScore(g.strokes)}</td>
                      <td>{g.thru}</td>
                      <td style={{textAlign:'center'}}>
                        {locked
                          ? (billHas ? <span style={{color:'#60a5fa',fontWeight:700}}>✓</span> : '')
                          : <input type="checkbox" checked={billHas}
                              onChange={() => {
                                if (billHas) {
                                  setBillPicks(prev => { const c=[...prev]; c[c.indexOf(g.name)]=''; return c; });
                                } else if (billChosen.length < 8) {
                                  setBillPicks(prev => { const c=[...prev]; const idx=c.indexOf(''); if(idx>-1) c[idx]=g.name; return c; });
                                }
                              }}
                              style={{cursor:'pointer',width:'16px',height:'16px'}}
                            />
                        }
                      </td>
                      <td style={{textAlign:'center'}}>
                        {locked
                          ? (donHas ? <span style={{color:'#f87171',fontWeight:700}}>✓</span> : '')
                          : <input type="checkbox" checked={donHas}
                              onChange={() => {
                                if (donHas) {
                                  setDonPicks(prev => { const c=[...prev]; c[c.indexOf(g.name)]=''; return c; });
                                } else if (donChosen.length < 8) {
                                  setDonPicks(prev => { const c=[...prev]; const idx=c.indexOf(''); if(idx>-1) c[idx]=g.name; return c; });
                                }
                              }}
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