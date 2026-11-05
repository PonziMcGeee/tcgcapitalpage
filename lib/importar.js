// Lectura y validación de la plantilla Excel para subir varias cartas de golpe.
// Todo se comprueba ANTES de subir nada: si hay un solo error, no se sube ninguna carta.
import { CONDITIONS, GAMES } from './format.js';
import { ERAS, ESPECIAL_LABEL, IDIOMAS, TIPOS, coleccionesPara } from './collections.js';

export const MAX_FILAS = 10; // cartas por Excel
export const MAX_FOTO_MB = 20;
export const NOMBRE_HOJA = 'Cartas';

// Columnas de la plantilla, en orden. «titulo» es lo que se ve en el Excel.
export const COLUMNAS = [
  { clave: 'front', titulo: 'Foto delante' },
  { clave: 'back', titulo: 'Foto detrás' },
  { clave: 'game', titulo: 'Juego' },
  { clave: 'name', titulo: 'Nombre' },
  { clave: 'product_type', titulo: 'Tipo de producto' },
  { clave: 'language', titulo: 'Idioma' },
  { clave: 'era', titulo: 'Era' },
  { clave: 'collection', titulo: 'Colección' },
  { clave: 'condition', titulo: 'Estado' },
  { clave: 'accepts_trade', titulo: 'Admite trade' },
  { clave: 'description', titulo: 'Descripción' },
  { clave: 'price', titulo: 'Precio (€)' },
  { clave: 'shipping_spain', titulo: 'Envío España (€)' },
  { clave: 'shipping_europe', titulo: 'Envío Europa (€)' },
];

// Para comparar sin fijarse en mayúsculas, acentos ni espacios de más
export const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const texto = (v) => (v === null || v === undefined ? '' : String(v).trim());

// «12,50», «12.5» o 12.5 -> 12.5 (o NaN si no es un número)
function numero(v) {
  if (typeof v === 'number') return v;
  const t = texto(v).replace(/€/g, '').replace(/\s/g, '').replace(',', '.');
  return t === '' ? NaN : Number(t);
}

// Busca en una lista de {valor, etiquetas[]} la que coincida con lo que ha escrito el vendedor
function buscar(lista, v) {
  const n = norm(v);
  return lista.find((x) => x.etiquetas.some((e) => norm(e) === n))?.valor;
}

const OPCIONES_JUEGO = GAMES.map((g) => ({ valor: g, etiquetas: [g] }));
const OPCIONES_TIPO = [
  { valor: '', etiquetas: ['', 'Carta suelta', 'Suelta'] },
  ...TIPOS.filter((t) => t.value).map((t) => ({ valor: t.value, etiquetas: [t.value, t.label, t.corto, `${t.corto}s`] })),
];
const OPCIONES_IDIOMA = IDIOMAS.map((i) => ({ valor: i.value, etiquetas: [i.value, i.label] }));
const OPCIONES_ERA = ERAS.map((e) => ({ valor: e.value, etiquetas: [e.value, e.label, e.corto] }));
const OPCIONES_ESTADO = CONDITIONS.map((c) => ({ valor: c.code, etiquetas: [c.code, c.label, `${c.label} (${c.code})`] }));

export const lista = (opciones) => opciones.map((o) => o.etiquetas[1] || o.etiquetas[0]).filter(Boolean);

// Convierte las filas leídas del Excel (matriz) en objetos por columna.
// Devuelve { filas, errores } — errores de estructura (columnas que faltan, demasiadas filas…).
export function leerMatriz(matriz) {
  const errores = [];
  if (!matriz || matriz.length === 0) return { filas: [], errores: [{ fila: 0, columna: '', mensaje: 'El Excel está vacío.' }] };
  const cabecera = matriz[0].map((c) => norm(c));
  const indice = {};
  COLUMNAS.forEach((c) => {
    // Se admite que el título lleve o no lo que va entre paréntesis (p. ej. «(€)»)
    const buscado = norm(c.titulo);
    const i = cabecera.findIndex((h) => h === buscado || h.replace(/\(.*\)/, '').trim() === buscado.replace(/\(.*\)/, '').trim());
    if (i === -1) errores.push({ fila: 1, columna: c.titulo, mensaje: `Falta la columna «${c.titulo}». Descarga la plantilla otra vez y no cambies los títulos de la primera fila.` });
    indice[c.clave] = i;
  });
  if (errores.length) return { filas: [], errores };

  const filas = [];
  matriz.slice(1).forEach((fila, k) => {
    const obj = { _fila: k + 2 };
    COLUMNAS.forEach((c) => {
      obj[c.clave] = fila[indice[c.clave]] ?? '';
    });
    const vacia = COLUMNAS.every((c) => texto(obj[c.clave]) === '');
    if (!vacia) filas.push(obj);
  });
  if (filas.length === 0) errores.push({ fila: 0, columna: '', mensaje: 'No hay ninguna carta en el Excel. Rellena al menos una fila.' });
  if (filas.length > MAX_FILAS) errores.push({ fila: 0, columna: '', mensaje: `Hay ${filas.length} cartas y el máximo por Excel es ${MAX_FILAS}. Sube el resto en otro Excel.` });
  return { filas, errores };
}

// Valida cada fila y devuelve { cartas, errores, fotosSinUsar }.
// «archivos» es el conjunto de fotos elegidas: un Map nombre-en-minúsculas -> File.
export function validarFilas(filas, archivos) {
  const errores = [];
  const cartas = [];
  const usadas = new Set();
  const falla = (fila, columna, mensaje) => errores.push({ fila, columna, mensaje });

  filas.forEach((f) => {
    const n = f._fila;
    const antes = errores.length;

    const nombre = texto(f.name);
    if (!nombre) falla(n, 'Nombre', 'Falta el nombre de la carta.');
    else if (nombre.length > 150) falla(n, 'Nombre', 'El nombre es demasiado largo (máximo 150 caracteres).');

    const game = buscar(OPCIONES_JUEGO, f.game);
    if (!game) falla(n, 'Juego', `«${texto(f.game)}» no es un juego válido. Elige uno de la lista: ${GAMES.join(', ')}.`);

    const tipo = buscar(OPCIONES_TIPO, f.product_type);
    if (tipo === undefined) falla(n, 'Tipo de producto', `«${texto(f.product_type)}» no es válido. Usa: Carta suelta, Slab o Sellado.`);

    const estado = buscar(OPCIONES_ESTADO, f.condition);
    if (!estado) falla(n, 'Estado', `«${texto(f.condition)}» no es un estado válido. Usa: ${CONDITIONS.map((c) => c.code).join(', ')}.`);

    // Idioma y era solo se usan en Pokémon (como en el formulario)
    let language = '';
    let era = '';
    if (game === 'Pokémon') {
      if (texto(f.language)) {
        language = buscar(OPCIONES_IDIOMA, f.language);
        if (!language) falla(n, 'Idioma', `«${texto(f.language)}» no es válido. Usa: ${IDIOMAS.map((i) => i.label).join(', ')}.`);
      }
      if (texto(f.era)) {
        era = buscar(OPCIONES_ERA, f.era);
        if (!era) falla(n, 'Era', `«${texto(f.era)}» no es válida. Usa: ${ERAS.map((e) => e.corto).join(', ')}.`);
      }
      if ((language && !era) || (!language && era)) falla(n, language ? 'Era' : 'Idioma', 'Si indicas idioma o era en una carta Pokémon, hay que indicar los dos.');
    }

    // La colección tiene que ser una de las que se ofrecen en el formulario para ese juego, idioma y era
    let collection = null;
    if (texto(f.collection)) {
      if (game === 'Pokémon' && !(language && era)) {
        falla(n, 'Colección', 'Para elegir un set de Pokémon hay que indicar antes el idioma y la era (o usa «Lote» u «Otra»).');
      } else if (game) {
        const validas = coleccionesPara(game, language, era);
        const n1 = norm(f.collection);
        const encontrada = validas.find((c) => norm(c) === n1 || (ESPECIAL_LABEL[c] && norm(ESPECIAL_LABEL[c]) === n1));
        if (encontrada) collection = encontrada;
        else falla(n, 'Colección', `«${texto(f.collection)}» no está en la lista de ${game}${language && era ? ' para ese idioma y era' : ''}. Cópiala tal cual de la hoja «Colecciones» o usa «Otra».`);
      }
    }

    const trade = norm(f.accepts_trade);
    if (!['', 'no', 'si', 'sí', 's', 'n', 'true', 'false'].includes(trade)) falla(n, 'Admite trade', 'Escribe «Sí» o «No».');
    const accepts_trade = ['si', 's', 'true'].includes(trade);

    const descripcion = texto(f.description);
    if (descripcion.length > 1000) falla(n, 'Descripción', 'La descripción es demasiado larga (máximo 1000 caracteres).');

    const price = numero(f.price);
    if (texto(f.price) === '') falla(n, 'Precio (€)', 'Falta el precio.');
    else if (!Number.isFinite(price) || price <= 0) falla(n, 'Precio (€)', `«${texto(f.price)}» no es un precio válido. Pon un número mayor que 0.`);
    else if (price > 1000000) falla(n, 'Precio (€)', 'El precio es demasiado alto.');

    const envio = (valor, columna) => {
      if (texto(valor) === '') return 0;
      const e = numero(valor);
      if (!Number.isFinite(e) || e < 0 || e > 10000) {
        falla(n, columna, `«${texto(valor)}» no es un importe válido. Pon un número (0 si es gratis).`);
        return 0;
      }
      return e;
    };
    const shipping_spain = envio(f.shipping_spain, 'Envío España (€)');
    const shipping_europe = envio(f.shipping_europe, 'Envío Europa (€)');

    // Fotos: tienen que estar entre las que se han elegido
    const foto = (valor, columna) => {
      const nombreFoto = texto(valor);
      if (!nombreFoto) {
        falla(n, columna, 'Falta el nombre del archivo de la foto.');
        return null;
      }
      const archivo = archivos.get(norm(nombreFoto));
      if (!archivo) {
        falla(n, columna, `No has seleccionado la foto «${nombreFoto}». Elígela junto al Excel (el nombre debe ser igual, con su extensión .jpg/.png).`);
        return null;
      }
      if (!/^image\//.test(archivo.type) && !/\.(jpe?g|png|webp)$/i.test(archivo.name)) {
        falla(n, columna, `«${nombreFoto}» no parece una imagen (usa .jpg, .png o .webp).`);
        return null;
      }
      if (archivo.size > MAX_FOTO_MB * 1024 * 1024) {
        falla(n, columna, `«${nombreFoto}» pesa más de ${MAX_FOTO_MB} MB.`);
        return null;
      }
      usadas.add(norm(nombreFoto));
      return archivo;
    };
    const front = foto(f.front, 'Foto delante');
    const back = foto(f.back, 'Foto detrás');

    if (errores.length === antes) {
      cartas.push({
        fila: n,
        front,
        back,
        datos: {
          name: nombre,
          game,
          language: language || null,
          era: era || null,
          collection,
          condition: estado,
          accepts_trade,
          description: descripcion || null,
          price,
          shipping_spain,
          shipping_europe,
          ...(tipo ? { product_type: tipo } : {}),
        },
      });
    }
  });

  const fotosSinUsar = [...archivos.entries()].filter(([k]) => !usadas.has(k)).map(([, a]) => a.name);
  return { cartas: errores.length ? [] : cartas, errores, fotosSinUsar };
}
