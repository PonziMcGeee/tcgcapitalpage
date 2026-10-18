export const GAMES = ['Pokémon', 'Magic: The Gathering', 'Riftbound', 'Yu-Gi-Oh!', 'One Piece', 'Otro'];

export const CONDITIONS = [
  { value: 'Mint', label: 'Mint (perfecta)' },
  { value: 'NM', label: 'Near Mint (casi perfecta)' },
  { value: 'EX', label: 'Excellent' },
  { value: 'GD', label: 'Good' },
  { value: 'LP', label: 'Light Played' },
  { value: 'PL', label: 'Played' },
];

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

export function phoneUrl(phone) {
  const p = String(phone || '').replace(/[^\d+]/g, '');
  return p ? `tel:${p}` : null;
}
