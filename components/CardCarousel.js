import Link from 'next/link';
import { euros } from '../lib/format';
import Marquee from './Marquee';

// Carrusel infinito de cartas (el de la portada, tanto el predefinido como los que crea el administrador).
// Si no hay cartas, muestra cartas decorativas.
export default function CardCarousel({ listings, label = 'Cartas' }) {
  const items = listings.length > 0 ? listings : Array.from({ length: 8 }, (_, i) => ({ id: `demo-${i}`, demo: true, n: i }));

  return (
    <Marquee
      items={items}
      label={label}
      renderItem={(l, duplicada) =>
        l.demo ? (
          <div className={`marquee-card demo demo-${l.n % 4}`} aria-hidden="true">
            <span>TCG</span>
          </div>
        ) : (
          <Link
            href={`/carta/${l.id}`}
            className="marquee-card"
            aria-hidden={duplicada ? true : undefined}
            tabIndex={duplicada ? -1 : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.thumb_url || l.front_url} alt={l.name} loading="lazy" />
            {l.status === 'sold' && <span className="sold-tag">Vendida</span>}
            <span className="marquee-price">{euros(l.price)}</span>
          </Link>
        )
      }
    />
  );
}
