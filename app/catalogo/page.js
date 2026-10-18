'use client';

import { useEffect, useMemo, useState } from 'react';
import ConfigWarning from '../../components/ConfigWarning';
import SellerSection from '../../components/SellerSection';
import { GAMES } from '../../lib/format';
import { getSupabase } from '../../lib/supabase';

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

  // Vendedores distintos (id + nombre), ordenados por nombre
  const sellers = useMemo(() => {
    const map = new Map();
    listings.forEach((l) => map.set(l.seller_id, l.seller_name));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [listings]);

  // Cartas filtradas y agrupadas por vendedor: cada uno en su propio bloque
  const grupos = useMemo(() => {
    const visibles = listings.filter((l) => {
      if (game && l.game !== game) return false;
      if (seller && l.seller_id !== seller) return false;
      if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    return sellers
      .map(([id, name]) => ({ id, name, items: visibles.filter((l) => l.seller_id === id) }))
      .filter((g) => g.items.length > 0);
  }, [listings, sellers, game, seller, search]);

  return (
    <>
      <ConfigWarning />
      <h1>Cartas en venta</h1>
      <p className="muted">Cada vendedor tiene su propio apartado. Regístrate para ver cómo contactar con ellos.</p>

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
          {sellers.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="notice notice-error">{error}</div>}
      {loading && <p className="muted">Cargando…</p>}
      {!loading && !error && grupos.length === 0 && (
        <div className="empty">No hay cartas que mostrar.</div>
      )}

      {grupos.map((g) => (
        <SellerSection key={g.id} sellerId={g.id} name={g.name} listings={g.items} />
      ))}
    </>
  );
}
