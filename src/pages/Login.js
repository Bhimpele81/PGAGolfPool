import React from 'react';

export default function Login({ onSelect }) {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'var(--navy)', padding:'24px'
    }}>
      <div style={{width:'100%', maxWidth:'400px'}}>
        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <div style={{fontSize:'48px', marginBottom:'12px'}}>⛳</div>
          <div style={{fontSize:'22px', fontWeight:800, color:'#fff', marginBottom:'6px'}}>PGA Golf Major Pool</div>
          <div style={{fontSize:'14px', color:'var(--text-muted)'}}>2026 Masters Tournament — Bill vs Don</div>
        </div>
        <div style={{display:'flex', gap:'16px'}}>
          <button
            onClick={() => onSelect('Bill')}
            style={{
              flex:1, padding:'24px 16px', background:'#1e3a5f',
              border:'2px solid #60a5fa', borderRadius:'12px',
              cursor:'pointer', textAlign:'center', transition:'all 0.15s'
            }}
            onMouseOver={e => e.currentTarget.style.background='#254d7a'}
            onMouseOut={e  => e.currentTarget.style.background='#1e3a5f'}
          >
            <div style={{fontSize:'36px', marginBottom:'8px'}}>👤</div>
            <div style={{fontSize:'20px', fontWeight:700, color:'#60a5fa'}}>Bill</div>
            <div style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'4px'}}>Tap to enter as Bill</div>
          </button>
          <button
            onClick={() => onSelect('Don')}
            style={{
              flex:1, padding:'24px 16px', background:'#5f1e1e',
              border:'2px solid #f87171', borderRadius:'12px',
              cursor:'pointer', textAlign:'center', transition:'all 0.15s'
            }}
            onMouseOver={e => e.currentTarget.style.background='#7a2424'}
            onMouseOut={e  => e.currentTarget.style.background='#5f1e1e'}
          >
            <div style={{fontSize:'36px', marginBottom:'8px'}}>👤</div>
            <div style={{fontSize:'20px', fontWeight:700, color:'#f87171'}}>Don</div>
            <div style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'4px'}}>Tap to enter as Don</div>
          </button>
        </div>
      </div>
    </div>
  );
}
