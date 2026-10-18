import Link from 'next/link';
import { sellerColor } from '../lib/format';
import SellerBadge from './SellerBadge';

// Hasta dos banners con los vendedores que el administrador ha elegido a mano.
export default function FeaturedSellers({ featured }) {
  if (!featured || featured.length === 0) return null;
  return (
    <section className="home-section">
      <div className={`featured-grid ${featured.length === 1 ? 'featured-one' : ''}`}>
        {featured.map(({ seller, label }) => {
          const n = seller.cards_available;
          return (
            <Link
              key={seller.id}
              href={`/tienda/${seller.id}`}
              className="featured-card"
              style={{ '--seller': sellerColor(seller.id, seller.color) }}
            >
              <SellerBadge
                id={seller.id}
                name={seller.display_name}
                color={seller.color}
                avatarUrl={seller.avatar_url}
                size={88}
              />
              <div className="featured-info">
                <span className="featured-kicker">{label || 'Vendedor destacado'}</span>
                <strong className="featured-name">{seller.display_name}</strong>
                <span className="featured-count">
                  {n === 0 ? 'Sin cartas ahora mismo' : `${n} ${n === 1 ? 'carta' : 'cartas'} en venta`}
                </span>
                <span className="featured-link">Ver tienda →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
