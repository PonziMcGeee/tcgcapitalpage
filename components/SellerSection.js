import Link from 'next/link';
import { sellerColor } from '../lib/format';
import CardTile from './CardTile';
import SellerBadge from './SellerBadge';

// Bloque con las cartas de un único vendedor, con su nombre y color.
// `listings` son las que se muestran; `total` es cuántas tiene en total (puede ser más que las mostradas).
export default function SellerSection({ sellerId, name, color, listings, total }) {
  const resto = total - listings.length;
  return (
    <section className="seller-section" style={{ '--seller': sellerColor(sellerId, color) }}>
      <div className="seller-head">
        <SellerBadge id={sellerId} name={name} color={color} />
        <div>
          <h2>{name}</h2>
          <p className="muted small">
            {total} {total === 1 ? 'carta' : 'cartas'}
          </p>
        </div>
        <Link href={`/tienda/${sellerId}`} className="seller-head-link">
          Ver tienda →
        </Link>
      </div>
      <div className="grid">
        {listings.map((l) => (
          <CardTile key={l.id} listing={l} showSeller={false} color={color} />
        ))}
      </div>
      {resto > 0 && (
        <p className="more-row">
          <Link href={`/tienda/${sellerId}`} className="more-link">
            Ver las {total} cartas de {name} →
          </Link>
        </p>
      )}
    </section>
  );
}
