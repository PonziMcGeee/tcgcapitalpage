import Link from 'next/link';
import { sellerColor } from '../lib/format';
import FavoriteButton from './FavoriteButton';
import SellerBadge from './SellerBadge';

// Tarjeta de un vendedor (para la portada y el directorio). `seller` viene de la vista sellers_public.
export default function SellerCard({ seller }) {
  const n = seller.cards_available;
  return (
    <Link
      href={`/tienda/${seller.id}`}
      className="seller-card"
      style={{ '--seller': sellerColor(seller.id, seller.color) }}
    >
      <FavoriteButton kind="seller" id={seller.id} label={seller.display_name} className="fav-corner" />
      <SellerBadge id={seller.id} name={seller.display_name} color={seller.color} avatarUrl={seller.avatar_url} size={64} />
      <strong>{seller.display_name}</strong>
      <span className="muted small">
        {n === 0 ? 'Sin cartas ahora mismo' : `${n} ${n === 1 ? 'carta' : 'cartas'} en venta`}
      </span>
      <span className="seller-card-link">Ver tienda →</span>
    </Link>
  );
}
