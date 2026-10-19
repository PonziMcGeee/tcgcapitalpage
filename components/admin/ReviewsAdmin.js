'use client';

import { useEffect, useState } from 'react';
import Stars from '../Stars';
import { getSupabase } from '../../lib/supabase';

// El administrador ve todas las reseñas y puede borrar las que no sean adecuadas.
export default function ReviewsAdmin() {
  const [resenas, setResenas] = useState([]);
  const [vendedores, setVendedores] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [filtro, setFiltro] = useState('');

  async function cargar() {
    const sb = getSupabase();
    const [r, v] = await Promise.all([
      sb.from('reviews').select('*').order('created_at', { ascending: false }).limit(300),
      sb.from('sellers_public').select('id, display_name'),
    ]);
    if (r.error) setMsg({ type: 'error', text: 'No se han podido cargar las reseñas. ¿Has ejecutado la migración?' });
    else setResenas(r.data);
    setVendedores(new Map((v.data || []).map((s) => [s.id, s.display_name])));
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function borrar(r) {
    if (!window.confirm(`¿Borrar la reseña de ${r.buyer_name || 'este comprador'}?`)) return;
    const sb = getSupabase();
    const { error } = await sb.from('reviews').delete().eq('id', r.id);
    if (error) setMsg({ type: 'error', text: 'No se ha podido borrar la reseña.' });
    else {
      setMsg({ type: 'ok', text: 'Reseña borrada.' });
      cargar();
    }
  }

  const q = filtro.trim().toLowerCase();
  const lista = resenas.filter(
    (r) =>
      !q ||
      (r.buyer_name || '').toLowerCase().includes(q) ||
      (vendedores.get(r.seller_id) || '').toLowerCase().includes(q) ||
      (r.comment || '').toLowerCase().includes(q)
  );

  return (
    <section>
      <h2>Reseñas</h2>
      <p className="muted">Todas las reseñas que han dejado los compradores. Borra las que sean ofensivas o falsas.</p>
      <div className="filters" style={{ gridTemplateColumns: '1fr' }}>
        <input
          type="text"
          placeholder="Buscar por comprador, vendedor o texto…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>
      {msg && <div className={`notice ${msg.type === 'error' ? 'notice-error' : ''}`}>{msg.text}</div>}
      {loading && <p className="muted">Cargando…</p>}
      {!loading && lista.length === 0 && <div className="empty">No hay reseñas.</div>}
      {lista.map((r) => (
        <div className="review" key={r.id}>
          <div className="review-head">
            <strong>
              {r.buyer_name || 'Comprador'} → {vendedores.get(r.seller_id) || 'Vendedor'}
            </strong>
            <Stars value={r.rating} size={18} />
          </div>
          {r.listing_name && <p className="muted small" style={{ margin: '2px 0 0' }}>Carta: {r.listing_name}</p>}
          {r.comment && <p>{r.comment}</p>}
          <div className="admin-actions" style={{ marginTop: 8 }}>
            <span className="muted small">{new Date(r.created_at).toLocaleDateString('es-ES')}</span>
            <button type="button" className="btn btn-small btn-danger" onClick={() => borrar(r)}>
              Borrar
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
