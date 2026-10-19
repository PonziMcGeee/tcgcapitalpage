import Link from 'next/link';
import FavoriteButton from './FavoriteButton';
import { conditionLabel, euros, gameLabel, sellerColor } from '../lib/format';

export default function CardTile({ listing, showSeller = true, color }) {
  return (
    <Link
      href={`/carta/${listing.id}`}
      className="tile"
      style={{ '--seller': sellerColor(listing.seller_id, color) }}
    >
      <div className="tile-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={listing.thumb_url || listing.front_url} alt={listing.name} loading="lazy" />
        {listing.condition && <span className="cond-tag" title={conditionLabel(listing.condition)}>{listing.condition}</span>}
        <FavoriteButton kind="card" id={listing.id} label={listing.name} className="fav-corner" />
        {listing.status === 'sold' && <span className="sold-tag">Vendida</span>}
      </div>
      <div className="tile-body">
        <h3>{listing.name}</h3>
        <p className="muted">{gameLabel(listing)}</p>
        <p className="tile-price">{euros(listing.price)}</p>
        {showSeller && <p className="muted small">Vende {listing.seller_name}</p>}
      </div>
    </Link>
  );
}
