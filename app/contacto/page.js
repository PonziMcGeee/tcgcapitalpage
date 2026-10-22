'use client';

import { useState } from 'react';

const MOTIVOS = [
  'Duda o consulta',
  'Error en la web (bug)',
  'Problema con una compra o un vendedor',
  'Sugerencia',
  'Otro',
];

export default function Contacto() {
  const [f, setF] = useState({ nombre: '', email: '', motivo: MOTIVOS[0], mensaje: '', web: '' });
  const [estado, setEstado] = useState('idle'); // idle | enviando | ok
  const [error, setError] = useState('');

  const cambia = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    setEstado('enviando');
    setError('');
    try {
      const r = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, tipo: 'general' }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'No se ha podido enviar el mensaje.');
      setEstado('ok');
    } catch (err) {
      setError(err.message);
      setEstado('idle');
    }
  }

  if (estado === 'ok') {
    return (
      <div className="auth-box">
        <div className="panel">
          <h1>¡Mensaje enviado!</h1>
          <p className="muted">Gracias por escribirnos. Te responderemos al correo que nos has dado lo antes posible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-box">
      <div className="panel">
        <h1>Contacto</h1>
        <p className="muted" style={{ marginBottom: 16 }}>
          ¿Tienes una duda, has encontrado un error o quieres proponernos algo? Escríbenos y te respondemos por correo.
        </p>
        <form className="form" onSubmit={enviar}>
          <div className="field">
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" type="text" required maxLength={120} value={f.nombre} onChange={cambia('nombre')} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required maxLength={200} value={f.email} onChange={cambia('email')} />
          </div>
          <div className="field">
            <label htmlFor="motivo">Motivo</label>
            <select id="motivo" value={f.motivo} onChange={cambia('motivo')}>
              {MOTIVOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="mensaje">Mensaje</label>
            <textarea
              id="mensaje"
              required
              minLength={10}
              maxLength={3000}
              rows={6}
              placeholder="Cuéntanos qué ocurre. Si es un error, indica en qué página y qué hacías."
              value={f.mensaje}
              onChange={cambia('mensaje')}
            />
          </div>
          {/* Campo trampa para bots */}
          <input
            type="text"
            name="web"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={f.web}
            onChange={cambia('web')}
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
          />
          {error && <div className="notice notice-error">{error}</div>}
          <button className="btn btn-block" disabled={estado === 'enviando'}>
            {estado === 'enviando' ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
