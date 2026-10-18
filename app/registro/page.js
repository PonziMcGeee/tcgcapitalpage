'use client';

import Link from 'next/link';
import { useState } from 'react';
import ConfigWarning from '../../components/ConfigWarning';
import { getSupabase } from '../../lib/supabase';

export default function Registro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError('');
    const { data, error: err } = await sb.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    setBusy(false);
    if (err) {
      setError(err.message.includes('already') ? 'Ya existe una cuenta con ese email.' : 'No se ha podido crear la cuenta.');
      return;
    }
    // Si Supabase exige confirmar el email, no hay sesión todavía
    setDone(data.session ? 'logged' : 'confirm');
  }

  if (done) {
    return (
      <div className="auth-box">
        <div className="panel">
          <h1>¡Cuenta creada!</h1>
          {done === 'confirm' ? (
            <p>Te hemos enviado un email para confirmar tu cuenta. Confírmala y luego entra.</p>
          ) : (
            <p>
              Ya puedes ver el contacto de los vendedores. <Link href="/catalogo">Ir al catálogo</Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-box">
      <ConfigWarning />
      <div className="panel">
        <h1>Crear cuenta</h1>
        <p className="muted" style={{ marginBottom: 16 }}>
          ¿Ya tienes cuenta? <Link href="/login">Entra aquí</Link>
        </p>
        <form className="form" onSubmit={enviar}>
          <div className="field">
            <label htmlFor="name">Nombre</label>
            <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="hint">Mínimo 6 caracteres.</span>
          </div>
          {error && <div className="notice notice-error">{error}</div>}
          <button className="btn btn-block" disabled={busy}>
            {busy ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
