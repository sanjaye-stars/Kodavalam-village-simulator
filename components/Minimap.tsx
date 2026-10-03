/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { CowherdState, BusState, TileData } from '../types';
import { WORLD_SIZE, MAP_SIZE } from '../constants';

interface MinimapProps {
  tiles: TileData[][];
  cowherd: CowherdState;
  busState: BusState;
  cameraTarget?: [number, number, number];
  onNavigate?: (worldX: number, worldZ: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  tiles,
  cowherd,
  busState,
  cameraTarget = [0, 0, 0],
  onNavigate,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  );

  // Map world coordinate [-WORLD_SIZE/2, WORLD_SIZE/2] to percentage [0, 100]
  const halfWorld = WORLD_SIZE / 2;
  const toPercent = (val: number) => ((val + halfWorld) / WORLD_SIZE) * 100;

  // Convert core village tile (0 to MAP_SIZE-1) to world offset
  const coreOffset = MAP_SIZE / 2 - 0.5;
  const damuWorldX = cowherd.x - coreOffset;
  const damuWorldZ = cowherd.y - coreOffset;

  const busWorldX = 22.2 + busState.progress * 0.8 - coreOffset;
  const busWorldZ = 17.1 - coreOffset;

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onNavigate) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const normX = clickX / rect.width;
    const normZ = clickY / rect.height;

    const targetWorldX = (normX - 0.5) * WORLD_SIZE;
    const targetWorldZ = (normZ - 0.5) * WORLD_SIZE;

    onNavigate(targetWorldX, targetWorldZ);
  };

  return (
    <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-30 pointer-events-auto select-none flex flex-col items-end touch-manipulation">
      {/* Expand/Collapse Toggle Pill */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="mb-1.5 px-2 py-1 sm:px-2.5 sm:py-1 bg-stone-900/95 hover:bg-stone-800 text-amber-200 border border-amber-600/50 rounded-xl shadow-lg backdrop-blur-md text-[10px] sm:text-[11px] font-mono flex items-center gap-1.5 active:scale-95 transition-all touch-manipulation"
        title="Toggle Realm Minimap"
      >
        <span>🗺️</span>
        <span className="font-bold">ഭൂപടം (Minimap {WORLD_SIZE}m)</span>
        <span className="text-[10px] text-stone-400">{isExpanded ? '▼' : '▲'}</span>
      </button>

      {/* Expanded Minimap Canvas / Radar */}
      {isExpanded && (
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-stone-950/95 border-2 border-amber-600/70 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-lg animate-fade-in flex flex-col">
          {/* Header Info */}
          <div className="px-2.5 py-1 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between text-[10px] font-mono text-stone-300">
            <span className="text-amber-300 font-bold">🌴 Kodavalam Grama Panchayat</span>
            <div className="flex items-center gap-1.5">
              {onNavigate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(0, 0);
                  }}
                  className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-[9px] font-bold"
                  title="Recenter Camera on Village"
                >
                  🎯 Center
                </button>
              )}
              <span className="text-stone-500">{WORLD_SIZE}×{WORLD_SIZE}</span>
            </div>
          </div>

          {/* Interactive World Map Surface */}
          <div
            onClick={handleMinimapClick}
            className="relative flex-1 w-full h-full cursor-crosshair overflow-hidden bg-gradient-to-br from-emerald-950 via-stone-900 to-emerald-950"
            title="Click anywhere to pan camera to that region"
          >
            {/* 1. Surrounding Mountain Borders */}
            <div className="absolute inset-0 border-4 border-stone-700/60 pointer-events-none rounded-xl" />
            <div className="absolute inset-1 border border-stone-800/80 pointer-events-none" />

            {/* 2. Outer Biome Regions */}
            {/* Northern Forests */}
            <div className="absolute top-2 left-6 right-6 h-8 bg-emerald-900/40 rounded-full blur-[2px]" />
            {/* Southern Paddy Terraces */}
            <div className="absolute bottom-3 left-8 right-8 h-8 bg-amber-900/30 rounded-full blur-[2px]" />
            {/* Western Coconut Groves */}
            <div className="absolute top-8 left-2 w-10 bottom-8 bg-lime-900/40 rounded-full blur-[2px]" />
            {/* Eastern Hills */}
            <div className="absolute top-8 right-2 w-10 bottom-8 bg-stone-700/40 rounded-full blur-[2px]" />

            {/* 3. Outer Ponds */}
            <div
              className="absolute w-3.5 h-3.5 rounded-full bg-sky-500/80 border border-sky-300 shadow"
              style={{
                left: `${toPercent(-36)}%`,
                top: `${toPercent(-38)}%`,
              }}
              title="Northern Lotus Lake"
            />
            <div
              className="absolute w-4 h-4 rounded-full bg-sky-500/80 border border-sky-300 shadow"
              style={{
                left: `${toPercent(38)}%`,
                top: `${toPercent(42)}%`,
              }}
              title="Eastern Pushkarini Pond"
            />

            {/* 5. Center 36x36 Village & Kingdom Core Boundary Box */}
            <div
              className="absolute border border-dashed border-amber-400/80 bg-amber-500/10 pointer-events-none"
              style={{
                left: `${toPercent(-MAP_SIZE / 2)}%`,
                top: `${toPercent(-MAP_SIZE / 2)}%`,
                width: `${(MAP_SIZE / WORLD_SIZE) * 100}%`,
                height: `${(MAP_SIZE / WORLD_SIZE) * 100}%`,
              }}
            >
              {/* West: Vishnu's Kingdom Label */}
              <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-amber-300">
                👑
              </span>
              {/* East: Kodavalam Panchayat Label */}
              <span className="absolute top-0.5 right-0.5 text-[8px] font-bold text-emerald-300">
                🌴
              </span>
            </div>

            {/* 6. River Connecting Bridges */}
            {/* Grand Royal Bridge (y = 18) */}
            <div
              className="absolute h-1.5 w-3 bg-amber-600 border border-amber-300 rounded shadow z-10"
              style={{
                left: `${toPercent(-0.5)}%`,
                top: `${toPercent(18 - coreOffset)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title="Grand Royal Bridge of Vishnu"
            />
            {/* North Bridge (y = 10) */}
            <div
              className="absolute h-1 w-2.5 bg-amber-700 border border-amber-400 rounded z-10"
              style={{
                left: `${toPercent(-0.5)}%`,
                top: `${toPercent(10 - coreOffset)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title="Northern Harmony Bridge"
            />
            {/* South Bridge (y = 26) */}
            <div
              className="absolute h-1 w-2.5 bg-amber-700 border border-amber-400 rounded z-10"
              style={{
                left: `${toPercent(-0.5)}%`,
                top: `${toPercent(26 - coreOffset)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title="Southern Bridge of Harmony"
            />

            {/* 6B. Burj Khalifa At Center (0, 0) */}
            <div
              className="absolute w-4 h-4 bg-sky-400 border border-amber-300 rounded-sm shadow-lg z-20 flex items-center justify-center text-[9px]"
              style={{
                left: `${toPercent(0)}%`,
                top: `${toPercent(0)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title="Burj Khalifa (Center of Map)"
            >
              🏙️
            </div>

            {/* 6C. User Diagram Map Outline: 'Palace', Left 'wall', Protruding 'Gate', Right 'wall' */}
            {/* 'Palace' - Wide building along the western border wall */}
            <div
              className="absolute bg-amber-600/90 border-2 border-yellow-300 rounded shadow-lg z-20 flex flex-col items-center justify-center pointer-events-none"
              style={{
                left: `${toPercent(-28)}%`,
                top: `${toPercent(0)}%`,
                width: '12%',
                height: '38%',
                transform: 'translate(-50%, -50%)',
              }}
              title="'Palace' (Royal Palace of Valaskjalf)"
            >
              <span className="text-[10px] font-bold text-yellow-200">🏰</span>
              <span className="text-[7.5px] font-mono font-bold text-yellow-100 bg-stone-950/80 px-1 rounded border border-amber-400/50 mt-0.5 whitespace-nowrap">
                'Palace'
              </span>
            </div>

            {/* Stepped Wall & Gate Fortress Outline matching user hand-drawn sketch */}
            {/* Left 'wall' (North Section) */}
            <div
              className="absolute bg-amber-700 border-x border-amber-400/80 z-15 pointer-events-none"
              style={{
                left: `${toPercent(-5.5)}%`,
                top: `${toPercent(-13.5)}%`,
                width: '2px',
                height: `${toPercent(17) - toPercent(0)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title="'wall' (Left North Wall)"
            >
              <div className="absolute top-1/2 -left-6 transform -translate-y-1/2 text-[7px] font-mono font-bold text-amber-300 bg-black/80 px-0.5 rounded border border-amber-500/40">
                'wall'
              </div>
            </div>

            {/* Left Return Wall (stepping forward 90° towards mainland) */}
            <div
              className="absolute bg-amber-700 border-y border-amber-400/80 z-15 pointer-events-none"
              style={{
                left: `${(toPercent(-5.5) + toPercent(2.2)) / 2}%`,
                top: `${toPercent(-4.8)}%`,
                width: `${toPercent(2.2) - toPercent(-5.5)}%`,
                height: '2px',
                transform: 'translate(-50%, -50%)',
              }}
            />

            {/* Protruding Central 'Gate' Bastion */}
            <div
              className="absolute bg-amber-500/90 border-2 border-amber-300 rounded shadow-md z-20 flex flex-col items-center justify-center pointer-events-none"
              style={{
                left: `${toPercent(2.2)}%`,
                top: `${toPercent(0)}%`,
                width: '6.5%',
                height: '11%',
                transform: 'translate(-50%, -50%)',
              }}
              title="'Gate' (Royal Triple Archway Gate)"
            >
              <span className="text-[9px]">⛩️</span>
              <span className="text-[7.5px] font-mono font-bold text-yellow-100 bg-stone-950/80 px-1 rounded border border-amber-400/50 whitespace-nowrap">
                'Gate'
              </span>
            </div>

            {/* Right Return Wall (stepping backward 90°) */}
            <div
              className="absolute bg-amber-700 border-y border-amber-400/80 z-15 pointer-events-none"
              style={{
                left: `${(toPercent(-5.5) + toPercent(2.2)) / 2}%`,
                top: `${toPercent(4.8)}%`,
                width: `${toPercent(2.2) - toPercent(-5.5)}%`,
                height: '2px',
                transform: 'translate(-50%, -50%)',
              }}
            />

            {/* Right 'wall' (South Section) */}
            <div
              className="absolute bg-amber-700 border-x border-amber-400/80 z-15 pointer-events-none"
              style={{
                left: `${toPercent(-5.5)}%`,
                top: `${toPercent(13.5)}%`,
                width: '2px',
                height: `${toPercent(17) - toPercent(0)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title="'wall' (Right South Wall)"
            >
              <div className="absolute top-1/2 -left-6 transform -translate-y-1/2 text-[7px] font-mono font-bold text-amber-300 bg-black/80 px-0.5 rounded border border-amber-500/40">
                'wall'
              </div>
            </div>

            {/* 6C2. His Highness Lord Vishnu Royal Monumental Frame */}
            <div
              className="absolute w-4 h-4 bg-yellow-400 border border-amber-600 rounded-sm shadow-lg z-20 flex items-center justify-center text-[9px] animate-bounce"
              style={{
                left: `${toPercent(-75)}%`,
                top: `${toPercent(0)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title="Monumental Frame: His Highness Lord Vishnu"
            >
              👑
            </div>

            {/* 6D. Vishnu's Kingdom Camels & Cows */}
            <div
              className="absolute text-[8px] z-10 pointer-events-none"
              style={{
                left: `${toPercent(12 - coreOffset)}%`,
                top: `${toPercent(20 - coreOffset)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title="Desert Camels (Vishnu's Kingdom)"
            >
              🐫
            </div>
            <div
              className="absolute text-[8px] z-10 pointer-events-none"
              style={{
                left: `${toPercent(7 - coreOffset)}%`,
                top: `${toPercent(8 - coreOffset)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title="Royal Cows (Vishnu's Kingdom)"
            >
              🐄
            </div>

            {/* 7. DAMU Moving Marker */}
            <div
              className="absolute w-2.5 h-2.5 rounded-full bg-rose-500 border border-white shadow-md z-20 animate-pulse"
              style={{
                left: `${toPercent(damuWorldX)}%`,
                top: `${toPercent(damuWorldZ)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title="DAMU"
            >
              <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 text-[8px] font-bold text-rose-300 whitespace-nowrap bg-black/70 px-1 rounded pointer-events-none">
                DAMU
              </div>
            </div>

            {/* 8. Sreelakam Bus Moving Marker */}
            <div
              className="absolute w-2 h-2 rounded bg-sky-400 border border-white z-20"
              style={{
                left: `${toPercent(busWorldX)}%`,
                top: `${toPercent(busWorldZ)}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title="Sreelakam Bus"
            />

            {/* 9. Camera Target Viewport Reticle */}
            <div
              className="absolute w-4 h-4 border-2 border-yellow-300 rounded-full pointer-events-none z-10 animate-ping opacity-60"
              style={{
                left: `${toPercent(cameraTarget[0])}%`,
                top: `${toPercent(cameraTarget[2])}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div
              className="absolute w-2 h-2 bg-yellow-400 rounded-full pointer-events-none z-10 shadow"
              style={{
                left: `${toPercent(cameraTarget[0])}%`,
                top: `${toPercent(cameraTarget[2])}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>

          {/* Footer Legend */}
          <div className="px-2 py-1 bg-stone-950 text-[9px] text-stone-400 font-mono flex items-center justify-between border-t border-stone-800">
            <span>Tap to Navigate</span>
            <span className="text-amber-400 font-bold">5× Scaled World</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Minimap;
