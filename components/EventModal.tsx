/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { VillageEvent, DecisionChoice } from '../types';
import { villageAudio } from '../services/audioService';

interface EventModalProps {
  event: VillageEvent;
  onMakeChoice: (choice: DecisionChoice) => void;
  onBack?: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onMakeChoice, onBack }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[96dvh] sm:max-h-[92vh] bg-stone-900 border-2 border-amber-600/70 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 text-stone-100 flex flex-col space-y-3.5 sm:space-y-4 animate-fade-in overflow-y-auto my-auto">
        {/* Event Header with Back button */}
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                onClick={onBack}
                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border border-stone-700 active:scale-95 transition-all touch-manipulation cursor-pointer"
                title="Return to village without deciding yet"
              >
                <span>←</span>
                <span>Back</span>
              </button>
            )}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-950/60 border border-amber-600/50 flex items-center justify-center text-xl sm:text-2xl shadow-inner shrink-0">
              {event.imageIcon}
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                Council Decision · {event.category.toUpperCase()}
              </div>
              <h2 className="text-base sm:text-xl font-bold font-serif-title text-amber-200 leading-tight">
                {event.title}
              </h2>
            </div>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="text-stone-400 hover:text-white p-1 text-sm font-bold active:scale-90"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>

        {/* Narrative Description */}
        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif italic bg-stone-950/60 p-3 sm:p-3.5 rounded-xl border border-stone-800">
          "{event.description}"
        </p>

        {/* Choices with Trade-offs */}
        <div className="space-y-2 pt-0.5">
          <div className="text-[10px] sm:text-[11px] font-mono text-stone-400 uppercase tracking-wider">
            Choose Council Resolution:
          </div>

          {event.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => {
                villageAudio.playCoin();
                onMakeChoice(choice);
              }}
              className="w-full text-left p-3 sm:p-3.5 rounded-xl bg-stone-950/85 hover:bg-stone-800/90 border border-stone-700/80 hover:border-amber-500/80 transition-all flex flex-col gap-1 group active:scale-[0.99] touch-manipulation cursor-pointer"
            >
              <div className="text-xs sm:text-sm font-bold text-amber-200 group-hover:text-amber-300">
                {choice.text}
              </div>
              <div className="text-[11px] text-stone-400">
                {choice.effectDescription}
              </div>

              {/* Resource Delta Preview */}
              <div className="flex flex-wrap gap-2 text-[10px] font-mono mt-1 pt-1 border-t border-stone-800">
                {choice.resourceDelta.money !== undefined && (
                  <span className={choice.resourceDelta.money >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {choice.resourceDelta.money >= 0 ? `+₹${choice.resourceDelta.money}` : `-₹${Math.abs(choice.resourceDelta.money)}`}
                  </span>
                )}
                {choice.resourceDelta.food !== undefined && (
                  <span className={choice.resourceDelta.food >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {choice.resourceDelta.food >= 0 ? `+${choice.resourceDelta.food} Food` : `${choice.resourceDelta.food} Food`}
                  </span>
                )}
                {choice.resourceDelta.water !== undefined && (
                  <span className={choice.resourceDelta.water >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {choice.resourceDelta.water >= 0 ? `+${choice.resourceDelta.water} Water` : `${choice.resourceDelta.water} Water`}
                  </span>
                )}
                {choice.resourceDelta.happiness !== undefined && (
                  <span className={choice.resourceDelta.happiness >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {choice.resourceDelta.happiness >= 0 ? `+${choice.resourceDelta.happiness}% Happiness` : `${choice.resourceDelta.happiness}% Happiness`}
                  </span>
                )}
                {choice.resourceDelta.health !== undefined && (
                  <span className={choice.resourceDelta.health >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {choice.resourceDelta.health >= 0 ? `+${choice.resourceDelta.health}% Health` : `${choice.resourceDelta.health}% Health`}
                  </span>
                )}
                {choice.resourceDelta.education !== undefined && (
                  <span className={choice.resourceDelta.education >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {choice.resourceDelta.education >= 0 ? `+${choice.resourceDelta.education}% Education` : `${choice.resourceDelta.education}% Education`}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Back / Postpone Button at bottom */}
        {onBack && (
          <div className="pt-1">
            <button
              onClick={onBack}
              className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-mono font-bold border border-stone-700 active:scale-98 transition-all flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <span>←</span>
              <span>Back / Review Village First</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventModal;
