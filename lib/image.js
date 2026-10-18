// Reduce las fotos del móvil (que pueden pesar varios MB) para que la web vaya rápida.
export async function prepararFoto(file, maxSize = 1200, quality = 0.85) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    return blob || file;
  } catch {
    return file;
  }
}

// Miniatura pequeña (unos 20-30 KB) para el catálogo, las tiendas y los carruseles
export function prepararMiniatura(file) {
  return prepararFoto(file, 400, 0.75);
}
