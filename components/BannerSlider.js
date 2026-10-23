'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

function BannerButton({ banner }) {
  if (!banner.link_url) return null;
  const text = banner.button_text || 'Ver más';
  const interno = banner.link_url.startsWith('/');
  return interno ? (
    <Link href={banner.link_url} className="btn banner-btn">
      {text}
    </Link>
  ) : (
    <a href={banner.link_url} target="_blank" rel="noreferrer" className="btn banner-btn">
      {text}
    </a>
  );
}

// Slider de banners de la portada (imagen + título + botón), con flechas y puntos.
export default function BannerSlider({ banners }) {
  const [actual, setActual] = useState(0);
  const total = banners.length;

  const siguiente = useCallback(() => setActual((v) => (v + 1) % total), [total]);
  const anterior = () => setActual((v) => (v - 1 + total) % total);

  // Pasa solo cada 6 segundos; al cambiar a mano se reinicia la cuenta
  useEffect(() => {
    if (total < 2) return undefined;
    const t = setInterval(siguiente, 6000);
    return () => clearInterval(t);
  }, [total, siguiente, actual]);

  if (total === 0) return null;

  return (
    <div className="banner-slider">
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`banner-slide ${i === actual ? 'active' : ''}`}
          style={{ backgroundImage: `url(${b.image_url})` }}
          aria-hidden={i !== actual}
        >
          {(b.title || b.subtitle || b.link_url) && (
            <div className={`banner-text ${!b.title && !b.subtitle ? 'banner-text-solo' : ''}`}>
              {b.title && <h2>{b.title}</h2>}
              {b.subtitle && <p>{b.subtitle}</p>}
              <BannerButton banner={b} />
            </div>
          )}
        </div>
      ))}

      {total > 1 && (
        <>
          <button type="button" className="banner-arrow banner-prev" onClick={anterior} aria-label="Anterior">
            ‹
          </button>
          <button type="button" className="banner-arrow banner-next" onClick={siguiente} aria-label="Siguiente">
            ›
          </button>
          <div className="banner-dots">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                className={i === actual ? 'active' : ''}
                onClick={() => setActual(i)}
                aria-label={`Ir al banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
