/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { villageAudio } from '../services/audioService';

interface GameOutcomeModalProps {
  won: boolean;
  reason?: string;
  onRestart: () => void;
  onBack?: () => void;
}

export const GameOutcomeModal: React.FC<GameOutcomeModalProps> = ({ won, reason, onRestart, onBack }) => {
  useEffect(() => {
    if (won) {
      villageAudio.playFestiveChime();
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      } catch {
        // Ignore
      }
    }
  }, [won]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none overflow-y-auto">
      <div className={`relative w-full max-w-md p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl text-stone-100 flex flex-col items-center text-center space-y-4 border-2 my-auto ${
        won ? 'bg-stone-900 border-amber-500' : 'bg-stone-900 border-rose-600'
      }`}>
        <div className="text-4xl sm:text-5xl mb-1">
          {won ? '🏆🌸🌴' : '🥀🌧️'}
        </div>

        <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
          {won ? 'Panchayat Milestone Achieved!' : 'Panchayat Term Concluded'}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold font-serif-title text-stone-100">
          {won ? 'Kodavalam Has Flourished!' : 'Panchayat Council Fallen'}
        </h2>

        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xs font-serif italic bg-stone-950/70 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-800">
          "{reason || (won ? 'Your wise stewardship has turned Kodavalam into Kasaragod’s most prosperous and united village!' : 'The village struggled with shortages and council leadership was dissolved.')}"
        </p>

        <div className="w-full space-y-2 pt-1">
          <button
            onClick={onRestart}
            className={`w-full py-3 sm:py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 touch-manipulation cursor-pointer ${
              won
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {won ? 'Continue Guiding Kodavalam' : 'Begin a Fresh 5-Year Term'}
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-mono font-bold border border-stone-700 active:scale-95 transition-all touch-manipulation"
            >
              ← Back to Village View
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameOutcomeModal;
