import Link from 'next/link';
import { euros } from '../lib/format';

export default function CardTile({ listing }) {
  return (
    <Link href={`/carta/${listing.id}`} className="tile">
      <div className="tile-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={listing.front_url} alt={listing.name} loading="lazy" />
      </div>
      <div className="tile-body">
        <h3>{listing.name}</h3>
        <p className="muted">
          {listing.game} · {listing.condition}
        </p>
        <p className="tile-price">{euros(listing.price)}</p>
        <p className="muted small">Vende {listing.seller_name}</p>
      </div>
    </Link>
  );
}
