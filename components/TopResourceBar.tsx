/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { VillageResources, Season } from '../types';
import { MONTH_NAMES, WIN_POPULATION_TARGET, WIN_HAPPINESS_TARGET, MAX_YEARS } from '../constants';

interface TopResourceBarProps {
  resources: VillageResources;
  day: number;
  month: number;
  year: number;
  season: Season;
  simSpeed: number; // 0, 1, 2, 3
  onSetSpeed: (speed: number) => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onOpenGoals: () => void;
  onSaveGame: () => void;
  cameraMode: 'aerial' | 'ground';
  onToggleCameraMode: () => void;
}

export const TopResourceBar: React.FC<TopResourceBarProps> = ({
  resources,
  day,
  month,
  year,
  season,
  simSpeed,
  onSetSpeed,
  isAudioMuted,
  onToggleAudio,
  onOpenGoals,
  onSaveGame,
  cameraMode,
  onToggleCameraMode,
}) => {
  return (
    <header className="w-full bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 px-3 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-xl z-30 select-none">
      {/* 1. Village Title & Date Status */}
      <div className="flex items-center justify-between md:justify-start gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold font-serif-title tracking-wide text-amber-300">
            Kodavalam
          </span>
          <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
            Kasaragod, Kerala
          </span>
        </div>

        {/* Date & Season */}
        <div className="flex items-center gap-2 text-xs font-mono bg-stone-950/80 px-2.5 py-1 rounded-lg border border-stone-800">
          <span className="text-amber-200">
            Day {day} · {MONTH_NAMES[month - 1]} Yr {year}
          </span>
          <span className="text-stone-500">|</span>
          <span className="text-emerald-400 font-sans text-[11px] font-medium">
            {season === 'Southwest Monsoon' ? '🌧️ Monsoon' : season === 'Summer' ? '☀️ Summer' : season === 'Post-Monsoon' ? '🌸 Harvest' : '❄️ Winter'}
          </span>
        </div>
      </div>

      {/* 2. Core Resources Bar (Food, Water, Money, Happiness, Health, Education, Pop) */}
      <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1">
        {/* Treasury */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-stone-950/60 px-2 py-1 rounded border border-stone-800" title="Panchayat Treasury">
          <span className="text-amber-400 font-bold">₹</span>
          <span className={`font-bold ${resources.money < 100 ? 'text-red-400 animate-pulse' : 'text-stone-100'}`}>
            {resources.money.toLocaleString()}
          </span>
        </div>

        {/* Food */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-stone-950/60 px-2 py-1 rounded border border-stone-800" title="Village Food Granary">
          <span>🌾</span>
          <span className={`font-bold ${resources.food <= 15 ? 'text-red-400 animate-pulse' : 'text-stone-100'}`}>
            {Math.round(resources.food)}
          </span>
        </div>

        {/* Water */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-stone-950/60 px-2 py-1 rounded border border-stone-800" title="Sweet Well & River Water">
          <span>💧</span>
          <span className={`font-bold ${resources.water <= 15 ? 'text-red-400 animate-pulse' : 'text-stone-100'}`}>
            {Math.round(resources.water)}
          </span>
        </div>

        {/* Happiness */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-stone-950/60 px-2 py-1 rounded border border-stone-800" title="Villager Happiness">
          <span>😊</span>
          <span className={`font-bold ${resources.happiness < 40 ? 'text-red-400' : 'text-amber-300'}`}>
            {Math.round(resources.happiness)}%
          </span>
        </div>

        {/* Health */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-stone-950/60 px-2 py-1 rounded border border-stone-800" title="Public Health & Clinic Index">
          <span>❤️</span>
          <span className={`font-bold ${resources.health < 40 ? 'text-red-400' : 'text-rose-300'}`}>
            {Math.round(resources.health)}%
          </span>
        </div>

        {/* Education */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-stone-950/60 px-2 py-1 rounded border border-stone-800" title="Education & Literacy">
          <span>📚</span>
          <span className="font-bold text-sky-300">
            {Math.round(resources.education)}%
          </span>
        </div>

        {/* Population */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-stone-950/60 px-2 py-1 rounded border border-stone-800" title="Population & Housing Capacity">
          <span>👥</span>
          <span className="font-bold text-stone-200">
            {resources.population}/{resources.maxPopulation}
          </span>
        </div>
      </div>

      {/* 3. Controls: Speed, Goals, Save, Audio */}
      <div className="flex items-center gap-1.5">
        {/* Speed Controls */}
        <div className="flex items-center bg-stone-950 p-0.5 rounded-lg border border-stone-800 text-xs">
          <button
            onClick={() => onSetSpeed(0)}
            className={`px-2 py-1 rounded ${simSpeed === 0 ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-white'}`}
            title="Pause Simulation"
          >
            ⏸
          </button>
          <button
            onClick={() => onSetSpeed(1)}
            className={`px-2 py-1 rounded ${simSpeed === 1 ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-white'}`}
            title="Normal Speed (1x)"
          >
            1x
          </button>
          <button
            onClick={() => onSetSpeed(2)}
            className={`px-2 py-1 rounded ${simSpeed === 2 ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-white'}`}
            title="Fast Speed (2x)"
          >
            2x
          </button>
          <button
            onClick={() => onSetSpeed(3)}
            className={`px-2 py-1 rounded ${simSpeed === 3 ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-white'}`}
            title="Ultra Speed (3x)"
          >
            3x
          </button>
        </div>

        {/* 3D Camera Perspective Toggle */}
        <button
          onClick={onToggleCameraMode}
          className="px-2.5 py-1 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-sky-300 border border-stone-700 rounded-lg transition-colors flex items-center gap-1"
          title="Toggle between Aerial Director 3D and Ground View"
        >
          <span>🎥</span>
          <span className="hidden sm:inline">{cameraMode === 'aerial' ? 'Aerial 3D' : 'Ground 3D'}</span>
        </button>

        {/* 5-Year Goal Button */}
        <button
          onClick={onOpenGoals}
          className="px-2.5 py-1 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 rounded-lg transition-colors flex items-center gap-1"
          title="View 5-Year Panchayat Targets"
        >
          <span>🎯</span>
          <span className="hidden sm:inline">Goals</span>
        </button>

        {/* Save Game */}
        <button
          onClick={onSaveGame}
          className="px-2.5 py-1 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 rounded-lg transition-colors"
          title="Save Progress to LocalStorage"
        >
          💾
        </button>

        {/* Audio Mute */}
        <button
          onClick={onToggleAudio}
          className="p-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg border border-stone-700"
          title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isAudioMuted ? '🔇' : '🔊'}
        </button>
      </div>
    </header>
  );
};

export default TopResourceBar;
