import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

export default function Login() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--navy)'
    }}>
      <div className="card" style={{width:'100%', maxWidth:'380px', margin:'24px'}}>
        <div className="card-header" style={{background:'#1e3a5f', borderRadius:'8px 8px 0 0', justifyContent:'center'}}>
          <span className="card-title" style={{color:'#fff', fontSize:'16px', textTransform:'none', letterSpacing:0}}>
            ⛳ PGA Golf Major Pool
          </span>
        </div>
        <div className="card-body">
          <p style={{color:'var(--text-muted)', fontSize:'13px', marginBottom:'20px', textAlign:'center'}}>
            Sign in to view and manage picks
          </p>
          <form onSubmit={handleLogin}>
            <div style={{marginBottom:'14px'}}>
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div style={{marginBottom:'20px'}}>
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>
            {error && (
              <div style={{color:'#f87171', fontSize:'13px', marginBottom:'12px', textAlign:'center'}}>
                {error}
              </div>
            )}
            <button
              className="btn btn-green"
              type="submit"
              disabled={loading}
              style={{width:'100%', justifyContent:'center'}}
            >
              {loading ? 'Signing in...' : '🔐 Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
