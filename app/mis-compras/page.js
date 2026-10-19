'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import ConfigWarning from '../../components/ConfigWarning';
import Stars from '../../components/Stars';
import { getSupabase } from '../../lib/supabase';
import { useProfile } from '../../lib/useProfile';

function Compra({ venta, resena, onChange }) {
  const [editando, setEditando] = useState(!resena);
  const [nota, setNota] = useState(resena?.rating || 0);
  const [texto, setTexto] = useState(resena?.comment || '');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    if (!nota) {
      setMsg('Elige una nota de 1 a 5 estrellas.');
      return;
    }
    const sb = getSupabase();
    setBusy(true);
    setMsg('');
    const datos = { rating: nota, comment: texto.trim() || null };
    const { error } = resena
      ? await sb.from('reviews').update(datos).eq('id', resena.id)
      : await sb.from('reviews').insert({
          ...datos,
          listing_id: venta.listing_id,
          seller_id: venta.seller_id,
          buyer_id: venta.buyer_id,
        });
    setBusy(false);
    if (error) {
      setMsg('No se ha podido guardar la reseña.');
      return;
    }
    setEditando(false);
    onChange();
  }

  async function borrar() {
    if (!window.confirm('¿Borrar tu reseña?')) return;
    const sb = getSupabase();
    await sb.from('reviews').delete().eq('id', resena.id);
    setNota(0);
    setTexto('');
    setEditando(true);
    onChange();
  }

  return (
    <div className="sale-card">
      <strong>{venta.listing_name || 'Carta'}</strong>
      <p className="muted small" style={{ margin: '2px 0 10px' }}>
        Vendida por <Link href={`/tienda/${venta.seller_id}`}>{venta.seller_name}</Link>
      </p>

      {resena && !editando ? (
        <>
          <Stars value={resena.rating} />
          {resena.comment && <p style={{ margin: '8px 0' }}>{resena.comment}</p>}
          <div className="admin-actions">
            <button type="button" className="btn btn-small btn-outline" onClick={() => setEditando(true)}>
              Editar reseña
            </button>
            <button type="button" className="btn btn-small btn-outline" onClick={borrar}>
              Borrar reseña
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={guardar}>
          <Stars value={nota} onChange={setNota} size={28} />
          <textarea
            placeholder="Cuéntanos cómo fue la compra (opcional)"
            maxLength={500}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            style={{ marginTop: 10 }}
          />
          {msg && <div className="notice notice-error">{msg}</div>}
          <div className="admin-actions" style={{ marginTop: 8 }}>
            <button className="btn btn-small" disabled={busy}>
              {busy ? 'Guardando…' : resena ? 'Guardar cambios' : 'Publicar reseña'}
            </button>
            {resena && (
              <button type="button" className="btn btn-small btn-outline" onClick={() => setEditando(false)}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

export default function MisCompras() {
  const { user, loading: cargandoUsuario } = useProfile();
  const [ventas, setVentas] = useState([]);
  const [resenas, setResenas] = useState(new Map());
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !user) {
      setLoading(false);
      return;
    }
    const [v, r] = await Promise.all([
      sb.from('sales').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false }),
      sb.from('reviews').select('*').eq('buyer_id', user.id),
    ]);
    setVentas(v.data || []);
    setResenas(new Map((r.data || []).map((x) => [x.listing_id, x])));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!cargandoUsuario) cargar();
  }, [cargandoUsuario, cargar]);

  if (!cargandoUsuario && !user) {
    return (
      <div className="empty">
        Entra para ver tus compras. <Link href="/login">Entrar</Link>
      </div>
    );
  }

  return (
    <>
      <ConfigWarning />
      <h1>Mis compras</h1>
      <p className="muted">
        Las cartas que un vendedor te ha marcado como vendidas. Aquí puedes dejarle una reseña que se verá en su perfil.
      </p>
      {loading && <p className="muted">Cargando…</p>}
      {!loading && ventas.length === 0 && (
        <div className="empty">Todavía no tienes compras registradas por ningún vendedor.</div>
      )}
      {ventas.map((v) => (
        <Compra key={`${v.listing_id}-${resenas.get(v.listing_id)?.id || 'nueva'}`} venta={v} resena={resenas.get(v.listing_id)} onChange={cargar} />
      ))}
    </>
  );
}
