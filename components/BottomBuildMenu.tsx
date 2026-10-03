/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { TileType, TileData, VillageResources } from '../types';
import { BUILDINGS_CATALOG } from '../constants';
import { villageAudio } from '../services/audioService';

interface BottomBuildMenuProps {
  resources: VillageResources;
  activeTool: TileType | 'inspect' | 'demolish' | null;
  onSelectTool: (tool: TileType | 'inspect' | 'demolish' | null) => void;
  selectedTileData: TileData | null;
  onUpgradeTile: (x: number, y: number) => void;
  onDemolishTile: (x: number, y: number) => void;
}

export const BottomBuildMenu: React.FC<BottomBuildMenuProps> = ({
  resources,
  activeTool,
  onSelectTool,
  selectedTileData,
  onUpgradeTile,
  onDemolishTile,
}) => {
  const [filter, setFilter] = useState<'all' | 'housing' | 'production' | 'civic'>('all');

  const buildingKeys = Object.keys(BUILDINGS_CATALOG) as TileType[];

  const filteredBuildings = buildingKeys.filter((key) => {
    const b = BUILDINGS_CATALOG[key];
    if (filter === 'housing') return b.category === 'infrastructure';
    if (filter === 'production') return b.category === 'production';
    if (filter === 'civic') return b.category === 'civic' || b.category === 'services';
    return true;
  });

  return (
    <footer className="w-full bg-stone-900/95 backdrop-blur-md border-t border-stone-800 text-stone-100 p-2 sm:p-3 flex flex-col gap-2 z-30 select-none shadow-2xl">
      {/* 1. Header with Filters & Inspect info */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${filter === 'all' ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-white'}`}
          >
            All Build
          </button>
          <button
            onClick={() => setFilter('housing')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${filter === 'housing' ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-white'}`}
          >
            Homes & Roads
          </button>
          <button
            onClick={() => setFilter('production')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${filter === 'production' ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-white'}`}
          >
            Farms & Wells
          </button>
          <button
            onClick={() => setFilter('civic')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${filter === 'civic' ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-white'}`}
          >
            Schools, Clinic & Sports
          </button>
        </div>

        {/* Selected Tile Inspector Bar */}
        {selectedTileData && (
          <div className="flex items-center gap-2 bg-stone-950/80 px-3 py-1 rounded-lg border border-stone-800 text-xs">
            <span className="font-semibold text-amber-300">
              {selectedTileData.name || selectedTileData.type.toUpperCase()}
            </span>
            <span className="text-[10px] text-stone-500 font-mono">
              ({selectedTileData.x}, {selectedTileData.y})
            </span>

            {/* Upgrade action for buildable buildings */}
            {BUILDINGS_CATALOG[selectedTileData.type] && (
              <button
                onClick={() => onUpgradeTile(selectedTileData.x, selectedTileData.y)}
                disabled={resources.money < BUILDINGS_CATALOG[selectedTileData.type].cost * 1.5 || selectedTileData.level >= 3}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded text-[11px] transition-colors"
                title="Upgrade building output"
              >
                {selectedTileData.level >= 3 ? 'Max Level 3' : `Upgrade Lv${selectedTileData.level + 1} (₹${Math.round(BUILDINGS_CATALOG[selectedTileData.type].cost * 1.5)})`}
              </button>
            )}

            {/* Demolish action */}
            {!selectedTileData.isLandmark && selectedTileData.type !== 'grass' && selectedTileData.type !== 'river' && (
              <button
                onClick={() => onDemolishTile(selectedTileData.x, selectedTileData.y)}
                className="px-2 py-0.5 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded text-[11px] transition-colors"
                title="Demolish building"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Building Cards Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {/* Inspect Tool */}
        <button
          onClick={() => {
            villageAudio.playBuild();
            onSelectTool(activeTool === 'inspect' ? null : 'inspect');
          }}
          className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
            activeTool === 'inspect'
              ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-md scale-105'
              : 'bg-stone-950/80 text-stone-300 border-stone-800 hover:border-stone-700'
          }`}
        >
          <span className="text-base">🔍</span>
          <span>Inspect</span>
        </button>

        {/* Building Buttons */}
        {filteredBuildings.map((type) => {
          const info = BUILDINGS_CATALOG[type];
          const canAfford = resources.money >= info.cost;
          const isSelected = activeTool === type;

          return (
            <button
              key={type}
              onClick={() => {
                if (!canAfford) return;
                villageAudio.playBuild();
                onSelectTool(isSelected ? null : type);
              }}
              disabled={!canAfford}
              className={`flex-shrink-0 flex flex-col p-2 rounded-xl border text-left min-w-[140px] max-w-[155px] transition-all relative ${
                isSelected
                  ? 'bg-amber-950/80 border-amber-400 shadow-lg scale-105 ring-1 ring-amber-400'
                  : canAfford
                  ? 'bg-stone-950/80 border-stone-800 hover:border-stone-700'
                  : 'bg-stone-950/40 border-stone-900 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{info.icon}</span>
                <span className={`text-xs font-bold font-mono ${canAfford ? 'text-amber-300' : 'text-stone-500'}`}>
                  ₹{info.cost}
                </span>
              </div>
              <div className="text-xs font-bold text-stone-100 truncate">
                {info.name.split(' ')[0]} {info.name.split(' ')[1] || ''}
              </div>
              <div className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                {info.foodGen > 0 && `+${info.foodGen} Food `}
                {info.waterGen > 0 && `+${info.waterGen} Water `}
                {info.moneyGen > 0 && `+₹${info.moneyGen} `}
                {info.healthGen > 0 && `+${info.healthGen} Health `}
                {info.educationGen > 0 && `+${info.educationGen} Edu `}
                {info.popCapacity > 0 && `+${info.popCapacity} Pop `}
              </div>
            </button>
          );
        })}
      </div>
    </footer>
  );
};

export default BottomBuildMenu;
