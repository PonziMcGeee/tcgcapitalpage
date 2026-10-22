'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ConfigWarning from '../../components/ConfigWarning';
import { getSupabase } from '../../lib/supabase';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError('');
    const { error: err } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError('Email o contraseña incorrectos.');
      return;
    }
    router.push('/');
  }

  return (
    <div className="auth-box">
      <ConfigWarning />
      <div className="panel">
        <h1>Entrar</h1>
        <p className="muted" style={{ marginBottom: 16 }}>
          ¿No tienes cuenta? <Link href="/registro">Créala aquí</Link>
        </p>
        <form className="form" onSubmit={enviar}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <p className="small" style={{ margin: 0 }}>
            <Link href="/recuperar">He olvidado mi contraseña</Link>
          </p>
          {error && <div className="notice notice-error">{error}</div>}
          <button className="btn btn-block" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
