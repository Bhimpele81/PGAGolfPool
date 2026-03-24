import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

export default function Login() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'var(--navy)'
    }}>
      <div className="card" style={{width:'100%', maxWidth:'380px', margin:'24px'}}>
        <div className="card-header" style={{background:'#1e3a5f', borderRadius:'8px 8px 0 0', justifyContent:'center'}}>
          <span className="card-title" style={{color:'#fff', fontSize:'16px', textTransform:'none', letterSpacing:0}}>
            ⛳ PGA Golf Major Pool
          </span>
        </div>
        <div className="card-body">
          {sent ? (
            <div style={{textAlign:'center', padding:'12px 0'}}>
              <div style={{fontSize:'40px', marginBottom:'12px'}}>📧</div>
              <p style={{color:'var(--text)', fontWeight:600, marginBottom:'8px'}}>Check your email!</p>
              <p style={{color:'var(--text-muted)', fontSize:'13px'}}>
                We sent a magic link to <strong style={{color:'var(--text)'}}>{email}</strong>.<br/>
                Click the link to sign in — no password needed.
              </p>
              <button
                className="btn btn-secondary"
                style={{marginTop:'16px', width:'100%', justifyContent:'center'}}
                onClick={() => { setSent(false); setEmail(''); }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <p style={{color:'var(--text-muted)', fontSize:'13px', marginBottom:'20px', textAlign:'center'}}>
                Enter your email and we’ll send you a magic link — no password needed.
              </p>
              <form onSubmit={handleLogin}>
                <div style={{marginBottom:'16px'}}>
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoFocus
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
                  {loading ? 'Sending...' : '🚀 Send Magic Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
