'use client';

import Link from 'next/link';
import { useRef } from 'react';

// Fila deslizable con flechas. Cada hijo se envuelve en un hueco de ancho fijo.
export default function ItemCarousel({ title, subtitle, moreHref, moreText, children }) {
  const ref = useRef(null);

  function mover(direccion) {
    const el = ref.current;
    if (el) el.scrollBy({ left: direccion * el.clientWidth * 0.8, behavior: 'smooth' });
  }

  return (
    <section className="home-section">
      <div className="section-head">
        <h2>{title}</h2>
        <div className="carousel-controls">
          {moreHref && (
            <Link href={moreHref} className="small">
              {moreText || 'Ver todo →'}
            </Link>
          )}
          <button type="button" onClick={() => mover(-1)} aria-label="Anterior">
            ‹
          </button>
          <button type="button" onClick={() => mover(1)} aria-label="Siguiente">
            ›
          </button>
        </div>
      </div>
      {subtitle && <p className="muted">{subtitle}</p>}
      <div className="row-carousel" ref={ref}>
        {children}
      </div>
    </section>
  );
}
