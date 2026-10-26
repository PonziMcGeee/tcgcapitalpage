// Convierte un nombre en una dirección legible: "Base Set 1ª Edición" -> "base-set-1a-edicion"
export function slugify(t) {
  return String(t || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
