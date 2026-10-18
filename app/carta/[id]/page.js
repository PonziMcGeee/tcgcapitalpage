'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SellerBadge from '../../../components/SellerBadge';
import SellerContact from '../../../components/SellerContact';
import { euros } from '../../../lib/format';
import { getSupabase } from '../../../lib/supabase';
import { useProfile } from '../../../lib/useProfile';

export default function DetalleCarta() {
  const { id } = useParams();
  const { user } = useProfile();
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [destino, setDestino] = useState('spain');
  const [color, setColor] = useState(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    sb.from('listings')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setListing(data);
        setLoading(false);
      });
  }, [id]);

  // El contacto del vendedor solo se carga si hay sesión iniciada
  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !user || !listing) return;
    sb.from('profiles')
      .select('display_name, phone, telegram, instagram')
      .eq('id', listing.seller_id)
      .maybeSingle()
      .then(({ data }) => setSeller(data));
  }, [user, listing]);

  // Color público de la tienda del vendedor
  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !listing) return;
    sb.from('sellers_public')
      .select('color')
      .eq('id', listing.seller_id)
      .maybeSingle()
      .then(({ data }) => setColor(data?.color || null));
  }, [listing]);

  if (loading) return <p className="muted">Cargando…</p>;
  if (!listing) {
    return (
      <div className="empty">
        Esta carta no existe. <Link href="/catalogo">Volver al catálogo</Link>
      </div>
    );
  }

  const envio = destino === 'spain' ? listing.shipping_spain : listing.shipping_europe;
  const total = Number(listing.price) + Number(envio);
  const vendida = listing.status === 'sold';

  return (
    <>
      <p className="small">
        <Link href="/catalogo">← Volver al catálogo</Link>
      </p>
      <div className="detail">
        <div className="detail-photos">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={listing.front_url} alt={`${listing.name} (delante)`} />
            <figcaption>Delante</figcaption>
          </figure>
          <figure>
            {listing.back_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.back_url} alt={`${listing.name} (detrás)`} />
            ) : (
              <div className="empty small">Sin foto trasera</div>
            )}
            <figcaption>Detrás</figcaption>
          </figure>
        </div>

        <div className="panel">
          <span className={`badge ${vendida ? 'badge-sold' : ''}`}>{vendida ? 'Vendida' : listing.game}</span>
          {listing.collection && <span className="badge" style={{ marginLeft: 6 }}>{listing.collection}</span>}
          <h1 style={{ marginTop: 8 }}>{listing.name}</h1>
          <Link href={`/tienda/${listing.seller_id}`} className="seller-link">
            <SellerBadge id={listing.seller_id} name={listing.seller_name} color={color} size={30} />
            <span>
              Vende <strong>{listing.seller_name}</strong> · ver su tienda
            </span>
          </Link>
          {listing.description && <p>{listing.description}</p>}

          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="destino">Enviar a</label>
            <select id="destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
              <option value="spain">España</option>
              <option value="europe">Resto de Europa</option>
            </select>
          </div>

          <div className="price-box">
            <div className="price-line">
              <span>Carta</span>
              <span>{euros(listing.price)}</span>
            </div>
            <div className="price-line">
              <span>Envío</span>
              <span>{euros(envio)}</span>
            </div>
            <div className="price-line price-total">
              <span>Total</span>
              <span>{euros(total)}</span>
            </div>
          </div>

          {vendida && <div className="notice notice-error">Esta carta ya se ha vendido.</div>}

          {!vendida && !user && (
            <div className="notice notice-warn">
              Para contactar con el vendedor necesitas una cuenta.{' '}
              <Link href="/registro">
                <strong>Crear cuenta</strong>
              </Link>{' '}
              o <Link href="/login">entrar</Link>.
            </div>
          )}

          {!vendida && user && (
            <div className="contact">
              <strong>Contactar con {listing.seller_name}</strong>
              <SellerContact seller={seller} />
              <p className="muted small">
                Acordad con el vendedor el pago y el envío. Indícale la carta y el destino ({destino === 'spain' ? 'España' : 'Europa'}).
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
