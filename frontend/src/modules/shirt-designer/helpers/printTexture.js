const negatives = new WeakMap();

export const printArea = { left: 25, right: 75, top: 24, bottom: 86 };

export function printPosition(x, y) {
  return {
    x: Math.max(printArea.left, Math.min(printArea.right, x)),
    y: Math.max(printArea.top, Math.min(printArea.bottom, y)),
  };
}

function negativeOf(image) {
  if (negatives.has(image)) return negatives.get(image);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data[i] = 255 - pixels.data[i];
    pixels.data[i + 1] = 255 - pixels.data[i + 1];
    pixels.data[i + 2] = 255 - pixels.data[i + 2];
  }
  ctx.putImageData(pixels, 0, 0);
  negatives.set(image, canvas);
  return canvas;
}

export function createPrintLayer(id, artwork, side) {
  return { ...artwork, id, side, x: 50, y: 43, size: 100, rotation: 0, inverted: false };
}

export function printDimensions(layer, textureSize) {
  const longest = textureSize * 0.275 * layer.size / 100;
  const ratio = layer.image.naturalWidth / layer.image.naturalHeight;
  return ratio >= 1 ? [longest, longest / ratio] : [longest * ratio, longest];
}

export function paintPrint(canvas, color, layers) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  for (const layer of layers) {
    const [w, h] = printDimensions(layer, size);
    ctx.save();
    ctx.translate(size * layer.x / 100, size * layer.y / 100);
    ctx.rotate(layer.rotation * Math.PI / 180);
    ctx.drawImage(layer.inverted ? negativeOf(layer.image) : layer.image, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}
