import { sellerColor } from '../lib/format';

// Círculo con la inicial del vendedor y su color propio.
export default function SellerBadge({ id, name, size = 40 }) {
  return (
    <span
      className="avatar"
      style={{ background: sellerColor(id), width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {String(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}
