import { Vector3 } from 'three';

export const BODY_MODELS = ['Masculino', 'Femenino'];
export const SHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
export const DEFAULT_FIT = { model: 'Masculino', size: 'M' };

export function applyShirtFit(wardrobe, { model, size }) {
  const selected = wardrobe.children.find((body) => body.name === model);
  const index = SHIRT_SIZES.indexOf(size);
  if (!selected || index < 0) throw new Error('Modelo o talla de camiseta desconocidos.');
  for (const body of wardrobe.children) body.visible = body === selected;
  if (selected.userData.size === size) return selected;

  // Cada patrón parte de S y contiene su graduación completa hasta XXL.
  const weight = index / (SHIRT_SIZES.length - 1);
  const point = new Vector3();
  selected.traverse((part) => {
    if (!part.isMesh) return;
    part.morphTargetInfluences[part.morphTargetDictionary.XXL] = weight;
    if (!part.userData.printSide) return;

    // Proyectar desde la tela ya graduada conserva la proporción del estampado.
    const uv = part.geometry.attributes.uv;
    const direction = part.userData.printSide === 'front' ? 1 : -1;
    const patternSpan = 3.1;
    for (let i = 0; i < uv.count; i++) {
      part.getVertexPosition(i, point);
      uv.setXY(i, 0.5 + direction * point.x / patternSpan, 0.5 - point.y / patternSpan);
    }
    uv.needsUpdate = true;
  });
  selected.userData.size = size;
  return selected;
}
