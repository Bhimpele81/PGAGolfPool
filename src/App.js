import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import Rules     from './pages/Rules';
import Login     from './pages/Login';
import { supabase } from './utils/supabase';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'rules',     label: 'Rules' },
];

export default function App() {
  const [tab,     setTab]     = useState('dashboard');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',color:'var(--text-muted)'}}>
      Loading...
    </div>
  );

  if (!session) return <Login />;

  const userEmail = session.user.email;
  const userName  = userEmail.toLowerCase().includes('bill') ? 'Bill'
                  : userEmail.toLowerCase().includes('don')  ? 'Don'
                  : userEmail.split('@')[0];

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
                className={`nav-btn${tab === t.id ? ' active' : ''}`}
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
            <button className="nav-btn" onClick={handleSignOut} style={{color:'#f87171'}}>
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      <main className="app-main">
        {tab === 'dashboard' ? <Dashboard session={session} userName={userName} /> : <Rules />}
      </main>
    </div>
  );
}
