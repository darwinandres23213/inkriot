import {
  CanvasTexture, Color, DirectionalLight, DoubleSide, Group, HemisphereLight, MeshPhysicalMaterial, MeshStandardMaterial,
  OrthographicCamera, Raycaster, Scene, SRGBColorSpace, Vector2, WebGLRenderer,
} from 'three';
import { readShirtGeometry, SHIRT_MODEL_URL } from './shirtGeometry.js';
import { applyShirtFit, DEFAULT_FIT } from './shirtFit.js';
import { createJerseyBump } from './jerseyTexture.js';
import { paintPrint } from './printTexture.js';

export function createShirtScene(canvas) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new OrthographicCamera(-2, 2, 2, -2, 0.1, 30);
  camera.position.z = 5;
  const textures = {};
  const materials = {};
  const jersey = createJerseyBump();
  const fiberHighlight = new Color(0xe2ddd4);
  for (const side of ['front', 'back']) {
    const map = document.createElement('canvas');
    map.width = map.height = 1024;
    paintPrint(map, '#ffffff', []);
    const texture = new CanvasTexture(map);
    // El patrón del GLB y las imágenes del editor miden la altura desde el borde superior.
    texture.flipY = false;
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    textures[side] = texture;
    materials[side] = new MeshPhysicalMaterial({
      map: texture, bumpMap: jersey, bumpScale: 0.0026, side: DoubleSide, roughness: 0.96,
      sheen: 0.22, sheenRoughness: 0.90,
    });
  }
  materials.trim = new MeshStandardMaterial({ side: DoubleSide, roughness: 1 });
  materials.stitch = new MeshStandardMaterial({ side: DoubleSide, roughness: 0.93 });
  materials.lining = new MeshStandardMaterial({ side: DoubleSide, roughness: 1 });
  materials.mannequin = new MeshStandardMaterial({
    color: 0xb0aca4, vertexColors: true, roughness: 0.96, emissive: 0x706b62, emissiveIntensity: 0.09,
  });
  const shirt = new Group();
  shirt.rotation.y = -0.12;
  shirt.rotation.x = 0.035;
  scene.add(shirt, new HemisphereLight(0xfff9f1, 0x737886, 1.05));
  for (const [x, y, z, strength] of [[-3, 4, 3, 1.55], [3, 1, -3, 1.25], [2, 0, 3, 0.30]]) {
    const light = new DirectionalLight(0xffffff, strength);
    light.position.set(x, y, z);
    scene.add(light);
  }
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const lastPaint = {};
  let wardrobe, activeModel;
  let fit = DEFAULT_FIT;
  let frame = 0;
  function draw() {
    frame = 0;
    renderer.render(scene, camera);
  }
  function render() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height;
    // El mismo encuadre permite comparar tallas y girar la XXL sin recortar el bajo.
    const halfHeight = Math.max(1.70, 1.55 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    // Al cambiar el tamaño del canvas, WebGL borra su contenido.
    cancelAnimationFrame(frame);
    draw();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  const request = new AbortController();
  function setFit(next) {
    fit = next;
    if (!wardrobe) return;
    activeModel = applyShirtFit(wardrobe, fit);
    render();
  }
  async function loadModel() {
    const response = await fetch(SHIRT_MODEL_URL, { signal: request.signal });
    if (!response.ok) throw new Error('No se pudo cargar la camiseta.');
    const model = await readShirtGeometry(await response.arrayBuffer(), materials);
    if (request.signal.aborted) {
      model.traverse((part) => part.geometry?.dispose());
      return;
    }
    wardrobe = model;
    shirt.add(wardrobe);
    setFit(fit);
  }
  return {
    ready: loadModel(),
    setFit,
    paint(color, layers) {
      for (const side of ['front', 'back']) {
        const prints = layers.filter((layer) => layer.side === side);
        const previous = lastPaint[side];
        if (previous?.color === color && previous.prints.length === prints.length &&
          prints.every((layer, index) => layer === previous.prints[index])) continue;
        paintPrint(textures[side].image, color, prints);
        materials[side].sheenColor.set(color).lerp(fiberHighlight, 0.16);
        textures[side].needsUpdate = true;
        lastPaint[side] = { color, prints };
      }
      materials.trim.color.set(color).multiplyScalar(0.94);
      materials.stitch.color.set(color).multiplyScalar(0.90);
      materials.lining.color.set(color).multiplyScalar(0.77);
      render();
    },
    showSide(side) {
      shirt.rotation.set(0.035, side === 'front' ? 0 : Math.PI, 0);
      render();
    },
    orbit(dx, dy) {
      shirt.rotation.y += dx * 0.012;
      shirt.rotation.x = Math.max(-0.55, Math.min(0.55, shirt.rotation.x + dy * 0.009));
      render();
      return Math.cos(shirt.rotation.y) >= 0 ? 'front' : 'back';
    },
    pointOnFabric(clientX, clientY, side) {
      if (!activeModel) return null;
      const box = canvas.getBoundingClientRect();
      pointer.set(2 * (clientX - box.left) / box.width - 1, 1 - 2 * (clientY - box.top) / box.height);
      shirt.updateMatrixWorld();
      camera.updateMatrixWorld();
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(activeModel, true)[0];
      if (!hit?.uv || hit.object.userData.printSide !== side) return null;
      return { x: Math.round(hit.uv.x * 100), y: Math.round(hit.uv.y * 100) };
    },
    dispose() {
      request.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      shirt.traverse((part) => part.geometry?.dispose());
      Object.values(materials).forEach((material) => material.dispose());
      Object.values(textures).forEach((texture) => texture.dispose());
      jersey.dispose();
      renderer.dispose();
      // React puede volver a montar el visor sobre el mismo canvas al actualizar el modelo.
      queueMicrotask(() => { if (!canvas.isConnected) renderer.forceContextLoss(); });
    },
  };
}
