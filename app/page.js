'use client';

import { useEffect, useMemo, useState } from 'react';
import CardTile from '../components/CardTile';
import ConfigWarning from '../components/ConfigWarning';
import { GAMES } from '../lib/format';
import { getSupabase } from '../lib/supabase';

export default function Catalogo() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [game, setGame] = useState('');
  const [seller, setSeller] = useState('');

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    sb.from('listings')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError('No se han podido cargar las cartas.');
        else setListings(data || []);
        setLoading(false);
      });
  }, []);

  const sellers = useMemo(() => [...new Set(listings.map((l) => l.seller_name))].sort(), [listings]);

  const visibles = listings.filter((l) => {
    if (game && l.game !== game) return false;
    if (seller && l.seller_name !== seller) return false;
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <ConfigWarning />
      <h1>Cartas en venta</h1>
      <p className="muted">Envíos a España y Europa. Regístrate para ver cómo contactar con el vendedor.</p>

      <div className="filters">
        <input
          type="text"
          placeholder="Buscar carta…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={game} onChange={(e) => setGame(e.target.value)}>
          <option value="">Todos los juegos</option>
          {GAMES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select value={seller} onChange={(e) => setSeller(e.target.value)}>
          <option value="">Todos los vendedores</option>
          {sellers.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="notice notice-error">{error}</div>}
      {loading && <p className="muted">Cargando…</p>}
      {!loading && !error && visibles.length === 0 && (
        <div className="empty">Todavía no hay cartas que mostrar.</div>
      )}

      <div className="grid">
        {visibles.map((l) => (
          <CardTile key={l.id} listing={l} />
        ))}
      </div>
    </>
  );
}
