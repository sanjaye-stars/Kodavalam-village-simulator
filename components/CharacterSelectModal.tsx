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
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  onSelectCharacter,
}) => {
  const [selectedId, setSelectedId] = useState<string>(PAURAN_CHARACTERS[0].id);

  const selectedChar =
    PAURAN_CHARACTERS.find((c) => c.id === selectedId) || PAURAN_CHARACTERS[0];

  const handleConfirm = () => {
    villageAudio.playCoin();
    onSelectCharacter(selectedChar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-3xl bg-stone-900 border-2 border-emerald-600/70 rounded-3xl shadow-2xl p-6 md:p-8 text-stone-100 flex flex-col space-y-5 animate-fade-in overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center space-y-1.5 relative z-10">
          <div className="text-[11px] font-mono tracking-widest uppercase text-emerald-400">
            Village Citizen Avatar Selection · ഗ്രാമപൗരൻ
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-serif-title text-emerald-200">
            Choose Your Pauran Character
          </h2>
          <p className="text-xs text-stone-300 max-w-md mx-auto">
            Select who you want to inhabit in the 3D village. Move through the streets with W, A, S, D or the on-screen buttons!
          </p>
        </div>

        {/* Character Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 relative z-10">
          {PAURAN_CHARACTERS.map((char) => {
            const isSelected = char.id === selectedId;
            const isComingSoon = !!char.isComingSoon;

            return (
              <div
                key={char.id}
                onClick={() => {
                  setSelectedId(char.id);
                  villageAudio.playCoin();
                }}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center justify-between group relative overflow-hidden ${
                  isComingSoon
                    ? isSelected
                      ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-500/40 shadow-xl'
                      : 'bg-stone-950/50 border-amber-700/50 opacity-80 hover:opacity-100 hover:border-amber-500/80'
                    : isSelected
                    ? 'bg-emerald-950/70 border-emerald-400 shadow-xl scale-[1.03] ring-2 ring-emerald-500/40'
                    : 'bg-stone-950/70 border-stone-800 hover:border-emerald-600/60 hover:scale-[1.02]'
                }`}
              >
                {/* Coming Soon Ribbon */}
                {isComingSoon && (
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[8px] font-mono uppercase tracking-wider font-bold">
                    Soon
                  </div>
                )}

                <div className="flex flex-col items-center w-full">
                  {/* Large Avatar Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner mb-2 transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${char.outfitColor}22`,
                      border: `2px solid ${char.outfitColor}`,
                    }}
                  >
                    <span>{char.avatarIcon}</span>
                  </div>

                  <h3 className="text-xs font-bold text-stone-100 font-serif-title leading-tight line-clamp-1">
                    {char.name}
                  </h3>
                  <div className="text-[9px] text-emerald-400 font-mono mb-0.5">
                    {char.malayalamName}
                  </div>
                  <div className="text-[9px] text-amber-300/90 font-medium mb-1 line-clamp-1">
                    {char.roleTitle}
                  </div>
                </div>

                <div className="w-full pt-1.5 border-t border-stone-800/80 flex items-center justify-center gap-1">
                  {/* Color dots showing outfit theme */}
                  <span
                    className="w-2 h-2 rounded-full border border-black/40 shadow-sm"
                    style={{ backgroundColor: char.outfitColor }}
                    title="Jubba/Shirt"
                  />
                  <span
                    className="w-2 h-2 rounded-full border border-black/40 shadow-sm"
                    style={{ backgroundColor: char.munduColor }}
                    title="Mundu/Dhoti"
                  />
                  <span
                    className="w-2 h-2 rounded-full border border-black/40 shadow-sm"
                    style={{ backgroundColor: char.accessoryColor }}
                    title="Scarf/Accessory"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Character Preview & Lore Summary */}
        <div className="p-3.5 bg-stone-950/80 rounded-2xl border border-stone-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedChar.avatarIcon}</span>
            <div>
              <div className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                <span>
                  {selectedChar.isComingSoon ? '🔒 Teaser: ' : 'Playing as: '}
                  {selectedChar.name} ({selectedChar.malayalamName}) · {selectedChar.roleTitle}
                </span>
                {selectedChar.isComingSoon && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded-full text-[10px] font-mono">
                    Coming Soon
                  </span>
                )}
              </div>
              <div className="text-stone-300 text-[11px] leading-relaxed max-w-xl">
                {selectedChar.description}
              </div>
            </div>
          </div>

          {selectedChar.isComingSoon ? (
            <button
              disabled
              className="w-full sm:w-auto px-5 py-2.5 bg-stone-800 border border-amber-500/40 text-amber-300/80 font-bold text-xs uppercase tracking-wider rounded-xl cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-1.5 shadow"
              title="King Vishnu is not on the mainland yet — Coming Soon!"
            >
              <span>🔒</span>
              <span>Not on Mainland Yet (Coming Soon)</span>
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 active:scale-95 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg whitespace-nowrap"
            >
              {selectedChar.id === 'king_vishnu'
                ? 'Ascend Throne as King Vishnu →'
                : `Enter Village as ${selectedChar.name} →`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterSelectModal;
