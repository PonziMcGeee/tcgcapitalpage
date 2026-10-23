'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import CardTile from '../../components/CardTile';
import ConfigWarning from '../../components/ConfigWarning';
import SellerCard from '../../components/SellerCard';
import { deriveSellers, fetchAllAvailable, fetchRatings, fetchSellers } from '../../lib/data';
import { getSupabase } from '../../lib/supabase';

const norm = (s) =>
  (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

function Resultados() {
  const q = useSearchParams().get('q') || '';
  const [listings, setListings] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [ratings, setRatings] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    fetchRatings(sb).then(setRatings);
    Promise.all([fetchAllAvailable(sb), fetchSellers(sb)]).then(([cartas, vendedores]) => {
      if (cartas.error) setError('No se han podido cargar las cartas.');
      else {
        setListings(cartas.data);
        setSellers(vendedores.error ? deriveSellers(cartas.data) : vendedores.data);
      }
      setLoading(false);
    });
  }, []);

  const sellerMap = useMemo(() => new Map(sellers.map((s) => [s.id, s])), [sellers]);
  const palabras = norm(q).split(/\s+/).filter(Boolean);

  const { cartas, vendedores, colecciones } = useMemo(() => {
    if (palabras.length === 0) return { cartas: [], vendedores: [], colecciones: [] };
    const todas = (texto) => palabras.every((p) => texto.includes(p));
    const cartas = listings.filter((l) =>
      todas(norm(`${l.name} ${l.collection || ''} ${sellerMap.get(l.seller_id)?.display_name || ''}`))
    );
    const vendedores = sellers.filter((s) => todas(norm(s.display_name)));
    const cuenta = new Map();
    listings.forEach((l) => {
      if (l.collection && todas(norm(l.collection))) cuenta.set(l.collection, (cuenta.get(l.collection) || 0) + 1);
    });
    const colecciones = [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
    return { cartas, vendedores, colecciones };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, listings, sellers, sellerMap]);

  const hayBusqueda = palabras.length > 0;
  const sinResultados = hayBusqueda && !loading && cartas.length + vendedores.length + colecciones.length === 0;

  return (
    <>
      <ConfigWarning />
      <h1>Buscar</h1>
      {error && <div className="notice notice-error">{error}</div>}
      {loading && <p className="muted">Cargando…</p>}
      {!hayBusqueda && !loading && (
        <p className="muted">Escribe el nombre de una carta, un vendedor o una colección.</p>
      )}
      {sinResultados && <div className="empty">No hemos encontrado nada para «{q}». Prueba con otra palabra.</div>}

      {colecciones.length > 0 && (
        <section className="search-section">
          <h2>Colecciones</h2>
          <div className="chips">
            {colecciones.slice(0, 12).map(([c, n]) => (
              <Link key={c} href={`/catalogo?coleccion=${encodeURIComponent(c)}`} className="chip">
                {c} <span className="muted small">· {n}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {vendedores.length > 0 && (
        <section className="search-section">
          <h2>Vendedores</h2>
          <div className="grid">
            {vendedores.slice(0, 8).map((s) => (
              <SellerCard key={s.id} seller={s} rating={ratings.get(s.id)} />
            ))}
          </div>
        </section>
      )}

      {cartas.length > 0 && (
        <section className="search-section">
          <h2>Cartas ({cartas.length})</h2>
          <div className="grid">
            {cartas.slice(0, 48).map((l) => (
              <CardTile key={l.id} listing={l} color={sellerMap.get(l.seller_id)?.color} />
            ))}
          </div>
          {cartas.length > 48 && (
            <p className="more-row">
              <Link href="/catalogo" className="btn btn-outline">
                Ver todas en el catálogo
              </Link>
            </p>
          )}
        </section>
      )}
    </>
  );
}

export default function Buscar() {
  return (
    <Suspense fallback={<p className="muted">Cargando…</p>}>
      <Resultados />
    </Suspense>
  );
}
