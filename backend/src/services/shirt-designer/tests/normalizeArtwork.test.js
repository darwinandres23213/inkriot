import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { MAX_FILE_BYTES, normalizeArtwork } from '../src/services/normalizeArtwork.js';

const sample = () => sharp({ create: { width: 48, height: 32, channels: 4, background: { r: 240, g: 25, b: 80, alpha: 0.5 } } });

for (const format of ['png', 'jpeg', 'webp']) {
  test(`decodifica ${format} y vuelve a codificar los píxeles en PNG`, async () => {
    const input = await sample()[format]().toBuffer();
    const output = await normalizeArtwork(input);
    assert.equal(output.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    const info = await sharp(output).metadata();
    assert.equal(info.format, 'png');
    assert.equal(info.width, 48);
    assert.equal(info.height, 32);
    if (format === 'png') {
      const rgba = await sharp(output).ensureAlpha().raw().toBuffer();
      assert.equal(rgba[3], 128);
    }
  });
}

test('orienta la imagen, limita la resolución del PNG y descarta metadatos originales', async () => {
  const input = await sample().resize(2000, 1000, { fit: 'fill' }).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  const info = await sharp(await normalizeArtwork(input)).metadata();
  assert.deepEqual([info.width, info.height], [768, 1536]);
  assert.equal(info.exif, undefined);
});

test('rechaza archivos vacíos, contenido no raster y archivos demasiado grandes', async () => {
  await assert.rejects(normalizeArtwork(Buffer.alloc(0)), { status: 400 });
  await assert.rejects(normalizeArtwork(Buffer.from('archivo de texto')), { status: 415 });
  await assert.rejects(normalizeArtwork(Buffer.alloc(MAX_FILE_BYTES + 1)), { status: 413 });
  const large = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: 'white' } }).png().toBuffer();
  await assert.rejects(normalizeArtwork(large), { status: 413 });
});

test('rechaza archivos truncados y un PNG cuyo contenido no coincide con su suma de comprobación', async () => {
  for (const format of ['png', 'jpeg', 'webp']) {
    const input = await sample()[format]().toBuffer();
    await assert.rejects(normalizeArtwork(input.subarray(0, -8)), { status: 422 });
  }
  const damaged = await sample().png().toBuffer();
  damaged[damaged.indexOf(Buffer.from('IDAT')) + 5] ^= 1;
  await assert.rejects(normalizeArtwork(damaged), { status: 422 });
});
