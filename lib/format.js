export const GAMES = ['Pokémon', 'Magic: The Gathering', 'Riftbound', 'Yu-Gi-Oh!', 'One Piece', 'Otro'];

// Cada vendedor tiene su propio color (sale de su id), para distinguirlos de un vistazo.
export function sellerColor(id) {
  const n = parseInt(String(id).replace(/-/g, '').slice(0, 8), 16) || 0;
  return `hsl(${n % 360} 62% 45%)`;
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
