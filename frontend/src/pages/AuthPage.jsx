import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const isRegister = useLocation().pathname === '/register';
  const nav = useNavigate();
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      nav('/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong'); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand big">Fit<span>Sense</span> AI</div>
        <p className="muted">AI-powered personalized fitness</p>
        <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <form onSubmit={submit}>
          {isRegister && <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />}
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input type="password" placeholder="Password (6+ characters)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          {error && <div className="error">{error}</div>}
          <button className="primary" disabled={busy}>{busy ? 'Working…' : isRegister ? 'Create account' : 'Sign in'}</button>
        </form>
        <button className="link-btn" onClick={() => nav(isRegister ? '/login' : '/register')}>
          {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
        </button>
      </div>
    </div>
  );
}
