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
}

export const EventModal: React.FC<EventModalProps> = ({ event, onMakeChoice }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-stone-900 border-2 border-amber-600/60 rounded-3xl shadow-2xl p-6 text-stone-100 flex flex-col space-y-4 animate-fade-in">
        {/* Event Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-stone-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-600/50 flex items-center justify-center text-2xl shadow-inner">
            {event.imageIcon}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
              Panchayat Council Decision · {event.category.toUpperCase()}
            </div>
            <h2 className="text-lg md:text-xl font-bold font-serif-title text-amber-200">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Narrative Description */}
        <p className="text-xs md:text-sm text-stone-300 leading-relaxed font-serif italic bg-stone-950/50 p-3.5 rounded-xl border border-stone-800">
          "{event.description}"
        </p>

        {/* Choices with Trade-offs */}
        <div className="space-y-2.5 pt-1">
          <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">
            Choose Council Resolution:
          </div>

          {event.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => {
                villageAudio.playCoin();
                onMakeChoice(choice);
              }}
              className="w-full text-left p-3.5 rounded-xl bg-stone-950/80 hover:bg-stone-800/90 border border-stone-700/80 hover:border-amber-500/80 transition-all flex flex-col gap-1 group active:scale-[0.99]"
            >
              <div className="text-xs font-bold text-amber-200 group-hover:text-amber-300">
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
      </div>
    </div>
  );
};

export default EventModal;
