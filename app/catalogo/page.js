'use client';

import { useEffect, useMemo, useState } from 'react';
import CardTile from '../../components/CardTile';
import ConfigWarning from '../../components/ConfigWarning';
import SellerSection from '../../components/SellerSection';
import { deriveSellers, fetchAllAvailable, fetchSellers } from '../../lib/data';
import { GAMES } from '../../lib/format';
import { getSupabase } from '../../lib/supabase';

const PREVIEW = 6; // cartas que se enseñan por vendedor en la vista agrupada
const STEP = 24; // cartas que se añaden cada vez en la vista "todas juntas"

export default function Catalogo() {
  const [listings, setListings] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [game, setGame] = useState('');
  const [seller, setSeller] = useState('');
  const [vista, setVista] = useState('vendedores');
  const [mostradas, setMostradas] = useState(STEP);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    Promise.all([fetchAllAvailable(sb), fetchSellers(sb)]).then(([cartas, vendedores]) => {
      if (cartas.error) {
        setError('No se han podido cargar las cartas.');
      } else {
        setListings(cartas.data);
        setSellers(vendedores.error ? deriveSellers(cartas.data) : vendedores.data);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setMostradas(STEP);
  }, [search, game, seller, vista]);

  const sellerMap = useMemo(() => new Map(sellers.map((s) => [s.id, s])), [sellers]);

  const visibles = useMemo(
    () =>
      listings.filter((l) => {
        if (game && l.game !== game) return false;
        if (seller && l.seller_id !== seller) return false;
        if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [listings, game, seller, search]
  );

  // Vista por vendedor: un bloque por vendedor con solo unas pocas cartas de muestra
  const grupos = useMemo(() => {
    if (vista !== 'vendedores') return [];
    const porVendedor = new Map();
    visibles.forEach((l) => {
      if (!porVendedor.has(l.seller_id)) porVendedor.set(l.seller_id, []);
      porVendedor.get(l.seller_id).push(l);
    });
    return sellers
      .filter((s) => porVendedor.has(s.id))
      .map((s) => ({ seller: s, items: porVendedor.get(s.id) }));
  }, [vista, visibles, sellers]);

  const vendedoresConCartas = sellers.filter((s) => s.cards_available > 0);

  return (
    <>
      <ConfigWarning />
      <h1>Cartas en venta</h1>
      <p className="muted">Regístrate para ver cómo contactar con los vendedores.</p>

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
          {vendedoresConCartas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar">
        <div className="toggle" role="group" aria-label="Forma de ver las cartas">
          <button
            type="button"
            className={vista === 'vendedores' ? 'active' : ''}
            onClick={() => setVista('vendedores')}
          >
            Por vendedor
          </button>
          <button type="button" className={vista === 'todas' ? 'active' : ''} onClick={() => setVista('todas')}>
            Todas juntas
          </button>
        </div>
        {!loading && <span className="muted small">{visibles.length} cartas</span>}
      </div>

      {error && <div className="notice notice-error">{error}</div>}
      {loading && <p className="muted">Cargando…</p>}
      {!loading && !error && visibles.length === 0 && <div className="empty">No hay cartas que mostrar.</div>}

      {vista === 'vendedores' &&
        grupos.map((g) => (
          <SellerSection
            key={g.seller.id}
            sellerId={g.seller.id}
            name={g.seller.display_name}
            color={g.seller.color}
            // Si se filtra por un vendedor concreto se enseñan todas sus cartas
            listings={seller ? g.items : g.items.slice(0, PREVIEW)}
            total={g.items.length}
          />
        ))}

      {vista === 'todas' && (
        <>
          <div className="grid">
            {visibles.slice(0, mostradas).map((l) => (
              <CardTile key={l.id} listing={l} color={sellerMap.get(l.seller_id)?.color} />
            ))}
          </div>
          {mostradas < visibles.length && (
            <p className="more-row">
              <button type="button" className="btn btn-outline" onClick={() => setMostradas((m) => m + STEP)}>
                Mostrar más ({visibles.length - mostradas} restantes)
              </button>
            </p>
          )}
        </>
      )}
    </>
  );
}
