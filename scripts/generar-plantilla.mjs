// Genera public/plantilla-cartas.xlsx (la plantilla que descargan los vendedores).
// Hay que volver a ejecutarlo si cambia la lista de sets o de juegos:
//   npm i --no-save exceljs && node scripts/generar-plantilla.mjs
import ExcelJS from 'exceljs';
import { CONDITIONS, GAMES } from '../lib/format.js';
import { ERAS, IDIOMAS, LOTE, OTRA, TIPOS, setsDe } from '../lib/collections.js';
import { COLUMNAS, MAX_FILAS, NOMBRE_HOJA } from '../lib/importar.js';

const wb = new ExcelJS.Workbook();
wb.creator = 'AkibaTrade';
const ROJO = 'FFC8102E';

const estiloCabecera = (fila) => {
  fila.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  fila.alignment = { vertical: 'middle', wrapText: true };
  fila.height = 30;
  fila.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROJO } };
  });
};

// ── Hoja de colecciones (referencia + lista de la columna «Colección») ──
const hojaCol = wb.addWorksheet('Colecciones');
hojaCol.addRow(['Colección', 'Juego', 'Idioma', 'Era']);
estiloCabecera(hojaCol.getRow(1));
const vistas = new Set();
const anadir = (c, juego, idioma, era) => {
  if (!vistas.has(c)) {
    vistas.add(c);
    hojaCol.addRow([c, juego, idioma, era]);
  }
};
anadir(LOTE, 'Todos', '', '');
anadir(OTRA, 'Todos', '', '');
IDIOMAS.forEach((i) => ERAS.forEach((e) => setsDe(i.value, e.value).forEach((s) => anadir(s, 'Pokémon', i.label, e.corto))));
hojaCol.columns = [{ width: 48 }, { width: 14 }, { width: 12 }, { width: 14 }];
hojaCol.views = [{ state: 'frozen', ySplit: 1 }];
const ultimaCol = hojaCol.rowCount;

// ── Hoja principal ──
const hoja = wb.addWorksheet(NOMBRE_HOJA);
hoja.addRow(COLUMNAS.map((c) => c.titulo));
estiloCabecera(hoja.getRow(1));
hoja.views = [{ state: 'frozen', ySplit: 1 }];
const anchos = { front: 22, back: 22, game: 22, name: 34, product_type: 18, language: 12, era: 14, collection: 38, condition: 10, accepts_trade: 12, description: 40, price: 12, shipping_spain: 16, shipping_europe: 16 };
hoja.columns = COLUMNAS.map((c) => ({ width: anchos[c.clave] || 16 }));

const idx = (clave) => COLUMNAS.findIndex((c) => c.clave === clave) + 1;
const lista = (valores) => ({ type: 'list', allowBlank: true, formulae: [`"${valores.join(',')}"`], showErrorMessage: true, errorTitle: 'Valor no válido', error: 'Elige un valor de la lista.' });
const validaciones = {
  game: lista(GAMES),
  product_type: lista(['Carta suelta', 'Slab', 'Sellado']),
  language: lista(IDIOMAS.map((i) => i.label)),
  era: lista(ERAS.map((e) => e.corto)),
  condition: lista(CONDITIONS.map((c) => c.code)),
  accepts_trade: lista(['Sí', 'No']),
  collection: { type: 'list', allowBlank: true, formulae: [`Colecciones!$A$2:$A$${ultimaCol}`], showErrorMessage: true, errorTitle: 'Colección no válida', error: 'Elige una colección de la lista (hoja «Colecciones»), o «Otra».' },
  price: { type: 'decimal', operator: 'greaterThan', allowBlank: true, formulae: [0], showErrorMessage: true, errorTitle: 'Precio no válido', error: 'Escribe un número mayor que 0.' },
  shipping_spain: { type: 'decimal', operator: 'greaterThanOrEqual', allowBlank: true, formulae: [0], showErrorMessage: true, errorTitle: 'Importe no válido', error: 'Escribe un número (0 si es gratis).' },
  shipping_europe: { type: 'decimal', operator: 'greaterThanOrEqual', allowBlank: true, formulae: [0], showErrorMessage: true, errorTitle: 'Importe no válido', error: 'Escribe un número (0 si es gratis).' },
};
for (let r = 2; r <= MAX_FILAS + 1; r += 1) {
  Object.entries(validaciones).forEach(([clave, v]) => {
    hoja.getCell(r, idx(clave)).dataValidation = v;
  });
}

// ── Ejemplo ──
const ej = wb.addWorksheet('Ejemplo');
ej.addRow(COLUMNAS.map((c) => c.titulo));
estiloCabecera(ej.getRow(1));
ej.columns = hoja.columns.map((c) => ({ width: c.width }));
ej.addRow(['charizard-delante.jpg', 'charizard-detras.jpg', 'Pokémon', 'Charizard 4/102 holo', 'Carta suelta', 'Inglés', 'Vintage', setsDe('en', 'vintage')[0] || 'Otra', 'NM', 'Sí', 'Esquinas limpias, sin marcas en el holo.', 350, 4.5, 9]);
ej.addRow(['caja-151.jpg', 'caja-151-detras.jpg', 'Pokémon', 'Display Pokémon 151 (sellado)', 'Sellado', 'Inglés', 'Moderno', 'Otra', 'M', 'No', '', 150, 7, 15]);
ej.addRow(['luffy.jpg', 'luffy-detras.jpg', 'One Piece', 'Monkey D. Luffy OP01-003', 'Carta suelta', '', '', 'Otra', 'NM', 'No', '', 12, 2, 5]);

// ── Instrucciones ──
const ins = wb.addWorksheet('Instrucciones', { properties: { tabColor: { argb: ROJO } } });
ins.columns = [{ width: 110 }];
const lineas = [
  ['CÓMO SUBIR VARIAS CARTAS CON ESTE EXCEL', true],
  ['', false],
  [`1. Rellena la hoja «${NOMBRE_HOJA}»: una carta por fila, hasta ${MAX_FILAS} cartas por Excel. No cambies los títulos de la primera fila ni borres columnas.`, false],
  ['2. Foto delante y Foto detrás: escribe el NOMBRE DEL ARCHIVO de cada foto, con su extensión (por ejemplo charizard-delante.jpg). Las fotos NO van dentro del Excel.', false],
  ['3. En tu panel de vendedor, pulsa «Subir varias cartas con Excel», elige este archivo y selecciona TAMBIÉN todas las fotos a la vez (el nombre de cada archivo debe coincidir con el que has escrito).', false],
  ['4. Pulsa «Revisar». Si hay algún error, la web te dirá la fila y la columna y no se subirá nada hasta que lo corrijas. Si todo está bien, pulsa «Publicar».', false],
  ['', false],
  ['COLUMNAS', true],
  ['• Juego: elige uno de la lista.', false],
  ['• Nombre: el nombre de la carta, por ejemplo «Charizard ex 199/165».', false],
  ['• Tipo de producto: Carta suelta (por defecto si lo dejas vacío), Slab (carta gradeada) o Sellado.', false],
  ['• Idioma y Era: solo para cartas de Pokémon (para otros juegos déjalos vacíos). Si pones uno, pon también el otro.', false],
  ['• Colección: elige de la lista (están en la hoja «Colecciones»), o «Lote» / «Otra». Para elegir un set de Pokémon hay que indicar antes idioma y era. Si no la sabes, déjala vacía.', false],
  ['• Estado: M, NM, EX, GD, LP, PL o PO.', false],
  ['• Admite trade: Sí o No (vacío = No).', false],
  ['• Descripción: opcional, hasta 1000 caracteres. Cuanto más detallada, mejor se encuentra tu carta en Google.', false],
  ['• Precio y envíos: solo el número, en euros (por ejemplo 12,50). El envío puede ser 0.', false],
  ['', false],
  ['Hoja «Ejemplo»: mira cómo quedaría rellenada. No hace falta borrarla, solo se lee la hoja «Cartas».', false],
];
lineas.forEach(([t, negrita]) => {
  const f = ins.addRow([t]);
  f.alignment = { wrapText: true, vertical: 'top' };
  if (negrita) f.font = { bold: true, size: 13, color: { argb: ROJO } };
});

// La hoja de instrucciones va la primera, pero se abre en «Cartas»
wb.views = [{ activeTab: 1 }];
wb.worksheets.sort((a, b) => ['Instrucciones', NOMBRE_HOJA, 'Ejemplo', 'Colecciones'].indexOf(a.name) - ['Instrucciones', NOMBRE_HOJA, 'Ejemplo', 'Colecciones'].indexOf(b.name));
await wb.xlsx.writeFile(new URL('../public/plantilla-cartas.xlsx', import.meta.url).pathname);
console.log('Plantilla generada con', hojaCol.rowCount - 1, 'colecciones.');
