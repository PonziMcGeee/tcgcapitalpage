'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import CardTile from '../../../components/CardTile';
import SellerBadge from '../../../components/SellerBadge';
import FavoriteButton from '../../../components/FavoriteButton';
import Stars from '../../../components/Stars';
import ShareButton from '../../../components/ShareButton';
import SellerContact from '../../../components/SellerContact';
import { LOTE } from '../../../lib/collections';
import { sellerColor } from '../../../lib/format';
import { getSupabase } from '../../../lib/supabase';
import { useProfile } from '../../../lib/useProfile';

export default function TiendaVendedor() {
  const { id } = useParams();
  const { user } = useProfile();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null); // nombre y color públicos del vendedor
  const [contacto, setContacto] = useState(null);
  const [search, setSearch] = useState('');
  const [coleccion, setColeccion] = useState('');
  const [resenas, setResenas] = useState([]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    Promise.all([
      sb.from('listings').select('*').eq('seller_id', id).order('created_at', { ascending: false }),
      sb.from('sellers_public').select('id, display_name, color, avatar_url').eq('id', id).maybeSingle(),
      sb.from('reviews').select('*').eq('seller_id', id).order('created_at', { ascending: false }),
    ]).then(([cartas, vendedor, rs]) => {
      setResenas(rs.data || []);
      setListings(cartas.data || []);
      setInfo(vendedor.data || null);
      setLoading(false);
    });
  }, [id]);

  // El contacto solo se carga con sesión iniciada
  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !user) return;
    sb.from('profiles')
      .select('display_name, phone, telegram, instagram')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setContacto(data));
  }, [user, id]);

  const enVenta = useMemo(
    () =>
      listings
        .filter((l) => l.status === 'available')
        .filter((l) => !search || l.name.toLowerCase().includes(search.toLowerCase()))
        .filter((l) => !coleccion || l.collection === coleccion),
    [listings, search, coleccion]
  );
  // Solo las colecciones que este vendedor tiene realmente
  const colecciones = useMemo(
    () => [...new Set(listings.filter((l) => l.status === 'available' && l.collection).map((l) => l.collection))].sort(
        (x, y) => (y === LOTE) - (x === LOTE) || x.localeCompare(y)
      ),
    [listings]
  );
  const vendidas = listings.filter((l) => l.status === 'sold');

  if (loading) return <p className="muted">Cargando…</p>;

  const name = info?.display_name || listings[0]?.seller_name;
  if (!name) {
    return (
      <div className="empty">
        Esta tienda no existe. <Link href="/vendedores">Ver todos los vendedores</Link>
      </div>
    );
  }
  const color = info?.color;
  const totalEnVenta = listings.filter((l) => l.status === 'available').length;
  const media = resenas.length ? resenas.reduce((a, r) => a + r.rating, 0) / resenas.length : 0;

  return (
    <div style={{ '--seller': sellerColor(id, color) }}>
      <p className="small">
        <Link href="/vendedores">← Todos los vendedores</Link>
      </p>

      <div className="shop-hero">
        <SellerBadge id={id} name={name} color={color} avatarUrl={info?.avatar_url} size={72} />
        <div className="shop-hero-info">
          <h1>Tienda de {name}</h1>
          <p className="muted">
            {totalEnVenta} {totalEnVenta === 1 ? 'carta' : 'cartas'} en venta
          </p>
          {resenas.length > 0 && (
            <a href="#resenas" className="rating-line">
              <Stars value={media} />
              <span>
                {media.toFixed(1)} <span className="muted small">({resenas.length} {resenas.length === 1 ? 'reseña' : 'reseñas'})</span>
              </span>
            </a>
          )}
        </div>
        <div className="shop-contact">
          <div className="shop-icons">
            <FavoriteButton kind="seller" id={id} label={name} />
            <ShareButton path={`/tienda/${id}`} title={`Tienda de ${name} en AkibaTrade`} />
          </div>
          {user ? (
            <SellerContact seller={contacto} />
          ) : (
            <p className="muted small">
              <Link href="/registro">
                <strong>Crea tu cuenta</strong>
              </Link>{' '}
              para ver cómo contactar.
            </p>
          )}
        </div>
      </div>

      {(totalEnVenta > 8 || colecciones.length > 0) && (
        <div className={`filters ${colecciones.length > 0 ? 'filters-2' : 'filters-1'}`}>
          <input
            type="text"
            placeholder={`Buscar en la tienda de ${name}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {colecciones.length > 0 && (
            <select value={coleccion} onChange={(e) => setColeccion(e.target.value)}>
              <option value="">Todas las colecciones</option>
              {colecciones.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {enVenta.length === 0 && <div className="empty">No hay cartas que mostrar.</div>}
      <div className="grid">
        {enVenta.map((l) => (
          <CardTile key={l.id} listing={l} showSeller={false} color={color} />
        ))}
      </div>

      {vendidas.length > 0 && !search && !coleccion && (
        <>
          <h2 style={{ marginTop: 36 }}>Vendidas</h2>
          <div className="grid grid-sold">
            {vendidas.map((l) => (
              <CardTile key={l.id} listing={l} showSeller={false} color={color} />
            ))}
          </div>
        </>
      )}

      <section id="resenas" style={{ marginTop: 36 }}>
        <h2>Reseñas de compradores</h2>
        {resenas.length === 0 && <p className="muted">Este vendedor todavía no tiene reseñas.</p>}
        {resenas.map((r) => (
          <div className="review" key={r.id}>
            <div className="review-head">
              <strong>{r.buyer_name || 'Comprador'}</strong>
              <Stars value={r.rating} size={18} />
            </div>
            {r.listing_name && <p className="muted small" style={{ margin: '2px 0 0' }}>Compró: {r.listing_name}</p>}
            {r.comment && <p>{r.comment}</p>}
            <p className="muted small">{new Date(r.created_at).toLocaleDateString('es-ES')}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
