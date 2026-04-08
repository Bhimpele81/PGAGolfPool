import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { computeScoring } from '../utils/scoring';
import { fetchLeaderboard, isFrozen, unfreezeLeaderboard, freezeLeaderboard, getCache, getFrozenData } from '../utils/espnGolfApi';

const TOURNAMENT  = '2026-masters';
const PICKS_CACHE = 'golf_picks_cache';

function getCachedPicks() {
  try { return JSON.parse(localStorage.getItem(PICKS_CACHE) || '{"bill":[],"don":[]}'); }
  catch { return { bill: [], don: [] }; }
}
function setCachedPicks(bill, don) {
  try { localStorage.setItem(PICKS_CACHE, JSON.stringify({ bill, don })); }
  catch {}
}

export default function Dashboard() {
  const cached = getCachedPicks();
  const [leaderboard, setLeaderboard] = useState(() => getFrozenData() || getCache() || []);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [billPicks,   setBillPicks]   = useState(cached.bill   || []);
  const [donPicks,    setDonPicks]    = useState(cached.don    || []);
  const [saving,      setSaving]      = useState(false);
  const [frozen,      setFrozen]      = useState(isFrozen());
  const [draftMode,   setDraftMode]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load picks from Supabase and update cache
  const loadPicks = useCallback(async () => {
    const { data, error } = await supabase
      .from('picks')
      .select('player, golfers')
      .eq('tournament', TOURNAMENT);
    if (error) { console.error(error); return; }
    let bill = [], don = [];
    data.forEach(row => {
      if (row.player === 'Bill') bill = row.golfers || [];
      if (row.player === 'Don')  don  = row.golfers || [];
    });
    setBillPicks(bill);
    setDonPicks(don);
    setCachedPicks(bill, don);
  }, []);

  useEffect(() => { loadPicks(); }, [loadPicks]);

  const savePicks = useCallback(async (player, golfers) => {
    setSaving(true);
    await supabase.from('picks').upsert(
      { tournament: TOURNAMENT, player, golfers, locked: false },
      { onConflict: 'tournament,player' }
    );
    setSaving(false);
  }, []);

  const update = useCallback(async () => {
    setLoading(true);
    const data = await fetchLeaderboard();
    const sorted = [...data].sort((a, b) => (a.strokes ?? 999) - (b.strokes ?? 999));
    setLeaderboard(sorted);
    setLastUpdated(new Date().toLocaleTimeString());
    setFrozen(isFrozen());
    setLoading(false);
    setIsFirstLoad(false);
  }, []);

  useEffect(() => {
    update();
    if (isFrozen()) return; // don't auto-refresh when frozen
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [update]);

  const togglePick = async (player, picks, setter, name) => {
    if (!draftMode) return;
    let updated;
    if (picks.includes(name)) updated = picks.filter(n => n !== name);
    else if (picks.length < 8) updated = [...picks, name];
    else return;
    setter(updated);
    const newBill = player === 'Bill' ? updated : billPicks;
    const newDon  = player === 'Don'  ? updated : donPicks;
    setCachedPicks(newBill, newDon);
    await savePicks(player, updated);
  };

  const enrich = (picks) =>
    picks.map(name => {
      const found = leaderboard.find(g => g.name === name);
      return { name, ...(found || { strokes: null, place: null, thru: null }) };
    }).sort((a, b) => (a.strokes ?? 999) - (b.strokes ?? 999));

  const billData   = enrich(billPicks);
  const donData    = enrich(donPicks);
  const scoring    = computeScoring(billData, donData);
  const best3Names = (data) =>
    [...data].filter(g => g.strokes != null)
      .sort((a, b) => a.strokes - b.strokes)
      .slice(0, 3).map(g => g.name);
  const billBest3  = best3Names(billData);
  const donBest3   = best3Names(donData);
  const fmtScore   = (s) => s == null ? '--' : s > 0 ? `+${s}` : s === 0 ? 'E' : String(s);
  const fmtMoney   = (n) => `$${n}`;

  const maxLen     = Math.max(billData.length, donData.length, 1);
  const pad        = (arr) => [...arr, ...Array(Math.max(0, maxLen - arr.length)).fill(null)];
  const billPadded = pad(billData);
  const donPadded  = pad(donData);

  const TeamPanel = ({ player, rows, best3, picks, setter, accentColor, headerBg }) => {
    const best3Total = rows
      .filter(g => g && best3.includes(g.name) && g.strokes != null)
      .reduce((sum, g) => sum + g.strokes, 0);
    const hasScores = rows.some(g => g && g.strokes != null);
    return (
      <div className="card" style={{flex:1,minWidth:'280px',display:'flex',flexDirection:'column',marginBottom:0}}>
        <div style={{background:headerBg,padding:'6px 14px',borderRadius:'8px 8px 0 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{color:'#fff',fontSize:'15px',fontWeight:700}}>{player}</span>
          <span style={{color:'rgba(255,255,255,0.75)',fontSize:'12px'}}>{picks.length}/8 picks</span>
        </div>
        <table className="data-table" style={{flex:1}}>
          <thead>
            <tr>
              <th style={{textAlign:'left'}}>Golfer</th>
              <th>Strokes</th><th>Place</th><th>Thru</th>
              {draftMode && <th style={{width:'40px'}}></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((g, i) =>
              g ? (
                <tr key={i} style={best3.includes(g.name)?{background:'rgba(34,197,94,0.10)',fontWeight:600}:{}}>
                  <td style={{textAlign:'left',padding:'6px 12px'}}>{best3.includes(g.name)?'⭐ ':''}{g.name}</td>
                  <td style={{padding:'6px 12px',color:g.strokes<0?'#4ade80':g.strokes>0?'#f87171':'inherit'}}>{fmtScore(g.strokes)}</td>
                  <td style={{padding:'6px 12px'}}>{g.place??'--'}</td>
                  <td style={{padding:'6px 12px'}}>{g.thru??'--'}</td>
                  {draftMode && (
                    <td style={{padding:'6px 4px'}}>
                      <button
                        onClick={() => togglePick(player, picks, setter, g.name)}
                        style={{background:'rgba(248,113,113,0.15)',color:'#f87171',border:'1px solid rgba(248,113,113,0.3)',borderRadius:'4px',width:'24px',height:'24px',cursor:'pointer',fontSize:'12px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',padding:0}}
                      >✕</button>
                    </td>
                  )}
                </tr>
              ) : (
                <tr key={i}><td colSpan={draftMode?5:4} style={{padding:'6px 12px',color:'var(--text-dim)',textAlign:'center'}}>--</td></tr>
              )
            )}
          </tbody>
        </table>
        {hasScores && (
          <div style={{padding:'5px 14px',borderTop:'1px solid var(--navy-border)',display:'flex',justifyContent:'space-between',fontSize:'12px'}}>
            <span style={{color:'var(--text-muted)'}}>Best 3 Total:</span>
            <span style={{fontWeight:700,color:accentColor}}>{fmtScore(best3Total)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {loading && !isFirstLoad && (
        <div style={{
          position:'fixed',top:'64px',left:'50%',transform:'translateX(-50%)',
          background:'#1d4ed8',color:'#fff',padding:'6px 20px',
          borderRadius:'20px',fontSize:'13px',fontWeight:600,
          zIndex:999,boxShadow:'0 2px 12px rgba(0,0,0,0.4)',
          display:'flex',alignItems:'center',gap:'8px'
        }}>
          🔄 Updating scores...
        </div>
      )}

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
        <div className="page-title" style={{marginBottom:0}}>2026 Masters Tournament</div>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          {frozen ? (
            <>
              <span style={{background:'rgba(96,165,250,0.15)',border:'1px solid #60a5fa',color:'#60a5fa',borderRadius:'12px',padding:'3px 10px',fontSize:'12px',fontWeight:600}}>
                ❄️ Final Results
              </span>
              <button className="btn btn-secondary" style={{fontSize:'12px',padding:'4px 10px'}} onClick={() => { unfreezeLeaderboard(); setFrozen(false); update(); }}>
                🔓 Unfreeze
              </button>
            </>
          ) : (
            <button className="btn btn-secondary" style={{fontSize:'12px',padding:'4px 10px'}} onClick={() => { freezeLeaderboard(leaderboard); setFrozen(true); }} disabled={leaderboard.length === 0}>
              🧊 Freeze
            </button>
          )}
          <span className="status-bar">
            {saving ? '💾 Saving...' : lastUpdated ? (frozen ? `⏱ Frozen at: ${lastUpdated}` : `⏱ Last updated ${lastUpdated}`) : '⏳ Loading...'}
          </span>
        </div>
      </div>

      {scoring && (
        <div style={{
          background:scoring.netWinner==='Bill'?'rgba(30,58,95,0.9)':scoring.netWinner==='Don'?'rgba(95,30,30,0.9)':'rgba(30,49,72,0.9)',
          border:`1px solid ${scoring.netWinner==='Bill'?'#60a5fa':scoring.netWinner==='Don'?'#f87171':'var(--navy-border)'}`,
          borderRadius:'8px',padding:'10px 18px',marginBottom:'12px',
          display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'
        }}>
          <div style={{fontSize:'15px',fontWeight:700,color:'#fff'}}>
            🏆 Net Leader: <span style={{color:scoring.netWinner==='Bill'?'#60a5fa':scoring.netWinner==='Don'?'#f87171':'#fbbf24'}}>
              {scoring.netWinner==='Tie'?'Tied!':`${scoring.netWinner} leads`}
            </span>
            {scoring.netWinner!=='Tie'&&<span style={{color:'#4ade80',marginLeft:'8px'}}>{fmtMoney(scoring.netAmount)}</span>}
          </div>
          <div style={{display:'flex',gap:'16px',fontSize:'12px',color:'var(--text-muted)',flexWrap:'wrap'}}>
            <span>🏅 Golfer Win: <strong style={{color:'#fff'}}>{scoring.golferWin}</strong></span>
            <span>📊 Cum Score: <strong style={{color:'#fff'}}>{scoring.bestCumWinner}</strong> ({fmtScore(scoring.billTotal)} vs {fmtScore(scoring.donTotal)})</span>
            <span>💰 Diff: <strong style={{color:'#fff'}}>{scoring.differential} strokes ({fmtMoney(scoring.differentialPayout)})</strong></span>
          </div>
        </div>
      )}

      <div className="team-panels">
        <TeamPanel player="Bill" rows={billPadded} best3={billBest3} picks={billPicks} setter={setBillPicks} accentColor="#60a5fa" headerBg="#1e3a5f" />
        <TeamPanel player="Don"  rows={donPadded}  best3={donBest3}  picks={donPicks}  setter={setDonPicks}  accentColor="#f87171" headerBg="#5f1e1e" />
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginBottom:'12px'}}>
        <button
          className={`btn ${draftMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setDraftMode(d => !d); setSearchQuery(''); }}
        >
          {draftMode ? '📝 Draft Mode: ON' : '📝 Draft Mode: OFF'}
        </button>
      </div>

      {draftMode && (() => {
        const displayBoard = [...leaderboard]
          .sort((a, b) => a.name.localeCompare(b.name))
          .filter(g => !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Draft Board — Add Golfers</span>
              <span style={{marginLeft:'auto',fontSize:'12px',color:'var(--text-muted)'}}>Bill ({billPicks.length}/8) • Don ({donPicks.length}/8)</span>
            </div>
            <div style={{padding:'10px 16px',borderBottom:'1px solid var(--navy-border)',background:'var(--navy-light)'}}>
              <div style={{position:'relative',maxWidth:'400px'}}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search golfers by name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{paddingRight:'32px'}}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{position:'absolute',right:'8px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:'14px',padding:'2px 4px',lineHeight:1}}
                  >✕</button>
                )}
              </div>
            </div>
            {isFirstLoad && loading ? (
              <div className="card-body" style={{color:'var(--text-muted)'}}>Loading leaderboard...</div>
            ) : leaderboard.length===0 ? (
              <div className="card-body" style={{color:'var(--text-muted)'}}>No tournament data available.</div>
            ) : (
              <div style={{overflowX:'auto'}}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{textAlign:'left'}}>Golfer</th>
                      <th>Strokes</th><th>Thru</th><th>Bill</th><th>Don</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayBoard.map((g, i) => {
                      const billHas = billPicks.includes(g.name);
                      const donHas  = donPicks.includes(g.name);
                      return (
                        <tr key={i} style={billHas||donHas?{background:'rgba(255,255,255,0.03)'}:{}}>
                          <td style={{textAlign:'left',fontWeight:billHas||donHas?600:400}}>{g.name}</td>
                          <td>{fmtScore(g.strokes)}</td>
                          <td>{g.thru}</td>
                          <td><input type="checkbox" checked={billHas} onChange={()=>togglePick('Bill',billPicks,setBillPicks,g.name)} style={{cursor:'pointer',width:'16px',height:'16px'}}/></td>
                          <td><input type="checkbox" checked={donHas}  onChange={()=>togglePick('Don',donPicks,setDonPicks,g.name)}  style={{cursor:'pointer',width:'16px',height:'16px'}}/></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
