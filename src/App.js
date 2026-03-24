import React, { useState } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import TournamentEntry from './pages/TournamentEntry';
import Rules from './pages/Rules';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'entry',     label: 'Leaderboard' },
  { id: 'rules',     label: 'Rules' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');

  const renderPage = () => {
    switch(tab) {
      case 'dashboard': return <Dashboard />;
      case 'entry':     return <TournamentEntry />;
      case 'rules':     return <Rules />;
      default:          return <Dashboard />;
    }
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="flag-icon">⛳</span>
            <span className="brand-title">PGA Golf Pool</span>
            <span className="brand-sub">Bill vs Don</span>
          </div>
          <nav className="header-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`nav-btn${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >{t.label}</button>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}