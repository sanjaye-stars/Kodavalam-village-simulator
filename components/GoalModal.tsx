/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { VillageResources } from '../types';
import { WIN_POPULATION_TARGET, WIN_HAPPINESS_TARGET, MAX_YEARS } from '../constants';

interface GoalModalProps {
  resources: VillageResources;
  year: number;
  month: number;
  day: number;
  stats: {
    festivalsHeld: number;
    busesWelcomed: number;
    milkHarvested: number;
    volleyballMatches: number;
  };
  onClose: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  resources,
  year,
  stats,
  onClose,
}) => {
  const popProgress = Math.min(100, Math.round((resources.population / WIN_POPULATION_TARGET) * 100));
  const happyProgress = Math.min(100, Math.round((resources.happiness / WIN_HAPPINESS_TARGET) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-700 rounded-3xl shadow-2xl p-6 text-stone-100 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1 border border-stone-700 active:scale-95 transition-all touch-manipulation cursor-pointer"
              title="Return to village"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                Panchayat 5-Year Master Plan
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif-title text-amber-200">
                Kodavalam Development Goals
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white px-2 py-1 text-sm font-medium">
            ✕
          </button>
        </div>

        {/* Win Conditions Progress */}
        <div className="space-y-4">
          {/* Target 1: Population */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-stone-200">Target Population ({WIN_POPULATION_TARGET})</span>
              <span className="font-mono text-amber-300">{resources.population} / {WIN_POPULATION_TARGET}</span>
            </div>
            <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${popProgress}%` }}
              />
            </div>
          </div>

          {/* Target 2: Happiness */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-stone-200">Target Happiness ({WIN_HAPPINESS_TARGET}%)</span>
              <span className="font-mono text-amber-300">{Math.round(resources.happiness)}% / {WIN_HAPPINESS_TARGET}%</span>
            </div>
            <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${happyProgress}%` }}
              />
            </div>
          </div>

          {/* Target 3: Timeline */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-stone-200">Term Limit ({MAX_YEARS} Years)</span>
              <span className="font-mono text-amber-300">Year {year} of {MAX_YEARS}</span>
            </div>
            <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
              <div
                className="bg-sky-500 h-full transition-all duration-300"
                style={{ width: `${(year / MAX_YEARS) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Village Milestones */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 text-center">
            <div className="text-lg">🚌</div>
            <div className="text-xs font-bold text-stone-200">{stats.busesWelcomed}</div>
            <div className="text-[10px] text-stone-500 font-mono">Sreelakam Bus Trips</div>
          </div>
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 text-center">
            <div className="text-lg">🌸</div>
            <div className="text-xs font-bold text-stone-200">{stats.festivalsHeld}</div>
            <div className="text-[10px] text-stone-500 font-mono">Festivals Celebrated</div>
          </div>
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 text-center">
            <div className="text-lg">🥛</div>
            <div className="text-xs font-bold text-stone-200">{stats.milkHarvested} L</div>
            <div className="text-[10px] text-stone-500 font-mono">Cow Milk Grazed</div>
          </div>
          <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 text-center">
            <div className="text-lg">🏐</div>
            <div className="text-xs font-bold text-stone-200">{stats.volleyballMatches}</div>
            <div className="text-[10px] text-stone-500 font-mono">Volleyball Matches</div>
          </div>
        </div>

        {/* Warning / Rules */}
        <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-[11px] text-rose-300/80 leading-relaxed">
          ⚠️ <span className="font-semibold text-rose-200">Avoid Crisis:</span> Keep food and happiness above 0. If either remains at 0 for 5 consecutive days, the Panchayat falls!
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow"
        >
          Return to Village
        </button>
      </div>
    </div>
  );
};

export default GoalModal;
