// Ordenar cartas por precio o por fecha (las que no tienen precio van siempre al final)
// Orden que elige el vendedor: primero sort_order (menor = antes); sin número, por fecha (más nuevas antes).
export function porOrdenVendedor(a, b) {
  const x = a.sort_order ?? Infinity;
  const y = b.sort_order ?? Infinity;
  if (x !== y) return x < y ? -1 : 1;
  return String(b.created_at || '').localeCompare(String(a.created_at || ''));
}

export const ORDENES = [
  { value: 'alfabetico', label: 'Nombre: de la A a la Z' },
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio-desc', label: 'Precio: de mayor a menor' },
  { value: 'precio-asc', label: 'Precio: de menor a mayor' },
];

export function ordenar(lista, orden) {
  if (orden === 'alfabetico')
    return [...lista].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base', numeric: true }));
  if (orden === 'vendedor') return [...lista].sort(porOrdenVendedor);
  if (orden !== 'precio-desc' && orden !== 'precio-asc') return lista;
  const dir = orden === 'precio-desc' ? -1 : 1;
  const val = (l) => (l.price === null || l.price === undefined || l.price === '' ? null : Number(l.price));
  return [...lista].sort((a, b) => {
    const x = val(a);
    const y = val(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return (x - y) * dir;
  });
}
