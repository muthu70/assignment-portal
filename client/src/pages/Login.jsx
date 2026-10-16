import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNo: '', department: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-hero">
        <div className="brand">
          <span className="brand-logo">AP</span>
          Assignment Portal
        </div>

        <div className="auth-hero-text">
          <h1>Assignments, organised in one place.</h1>
          <p>Teachers post and grade work. Students submit, track deadlines and read feedback.</p>
          <ul className="feature-list">
            <li>Secure accounts for admins, teachers and students</li>
            <li>Clear deadlines, with optional late submissions</li>
            <li>Marks and feedback released when your teacher is ready</li>
          </ul>
        </div>

        <p style={{ fontSize: '0.85rem', opacity: 0.85, margin: 0 }}>
          © {new Date().getFullYear()} Assignment Portal
        </p>
      </aside>

      <section className="auth-panel">
        <form className="card auth-card" onSubmit={submit}>
          <div>
            <h1>{mode === 'login' ? 'Sign in' : 'Create student account'}</h1>
            <p className="muted" style={{ margin: 0 }}>
              {mode === 'login' ? 'to continue to Assignment Portal' : 'Register with your college details'}
            </p>
          </div>

          {mode === 'register' && (
            <>
              <label>Full name<input name="name" value={form.name} onChange={update} required /></label>
              <label>Roll number<input name="rollNo" value={form.rollNo} onChange={update} /></label>
              <label>Department<input name="department" value={form.department} onChange={update} /></label>
            </>
          )}

          <label>Email<input type="email" name="email" value={form.email} onChange={update} required /></label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={update} required minLength={6} />
          </label>

          {error && <p className="error">{error}</p>}

          <button className="btn primary" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Next' : 'Create account'}
          </button>

          <p className="switch">
            {mode === 'login' ? (
              <>New student? <button type="button" className="link" onClick={() => setMode('register')}>Create an account</button></>
            ) : (
              <>Already have an account? <button type="button" className="link" onClick={() => setMode('login')}>Sign in</button></>
            )}
          </p>
          <p className="hint">Teachers and admins are created by the college admin.</p>
        </form>
      </section>
    </div>
  );
}
