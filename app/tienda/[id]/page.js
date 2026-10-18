'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
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
  const [info, setInfo] = useState(null); // nombre y color públicos del vendedor
  const [contacto, setContacto] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    Promise.all([
      sb.from('listings').select('*').eq('seller_id', id).order('created_at', { ascending: false }),
      sb.from('sellers_public').select('id, display_name, color').eq('id', id).maybeSingle(),
    ]).then(([cartas, vendedor]) => {
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
        .filter((l) => !search || l.name.toLowerCase().includes(search.toLowerCase())),
    [listings, search]
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

  return (
    <div style={{ '--seller': sellerColor(id, color) }}>
      <p className="small">
        <Link href="/vendedores">← Todos los vendedores</Link>
      </p>

      <div className="shop-hero">
        <SellerBadge id={id} name={name} color={color} size={72} />
        <div className="shop-hero-info">
          <h1>Tienda de {name}</h1>
          <p className="muted">
            {totalEnVenta} {totalEnVenta === 1 ? 'carta' : 'cartas'} en venta
          </p>
        </div>
        <div className="shop-contact">
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

      {totalEnVenta > 8 && (
        <div className="filters" style={{ gridTemplateColumns: '1fr' }}>
          <input
            type="text"
            placeholder={`Buscar en la tienda de ${name}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {enVenta.length === 0 && <div className="empty">No hay cartas que mostrar.</div>}
      <div className="grid">
        {enVenta.map((l) => (
          <CardTile key={l.id} listing={l} showSeller={false} color={color} />
        ))}
      </div>

      {vendidas.length > 0 && !search && (
        <>
          <h2 style={{ marginTop: 36 }}>Vendidas</h2>
          <div className="grid grid-sold">
            {vendidas.map((l) => (
              <CardTile key={l.id} listing={l} showSeller={false} color={color} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
