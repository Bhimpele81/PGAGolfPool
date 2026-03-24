import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import Rules     from './pages/Rules';
import Login     from './pages/Login';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'rules',     label: 'Rules' },
];

export default function App() {
  const [tab,      setTab]      = useState('dashboard');
  const [userName, setUserName] = useState(() => sessionStorage.getItem('golfuser') || null);

  const handleSelect = (name) => {
    sessionStorage.setItem('golfuser', name);
    setUserName(name);
  };

  const handleSwitch = () => {
    sessionStorage.removeItem('golfuser');
    setUserName(null);
  };

  if (!userName) return <Login onSelect={handleSelect} />;

  return (
    <div>
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <img src="/pgalogo.jpg" alt="PGA Tour" style={{height:'44px',objectFit:'contain'}} onError={e => e.target.style.display='none'} />
            <span className="brand-title">PGA Golf Major Pool</span>
            <span className="brand-sub">Bill vs Don</span>
          </div>
          <nav className="header-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`nav-btn${tab===t.id?' active':''}`}
                onClick={() => setTab(t.id)}
              >{t.label}</button>
            ))}
            <a
              href="https://ncaabowlpool.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-btn"
              style={{textDecoration:'none'}}
            >NASCAR Pool</a>
            <span style={{color:'var(--text-muted)',fontSize:'12px',padding:'6px 8px',borderLeft:'1px solid var(--navy-border)',marginLeft:'4px'}}>
              👤 {userName}
            </span>
            <button className="nav-btn" onClick={handleSwitch} style={{color:'var(--text-muted)'}}>
              Switch
            </button>
          </nav>
        </div>
      </header>
      <main className="app-main">
        {tab==='dashboard' ? <Dashboard userName={userName} /> : <Rules />}
      </main>
    </div>
  );
}
