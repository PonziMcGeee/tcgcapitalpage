'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import CardCarousel from '../components/CardCarousel';
import ConfigWarning from '../components/ConfigWarning';
import SellerBadge from '../components/SellerBadge';
import { sellerColor } from '../lib/format';
import { getSupabase } from '../lib/supabase';
import { useProfile } from '../lib/useProfile';

const PASOS = [
  {
    titulo: 'Explora el catálogo',
    texto: 'Busca por nombre, juego o vendedor. Cada carta tiene foto por delante y por detrás.',
  },
  {
    titulo: 'Crea tu cuenta y contacta',
    texto: 'Con tu cuenta ves los botones para escribir al vendedor por WhatsApp, Telegram o Instagram.',
  },
  {
    titulo: 'Acordad pago y envío',
    texto: 'Hablas directamente con el vendedor y os ponéis de acuerdo. Enviamos a España y a toda Europa.',
  },
];

const VENTAJAS = [
  {
    titulo: 'Precio claro',
    texto: 'Ves el precio de la carta, el envío según tu destino y el total antes de escribir a nadie.',
  },
  {
    titulo: 'Trato directo',
    texto: 'Pocos vendedores y conversación directa con ellos, sin intermediarios ni comisiones.',
  },
  {
    titulo: 'Fotos reales',
    texto: 'Cada anuncio enseña la carta real por delante y por detrás para que sepas qué compras.',
  },
];

export default function Inicio() {
  const { user } = useProfile();
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.from('listings')
      .select('id, name, price, front_url, seller_id, seller_name')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .then(({ data }) => setListings(data || []));
  }, []);

  // Vendedores con cartas en venta, y cuántas tiene cada uno
  const vendedores = [];
  listings.forEach((l) => {
    const v = vendedores.find((x) => x.id === l.seller_id);
    if (v) v.total += 1;
    else vendedores.push({ id: l.seller_id, name: l.seller_name, total: 1 });
  });
  vendedores.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <ConfigWarning />

      <section className="hero">
        <p className="hero-kicker">Compra y venta de cartas TCG</p>
        <h1 className="hero-title">
          Encuentra tus cartas favoritas, <span>directo del vendedor</span>
        </h1>
        <p className="hero-text">
          TCG Capital es un pequeño mercado de cartas coleccionables donde unos pocos vendedores publican sus cartas con
          fotos reales y precio claro. Tú eliges, hablas con ellos y te la enviamos a casa.
        </p>
        <div className="hero-actions">
          <Link href="/catalogo" className="btn btn-light">
            Ver catálogo
          </Link>
          {!user && (
            <Link href="/registro" className="btn btn-ghost">
              Crear cuenta
            </Link>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <h2>{listings.length > 0 ? 'Últimas cartas añadidas' : 'Pronto, las primeras cartas'}</h2>
          <Link href="/catalogo" className="small">
            Ver todas →
          </Link>
        </div>
        <CardCarousel listings={listings.slice(0, 12)} />
      </section>

      {vendedores.length > 0 && (
        <section className="home-section">
          <h2>Nuestros vendedores</h2>
          <p className="muted">Cada uno tiene su propia tienda con sus cartas.</p>
          <div className="sellers-grid">
            {vendedores.map((v) => (
              <Link
                key={v.id}
                href={`/tienda/${v.id}`}
                className="seller-card"
                style={{ '--seller': sellerColor(v.id) }}
              >
                <SellerBadge id={v.id} name={v.name} size={56} />
                <strong>{v.name}</strong>
                <span className="muted small">
                  {v.total} {v.total === 1 ? 'carta' : 'cartas'} en venta
                </span>
                <span className="seller-card-link">Ver tienda →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="home-section">
        <h2>Cómo funciona</h2>
        <div className="steps">
          {PASOS.map((p, i) => (
            <div className="step" key={p.titulo}>
              <span className="step-num">{i + 1}</span>
              <h3>{p.titulo}</h3>
              <p className="muted">{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2>Por qué comprar aquí</h2>
        <div className="steps">
          {VENTAJAS.map((v) => (
            <div className="step" key={v.titulo}>
              <h3>{v.titulo}</h3>
              <p className="muted">{v.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <h2>¿Buscas una carta?</h2>
        <p>Échale un vistazo al catálogo o crea tu cuenta para contactar con los vendedores.</p>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <Link href="/catalogo" className="btn btn-light">
            Ir al catálogo
          </Link>
          {!user && (
            <Link href="/registro" className="btn btn-ghost">
              Crear cuenta
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
