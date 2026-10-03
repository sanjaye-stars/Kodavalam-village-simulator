/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Fixed-seed deterministic procedural terrain generation for the expanded world
// World bounds: [-WORLD_SIZE/2, WORLD_SIZE/2]

export interface OuterZoneTile {
  x: number;
  z: number;
  type: 'grass' | 'river' | 'pond' | 'paddy' | 'forest' | 'grove' | 'hill' | 'mountain';
  elevation: number;
  hasCrops?: boolean;
  isWestDesert?: boolean;
}

export interface TreeInstanceData {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotationY: number;
  type: 'coconut' | 'forest' | 'giant';
}

export interface CropInstanceData {
  x: number;
  y: number;
  z: number;
  colorType: number; // 0 = green, 1 = golden
}

export interface MountainBlockData {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}

// Pseudo-random noise with fixed seed for 100% deterministic reload
function createDeterministicNoise(seed = 42) {
  function hash(x: number, z: number) {
    const s = Math.sin(x * 127.1 + z * 311.7 + seed * 97.13) * 43758.5453123;
    return s - Math.floor(s);
  }

  function smooth(x: number, z: number) {
    const i = Math.floor(x);
    const j = Math.floor(z);
    const fx = x - i;
    const fz = z - j;
    const sx = fx * fx * (3 - 2 * fx);
    const sz = fz * fz * (3 - 2 * fz);

    const s = hash(i, j);
    const t = hash(i + 1, j);
    const u = hash(i, j + 1);
    const v = hash(i + 1, j + 1);

    const a = s + sx * (t - s);
    const b = u + sx * (v - u);
    return a + sz * (b - a);
  }

  return function fbm(x: number, z: number) {
    return (
      smooth(x * 0.04, z * 0.04) * 0.55 +
      smooth(x * 0.08, z * 0.08) * 0.3 +
      smooth(x * 0.16, z * 0.16) * 0.15
    );
  };
}

export function generateExpandedTerrain(worldSize: number, coreSize: number) {
  const noise = createDeterministicNoise(1337);
  const halfWorld = worldSize / 2;
  const halfCore = coreSize / 2;

  const trees: TreeInstanceData[] = [];
  const crops: CropInstanceData[] = [];
  const mountainBlocks: MountainBlockData[] = [];
  const groundTiles: OuterZoneTile[] = [];

  // Step size for outer zone grid to keep geometry lightweight
  const step = 2.0;

  for (let z = -halfWorld; z <= halfWorld; z += step) {
    for (let x = -halfWorld; x <= halfWorld; x += step) {
      // Skip the central 36x36 core (reserved for existing buildings, tea shop, etc.)
      const isInsideCore = Math.abs(x) < halfCore && Math.abs(z) < halfCore;
      if (isInsideCore) continue;

      const distFromCenter = Math.hypot(x, z);
      const edgeDist = Math.max(Math.abs(x), Math.abs(z));

      // 1. Surrounding Mountain Borders at edge of world (|x| > 72 or |z| > 72)
      if (edgeDist > halfWorld - 15) {
        const mHeight = 2.5 + noise(x * 0.2, z * 0.2) * 9.0;
        mountainBlocks.push({
          x,
          y: mHeight * 0.5,
          z,
          width: step * 1.05,
          height: mHeight,
          depth: step * 1.05,
        });
        continue;
      }

      // 2. Scenic Outer Lotus Ponds
      const isPond1 = Math.hypot(x - -36, z - -38) < 6.5;
      const isPond2 = Math.hypot(x - 38, z - 42) < 7.0;
      const isPond3 = Math.hypot(x - -40, z - 32) < 5.5;
      const isWater = isPond1 || isPond2 || isPond3;

      if (isWater) {
        groundTiles.push({
          x,
          z,
          type: 'pond',
          elevation: -0.12,
        });
        continue;
      }

      // 4. Biome determination via deterministic noise
      const nVal = noise(x, z);
      const hillElevation = nVal > 0.65 ? (nVal - 0.65) * 4.0 : 0;

      let type: OuterZoneTile['type'] = 'grass';
      let hasCrops = false;

      if (nVal > 0.72) {
        type = 'hill';
      } else if (nVal > 0.52) {
        // Paddy field terraces
        type = 'paddy';
        hasCrops = true;
      } else if (nVal > 0.38) {
        // Coconut groves
        type = 'grove';
      } else if (nVal < 0.22) {
        // Deep forest
        type = 'forest';
      }

      const isWestDesert = false;

      groundTiles.push({
        x,
        z,
        type,
        elevation: hillElevation,
        hasCrops,
        isWestDesert,
      });

      // 5. Place Instanced Flora & Trees based on biome
      // A. Paddy Crops
      if (type === 'paddy') {
        crops.push({
          x: x + (Math.sin(x * 5) * 0.4),
          y: hillElevation + 0.1,
          z: z + (Math.cos(z * 5) * 0.4),
          colorType: (Math.abs(Math.floor(x + z)) % 2),
        });
      }

      // B. Coconut Palms in Coconut Groves
      if (type === 'grove' && (Math.abs(Math.floor(x * 3 + z * 7)) % 7 === 0)) {
        trees.push({
          x: x + Math.sin(x) * 0.3,
          y: hillElevation,
          z: z + Math.cos(z) * 0.3,
          scale: 0.85 + Math.abs(Math.sin(x * 11)) * 0.35,
          rotationY: Math.sin(x + z) * Math.PI,
          type: 'coconut',
        });
      }

      // C. Forest Trees in Dense Forest
      if (type === 'forest' && (Math.abs(Math.floor(x * 5 + z * 9)) % 5 === 0)) {
        trees.push({
          x: x + Math.cos(x) * 0.4,
          y: hillElevation,
          z: z + Math.sin(z) * 0.4,
          scale: 0.9 + Math.abs(Math.cos(z * 7)) * 0.4,
          rotationY: Math.cos(x) * Math.PI,
          type: 'forest',
        });
      }

      // D. Rare Towering Giant Mega-Trees across the hills (5% density)
      if (type === 'hill' && (Math.abs(Math.floor(x * 13 + z * 17)) % 19 === 0)) {
        trees.push({
          x,
          y: hillElevation,
          z,
          scale: 1.4 + Math.abs(Math.sin(x * 3)) * 0.3,
          rotationY: (x * z) % Math.PI,
          type: 'giant',
        });
      }
    }
  }

  return {
    groundTiles,
    trees,
    crops,
    mountainBlocks,
  };
}
