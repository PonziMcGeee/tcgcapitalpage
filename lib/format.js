export const GAMES = ['Pokémon', 'Magic: The Gathering', 'Riftbound', 'Yu-Gi-Oh!', 'One Piece', 'Otro'];

// Colores entre los que cada vendedor puede elegir para su tienda
export const SELLER_COLORS = [
  '#4f46e5',
  '#0ea5e9',
  '#14b8a6',
  '#10b981',
  '#84cc16',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#64748b',
  '#a16207',
];

// Color de un vendedor: el que ha elegido o, si no ha elegido, uno que sale de su id
export function sellerColor(id, color) {
  if (color) return color;
  const n = parseInt(String(id).replace(/-/g, '').slice(0, 8), 16) || 0;
  return SELLER_COLORS[n % SELLER_COLORS.length];
}

export function euros(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

export function telegramUrl(handle) {
  const h = String(handle || '').trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '');
  return h ? `https://t.me/${h}` : null;
}

export function instagramUrl(handle) {
  const h = String(handle || '')
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/\/$/, '');
  return h ? `https://instagram.com/${h}` : null;
}

// Enlace de WhatsApp. Si el número tiene 9 cifras se asume España (+34).
export function whatsappUrl(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 9) digits = `34${digits}`;
  return `https://wa.me/${digits}`;
}
