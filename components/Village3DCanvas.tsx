/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { OrbitControls, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import {
  TileData,
  Villager,
  BusState,
  CowherdState,
  UserRole,
  ViewMode,
  PauranCharacter,
  PlayerCharacterState,
} from '../types';
import { MAP_SIZE, PAURAN_CHARACTERS } from '../constants';
import { generateExpandedTerrain } from '../services/terrainNoise';
import { villageAudio } from '../services/audioService';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// =========================================================================
// WORLD_SIZE: Single constant at the top of the code to easily scale terrain
// At least 5x larger in both directions (36 * 5 = 180)
// =========================================================================
export const WORLD_SIZE = 180;
export const CORE_VILLAGE_SIZE = MAP_SIZE; // 36

// Shared Geometries for Minecraft Voxel aesthetics & 60fps performance
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 16);

interface Village3DCanvasProps {
  tiles: TileData[][];
  villagers: Villager[];
  busState: BusState;
  cowherd: CowherdState;
  userRole: UserRole;
  viewMode: ViewMode;
  selectedTile: { x: number; y: number } | null;
  cameraTarget?: [number, number, number];
  playerCharacter?: PlayerCharacterState;
  selectedPauranChar?: PauranCharacter;
  onSelectTile: (x: number, y: number) => void;
  onTapCowherd: () => void;
  onTapChayakada: () => void;
  onTapBus: () => void;
  onTapCamel?: (id: string, name: string) => void;
  onTapVishnuCow?: (id: string, name: string) => void;
  onTapAsgard?: () => void;
  onTapVishnuPortrait?: () => void;
}

// Convert grid coordinate (0 to MAP_SIZE-1) to 3D world coordinate centered at [0, 0, 0]
const OFFSET = MAP_SIZE / 2 - 0.5;
const toWorld = (x: number, y: number): [number, number, number] => [x - OFFSET, 0, y - OFFSET];

// Rare scenic coordinates for the 5% Giant Mega-Trees inside core village
const GIANT_TREE_COORDS = new Set([
  '3,4',
  '3,28',
  '13,6',
  '13,28',
  '25,4',
  '25,28',
  '33,8',
  '33,24',
]);

// ==========================================
// 1. INSTANCED EXPANDED OUTER ENVIRONMENT (5x Scale Land, High Performance)
// ==========================================
const InstancedOuterWorld = React.memo(({
  playerPos,
  isPOV,
  isKingVishnuPOV,
}: {
  playerPos?: [number, number];
  isPOV?: boolean;
  isKingVishnuPOV?: boolean;
}) => {
  const { groundTiles, trees, crops, mountainBlocks } = useMemo(
    () => generateExpandedTerrain(WORLD_SIZE, CORE_VILLAGE_SIZE),
    []
  );

  // POV Optimization: in standard street POV mode, cull outer ground tiles beyond radius 30 to reduce draw calls.
  // When King Vishnu is viewing the mainland from the soaring Valaskjalf palace top floor, do NOT cull outer terrain,
  // allowing the complete, lush Kerala landscape (paddy fields, palms, hills, rivers) to stretch to the horizon!
  const visibleGroundTiles = useMemo(() => {
    if (isKingVishnuPOV) return groundTiles;
    if (!isPOV || !playerPos) return groundTiles;
    const [px, pz] = playerPos;
    return groundTiles.filter((t) => Math.hypot(t.x - px, t.z - pz) <= 30);
  }, [groundTiles, isPOV, playerPos, isKingVishnuPOV]);

  const coconutPalms = useMemo(() => trees.filter((t) => t.type === 'coconut'), [trees]);
  const forestTrees = useMemo(() => trees.filter((t) => t.type === 'forest'), [trees]);
  const giantTrees = useMemo(() => trees.filter((t) => t.type === 'giant'), [trees]);

  // Instanced refs for single-draw-call rendering
  const palmTrunkRef = useRef<THREE.InstancedMesh>(null);
  const palmFrondRef = useRef<THREE.InstancedMesh>(null);

  const forestTrunkRef = useRef<THREE.InstancedMesh>(null);
  const forestLeavesRef = useRef<THREE.InstancedMesh>(null);

  const giantTrunkRef = useRef<THREE.InstancedMesh>(null);
  const giantCanopyRef = useRef<THREE.InstancedMesh>(null);

  const cropsRef = useRef<THREE.InstancedMesh>(null);
  const mountainRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const dummy = new THREE.Object3D();

    // 1. Coconut Palms
    if (palmTrunkRef.current && palmFrondRef.current) {
      coconutPalms.forEach((p, i) => {
        dummy.position.set(p.x, p.y + 2.5 * p.scale, p.z);
        dummy.rotation.set(0.06, p.rotationY, 0.06);
        dummy.scale.set(0.3 * p.scale, 5.0 * p.scale, 0.3 * p.scale);
        dummy.updateMatrix();
        palmTrunkRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(p.x, p.y + 5.1 * p.scale, p.z);
        dummy.rotation.set(0, p.rotationY, 0);
        dummy.scale.set(2.4 * p.scale, 0.45 * p.scale, 2.4 * p.scale);
        dummy.updateMatrix();
        palmFrondRef.current!.setMatrixAt(i, dummy.matrix);
      });
      palmTrunkRef.current.instanceMatrix.needsUpdate = true;
      palmFrondRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Forest Trees
    if (forestTrunkRef.current && forestLeavesRef.current) {
      forestTrees.forEach((t, i) => {
        dummy.position.set(t.x, t.y + 1.8 * t.scale, t.z);
        dummy.rotation.set(0, t.rotationY, 0);
        dummy.scale.set(0.6 * t.scale, 3.6 * t.scale, 0.6 * t.scale);
        dummy.updateMatrix();
        forestTrunkRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x, t.y + 4.2 * t.scale, t.z);
        dummy.rotation.set(0, t.rotationY, 0);
        dummy.scale.set(2.8 * t.scale, 2.2 * t.scale, 2.8 * t.scale);
        dummy.updateMatrix();
        forestLeavesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      forestTrunkRef.current.instanceMatrix.needsUpdate = true;
      forestLeavesRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Giant Mega-Trees
    if (giantTrunkRef.current && giantCanopyRef.current) {
      giantTrees.forEach((gt, i) => {
        dummy.position.set(gt.x, gt.y + 4.5 * gt.scale, gt.z);
        dummy.rotation.set(0, gt.rotationY, 0);
        dummy.scale.set(1.4 * gt.scale, 9.0 * gt.scale, 1.4 * gt.scale);
        dummy.updateMatrix();
        giantTrunkRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(gt.x, gt.y + 9.5 * gt.scale, gt.z);
        dummy.rotation.set(0, gt.rotationY, 0);
        dummy.scale.set(5.2 * gt.scale, 4.0 * gt.scale, 5.2 * gt.scale);
        dummy.updateMatrix();
        giantCanopyRef.current!.setMatrixAt(i, dummy.matrix);
      });
      giantTrunkRef.current.instanceMatrix.needsUpdate = true;
      giantCanopyRef.current.instanceMatrix.needsUpdate = true;
    }

    // 4. Crops
    if (cropsRef.current) {
      crops.forEach((c, i) => {
        dummy.position.set(c.x, c.y + 0.18, c.z);
        dummy.rotation.set(0, (c.x * c.z) % Math.PI, 0);
        dummy.scale.set(0.35, 0.45, 0.35);
        dummy.updateMatrix();
        cropsRef.current!.setMatrixAt(i, dummy.matrix);
      });
      cropsRef.current.instanceMatrix.needsUpdate = true;
    }

    // 5. Surrounding Mountain Blocks (Edge of the World)
    if (mountainRef.current) {
      mountainBlocks.forEach((m, i) => {
        dummy.position.set(m.x, m.y, m.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(m.width, m.height, m.depth);
        dummy.updateMatrix();
        mountainRef.current!.setMatrixAt(i, dummy.matrix);
      });
      mountainRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [coconutPalms, forestTrees, giantTrees, crops, mountainBlocks]);

  return (
    <group>
      {/* 1. Coconut Palms */}
      {coconutPalms.length > 0 && (
        <>
          <instancedMesh
            ref={palmTrunkRef}
            args={[boxGeo, undefined, coconutPalms.length]}
            castShadow
            receiveShadow
            frustumCulled
          >
            <meshStandardMaterial color="#65350f" roughness={0.9} />
          </instancedMesh>
          <instancedMesh
            ref={palmFrondRef}
            args={[boxGeo, undefined, coconutPalms.length]}
            castShadow
            frustumCulled
          >
            <meshStandardMaterial color="#15803d" roughness={0.7} />
          </instancedMesh>
        </>
      )}

      {/* 2. Forest Trees */}
      {forestTrees.length > 0 && (
        <>
          <instancedMesh
            ref={forestTrunkRef}
            args={[boxGeo, undefined, forestTrees.length]}
            castShadow
            receiveShadow
            frustumCulled
          >
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </instancedMesh>
          <instancedMesh
            ref={forestLeavesRef}
            args={[boxGeo, undefined, forestTrees.length]}
            castShadow
            frustumCulled
          >
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </instancedMesh>
        </>
      )}

      {/* 3. Giant Mega-Trees (5% density) */}
      {giantTrees.length > 0 && (
        <>
          <instancedMesh
            ref={giantTrunkRef}
            args={[boxGeo, undefined, giantTrees.length]}
            castShadow
            receiveShadow
            frustumCulled
          >
            <meshStandardMaterial color="#381c08" roughness={0.9} />
          </instancedMesh>
          <instancedMesh
            ref={giantCanopyRef}
            args={[boxGeo, undefined, giantTrees.length]}
            castShadow
            frustumCulled
          >
            <meshStandardMaterial color="#1b6326" roughness={0.8} />
          </instancedMesh>
        </>
      )}

      {/* 4. Paddy Crops */}
      {crops.length > 0 && (
        <instancedMesh ref={cropsRef} args={[boxGeo, undefined, crops.length]} castShadow frustumCulled>
          <meshStandardMaterial color="#ca8a04" roughness={0.8} />
        </instancedMesh>
      )}

      {/* 5. Edge Mountain Blocks (Enclosing world & hiding void) */}
      {mountainBlocks.length > 0 && (
        <instancedMesh
          ref={mountainRef}
          args={[boxGeo, undefined, mountainBlocks.length]}
          receiveShadow
          castShadow
          frustumCulled
        >
          <meshStandardMaterial color="#334155" roughness={0.95} />
        </instancedMesh>
      )}

      {/* 6. Render Outer Ground Tiles (Ponds, River extensions, Terraces, Hills) */}
      {visibleGroundTiles.map((tile, i) => {
        const isWater = tile.type === 'river' || tile.type === 'pond';

        return (
          <group key={i} position={[tile.x, tile.elevation * 0.5, tile.z]}>
            {isWater ? (
              <mesh geometry={boxGeo} position={[0, -0.06, 0]} scale={[2.0, 0.14, 2.0]}>
                <meshStandardMaterial color="#0284c7" transparent opacity={0.88} roughness={0.1} />
              </mesh>
            ) : tile.type === 'paddy' ? (
              <mesh geometry={boxGeo} position={[0, -0.05, 0]} scale={[2.0, 0.12, 2.0]} receiveShadow>
                <meshStandardMaterial color="#3f2e18" roughness={0.9} />
              </mesh>
            ) : tile.type === 'hill' ? (
              <mesh geometry={boxGeo} position={[0, 0, 0]} scale={[2.0, Math.max(0.25, tile.elevation), 2.0]} receiveShadow castShadow>
                <meshStandardMaterial color="#475569" roughness={0.9} />
              </mesh>
            ) : (
              <mesh geometry={boxGeo} position={[0, -0.05, 0]} scale={[2.0, 0.12, 2.0]} receiveShadow>
                <meshStandardMaterial
                  color={tile.type === 'grove' ? '#4d7c0f' : tile.type === 'forest' ? '#14532d' : '#55aa22'}
                  roughness={0.85}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
});

// ==========================================
// 2. GIGANTIC MINECRAFT MEGA-VOXEL TREE (5% density)
// ==========================================
const GiantMinecraftTree3D = React.memo(({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      {[-0.65, 0.65].map((rx, i) => (
        <mesh key={`rx-${i}`} geometry={boxGeo} position={[rx, 0.35, 0]} scale={[0.5, 0.7, 1.1]} castShadow>
          <meshStandardMaterial color="#4a2810" roughness={0.9} />
        </mesh>
      ))}
      {[-0.65, 0.65].map((rz, i) => (
        <mesh key={`rz-${i}`} geometry={boxGeo} position={[0, 0.35, rz]} scale={[1.1, 0.7, 0.5]} castShadow>
          <meshStandardMaterial color="#4a2810" roughness={0.9} />
        </mesh>
      ))}
      <mesh geometry={boxGeo} position={[0, 4.2, 0]} scale={[1.2, 8.4, 1.2]} castShadow receiveShadow>
        <meshStandardMaterial color="#5c3818" roughness={0.9} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 7.8, 0]} scale={[4.6, 1.6, 4.6]} castShadow>
        <meshStandardMaterial color="#1b6326" roughness={0.8} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 9.2, 0]} scale={[3.8, 1.6, 3.8]} castShadow>
        <meshStandardMaterial color="#227a2e" roughness={0.8} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 10.6, 0]} scale={[2.8, 1.4, 2.8]} castShadow>
        <meshStandardMaterial color="#2a9138" roughness={0.8} />
      </mesh>
    </group>
  );
});

// ==========================================
// 3. MINECRAFT VOXEL CLOUDS
// ==========================================
const MinecraftClouds3D = React.memo(() => {
  const cloudsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.position.x += delta * 0.45;
      if (cloudsRef.current.position.x > 65) {
        cloudsRef.current.position.x = -65;
      }
    }
  });

  return (
    <group ref={cloudsRef} position={[0, 22, 0]}>
      {[
        [-35, 0, -20, 14, 0.5, 9],
        [-10, 0.5, -35, 18, 0.5, 10],
        [25, -0.3, 15, 20, 0.5, 11],
        [-20, 0.2, 30, 16, 0.5, 9],
        [5, 0, 5, 12, 0.5, 8],
      ].map(([cx, cy, cz, sx, sy, sz], i) => (
        <mesh key={i} geometry={boxGeo} position={[cx, cy, cz]} scale={[sx, sy, sz]}>
          <meshStandardMaterial color="#ffffff" transparent opacity={0.82} />
        </mesh>
      ))}
    </group>
  );
});

// ==========================================
// 3B. MINECRAFT GLOWING RADIANT VOXEL SUN
// ==========================================
const MinecraftSun3D = React.memo(() => {
  const coronaRef = useRef<THREE.Mesh>(null);
  const raysRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (coronaRef.current) {
      const pulse = 1.0 + Math.sin(t * 2) * 0.08;
      coronaRef.current.scale.set(pulse * 18, pulse * 18, 0.9);
    }
    if (raysRef.current) {
      raysRef.current.rotation.z = t * 0.05;
    }
  });

  return (
    <group position={[65, 105, 65]} rotation={[-0.45, 0.45, 0]}>
      {/* Central Radiant Golden Core Cube */}
      <mesh geometry={boxGeo} scale={[14, 14, 1.4]}>
        <meshBasicMaterial color="#fffbeb" />
      </mesh>
      {/* Outer Glowing Golden Corona Cube */}
      <mesh ref={coronaRef} geometry={boxGeo} scale={[18, 18, 0.9]}>
        <meshBasicMaterial color="#fde047" transparent opacity={0.7} />
      </mesh>
      {/* Extended Warm Solar Flare Rays */}
      <group ref={raysRef}>
        <mesh geometry={boxGeo} scale={[24, 24, 0.5]}>
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.32} />
        </mesh>
        <mesh geometry={boxGeo} rotation={[0, 0, Math.PI / 4]} scale={[24, 24, 0.5]}>
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.25} />
        </mesh>
      </group>
    </group>
  );
});

// ==========================================
// 4. CHAYAKKADA (TEA SHOP)
// ==========================================
const MinecraftChayakada3D = ({
  position,
  onClick,
}: {
  position: [number, number, number];
  onClick: () => void;
}) => {
  const steamRef = useRef<THREE.Group>(null);
  const posVec = useMemo(() => new THREE.Vector3(...position), [position]);

  // LOD: Only animate steam puff when camera is near (distance <= 65)
  useFrame(({ camera }) => {
    if (camera.position.distanceTo(posVec) > 65) return;
    if (steamRef.current) {
      steamRef.current.children.forEach((cloud, i) => {
        cloud.position.y += 0.01 + i * 0.003;
        if (cloud.position.y > 0.8) {
          cloud.position.y = 0;
        }
      });
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <mesh geometry={boxGeo} position={[0, 0.1, 0]} scale={[0.96, 0.2, 0.96]} receiveShadow castShadow>
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 0.46, -0.1]} scale={[0.84, 0.54, 0.64]} castShadow>
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 0.84, 0]} scale={[0.98, 0.22, 0.98]} castShadow>
        <meshStandardMaterial color="#b91c1c" roughness={0.7} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 0.82, 0.5]} scale={[0.74, 0.16, 0.04]}>
        <meshStandardMaterial color="#fef08a" />
      </mesh>
      <Text position={[0, 0.82, 0.53]} fontSize={0.075} color="#b91c1c" anchorX="center" anchorY="middle" fontWeight="bold">
        CHAYAKKADA
      </Text>
      <mesh geometry={boxGeo} position={[0.2, 0.48, 0.3]} scale={[0.16, 0.2, 0.16]} castShadow>
        <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
      </mesh>
      <group ref={steamRef} position={[0.2, 0.62, 0.3]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={boxGeo} position={[0, i * 0.18, 0]} scale={[0.05, 0.05, 0.05]}>
            <meshStandardMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ==========================================
// 5. SREELAKAM BLUE PRIVATE BUS
// ==========================================
const MinecraftSreelakamBus3D = ({
  busState,
  onClick,
}: {
  busState: BusState;
  onClick: () => void;
}) => {
  if (busState.status === 'departed') return null;
  const [baseX, _, baseZ] = toWorld(22.2 + busState.progress * 0.8, 17.1);

  return (
    <group
      position={[baseX, 0.28, baseZ]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <mesh geometry={boxGeo} position={[0, 0.22, 0]} scale={[1.34, 0.56, 0.54]} castShadow>
        <meshStandardMaterial color="#0284c7" roughness={0.5} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 0.18, 0.275]} scale={[1.32, 0.08, 0.02]}>
        <meshStandardMaterial color="#facc15" />
      </mesh>
      <Text position={[0, 0.28, 0.29]} fontSize={0.11} color="#fef08a" anchorX="center" anchorY="middle" fontWeight="bold">
        SREELAKAM
      </Text>
      <Text position={[0, 0.28, -0.29]} rotation={[0, Math.PI, 0]} fontSize={0.11} color="#fef08a" anchorX="center" anchorY="middle" fontWeight="bold">
        SREELAKAM
      </Text>
      <mesh geometry={boxGeo} position={[0.68, 0.2, 0]} scale={[0.02, 0.24, 0.46]}>
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.7} roughness={0.1} />
      </mesh>
      {[-0.44, 0.44].map((x, i) =>
        [-0.27, 0.27].map((z, j) => (
          <mesh key={`${i}-${j}`} geometry={boxGeo} position={[x, -0.08, z]} scale={[0.2, 0.18, 0.08]}>
            <meshStandardMaterial color="#09090b" />
          </mesh>
        ))
      )}
    </group>
  );
};

// ==========================================
// 6. DETAIL 1: MAN WITH COW: DAMU & GOMATHI
// ==========================================
const MinecraftCowherd3D = ({
  cowherd,
  onClick,
}: {
  cowherd: CowherdState;
  onClick: () => void;
}) => {
  const [px, py, pz] = toWorld(cowherd.x, cowherd.y);
  const posVec = useMemo(() => new THREE.Vector3(px, py, pz), [px, py, pz]);

  const rotationY =
    cowherd.direction === 'right'
      ? Math.PI / 2
      : cowherd.direction === 'left'
      ? -Math.PI / 2
      : cowherd.direction === 'down'
      ? 0
      : Math.PI;

  const legSwingRef = useRef<THREE.Group>(null);
  const cowLegRef = useRef<THREE.Group>(null);

  // LOD: Only animate leg swings when camera is within 85 units
  useFrame(({ clock, camera }) => {
    if (camera.position.distanceTo(posVec) > 85) return;
    const t = clock.getElapsedTime() * 7;
    const isWalking = !cowherd.isGrazing;

    if (legSwingRef.current && isWalking) {
      legSwingRef.current.children[0].rotation.x = Math.sin(t) * 0.4;
      legSwingRef.current.children[1].rotation.x = -Math.sin(t) * 0.4;
    }
    if (cowLegRef.current && isWalking) {
      cowLegRef.current.children[0].rotation.x = Math.sin(t) * 0.35;
      cowLegRef.current.children[1].rotation.x = -Math.sin(t) * 0.35;
      cowLegRef.current.children[2].rotation.x = -Math.sin(t) * 0.35;
      cowLegRef.current.children[3].rotation.x = Math.sin(t) * 0.35;
    }
  });

  return (
    <group
      position={[px, py, pz]}
      rotation={[0, rotationY, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* 1. DAMU: MINECRAFT VILLAGER MODEL */}
      <group position={[0, 0, 0]}>
        <mesh geometry={boxGeo} position={[0, 0.72, 0]} scale={[0.3, 0.34, 0.28]} castShadow>
          <meshStandardMaterial color="#d97706" roughness={0.8} />
        </mesh>
        {/* Villager Nose */}
        <mesh geometry={boxGeo} position={[0, 0.68, 0.18]} scale={[0.08, 0.16, 0.09]} castShadow>
          <meshStandardMaterial color="#c2410c" roughness={0.8} />
        </mesh>
        {/* Thalappavu (Turban) */}
        <mesh geometry={boxGeo} position={[0, 0.88, 0]} scale={[0.34, 0.12, 0.32]} castShadow>
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        {/* Shirt */}
        <mesh geometry={boxGeo} position={[0, 0.44, 0]} scale={[0.36, 0.38, 0.22]} castShadow>
          <meshStandardMaterial color="#ea580c" roughness={0.8} />
        </mesh>
        {/* Folded Arms holding lead rope */}
        <mesh geometry={boxGeo} position={[0, 0.4, 0.12]} scale={[0.38, 0.14, 0.12]} castShadow>
          <meshStandardMaterial color="#c2410c" />
        </mesh>
        {/* Legs in Mundu (Dhoti) with Gold Border */}
        <group ref={legSwingRef} position={[0, 0.22, 0]}>
          <group position={[-0.09, 0, 0]}>
            <mesh geometry={boxGeo} position={[0, -0.11, 0]} scale={[0.15, 0.22, 0.15]} castShadow>
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh geometry={boxGeo} position={[0, -0.21, 0]} scale={[0.152, 0.03, 0.152]}>
              <meshStandardMaterial color="#eab308" />
            </mesh>
          </group>
          <group position={[0.09, 0, 0]}>
            <mesh geometry={boxGeo} position={[0, -0.11, 0]} scale={[0.15, 0.22, 0.15]} castShadow>
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh geometry={boxGeo} position={[0, -0.21, 0]} scale={[0.152, 0.03, 0.152]}>
              <meshStandardMaterial color="#eab308" />
            </mesh>
          </group>
        </group>
      </group>

      {/* 2. GOMATHI: MINECRAFT COW */}
      <group position={[0, 0, -0.75]}>
        <mesh geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.48, 0.38, 0.72]} castShadow>
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        <mesh geometry={boxGeo} position={[0.25, 0.36, 0.08]} scale={[0.02, 0.22, 0.3]}>
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh geometry={boxGeo} position={[-0.25, 0.34, -0.1]} scale={[0.02, 0.24, 0.28]}>
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh geometry={boxGeo} position={[0, 0.16, -0.12]} scale={[0.16, 0.08, 0.2]}>
          <meshStandardMaterial color="#f472b6" />
        </mesh>
        <group ref={cowLegRef}>
          {[-0.16, 0.16].map((lx, i) =>
            [0.24, -0.24].map((lz, j) => (
              <mesh key={`${i}-${j}`} geometry={boxGeo} position={[lx, 0.14, lz]} scale={[0.11, 0.28, 0.11]} castShadow>
                <meshStandardMaterial color="#78350f" />
              </mesh>
            ))
          )}
        </group>
        <group position={[0, cowherd.isGrazing ? 0.22 : 0.44, 0.42]} rotation={[cowherd.isGrazing ? 0.45 : 0, 0, 0]}>
          <mesh geometry={boxGeo} position={[0, 0, 0]} scale={[0.28, 0.28, 0.26]} castShadow>
            <meshStandardMaterial color="#854d0e" />
          </mesh>
          <mesh geometry={boxGeo} position={[0, -0.06, 0.14]} scale={[0.2, 0.14, 0.08]}>
            <meshStandardMaterial color="#f472b6" />
          </mesh>
          {[-0.13, 0.13].map((hx, i) => (
            <mesh key={i} geometry={boxGeo} position={[hx, 0.14, -0.04]} scale={[0.04, 0.1, 0.04]}>
              <meshStandardMaterial color="#e7e5e4" />
            </mesh>
          ))}
        </group>
      </group>

      {/* 3. LEAD ROPE FROM DAMU'S HAND TO GOMATHI */}
      <mesh geometry={boxGeo} position={[0, 0.38, -0.36]} rotation={[-0.15, 0, 0]} scale={[0.02, 0.02, 0.72]}>
        <meshStandardMaterial color="#d4d4d8" roughness={0.9} />
      </mesh>

      {/* 4. Speech Bubble / Name Banner */}
      {cowherd.bubbleText ? (
        <Float speed={4} rotationIntensity={0} floatIntensity={0.08}>
          <group position={[0, 1.25, 0]}>
            <mesh geometry={boxGeo} position={[0, 0, -0.01]} scale={[1.8, 0.4, 0.02]}>
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <Text fontSize={0.08} color="#1c1917" maxWidth={1.7} textAlign="center" anchorX="center" anchorY="middle" fontWeight="bold">
              {cowherd.bubbleText}
            </Text>
          </group>
        </Float>
      ) : (
        <Float speed={2} rotationIntensity={0} floatIntensity={0.05}>
          <Text position={[0, 1.15, 0]} fontSize={0.11} color="#fef08a" anchorX="center" anchorY="middle" fontWeight="bold">
            DAMU
          </Text>
        </Float>
      )}
    </group>
  );
};

// ==========================================
// 7. PLAYABLE PAURAN CHARACTER (Moved by W, A, S, D & On-Screen D-Pad)
// ==========================================
const PlayablePauranCharacter3D = ({
  player,
  character,
}: {
  player: PlayerCharacterState;
  character: PauranCharacter;
}) => {
  const legRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (player.isMoving) {
      const t = clock.getElapsedTime() * 11;
      if (legRef.current) {
        legRef.current.children[0].rotation.x = Math.sin(t) * 0.55;
        legRef.current.children[1].rotation.x = -Math.sin(t) * 0.55;
      }
      if (armRef.current) {
        armRef.current.children[0].rotation.x = -Math.sin(t) * 0.5;
        armRef.current.children[1].rotation.x = Math.sin(t) * 0.5;
      }
    } else {
      if (legRef.current) {
        legRef.current.children[0].rotation.x = 0;
        legRef.current.children[1].rotation.x = 0;
      }
      if (armRef.current) {
        armRef.current.children[0].rotation.x = 0;
        armRef.current.children[1].rotation.x = 0;
      }
    }
  });

  const tagWidth = Math.max(1.1, (character.name.length + 6) * 0.058);
  const isKingVishnu = character.id === 'king_vishnu';
  const baseY = isKingVishnu ? 27.9 : 0;

  return (
    <group position={[player.x, baseY, player.z]} rotation={[0, player.rotationY, 0]}>
      {/* Floating Name Tag */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.05}>
        <group position={[0, 1.35, 0]}>
          <mesh geometry={boxGeo} position={[0, 0, -0.01]} scale={[tagWidth, 0.22, 0.02]}>
            <meshBasicMaterial color="#022c22" />
          </mesh>
          <Text fontSize={0.088} color="#6ee7b7" anchorX="center" anchorY="middle" fontWeight="bold">
            {character.name} (You)
          </Text>
        </group>
      </Float>

      {/* Head */}
      <mesh geometry={boxGeo} position={[0, 0.76, 0]} scale={[0.28, 0.3, 0.26]} castShadow>
        <meshStandardMaterial color={character.skinTone} roughness={0.8} />
      </mesh>
      {/* Hair / Headgear */}
      <mesh geometry={boxGeo} position={[0, 0.9, 0]} scale={[0.3, 0.1, 0.28]} castShadow>
        <meshStandardMaterial color={character.hairColor} />
      </mesh>
      {/* Scarf / Accessory */}
      <mesh geometry={boxGeo} position={[0, 0.86, 0]} scale={[0.32, 0.05, 0.3]}>
        <meshStandardMaterial color={character.accessoryColor} />
      </mesh>
      {/* Villager Nose */}
      <mesh geometry={boxGeo} position={[0, 0.72, 0.15]} scale={[0.07, 0.14, 0.08]} castShadow>
        <meshStandardMaterial color="#b45309" />
      </mesh>

      {/* Torso in Chosen Outfit Color */}
      <mesh geometry={boxGeo} position={[0, 0.46, 0]} scale={[0.34, 0.36, 0.2]} castShadow>
        <meshStandardMaterial color={character.outfitColor} roughness={0.8} />
      </mesh>

      {/* Animated Swinging Arms */}
      <group ref={armRef} position={[0, 0.46, 0]}>
        {/* Left Arm */}
        <mesh geometry={boxGeo} position={[-0.22, -0.1, 0]} scale={[0.1, 0.32, 0.1]} castShadow>
          <meshStandardMaterial color={character.outfitColor} />
        </mesh>
        {/* Right Arm */}
        <mesh geometry={boxGeo} position={[0.22, -0.1, 0]} scale={[0.1, 0.32, 0.1]} castShadow>
          <meshStandardMaterial color={character.outfitColor} />
        </mesh>
      </group>

      {/* Animated Swinging Legs in Mundu / Salwar */}
      <group ref={legRef} position={[0, 0.25, 0]}>
        {/* Left Leg */}
        <mesh geometry={boxGeo} position={[-0.08, -0.12, 0]} scale={[0.14, 0.26, 0.14]} castShadow>
          <meshStandardMaterial color={character.munduColor} />
        </mesh>
        {/* Right Leg */}
        <mesh geometry={boxGeo} position={[0.08, -0.12, 0]} scale={[0.14, 0.26, 0.14]} castShadow>
          <meshStandardMaterial color={character.munduColor} />
        </mesh>
      </group>
    </group>
  );
};

// ==========================================
// 8. TOWERING BURJ KHALIFA AT CENTER OF MAP (TALLER THAN TREES)
// ==========================================
const MinecraftBurjKhalifa3D = React.memo(() => {
  const beaconRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      const pulse = Math.sin(clock.getElapsedTime() * 7) > 0 ? 1 : 0.2;
      (beaconRef.current.material as THREE.MeshStandardMaterial).opacity = pulse;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Grand River Island Plaza */}
      <mesh geometry={boxGeo} position={[0, 0.15, 0]} scale={[4.8, 0.3, 4.8]} receiveShadow castShadow>
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 0.35, 0]} scale={[4.0, 0.15, 4.0]} receiveShadow castShadow>
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>

      {/* Gold Welcome Plaque */}
      <Text position={[0, 0.45, 2.05]} fontSize={0.16} color="#ca8a04" anchorX="center" anchorY="middle" fontWeight="bold">
        BURJ KHALIFA
      </Text>
      <Text position={[0, 0.28, 2.05]} fontSize={0.09} color="#64748b" anchorX="center" anchorY="middle">
        DUBAI · 828M
      </Text>

      {/* 2. Tier 1: Y-Shaped Base Wings & Core (y: 0.4 to 9.0) */}
      <mesh geometry={boxGeo} position={[0, 4.7, 0]} scale={[2.5, 8.6, 2.5]} castShadow receiveShadow>
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* South Wing */}
      <mesh geometry={boxGeo} position={[0, 4.2, 1.3]} scale={[1.1, 7.6, 1.2]} castShadow>
        <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.7} />
      </mesh>
      {/* North-West Wing */}
      <mesh geometry={boxGeo} position={[-1.1, 3.8, -0.7]} scale={[1.1, 6.8, 1.1]} castShadow>
        <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.7} />
      </mesh>
      {/* North-East Wing */}
      <mesh geometry={boxGeo} position={[1.1, 3.4, -0.7]} scale={[1.1, 6.0, 1.1]} castShadow>
        <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.7} />
      </mesh>

      {/* 3. Tier 2: Mid-Level Setback Tower (y: 9.0 to 18.0) */}
      <mesh geometry={boxGeo} position={[0, 13.5, 0]} scale={[1.9, 9.0, 1.9]} castShadow receiveShadow>
        <meshStandardMaterial color="#7dd3fc" roughness={0.15} metalness={0.85} />
      </mesh>
      {/* Setback accent wing */}
      <mesh geometry={boxGeo} position={[0, 12.0, 0.85]} scale={[0.8, 7.0, 0.7]} castShadow>
        <meshStandardMaterial color="#0369a1" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* 4. Tier 3: High-Rise Setback Tower (y: 18.0 to 26.0) */}
      <mesh geometry={boxGeo} position={[0, 22.0, 0]} scale={[1.4, 8.0, 1.4]} castShadow receiveShadow>
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.85} />
      </mesh>

      {/* 5. Tier 4: Observation Deck "At The Top" (y: 26.0 to 32.0) */}
      <mesh geometry={boxGeo} position={[0, 29.0, 0]} scale={[1.05, 6.0, 1.05]} castShadow>
        <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Glowing 360-degree Observation Deck Ring */}
      <mesh geometry={boxGeo} position={[0, 28.5, 0]} scale={[1.2, 0.6, 1.2]} castShadow>
        <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.6} />
      </mesh>
      <Text position={[0, 28.5, 0.62]} fontSize={0.1} color="#78350f" anchorX="center" anchorY="middle" fontWeight="bold">
        AT THE TOP
      </Text>

      {/* 6. Tier 5: Upper Spire Section (y: 32.0 to 38.0) */}
      <mesh geometry={boxGeo} position={[0, 35.0, 0]} scale={[0.65, 6.0, 0.65]} castShadow>
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* 7. Tier 6: Telescopic Steel Spire (y: 38.0 to 44.0) */}
      <mesh geometry={boxGeo} position={[0, 41.0, 0]} scale={[0.3, 6.0, 0.3]} castShadow>
        <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* 8. Summit Antenna Needle (y: 44.0 to 47.2) */}
      <mesh geometry={cylinderGeo} position={[0, 45.6, 0]} scale={[0.07, 3.2, 0.07]} castShadow>
        <meshStandardMaterial color="#cbd5e1" metalness={0.98} />
      </mesh>

      {/* 9. Blinking Red Aircraft Warning Beacon at Pinnacle (Reaching 47.3 blocks high!) */}
      <mesh ref={beaconRef} geometry={boxGeo} position={[0, 47.3, 0]} scale={[0.18, 0.18, 0.18]}>
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.2} transparent opacity={1} />
      </mesh>
    </group>
  );
});

// ==========================================
// 8B. BIG HUGE ROYAL PORTRAIT FRAME AT END OF VISHNU'S KINGDOM
// "HIS HIGHNESS LORD VISHNU"
// ==========================================
const MinecraftVishnuPortraitFrame3D = React.memo(({
  position,
  onClick,
}: {
  position: [number, number, number];
  onClick: () => void;
}) => {
  const flame1Ref = useRef<THREE.Mesh>(null);
  const flame2Ref = useRef<THREE.Mesh>(null);

  // Dynamic royal portrait canvas texture created from Vishnu's real likeness
  const portraitTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background: Royal Middle Eastern palace drapery & arches
    const bgGrad = ctx.createLinearGradient(0, 0, 512, 768);
    bgGrad.addColorStop(0, '#2d0606');
    bgGrad.addColorStop(0.3, '#500724');
    bgGrad.addColorStop(0.7, '#1c1917');
    bgGrad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 768);

    // Golden Royal Palace Arch in Background
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(256, 310, 210, Math.PI, 0);
    ctx.stroke();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 310, 195, Math.PI, 0);
    ctx.stroke();

    // Subtle golden aura glow behind head
    const aura = ctx.createRadialGradient(256, 250, 20, 256, 250, 180);
    aura.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
    aura.addColorStop(0.6, 'rgba(202, 138, 4, 0.2)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, 512, 768);

    // Royal Attire - Shoulders & Torso (Based on photo posture & regal landlord attire)
    // Cream / ivory royal landlord tunic with golden zari embroidery
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(110, 768);
    ctx.quadraticCurveTo(120, 480, 256, 470);
    ctx.quadraticCurveTo(392, 480, 402, 768);
    ctx.fill();

    // Royal Crimson Velvet Draped Shawl across shoulders
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(90, 768);
    ctx.quadraticCurveTo(110, 500, 180, 520);
    ctx.lineTo(210, 768);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(422, 768);
    ctx.quadraticCurveTo(402, 500, 332, 520);
    ctx.lineTo(302, 768);
    ctx.fill();

    // Gold Brocade Collar & Zari Bands
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(180, 520);
    ctx.quadraticCurveTo(256, 560, 332, 520);
    ctx.stroke();

    // Heavy Royal Gold Chain & Ruby Pendant (Landlord of Vishnu's Kingdom)
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(256, 490, 80, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Ruby Medallion
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(256, 570, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Neck
    ctx.fillStyle = '#b47348';
    ctx.beginPath();
    ctx.moveTo(220, 480);
    ctx.lineTo(220, 380);
    ctx.quadraticCurveTo(256, 400, 292, 380);
    ctx.lineTo(292, 480);
    ctx.fill();

    // Head / Face (Oval with defined jawline as in photo)
    ctx.fillStyle = '#c58558';
    ctx.beginPath();
    ctx.ellipse(256, 280, 88, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jawline and cheek contours
    ctx.fillStyle = '#ba784a';
    ctx.beginPath();
    ctx.moveTo(180, 290);
    ctx.quadraticCurveTo(256, 400, 332, 290);
    ctx.fill();

    // Facial features matching photo:
    // Short dark hair with volume styled up
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.moveTo(165, 260);
    ctx.quadraticCurveTo(150, 180, 210, 160);
    ctx.quadraticCurveTo(256, 140, 310, 160);
    ctx.quadraticCurveTo(360, 180, 347, 260);
    ctx.quadraticCurveTo(310, 200, 256, 200);
    ctx.quadraticCurveTo(200, 200, 165, 260);
    ctx.fill();

    // Intense dark eyebrows (commanding landlord expression)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(200, 255);
    ctx.lineTo(240, 252);
    ctx.moveTo(272, 252);
    ctx.lineTo(312, 255);
    ctx.stroke();

    // Intense penetrating eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(220, 268, 14, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(292, 268, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(220, 268, 7, 0, Math.PI * 2);
    ctx.arc(292, 268, 7, 0, Math.PI * 2);
    ctx.fill();

    // Sharp straight nose
    ctx.strokeStyle = '#8c532b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(256, 258);
    ctx.lineTo(252, 312);
    ctx.lineTo(262, 315);
    ctx.stroke();

    // Neat mustache & chin stubble matching photo
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(256, 332, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lips
    ctx.fillStyle = '#9f5b40';
    ctx.beginPath();
    ctx.ellipse(256, 344, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chin stubble
    ctx.fillStyle = 'rgba(28, 25, 23, 0.4)';
    ctx.beginPath();
    ctx.ellipse(256, 368, 30, 16, 0, 0, Math.PI);
    ctx.fill();

    // Royal Golden Diadem / Crown with Ruby
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(175, 185);
    ctx.lineTo(215, 145);
    ctx.lineTo(256, 120);
    ctx.lineTo(297, 145);
    ctx.lineTo(337, 185);
    ctx.lineTo(256, 175);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Ruby on Crown
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(256, 142, 10, 0, Math.PI * 2);
    ctx.fill();

    // Bottom Title Banner on Portrait
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(20, 680, 472, 68);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 680, 472, 68);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 26px serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIS HIGHNESS LORD VISHNU', 256, 715);

    ctx.fillStyle = '#fde68a';
    ctx.font = '14px sans-serif';
    ctx.fillText('THE LANDLORD OF VISHNU\'S KINGDOM', 256, 736);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 6;
    if (flame1Ref.current) {
      flame1Ref.current.scale.y = 0.8 + Math.sin(t) * 0.25;
    }
    if (flame2Ref.current) {
      flame2Ref.current.scale.y = 0.8 + Math.cos(t * 1.2) * 0.25;
    }
  });

  return (
    <group
      position={position}
      rotation={[0, Math.PI / 2, 0]} // Faces East down the Royal Highway towards the bridge
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* 1. Grand Ceremonial Pedestal with Red Carpet Steps */}
      <mesh geometry={boxGeo} position={[0, 0.35, 0]} scale={[8.2, 0.7, 3.2]} receiveShadow castShadow>
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 0.75, 0]} scale={[7.4, 0.4, 2.6]} receiveShadow castShadow>
        <meshStandardMaterial color="#eab308" metalness={0.7} />
      </mesh>
      {/* Red Carpet Stairs in front */}
      {[0, 1, 2].map((step) => (
        <mesh key={`rc-${step}`} geometry={boxGeo} position={[0, 0.18 + step * 0.2, 1.4 + (2 - step) * 0.3]} scale={[2.6, 0.2, 0.35]}>
          <meshStandardMaterial color="#b91c1c" roughness={0.6} />
        </mesh>
      ))}

      {/* 2. THE BIG HUGE GOLDEN FRAME */}
      {/* Outer Golden Baroque Mouldings */}
      {/* Bottom Sill */}
      <mesh geometry={boxGeo} position={[0, 1.2, 0]} scale={[6.6, 0.6, 0.65]} castShadow>
        <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Top Header */}
      <mesh geometry={boxGeo} position={[0, 9.6, 0]} scale={[6.6, 0.75, 0.65]} castShadow>
        <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Left Post */}
      <mesh geometry={boxGeo} position={[-3.1, 5.4, 0]} scale={[0.65, 8.8, 0.65]} castShadow>
        <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Right Post */}
      <mesh geometry={boxGeo} position={[3.1, 5.4, 0]} scale={[0.65, 8.8, 0.65]} castShadow>
        <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Inner Carved Gold Filigree Trim */}
      <mesh geometry={boxGeo} position={[0, 5.4, 0.12]} scale={[5.8, 7.8, 0.2]} castShadow>
        <meshStandardMaterial color="#eab308" metalness={0.92} roughness={0.1} />
      </mesh>

      {/* 3. High-Definition Royal Portrait Canvas */}
      {portraitTexture && (
        <mesh position={[0, 5.4, 0.24]} scale={[5.2, 7.2, 0.05]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial map={portraitTexture} roughness={0.3} metalness={0.1} />
        </mesh>
      )}

      {/* 4. Top Royal Crown & Title Arch */}
      <group position={[0, 10.3, 0]}>
        {/* Golden Crown */}
        <mesh geometry={cylinderGeo} position={[0, 0.65, 0.1]} scale={[0.9, 0.7, 0.4]} castShadow>
          <meshStandardMaterial color="#facc15" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Crown Ruby Gemstone */}
        <mesh geometry={boxGeo} position={[0, 0.8, 0.32]} scale={[0.3, 0.35, 0.15]}>
          <meshStandardMaterial color="#dc2626" emissive="#b91c1c" emissiveIntensity={0.8} />
        </mesh>
        {/* Emerald Gemstones */}
        {[-0.55, 0.55].map((gx, i) => (
          <mesh key={`gem-${i}`} geometry={boxGeo} position={[gx, 0.6, 0.28]} scale={[0.2, 0.25, 0.1]}>
            <meshStandardMaterial color="#059669" emissive="#047857" emissiveIntensity={0.6} />
          </mesh>
        ))}
      </group>

      {/* 5. GIGANTIC FLOATING TITLE BANNERS */}
      {/* Top Banner saying "His Highness lord Vishnu" */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.05}>
        <group position={[0, 11.8, 0.3]}>
          <mesh geometry={boxGeo} scale={[7.2, 0.85, 0.1]}>
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
          <mesh geometry={boxGeo} position={[0, 0, 0.06]} scale={[7.0, 0.72, 0.02]}>
            <meshStandardMaterial color="#ca8a04" metalness={0.85} />
          </mesh>
          <Text position={[0, 0, 0.08]} fontSize={0.34} color="#fef08a" anchorX="center" anchorY="middle" fontWeight="bold">
            👑 His Highness lord Vishnu
          </Text>
        </group>
      </Float>

      {/* Bottom Inscription Plaque */}
      <group position={[0, 1.2, 0.4]}>
        <mesh geometry={boxGeo} scale={[5.6, 0.52, 0.1]}>
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <Text position={[0, 0.02, 0.06]} fontSize={0.17} color="#facc15" anchorX="center" anchorY="middle" fontWeight="bold">
          SOVEREIGN LANDLORD OF VISHNU'S KINGDOM
        </Text>
      </group>

      {/* 6. Flanking Monumental Golden Columns with Roaring Ceremonial Flames */}
      {[-4.2, 4.2].map((colX, i) => (
        <group key={`col-${i}`} position={[colX, 0, 0]}>
          {/* Column Pedestal */}
          <mesh geometry={boxGeo} position={[0, 0.6, 0]} scale={[1.2, 1.2, 1.2]} castShadow receiveShadow>
            <meshStandardMaterial color="#ca8a04" metalness={0.8} />
          </mesh>
          {/* Fluted Column Shaft */}
          <mesh geometry={cylinderGeo} position={[0, 5.2, 0]} scale={[0.45, 8.0, 0.45]} castShadow>
            <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Column Capital */}
          <mesh geometry={boxGeo} position={[0, 9.4, 0]} scale={[1.1, 0.5, 1.1]} castShadow>
            <meshStandardMaterial color="#ca8a04" metalness={0.9} />
          </mesh>
          {/* Flaming Brass Brazier */}
          <mesh geometry={cylinderGeo} position={[0, 9.9, 0]} scale={[0.65, 0.5, 0.65]} castShadow>
            <meshStandardMaterial color="#78350f" metalness={0.95} />
          </mesh>
          {/* Roaring Ceremonial Flame */}
          <mesh
            ref={i === 0 ? flame1Ref : flame2Ref}
            geometry={boxGeo}
            position={[0, 10.6, 0]}
            scale={[0.45, 1.1, 0.45]}
          >
            <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={1.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

// ==========================================
// 8C. ROYAL PALACE OF VALASKJALF (⚡ KOTTARAM)
// Monumental golden palace with organ-pipe spires (lengthy building near world border mountain)
// ==========================================
const RoyalPalaceOfValaskjalf3D = React.memo(({
  position,
  onClick,
}: {
  position: [number, number, number];
  onClick: () => void;
}) => {
  const crystalRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (crystalRef.current) {
      const pulse = 1.0 + Math.sin(clock.getElapsedTime() * 3) * 0.4;
      (crystalRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* 1. Grand Lengthy Stepped Foundation Terraces (Stretching 54 blocks north-south!) */}
      <mesh geometry={boxGeo} position={[0, 0.6, 0]} scale={[16, 1.2, 54]} receiveShadow castShadow>
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 1.5, 0]} scale={[14, 0.8, 50]} receiveShadow castShadow>
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 2.2, 0]} scale={[12, 0.8, 46]} receiveShadow castShadow>
        <meshStandardMaterial color="#ca8a04" metalness={0.75} roughness={0.3} />
      </mesh>

      {/* 2. Lengthy Golden Colonnade along whole palace face */}
      {Array.from({ length: 15 }).map((_, idx) => {
        const pz = -22 + idx * 3.14;
        return (
          <group key={`valas-col-${idx}`}>
            <mesh geometry={cylinderGeo} position={[5.2, 7.0, pz]} scale={[0.6, 9.5, 0.6]} castShadow>
              <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.15} />
            </mesh>
            <mesh geometry={cylinderGeo} position={[-5.2, 7.0, pz]} scale={[0.6, 9.5, 0.6]} castShadow>
              <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.15} />
            </mesh>
          </group>
        );
      })}

      {/* 3. Central Grand Valaskjalf Hall (Vaulted Gilded Nave) */}
      <mesh geometry={boxGeo} position={[0, 8.5, 0]} scale={[10, 12, 38]} castShadow receiveShadow>
        <meshStandardMaterial color="#ca8a04" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* 3B. High Valaskjalf Keep & Middle Observation Tower (Rising to y = 44m) */}
      <mesh geometry={boxGeo} position={[0, 24, 0]} scale={[9.2, 22, 32]} castShadow receiveShadow>
        <meshStandardMaterial color="#ca8a04" metalness={0.88} roughness={0.2} />
      </mesh>
      {/* Golden Tier Colonnade around Upper Keep */}
      {[-12, -6, 0, 6, 12].map((pz, idx) => (
        <group key={`upper-col-${idx}`}>
          <mesh geometry={cylinderGeo} position={[4.8, 25, pz]} scale={[0.5, 20, 0.5]} castShadow>
            <meshStandardMaterial color="#facc15" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh geometry={cylinderGeo} position={[-4.8, 25, pz]} scale={[0.5, 20, 0.5]} castShadow>
            <meshStandardMaterial color="#facc15" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* 4. Cascading Organ-Pipe Golden Spires (Signature Valaskjalf Architecture - Soaring higher!) */}
      {/* Central Soaring Needle Spire reaching 66 blocks high */}
      <mesh geometry={cylinderGeo} position={[0, 48, 0]} scale={[2.6, 32, 2.6]} castShadow>
        <meshStandardMaterial color="#facc15" metalness={0.95} roughness={0.1} />
      </mesh>
      <mesh geometry={cylinderGeo} position={[0, 64, 0]} scale={[1.0, 10.0, 1.0]} castShadow>
        <meshStandardMaterial color="#fef08a" metalness={0.98} roughness={0.05} />
      </mesh>
      {/* Glowing Celestial Bifrost Crystal at top of pinnacle (69m altitude) */}
      <mesh ref={crystalRef} geometry={boxGeo} position={[0, 69.5, 0]} scale={[0.8, 1.8, 0.8]}>
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2.5} />
      </mesh>

      {/* Cascading clusters of organ-pipe golden spires along both palace wings */}
      {[-16, -11, -6, 6, 11, 16].map((sz, idx) => {
        const height = 30 - Math.abs(sz) * 0.55;
        return (
          <group key={`organ-pipe-${idx}`} position={[0, height / 2 + 10, sz]}>
            <mesh geometry={cylinderGeo} scale={[1.4, height, 1.4]} castShadow>
              <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.15} />
            </mesh>
            <mesh geometry={cylinderGeo} position={[0, height / 2 + 1.4, 0]} scale={[0.6, 3.2, 0.6]} castShadow>
              <meshStandardMaterial color="#fef08a" metalness={0.95} />
            </mesh>
          </group>
        );
      })}

      {/* 5. TOP FLOOR THRONE OBSERVATION BALCONY (HLIDSKJALF) - Elevated at y = 44.0m */}
      <group position={[4.6, 44.0, 0]}>
        {/* Balcony Cantilever Platform facing East over mainland */}
        <mesh geometry={boxGeo} position={[0, 0, 0]} scale={[5.8, 1.0, 8.4]} receiveShadow castShadow>
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>
        {/* Protruding Cantilever Observation Overlook */}
        <mesh geometry={boxGeo} position={[2.6, 0.2, 0]} scale={[1.8, 0.6, 4.6]} receiveShadow castShadow>
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
        {/* Royal Scarlet Velvet Terrace Floor Carpet */}
        <mesh geometry={boxGeo} position={[0.4, 0.52, 0]} scale={[5.2, 0.08, 8.0]}>
          <meshStandardMaterial color="#991b1b" roughness={0.9} />
        </mesh>
        {/* Golden Front Balustrade (Low profile at y=0.55 so eye line at y=48m is completely open!) */}
        <mesh geometry={boxGeo} position={[3.3, 0.55, 0]} scale={[0.18, 0.7, 4.8]} castShadow>
          <meshStandardMaterial color="#ca8a04" metalness={0.9} />
        </mesh>
        <mesh geometry={boxGeo} position={[2.6, 0.55, -2.4]} scale={[1.6, 0.7, 0.18]} castShadow>
          <meshStandardMaterial color="#ca8a04" metalness={0.9} />
        </mesh>
        <mesh geometry={boxGeo} position={[2.6, 0.55, 2.4]} scale={[1.6, 0.7, 0.18]} castShadow>
          <meshStandardMaterial color="#ca8a04" metalness={0.9} />
        </mesh>
        {/* Side Railings */}
        {[-4.0, 4.0].map((bz, i) => (
          <mesh key={`br-${i}`} geometry={boxGeo} position={[0, 0.75, bz]} scale={[5.4, 0.9, 0.22]} castShadow>
            <meshStandardMaterial color="#ca8a04" metalness={0.9} />
          </mesh>
        ))}

        {/* Imperial Golden Throne of King Vishnu under Royal Canopy */}
        <group position={[-1.6, 0.8, 0]}>
          <mesh geometry={boxGeo} position={[0, 0.45, 0]} scale={[1.4, 0.9, 1.6]} castShadow>
            <meshStandardMaterial color="#facc15" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Throne Backrest */}
          <mesh geometry={boxGeo} position={[-0.6, 1.6, 0]} scale={[0.3, 1.6, 1.5]} castShadow>
            <meshStandardMaterial color="#991b1b" roughness={0.8} />
          </mesh>
          {/* Golden Crown Finial on Throne */}
          <mesh geometry={boxGeo} position={[-0.6, 2.5, 0]} scale={[0.25, 0.5, 0.8]}>
            <meshStandardMaterial color="#fef08a" metalness={0.98} />
          </mesh>
          {/* Royal Overhead Canopy Pillars & Roof */}
          {[-1.2, 1.2].map((cz, i) => (
            <mesh key={`canopy-col-${i}`} geometry={cylinderGeo} position={[0.4, 1.8, cz]} scale={[0.12, 3.2, 0.12]} castShadow>
              <meshStandardMaterial color="#facc15" metalness={0.95} />
            </mesh>
          ))}
          <mesh geometry={boxGeo} position={[0, 3.5, 0]} scale={[1.8, 0.25, 2.6]} castShadow>
            <meshStandardMaterial color="#ca8a04" metalness={0.9} />
          </mesh>
        </group>

        {/* Mounted Royal Brass Spyglass Telescope on Golden Tripod (at Balcony North corner) */}
        <group position={[2.6, 0.6, -1.8]} rotation={[0, 0.15, -0.1]}>
          <mesh geometry={cylinderGeo} position={[0, 0.6, 0]} scale={[0.08, 1.2, 0.08]} castShadow>
            <meshStandardMaterial color="#ca8a04" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh geometry={cylinderGeo} position={[0.3, 1.25, 0]} rotation={[0, 0, Math.PI / 2.3]} scale={[0.14, 1.6, 0.14]} castShadow>
            <meshStandardMaterial color="#facc15" metalness={0.98} roughness={0.05} />
          </mesh>
          <mesh geometry={cylinderGeo} position={[1.05, 1.5, 0]} rotation={[0, 0, Math.PI / 2.3]} scale={[0.18, 0.2, 0.18]}>
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.85} roughness={0.1} />
          </mesh>
        </group>

        {/* Flanking Royal Flame Braziers on the Balcony */}
        {[-3.2, 3.2].map((fz, i) => (
          <group key={`balcony-brazier-${i}`} position={[1.6, 0.6, fz]}>
            <mesh geometry={cylinderGeo} position={[0, 0.5, 0]} scale={[0.45, 1.0, 0.45]} castShadow>
              <meshStandardMaterial color="#ca8a04" metalness={0.85} />
            </mesh>
            <mesh geometry={cylinderGeo} position={[0, 1.25, 0]} scale={[0.35, 0.6, 0.35]}>
              <meshStandardMaterial color="#ea580c" emissive="#f97316" emissiveIntensity={2.8} />
            </mesh>
            <pointLight position={[0, 1.6, 0]} color="#f97316" intensity={2.0} distance={10} />
          </group>
        ))}

        {/* Golden Banner Label Overhead on Rear Arch (never blocks forward view) */}
        <Text position={[-0.6, 5.0, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.34} color="#fef08a" anchorX="center" anchorY="middle" fontWeight="bold">
          👑 HLIDSKJALF · KING VISHNU THRONE OBSERVATORY
        </Text>
      </group>

      {/* Main Palace Title Plaque at Entry matching user drawing */}
      <group position={[6.5, 4.8, 0]}>
        <mesh geometry={boxGeo} scale={[0.2, 1.6, 8.8]}>
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <Text position={[0.12, 0.32, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.52} color="#fef08a" anchorX="center" anchorY="middle" fontWeight="bold">
          'Palace'
        </Text>
        <Text position={[0.12, -0.36, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.22} color="#facc15" anchorX="center" anchorY="middle" fontWeight="bold">
          ⚡ ROYAL PALACE OF VALASKJALF (KOTTARAM)
        </Text>
      </group>
    </group>
  );
});

// ==========================================
// 8D. MIDDLE EASTERN DROMEDARY CAMELS IN VISHNU'S KINGDOM
// ==========================================
const MinecraftCamel3D = React.memo(({
  position,
  rotationY = 0,
  name,
  onClick,
}: {
  position: [number, number, number];
  rotationY?: number;
  name: string;
  onClick: () => void;
}) => {
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 2.5) * 0.08 + 0.1;
      headRef.current.rotation.y = Math.cos(t * 1.8) * 0.06;
    }
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 3.5) * 0.15;
    }
  });

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* Floating Camel Tag */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.06}>
        <group position={[0, 1.7, 0]}>
          <mesh geometry={boxGeo} scale={[1.3, 0.24, 0.02]}>
            <meshBasicMaterial color="#451a03" />
          </mesh>
          <Text position={[0, 0, 0.02]} fontSize={0.09} color="#fde68a" anchorX="center" anchorY="middle" fontWeight="bold">
            🐫 {name}
          </Text>
        </group>
      </Float>

      {/* 1. Main Camel Body */}
      <mesh geometry={boxGeo} position={[0, 0.72, 0]} scale={[0.54, 0.52, 1.05]} castShadow>
        <meshStandardMaterial color="#c29b62" roughness={0.85} />
      </mesh>

      {/* 2. Iconic Dromedary Camel Hump */}
      <mesh geometry={boxGeo} position={[0, 1.15, -0.05]} scale={[0.42, 0.44, 0.52]} castShadow>
        <meshStandardMaterial color="#a8793b" roughness={0.9} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 1.4, -0.05]} scale={[0.3, 0.12, 0.36]} castShadow>
        <meshStandardMaterial color="#8c5d2b" roughness={0.95} />
      </mesh>

      {/* 3. Ornate Middle Eastern Embroidered Saddle Blanket */}
      <mesh geometry={boxGeo} position={[0, 0.88, -0.05]} scale={[0.62, 0.28, 0.74]} castShadow>
        <meshStandardMaterial color="#991b1b" roughness={0.7} />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 0.76, -0.05]} scale={[0.63, 0.05, 0.76]}>
        <meshStandardMaterial color="#facc15" />
      </mesh>
      {[-0.32, 0.32].map((tx, i) => (
        <group key={`tassel-${i}`} position={[tx, 0.7, -0.05]}>
          <mesh geometry={boxGeo} scale={[0.04, 0.14, 0.4]}>
            <meshStandardMaterial color="#06b6d4" />
          </mesh>
        </group>
      ))}
      <mesh geometry={boxGeo} position={[0, 1.15, 0.3]} scale={[0.16, 0.26, 0.12]} castShadow>
        <meshStandardMaterial color="#5c3818" />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 1.12, -0.38]} scale={[0.16, 0.22, 0.12]} castShadow>
        <meshStandardMaterial color="#5c3818" />
      </mesh>

      {/* 4. Long Arched Neck & Head */}
      <group position={[0, 0.9, 0.5]}>
        <mesh geometry={boxGeo} position={[0, 0.28, 0.15]} rotation={[-0.45, 0, 0]} scale={[0.22, 0.62, 0.26]} castShadow>
          <meshStandardMaterial color="#c29b62" roughness={0.85} />
        </mesh>
        <group ref={headRef} position={[0, 0.62, 0.3]}>
          <mesh geometry={boxGeo} position={[0, 0, 0]} scale={[0.26, 0.24, 0.36]} castShadow>
            <meshStandardMaterial color="#c29b62" roughness={0.85} />
          </mesh>
          <mesh geometry={boxGeo} position={[0, -0.04, 0.2]} scale={[0.2, 0.16, 0.18]} castShadow>
            <meshStandardMaterial color="#b48148" roughness={0.8} />
          </mesh>
          <mesh geometry={boxGeo} position={[0, 0.02, 0.28]} scale={[0.12, 0.04, 0.04]}>
            <meshStandardMaterial color="#451a03" />
          </mesh>
          {[-0.14, 0.14].map((ex, i) => (
            <mesh key={`eye-${i}`} geometry={boxGeo} position={[ex, 0.06, 0.04]} scale={[0.02, 0.06, 0.06]}>
              <meshStandardMaterial color="#1c1917" />
            </mesh>
          ))}
          {[-0.14, 0.14].map((earX, i) => (
            <mesh key={`ear-${i}`} geometry={boxGeo} position={[earX, 0.12, -0.08]} rotation={[0.2, 0, i === 0 ? 0.3 : -0.3]} scale={[0.06, 0.14, 0.06]} castShadow>
              <meshStandardMaterial color="#a8793b" />
            </mesh>
          ))}
          <mesh geometry={boxGeo} position={[0, 0.02, 0.08]} scale={[0.27, 0.04, 0.04]}>
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        </group>
      </group>

      {/* 5. Four Slender Legs with Padded Paws */}
      <group position={[0, 0.32, 0]}>
        {[
          [-0.18, 0.36], [0.18, 0.36],
          [-0.18, -0.36], [0.18, -0.36],
        ].map(([lx, lz], i) => (
          <group key={`leg-${i}`} position={[lx, 0, lz]}>
            <mesh geometry={boxGeo} position={[0, -0.02, 0]} scale={[0.12, 0.54, 0.12]} castShadow>
              <meshStandardMaterial color="#a8793b" roughness={0.85} />
            </mesh>
            <mesh geometry={boxGeo} position={[0, -0.28, 0.03]} scale={[0.16, 0.08, 0.18]} castShadow>
              <meshStandardMaterial color="#784d20" />
            </mesh>
          </group>
        ))}
      </group>

      {/* 6. Slender Camel Tail */}
      <mesh ref={tailRef} geometry={boxGeo} position={[0, 0.6, -0.56]} rotation={[0.25, 0, 0]} scale={[0.05, 0.36, 0.05]}>
        <meshStandardMaterial color="#a8793b" />
      </mesh>
      <mesh geometry={boxGeo} position={[0, 0.42, -0.62]} scale={[0.08, 0.12, 0.08]}>
        <meshStandardMaterial color="#5c3818" />
      </mesh>
    </group>
  );
});

// ==========================================
// 8E. SACRED ROYAL COWS IN VISHNU'S KINGDOM
// ==========================================
const MinecraftVishnuCow3D = React.memo(({
  position,
  rotationY = 0,
  name,
  onClick,
}: {
  position: [number, number, number];
  rotationY?: number;
  name: string;
  onClick: () => void;
}) => {
  const headRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (headRef.current) {
      headRef.current.rotation.x = 0.35 + Math.sin(t * 2) * 0.12;
    }
  });

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* Floating Cow Tag */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.05}>
        <group position={[0, 1.45, 0]}>
          <mesh geometry={boxGeo} scale={[1.4, 0.22, 0.02]}>
            <meshBasicMaterial color="#14532d" />
          </mesh>
          <Text position={[0, 0, 0.02]} fontSize={0.085} color="#bbf7d0" anchorX="center" anchorY="middle" fontWeight="bold">
            🐄 {name}
          </Text>
        </group>
      </Float>

      {/* 1. Body in Cream / Sacred White */}
      <mesh geometry={boxGeo} position={[0, 0.42, 0]} scale={[0.5, 0.42, 0.78]} castShadow>
        <meshStandardMaterial color="#fef08a" roughness={0.7} />
      </mesh>
      {/* Golden Floral Blanket */}
      <mesh geometry={boxGeo} position={[0, 0.58, 0]} scale={[0.52, 0.12, 0.5]}>
        <meshStandardMaterial color="#f59e0b" roughness={0.8} />
      </mesh>

      {/* 2. Udder */}
      <mesh geometry={boxGeo} position={[0, 0.22, -0.14]} scale={[0.16, 0.09, 0.2]}>
        <meshStandardMaterial color="#f472b6" />
      </mesh>

      {/* 3. Legs */}
      {[
        [-0.17, 0.24], [0.17, 0.24],
        [-0.17, -0.24], [0.17, -0.24],
      ].map(([lx, lz], i) => (
        <mesh key={`cow-leg-${i}`} geometry={boxGeo} position={[lx, 0.15, lz]} scale={[0.11, 0.3, 0.11]} castShadow>
          <meshStandardMaterial color="#fef08a" />
        </mesh>
      ))}

      {/* 4. Head with Golden Horns & Floral Garland */}
      <group ref={headRef} position={[0, 0.5, 0.44]}>
        <mesh geometry={boxGeo} position={[0, 0, 0]} scale={[0.3, 0.3, 0.28]} castShadow>
          <meshStandardMaterial color="#fef08a" />
        </mesh>
        <mesh geometry={boxGeo} position={[0, -0.07, 0.15]} scale={[0.22, 0.15, 0.09]}>
          <meshStandardMaterial color="#f472b6" />
        </mesh>
        {/* Golden Horn Caps */}
        {[-0.14, 0.14].map((hx, i) => (
          <mesh key={`horn-${i}`} geometry={boxGeo} position={[hx, 0.17, -0.03]} scale={[0.045, 0.14, 0.045]}>
            <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
        {/* Festive Floral Garland Collar */}
        <mesh geometry={boxGeo} position={[0, -0.06, -0.1]} scale={[0.34, 0.08, 0.32]}>
          <meshStandardMaterial color="#f43f5e" />
        </mesh>
      </group>
    </group>
  );
});



// ==========================================
// 8B. WORLD BORDER MOUNTAIN WALL NUMBERS (1, 2, 3, 4) - PRESIDENT ONLY
// ==========================================
const WorldBorderMountainNumbers3D = React.memo(({ userRole }: { userRole: UserRole }) => {
  if (userRole !== 'president') return null;

  const markers = [
    { num: '1', label: 'WALL 1 · NORTH BORDER', pos: [0, 16, -78] as [number, number, number], color: '#38bdf8' },
    { num: '2', label: 'WALL 2 · EAST BORDER', pos: [78, 16, 0] as [number, number, number], color: '#4ade80' },
    { num: '3', label: 'WALL 3 · SOUTH BORDER', pos: [0, 16, 78] as [number, number, number], color: '#facc15' },
    { num: '4', label: 'WALL 4 · WEST BORDER', pos: [-78, 16, 0] as [number, number, number], color: '#f43f5e' },
  ];

  return (
    <group>
      {markers.map((m) => (
        <group key={m.num} position={m.pos}>
          <Float speed={2} rotationIntensity={0} floatIntensity={0.25}>
            {/* Monument Beacon Base */}
            <mesh geometry={cylinderGeo} position={[0, -6, 0]} scale={[1.4, 12, 1.4]}>
              <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.6} />
            </mesh>
            {/* Glowing Accent Ring */}
            <mesh geometry={cylinderGeo} position={[0, 0, 0]} scale={[2.6, 0.4, 2.6]}>
              <meshStandardMaterial color={m.color} emissive={m.color} emissiveIntensity={0.8} />
            </mesh>
            {/* Massive Number Board */}
            <group position={[0, 2.2, 0]}>
              <mesh geometry={boxGeo} scale={[5.0, 3.4, 0.4]}>
                <meshStandardMaterial color="#020617" roughness={0.6} />
              </mesh>
              <mesh geometry={boxGeo} position={[0, 0, 0.22]} scale={[4.7, 3.1, 0.05]}>
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              {/* Huge Number */}
              <Text
                position={[0, 0.35, 0.28]}
                fontSize={2.2}
                color={m.color}
                anchorX="center"
                anchorY="middle"
                fontWeight="black"
              >
                {m.num}
              </Text>
              {/* Border Label */}
              <Text
                position={[0, -0.95, 0.28]}
                fontSize={0.28}
                color="#f8fafc"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                {m.label}
              </Text>
            </group>
          </Float>
        </group>
      ))}
    </group>
  );
});

// ==========================================
// 8D. ATTACK ON TITAN CONCENTRIC WALLS (WALL MARIA, WALL ROSE, WALL SINA)
// Massive fortress walls inside walls inside walls enclosing the realm
// ==========================================
const AttackOnTitanConcentricWalls3D = React.memo(() => {
  const walls = [
    { name: 'WALL SINA', radius: 82, height: 20, thickness: 3.8, wallColor: '#94a3b8', parapetColor: '#e2e8f0' },
    { name: 'WALL ROSE', radius: 126, height: 30, thickness: 4.8, wallColor: '#64748b', parapetColor: '#cbd5e1' },
    { name: 'WALL MARIA', radius: 170, height: 42, thickness: 6.4, wallColor: '#475569', parapetColor: '#94a3b8' },
  ];

  return (
    <group>
      {walls.map((w, wIdx) => {
        const r = w.radius;
        const h = w.height;
        const th = w.thickness;

        return (
          <group key={w.name}>
            {/* 4 Colossal Wall Slabs (North, South, East, West) */}
            <mesh geometry={boxGeo} position={[0, h / 2, -r]} scale={[r * 2 + th, h, th]} castShadow receiveShadow>
              <meshStandardMaterial color={w.wallColor} roughness={0.9} />
            </mesh>
            <mesh geometry={boxGeo} position={[0, h / 2, r]} scale={[r * 2 + th, h, th]} castShadow receiveShadow>
              <meshStandardMaterial color={w.wallColor} roughness={0.9} />
            </mesh>
            <mesh geometry={boxGeo} position={[-r, h / 2, 0]} scale={[th, h, r * 2 + th]} castShadow receiveShadow>
              <meshStandardMaterial color={w.wallColor} roughness={0.9} />
            </mesh>
            <mesh geometry={boxGeo} position={[r, h / 2, 0]} scale={[th, h, r * 2 + th]} castShadow receiveShadow>
              <meshStandardMaterial color={w.wallColor} roughness={0.9} />
            </mesh>

            {/* Top Walkway Parapets */}
            <mesh geometry={boxGeo} position={[0, h + 0.4, -r]} scale={[r * 2 + th + 1, 0.8, th + 1.2]}>
              <meshStandardMaterial color={w.parapetColor} roughness={0.8} />
            </mesh>
            <mesh geometry={boxGeo} position={[0, h + 0.4, r]} scale={[r * 2 + th + 1, 0.8, th + 1.2]}>
              <meshStandardMaterial color={w.parapetColor} roughness={0.8} />
            </mesh>
            <mesh geometry={boxGeo} position={[-r, h + 0.4, 0]} scale={[th + 1.2, 0.8, r * 2 + th + 1]}>
              <meshStandardMaterial color={w.parapetColor} roughness={0.8} />
            </mesh>
            <mesh geometry={boxGeo} position={[r, h + 0.4, 0]} scale={[th + 1.2, 0.8, r * 2 + th + 1]}>
              <meshStandardMaterial color={w.parapetColor} roughness={0.8} />
            </mesh>

            {/* 4 Corner Fortified Garrison Bastions with Lookout Turrets */}
            {[
              [-r, -r], [r, -r], [-r, r], [r, r],
            ].map(([cx, cz], cIdx) => (
              <group key={`bastion-${wIdx}-${cIdx}`} position={[cx, 0, cz]}>
                <mesh geometry={cylinderGeo} position={[0, (h + 4) / 2, 0]} scale={[th * 1.6, h + 4, th * 1.6]} castShadow>
                  <meshStandardMaterial color={w.parapetColor} roughness={0.85} />
                </mesh>
                <mesh geometry={cylinderGeo} position={[0, h + 4.5, 0]} scale={[th * 1.8, 1.2, th * 1.8]} castShadow>
                  <meshStandardMaterial color="#1e293b" roughness={0.7} />
                </mesh>
                <mesh geometry={boxGeo} position={[0, h + 6.0, 0]} scale={[1.2, 2.0, 1.2]} castShadow>
                  <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.6} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
});

// ==========================================
// 8E. STEPPED FORTRESS WALL & PROTRUDING GATE BASTION (MATCHING USER MAP OUTLINE)
// Layout: Left 'wall' -> 90° forward -> protruding 'Gate' bastion -> 90° back -> Right 'wall'
// ==========================================
const DividingWallOneFourth3D = React.memo(() => {
  const setbackX = -5.5; // Setback line for left & right walls
  const frontGateX = 2.2; // Protruding forward line for the central Gate bastion
  const wallHeight = 5.8;
  const gateZSpan = 4.8; // Central gate extends from z = -4.8 to z = +4.8

  return (
    <group>
      {/* 1. LEFT WALL ('wall' - North Section from z = -22 down to z = -4.8) */}
      <mesh
        geometry={boxGeo}
        position={[setbackX, wallHeight / 2, -(22 + gateZSpan) / 2]}
        scale={[1.4, wallHeight, 22 - gateZSpan]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Left Wall Golden Crenellated Coping */}
      <mesh
        geometry={boxGeo}
        position={[setbackX, wallHeight + 0.3, -(22 + gateZSpan) / 2]}
        scale={[1.8, 0.6, 22 - gateZSpan + 0.4]}
        castShadow
      >
        <meshStandardMaterial color="#ca8a04" metalness={0.85} />
      </mesh>
      {/* Inscription Label: 'wall' */}
      <group position={[setbackX + 0.8, wallHeight + 1.2, -13.5]}>
        <mesh geometry={boxGeo} scale={[0.1, 0.7, 2.8]}>
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <Text
          position={[0.08, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.32}
          color="#fef08a"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          'wall'
        </Text>
      </group>

      {/* 2. LEFT STEPPED RETURN WALL (Turning 90° forward towards mainland from x = -5.5 to x = 2.2 at z = -4.8) */}
      <mesh
        geometry={boxGeo}
        position={[(setbackX + frontGateX) / 2, wallHeight / 2, -gateZSpan]}
        scale={[frontGateX - setbackX, wallHeight, 1.4]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Left Return Wall Golden Coping */}
      <mesh
        geometry={boxGeo}
        position={[(setbackX + frontGateX) / 2, wallHeight + 0.3, -gateZSpan]}
        scale={[frontGateX - setbackX + 0.4, 0.6, 1.8]}
        castShadow
      >
        <meshStandardMaterial color="#ca8a04" metalness={0.85} />
      </mesh>

      {/* 3. PROTRUDING CENTRAL GATE BASTION ('Gate' - extending from z = -4.8 to z = +4.8 at x = 2.2) */}
      {/* North & South Gate Wall Flanks */}
      <mesh
        geometry={boxGeo}
        position={[frontGateX, wallHeight / 2, -3.4]}
        scale={[1.6, wallHeight, 2.6]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh
        geometry={boxGeo}
        position={[frontGateX, wallHeight / 2, 3.4]}
        scale={[1.6, wallHeight, 2.6]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>

      {/* Grand Royal Triple Archway Gate Portal Structure */}
      <group position={[frontGateX, 0, 0]}>
        {/* Main Central Gatehouse Mass */}
        <mesh geometry={boxGeo} position={[0, 4.2, 0]} scale={[2.6, 8.4, 5.6]} castShadow receiveShadow>
          <meshStandardMaterial color="#78350f" roughness={0.75} />
        </mesh>
        {/* Central Gateway Arch Opening */}
        <mesh geometry={boxGeo} position={[0, 2.4, 0]} scale={[3.0, 4.8, 2.4]}>
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Secondary Left & Right Arches */}
        {[-1.9, 1.9].map((az, i) => (
          <mesh key={`subarch-${i}`} geometry={boxGeo} position={[0, 1.9, az]} scale={[2.8, 3.6, 1.0]}>
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        ))}
        {/* Gilded Monumental Crown & Parapet */}
        <mesh geometry={boxGeo} position={[0, 8.8, 0]} scale={[3.0, 1.0, 6.0]} castShadow>
          <meshStandardMaterial color="#ca8a04" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh geometry={cylinderGeo} position={[0, 9.6, 0]} scale={[0.8, 0.8, 0.8]} castShadow>
          <meshStandardMaterial color="#facc15" metalness={0.95} />
        </mesh>

        {/* Inscription Label: 'Gate' with Arrow & Subtitle matching user sketch */}
        <group position={[1.4, 8.8, 0]}>
          <mesh geometry={boxGeo} scale={[0.1, 1.1, 4.2]}>
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <Text
            position={[0.08, 0.22, 0]}
            rotation={[0, Math.PI / 2, 0]}
            fontSize={0.42}
            color="#fef08a"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            'Gate'
          </Text>
          <Text
            position={[0.08, -0.25, 0]}
            rotation={[0, Math.PI / 2, 0]}
            fontSize={0.18}
            color="#facc15"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            👑 ROYAL TRIPLE ARCHWAY GATE
          </Text>
        </group>
      </group>

      {/* 4. RIGHT STEPPED RETURN WALL (Turning 90° backward from x = 2.2 back to x = -5.5 at z = 4.8) */}
      <mesh
        geometry={boxGeo}
        position={[(setbackX + frontGateX) / 2, wallHeight / 2, gateZSpan]}
        scale={[frontGateX - setbackX, wallHeight, 1.4]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Right Return Wall Golden Coping */}
      <mesh
        geometry={boxGeo}
        position={[(setbackX + frontGateX) / 2, wallHeight + 0.3, gateZSpan]}
        scale={[frontGateX - setbackX + 0.4, 0.6, 1.8]}
        castShadow
      >
        <meshStandardMaterial color="#ca8a04" metalness={0.85} />
      </mesh>

      {/* 5. RIGHT WALL ('wall' - South Section from z = 4.8 to z = 22) */}
      <mesh
        geometry={boxGeo}
        position={[setbackX, wallHeight / 2, (22 + gateZSpan) / 2]}
        scale={[1.4, wallHeight, 22 - gateZSpan]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Right Wall Golden Crenellated Coping */}
      <mesh
        geometry={boxGeo}
        position={[setbackX, wallHeight + 0.3, (22 + gateZSpan) / 2]}
        scale={[1.8, 0.6, 22 - gateZSpan + 0.4]}
        castShadow
      >
        <meshStandardMaterial color="#ca8a04" metalness={0.85} />
      </mesh>
      {/* Inscription Label: 'wall' */}
      <group position={[setbackX + 0.8, wallHeight + 1.2, 13.5]}>
        <mesh geometry={boxGeo} scale={[0.1, 0.7, 2.8]}>
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <Text
          position={[0.08, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.32}
          color="#fef08a"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          'wall'
        </Text>
      </group>

      {/* 6. CORNER DEFENSE WATCHTOWERS AT THE 90° STEPPED BENDS */}
      {[
        { x: setbackX, z: -22 },
        { x: setbackX, z: -gateZSpan },
        { x: frontGateX, z: -gateZSpan },
        { x: frontGateX, z: gateZSpan },
        { x: setbackX, z: gateZSpan },
        { x: setbackX, z: 22 },
      ].map((pt, idx) => (
        <group key={`corner-tower-${idx}`} position={[pt.x, 0, pt.z]}>
          <mesh geometry={cylinderGeo} position={[0, 4.6, 0]} scale={[2.0, 9.2, 2.0]} castShadow>
            <meshStandardMaterial color="#92400e" roughness={0.7} />
          </mesh>
          <mesh geometry={cylinderGeo} position={[0, 9.4, 0]} scale={[2.5, 1.4, 2.5]} castShadow>
            <meshStandardMaterial color="#ca8a04" metalness={0.85} />
          </mesh>
          <mesh geometry={cylinderGeo} position={[0, 10.4, 0]} scale={[0.4, 0.8, 0.4]} castShadow>
            <meshStandardMaterial color="#fef08a" metalness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

// ==========================================
// 8F. 50 ROAMING VOXEL CATS WITH MEOW AUDIO
// ==========================================
const CAT_COLORS = [
  { body: '#ea580c', ear: '#f97316', name: 'Ginger Tabby' },
  { body: '#1c1917', ear: '#ffffff', name: 'Tuxedo' },
  { body: '#d97706', ear: '#ffffff', name: 'Calico' },
  { body: '#e2e8f0', ear: '#78350f', name: 'Siamese' },
  { body: '#0f172a', ear: '#0f172a', name: 'Black Cat' },
  { body: '#f8fafc', ear: '#fda4af', name: 'White Cat' },
];

const CAT_SEEDS = Array.from({ length: 50 }).map((_, i) => ({
  id: i,
  startX: ((i * 13) % 32) - 16 + (Math.sin(i * 3) * 2),
  startZ: ((i * 17) % 32) - 16 + (Math.cos(i * 3) * 2),
  color: CAT_COLORS[i % CAT_COLORS.length],
  speed: 0.35 + (i % 4) * 0.12,
  seed: i,
}));

const RoamingCats3D = React.memo(() => {
  const [clickedCatId, setClickedCatId] = useState<number | null>(null);

  const handleCatClick = useCallback((id: number) => {
    setClickedCatId(id);
    villageAudio.playMeow();
    setTimeout(() => {
      setClickedCatId((cur) => (cur === id ? null : cur));
    }, 2400);
  }, []);

  return (
    <group>
      {CAT_SEEDS.map((cat) => (
        <CatInstance
          key={cat.id}
          data={cat}
          isMeowing={clickedCatId === cat.id}
          onClick={() => handleCatClick(cat.id)}
        />
      ))}
    </group>
  );
});

const CatInstance = React.memo(({
  data,
  isMeowing,
  onClick,
}: {
  data: typeof CAT_SEEDS[0];
  isMeowing: boolean;
  onClick: () => void;
}) => {
  const catRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const leg1Ref = useRef<THREE.Mesh>(null);
  const leg2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!catRef.current) return;
    const t = clock.getElapsedTime() * data.speed;
    const angle = t * 0.8 + data.seed;

    const posX = data.startX + Math.sin(angle * 0.7) * 3.5 + Math.cos(angle * 0.3) * 1.5;
    const posZ = data.startZ + Math.cos(angle * 0.7) * 3.5 + Math.sin(angle * 0.4) * 1.5;

    catRef.current.position.x = posX;
    catRef.current.position.z = posZ;
    catRef.current.position.y = 0.12;

    catRef.current.rotation.y = angle * 0.7 + Math.PI / 2;

    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 4 + data.seed) * 0.35;
    }

    const legSwing = Math.sin(clock.getElapsedTime() * 7 * data.speed) * 0.45;
    if (leg1Ref.current) leg1Ref.current.rotation.x = legSwing;
    if (leg2Ref.current) leg2Ref.current.rotation.x = -legSwing;
  });

  return (
    <group
      ref={catRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {isMeowing && (
        <group position={[0, 0.75, 0]}>
          <Float speed={3} rotationIntensity={0} floatIntensity={0.08}>
            <mesh geometry={boxGeo} scale={[0.85, 0.26, 0.04]}>
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <Text position={[0, 0, 0.03]} fontSize={0.11} color="#0f172a" anchorX="center" anchorY="middle" fontWeight="bold">
              🐾 Meow! / മ്യാവൂ!
            </Text>
          </Float>
        </group>
      )}

      {/* Cat Body */}
      <mesh geometry={boxGeo} position={[0, 0.14, 0]} scale={[0.18, 0.16, 0.34]} castShadow>
        <meshStandardMaterial color={data.color.body} />
      </mesh>

      {/* Cat Head */}
      <group position={[0, 0.22, 0.18]}>
        <mesh geometry={boxGeo} scale={[0.18, 0.16, 0.16]} castShadow>
          <meshStandardMaterial color={data.color.body} />
        </mesh>
        {[-0.07, 0.07].map((ex, i) => (
          <mesh key={`ear-${i}`} geometry={boxGeo} position={[ex, 0.11, -0.01]} scale={[0.04, 0.07, 0.04]}>
            <meshStandardMaterial color={data.color.ear} />
          </mesh>
        ))}
        <mesh geometry={boxGeo} position={[0, -0.02, 0.09]} scale={[0.035, 0.03, 0.02]}>
          <meshStandardMaterial color="#f472b6" />
        </mesh>
      </group>

      {/* Cat Tail */}
      <mesh
        ref={tailRef}
        geometry={boxGeo}
        position={[0, 0.22, -0.22]}
        rotation={[-0.4, 0, 0]}
        scale={[0.04, 0.22, 0.04]}
      >
        <meshStandardMaterial color={data.color.body} />
      </mesh>

      {/* 4 Little Paws */}
      <mesh ref={leg1Ref} geometry={boxGeo} position={[-0.08, 0.06, 0.09]} scale={[0.04, 0.12, 0.04]}>
        <meshStandardMaterial color={data.color.ear} />
      </mesh>
      <mesh ref={leg2Ref} geometry={boxGeo} position={[0.08, 0.06, 0.09]} scale={[0.04, 0.12, 0.04]}>
        <meshStandardMaterial color={data.color.ear} />
      </mesh>
      <mesh geometry={boxGeo} position={[-0.08, 0.06, -0.09]} scale={[0.04, 0.12, 0.04]}>
        <meshStandardMaterial color={data.color.ear} />
      </mesh>
      <mesh geometry={boxGeo} position={[0.08, 0.06, -0.09]} scale={[0.04, 0.12, 0.04]}>
        <meshStandardMaterial color={data.color.ear} />
      </mesh>
    </group>
  );
});

// ==========================================
// 8G. ROAMING DROMEDARY CAMELS (SULTAN, SAHARA, BADAWI & FREE ROAMING)
// ==========================================
const RoamingCamels3D = React.memo(({ onTapCamel }: { onTapCamel?: (id: string, name: string) => void }) => {
  const camels = [
    // Three Caravan Dromedaries
    { id: 'camel-1', name: 'Sultan', basePos: [-12, 1.0] as [number, number], speed: 0.18 },
    { id: 'camel-2', name: 'Sahara', basePos: [-14.5, 2.8] as [number, number], speed: 0.16 },
    { id: 'camel-3', name: 'Badawi', basePos: [-17, 4.5] as [number, number], speed: 0.20 },
    // Roaming Camels across the dunes & oasis
    { id: 'camel-4', name: 'Faris', basePos: [-8, -6.5] as [number, number], speed: 0.14 },
    { id: 'camel-5', name: 'Najm', basePos: [-6, 8.5] as [number, number], speed: 0.17 },
    { id: 'camel-6', name: 'Qamar', basePos: [-11, -12.0] as [number, number], speed: 0.15 },
    { id: 'camel-7', name: 'Layla', basePos: [-15, 11.5] as [number, number], speed: 0.19 },
    { id: 'camel-8', name: 'Zayd', basePos: [-9, 5.0] as [number, number], speed: 0.13 },
  ];

  return (
    <group>
      {camels.map((c, i) => (
        <RoamingCamelIndividual
          key={c.id}
          camel={c}
          index={i}
          onClick={() => onTapCamel && onTapCamel(c.id, c.name)}
        />
      ))}
    </group>
  );
});

const RoamingCamelIndividual = React.memo(({
  camel,
  index,
  onClick,
}: {
  camel: { id: string; name: string; basePos: [number, number]; speed: number };
  index: number;
  onClick: () => void;
}) => {
  const camelRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!camelRef.current) return;
    const t = clock.getElapsedTime() * camel.speed;
    const px = camel.basePos[0] + Math.sin(t + index * 2) * 2.5;
    const pz = camel.basePos[1] + Math.cos(t * 0.8 + index * 2) * 2.2;

    camelRef.current.position.x = px;
    camelRef.current.position.z = pz;
    camelRef.current.rotation.y = Math.atan2(Math.cos(t + index * 2), -Math.sin(t * 0.8 + index * 2));
  });

  return (
    <group ref={camelRef}>
      <MinecraftCamel3D
        position={[0, 0, 0]}
        name={camel.name}
        onClick={onClick}
      />
    </group>
  );
});

// ==========================================
// 8H. ROAMING ROYAL CATTLE (KAMADHENU & SURABHI)
// ==========================================
const RoamingCattle3D = React.memo(({ onTapVishnuCow }: { onTapVishnuCow?: (id: string, name: string) => void }) => {
  const cows = [
    { id: 'cow-1', name: 'Kamadhenu', basePos: [-9.5, -7.5] as [number, number], speed: 0.12 },
    { id: 'cow-2', name: 'Surabhi', basePos: [-10.5, 6.5] as [number, number], speed: 0.14 },
  ];

  return (
    <group>
      {cows.map((c, i) => (
        <RoamingCowIndividual
          key={c.id}
          cow={c}
          index={i}
          onClick={() => onTapVishnuCow && onTapVishnuCow(c.id, c.name)}
        />
      ))}
    </group>
  );
});

const RoamingCowIndividual = React.memo(({
  cow,
  index,
  onClick,
}: {
  cow: { id: string; name: string; basePos: [number, number]; speed: number };
  index: number;
  onClick: () => void;
}) => {
  const cowRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!cowRef.current) return;
    const t = clock.getElapsedTime() * cow.speed;
    const px = cow.basePos[0] + Math.sin(t * 0.6 + index * 3) * 1.8;
    const pz = cow.basePos[1] + Math.cos(t * 0.6 + index * 3) * 1.5;

    cowRef.current.position.x = px;
    cowRef.current.position.z = pz;
    cowRef.current.rotation.y = t * 0.6 + index * 3;
  });

  return (
    <group ref={cowRef}>
      <MinecraftVishnuCow3D
        position={[0, 0, 0]}
        name={cow.name}
        onClick={onClick}
      />
    </group>
  );
});

// ==========================================
// 8I. ROAMING VILLAGERS (WALKING CITIZENS OF KODAVALAM)
// ==========================================
const RoamingVillagers3D = React.memo(({ villagers }: { villagers: Villager[] }) => {
  const [activeVillagerId, setActiveVillagerId] = useState<string | null>(null);

  return (
    <group>
      {villagers.map((v, i) => (
        <VillagerInstance
          key={v.id}
          villager={v}
          index={i}
          showThought={activeVillagerId === v.id}
          onClick={() => {
            setActiveVillagerId((cur) => (cur === v.id ? null : v.id));
            villageAudio.playFestiveChime();
          }}
        />
      ))}
    </group>
  );
});

const VillagerInstance = React.memo(({
  villager,
  index,
  showThought,
  onClick,
}: {
  villager: Villager;
  index: number;
  showThought: boolean;
  onClick: () => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  const speed = 0.22 + (index % 5) * 0.04;
  const isFemale = villager.gender === 'F';
  const shirtColor = isFemale ? '#ec4899' : (index % 3 === 0 ? '#0284c7' : index % 3 === 1 ? '#16a34a' : '#ea580c');
  const munduColor = isFemale ? '#f43f5e' : '#f8fafc';

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() * speed;
    const angle = t * 0.7 + index * 2.1;

    // Smooth wandering walk around their home/market zone
    const baseX = villager.x - OFFSET;
    const baseZ = villager.y - OFFSET;
    const wx = baseX + Math.sin(angle) * 2.4;
    const wz = baseZ + Math.cos(angle * 0.8) * 2.4;

    groupRef.current.position.x = wx;
    groupRef.current.position.z = wz;
    groupRef.current.position.y = 0;

    groupRef.current.rotation.y = angle + Math.PI / 2;

    const legSwing = Math.sin(clock.getElapsedTime() * 5.5 * speed) * 0.45;
    if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -legSwing * 0.8;
    if (rightArmRef.current) rightArmRef.current.rotation.x = legSwing * 0.8;
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* Floating Name & Thought Bubble */}
      <group position={[0, 1.45, 0]}>
        <Float speed={2} rotationIntensity={0} floatIntensity={0.06}>
          <group>
            <mesh geometry={boxGeo} scale={[1.2, 0.22, 0.02]}>
              <meshBasicMaterial color="#0f172a" />
            </mesh>
            <Text position={[0, 0, 0.02]} fontSize={0.08} color="#bbf7d0" anchorX="center" anchorY="middle" fontWeight="bold">
              {villager.name}
            </Text>
            {showThought && (
              <group position={[0, 0.32, 0]}>
                <mesh geometry={boxGeo} scale={[2.2, 0.38, 0.02]}>
                  <meshBasicMaterial color="#fef08a" />
                </mesh>
                <Text position={[0, 0, 0.02]} fontSize={0.075} color="#78350f" anchorX="center" anchorY="middle" fontWeight="bold">
                  💭 {villager.job} · {villager.thought}
                </Text>
              </group>
            )}
          </group>
        </Float>
      </group>

      {/* Head */}
      <group position={[0, 0.88, 0]}>
        <mesh geometry={boxGeo} scale={[0.22, 0.22, 0.22]} castShadow>
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
        {/* Hair */}
        <mesh geometry={boxGeo} position={[0, 0.08, -0.02]} scale={[0.24, 0.12, 0.24]} castShadow>
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Eyes */}
        {[-0.06, 0.06].map((ex, i) => (
          <mesh key={`eye-${i}`} geometry={boxGeo} position={[ex, 0, 0.11]} scale={[0.03, 0.03, 0.02]}>
            <meshStandardMaterial color="#020617" />
          </mesh>
        ))}
      </group>

      {/* Torso / Shirt */}
      <mesh geometry={boxGeo} position={[0, 0.58, 0]} scale={[0.28, 0.36, 0.18]} castShadow>
        <meshStandardMaterial color={shirtColor} roughness={0.7} />
      </mesh>

      {/* Arms */}
      <mesh ref={leftArmRef} geometry={boxGeo} position={[-0.18, 0.58, 0]} scale={[0.08, 0.34, 0.08]} castShadow>
        <meshStandardMaterial color="#b45309" />
      </mesh>
      <mesh ref={rightArmRef} geometry={boxGeo} position={[0.18, 0.58, 0]} scale={[0.08, 0.34, 0.08]} castShadow>
        <meshStandardMaterial color="#b45309" />
      </mesh>

      {/* Mundu / Dhoti */}
      <mesh geometry={boxGeo} position={[0, 0.32, 0]} scale={[0.26, 0.22, 0.17]} castShadow>
        <meshStandardMaterial color={munduColor} roughness={0.8} />
      </mesh>
      {/* Gold Kasavu Ribbon */}
      <mesh geometry={boxGeo} position={[0, 0.22, 0.09]} scale={[0.26, 0.04, 0.02]}>
        <meshStandardMaterial color="#ca8a04" metalness={0.8} />
      </mesh>

      {/* Walking Legs */}
      <mesh ref={leftLegRef} geometry={boxGeo} position={[-0.08, 0.1, 0]} scale={[0.09, 0.22, 0.09]} castShadow>
        <meshStandardMaterial color="#b45309" />
      </mesh>
      <mesh ref={rightLegRef} geometry={boxGeo} position={[0.08, 0.1, 0]} scale={[0.09, 0.22, 0.09]} castShadow>
        <meshStandardMaterial color="#b45309" />
      </mesh>
    </group>
  );
});

// ==========================================
// 8. 3D MINECRAFT VOXEL TILES & BUILDINGS
// ==========================================
const MinecraftTileBuilding3D = React.memo(({ tile, onClick }: { tile: TileData; onClick: () => void }) => {
  const [wx, _, wz] = toWorld(tile.x, tile.y);
  const isVishnuRealm = tile.x <= 15;

  return (
    <group position={[wx, 0, wz]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Base Minecraft Voxel Block */}
      {tile.type === 'grass' ? (
        isVishnuRealm ? (
          <group position={[0, -0.06, 0]}>
            {/* Warm Middle Eastern Desert Oasis Sand */}
            <mesh geometry={boxGeo} position={[0, 0.04, 0]} scale={[1.0, 0.08, 1.0]} receiveShadow>
              <meshStandardMaterial color="#d4a359" roughness={0.85} />
            </mesh>
            <mesh geometry={boxGeo} position={[0, -0.04, 0]} scale={[1.0, 0.08, 1.0]} receiveShadow>
              <meshStandardMaterial color="#9a6b32" roughness={0.9} />
            </mesh>
            {/* Occasional Sandstone Pavers & Oasis Palm Shoots */}
            {(tile.x * 7 + tile.y * 11) % 4 === 0 && (
              <mesh geometry={boxGeo} position={[0.2, 0.09, -0.18]} scale={[0.32, 0.03, 0.32]}>
                <meshStandardMaterial color="#fef3c7" roughness={0.6} />
              </mesh>
            )}
          </group>
        ) : (
          <group position={[0, -0.06, 0]}>
            <mesh geometry={boxGeo} position={[0, 0.04, 0]} scale={[1.0, 0.08, 1.0]} receiveShadow>
              <meshStandardMaterial color="#55aa22" roughness={0.8} />
            </mesh>
            <mesh geometry={boxGeo} position={[0, -0.04, 0]} scale={[1.0, 0.08, 1.0]} receiveShadow>
              <meshStandardMaterial color="#7c5332" roughness={0.9} />
            </mesh>
          </group>
        )
      ) : tile.type === 'river' ? (
        <group position={[0, -0.08, 0]}>
          <mesh geometry={boxGeo} position={[0, 0.02, 0]} scale={[1.0, 0.12, 1.0]} receiveShadow>
            <meshStandardMaterial color="#1d7ce8" transparent opacity={0.88} roughness={0.1} />
          </mesh>
          <mesh geometry={boxGeo} position={[0, -0.06, 0]} scale={[1.0, 0.04, 1.0]}>
            <meshStandardMaterial color="#c2b280" />
          </mesh>
          {(tile.x * 5 + tile.y * 11) % 6 === 0 && (
            <group position={[0.12, 0.09, -0.1]}>
              <mesh geometry={boxGeo} position={[0, 0, 0]} scale={[0.34, 0.02, 0.34]}>
                <meshStandardMaterial color="#15803d" />
              </mesh>
              <mesh geometry={boxGeo} position={[0, 0.03, 0]} scale={[0.1, 0.06, 0.1]}>
                <meshStandardMaterial color="#f472b6" />
              </mesh>
            </group>
          )}
        </group>
      ) : tile.type === 'pond' ? (
        isVishnuRealm ? (
          <group position={[0, -0.06, 0]}>
            {/* Royal Arabian Reflecting Pool / Pushkarini with Turquoise Water */}
            <mesh geometry={boxGeo} position={[0, 0.02, 0]} scale={[1.0, 0.12, 1.0]} receiveShadow>
              <meshStandardMaterial color="#06b6d4" transparent opacity={0.9} roughness={0.1} />
            </mesh>
            {/* Carved Sandstone Coping Border */}
            <mesh geometry={boxGeo} position={[0, 0.08, -0.46]} scale={[1.0, 0.08, 0.08]}>
              <meshStandardMaterial color="#eab308" metalness={0.6} />
            </mesh>
            <mesh geometry={boxGeo} position={[0, 0.08, 0.46]} scale={[1.0, 0.08, 0.08]}>
              <meshStandardMaterial color="#eab308" metalness={0.6} />
            </mesh>
            <mesh geometry={boxGeo} position={[-0.46, 0.08, 0]} scale={[0.08, 0.08, 0.84]}>
              <meshStandardMaterial color="#eab308" metalness={0.6} />
            </mesh>
            <mesh geometry={boxGeo} position={[0.46, 0.08, 0]} scale={[0.08, 0.08, 0.84]}>
              <meshStandardMaterial color="#eab308" metalness={0.6} />
            </mesh>
            {/* Central Brass Fountain Jet */}
            <mesh geometry={cylinderGeo} position={[0, 0.16, 0]} scale={[0.12, 0.24, 0.12]}>
              <meshStandardMaterial color="#facc15" metalness={0.9} />
            </mesh>
          </group>
        ) : (
          <group position={[0, -0.06, 0]}>
            <mesh geometry={boxGeo} position={[0, 0.02, 0]} scale={[1.0, 0.12, 1.0]} receiveShadow>
              <meshStandardMaterial color="#0284c7" transparent opacity={0.88} roughness={0.1} />
            </mesh>
            <mesh geometry={boxGeo} position={[0, 0.08, 0]} scale={[0.3, 0.02, 0.3]}>
              <meshStandardMaterial color="#15803d" />
            </mesh>
          </group>
        )
      ) : tile.type === 'road' ? (
        (tile.x === 16 || tile.x === 17) ? (
          <group position={[0, 0, 0]}>
            <mesh geometry={boxGeo} position={[0, -0.06, 0]} scale={[1.0, 0.1, 1.0]}>
              <meshStandardMaterial color="#1d7ce8" transparent opacity={0.85} roughness={0.1} />
            </mesh>
            <mesh geometry={boxGeo} position={[0, 0.04, 0]} scale={[1.0, 0.1, 1.0]} receiveShadow castShadow>
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </mesh>
            <mesh geometry={boxGeo} position={[0, 0.22, -0.44]} scale={[1.0, 0.26, 0.08]} castShadow>
              <meshStandardMaterial color="#92400e" />
            </mesh>
            <mesh geometry={boxGeo} position={[0, 0.22, 0.44]} scale={[1.0, 0.26, 0.08]} castShadow>
              <meshStandardMaterial color="#92400e" />
            </mesh>
            <mesh geometry={boxGeo} position={[0, 0.38, -0.44]} scale={[0.1, 0.12, 0.1]}>
              <meshStandardMaterial color="#facc15" />
            </mesh>
            <mesh geometry={boxGeo} position={[0, 0.38, 0.44]} scale={[0.1, 0.12, 0.1]}>
              <meshStandardMaterial color="#facc15" />
            </mesh>
          </group>
        ) : isVishnuRealm ? (
          <group position={[0, 0, 0]}>
            {/* Polished Middle Eastern Sandstone & Cream Marble Road */}
            <mesh geometry={boxGeo} position={[0, -0.05, 0]} scale={[1.0, 0.1, 1.0]} receiveShadow>
              <meshStandardMaterial color="#fef3c7" roughness={0.5} />
            </mesh>
            {/* Terracotta Border Ribbons */}
            <mesh geometry={boxGeo} position={[-0.45, -0.04, 0]} scale={[0.08, 0.11, 1.0]}>
              <meshStandardMaterial color="#b45309" />
            </mesh>
            <mesh geometry={boxGeo} position={[0.45, -0.04, 0]} scale={[0.08, 0.11, 1.0]}>
              <meshStandardMaterial color="#b45309" />
            </mesh>
            {/* Central Gold Inlay Pattern */}
            <mesh geometry={boxGeo} position={[0, -0.04, 0]} scale={[0.12, 0.11, 0.4]}>
              <meshStandardMaterial color="#ca8a04" metalness={0.7} />
            </mesh>
          </group>
        ) : (
          <mesh geometry={boxGeo} position={[0, -0.05, 0]} scale={[1.0, 0.1, 1.0]} receiveShadow>
            <meshStandardMaterial color="#966236" roughness={0.9} />
          </mesh>
        )
      ) : tile.type === 'paddy' ? (
        isVishnuRealm ? (
          <group position={[0, -0.05, 0]}>
            {/* Royal Oasis Terraces with Irrigation Canal */}
            <mesh geometry={boxGeo} position={[0, 0, 0]} scale={[1.0, 0.1, 1.0]} receiveShadow>
              <meshStandardMaterial color="#78350f" roughness={0.9} />
            </mesh>
            <mesh geometry={boxGeo} position={[0, 0.02, 0]} scale={[0.22, 0.08, 1.0]}>
              <meshStandardMaterial color="#0284c7" transparent opacity={0.85} />
            </mesh>
            {[-0.32, 0.32].map((px, i) =>
              [-0.28, 0, 0.28].map((pz, j) => (
                <mesh key={`${i}-${j}`} geometry={boxGeo} position={[px, 0.16, pz]} scale={[0.14, 0.24, 0.14]} castShadow>
                  <meshStandardMaterial color={(i + j) % 2 === 0 ? '#ca8a04' : '#15803d'} />
                </mesh>
              ))
            )}
          </group>
        ) : (
          <group position={[0, -0.05, 0]}>
            <mesh geometry={boxGeo} position={[0, 0, 0]} scale={[1.0, 0.1, 1.0]} receiveShadow>
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
            {[-0.26, 0, 0.26].map((px, i) =>
              [-0.26, 0, 0.26].map((pz, j) => (
                <mesh key={`${i}-${j}`} geometry={boxGeo} position={[px, 0.14, pz]} scale={[0.12, 0.22, 0.12]} castShadow>
                  <meshStandardMaterial color={(i + j) % 2 === 0 ? '#84cc16' : '#eab308'} />
                </mesh>
              ))
            )}
          </group>
        )
      ) : (
        <mesh geometry={boxGeo} position={[0, -0.05, 0]} scale={[1.0, 0.1, 1.0]} receiveShadow>
          <meshStandardMaterial color="#78716c" roughness={0.9} />
        </mesh>
      )}

      {/* Buildings */}
      {(() => {
        switch (tile.type) {
          case 'house':
            return isVishnuRealm ? (
              <group position={[0, 0, 0]}>
                {/* Sandstone Middle Eastern Villa with Mashrabiya & Dome */}
                <mesh geometry={boxGeo} position={[0, 0.32, 0]} scale={[0.86, 0.54, 0.86]} castShadow>
                  <meshStandardMaterial color="#fde68a" roughness={0.7} />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.62, 0]} scale={[0.9, 0.08, 0.9]} castShadow>
                  <meshStandardMaterial color="#b45309" />
                </mesh>
                <mesh geometry={cylinderGeo} position={[0, 0.8, 0]} scale={[0.34, 0.32, 0.34]} castShadow>
                  <meshStandardMaterial color="#facc15" metalness={0.85} roughness={0.2} />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 1.0, 0]} scale={[0.06, 0.18, 0.06]}>
                  <meshStandardMaterial color="#ca8a04" metalness={0.9} />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.35, 0.44]} scale={[0.28, 0.32, 0.04]}>
                  <meshStandardMaterial color="#78350f" />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.54, 0.48]} rotation={[0.3, 0, 0]} scale={[0.42, 0.06, 0.22]}>
                  <meshStandardMaterial color="#dc2626" />
                </mesh>
              </group>
            ) : (
              <group position={[0, 0, 0]}>
                <mesh geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.82, 0.5, 0.82]} castShadow>
                  <meshStandardMaterial color="#fef08a" roughness={0.7} />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.65, 0]} scale={[0.94, 0.2, 0.94]} castShadow>
                  <meshStandardMaterial color="#b91c1c" roughness={0.6} />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.8, 0]} scale={[0.74, 0.15, 0.74]} castShadow>
                  <meshStandardMaterial color="#991b1b" roughness={0.6} />
                </mesh>
              </group>
            );

          case 'temple':
            return isVishnuRealm ? (
              <group position={[0, 0, 0]}>
                {/* Sri Vishnu Mahakshetram Middle Eastern Gilded Temple */}
                <mesh geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.92, 0.6, 0.92]} castShadow>
                  <meshStandardMaterial color="#fef08a" metalness={0.3} roughness={0.5} />
                </mesh>
                {[-0.38, 0.38].map((mx, i) => (
                  <group key={`min-${i}`} position={[mx, 0.9, mx > 0 ? 0.38 : -0.38]}>
                    <mesh geometry={cylinderGeo} scale={[0.12, 1.2, 0.12]} castShadow>
                      <meshStandardMaterial color="#eab308" metalness={0.85} />
                    </mesh>
                    <mesh geometry={boxGeo} position={[0, 0.65, 0]} scale={[0.06, 0.15, 0.06]}>
                      <meshStandardMaterial color="#facc15" metalness={0.95} />
                    </mesh>
                  </group>
                ))}
                <mesh geometry={cylinderGeo} position={[0, 0.95, 0]} scale={[0.5, 0.6, 0.5]} castShadow>
                  <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.15} />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 1.35, 0]} scale={[0.12, 0.25, 0.12]}>
                  <meshStandardMaterial color="#ca8a04" metalness={0.95} />
                </mesh>
                <Text position={[0, 0.45, 0.48]} fontSize={0.07} color="#78350f" anchorX="center" anchorY="middle" fontWeight="bold">
                  MAHAKSHETRAM
                </Text>
              </group>
            ) : (
              <group position={[0, 0, 0]}>
                <mesh geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.88, 0.5, 0.88]} castShadow>
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.7, 0]} scale={[0.96, 0.2, 0.96]} castShadow>
                  <meshStandardMaterial color="#ea580c" />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.95, 0]} scale={[0.6, 0.3, 0.6]} castShadow>
                  <meshStandardMaterial color="#c2410c" />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 1.2, 0]} scale={[0.15, 0.25, 0.15]}>
                  <meshStandardMaterial color="#facc15" metalness={0.8} />
                </mesh>
              </group>
            );

          case 'market':
            return isVishnuRealm ? (
              <group position={[0, 0, 0]}>
                {/* Arabian Souk / Grand Bazaar */}
                <mesh geometry={boxGeo} position={[0, 0.2, 0]} scale={[0.9, 0.3, 0.9]} castShadow>
                  <meshStandardMaterial color="#d97706" roughness={0.8} />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.6, 0]} scale={[0.98, 0.12, 0.98]} castShadow>
                  <meshStandardMaterial color="#dc2626" />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.7, 0]} scale={[0.74, 0.1, 0.74]} castShadow>
                  <meshStandardMaterial color="#facc15" />
                </mesh>
                <mesh geometry={boxGeo} position={[-0.24, 0.42, 0.3]} scale={[0.18, 0.22, 0.18]}>
                  <meshStandardMaterial color="#ea580c" />
                </mesh>
                <mesh geometry={boxGeo} position={[0.24, 0.42, 0.3]} scale={[0.18, 0.22, 0.18]}>
                  <meshStandardMaterial color="#059669" />
                </mesh>
                <Text position={[0, 0.82, 0]} fontSize={0.075} color="#451a03" anchorX="center" anchorY="middle" fontWeight="bold">
                  GRAND BAZAAR
                </Text>
              </group>
            ) : (
              <group position={[0, 0, 0]}>
                <mesh geometry={boxGeo} position={[0, 0.2, 0]} scale={[0.88, 0.3, 0.88]} castShadow>
                  <meshStandardMaterial color="#b45309" />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.55, 0]} scale={[0.96, 0.16, 0.96]} castShadow>
                  <meshStandardMaterial color="#991b1b" />
                </mesh>
                <Text position={[0, 0.72, 0]} fontSize={0.07} color="#fef08a" anchorX="center" anchorY="middle" fontWeight="bold">
                  MARKET BAZAAR
                </Text>
              </group>
            );

          case 'clinic':
            return isVishnuRealm ? (
              <group position={[0, 0, 0]}>
                {/* Royal Apothecary (Bimaristan) */}
                <mesh geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.88, 0.5, 0.88]} castShadow>
                  <meshStandardMaterial color="#fef3c7" />
                </mesh>
                <mesh geometry={cylinderGeo} position={[0, 0.72, 0]} scale={[0.42, 0.34, 0.42]} castShadow>
                  <meshStandardMaterial color="#06b6d4" roughness={0.3} />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.95, 0]} scale={[0.06, 0.16, 0.06]}>
                  <meshStandardMaterial color="#facc15" metalness={0.9} />
                </mesh>
                <Text position={[0, 0.4, 0.46]} fontSize={0.07} color="#0f766e" anchorX="center" anchorY="middle" fontWeight="bold">
                  VAIDYASALA
                </Text>
              </group>
            ) : (
              <group position={[0, 0, 0]}>
                <mesh geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.86, 0.5, 0.86]} castShadow>
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.65, 0]} scale={[0.94, 0.18, 0.94]} castShadow>
                  <meshStandardMaterial color="#15803d" />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.36, 0.44]} scale={[0.18, 0.18, 0.02]}>
                  <meshStandardMaterial color="#dc2626" />
                </mesh>
                <Text position={[0, 0.8, 0]} fontSize={0.07} color="#15803d" anchorX="center" anchorY="middle" fontWeight="bold">
                  PHC CLINIC
                </Text>
              </group>
            );

          case 'library':
            return isVishnuRealm ? (
              <group position={[0, 0, 0]}>
                {/* Royal House of Wisdom (Bayt al-Hikma) */}
                <mesh geometry={boxGeo} position={[0, 0.32, 0]} scale={[0.88, 0.54, 0.88]} castShadow>
                  <meshStandardMaterial color="#fde68a" />
                </mesh>
                <mesh geometry={cylinderGeo} position={[0, 0.75, 0]} scale={[0.4, 0.32, 0.4]} castShadow>
                  <meshStandardMaterial color="#ca8a04" metalness={0.85} />
                </mesh>
                <Text position={[0, 0.4, 0.46]} fontSize={0.07} color="#78350f" anchorX="center" anchorY="middle" fontWeight="bold">
                  BAYT AL-HIKMA
                </Text>
              </group>
            ) : (
              <group position={[0, 0, 0]}>
                <mesh geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.84, 0.5, 0.84]} castShadow>
                  <meshStandardMaterial color="#fef3c7" />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.65, 0]} scale={[0.92, 0.18, 0.92]} castShadow>
                  <meshStandardMaterial color="#991b1b" />
                </mesh>
                <Text position={[0, 0.78, 0]} fontSize={0.065} color="#78350f" anchorX="center" anchorY="middle" fontWeight="bold">
                  VAYANASHALA
                </Text>
              </group>
            );

          case 'community_hall':
            return isVishnuRealm ? (
              <group position={[0, 0, 0]}>
                {/* Royal Durbar Hall */}
                <mesh geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.92, 0.58, 0.92]} castShadow>
                  <meshStandardMaterial color="#fef08a" metalness={0.4} />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.72, 0]} scale={[1.02, 0.16, 1.02]} castShadow>
                  <meshStandardMaterial color="#ca8a04" metalness={0.8} />
                </mesh>
                <mesh geometry={cylinderGeo} position={[0, 0.95, 0]} scale={[0.38, 0.32, 0.38]} castShadow>
                  <meshStandardMaterial color="#facc15" metalness={0.9} />
                </mesh>
                <Text position={[0, 0.45, 0.48]} fontSize={0.075} color="#78350f" anchorX="center" anchorY="middle" fontWeight="bold">
                  ROYAL DURBAR
                </Text>
              </group>
            ) : (
              <group position={[0, 0, 0]}>
                <mesh geometry={boxGeo} position={[0, 0.32, 0]} scale={[0.92, 0.52, 0.92]} castShadow>
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.7, 0]} scale={[1.0, 0.22, 1.0]} castShadow>
                  <meshStandardMaterial color="#b91c1c" />
                </mesh>
                <Text position={[0, 0.85, 0]} fontSize={0.07} color="#991b1b" anchorX="center" anchorY="middle" fontWeight="bold">
                  COMMUNITY HALL
                </Text>
              </group>
            );

          case 'well':
            return (
              <group position={[0, 0, 0]}>
                <mesh geometry={cylinderGeo} position={[0, 0.25, 0]} scale={[0.42, 0.45, 0.42]} castShadow>
                  <meshStandardMaterial color={isVishnuRealm ? '#ca8a04' : '#78716c'} roughness={0.8} metalness={isVishnuRealm ? 0.7 : 0.1} />
                </mesh>
                <mesh geometry={cylinderGeo} position={[0, 0.28, 0]} scale={[0.3, 0.42, 0.3]}>
                  <meshStandardMaterial color="#0284c7" transparent opacity={0.9} />
                </mesh>
                <mesh geometry={boxGeo} position={[-0.28, 0.65, 0]} scale={[0.06, 0.6, 0.06]}>
                  <meshStandardMaterial color="#78350f" />
                </mesh>
                <mesh geometry={boxGeo} position={[0.28, 0.65, 0]} scale={[0.06, 0.6, 0.06]}>
                  <meshStandardMaterial color="#78350f" />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 0.95, 0]} scale={[0.62, 0.06, 0.06]}>
                  <meshStandardMaterial color="#78350f" />
                </mesh>
                <mesh geometry={cylinderGeo} position={[0, 0.72, 0]} scale={[0.1, 0.16, 0.1]}>
                  <meshStandardMaterial color="#b45309" />
                </mesh>
              </group>
            );

          case 'palace':
            return (
              <group position={[0, 0, 0]}>
                {/* Golden Royal Base Plinth connecting to Asgard Palace */}
                <mesh geometry={boxGeo} position={[0, 0.2, 0]} scale={[1.0, 0.4, 1.0]} receiveShadow castShadow>
                  <meshStandardMaterial color="#ca8a04" metalness={0.8} roughness={0.2} />
                </mesh>
              </group>
            );

          case 'royal_gate':
            return (
              <group position={[0, 0, 0]}>
                {/* Grand Arabian Triumphal Archway (Bab al-Muluk) */}
                <mesh geometry={cylinderGeo} position={[-0.42, 0.9, 0]} scale={[0.2, 1.8, 0.2]} castShadow>
                  <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh geometry={cylinderGeo} position={[0.42, 0.9, 0]} scale={[0.2, 1.8, 0.2]} castShadow>
                  <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh geometry={boxGeo} position={[-0.42, 1.85, 0]} scale={[0.28, 0.1, 0.28]}>
                  <meshStandardMaterial color="#facc15" metalness={0.9} />
                </mesh>
                <mesh geometry={boxGeo} position={[0.42, 1.85, 0]} scale={[0.28, 0.1, 0.28]}>
                  <meshStandardMaterial color="#facc15" metalness={0.9} />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 1.5, 0]} scale={[1.15, 0.35, 0.28]} castShadow>
                  <meshStandardMaterial color="#b45309" roughness={0.6} />
                </mesh>
                <mesh geometry={boxGeo} position={[0, 1.25, 0]} scale={[0.1, 0.14, 0.1]}>
                  <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.8} />
                </mesh>
                <Text position={[0, 1.5, 0.16]} fontSize={0.09} color="#fef08a" anchorX="center" anchorY="middle" fontWeight="bold">
                  👑 VISHNU'S KINGDOM
                </Text>
              </group>
            );

          default:
            return null;
        }
      })()}

      {/* 5% Giant Mega-Trees inside core */}
      {tile.type === 'grass' && GIANT_TREE_COORDS.has(`${tile.x},${tile.y}`) && (
        <GiantMinecraftTree3D position={[0, 0, 0]} />
      )}
    </group>
  );
});

// ==========================================
// 9. DYNAMIC CAMERA CONTROLLER (EXTENDED DISTANCE, FAR PLANE & BOUNDED PANNING)
// ==========================================
const CameraController: React.FC<{
  viewMode: ViewMode;
  userRole: UserRole;
  selectedTile: { x: number; y: number } | null;
  cameraTarget?: [number, number, number];
  playerCharacter?: PlayerCharacterState;
  selectedPauranChar?: PauranCharacter;
}> = ({ viewMode, userRole, selectedTile, cameraTarget, playerCharacter, selectedPauranChar }) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);

  const isKingVishnuPOV = viewMode === 'pov' && selectedPauranChar?.id === 'king_vishnu';

  // Full 360-degree panoramic gaze direction for King Vishnu looking from the elevated top floor balcony
  const targetYawRef = useRef(0); // 0 = looking directly East towards mainland (+X)
  const targetPitchRef = useRef(-0.22); // downward gaze to view village streets, market, temple
  const currentYawRef = useRef(0);
  const currentPitchRef = useRef(-0.22);
  const isAutoRotatingRef = useRef(false);
  const frameCounterRef = useRef(0);

  // Optical Zoom factor: 1.0x (wide panoramic) up to 6.5x (telephoto / spyglass)
  const targetZoomRef = useRef(1.0);

  // Increased Height of the POV: elevated from old 29.2m to 48.0m default (customizable from 38m to 82m)
  const targetHeightRef = useRef(48.0);
  const currentHeightRef = useRef(48.0);

  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);

  // Broadcast current camera settings and 360-degree compass heading to on-screen Royal Observatory HUD
  const broadcastHUD = useCallback(() => {
    // Normalize yaw to [0, 2PI)
    let normYaw = targetYawRef.current % (Math.PI * 2);
    if (normYaw < 0) normYaw += Math.PI * 2;
    // Nautical compass: 000° is North (-Z), 090° is East (+X), 180° is South (+Z), 270° is West (-X)
    const deg = (90 + Math.round((normYaw * 180) / Math.PI)) % 360;

    let landmark = "Mainland Horizon (East)";
    if (deg >= 68 && deg < 113) landmark = "East 090° · Royal Gate ('Bab al-Muluk') & Mainland";
    else if (deg >= 113 && deg < 158) landmark = "Southeast 135° · Grand Souk Bazaar & Palm Orchards";
    else if (deg >= 158 && deg < 203) landmark = "South 180° · Southern Wall & Paddy Fields";
    else if (deg >= 203 && deg < 248) landmark = "Southwest 225° · Camel Caravans & Durbar Pavilion";
    else if (deg >= 248 && deg < 293) landmark = "West 270° · 'Palace' Valaskjalf Throne, Spires & Peaks";
    else if (deg >= 293 && deg < 338) landmark = "Northwest 315° · Border Mountain Range & Cliffs";
    else if (deg >= 338 || deg < 23) landmark = "North 000° · Northern Wall, Sacred River & Hills";
    else landmark = "Northeast 045° · Mahakshetram Temple & Sacred Lake";

    window.dispatchEvent(
      new CustomEvent('vishnu-hud-data', {
        detail: {
          zoom: targetZoomRef.current,
          height: targetHeightRef.current,
          yaw: targetYawRef.current,
          pitch: targetPitchRef.current,
          deg,
          landmark,
          isAutoRotating: isAutoRotatingRef.current,
        },
      })
    );
  }, []);

  // Mouse & Touch drag (Full 360° unconstrained rotation), wheel zoom, pinch-to-zoom, and keyboard controls
  useEffect(() => {
    if (!isKingVishnuPOV) {
      if (camera.zoom !== 1.0) {
        camera.zoom = 1.0;
        camera.updateProjectionMatrix();
      }
      return;
    }

    const dom = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isAutoRotatingRef.current = false;
      isDraggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      // Zoom scales rotation sensitivity for precision aiming when zoomed in
      const sensitivity = 0.0034 / Math.sqrt(targetZoomRef.current);
      // Full 360-degree free continuous yaw rotation!
      targetYawRef.current -= dx * sensitivity;

      targetPitchRef.current = THREE.MathUtils.clamp(
        targetPitchRef.current - dy * (sensitivity * 0.85),
        -Math.PI * 0.44, // Downward to palace courtyards, gate & roads
        Math.PI * 0.38   // Upward to sky, organ spires & Bifrost crystal
      );
      broadcastHUD();
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    // Wheel event for smooth zoom in/out and height adjustments
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.shiftKey || e.altKey) {
        targetHeightRef.current = THREE.MathUtils.clamp(
          targetHeightRef.current - e.deltaY * 0.04,
          38.0,
          82.0
        );
      } else {
        targetZoomRef.current = THREE.MathUtils.clamp(
          targetZoomRef.current - e.deltaY * 0.0028,
          1.0,
          6.5
        );
      }
      broadcastHUD();
    };

    // Touch events for two-finger pinch-to-zoom
    const onTouchStart = (e: TouchEvent) => {
      isAutoRotatingRef.current = false;
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchDistanceRef.current = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchDistanceRef.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.hypot(dx, dy);
        const diff = (newDist - touchDistanceRef.current) * 0.015;
        targetZoomRef.current = THREE.MathUtils.clamp(
          targetZoomRef.current + diff,
          1.0,
          6.5
        );
        touchDistanceRef.current = newDist;
        broadcastHUD();
      }
    };

    const onTouchEnd = () => {
      touchDistanceRef.current = null;
    };

    // Keyboard shortcuts for King Vishnu 360 POV
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const key = e.key.toLowerCase();

      if (['+', '=', 'z'].includes(key)) {
        targetZoomRef.current = THREE.MathUtils.clamp(targetZoomRef.current + 0.5, 1.0, 6.5);
        broadcastHUD();
      } else if (['-', '_', 'x'].includes(key)) {
        targetZoomRef.current = THREE.MathUtils.clamp(targetZoomRef.current - 0.5, 1.0, 6.5);
        broadcastHUD();
      } else if (['r', 'pageup'].includes(key)) {
        targetHeightRef.current = THREE.MathUtils.clamp(targetHeightRef.current + 3.5, 38.0, 82.0);
        broadcastHUD();
      } else if (['f', 'pagedown'].includes(key)) {
        targetHeightRef.current = THREE.MathUtils.clamp(targetHeightRef.current - 3.5, 38.0, 82.0);
        broadcastHUD();
      } else if (['arrowleft', 'a'].includes(key)) {
        isAutoRotatingRef.current = false;
        targetYawRef.current += 0.06;
        broadcastHUD();
      } else if (['arrowright', 'd'].includes(key)) {
        isAutoRotatingRef.current = false;
        targetYawRef.current -= 0.06;
        broadcastHUD();
      } else if (['arrowup', 'w'].includes(key)) {
        targetPitchRef.current = THREE.MathUtils.clamp(targetPitchRef.current + 0.04, -Math.PI * 0.44, Math.PI * 0.38);
        broadcastHUD();
      } else if (['arrowdown', 's'].includes(key)) {
        targetPitchRef.current = THREE.MathUtils.clamp(targetPitchRef.current - 0.04, -Math.PI * 0.44, Math.PI * 0.38);
        broadcastHUD();
      } else if (e.code === 'Space' || key === ' ') {
        e.preventDefault();
        isAutoRotatingRef.current = !isAutoRotatingRef.current;
        broadcastHUD();
      }
    };

    // Window listener for 360-degree controls (Rotate Left/Right, Cardinal views, Auto-Rotate tour)
    const onCustomCamAction = (e: Event) => {
      const { type, value, amount, yaw, pitch } = (e as CustomEvent).detail || {};
      if (type === 'turnLeft') {
        isAutoRotatingRef.current = false;
        targetYawRef.current += amount ?? 0.35;
      } else if (type === 'turnRight') {
        isAutoRotatingRef.current = false;
        targetYawRef.current -= amount ?? 0.35;
      } else if (type === 'turn180') {
        isAutoRotatingRef.current = false;
        targetYawRef.current += Math.PI;
      } else if (type === 'setYaw') {
        isAutoRotatingRef.current = false;
        if (typeof yaw === 'number') targetYawRef.current = yaw;
      } else if (type === 'toggleAutoRotate') {
        isAutoRotatingRef.current = !isAutoRotatingRef.current;
      } else if (type === 'setAutoRotate') {
        isAutoRotatingRef.current = Boolean(value);
      } else if (type === 'zoomIn') {
        if (isKingVishnuPOV) {
          targetZoomRef.current = THREE.MathUtils.clamp(
            targetZoomRef.current + (amount ?? 0.5),
            1.0,
            6.5
          );
        } else if (controlsRef.current) {
          const target = controlsRef.current.target || new THREE.Vector3(0, 0, 0);
          const dir = new THREE.Vector3().subVectors(camera.position, target);
          if (dir.length() > 6) {
            dir.multiplyScalar(0.8);
            camera.position.copy(target).add(dir);
            controlsRef.current.update();
          }
        }
      } else if (type === 'zoomOut') {
        if (isKingVishnuPOV) {
          targetZoomRef.current = THREE.MathUtils.clamp(
            targetZoomRef.current - (amount ?? 0.5),
            1.0,
            6.5
          );
        } else if (controlsRef.current) {
          const target = controlsRef.current.target || new THREE.Vector3(0, 0, 0);
          const dir = new THREE.Vector3().subVectors(camera.position, target);
          if (dir.length() < 300) {
            dir.multiplyScalar(1.25);
            camera.position.copy(target).add(dir);
            controlsRef.current.update();
          }
        }
      } else if (type === 'setZoom') {
        targetZoomRef.current = THREE.MathUtils.clamp(value ?? 1.0, 1.0, 6.5);
      } else if (type === 'heightUp') {
        targetHeightRef.current = THREE.MathUtils.clamp(
          targetHeightRef.current + (amount ?? 4.0),
          38.0,
          82.0
        );
      } else if (type === 'heightDown') {
        targetHeightRef.current = THREE.MathUtils.clamp(
          targetHeightRef.current - (amount ?? 4.0),
          38.0,
          82.0
        );
      } else if (type === 'setHeight') {
        targetHeightRef.current = THREE.MathUtils.clamp(value ?? 48.0, 38.0, 82.0);
      } else if (type === 'lookAt') {
        isAutoRotatingRef.current = false;
        if (typeof yaw === 'number') targetYawRef.current = yaw;
        if (typeof pitch === 'number') targetPitchRef.current = pitch;
      } else if (type === 'reset') {
        if (isKingVishnuPOV) {
          isAutoRotatingRef.current = false;
          targetYawRef.current = 0;
          targetPitchRef.current = -0.22;
          targetZoomRef.current = 1.0;
          targetHeightRef.current = 48.0;
        } else if (controlsRef.current) {
          camera.position.set(0, 52, 54);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
      broadcastHUD();
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('vishnu-cam-action', onCustomCamAction as EventListener);
    window.addEventListener('village-cam-action', onCustomCamAction as EventListener);

    broadcastHUD();

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('vishnu-cam-action', onCustomCamAction as EventListener);
      window.removeEventListener('village-cam-action', onCustomCamAction as EventListener);
    };
  }, [isKingVishnuPOV, gl, camera, broadcastHUD]);

  useEffect(() => {
    if (cameraTarget && !isKingVishnuPOV) {
      if (controlsRef.current) {
        controlsRef.current.target.set(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
        camera.position.set(cameraTarget[0], cameraTarget[1] + 35, cameraTarget[2] + 40);
        camera.lookAt(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
        controlsRef.current.update();
      }
      return;
    }

    if (isKingVishnuPOV) {
      // King Vishnu: Locked POV from elevated top floor balcony overlooking mainland
      targetYawRef.current = 0; // East towards mainland
      targetPitchRef.current = -0.22;
      targetZoomRef.current = 1.0;
      targetHeightRef.current = 48.0;
      currentHeightRef.current = 48.0;
      camera.position.set(-22.2, 48.0, 0);
      const lookDist = 60;
      const targetX = -22.2 + Math.cos(0) * Math.cos(-0.22) * lookDist;
      const targetY = 48.0 + Math.sin(-0.22) * lookDist;
      const targetZ = 0;
      camera.lookAt(targetX, targetY, targetZ);
      broadcastHUD();
      return;
    }

    if (viewMode === 'sky') {
      if (!controlsRef.current) return;
      // High Sky View: Tactical bird's-eye overview looking across village & kingdom
      camera.position.set(0, 52, 54);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.maxPolarAngle = Math.PI / 2.01;
      controlsRef.current.minDistance = 1.5;
      controlsRef.current.maxDistance = 380;
      camera.lookAt(0, 0, 0);
      controlsRef.current.update();
    } else {
      if (!controlsRef.current) return;
      // Fixed POV View: GTA / Minecraft 3rd person chase camera locked behind player
      const rotY = playerCharacter ? playerCharacter.rotationY : 0;
      const targetX = playerCharacter ? playerCharacter.x : (selectedTile ? toWorld(selectedTile.x, selectedTile.y)[0] : toWorld(18, 18)[0]);
      const targetZ = playerCharacter ? playerCharacter.z : (selectedTile ? toWorld(selectedTile.x, selectedTile.y)[2] : toWorld(18, 18)[2]);
      const dist = 3.6;
      const camHeight = 2.0;

      camera.position.set(
        targetX - Math.sin(rotY) * dist,
        camHeight,
        targetZ - Math.cos(rotY) * dist
      );
      controlsRef.current.target.set(targetX, 1.25, targetZ);
      camera.lookAt(targetX, 1.25, targetZ);
      controlsRef.current.update();
    }
  }, [viewMode, camera, selectedTile, cameraTarget, isKingVishnuPOV, broadcastHUD]);

  // Keep camera locked behind player in POV mode (GTA / Minecraft fixed chase camera)
  // Or locked on elevated top-floor observation deck with zoom and height for King Vishnu
  useFrame(() => {
    if (isKingVishnuPOV) {
      // King Vishnu: Camera position locked on the elevated top-floor observation deck of Royal Palace of Valaskjalf
      if (isAutoRotatingRef.current) {
        targetYawRef.current -= 0.0045; // Smooth continuous 360-degree tour rotation
        frameCounterRef.current += 1;
        if (frameCounterRef.current % 6 === 0) {
          broadcastHUD();
        }
      }

      currentHeightRef.current = THREE.MathUtils.lerp(
        currentHeightRef.current,
        targetHeightRef.current,
        0.18
      );
      currentYawRef.current = THREE.MathUtils.lerp(
        currentYawRef.current,
        targetYawRef.current,
        0.18
      );
      currentPitchRef.current = THREE.MathUtils.lerp(
        currentPitchRef.current,
        targetPitchRef.current,
        0.18
      );

      // Smooth optical zoom transition
      const nextZoom = THREE.MathUtils.lerp(camera.zoom, targetZoomRef.current, 0.22);
      if (Math.abs(camera.zoom - nextZoom) > 0.001) {
        camera.zoom = nextZoom;
        camera.updateProjectionMatrix();
      }

      // Elevated balcony position perched at x = -22.2, height = currentHeight, z = 0.0
      camera.position.set(-22.2, currentHeightRef.current, 0);

      const lookDist = 60;
      const cosPitch = Math.cos(currentPitchRef.current);
      const targetX = -22.2 + Math.cos(currentYawRef.current) * cosPitch * lookDist;
      const targetY = currentHeightRef.current + Math.sin(currentPitchRef.current) * lookDist;
      const targetZ = Math.sin(currentYawRef.current) * cosPitch * lookDist;

      camera.lookAt(targetX, targetY, targetZ);
      return;
    }

    if (!controlsRef.current) return;

    if (viewMode === 'pov' && playerCharacter) {
      // Rigid GTA / Minecraft 3rd-person fixed chase camera
      const rotY = playerCharacter.rotationY;
      const dist = 3.6;
      const camHeight = 2.0;
      const targetHeight = 1.25;

      const targetCamX = playerCharacter.x - Math.sin(rotY) * dist;
      const targetCamZ = playerCharacter.z - Math.cos(rotY) * dist;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.28);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, camHeight, 0.28);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.28);

      controlsRef.current.target.x = THREE.MathUtils.lerp(controlsRef.current.target.x, playerCharacter.x, 0.32);
      controlsRef.current.target.y = THREE.MathUtils.lerp(controlsRef.current.target.y, targetHeight, 0.32);
      controlsRef.current.target.z = THREE.MathUtils.lerp(controlsRef.current.target.z, playerCharacter.z, 0.32);
      camera.lookAt(controlsRef.current.target);
    } else {
      // President Sky view: allow panning anywhere inside the mountain walls and outer walls
      const limit = 135;
      controlsRef.current.target.x = THREE.MathUtils.clamp(controlsRef.current.target.x, -limit, limit);
      controlsRef.current.target.z = THREE.MathUtils.clamp(controlsRef.current.target.z, -limit, limit);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={viewMode === 'sky'}
      enableRotate={viewMode === 'sky'}
      enableZoom={viewMode === 'sky'}
      enablePan={viewMode === 'sky'}
      screenSpacePanning={true}
      panSpeed={1.5}
      maxPolarAngle={Math.PI / 2.01}
      minDistance={1.5}
      maxDistance={380}
    />
  );
};

// ==========================================
// 10. MAIN 3D CANVAS EXPORT
// ==========================================
export const Village3DCanvas: React.FC<Village3DCanvasProps> = ({
  tiles,
  villagers,
  busState,
  cowherd,
  userRole,
  viewMode,
  selectedTile,
  cameraTarget,
  playerCharacter,
  selectedPauranChar = PAURAN_CHARACTERS[0],
  onSelectTile,
  onTapCowherd,
  onTapChayakada,
  onTapBus,
  onTapCamel,
  onTapVishnuCow,
  onTapAsgard,
  onTapVishnuPortrait,
}) => {
  const isKingVishnuPOV = viewMode === 'pov' && selectedPauranChar.id === 'king_vishnu';

  return (
    <div className="w-full h-full relative bg-[#061912] touch-none">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          position: [0, 52, 54],
          fov: 46,
          near: 0.5,
          far: 1400,
        }}
      >
        {/* Sky / Horizon and Extended High-Definition Fog */}
        <color attach="background" args={['#7dd3fc']} />
        <fog
          attach="fog"
          args={[
            '#bae6fd',
            isKingVishnuPOV ? 350 : viewMode === 'sky' ? 220 : 110,
            isKingVishnuPOV ? 1400 : viewMode === 'sky' ? 950 : 380,
          ]}
        />

        <CameraController
          viewMode={viewMode}
          userRole={userRole}
          selectedTile={selectedTile}
          cameraTarget={cameraTarget}
          playerCharacter={playerCharacter}
          selectedPauranChar={selectedPauranChar}
        />

        {/* GLOWING MINECRAFT SUN IN THE SKY */}
        <MinecraftSun3D />

        {/* BRIGHT SUNNY DAY LIGHTING WITH EXTENDED SHADOW CAMERA */}
        <ambientLight intensity={0.9} color="#e0f2fe" />
        <hemisphereLight args={['#93c5fd', '#3f6212', 0.55]} />
        <directionalLight
          castShadow
          position={[45, 80, 45]}
          intensity={2.4}
          color="#fffbeb"
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-75}
          shadow-camera-right={75}
          shadow-camera-top={75}
          shadow-camera-bottom={-75}
          shadow-camera-near={10}
          shadow-camera-far={260}
          shadow-bias={-0.0005}
        />

        {/* Minecraft Puffy Voxel Clouds */}
        <MinecraftClouds3D />

        {/* 0. Vast Solid Continental Bedrock Foundation (Deep, solid earth — NEVER floating on air) */}
        <mesh geometry={boxGeo} position={[0, -25.04, 0]} scale={[1600, 50, 1600]} receiveShadow>
          <meshStandardMaterial color="#1c2d08" roughness={0.95} />
        </mesh>

        {/* Expansive Outer Land meeting the horizon */}
        {/* West: Vast Golden Sands & Oasis extending to horizon */}
        <mesh geometry={boxGeo} position={[-450, -0.22, 0]} scale={[750, 0.4, 1500]} receiveShadow>
          <meshStandardMaterial color="#b48148" roughness={0.9} />
        </mesh>
        {/* East: Vast Lush Kerala Land extending to horizon */}
        <mesh geometry={boxGeo} position={[450, -0.22, 0]} scale={[750, 0.4, 1500]} receiveShadow>
          <meshStandardMaterial color="#2d5218" roughness={0.9} />
        </mesh>

        {/* Surrounding Mountain Ridges enclosing the world so land seamlessly meets sky */}
        {[-260, 260].map((mx, i) => (
          <mesh key={`ridge-x-${i}`} geometry={boxGeo} position={[mx, 8, 0]} scale={[90, 24, 850]}>
            <meshStandardMaterial color="#334155" roughness={0.95} />
          </mesh>
        ))}
        {[-260, 260].map((mz, i) => (
          <mesh key={`ridge-z-${i}`} geometry={boxGeo} position={[0, 8, mz]} scale={[850, 24, 90]}>
            <meshStandardMaterial color="#334155" roughness={0.95} />
          </mesh>
        ))}

        {/* Attack on Titan Concentric Walls (Wall Sina, Wall Rose, Wall Maria) */}
        <AttackOnTitanConcentricWalls3D />

        {/* Straight Dividing Wall at 1:4 with Royal Triple Archway Gate */}
        <DividingWallOneFourth3D />

        {/* Royal Palace of Valaskjalf (⚡ Kottaram) with organ-pipe spires near mountain */}
        <RoyalPalaceOfValaskjalf3D
          position={[-28, 0, 0]}
          onClick={onTapAsgard || (() => {})}
        />

        {/* Gigantic Royal Portrait Frame perched above West Mountain Wall */}
        <MinecraftVishnuPortraitFrame3D
          position={[-78, 16, 0]}
          onClick={onTapVishnuPortrait || (() => {})}
        />

        {/* Middle Eastern Dromedary Camels (Sultan, Sahara, Badawi & Roaming Camels) */}
        <RoamingCamels3D onTapCamel={onTapCamel} />

        {/* Sacred Royal Cattle (Kamadhenu at x=7, y=8 & Surabhi at x=4, y=24) */}
        <RoamingCattle3D onTapVishnuCow={onTapVishnuCow} />

        {/* 50 Roaming Cats with Meow Audio */}
        <RoamingCats3D />

        {/* Roaming Citizens & Villagers of Kodavalam */}
        <RoamingVillagers3D villagers={villagers} />

        {/* 1. Instanced Outer Landscape (Paddy fields, Coconut groves, Hills, Rivers, Ponds, Forests) */}
        <InstancedOuterWorld
          playerPos={playerCharacter ? [playerCharacter.x, playerCharacter.z] : undefined}
          isPOV={viewMode === 'pov'}
          isKingVishnuPOV={isKingVishnuPOV}
        />

        {/* 2. Central Core 36x36 Village Tiles */}
        <group>
          {tiles.map((row, y) =>
            row.map((tile, x) => {
              const [cx, cy, cz] = toWorld(x, y);

              // POV Optimization: in POV mode (except King Vishnu who has full high definition panorama), only render tiles within visual radius around player
              if (viewMode === 'pov' && playerCharacter && !isKingVishnuPOV) {
                const distToPlayer = Math.hypot(cx - playerCharacter.x, cz - playerCharacter.z);
                if (distToPlayer > 28) return null;
              }

              if (tile.type === 'chayakada') {
                return (
                  <MinecraftChayakada3D
                    key={tile.id}
                    position={[cx, cy, cz]}
                    onClick={onTapChayakada}
                  />
                );
              }
              return (
                <MinecraftTileBuilding3D
                  key={tile.id}
                  tile={tile}
                  onClick={() => onSelectTile(x, y)}
                />
              );
            })
          )}
        </group>

        {/* 3. Detail 1: Man walking with his cow: DAMU */}
        <MinecraftCowherd3D cowherd={cowherd} onClick={onTapCowherd} />

        {/* 4. Detail 3: Blue Private Bus "SREELAKAM" */}
        <MinecraftSreelakamBus3D busState={busState} onClick={onTapBus} />

        {/* 5. Playable Pauran Character (Controlled by W, A, S, D & On-Screen D-Pad) */}
        {userRole === 'pauran' && playerCharacter && (
          <PlayablePauranCharacter3D player={playerCharacter} character={selectedPauranChar} />
        )}

        {/* 6. Selection Ring */}
        {selectedTile && (
          <group position={[selectedTile.x - OFFSET, 0.05, selectedTile.y - OFFSET]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.45, 0.52, 16]} />
              <meshBasicMaterial color="#facc15" side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}

        {/* World Border Mountain Wall Numbers 1, 2, 3, 4 - ONLY PANCHAYATH PRESIDENT CAN SEE */}
        <WorldBorderMountainNumbers3D userRole={userRole} />

        {/* 2B. Towering Burj Khalifa at Center of Map (Taller than trees) */}
        {viewMode !== 'pov' || (playerCharacter && Math.hypot(playerCharacter.x, playerCharacter.z) < 45) || isKingVishnuPOV ? (
          <MinecraftBurjKhalifa3D />
        ) : null}

        {/* Kodavalam Grama Panchayat (East Landmass) */}
        <group position={[toWorld(25.5, 18)[0], 4.5, toWorld(25.5, 18)[2]]}>
          <Float speed={2} rotationIntensity={0} floatIntensity={0.12}>
            <group>
              <mesh geometry={boxGeo} position={[0, 0, 0]} scale={[4.2, 0.65, 0.12]}>
                <meshStandardMaterial color="#14532d" roughness={0.8} />
              </mesh>
              <mesh geometry={boxGeo} position={[0, 0, 0.07]} scale={[4.0, 0.52, 0.02]}>
                <meshStandardMaterial color="#15803d" />
              </mesh>
              <Text position={[0, 0, 0.09]} fontSize={0.22} color="#bbf7d0" anchorX="center" anchorY="middle" fontWeight="bold">
                🌴 KODAVALAM PANCHAYAT
              </Text>
            </group>
          </Float>
        </group>
      </Canvas>
    </div>
  );
};

export default Village3DCanvas;
