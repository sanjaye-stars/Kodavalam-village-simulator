/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { PauranCharacter } from '../types';
import { PAURAN_CHARACTERS } from '../constants';
import { villageAudio } from '../services/audioService';

interface CharacterSelectModalProps {
  onSelectCharacter: (character: PauranCharacter) => void;
  onBack?: () => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  onSelectCharacter,
  onBack,
}) => {
  const [selectedId, setSelectedId] = useState<string>(PAURAN_CHARACTERS[0].id);

  const selectedChar =
    PAURAN_CHARACTERS.find((c) => c.id === selectedId) || PAURAN_CHARACTERS[0];

  const handleConfirm = (charToConfirm = selectedChar) => {
    villageAudio.playCoin();
    onSelectCharacter(charToConfirm);
  };

  const handleCardClick = (char: PauranCharacter) => {
    villageAudio.playCoin();
    if (selectedId === char.id) {
      // Tap again on already selected card -> immediately enter village!
      handleConfirm(char);
    } else {
      setSelectedId(char.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[96dvh] sm:max-h-[92vh] bg-stone-900 border-2 border-emerald-500/80 rounded-2xl sm:rounded-3xl shadow-2xl text-stone-100 flex flex-col overflow-hidden animate-fade-in my-auto">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header with prominent Back button */}
        <div className="shrink-0 px-3 py-2.5 sm:px-6 sm:py-3.5 border-b border-stone-800/90 bg-stone-950/80 flex items-center justify-between relative z-10">
          {onBack ? (
            <button
              onClick={onBack}
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-mono font-bold flex items-center gap-1 active:scale-95 transition-all touch-manipulation cursor-pointer"
              title="Go back to previous screen"
            >
              <span>←</span>
              <span>Back</span>
            </button>
          ) : (
            <div className="w-12" />
          )}

          <div className="text-center px-1">
            <div className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-semibold">
              Citizen Avatar Selection · ഗ്രാമപൗരൻ
            </div>
            <h2 className="text-base sm:text-xl md:text-2xl font-black font-serif-title text-emerald-200 leading-tight">
              Choose Your Character
            </h2>
          </div>

          <div className="w-12 text-right">
            {onBack && (
              <button
                onClick={onBack}
                className="text-stone-400 hover:text-white p-1 text-sm font-bold active:scale-90 transition-transform"
                title="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 2. Scrollable Body: Character Cards & Lore */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-3 relative z-10 pr-2">
          {/* Character Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-2.5">
            {PAURAN_CHARACTERS.map((char) => {
              const isSelected = char.id === selectedId;
              const isKing = char.id === 'king_vishnu';

              return (
                <div
                  key={char.id}
                  onClick={() => handleCardClick(char)}
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center justify-between group relative overflow-hidden active:scale-95 touch-manipulation ${
                    isKing
                      ? isSelected
                        ? 'bg-amber-950/70 border-amber-400 ring-2 ring-amber-400/50 shadow-xl'
                        : 'bg-stone-950/70 border-amber-600/40 hover:border-amber-400'
                      : isSelected
                      ? 'bg-emerald-950/80 border-emerald-400 shadow-xl scale-[1.02] ring-2 ring-emerald-400/50'
                      : 'bg-stone-950/70 border-stone-800 hover:border-emerald-600/60'
                  }`}
                >
                  {/* Selected checkmark badge */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-400 text-stone-950 font-bold text-[9px] flex items-center justify-center shadow">
                      ✓
                    </div>
                  )}

                  <div className="flex flex-col items-center w-full">
                    {/* Avatar Icon */}
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner mb-1.5 transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${char.outfitColor}25`,
                        border: `2px solid ${char.outfitColor}`,
                      }}
                    >
                      <span>{char.avatarIcon}</span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-stone-100 font-serif-title leading-tight line-clamp-1">
                      {char.name}
                    </h3>
                    <div className="text-[9px] text-emerald-400 font-mono mb-0.5">
                      {char.malayalamName}
                    </div>
                    <div className="text-[9px] text-amber-300/90 font-medium mb-1 line-clamp-1">
                      {char.roleTitle}
                    </div>
                  </div>

                  <div className="w-full pt-1 border-t border-stone-800/80 flex items-center justify-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: char.outfitColor }}
                      title="Outfit Theme"
                    />
                    <span
                      className="w-2 h-2 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: char.munduColor }}
                      title="Mundu/Dhoti"
                    />
                    <span
                      className="w-2 h-2 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: char.accessoryColor }}
                      title="Accessory"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Character Preview & Lore Summary */}
          <div className="p-3 bg-stone-950/90 rounded-xl border border-stone-800 flex items-start gap-3 text-xs">
            <span className="text-3xl shrink-0 mt-0.5">{selectedChar.avatarIcon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-emerald-300 text-xs sm:text-sm flex flex-wrap items-center gap-1.5">
                <span>{selectedChar.name}</span>
                <span className="text-stone-400 font-normal">({selectedChar.malayalamName})</span>
                <span className="text-amber-400">· {selectedChar.roleTitle}</span>
              </div>
              <p className="text-stone-300 text-[11px] leading-relaxed mt-0.5 line-clamp-2 sm:line-clamp-3">
                {selectedChar.description}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Sticky Bottom Confirmation Bar with Back and Enter buttons */}
        <div className="shrink-0 p-3 sm:p-4 bg-stone-950 border-t border-emerald-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 relative z-20">
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedChar.avatarIcon}</span>
              <div className="text-left font-mono">
                <span className="text-stone-400 text-[10px]">SELECTED: </span>
                <span className="text-emerald-300 font-bold text-xs">{selectedChar.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="min-h-[44px] px-4 py-2 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-300 hover:text-white font-mono font-bold text-xs rounded-xl transition-all border border-stone-700 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation shadow-sm shrink-0"
                title="Go back to previous screen"
              >
                <span>←</span>
                <span>Back</span>
              </button>
            )}
            <button
              onClick={() => handleConfirm(selectedChar)}
              className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-[46px] px-5 sm:px-6 py-2.5 bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 hover:from-amber-300 hover:to-emerald-300 active:scale-98 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              title="Enter 3D village simulation"
            >
              <span>{selectedChar.id === 'king_vishnu' ? '👑' : '✨'}</span>
              <span>
                {selectedChar.id === 'king_vishnu'
                  ? 'Ascend Throne as King Vishnu →'
                  : `Enter Village as ${selectedChar.name} →`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelectModal;
