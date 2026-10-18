'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import CardTile from '../../../components/CardTile';
import SellerBadge from '../../../components/SellerBadge';
import SellerContact from '../../../components/SellerContact';
import { sellerColor } from '../../../lib/format';
import { getSupabase } from '../../../lib/supabase';
import { useProfile } from '../../../lib/useProfile';

export default function TiendaVendedor() {
  const { id } = useParams();
  const { user } = useProfile();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    sb.from('listings')
      .select('*')
      .eq('seller_id', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings(data || []);
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
      .then(({ data }) => setSeller(data));
  }, [user, id]);

  if (loading) return <p className="muted">Cargando…</p>;

  const name = listings[0]?.seller_name || seller?.display_name;
  if (!name) {
    return (
      <div className="empty">
        Esta tienda no existe o todavía no tiene cartas. <Link href="/catalogo">Volver al catálogo</Link>
      </div>
    );
  }

  const enVenta = listings.filter((l) => l.status === 'available');
  const vendidas = listings.filter((l) => l.status === 'sold');

  return (
    <div style={{ '--seller': sellerColor(id) }}>
      <p className="small">
        <Link href="/catalogo">← Volver al catálogo</Link>
      </p>

      <div className="shop-hero">
        <SellerBadge id={id} name={name} size={72} />
        <div className="shop-hero-info">
          <h1>Tienda de {name}</h1>
          <p className="muted">
            {enVenta.length} {enVenta.length === 1 ? 'carta' : 'cartas'} en venta
          </p>
        </div>
        <div className="shop-contact">
          {user ? (
            <SellerContact seller={seller} />
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

      {enVenta.length === 0 && <div className="empty">Ahora mismo no tiene cartas en venta.</div>}
      <div className="grid">
        {enVenta.map((l) => (
          <CardTile key={l.id} listing={l} showSeller={false} />
        ))}
      </div>

      {vendidas.length > 0 && (
        <>
          <h2 style={{ marginTop: 36 }}>Vendidas</h2>
          <div className="grid grid-sold">
            {vendidas.map((l) => (
              <CardTile key={l.id} listing={l} showSeller={false} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
