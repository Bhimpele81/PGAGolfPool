import React, { useState, useEffect } from 'react';
import { getEntries, saveEntries } from '../utils/storage';

const emptyPicks = () => Array(8).fill('');

export default function DraftPicks() {
  const [bill, setBill] = useState(emptyPicks());
  const [don, setDon] = useState(emptyPicks());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const entries = getEntries();
    if (entries.bill?.length) setBill(entries.bill);
    if (entries.don?.length) setDon(entries.don);
  }, []);

  const handleSave = () => {
    saveEntries({ bill: bill.filter(Boolean), don: don.filter(Boolean) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const PickColumn = ({ player, picks, setPicks }) => (
    <div className="card">
      <h3 style={{marginBottom:'1rem',color:'#1a3c5e'}}>{player}'s Picks</h3>
      {picks.map((val, i) => (
        <div className="golfer-row" key={i}>
          <span>{i+1}.</span>
          <input
            value={val}
            onChange={e => { const copy=[...picks]; copy[i]=e.target.value; setPicks(copy); }}
            placeholder={`Golfer ${i+1}`}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="page">
      <h2>Draft Picks</h2>
      <p style={{marginBottom:'1rem',color:'#555'}}>Enter 8 golfers for each player. Best 3 finishers count toward scoring.</p>
      <div className="draft-grid">
        <PickColumn player="Bill" picks={bill} setPicks={setBill} />
        <PickColumn player="Don" picks={don} setPicks={setDon} />
      </div>
      <button className="btn" onClick={handleSave}>{saved ? '✅ Saved!' : 'Save Picks'}</button>
    </div>
  );
}