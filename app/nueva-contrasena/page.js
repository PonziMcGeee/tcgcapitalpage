'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ConfigWarning from '../../components/ConfigWarning';
import { getSupabase } from '../../lib/supabase';

export default function NuevaContrasena() {
  const [listo, setListo] = useState(false); // hay sesión de recuperación válida
  const [comprobado, setComprobado] = useState(false);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [hecho, setHecho] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setComprobado(true);
      return;
    }
    // Supabase lee el enlace del correo y abre una sesión de recuperación
    const { data: sub } = sb.auth.onAuthStateChange((evento, sesion) => {
      if (evento === 'PASSWORD_RECOVERY' || (evento === 'SIGNED_IN' && sesion)) setListo(true);
    });
    sb.auth.getSession().then(({ data }) => {
      if (data.session) setListo(true);
      setTimeout(() => setComprobado(true), 800);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function enviar(e) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    setError('');
    const { error: err } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(
        /different|same/i.test(err.message)
          ? 'La contraseña nueva tiene que ser distinta de la anterior.'
          : 'No se ha podido cambiar la contraseña. Pide un enlace nuevo e inténtalo otra vez.'
      );
      return;
    }
    setHecho(true);
  }

  if (hecho) {
    return (
      <div className="auth-box">
        <div className="panel">
          <h1>Contraseña cambiada</h1>
          <p>Ya puedes usar tu contraseña nueva.</p>
          <p style={{ marginTop: 12 }}>
            <Link href="/catalogo">Ir a las cartas</Link>
          </p>
        </div>
      </div>
    );
  }

  if (comprobado && !listo) {
    return (
      <div className="auth-box">
        <div className="panel">
          <h1>Enlace no válido</h1>
          <p>El enlace ha caducado o ya se ha usado.</p>
          <p style={{ marginTop: 12 }}>
            <Link href="/recuperar">Pedir un enlace nuevo</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-box">
      <ConfigWarning />
      <div className="panel">
        <h1>Nueva contraseña</h1>
        {!listo ? (
          <p className="muted">Comprobando el enlace…</p>
        ) : (
          <form className="form" onSubmit={enviar}>
            <div className="field">
              <label htmlFor="password">Contraseña nueva</label>
              <input
                id="password"
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="hint">Mínimo 6 caracteres.</span>
            </div>
            <div className="field">
              <label htmlFor="password2">Repetir contraseña</label>
              <input
                id="password2"
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </div>
            {error && <div className="notice notice-error">{error}</div>}
            <button className="btn btn-block" disabled={busy}>
              {busy ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
