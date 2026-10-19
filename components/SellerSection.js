import Link from 'next/link';
import { sellerColor } from '../lib/format';
import CardTile from './CardTile';
import SellerBadge from './SellerBadge';
import ShareButton from './ShareButton';

// Bloque con las cartas de un único vendedor, con su nombre y color.
// `listings` son las que se muestran; `total` es cuántas tiene en total (puede ser más que las mostradas).
export default function SellerSection({ sellerId, name, color, avatarUrl, listings, total }) {
  const resto = total - listings.length;
  return (
    <section className="seller-section" style={{ '--seller': sellerColor(sellerId, color) }}>
      <div className="seller-head">
        <SellerBadge id={sellerId} name={name} color={color} avatarUrl={avatarUrl} />
        <div>
          <h2>{name}</h2>
          <p className="muted small">
            {total} {total === 1 ? 'carta' : 'cartas'}
          </p>
        </div>
        <div className="seller-head-actions">
          <ShareButton path={`/tienda/${sellerId}`} title={`Tienda de ${name} en AkibaTrade`} />
          <Link href={`/tienda/${sellerId}`} className="seller-head-link">
            Ver tienda →
          </Link>
        </div>
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
