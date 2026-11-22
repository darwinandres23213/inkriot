import sharp from 'sharp';
import { corruptImage, identifyImage, ImageInputError } from '../helpers/imageFormat.js';

export const MAX_FILE_BYTES = 8 * 1024 * 1024;
const maxPixels = 16_000_000;

export async function normalizeArtwork(bytes) {
  if (bytes?.length > MAX_FILE_BYTES) throw new ImageInputError(413, 'El archivo supera los 8 MiB.');
  const format = identifyImage(bytes);
  try {
    const image = sharp(bytes, { failOn: 'warning', limitInputPixels: maxPixels });
    const meta = await image.metadata();
    if (meta.format !== format || !meta.width || !meta.height) throw corruptImage();
    if (meta.width * meta.height > maxPixels) throw new ImageInputError(413, 'La imagen supera los 16 megapíxeles.');
    if (meta.pages > 1) throw new ImageInputError(415, 'Elige una imagen estática.');
    return await image.rotate().resize(1536, 1536, { fit: 'inside', withoutEnlargement: true })
      .toColourspace('srgb').png().toBuffer();
  } catch (error) {
    if (error instanceof ImageInputError) throw error;
    if (/pixel limit/i.test(error.message)) throw new ImageInputError(413, 'La imagen supera los 16 megapíxeles.');
    throw corruptImage();
  }
}
