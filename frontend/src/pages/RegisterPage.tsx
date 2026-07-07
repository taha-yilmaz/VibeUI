import React, { useState } from 'react';
import { api } from '../api';

interface RegisterPageProps {
  onRegisterSuccess: (token: string, workspaceName: string) => void;
  onNavigateToLogin: () => void;
  onBackToLanding: () => void;
}

export default function RegisterPage({
  onRegisterSuccess,
  onNavigateToLogin,
  onBackToLanding
}: RegisterPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in required fields.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await api.authRegister(name, email, password, workspace);
      onRegisterSuccess(res.token, res.workspaceName);
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {/* Back to Home Button */}
      <button 
        onClick={onBackToLanding} 
        className="btn-linear btn-linear-secondary" 
        style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}
      >
        <span>&larr;</span> Back to home
      </button>

      <div className="card-panel" style={{ maxWidth: 400, width: '100%', display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 24px 64px rgba(94,106,210,0.15)' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/logo-vibeUI.png" alt="VibeUI Logo" style={{ height: 64, width: 'auto', objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Create your account</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Get started with VibeUI today</p>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', background: 'var(--danger-bg)', padding: 10, borderRadius: 'var(--radius-sm)', fontSize: 12, border: '1px solid rgba(226,88,80,0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Name</label>
            <input type="text" className="input-linear" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</label>
            <input type="email" className="input-linear" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Workspace Name <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-secondary)' }}>(Optional)</span></label>
            <input type="text" className="input-linear" placeholder="e.g. Acme UI Reference" value={workspace} onChange={e => setWorkspace(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Password</label>
            <input type="password" className="input-linear" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-linear btn-linear-primary" style={{ width: '100%', marginTop: 8 }}>
            Create Account
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center', fontSize: 12, marginTop: 8 }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Already have an account? <span onClick={onNavigateToLogin} style={{ color: 'var(--text-link)', cursor: 'pointer', fontWeight: 500 }}>Log in</span>
          </span>
        </div>
      </div>
    </div>
  );
}
