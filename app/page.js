'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BannerSlider from '../components/BannerSlider';
import CardCarousel from '../components/CardCarousel';
import FeaturedSellers from '../components/FeaturedSellers';
import ConfigWarning from '../components/ConfigWarning';
import Marquee from '../components/Marquee';
import SellerCard from '../components/SellerCard';
import { fetchSellers } from '../lib/data';
import { fetchHome } from '../lib/home';
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
    icono: '💶',
    titulo: 'Precio claro',
    texto: 'Ves el precio de la carta, el envío según tu destino y el total antes de escribir a nadie.',
  },
  {
    icono: '🤝',
    titulo: 'Trato directo',
    texto: 'Conversación directa con cada vendedor, sin intermediarios ni comisiones.',
  },
  {
    icono: '📷',
    titulo: 'Fotos reales',
    texto: 'Cada anuncio enseña la carta real por delante y por detrás para que sepas qué compras.',
  },
];

const VENDEDORES_EN_PORTADA = 8;

export default function Inicio() {
  const { user } = useProfile();
  const [latest, setLatest] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [home, setHome] = useState({ banners: [], collections: [], sellerMap: new Map(), featured: [] });
  // Hasta que no llegan los banners y carruseles no se enseña nada por defecto (evita el parpadeo)
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setCargado(true);
      return;
    }
    fetchHome(sb)
      .then(setHome)
      .finally(() => setCargado(true));
    sb.from('listings')
      .select('id, name, price, front_url, thumb_url')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => setLatest(data || []));
    fetchSellers(sb).then(({ data }) => setSellers(data || []));
  }, []);

  const { banners, collections, sellerMap, featured } = home;
  const hayCarruselDeVendedores = collections.some((c) => c.kind === 'sellers');

  const conCartas = sellers
    .filter((s) => s.cards_available > 0)
    .sort((a, b) => b.cards_available - a.cards_available || a.display_name.localeCompare(b.display_name));

  return (
    <>
      <ConfigWarning />

      {!cargado ? (
        <div className="banner-slider banner-skeleton" aria-hidden="true" />
      ) : banners.length > 0 ? (
        <BannerSlider banners={banners} />
      ) : (
        <section className="hero">
          <p className="hero-kicker">カード · Compra y venta de cartas TCG</p>
          <h1 className="hero-title">
            Encuentra tus cartas favoritas, <span>directo del vendedor</span>
          </h1>
          <p className="hero-text">
            AkibaTrade es un mercado de cartas coleccionables donde cada vendedor tiene su propia tienda, con fotos
            reales y precio claro. Tú eliges, hablas con ellos y te la enviamos a casa.
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
      )}

      {/* Carruseles que elige el administrador. Si no hay ninguno, se enseñan las últimas cartas. */}
      {!cargado ? (
        <section className="home-section" aria-hidden="true">
          <div className="skeleton-line" />
          <div className="skeleton-row">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        </section>
      ) : collections.length > 0 ? (
        collections.map((c) => (
          <section className="home-section" key={c.id}>
            <div className="section-head">
              <h2>{c.title}</h2>
              <Link href={c.kind === 'sellers' ? '/vendedores' : '/catalogo'} className="small">
                {c.kind === 'sellers' ? 'Ver todos →' : 'Ver catálogo →'}
              </Link>
            </div>
            {c.subtitle && <p className="muted">{c.subtitle}</p>}
            {c.kind === 'sellers' ? (
              <Marquee
                items={c.sellers}
                minItems={6}
                label={c.title}
                renderItem={(s, duplicada) => (
                  <div className="marquee-seller" aria-hidden={duplicada ? true : undefined}>
                    <SellerCard seller={s} />
                  </div>
                )}
              />
            ) : (
              <CardCarousel listings={c.cards} label={c.title} />
            )}
          </section>
        ))
      ) : (
        <section className="home-section">
          <div className="section-head">
            <h2>{latest.length > 0 ? 'Últimas cartas añadidas' : 'Pronto, las primeras cartas'}</h2>
            <Link href="/catalogo" className="small">
              Ver todas →
            </Link>
          </div>
          <CardCarousel listings={latest} />
        </section>
      )}

      {cargado && <FeaturedSellers featured={featured} />}

      {cargado && featured.length === 0 && !hayCarruselDeVendedores && conCartas.length > 0 && (
        <section className="home-section">
          <div className="section-head">
            <h2>Nuestros vendedores</h2>
            <Link href="/vendedores" className="small">
              Ver los {sellers.length} vendedores →
            </Link>
          </div>
          <p className="muted">Cada uno tiene su propia tienda con sus cartas.</p>
          <div className="sellers-grid">
            {conCartas.slice(0, VENDEDORES_EN_PORTADA).map((s) => (
              <SellerCard key={s.id} seller={s} />
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
              <h3 className="step-title">
                <span className="step-icon" aria-hidden="true">
                  {v.icono}
                </span>
                {v.titulo}
              </h3>
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
