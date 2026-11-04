// Reduce las fotos del móvil (que pueden pesar varios MB) para que la web vaya rápida.
export async function prepararFoto(file, maxSize = 1000, quality = 0.8) {
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

// Miniatura pequeña (unos 12-20 KB) para el catálogo, las tiendas y los carruseles
export function prepararMiniatura(file) {
  return prepararFoto(file, 360, 0.72);
}

// Foto de perfil: recorte cuadrado centrado de 256 px
export async function prepararAvatar(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const lado = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - lado) / 2;
    const sy = (bitmap.height - lado) / 2;
    const size = Math.min(256, lado);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.getContext('2d').drawImage(bitmap, sx, sy, lado, lado, 0, 0, size, size);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob || file;
  } catch {
    return file;
  }
}
