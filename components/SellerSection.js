import Link from 'next/link';
import { sellerColor } from '../lib/format';
import CardTile from './CardTile';
import SellerBadge from './SellerBadge';

// Bloque con las cartas de un único vendedor, con su nombre y color.
export default function SellerSection({ sellerId, name, listings }) {
  return (
    <section className="seller-section" style={{ '--seller': sellerColor(sellerId) }}>
      <div className="seller-head">
        <SellerBadge id={sellerId} name={name} />
        <div>
          <h2>{name}</h2>
          <p className="muted small">
            {listings.length} {listings.length === 1 ? 'carta' : 'cartas'} en venta
          </p>
        </div>
        <Link href={`/tienda/${sellerId}`} className="seller-head-link">
          Ver tienda →
        </Link>
      </div>
      <div className="grid">
        {listings.map((l) => (
          <CardTile key={l.id} listing={l} showSeller={false} />
        ))}
      </div>
    </section>
  );
}
