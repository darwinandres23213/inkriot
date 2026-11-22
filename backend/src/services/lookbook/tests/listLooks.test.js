import assert from 'node:assert/strict';
import test from 'node:test';
import { listLooks } from '../src/services/listLooks.js';

test('el repositorio inicial publica la campaña Rompe el molde', async () => {
  const [look] = await listLooks();
  assert.equal(look.id, 'rompe-el-molde');
  assert.equal(look.title, 'Rompe el molde');
  assert.equal(look.imageUrl, '/lookbook/rompe-el-molde.webp');
  assert.ok(look.imageAlt);
});

test('una fuente intercambiable entrega solo looks publicados en orden editorial estable', async () => {
  const rows = [
    { id: 'tercero', position: 2, published: true },
    { id: 'borrador', position: 0, published: false },
    { id: 'b', position: 1, published: true },
    { id: 'a', position: 1, published: true },
  ];
  const catalog = await listLooks({ findAll: async () => rows });
  assert.deepEqual(catalog.map((look) => look.id), ['a', 'b', 'tercero']);
  assert.ok(catalog.every((look) => !('published' in look) && !('position' in look)));
  assert.equal(rows[0].id, 'tercero');
  assert.deepEqual(await listLooks({ findAll: async () => [] }), []);
});
