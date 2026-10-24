// Muestra un texto legal en texto plano: títulos numerados, párrafos y listas.
const PARRAFOS = [
  'Esta política no sustituye',
  'Se recomienda no publicar',
  'La documentación identificativa',
  'La utilización de cookies',
  'Una vez que los datos',
  'Para ejercer estos derechos',
  'Ningún sistema informático',
  'AkibaTrade podrá adoptar medidas',
  'La plataforma podrá incorporar',
  'En adelante, el responsable',
  'AkibaTrade es un nombre comercial',
  'Fin de la',
  'Fin de las',
  'Las cookies son',
  'Esta política se ha',
  'El responsable es',
  'Cuando enlaces',
  'Dado que',
  'Puedes permitir',
  'Para cualquier',
  'Esta política puede',
  'AkibaTrade utiliza Vercel',
  'AkibaTrade no utiliza',
  'AkibaTrade actúa',
  'AkibaTrade es una',
  'AkibaTrade podrá',
  'AkibaTrade se ofrece',
  'AkibaTrade no responderá',
  'Nada de lo',
  'Las presentes',
  'El acceso',
  'Cualquier compraventa',
  'Los vendedores profesionales',
  'Los usuarios son',
  'Al publicar',
  'El usuario',
  'Estas Condiciones',
  'Puedes solicitar',
  'El diseño',
  'Cualquier persona',
  'Los compradores',
  'Se recomienda',
  'Los juegos',
  'Esta información',
];

function bloques(texto) {
  const lineas = texto.split('\n').map((l) => l.trim());
  const out = [];
  let grupo = [];
  const cerrar = () => {
    if (grupo.length === 0) return;
    if (grupo.length === 1) out.push({ tipo: 'p', texto: grupo[0] });
    else out.push({ tipo: 'ul', items: grupo });
    grupo = [];
  };
  lineas.forEach((l, i) => {
    if (i === 0) return out.push({ tipo: 'h1', texto: l });
    if (!l) return cerrar();
    if (/^\d+\.\d+\.\s/.test(l)) {
      cerrar();
      return out.push({ tipo: 'h3', texto: l });
    }
    if (/^\d+\.\s/.test(l)) {
      cerrar();
      return out.push({ tipo: 'h2', texto: l });
    }
    if (l.startsWith('Última actualización')) return out.push({ tipo: 'fecha', texto: l });
    if (l.endsWith(':') || PARRAFOS.some((p) => l.startsWith(p))) {
      cerrar();
      return out.push({ tipo: 'p', texto: l });
    }
    grupo.push(l);
  });
  cerrar();
  return out;
}

// Convierte las direcciones web y de correo en enlaces
function conEnlaces(texto) {
  return texto.split(/(https?:\/\/[^\s]+?(?=[.,;]?(?:\s|$))|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g).map((trozo, i) => {
    if (/^https?:\/\//.test(trozo)) {
      return (
        <a key={i} href={trozo} target="_blank" rel="noreferrer">
          {trozo}
        </a>
      );
    }
    if (/^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/.test(trozo)) return <a key={i} href={`mailto:${trozo}`}>{trozo}</a>;
    return trozo;
  });
}

export default function LegalDoc({ texto }) {
  return (
    <article className="legal">
      {bloques(texto).map((b, i) => {
        if (b.tipo === 'h1') return <h1 key={i}>{b.texto}</h1>;
        if (b.tipo === 'h2') return <h2 key={i}>{b.texto}</h2>;
        if (b.tipo === 'h3') return <h3 key={i}>{b.texto}</h3>;
        if (b.tipo === 'fecha') return <p key={i} className="muted small">{b.texto}</p>;
        if (b.tipo === 'ul')
          return (
            <ul key={i}>
              {b.items.map((it, j) => (
                <li key={j}>{conEnlaces(it)}</li>
              ))}
            </ul>
          );
        return <p key={i}>{conEnlaces(b.texto)}</p>;
      })}
    </article>
  );
}
