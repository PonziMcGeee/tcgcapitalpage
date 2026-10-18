import { sellerColor } from '../lib/format';

// Círculo con la foto del vendedor (o, si no la tiene, su inicial) y su color propio.
export default function SellerBadge({ id, name, color, avatarUrl, size = 40 }) {
  const c = sellerColor(id, color);
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="avatar avatar-img"
        src={avatarUrl}
        alt=""
        loading="lazy"
        style={{ width: size, height: size, borderColor: c }}
      />
    );
  }
  return (
    <span
      className="avatar"
      style={{ background: c, width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {String(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}
