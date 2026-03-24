import React, { useState, useEffect } from 'react';
import { getHistory } from '../utils/storage';

export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => { setHistory(getHistory()); }, []);

  return (
    <div>
      <div className="page-title">📅 Tournament History</div>
      {history.length === 0 ? (
        <div className="card"><div className="card-body" style={{color:'var(--text-muted)'}}>No completed tournaments yet.</div></div>
      ) : (
        history.map((t, i) => (
          <div className="card" key={i}>
            <div className="card-header"><span className="card-title">{t.tournament} — {t.date}</span></div>
            <table className="data-table">
              <thead><tr><th>Category</th><th>Winner</th><th>Payout</th></tr></thead>
              <tbody>
                <tr><td>🏆 Golfer Win</td><td>{t.golferWin}</td><td>$20</td></tr>
                <tr><td>📊 Best Cumulative Score</td><td>{t.bestCumWinner}</td><td>$20</td></tr>
                <tr><td>💰 Differential</td><td>—</td><td>${t.differentialPayout}</td></tr>
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}