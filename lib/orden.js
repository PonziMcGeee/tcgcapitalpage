// Ordenar cartas por precio o por fecha (las que no tienen precio van siempre al final)
export const ORDENES = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio-desc', label: 'Precio: de mayor a menor' },
  { value: 'precio-asc', label: 'Precio: de menor a mayor' },
];

export function ordenar(lista, orden) {
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
