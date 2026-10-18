import Link from 'next/link';
import { euros } from '../lib/format';

// Carrusel infinito de cartas. Si todavía no hay cartas publicadas, muestra cartas decorativas.
export default function CardCarousel({ listings }) {
  const hayCartas = listings.length > 0;

  let items = hayCartas ? listings : Array.from({ length: 8 }, (_, i) => ({ id: `demo-${i}`, demo: true, n: i }));
  // Se repite la lista hasta que haya suficientes para que el bucle no deje huecos
  while (items.length < 8) items = items.concat(items);
  const loop = [...items, ...items];

  return (
    <div className="marquee" aria-label="Cartas recientes">
      <div className="marquee-track" style={{ animationDuration: `${items.length * 4}s` }}>
        {loop.map((l, i) => {
          const duplicada = i >= items.length;
          if (l.demo) {
            return (
              <div key={`${l.id}-${i}`} className={`marquee-card demo demo-${l.n % 4}`} aria-hidden="true">
                <span>TCG</span>
              </div>
            );
          }
          return (
            <Link
              key={`${l.id}-${i}`}
              href={`/carta/${l.id}`}
              className="marquee-card"
              aria-hidden={duplicada ? true : undefined}
              tabIndex={duplicada ? -1 : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.front_url} alt={l.name} loading="lazy" />
              <span className="marquee-price">{euros(l.price)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
