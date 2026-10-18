// Carrusel infinito con movimiento automático. Se pausa al pasar el ratón.
// items: lista de objetos con id. renderItem(item, duplicada) devuelve el elemento a pintar.
export default function Marquee({ items, renderItem, minItems = 8, label, secondsPerItem = 4 }) {
  let base = items;
  while (base.length > 0 && base.length < minItems) base = base.concat(items);
  const loop = [...base, ...base];

  return (
    <div className="marquee" aria-label={label}>
      <div className="marquee-track" style={{ animationDuration: `${base.length * secondsPerItem}s` }}>
        {loop.map((item, i) => (
          <div className="marquee-slot" key={`${item.id}-${i}`}>
            {renderItem(item, i >= base.length)}
          </div>
        ))}
      </div>
    </div>
  );
}
