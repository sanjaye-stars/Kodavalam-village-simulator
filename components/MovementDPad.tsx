/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface MovementDPadProps {
  onMove: (dx: number, dz: number) => void;
  isMoving?: boolean;
  characterId?: string;
}

const CARDINAL_POINTS = [
  { label: 'N', deg: 0, title: 'North (000°) · Northern Wall & River', yaw: -Math.PI * 0.5, pitch: -0.22 },
  { label: 'NE', deg: 45, title: 'Northeast (045°) · Mahakshetram Temple', yaw: -Math.PI * 0.25, pitch: -0.18 },
  { label: 'E', deg: 90, title: "East (090°) · Royal Gate & Mainland Vista", yaw: 0.0, pitch: -0.22 },
  { label: 'SE', deg: 135, title: 'Southeast (135°) · Grand Souk Bazaar', yaw: Math.PI * 0.25, pitch: -0.20 },
  { label: 'S', deg: 180, title: 'South (180°) · Southern Wall & Paddies', yaw: Math.PI * 0.5, pitch: -0.22 },
  { label: 'SW', deg: 225, title: 'Southwest (225°) · Camel Caravans', yaw: Math.PI * 0.75, pitch: -0.26 },
  { label: 'W', deg: 270, title: 'West (270°) · Valaskjalf Throne & Peaks', yaw: Math.PI, pitch: -0.15 },
  { label: 'NW', deg: 315, title: 'Northwest (315°) · Mountain Range & Cliffs', yaw: Math.PI * 1.25, pitch: -0.18 },
];

export const MovementDPad: React.FC<MovementDPadProps> = ({ onMove, isMoving, characterId }) => {
  const isKingVishnu = characterId === 'king_vishnu';
  const activeDirection = useRef<{ dx: number; dz: number } | null>(null);
  const holdRotateInterval = useRef<any>(null);

  // King Vishnu POV state synced from CameraController
  const [hudData, setHudData] = useState({
    zoom: 1.0,
    height: 48.0,
    yaw: 0,
    pitch: -0.22,
    deg: 90,
    landmark: "East 090° · Royal Gate ('Bab al-Muluk') & Mainland",
    isAutoRotating: false,
  });
  const [isExpanded, setIsExpanded] = useState(true);
  const [showReticle, setShowReticle] = useState(false);

  useEffect(() => {
    return () => {
      if (holdRotateInterval.current) {
        clearInterval(holdRotateInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isKingVishnu) return;

    const onHudUpdate = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (data) {
        setHudData({
          zoom: Math.round(data.zoom * 10) / 10,
          height: Math.round(data.height),
          yaw: data.yaw,
          pitch: data.pitch,
          deg: data.deg ?? 90,
          landmark: data.landmark || 'Kodavalam Mainland',
          isAutoRotating: Boolean(data.isAutoRotating),
        });
      }
    };

    window.addEventListener('vishnu-hud-data', onHudUpdate as EventListener);
    return () => window.removeEventListener('vishnu-hud-data', onHudUpdate as EventListener);
  }, [isKingVishnu]);

  const triggerCamAction = useCallback((action: {
    type: 'zoomIn' | 'zoomOut' | 'setZoom' | 'heightUp' | 'heightDown' | 'setHeight' | 'lookAt' | 'reset' | 'turnLeft' | 'turnRight' | 'turn180' | 'toggleAutoRotate' | 'setAutoRotate' | 'setYaw';
    value?: number;
    amount?: number;
    yaw?: number;
    pitch?: number;
  }) => {
    window.dispatchEvent(new CustomEvent('vishnu-cam-action', { detail: action }));
  }, []);

  const startContinuousRotate = (direction: 'left' | 'right') => {
    stopContinuousRotate();
    const amount = direction === 'left' ? 0.05 : -0.05;
    triggerCamAction({ type: direction === 'left' ? 'turnLeft' : 'turnRight', amount: 0.08 });
    holdRotateInterval.current = setInterval(() => {
      triggerCamAction({ type: direction === 'left' ? 'turnLeft' : 'turnRight', amount });
    }, 45);
  };

  const stopContinuousRotate = () => {
    if (holdRotateInterval.current) {
      clearInterval(holdRotateInterval.current);
      holdRotateInterval.current = null;
    }
  };

  // Keyboard controls: W, A, S, D and Arrow keys (for standard Pauran walking)
  useEffect(() => {
    if (isKingVishnu) return;
    const keysPressed: Record<string, boolean> = {};

    const updateFromKeys = () => {
      let dx = 0;
      let dz = 0;

      if (keysPressed['w'] || keysPressed['W'] || keysPressed['ArrowUp']) dz -= 1;
      if (keysPressed['s'] || keysPressed['S'] || keysPressed['ArrowDown']) dz += 1;
      if (keysPressed['a'] || keysPressed['A'] || keysPressed['ArrowLeft']) dx -= 1;
      if (keysPressed['d'] || keysPressed['D'] || keysPressed['ArrowRight']) dx += 1;

      if (dx !== 0 || dz !== 0) {
        const len = Math.hypot(dx, dz);
        activeDirection.current = { dx: dx / len, dz: dz / len };
      } else {
        activeDirection.current = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key.toLowerCase())) {
        keysPressed[e.key] = true;
        updateFromKeys();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (keysPressed[e.key]) {
        delete keysPressed[e.key];
        updateFromKeys();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isKingVishnu]);

  // Continuous movement loop while holding keys or D-Pad buttons
  useEffect(() => {
    if (isKingVishnu) return;
    let animId: number;
    const loop = () => {
      if (activeDirection.current) {
        onMove(activeDirection.current.dx, activeDirection.current.dz);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onMove, isKingVishnu]);

  const handlePointerDown = (dx: number, dz: number) => {
    const len = Math.hypot(dx, dz);
    activeDirection.current = { dx: dx / len, dz: dz / len };
  };

  const handlePointerUp = () => {
    activeDirection.current = null;
  };

  // ==========================================
  // KING VISHNU: ROYAL OBSERVATORY & POV CONTROLS HUD
  // ==========================================
  if (isKingVishnu) {
    return (
      <>
        {/* Optional Royal Brass Spyglass Reticle in center of screen when toggled or zoomed */}
        {showReticle && hudData.zoom > 1.1 && (
          <div className="fixed inset-0 pointer-events-none z-20 flex items-center justify-center">
            {/* Subtle Vignette */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-stone-950/60" />
            {/* Brass Crosshair Circle */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)] flex items-center justify-center">
              <div className="w-full h-[1px] bg-amber-500/30" />
              <div className="h-full w-[1px] bg-amber-500/30 absolute" />
              <div className="w-16 h-16 rounded-full border border-amber-400/50 absolute" />
              <div className="w-2 h-2 rounded-full bg-amber-400 absolute" />
              {/* Compass / Zoom HUD Label */}
              <div className="absolute bottom-4 px-2 py-0.5 bg-stone-950/80 rounded border border-amber-500/50 text-[10px] font-mono text-amber-300 font-bold">
                🔭 {hudData.zoom.toFixed(1)}X · {hudData.height}M ELEVATION
              </div>
            </div>
          </div>
        )}

        {/* Bottom-Left Royal Observatory Control Deck */}
        <div className="absolute bottom-4 left-4 z-30 pointer-events-auto select-none flex flex-col items-start max-w-sm sm:max-w-md animate-fade-in">
          {/* Collapsible Header Pill */}
          <div className="bg-stone-950/95 border-2 border-amber-500/80 backdrop-blur-md rounded-2xl p-3 shadow-2xl text-stone-100 flex flex-col gap-2.5 w-full">
            <div className="flex items-center justify-between gap-2 border-b border-amber-500/30 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-lg shrink-0 shadow-inner">
                  👑
                </div>
                <div>
                  <div className="text-[12px] font-bold text-amber-300 font-serif-title flex items-center gap-1.5">
                    <span>Valaskjalf Top Floor Balcony</span>
                    <span className="px-1.5 py-0.5 bg-amber-500/30 text-amber-200 rounded text-[9px] font-mono font-bold">
                      POV VISTA
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-400/90 font-mono flex items-center gap-2">
                    <span>🔭 Height: <strong className="text-amber-200">{hudData.height}m</strong></span>
                    <span>•</span>
                    <span>Zoom: <strong className="text-amber-200">{hudData.zoom.toFixed(1)}x</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowReticle((prev) => !prev)}
                  className={`p-1.5 rounded-lg border text-xs transition-all ${
                    showReticle
                      ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow'
                      : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
                  }`}
                  title="Toggle Royal Brass Spyglass Reticle Overlay"
                >
                  🔭
                </button>
                <button
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="px-2 py-1 rounded-lg bg-stone-900 border border-stone-700 text-amber-300 hover:bg-stone-800 text-[10px] font-mono font-bold"
                  title={isExpanded ? 'Collapse controls' : 'Expand controls'}
                >
                  {isExpanded ? '▲ Hide' : '▼ Controls'}
                </button>
              </div>
            </div>

            {/* 360-DEGREE COMPASS RADAR & BEARING DISPLAY */}
            <div className="flex flex-col gap-1.5 bg-stone-900/90 p-2 rounded-xl border border-amber-500/30">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-mono">
                  {/* Rotating Compass Icon */}
                  <div
                    className="w-5 h-5 rounded-full border border-amber-400/80 bg-stone-950 flex items-center justify-center text-[10px] text-amber-300 shadow transition-transform duration-200"
                    style={{ transform: `rotate(${hudData.deg}deg)` }}
                    title={`Bearing: ${hudData.deg}°`}
                  >
                    ▲
                  </div>
                  <span className="text-amber-300 font-bold">
                    {hudData.deg.toString().padStart(3, '0')}°
                  </span>
                  <span className="text-stone-300 font-semibold">
                    {hudData.deg >= 338 || hudData.deg < 23
                      ? 'NORTH'
                      : hudData.deg >= 23 && hudData.deg < 68
                      ? 'NORTHEAST'
                      : hudData.deg >= 68 && hudData.deg < 113
                      ? 'EAST'
                      : hudData.deg >= 113 && hudData.deg < 158
                      ? 'SOUTHEAST'
                      : hudData.deg >= 158 && hudData.deg < 203
                      ? 'SOUTH'
                      : hudData.deg >= 203 && hudData.deg < 248
                      ? 'SOUTHWEST'
                      : hudData.deg >= 248 && hudData.deg < 293
                      ? 'WEST'
                      : 'NORTHWEST'}
                  </span>
                </div>

                {hudData.isAutoRotating && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/30 border border-amber-400 text-amber-200 text-[9px] font-mono animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    360° AUTO-TOUR
                  </span>
                )}
              </div>

              <div className="text-[10px] text-stone-300 font-mono truncate bg-stone-950/80 px-2 py-1 rounded border border-stone-800">
                📍 {hudData.landmark}
              </div>
            </div>

            {/* EXPANDABLE CONTROLS SECTION */}
            {isExpanded && (
              <div className="flex flex-col gap-2.5 pt-0.5 max-h-[60vh] overflow-y-auto pr-1">
                {/* 1. 360° COMPASS ROSE & HORIZONTAL ROTATION */}
                <div className="bg-stone-900/90 rounded-xl p-2 border border-amber-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1 font-serif-title">
                      <span>🧭 360° Compass Directions</span>
                    </span>
                    <span className="text-[9px] font-mono text-stone-400">
                      Full 360° Horizon
                    </span>
                  </div>

                  {/* 8 Cardinal & Intercardinal Direction Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    {CARDINAL_POINTS.map((pt) => {
                      const diff = Math.min(
                        Math.abs(hudData.deg - pt.deg),
                        360 - Math.abs(hudData.deg - pt.deg)
                      );
                      const isTarget = diff < 23;
                      return (
                        <button
                          key={pt.label}
                          onClick={() => triggerCamAction({ type: 'lookAt', yaw: pt.yaw, pitch: pt.pitch })}
                          className={`py-1 px-1 rounded text-center transition-all flex flex-col items-center justify-center ${
                            isTarget
                              ? 'bg-amber-400 text-stone-950 font-bold shadow-md scale-102 ring-1 ring-amber-300'
                              : 'bg-stone-950/80 text-stone-300 border border-stone-800 hover:bg-stone-800 hover:text-amber-200'
                          }`}
                          title={pt.title}
                        >
                          <span className="text-[11px] font-bold font-mono">{pt.label}</span>
                          <span className="text-[8px] font-mono opacity-80">{pt.deg.toString().padStart(3, '0')}°</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 360° Pan Actions Toolbar */}
                  <div className="grid grid-cols-4 gap-1 pt-1 border-t border-amber-500/20">
                    <button
                      onClick={() => triggerCamAction({ type: 'turnLeft', amount: Math.PI / 4 })}
                      className="py-1 px-1 bg-stone-800 hover:bg-stone-700 active:scale-95 text-[10px] font-bold text-amber-200 rounded border border-amber-500/30 text-center"
                      title="Turn Left 45°"
                    >
                      ⟲ 45°
                    </button>
                    <button
                      onClick={() => triggerCamAction({ type: 'turnRight', amount: Math.PI / 4 })}
                      className="py-1 px-1 bg-stone-800 hover:bg-stone-700 active:scale-95 text-[10px] font-bold text-amber-200 rounded border border-amber-500/30 text-center"
                      title="Turn Right 45°"
                    >
                      ⟳ 45°
                    </button>
                    <button
                      onClick={() => triggerCamAction({ type: 'turn180' })}
                      className="py-1 px-1 bg-stone-800 hover:bg-stone-700 active:scale-95 text-[10px] font-bold text-amber-200 rounded border border-amber-500/30 text-center"
                      title="Turn 180° (Look Behind / Palace)"
                    >
                      🔄 180°
                    </button>
                    <button
                      onClick={() => triggerCamAction({ type: 'toggleAutoRotate' })}
                      className={`py-1 px-1 rounded text-[10px] font-bold transition-all text-center ${
                        hudData.isAutoRotating
                          ? 'bg-amber-500 text-stone-950 font-bold shadow animate-pulse ring-1 ring-amber-300'
                          : 'bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-amber-100 shadow'
                      }`}
                      title="Toggle Continuous 360° Panoramic Tour (Space)"
                    >
                      {hudData.isAutoRotating ? '⏸ Stop' : '🎥 360° Tour'}
                    </button>
                  </div>

                  {/* Smooth Hold-to-Turn Continuous Rotation Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      onPointerDown={() => startContinuousRotate('left')}
                      onPointerUp={stopContinuousRotate}
                      onPointerLeave={stopContinuousRotate}
                      className="py-1.5 px-2 bg-stone-950 hover:bg-amber-950/60 active:bg-amber-900 border border-stone-800 hover:border-amber-500/50 rounded-lg text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 select-none cursor-pointer"
                      title="Hold to smoothly rotate 360° Left"
                    >
                      <span>◀◀</span>
                      <span>Hold to Pan Left</span>
                    </button>
                    <button
                      onPointerDown={() => startContinuousRotate('right')}
                      onPointerUp={stopContinuousRotate}
                      onPointerLeave={stopContinuousRotate}
                      className="py-1.5 px-2 bg-stone-950 hover:bg-amber-950/60 active:bg-amber-900 border border-stone-800 hover:border-amber-500/50 rounded-lg text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 select-none cursor-pointer"
                      title="Hold to smoothly rotate 360° Right"
                    >
                      <span>Hold to Pan Right</span>
                      <span>▶▶</span>
                    </button>
                  </div>
                </div>

                {/* 2. ZOOM IN & ZOOM OUT CONTROLS */}
                <div className="bg-stone-900/90 rounded-xl p-2 border border-amber-500/30 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1 font-serif-title">
                      <span>🔍 Royal Zoom & Magnification</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">
                      {hudData.zoom.toFixed(1)}x
                    </span>
                  </div>

                  {/* Direct Zoom In & Out Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => triggerCamAction({ type: 'zoomIn', amount: 0.5 })}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-95 text-stone-950 font-bold rounded-lg shadow text-xs transition-all"
                      title="Zoom In towards the mainland (+ / Wheel Up)"
                    >
                      <span className="text-sm">🔍+</span>
                      <span>Zoom In</span>
                    </button>
                    <button
                      onClick={() => triggerCamAction({ type: 'zoomOut', amount: 0.5 })}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-stone-800 hover:bg-stone-700 active:scale-95 text-amber-200 font-bold rounded-lg border border-amber-500/40 text-xs transition-all"
                      title="Zoom Out to wide panorama (- / Wheel Down)"
                    >
                      <span className="text-sm">🔍-</span>
                      <span>Zoom Out</span>
                    </button>
                  </div>

                  {/* Zoom Presets */}
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    {[
                      { label: '1x Wide', value: 1.0 },
                      { label: '2x Vista', value: 2.0 },
                      { label: '3.5x Scout', value: 3.5 },
                      { label: '5.5x Spyglass', value: 5.5 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => triggerCamAction({ type: 'setZoom', value: preset.value })}
                        className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                          Math.abs(hudData.zoom - preset.value) < 0.3
                            ? 'bg-amber-400 text-stone-950 shadow'
                            : 'bg-stone-950/80 text-stone-300 border border-stone-800 hover:bg-stone-800 hover:text-amber-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. POV HEIGHT ELEVATION CONTROLS */}
                <div className="bg-stone-900/90 rounded-xl p-2 border border-amber-500/30 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1 font-serif-title">
                      <span>🏰 Top Floor POV Height</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">
                      {hudData.height}m
                    </span>
                  </div>

                  {/* Height Step Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => triggerCamAction({ type: 'heightUp', amount: 4.0 })}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-stone-800 hover:bg-amber-900/50 active:scale-95 text-amber-300 font-bold rounded-lg border border-amber-500/40 text-xs transition-all"
                      title="Increase height of the POV (R / Shift+Wheel Up)"
                    >
                      <span className="text-sm">▲</span>
                      <span>Raise Height (+4m)</span>
                    </button>
                    <button
                      onClick={() => triggerCamAction({ type: 'heightDown', amount: 4.0 })}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-stone-800 hover:bg-amber-900/50 active:scale-95 text-amber-300 font-bold rounded-lg border border-amber-500/40 text-xs transition-all"
                      title="Lower height of the POV (F / Shift+Wheel Down)"
                    >
                      <span className="text-sm">▼</span>
                      <span>Lower Height (-4m)</span>
                    </button>
                  </div>

                  {/* Height Presets */}
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    {[
                      { label: '44m Balcony', value: 44.0 },
                      { label: '48m Elevated', value: 48.0 },
                      { label: '60m Spire', value: 60.0 },
                      { label: '76m Eagle Eye', value: 76.0 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => triggerCamAction({ type: 'setHeight', value: preset.value })}
                        className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                          Math.abs(hudData.height - preset.value) < 2.5
                            ? 'bg-amber-400 text-stone-950 shadow'
                            : 'bg-stone-950/80 text-stone-300 border border-stone-800 hover:bg-stone-800 hover:text-amber-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. QUICK GAZE LANDMARKS */}
                <div className="bg-stone-900/90 rounded-xl p-2 border border-amber-500/30 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-amber-200/90 font-serif-title">
                    🧭 Quick Gaze Landmarks:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => triggerCamAction({ type: 'lookAt', yaw: 0.0, pitch: -0.22 })}
                      className="py-1 px-1 bg-stone-950 hover:bg-stone-800 text-[10px] rounded border border-stone-800 text-stone-200 font-medium truncate"
                      title="Look East to Mainland"
                    >
                      🌅 Mainland (E)
                    </button>
                    <button
                      onClick={() => triggerCamAction({ type: 'lookAt', yaw: -Math.PI * 0.25, pitch: -0.18 })}
                      className="py-1 px-1 bg-stone-950 hover:bg-stone-800 text-[10px] rounded border border-stone-800 text-stone-200 font-medium truncate"
                      title="Look Northeast at Mahakshetram Temple"
                    >
                      🏛️ Temple (NE)
                    </button>
                    <button
                      onClick={() => triggerCamAction({ type: 'lookAt', yaw: Math.PI * 0.25, pitch: -0.20 })}
                      className="py-1 px-1 bg-stone-950 hover:bg-stone-800 text-[10px] rounded border border-stone-800 text-stone-200 font-medium truncate"
                      title="Look Southeast at Grand Souk Bazaar"
                    >
                      🏪 Bazaar (SE)
                    </button>
                    <button
                      onClick={() => triggerCamAction({ type: 'lookAt', yaw: 0.0, pitch: -0.38 })}
                      className="py-1 px-1 bg-stone-950 hover:bg-stone-800 text-[10px] rounded border border-stone-800 text-stone-200 font-medium truncate"
                      title="Look East Down at Royal Gate (Bab al-Muluk)"
                    >
                      ⛩️ Gate (E)
                    </button>
                    <button
                      onClick={() => triggerCamAction({ type: 'lookAt', yaw: Math.PI * 0.75, pitch: -0.26 })}
                      className="py-1 px-1 bg-stone-950 hover:bg-stone-800 text-[10px] rounded border border-stone-800 text-stone-200 font-medium truncate"
                      title="Look Southwest at Camel Caravans"
                    >
                      🐪 Camels (SW)
                    </button>
                    <button
                      onClick={() => triggerCamAction({ type: 'lookAt', yaw: Math.PI, pitch: -0.15 })}
                      className="py-1 px-1 bg-stone-950 hover:bg-stone-800 text-[10px] rounded border border-stone-800 text-stone-200 font-medium truncate"
                      title="Look West at Royal Palace Throne & Spires"
                    >
                      👑 Palace (W)
                    </button>
                  </div>
                  <div className="pt-1 border-t border-stone-800">
                    <button
                      onClick={() => triggerCamAction({ type: 'reset' })}
                      className="w-full py-1 bg-amber-950/50 hover:bg-amber-900/80 text-[10px] rounded border border-amber-600/50 text-amber-200 font-bold"
                      title="Reset View to Default Vista (East 090°)"
                    >
                      ↺ Reset View (East 090° Vista)
                    </button>
                  </div>
                </div>

                {/* Helpful navigation hint */}
                <p className="text-[9px] text-stone-400 font-mono leading-tight px-1">
                  💡 Drag screen to look 360° • A/D or ◄/► to turn • Space for Auto-Tour • Scroll to Zoom • Shift+Scroll for Height
                </p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // STANDARD PAURAN WALKING D-PAD (for all other characters)
  return (
    <div className="absolute bottom-4 left-4 z-30 pointer-events-auto select-none flex flex-col items-center">
      {/* Visual Hint */}
      <div className="mb-1 text-[10px] font-mono text-emerald-300 font-bold bg-stone-900/80 px-2 py-0.5 rounded-full border border-stone-800 shadow">
        Walk: W, A, S, D / Touch D-Pad
      </div>

      {/* D-Pad Buttons Screen Layout */}
      <div className="relative w-36 h-36 bg-stone-950/85 backdrop-blur-md border-2 border-emerald-600/60 rounded-3xl p-2 shadow-2xl flex flex-col items-center justify-between">
        {/* Forward / W */}
        <button
          onPointerDown={() => handlePointerDown(0, -1)}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-10 h-10 bg-stone-900 hover:bg-emerald-800/80 active:bg-emerald-600 text-stone-100 font-bold text-xs rounded-xl border border-emerald-500/40 shadow flex flex-col items-center justify-center active:scale-95 transition-all"
          title="Move Forward (W / Up)"
        >
          <span className="text-sm leading-none">▲</span>
          <span className="text-[9px] font-mono text-emerald-400">W</span>
        </button>

        {/* Middle Row: Left (A), Center Indicator, Right (D) */}
        <div className="w-full flex items-center justify-between px-1">
          {/* Left / A */}
          <button
            onPointerDown={() => handlePointerDown(-1, 0)}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-10 h-10 bg-stone-900 hover:bg-emerald-800/80 active:bg-emerald-600 text-stone-100 font-bold text-xs rounded-xl border border-emerald-500/40 shadow flex flex-col items-center justify-center active:scale-95 transition-all"
            title="Move Left (A / Left)"
          >
            <span className="text-sm leading-none">◀</span>
            <span className="text-[9px] font-mono text-emerald-400">A</span>
          </button>

          {/* Center Joypad Core */}
          <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-[10px] text-emerald-400">
            🚶
          </div>

          {/* Right / D */}
          <button
            onPointerDown={() => handlePointerDown(1, 0)}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-10 h-10 bg-stone-900 hover:bg-emerald-800/80 active:bg-emerald-600 text-stone-100 font-bold text-xs rounded-xl border border-emerald-500/40 shadow flex flex-col items-center justify-center active:scale-95 transition-all"
            title="Move Right (D / Right)"
          >
            <span className="text-sm leading-none">▶</span>
            <span className="text-[9px] font-mono text-emerald-400">D</span>
          </button>
        </div>

        {/* Backward / S */}
        <button
          onPointerDown={() => handlePointerDown(0, 1)}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-10 h-10 bg-stone-900 hover:bg-emerald-800/80 active:bg-emerald-600 text-stone-100 font-bold text-xs rounded-xl border border-emerald-500/40 shadow flex flex-col items-center justify-center active:scale-95 transition-all"
          title="Move Backward (S / Down)"
        >
          <span className="text-[9px] font-mono text-emerald-400">S</span>
          <span className="text-sm leading-none">▼</span>
        </button>
      </div>
    </div>
  );
};

export default MovementDPad;
