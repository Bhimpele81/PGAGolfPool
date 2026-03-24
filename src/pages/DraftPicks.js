import React, { useState, useEffect } from 'react';
import { getEntries, saveEntries } from '../utils/storage';

const emptyPicks = () => Array(8).fill('');

export default function DraftPicks() {
  const [bill, setBill] = useState(emptyPicks());
  const [don, setDon] = useState(emptyPicks());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const entries = getEntries();
    if (entries.bill?.length) setBill([...entries.bill, ...Array(8).fill('')].slice(0,8));
    if (entries.don?.length)  setDon([...entries.don,  ...Array(8).fill('')].slice(0,8));
  }, []);

  const handleSave = () => {
    saveEntries({ bill: bill.filter(Boolean), don: don.filter(Boolean) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const PickColumn = ({ player, picks, setPicks, headerClass }) => (
    <div className="card">
      <div className={`section-header ${headerClass}`}>
        <span className="section-header-title">{player}'s Picks</span>
      </div>
      <div className="card-body">
        {picks.map((val, i) => (
          <div className="golfer-row" key={i}>
            <span>{i+1}.</span>
            <input
              className="form-input"
              value={val}
              onChange={e => { const copy=[...picks]; copy[i]=e.target.value; setPicks(copy); }}
              placeholder={`Golfer ${i+1}`}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-title">🗒 Draft Picks</div>
      <p className="page-sub">Enter 8 golfers for each player. Best 3 finishers count toward scoring.</p>
      <div className="draft-grid">
        <PickColumn player="Bill" picks={bill} setPicks={setBill} headerClass="bill-header" />
        <PickColumn player="Don" picks={don} setPicks={setDon} headerClass="don-header" />
      </div>
      <div className="action-bar">
        <button className="btn btn-primary" onClick={handleSave}>{saved ? '✅ Saved!' : 'Save Picks'}</button>
      </div>
    </div>
  );
}