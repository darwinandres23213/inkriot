import { test, expect } from '@playwright/test';

const path = '/api/shirt-designer/images';
const headers = { 'Content-Type': 'application/octet-stream' };

test('el catálogo público de predeterminados está vacío', async ({ request }) => {
  const response = await request.get('/api/shirt-designer/presets');
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual([]);
});

test('el servidor web devuelve el PNG generado por el microservicio', async ({ request, page }) => {
  const jpeg = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    return canvas.toDataURL('image/jpeg').split(',')[1];
  });
  const response = await request.post(path, { headers, data: Buffer.from(jpeg, 'base64') });
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe('image/png');
  expect(response.headers()['cache-control']).toBe('no-store');
  expect((await response.body()).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
});

test('la API pública conserva los errores de tipo, integridad y tamaño', async ({ request }) => {
  for (const [data, status] of [
    [Buffer.from('texto'), 415],
    [Buffer.from('89504e470d0a1a0a', 'hex'), 422],
    [Buffer.alloc(8 * 1024 * 1024 + 1), 413],
  ]) {
    const response = await request.post(path, { headers, data });
    expect(response.status()).toBe(status);
    expect((await response.json()).error).toBeTruthy();
  }
});
