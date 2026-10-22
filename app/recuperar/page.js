'use client';

import Link from 'next/link';
import { useState } from 'react';
import ConfigWarning from '../../components/ConfigWarning';
import { getSupabase } from '../../lib/supabase';

export default function Recuperar() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [busy, setBusy] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError('');
    const { error: err } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nueva-contrasena`,
    });
    setBusy(false);
    if (err) {
      setError(
        err.status === 429 || /rate|seconds/i.test(err.message)
          ? 'Has pedido demasiados correos seguidos. Espera un minuto e inténtalo de nuevo.'
          : 'No se ha podido enviar el correo. Inténtalo de nuevo.'
      );
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="auth-box">
        <div className="panel">
          <h1>Revisa tu correo</h1>
          <p>
            Si existe una cuenta con <b>{email}</b>, te hemos enviado un enlace para elegir una contraseña nueva.
            Mira también la carpeta de spam.
          </p>
          <p style={{ marginTop: 12 }}>
            <Link href="/login">Volver a entrar</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-box">
      <ConfigWarning />
      <div className="panel">
        <h1>Recuperar contraseña</h1>
        <p className="muted" style={{ marginBottom: 16 }}>
          Escribe el email de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.
        </p>
        <form className="form" onSubmit={enviar}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <div className="notice notice-error">{error}</div>}
          <button className="btn btn-block" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
        <p className="small" style={{ marginTop: 12 }}>
          <Link href="/login">Volver a entrar</Link>
        </p>
      </div>
    </div>
  );
}
