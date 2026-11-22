import { expect, test } from '@playwright/test';

test('la API pública entrega el look inicial y la foto del álbum se sirve en producción', async ({ request }) => {
  const response = await request.get('/api/lookbook/looks');
  expect(response.status()).toBe(200);
  const looks = await response.json();
  expect(looks).toMatchObject([{ id: 'rompe-el-molde', title: 'Rompe el molde', imageAlt: expect.any(String) }]);
  const photo = await request.get(looks[0].imageUrl);
  expect(photo.status()).toBe(200);
  expect(photo.headers()['content-type']).toContain('image/webp');
  expect((await photo.body()).toString('ascii', 8, 12)).toBe('WEBP');
});
