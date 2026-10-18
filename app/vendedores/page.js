'use client';

import { useEffect, useMemo, useState } from 'react';
import ConfigWarning from '../../components/ConfigWarning';
import SellerCard from '../../components/SellerCard';
import { fetchSellers } from '../../lib/data';
import { getSupabase } from '../../lib/supabase';

export default function Vendedores() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    fetchSellers(sb).then(({ data, error: err }) => {
      if (err) setError('No se ha podido cargar la lista de vendedores. ¿Has ejecutado la migración de Supabase? (mira el README)');
      else setSellers(data);
      setLoading(false);
    });
  }, []);

  // Primero los que tienen cartas (de más a menos), luego el resto por nombre
  const lista = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sellers
      .filter((s) => !q || s.display_name.toLowerCase().includes(q))
      .sort((a, b) => b.cards_available - a.cards_available || a.display_name.localeCompare(b.display_name));
  }, [sellers, search]);

  return (
    <>
      <ConfigWarning />
      <h1>Vendedores</h1>
      <p className="muted">Cada vendedor tiene su propia tienda con sus cartas.</p>

      <div className="filters" style={{ gridTemplateColumns: '1fr' }}>
        <input
          type="text"
          placeholder="Buscar vendedor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="notice notice-error">{error}</div>}
      {loading && <p className="muted">Cargando…</p>}
      {!loading && !error && lista.length === 0 && <div className="empty">No hay vendedores que mostrar.</div>}

      <div className="sellers-grid">
        {lista.map((s) => (
          <SellerCard key={s.id} seller={s} />
        ))}
      </div>
    </>
  );
}
