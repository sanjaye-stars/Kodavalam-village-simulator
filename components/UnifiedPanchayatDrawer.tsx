/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { TileType, TileData, VillageResources, Season, UserRole, ViewMode } from '../types';
import {
  BUILDINGS_CATALOG,
  MONTH_NAMES,
  WIN_POPULATION_TARGET,
  WIN_HAPPINESS_TARGET,
  MAX_YEARS,
  PRESIDENT_PASSWORD,
} from '../constants';
import { villageAudio } from '../services/audioService';

interface UnifiedPanchayatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resources: VillageResources;
  day: number;
  month: number;
  year: number;
  season: Season;
  simSpeed: number;
  onSetSpeed: (speed: number) => void;
  userRole: UserRole;
  onChangeRole: (newRole: UserRole) => void;
  activeBuildTool: TileType | 'demolish' | null;
  onSelectBuildTool: (tool: TileType | 'demolish' | null) => void;
  selectedTileData: TileData | null;
  onUpgradeTile: (x: number, y: number) => void;
  onDemolishTile: (x: number, y: number) => void;
  stats: {
    festivalsHeld: number;
    busesWelcomed: number;
    milkHarvested: number;
    volleyballMatches: number;
  };
  isAudioMuted?: boolean;
  onToggleAudio?: () => void;
  viewMode?: ViewMode;
  onToggleViewMode?: () => void;
  onSaveGame: () => void;
  onRestartGame: () => void;
  onReturnToRoleSelect?: () => void;
}

type MenuTab = 'ledger' | 'construction' | 'goals' | 'settings';

export const UnifiedPanchayatDrawer: React.FC<UnifiedPanchayatDrawerProps> = ({
  isOpen,
  onClose,
  resources,
  day,
  month,
  year,
  season,
  simSpeed,
  onSetSpeed,
  userRole,
  onChangeRole,
  activeBuildTool,
  onSelectBuildTool,
  selectedTileData,
  onUpgradeTile,
  onDemolishTile,
  stats,
  isAudioMuted,
  onToggleAudio,
  viewMode = 'sky',
  onToggleViewMode,
  onSaveGame,
  onRestartGame,
  onReturnToRoleSelect,
}) => {
  const [activeTab, setActiveTab] = useState<MenuTab>(userRole === 'president' ? 'construction' : 'ledger');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [showAuthPassword, setShowAuthPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePresidentLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (authPassword.trim() === PRESIDENT_PASSWORD) {
      villageAudio.playCoin();
      onChangeRole('president');
      setAuthPassword('');
      setAuthError(null);
      setActiveTab('construction');
    } else {
      setAuthError(`Incorrect password! (Tip: default is ${PRESIDENT_PASSWORD})`);
    }
  };

  const handleQuickAuthorize = () => {
    villageAudio.playCoin();
    onChangeRole('president');
    setAuthPassword('');
    setAuthError(null);
    setActiveTab('construction');
  };

  const buildingKeys = Object.keys(BUILDINGS_CATALOG) as TileType[];
  const popProgress = Math.min(100, Math.round((resources.population / WIN_POPULATION_TARGET) * 100));
  const happyProgress = Math.min(100, Math.round((resources.happiness / WIN_HAPPINESS_TARGET) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md select-none overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[96dvh] sm:max-h-[92vh] bg-stone-900 border-2 border-amber-600/70 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col text-stone-100 overflow-hidden animate-fade-in my-auto">
        {/* Modal Top Header with Prominent Back button */}
        <div className="px-3 py-2.5 sm:px-6 sm:py-3.5 border-b border-stone-800 flex items-center justify-between bg-stone-950/90 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border border-stone-700 active:scale-95 transition-all touch-manipulation cursor-pointer shadow-sm"
              title="Return to 3D Village Simulation"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <span className="text-xl sm:text-2xl">
              {userRole === 'president' ? '🏛️' : '🌴'}
            </span>
            <div>
              <h2 className="text-sm sm:text-lg font-bold font-serif-title text-amber-300 leading-tight">
                Panchayat Council
              </h2>
              <p className="text-[10px] text-stone-400 font-mono">
                {userRole === 'president' ? '👑 President' : '🚶 Citizen'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onToggleAudio && (
              <button
                onClick={onToggleAudio}
                className="p-1 px-2 bg-stone-900 border border-stone-700 rounded-xl text-stone-300 hover:text-white text-xs font-mono flex items-center gap-1 transition-colors touch-manipulation"
                title={isAudioMuted ? 'Unmute Sound' : 'Mute Sound'}
              >
                <span>{isAudioMuted ? '🔇' : '🔊'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs font-mono font-bold border border-stone-700 active:scale-95 transition-all touch-manipulation"
              title="Close Menu and Return to Village"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-900/60 px-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'ledger', label: 'Village Ledger' },
            { id: 'construction', label: `Construction ${userRole === 'president' ? '🔨' : '🔒'}` },
            { id: 'goals', label: '5-Year Goals' },
            { id: 'settings', label: 'Role & Options' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MenuTab)}
              className={`py-3 px-4 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-900/40">
          {/* TAB 1: VILLAGE LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-6">
              {/* Calendar & Time Control */}
              <div className="p-4 bg-stone-950/70 border border-stone-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase text-amber-400">
                    Panchayat Calendar · Kasaragod
                  </div>
                  <div className="text-base font-bold font-serif-title text-stone-100">
                    Day {day} · {MONTH_NAMES[month - 1]} Yr {year}
                  </div>
                  <div className="text-xs text-emerald-400 font-sans mt-0.5">
                    {season === 'Southwest Monsoon' ? '🌧️ Southwest Monsoon (Edavappathi)' : season === 'Summer' ? '☀️ Summer (Medam Sun)' : season === 'Post-Monsoon' ? '🌸 Harvest Season (Onam)' : '❄️ Winter'}
                  </div>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs">
                  <span className="text-[10px] font-mono text-stone-500 px-1">Speed:</span>
                  {[
                    { s: 0, label: '⏸' },
                    { s: 1, label: '1x' },
                    { s: 2, label: '2x' },
                    { s: 3, label: '3x' },
                  ].map(({ s, label }) => (
                    <button
                      key={s}
                      onClick={() => onSetSpeed(s)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        simSpeed === s ? 'bg-amber-600 text-white font-bold' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800">
                  <div className="text-xs text-stone-400 mb-1">Treasury</div>
                  <div className="text-lg font-bold font-mono text-amber-400">
                    ₹{resources.money.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-stone-500">Market & taxes</div>
                </div>

                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800">
                  <div className="text-xs text-stone-400 mb-1">Grain Food</div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {Math.round(resources.food)}
                  </div>
                  <div className="text-[10px] text-stone-500">Pokkali harvest</div>
                </div>

                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800">
                  <div className="text-xs text-stone-400 mb-1">Sweet Water</div>
                  <div className="text-lg font-bold font-mono text-sky-400">
                    {Math.round(resources.water)}
                  </div>
                  <div className="text-[10px] text-stone-500">Wells & river</div>
                </div>

                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800">
                  <div className="text-xs text-stone-400 mb-1">Happiness</div>
                  <div className="text-lg font-bold font-mono text-yellow-300">
                    {Math.round(resources.happiness)}%
                  </div>
                  <div className="text-[10px] text-stone-500">Chayakkada & sports</div>
                </div>

                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800">
                  <div className="text-xs text-stone-400 mb-1">Public Health</div>
                  <div className="text-lg font-bold font-mono text-rose-400">
                    {Math.round(resources.health)}%
                  </div>
                  <div className="text-[10px] text-stone-500">Clinic dispensary</div>
                </div>

                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800">
                  <div className="text-xs text-stone-400 mb-1">Education</div>
                  <div className="text-lg font-bold font-mono text-indigo-400">
                    {Math.round(resources.education)}%
                  </div>
                  <div className="text-[10px] text-stone-500">School & library</div>
                </div>

                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 col-span-2">
                  <div className="text-xs text-stone-400 mb-1">Residents & Capacity</div>
                  <div className="text-lg font-bold font-mono text-stone-100">
                    {resources.population} <span className="text-xs text-stone-500 font-normal">/ {resources.maxPopulation} max capacity</span>
                  </div>
                  <div className="text-[10px] text-stone-500">Build homes to attract more citizens</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONSTRUCTION & DEVELOPMENT (RESERVED FOR PRESIDENT) */}
          {activeTab === 'construction' && (
            <div className="space-y-4">
              {userRole === 'president' ? (
                <>
                  <div className="flex items-center justify-between text-xs text-stone-400 bg-amber-950/30 p-3 rounded-xl border border-amber-800/40">
                    <span>👑 Select a structure below, then tap any tile on the 3D map to construct!</span>
                    <button
                      onClick={() => {
                        onSelectBuildTool('demolish');
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded text-xs transition-colors"
                    >
                      Clear / Demolish Mode
                    </button>
                  </div>

                  {/* Building Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {buildingKeys.map((type) => {
                      const info = BUILDINGS_CATALOG[type];
                      const canAfford = resources.money >= info.cost;
                      const isSelected = activeBuildTool === type;

                      return (
                        <div
                          key={type}
                          className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            isSelected
                              ? 'bg-amber-950/70 border-amber-400 shadow-md ring-1 ring-amber-400'
                              : canAfford
                              ? 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                              : 'bg-stone-950/30 border-stone-900 opacity-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{info.icon}</span>
                              <div>
                                <h4 className="text-xs font-bold text-stone-100">
                                  {info.name}
                                </h4>
                                <span className="text-[10px] text-stone-500 uppercase font-mono">
                                  {info.category}
                                </span>
                              </div>
                            </div>
                            <span className={`text-xs font-bold font-mono ${canAfford ? 'text-amber-300' : 'text-rose-400'}`}>
                              ₹{info.cost}
                            </span>
                          </div>

                          <p className="text-[11px] text-stone-300 leading-relaxed mb-2">
                            {info.description}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                            <div className="text-[10px] text-emerald-400 font-mono">
                              {info.foodGen > 0 && `+${info.foodGen} Food `}
                              {info.waterGen > 0 && `+${info.waterGen} Water `}
                              {info.moneyGen > 0 && `+₹${info.moneyGen} `}
                              {info.popCapacity > 0 && `+${info.popCapacity} Pop `}
                              {info.healthGen > 0 && `+${info.healthGen} Health `}
                              {info.educationGen > 0 && `+${info.educationGen} Edu `}
                            </div>
                            <button
                              onClick={() => {
                                onSelectBuildTool(type);
                                onClose();
                              }}
                              disabled={!canAfford}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold text-xs rounded-lg uppercase tracking-wider transition-colors"
                            >
                              Place on Map
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* Pauran (Citizen) Restricted View */
                <div className="p-4 sm:p-6 text-center space-y-3.5 bg-stone-950/70 rounded-2xl border border-stone-800">
                  <div className="text-3xl sm:text-4xl">🔒🏛️</div>
                  <h3 className="text-sm sm:text-base font-bold font-serif-title text-amber-300">
                    Panchayat President Authorization Required
                  </h3>
                  <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
                    Only the Panchayath President holds executive authorization to build, upgrade, or alter the village layout.
                  </p>

                  <form onSubmit={handlePresidentLogin} className="max-w-xs mx-auto space-y-2.5 pt-1 select-text">
                    <div className="relative flex items-center">
                      <input
                        type={showAuthPassword ? 'text' : 'password'}
                        value={authPassword}
                        onChange={(e) => {
                          setAuthPassword(e.target.value);
                          setAuthError(null);
                        }}
                        placeholder="Type president123..."
                        autoComplete="current-password"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        inputMode="text"
                        style={{ fontSize: '16px' }}
                        className="w-full bg-stone-900 border border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2 text-stone-100 font-mono tracking-wide focus:outline-none select-text touch-manipulation pr-16"
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        {authPassword && (
                          <button
                            type="button"
                            onClick={() => {
                              setAuthPassword('');
                              setAuthError(null);
                            }}
                            className="p-1 text-xs text-stone-400 hover:text-white touch-manipulation"
                            title="Clear"
                          >
                            ✕
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowAuthPassword((prev) => !prev)}
                          className="p-1 text-xs text-stone-400 hover:text-stone-200 touch-manipulation"
                          title={showAuthPassword ? 'Hide password' : 'Show password'}
                        >
                          {showAuthPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    {/* Virtual Quick Keys for Mobile Preview */}
                    <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2 space-y-1.5 select-none">
                      <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
                        <span>Touch Keys:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthPassword(PRESIDENT_PASSWORD);
                            setAuthError(null);
                          }}
                          className="text-amber-300 hover:underline font-bold"
                        >
                          Auto-Fill
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {['p', 'r', 'e', 's', 'i', 'd', 'e', 'n', 't', '1', '2', '3'].map((char, idx) => (
                          <button
                            key={`${char}-${idx}`}
                            type="button"
                            onClick={() => {
                              villageAudio.playCoin();
                              setAuthPassword((prev) => prev + char);
                              setAuthError(null);
                            }}
                            className="w-7 h-7 bg-stone-800 hover:bg-stone-700 text-stone-100 font-mono font-bold text-xs rounded border border-stone-700 flex items-center justify-center active:scale-90 active:bg-amber-600 active:text-stone-950 transition-all touch-manipulation"
                          >
                            {char}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            villageAudio.playCoin();
                            setAuthPassword((prev) => prev.slice(0, -1));
                            setAuthError(null);
                          }}
                          className="px-2 h-7 bg-stone-800 hover:bg-stone-700 text-rose-300 font-mono text-xs rounded border border-stone-700 flex items-center justify-center active:scale-90 touch-manipulation"
                          title="Backspace"
                        >
                          ⌫
                        </button>
                      </div>
                    </div>

                    {authError && <div className="text-xs text-rose-400 font-mono bg-rose-950/40 p-1.5 rounded">{authError}</div>}

                    {/* 1-Tap shortcut for mobile preview */}
                    <button
                      type="button"
                      onClick={handleQuickAuthorize}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-md border border-amber-300/40 flex items-center justify-center gap-1 active:scale-95 touch-manipulation cursor-pointer"
                      title="1-Tap Instant President Authorization"
                    >
                      <span>⚡</span>
                      <span>1-Tap Authorize as President</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('ledger')}
                        className="py-2 px-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-stone-700 flex items-center justify-center gap-1 active:scale-95 touch-manipulation cursor-pointer"
                      >
                        <span>←</span>
                        <span>Back to Ledger</span>
                      </button>
                      <button
                        type="submit"
                        className="py-2 px-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow touch-manipulation cursor-pointer"
                      >
                        Verify Key →
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 5-YEAR GOALS */}
          {activeTab === 'goals' && (
            <div className="space-y-4">
              <div className="space-y-3 p-4 bg-stone-950/60 rounded-2xl border border-stone-800">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-200">Target Population ({WIN_POPULATION_TARGET})</span>
                    <span className="font-mono text-amber-300">{resources.population} / {WIN_POPULATION_TARGET}</span>
                  </div>
                  <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full transition-all" style={{ width: `${popProgress}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-200">Target Happiness ({WIN_HAPPINESS_TARGET}%)</span>
                    <span className="font-mono text-amber-300">{Math.round(resources.happiness)}% / {WIN_HAPPINESS_TARGET}%</span>
                  </div>
                  <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all" style={{ width: `${happyProgress}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-200">Term Limit ({MAX_YEARS} Years)</span>
                    <span className="font-mono text-amber-300">Year {year} of {MAX_YEARS}</span>
                  </div>
                  <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full transition-all" style={{ width: `${(year / MAX_YEARS) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 text-center">
                  <div className="text-xl mb-1">🚌</div>
                  <div className="font-bold text-stone-100">{stats.busesWelcomed}</div>
                  <div className="text-[10px] text-stone-500 font-mono">Sreelakam Trips</div>
                </div>
                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 text-center">
                  <div className="text-xl mb-1">🌸</div>
                  <div className="font-bold text-stone-100">{stats.festivalsHeld}</div>
                  <div className="text-[10px] text-stone-500 font-mono">Festivals Held</div>
                </div>
                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 text-center">
                  <div className="text-xl mb-1">🥛</div>
                  <div className="font-bold text-stone-100">{stats.milkHarvested} L</div>
                  <div className="text-[10px] text-stone-500 font-mono">Cow Milk Grazed</div>
                </div>
                <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800 text-center">
                  <div className="text-xl mb-1">🏐</div>
                  <div className="font-bold text-stone-100">{stats.volleyballMatches}</div>
                  <div className="text-[10px] text-stone-500 font-mono">Volleyball Matches</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & ROLE SWITCH */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-950/60 rounded-2xl border border-stone-800 space-y-3">
                <h4 className="text-xs font-bold text-stone-200 uppercase font-mono tracking-wider">
                  Active Village Role
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-amber-200">
                      {userRole === 'president' ? '👑 Panchayath President' : '🚶 Pauran (Citizen)'}
                    </div>
                    <div className="text-xs text-stone-400">
                      {userRole === 'president' ? 'Has full authority to modify village' : 'Exploring without modification powers'}
                    </div>
                  </div>

                  {userRole === 'president' ? (
                    <button
                      onClick={() => onChangeRole('pauran')}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-lg transition-colors border border-stone-700"
                    >
                      Switch to Pauran
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('construction')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-colors"
                    >
                      Log in as President
                    </button>
                  )}
                </div>
              </div>

              {/* Camera Perspective Mode */}
              <div className="p-4 bg-stone-950/60 rounded-2xl border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-200">Camera View Perspective</div>
                  <div className="text-xs text-stone-400">
                    {viewMode === 'sky'
                      ? '☁️ Sky View (Overhead bird\'s-eye view)'
                      : '👁️ POV View (Ground-level street exploration)'}
                  </div>
                </div>
                {onToggleViewMode && (
                  <button
                    onClick={onToggleViewMode}
                    className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5"
                  >
                    <span>{viewMode === 'sky' ? '👁️' : '☁️'}</span>
                    <span>{viewMode === 'sky' ? 'Switch to POV' : 'Switch to Sky'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 bg-stone-950/60 rounded-2xl border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-200">Save Panchayat Progress</div>
                  <div className="text-xs text-stone-400">Store current village state in browser storage</div>
                </div>
                <button
                  onClick={() => {
                    onSaveGame();
                    onClose();
                  }}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs rounded-lg border border-stone-700 transition-colors"
                >
                  💾 Save Now
                </button>
              </div>

              {/* Return to Role Selection Screen */}
              {onReturnToRoleSelect && (
                <div className="p-4 bg-stone-950/60 rounded-2xl border border-amber-600/40 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-amber-200">Main Title & Role Selection</div>
                    <div className="text-xs text-stone-400">Return to initial role selection modal</div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onReturnToRoleSelect();
                    }}
                    className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition-colors flex items-center gap-1 active:scale-95 touch-manipulation"
                  >
                    <span>←</span>
                    <span>Role Selection</span>
                  </button>
                </div>
              )}

              <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-rose-300">Start Fresh 5-Year Term</div>
                  <div className="text-xs text-stone-400">Resets village state back to year 1</div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Reset all village progress and begin anew?')) {
                      onRestartGame();
                      onClose();
                    }
                  }}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  Reset Village
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Prominent Back to Village button */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-stone-800 bg-stone-950/95 flex items-center justify-between text-xs text-stone-400 shrink-0">
          <span className="hidden sm:inline font-mono text-[11px]">Kodavalam, Kasaragod · Heritage Simulation</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 touch-manipulation"
          >
            <span>←</span>
            <span>Back to Village View</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedPanchayatDrawer;
