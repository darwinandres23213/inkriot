import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RedFormat, RepeatWrapping } from 'three';

// A small, tileable height map for the alternating legs of a jersey stitch.
export function createJerseyBump() {
  const size = 64;
  const heights = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const row = (y % 8) / 8;
      const column = (x % 8) / 8;
      const leg = Math.abs(column - 0.5) - (0.10 + 0.25 * row);
      const yarn = Math.exp(-95 * leg ** 2) * Math.sin(Math.PI * row) ** 0.55;
      heights[y * size + x] = Math.round(52 + 168 * yarn + 9 * Math.cos(Math.PI * x / 2));
    }
  }
  const texture = new DataTexture(heights, size, size, RedFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(31, 26);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
