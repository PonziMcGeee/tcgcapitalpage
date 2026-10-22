'use client';

import { useState } from 'react';

const JUEGOS = ['Pokémon', 'One Piece', 'Otro'];

export default function ConvierteteEnVendedor() {
  const [f, setF] = useState({ nombre: '', email: '', contacto: '', experiencia: '', mensaje: '', web: '' });
  const [juegos, setJuegos] = useState([]);
  const [estado, setEstado] = useState('idle'); // idle | enviando | ok
  const [error, setError] = useState('');

  const cambia = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const alternar = (j) => setJuegos((l) => (l.includes(j) ? l.filter((x) => x !== j) : [...l, j]));

  async function enviar(e) {
    e.preventDefault();
    setEstado('enviando');
    setError('');
    try {
      const r = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, juegos }),
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
          <p className="muted">
            Gracias por tu interés en vender en AkibaTrade. Revisaremos tu solicitud y te responderemos al correo que
            nos has dado lo antes posible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-box">
      <div className="panel">
        <h1>Conviértete en vendedor</h1>
        <p className="muted" style={{ marginBottom: 16 }}>
          Todos los vendedores de AkibaTrade están contrastados. Cuéntanos quién eres y qué vendes y te respondemos
          por correo.
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
            <label htmlFor="contacto">Telegram, WhatsApp o Instagram (opcional)</label>
            <input id="contacto" type="text" maxLength={200} value={f.contacto} onChange={cambia('contacto')} />
          </div>
          <div className="field">
            <label>¿Qué vendes?</label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {JUEGOS.map((j) => (
                <label key={j} style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400 }}>
                  <input type="checkbox" checked={juegos.includes(j)} onChange={() => alternar(j)} style={{ width: 'auto' }} />
                  {j}
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="experiencia">Tu tienda o perfil de venta actual (opcional)</label>
            <input
              id="experiencia"
              type="text"
              maxLength={300}
              placeholder="Enlace a Instagram, Wallapop, Cardmarket…"
              value={f.experiencia}
              onChange={cambia('experiencia')}
            />
          </div>
          <div className="field">
            <label htmlFor="mensaje">Mensaje</label>
            <textarea
              id="mensaje"
              required
              minLength={10}
              maxLength={3000}
              rows={5}
              placeholder="Cuéntanos qué cartas vendes, cuántas aproximadamente, etc."
              value={f.mensaje}
              onChange={cambia('mensaje')}
            />
          </div>
          {/* Campo trampa para bots: las personas no lo ven */}
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
