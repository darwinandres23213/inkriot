import { Box3, Ray, Triangle, Vector3 } from 'three';

function meshTriangles(mesh) {
  const { position } = mesh.geometry.attributes;
  const points = Array.from({ length: position.count }, (_, index) =>
    mesh.getVertexPosition(index, new Vector3()).applyMatrix4(mesh.matrixWorld));
  const indices = mesh.geometry.index.array;
  const triangles = [];
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = new Triangle(points[indices[i]], points[indices[i + 1]], points[indices[i + 2]]);
    const box = new Box3().setFromPoints([triangle.a, triangle.b, triangle.c]);
    triangles.push({ triangle, box });
  }
  return triangles;
}

// La cuadrícula descarta caras lejanas antes de comparar las superficies reales.
function cells(box, visit) {
  const cell = 0.09;
  for (let x = Math.floor(box.min.x / cell); x <= Math.floor(box.max.x / cell); x++) {
    for (let y = Math.floor(box.min.y / cell); y <= Math.floor(box.max.y / cell); y++) {
      for (let z = Math.floor(box.min.z / cell); z <= Math.floor(box.max.z / cell); z++) {
        visit(x + '/' + y + '/' + z);
      }
    }
  }
}

export function findFabricIntersection(body, interiorName = 'mannequin') {
  const interior = body.getObjectByName(interiorName);
  const buckets = new Map();
  for (const face of meshTriangles(interior)) {
    cells(face.box, (key) => {
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(face);
    });
  }
  const ray = new Ray();
  const contact = new Vector3();
  const sharedVertex = (p, t) => p.distanceToSquared(t.a) < 1e-12 ||
    p.distanceToSquared(t.b) < 1e-12 || p.distanceToSquared(t.c) < 1e-12;
  function cuts(start, end, triangle) {
    ray.origin.copy(start);
    ray.direction.subVectors(end, start);
    if (!ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, contact) ||
        contact.distanceToSquared(start) > ray.direction.lengthSq()) return false;
    if (interiorName === 'lining') {
      // La vuelta y el exterior se cosen a lo largo de una arista común.
      const sharedStart = sharedVertex(start, triangle), sharedEnd = sharedVertex(end, triangle);
      if ((sharedStart && sharedEnd) || (sharedStart && contact.distanceToSquared(start) < 1e-12) ||
          (sharedEnd && contact.distanceToSquared(end) < 1e-12)) return false;
    }
    return true;
  }
  function crosses(a, b) {
    return cuts(a.a, a.b, b) || cuts(a.b, a.c, b) || cuts(a.c, a.a, b);
  }
  const candidates = new Set();
  for (const mesh of body.children) {
    if (mesh === interior || mesh.name === 'mannequin') continue;
    for (const { triangle, box } of meshTriangles(mesh)) {
      candidates.clear();
      cells(box, (key) => buckets.get(key)?.forEach((face) => candidates.add(face)));
      for (const face of candidates) {
        if (box.intersectsBox(face.box) && (crosses(triangle, face.triangle) || crosses(face.triangle, triangle))) {
          return { fabric: mesh.name, point: contact.toArray().map((v) => Number(v.toFixed(4))) };
        }
      }
    }
  }
  return null;
}
