import React, { useState } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import Rules     from './pages/Rules';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'rules',     label: 'Rules' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');

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
          </nav>
        </div>
      </header>
      <main className="app-main">
        {tab==='dashboard' ? <Dashboard /> : <Rules />}
      </main>
    </div>
  );
}
