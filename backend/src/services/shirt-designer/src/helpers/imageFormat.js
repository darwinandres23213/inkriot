import { crc32 } from 'node:zlib';

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export class ImageInputError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function corruptImage() {
  return new ImageInputError(422, 'La imagen está dañada o incompleta. Elige otro archivo.');
}

function validatePngChunks(bytes) {
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const end = offset + 8 + length;
    if (end + 4 > bytes.length) throw corruptImage();
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (offset === 8 && (type !== 'IHDR' || length !== 13)) throw corruptImage();
    if (crc32(bytes.subarray(offset + 4, end)) !== bytes.readUInt32BE(end)) throw corruptImage();
    if (type === 'acTL') throw new ImageInputError(415, 'Elige una imagen estática.');
    offset = end + 4;
    if (type === 'IEND') {
      if (length !== 0 || offset !== bytes.length) throw corruptImage();
      return;
    }
  }
  throw corruptImage();
}

export function identifyImage(bytes) {
  if (!bytes?.length) throw new ImageInputError(400, 'El archivo está vacío.');
  if (bytes.subarray(0, 8).equals(pngSignature)) {
    validatePngChunks(bytes);
    return 'png';
  }
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    if (bytes.at(-2) !== 255 || bytes.at(-1) !== 217) throw corruptImage();
    return 'jpeg';
  }
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    if (bytes.readUInt32LE(4) + 8 !== bytes.length) throw corruptImage();
    return 'webp';
  }
  throw new ImageInputError(415, 'Elige una imagen PNG, JPG o WebP.');
}
