import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, test } from 'node:test';
import { Box3, DoubleSide, FrontSide, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { applyShirtFit, BODY_MODELS, SHIRT_SIZES } from '../helpers/shirtFit.js';
import { readShirtGeometry, SHIRT_MODEL_URL } from '../helpers/shirtGeometry.js';
import { findFabricIntersection } from './fabricIntersection.js';

const surfaces = ['front', 'back', 'trim', 'stitch', 'lining', 'mannequin'];
const materials = Object.fromEntries(surfaces.map((name) => [
  name, new MeshBasicMaterial({ side: name === 'mannequin' ? FrontSide : DoubleSide }),
]));
const file = await readFile(SHIRT_MODEL_URL);
const wardrobe = await readShirtGeometry(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), materials);
wardrobe.updateMatrixWorld(true);

function firstHit(body, origin, direction) {
  return new Raycaster(new Vector3(...origin), new Vector3(...direction).normalize()).intersectObject(body, true)[0];
}

function halfWidth(body, y) {
  return firstHit(body, [3, y, 0], [-1, 0, 0]).point.x;
}

function chest(body, x, y = 0.26) {
  return firstHit(body, [x, y, 3], [0, 0, -1]).point.z;
}

after(() => {
  wardrobe.traverse((part) => part.geometry?.dispose());
  Object.values(materials).forEach((material) => material.dispose());
});

test('los dos maniquíes tienen torsos cerrados y cubren cuello, bajo y mangas en las cinco tallas', () => {
  for (const model of BODY_MODELS) {
    const body = applyShirtFit(wardrobe, { model, size: 'M' });
    const form = body.getObjectByName('mannequin');
    const indices = form.geometry.index.array;
    const edges = new Map();
    for (let i = 0; i < indices.length; i += 3) {
      for (let j = 0; j < 3; j++) {
        const a = indices[i + j], b = indices[i + (j + 1) % 3];
        const key = a < b ? a + '/' + b : b + '/' + a;
        const edge = edges.get(key) ?? { uses: 0, winding: 0 };
        edge.uses++;
        edge.winding += a < b ? 1 : -1;
        edges.set(key, edge);
      }
    }
    for (const { uses, winding } of edges.values()) {
      assert.equal(uses, 2);
      assert.equal(winding, 0);
    }
    assert.equal(form.geometry.attributes.position.count - edges.size + indices.length / 3, 2);
    for (const size of SHIRT_SIZES) {
      applyShirtFit(wardrobe, { model, size });
      assert.equal(firstHit(body, [0.02, 3, 0.01], [0, -1, 0]).object, form);
      assert.equal(firstHit(body, [0.02, -3, 0.01], [0, 1, 0]).object, form);
      const cuffX = new Box3().setFromObject(body, true).max.x * 0.83;
      for (const sign of [-1, 1]) {
        const hit = firstHit(body, [sign * (cuffX + 0.82), -0.53, 0.015], [-sign * 0.82, 0.58, 0]);
        assert.equal(hit.object, form, model + ' ' + size);
      }
    }
  }
});

test('los cortes tienen perfiles propios de hombros, busto, cintura y cadera', () => {
  const male = applyShirtFit(wardrobe, { model: 'Masculino', size: 'M' });
  const female = applyShirtFit(wardrobe, { model: 'Femenino', size: 'M' });
  assert.ok(halfWidth(male, 0.84) / halfWidth(male, -1.02) > 1.25);
  assert.ok(halfWidth(female, -1.02) / halfWidth(female, -0.48) > 1.22);
  assert.ok(halfWidth(male, -1.02) / halfWidth(male, -0.48) < 1.15);
  assert.ok(halfWidth(male, 0.84) > halfWidth(female, 0.84) + 0.15);
  assert.ok(chest(female, 0.36) - chest(female, 0) > chest(male, 0.36) - chest(male, 0) + 0.02);
  for (const body of [female, male]) {
    assert.ok(chest(body, 0.36) > chest(body, 0.65));
    const inner = firstHit(body, [0.45, 3, 0], [0, -1, 0]);
    const outer = firstHit(body, [0.96, 3, 0], [0, -1, 0]);
    assert.ok(inner.point.y > outer.point.y + 0.12);
  }
  for (const size of SHIRT_SIZES) {
    applyShirtFit(wardrobe, { model: 'Masculino', size });
    for (const height of [0.18, 0.32, 0.44]) {
      const center = chest(male, 0, height);
      const lateral = Math.max(chest(male, -0.33, height), chest(male, 0.33, height));
      assert.ok(lateral <= center + 0.008, 'Relieve del pecho masculino, talla ' + size);
    }
  }
});

test('el relleno permanece detrás de la tela, del bajo y de ambos puños en las diez combinaciones', () => {
  for (const model of BODY_MODELS) {
    for (const size of SHIRT_SIZES) {
      const body = applyShirtFit(wardrobe, { model, size });
      const form = body.getObjectByName('mannequin');
      const lining = body.getObjectByName('lining');
      assert.deepEqual(findFabricIntersection(body), null, model + ' ' + size);
      assert.deepEqual(findFabricIntersection(body, 'lining'), null, 'Vuelta del dobladillo, ' + model + ' ' + size);
      const hem = new Box3().setFromObject(lining, true).min.y;
      assert.ok(new Box3().setFromObject(form, true).min.y - hem > 0.17);

      for (const sign of [-1, 1]) {
        const outward = new Vector3(sign * 0.48, -0.875, 0.04).normalize();
        const cuff = new Box3();
        let rim = -Infinity;
        const point = new Vector3();
        for (let i = 0; i < lining.geometry.attributes.position.count; i++) {
          lining.getVertexPosition(i, point);
          if (sign * point.x < 0.50 || point.y < -0.44 || point.y > 0.49) continue;
          cuff.expandByPoint(point);
          rim = Math.max(rim, point.dot(outward));
        }
        const origin = cuff.getCenter(new Vector3()).addScaledVector(outward, 2);
        const hit = firstHit(body, origin.toArray(), outward.clone().negate().toArray());
        assert.equal(hit.object, form);
        assert.ok(rim - hit.point.dot(outward) > 0.10, 'Relleno de la manga, ' + model + ' ' + size);
      }
    }
  }
});

test('los bordes de las costuras comparten vértices y aristas con el tejido', () => {
  const point = new Vector3();
  const vertexKey = (mesh, i) => mesh.getVertexPosition(i, point).toArray().map((v) => Math.round(v * 1e6)).join('/');
  const visitEdges = (mesh, visit) => {
    const index = mesh.geometry.index.array;
    for (let i = 0; i < index.length; i += 3) {
      for (let j = 0; j < 3; j++) visit(index[i + j], index[i + (j + 1) % 3]);
    }
  };
  for (const model of BODY_MODELS) {
    for (const size of ['S', 'XXL']) {
      const body = applyShirtFit(wardrobe, { model, size });
      const stitch = body.getObjectByName('stitch');
      const count = stitch.geometry.attributes.position.count;
      const edgeId = (a, b) => Math.min(a, b) * count + Math.max(a, b);
      const border = new Map();
      visitEdges(stitch, (a, b) => {
        const key = edgeId(a, b);
        if (border.has(key)) border.delete(key);
        else border.set(key, [a, b]);
      });
      const vertices = new Map();
      const regions = new Set();
      for (const [a, b] of border.values()) {
        vertices.set(vertexKey(stitch, a), a);
        vertices.set(vertexKey(stitch, b), b);
        stitch.getVertexPosition(a, point);
        regions.add(point.y > 0.75 ? 'cuello' : point.y < -0.65 ? 'bajo' : point.x < 0 ? 'izquierda' : 'derecha');
      }
      assert.equal(regions.size, 4);
      for (const tag of ['front', 'back', 'trim']) {
        const panel = body.getObjectByName(tag);
        const matches = Array.from({ length: panel.geometry.attributes.position.count }, (_, i) =>
          vertices.get(vertexKey(panel, i)));
        visitEdges(panel, (a, b) => {
          if (matches[a] !== undefined && matches[b] !== undefined) border.delete(edgeId(matches[a], matches[b]));
        });
      }
      assert.equal(border.size, 0, 'Aristas de costura sin unión en ' + model + ' ' + size);
    }
  }
});

test('la graduación aumenta ancho, profundidad y largo sin acumular deformaciones', () => {
  for (const model of BODY_MODELS) {
    let previous;
    const measured = [];
    for (const size of SHIRT_SIZES) {
      const body = applyShirtFit(wardrobe, { model, size });
      assert.deepEqual(wardrobe.children.filter((part) => part.visible), [body]);
      const bounds = new Box3().setFromObject(body, true);
      const depth = chest(body, 0) - firstHit(body, [0, 0.26, -3], [0, 0, 1]).point.z;
      const measures = [halfWidth(body, -0.48), halfWidth(body, -1.02), chest(body, 0.36), bounds.max.y - bounds.min.y, depth];
      if (previous) measures.forEach((value, i) => assert.ok(value > previous[i], model + ' ' + size));
      previous = measures;
      measured.push(measures);
      for (const mesh of body.children) {
        assert.equal(mesh.morphTargetInfluences[mesh.morphTargetDictionary.XXL], SHIRT_SIZES.indexOf(size) / 4);
      }
    }
    const [small, large] = [measured[0], measured.at(-1)];
    assert.ok(large[0] / small[0] > large[3] / small[3] + 0.08);
    assert.ok(large[4] / measured[1][4] < 1.12, 'Profundidad de la XXL respecto a la M');
    assert.equal(halfWidth(applyShirtFit(wardrobe, { model, size: 'S' }), -0.48), small[0]);
  }
});

test('las diez combinaciones conservan la superficie imprimible y la escala de ambas caras', () => {
  for (const model of BODY_MODELS) {
    for (const size of SHIRT_SIZES) {
      const body = applyShirtFit(wardrobe, { model, size });
      for (const [side, sign] of [['front', 1], ['back', -1]]) {
        const mesh = body.getObjectByName(side);
        const { normal, uv, position } = mesh.geometry.attributes;
        assert.equal(normal.count, position.count);
        assert.equal(uv.count, position.count);
        for (const x of [-0.49, 0, 0.49]) {
          for (const y of [-0.92, -0.53, 0.20, 0.70]) {
            const hit = firstHit(body, [x, y, sign * 3], [0, 0, -sign]);
            assert.equal(hit.object, mesh);
            assert.equal(hit.object.userData.printSide, side);
            assert.ok(Math.abs(hit.uv.x - (0.5 + sign * x / 3.1)) < 0.0001);
            assert.ok(Math.abs(hit.uv.y - (0.5 - y / 3.1)) < 0.0001);
          }
        }
      }
      for (const name of ['trim', 'stitch', 'lining', 'mannequin']) {
        const part = body.getObjectByName(name);
        assert.equal(part.material, materials[name]);
        assert.equal(part.userData.printSide, undefined);
      }
    }
  }
});
