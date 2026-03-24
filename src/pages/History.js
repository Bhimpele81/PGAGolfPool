import React, { useState, useEffect } from 'react';
import { getHistory } from '../utils/storage';

export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  return (
    <div className="page">
      <h2>Tournament History</h2>
      {history.length === 0 ? (
        <div className="card"><p style={{color:'#888'}}>No completed tournaments yet.</p></div>
      ) : (
        history.map((t, i) => (
          <div className="card" key={i}>
            <h3 style={{marginBottom:'0.5rem'}}>{t.tournament} — {t.date}</h3>
            <table>
              <thead><tr><th>Category</th><th>Winner</th><th>Payout</th></tr></thead>
              <tbody>
                <tr><td>Golfer Win</td><td>{t.golferWin}</td><td>$20</td></tr>
                <tr><td>Best Cumulative Score</td><td>{t.bestCumWinner}</td><td>$20</td></tr>
                <tr><td>Differential</td><td>—</td><td>${t.differentialPayout}</td></tr>
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}