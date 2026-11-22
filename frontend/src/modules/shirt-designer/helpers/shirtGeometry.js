import { Group } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const SHIRT_MODEL_URL = new URL('../../../../assets/models/crew-neck.glb', import.meta.url);

export async function readShirtGeometry(buffer, materials) {
  const { scenes } = await new GLTFLoader().parseAsync(buffer, '');
  const wardrobe = new Group();
  wardrobe.add(...scenes);
  const replaced = new Set();
  wardrobe.traverse((part) => {
    if (!part.isMesh) return;
    const surface = part.material.name;
    replaced.add(part.material);
    part.name = surface;
    part.material = materials[surface];
    if (surface === 'front' || surface === 'back') part.userData.printSide = surface;
  });
  replaced.forEach((material) => material.dispose());
  return wardrobe;
}
