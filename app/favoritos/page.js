'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import CardTile from '../../components/CardTile';
import ConfigWarning from '../../components/ConfigWarning';
import SellerCard from '../../components/SellerCard';
import { fetchAllAvailable, fetchRatings, fetchSellers } from '../../lib/data';
import { getSupabase } from '../../lib/supabase';
import { useFavorites } from '../../lib/useFavorites';

export default function Favoritos() {
  const favs = useFavorites();
  const [listings, setListings] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('cartas');
  const [ratings, setRatings] = useState(new Map());

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    fetchRatings(sb).then(setRatings);
    Promise.all([fetchAllAvailable(sb), fetchSellers(sb)]).then(([cartas, vendedores]) => {
      setListings(cartas.data || []);
      setSellers(vendedores.data || []);
      setLoading(false);
    });
  }, []);

  const sellerMap = useMemo(() => new Map(sellers.map((s) => [s.id, s])), [sellers]);
  const cartas = listings.filter((l) => favs.cards.has(l.id));
  const vendedores = sellers.filter((s) => favs.sellers.has(s.id));

  if (favs.loaded && !favs.logged) {
    return (
      <>
        <ConfigWarning />
        <h1>Favoritos</h1>
        <div className="empty">
          Necesitas una cuenta para guardar favoritos. <Link href="/login">Entrar</Link> o{' '}
          <Link href="/registro">crear cuenta</Link>.
        </div>
      </>
    );
  }

  return (
    <>
      <ConfigWarning />
      <h1>Favoritos</h1>
      <p className="muted">Las cartas y vendedores que has marcado con el corazón.</p>

      <div className="toolbar">
        <div className="toggle" role="group" aria-label="Tipo de favoritos">
          <button type="button" className={tab === 'cartas' ? 'active' : ''} onClick={() => setTab('cartas')}>
            Cartas ({cartas.length})
          </button>
          <button type="button" className={tab === 'vendedores' ? 'active' : ''} onClick={() => setTab('vendedores')}>
            Vendedores ({vendedores.length})
          </button>
        </div>
      </div>

      {loading && <p className="muted">Cargando…</p>}

      {!loading && tab === 'cartas' && (
        <>
          {cartas.length === 0 && (
            <div className="empty">
              Aún no tienes cartas favoritas. Pulsa el ♥ en cualquier carta del <Link href="/catalogo">catálogo</Link>.
            </div>
          )}
          <div className="grid">
            {cartas.map((l) => (
              <CardTile key={l.id} listing={l} color={sellerMap.get(l.seller_id)?.color} />
            ))}
          </div>
        </>
      )}

      {!loading && tab === 'vendedores' && (
        <>
          {vendedores.length === 0 && (
            <div className="empty">
              Aún no tienes vendedores favoritos. Pulsa el ♥ en un vendedor de <Link href="/vendedores">Vendedores</Link>.
            </div>
          )}
          <div className="sellers-grid">
            {vendedores.map((s) => (
              <SellerCard key={s.id} seller={s} rating={ratings.get(s.id)} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
