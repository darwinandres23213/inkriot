import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrintLayer, printDimensions, printPosition } from '../helpers/printTexture.js';

test('las imágenes conservan su proporción y empiezan en la cara elegida', () => {
  const art = { image: { naturalWidth: 100, naturalHeight: 200 } };
  const layer = createPrintLayer(7, art, 'back');
  assert.equal(layer.side, 'back');
  assert.equal(layer.inverted, false);
  const [w, h] = printDimensions(layer, 1024);
  assert.equal(w / h, 0.5);
  assert.deepEqual(printDimensions({ ...layer, size: 50 }, 1024), [w / 2, h / 2]);
  assert.deepEqual(printPosition(-10, 200), { x: 25, y: 86 });
  assert.deepEqual(printPosition(62, 28), { x: 62, y: 28 });
});

