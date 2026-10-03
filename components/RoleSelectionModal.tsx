/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { UserRole } from '../types';
import { PRESIDENT_PASSWORD } from '../constants';
import { villageAudio } from '../services/audioService';

interface RoleSelectionModalProps {
  onSelectRole: (role: UserRole) => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ onSelectRole }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePresidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === PRESIDENT_PASSWORD) {
      villageAudio.playCoin();
      onSelectRole('president');
    } else {
      setErrorMessage("Incorrect password! Access denied.");
    }
  };

  const handleSelectPauran = () => {
    villageAudio.playCoin();
    onSelectRole('pauran');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-stone-900 border-2 border-amber-600/70 rounded-3xl shadow-2xl p-6 md:p-8 text-stone-100 flex flex-col space-y-6 animate-fade-in overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="text-[11px] font-mono tracking-widest uppercase text-amber-400">
            Kasaragod, Kerala · Kodavalam Grama Panchayat
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-serif-title text-amber-200">
            Welcome to Kodavalam
          </h1>
          <p className="text-xs md:text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
            Choose your role in the village before entering. You can lead the Panchayat council or experience village life as a resident citizen.
          </p>
        </div>

        {/* 2 Options Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          {/* Option 1: Panchayath President */}
          <div
            onClick={() => {
              setSelectedRole('president');
              setErrorMessage(null);
            }}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
              selectedRole === 'president'
                ? 'bg-amber-950/60 border-amber-400 shadow-xl scale-[1.02]'
                : 'bg-stone-950/70 border-stone-800 hover:border-amber-600/60'
            }`}
          >
            <div>
              <div className="text-3xl mb-2">🏛️👑</div>
              <h3 className="text-base font-bold text-amber-200 font-serif-title">
                Panchayath President
              </h3>
              <div className="text-[11px] text-amber-400 font-mono mb-2">
                ഗ്രാമപഞ്ചായത്ത് പ്രസിഡന്റ്
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                <span className="font-semibold text-amber-300">🦅 Sky View by default:</span> High aerial overview to survey both realms and lead development. Full governance authority to build, upgrade, and demolish.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800/80 text-[11px] font-semibold text-amber-400 flex items-center justify-between">
              <span>Security Protected</span>
              <span>🔒</span>
            </div>
          </div>

          {/* Option 2: Pauran (Citizen / Resident) */}
          <div
            onClick={handleSelectPauran}
            className="p-4 rounded-2xl border-2 border-stone-800 bg-stone-950/70 hover:border-emerald-500/60 transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.02]"
          >
            <div>
              <div className="text-3xl mb-2">🌴🚶‍♂️</div>
              <h3 className="text-base font-bold text-emerald-200 font-serif-title">
                Pauran (Citizen)
              </h3>
              <div className="text-[11px] text-emerald-400 font-mono mb-2">
                ഗ്രാമപൗരൻ (Resident)
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                <span className="font-semibold text-emerald-300">🚶 POV View by default:</span> Immersive ground-level street exploration (with separate Sky View option). Greet DAMU, visit Chayakkada, and cross into Vishnu's Kingdom.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800/80 text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
              <span>Instant Entry (POV View)</span>
              <span>→</span>
            </div>
          </div>
        </div>

        {/* Password Prompt if President selected */}
        {selectedRole === 'president' && (
          <form onSubmit={handlePresidentSubmit} className="space-y-3 pt-2 border-t border-stone-800 relative z-10 animate-fade-in">
            <div>
              <label className="block text-xs font-mono text-amber-300 mb-1.5">
                Enter President Security Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Enter password"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                autoFocus
              />
            </div>

            {errorMessage && (
              <div className="text-xs text-rose-400 font-mono">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg"
            >
              Verify & Enter as President
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RoleSelectionModal;
