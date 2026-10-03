/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef } from 'react';
import { UserRole } from '../types';
import { PRESIDENT_PASSWORD } from '../constants';
import { villageAudio } from '../services/audioService';

interface RoleSelectionModalProps {
  onSelectRole: (role: UserRole) => void;
  onBackToGame?: () => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  onSelectRole,
  onBackToGame,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showVirtualPad, setShowVirtualPad] = useState<boolean>(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePresidentSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password.trim() === PRESIDENT_PASSWORD) {
      villageAudio.playCoin();
      onSelectRole('president');
    } else {
      setErrorMessage(`Incorrect password! Tap 'Auto-Fill' or '1-Tap Enter' below. (Code: ${PRESIDENT_PASSWORD})`);
    }
  };

  const handleQuickLoginPresident = () => {
    setPassword(PRESIDENT_PASSWORD);
    villageAudio.playCoin();
    onSelectRole('president');
  };

  const handleSelectPauran = () => {
    villageAudio.playCoin();
    onSelectRole('pauran');
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setPassword('');
    setErrorMessage(null);
  };

  // Virtual Keypad click handler for mobile typing
  const handleVirtualKeyPress = (char: string) => {
    villageAudio.playCoin();
    setPassword((prev) => prev + char);
    setErrorMessage(null);
  };

  const handleVirtualBackspace = () => {
    villageAudio.playCoin();
    setPassword((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const KEYPAD_LETTERS = ['p', 'r', 'e', 's', 'i', 'd', 'e', 'n', 't'];
  const KEYPAD_NUMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[96dvh] sm:max-h-[92vh] bg-stone-900 border-2 border-amber-600/70 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 text-stone-100 flex flex-col space-y-3.5 sm:space-y-5 animate-fade-in overflow-y-auto my-auto">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Back Navigation */}
        <div className="relative z-10">
          <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
            {/* If in president password view -> Back to Roles. If on main view and game is active -> Back to Game */}
            {selectedRole === 'president' ? (
              <button
                type="button"
                onClick={handleBackToRoles}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border border-stone-700 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm"
                title="Return to role selection options"
              >
                <span>←</span>
                <span>Back to Roles</span>
              </button>
            ) : onBackToGame ? (
              <button
                type="button"
                onClick={onBackToGame}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border border-stone-700 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-sm"
                title="Return to your village in progress"
              >
                <span>←</span>
                <span>Back to Game</span>
              </button>
            ) : (
              <div className="w-16" />
            )}

            <div className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-amber-400 font-semibold text-center">
              Kodavalam Grama Panchayat
            </div>

            <div className="w-16 text-right">
              {onBackToGame && !selectedRole && (
                <button
                  type="button"
                  onClick={onBackToGame}
                  className="text-stone-400 hover:text-white p-1 text-sm font-bold active:scale-90 transition-transform"
                  title="Close and return to game"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="text-center pt-2 space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-serif-title text-amber-200">
              {selectedRole === 'president' ? 'President Authorization' : 'Welcome to Kodavalam'}
            </h1>
            <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
              {selectedRole === 'president'
                ? 'Panchayat President executive privileges are password protected. Use the on-screen keypad or 1-tap instant enter below.'
                : 'Choose your role to enter the 3D village. Lead the council or walk the paths as a resident.'}
            </p>
          </div>
        </div>

        {/* 2 Options Cards (Shown on main role choice view) */}
        {!selectedRole && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10">
            {/* Option 1: Panchayath President */}
            <div
              onClick={() => {
                setSelectedRole('president');
                setErrorMessage(null);
              }}
              className="p-3.5 sm:p-4 rounded-2xl border-2 border-stone-800 bg-stone-950/70 hover:border-amber-500/60 transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] active:scale-98 touch-manipulation group"
            >
              <div>
                <div className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">🏛️👑</div>
                <h3 className="text-base font-bold text-amber-200 font-serif-title">
                  Panchayath President
                </h3>
                <div className="text-[11px] text-amber-400 font-mono mb-1.5">
                  ഗ്രാമപഞ്ചായത്ത് പ്രസിഡന്റ്
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  <span className="font-semibold text-amber-300">🦅 Sky View:</span> High aerial overview to survey and lead development. Full authority to construct and upgrade.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-800/80 text-[11px] font-semibold text-amber-400 flex items-center justify-between">
                <span>Password Protected</span>
                <span>🔒 Enter →</span>
              </div>
            </div>

            {/* Option 2: Pauran (Citizen / Resident) */}
            <div
              onClick={handleSelectPauran}
              className="p-3.5 sm:p-4 rounded-2xl border-2 border-stone-800 bg-stone-950/70 hover:border-emerald-500/60 transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] active:scale-98 touch-manipulation group"
            >
              <div>
                <div className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">🌴🚶‍♂️</div>
                <h3 className="text-base font-bold text-emerald-200 font-serif-title">
                  Pauran (Citizen)
                </h3>
                <div className="text-[11px] text-emerald-400 font-mono mb-1.5">
                  ഗ്രാമപൗരൻ (Resident)
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  <span className="font-semibold text-emerald-300">🚶 POV View:</span> Ground-level street exploration. Choose from 6 unique avatars including King Vishnu!
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-800/80 text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
                <span>Direct Entry (No Password)</span>
                <span>Choose Avatar →</span>
              </div>
            </div>
          </div>
        )}

        {/* Password Prompt if President selected (Mobile Preview & Touch Optimized) */}
        {selectedRole === 'president' && (
          <div className="p-3.5 sm:p-4 bg-stone-950/90 rounded-2xl border border-amber-500/40 relative z-10 animate-fade-in space-y-3.5 select-text">
            {/* Top Prompt Banner with 1-Tap Enter */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👑</span>
                <div>
                  <h3 className="font-bold text-amber-200 text-xs sm:text-sm font-serif-title">
                    President Security Check
                  </h3>
                  <div className="text-[10px] text-stone-400 font-mono">
                    Required: <span className="text-amber-300 font-bold">president123</span>
                  </div>
                </div>
              </div>

              {/* 1-Tap Instant Mobile Shortcut */}
              <button
                type="button"
                onClick={handleQuickLoginPresident}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1 active:scale-95 touch-manipulation cursor-pointer border border-amber-300/40"
                title="1-Tap Instant Login without typing"
              >
                <span>⚡</span>
                <span>1-Tap Enter</span>
              </button>
            </div>

            <form onSubmit={handlePresidentSubmit} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-amber-300">
                    Enter Password:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowVirtualPad((prev) => !prev)}
                    className="text-[10px] text-amber-400/90 hover:text-amber-300 font-mono underline cursor-pointer"
                  >
                    {showVirtualPad ? 'Hide Mobile Keypad' : 'Show Mobile Keypad 📱'}
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Type president123..."
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="text"
                    style={{ fontSize: '16px' }}
                    className="w-full bg-stone-900 border-2 border-stone-700 focus:border-amber-400 rounded-xl px-3 py-2.5 text-stone-100 font-mono tracking-wide focus:outline-none select-text touch-manipulation cursor-text pr-24"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    {password && (
                      <button
                        type="button"
                        onClick={() => {
                          setPassword('');
                          setErrorMessage(null);
                        }}
                        className="p-1 px-1.5 text-xs text-stone-400 hover:text-white bg-stone-800 rounded border border-stone-700 touch-manipulation"
                        title="Clear input"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="p-1 px-2 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700 select-none touch-manipulation"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>

              {/* On-Screen Touch Keypad for foolproof mobile typing in iframes */}
              {showVirtualPad && (
                <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5 space-y-2 select-none">
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
                    <span>📱 Mobile Touch Keypad:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPassword(PRESIDENT_PASSWORD);
                        setErrorMessage(null);
                      }}
                      className="text-amber-300 hover:underline font-bold"
                    >
                      ⚡ Auto-Fill Password
                    </button>
                  </div>

                  {/* Letter Keys */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {KEYPAD_LETTERS.map((char, idx) => (
                      <button
                        key={`${char}-${idx}`}
                        type="button"
                        onClick={() => handleVirtualKeyPress(char)}
                        className="w-8 h-8 sm:w-9 sm:h-9 bg-stone-800 hover:bg-stone-700 text-stone-100 font-mono font-bold text-xs sm:text-sm rounded-lg border border-stone-700 flex items-center justify-center active:scale-90 active:bg-amber-600 active:text-stone-950 transition-all touch-manipulation"
                      >
                        {char}
                      </button>
                    ))}
                  </div>

                  {/* Number Keys & Controls */}
                  <div className="flex flex-wrap gap-1 justify-center items-center">
                    {KEYPAD_NUMS.map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleVirtualKeyPress(num)}
                        className="w-7 h-8 sm:w-8 sm:h-9 bg-stone-800 hover:bg-stone-700 text-amber-200 font-mono font-bold text-xs sm:text-sm rounded-lg border border-stone-700 flex items-center justify-center active:scale-90 active:bg-amber-600 active:text-stone-950 transition-all touch-manipulation"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleVirtualBackspace}
                      className="px-2 h-8 sm:h-9 bg-stone-800 hover:bg-stone-700 text-rose-300 font-mono text-xs rounded-lg border border-stone-700 flex items-center justify-center active:scale-90 transition-all touch-manipulation"
                      title="Backspace"
                    >
                      ⌫
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Fill helper chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-stone-400 font-mono">Quick Actions:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(PRESIDENT_PASSWORD);
                    setErrorMessage(null);
                  }}
                  className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-mono font-bold rounded-lg border border-amber-500/40 active:scale-95 touch-manipulation"
                >
                  Fill "president123"
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPassword('');
                    setErrorMessage(null);
                  }}
                  className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs font-mono rounded-lg border border-stone-700 active:scale-95 touch-manipulation"
                >
                  Clear ⌫
                </button>
              </div>

              {errorMessage && (
                <div className="text-xs text-rose-300 font-mono bg-rose-950/60 p-2 rounded-lg border border-rose-800 animate-fade-in">
                  {errorMessage}
                </div>
              )}

              {/* Action Buttons: Back & Verify */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleBackToRoles}
                  className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-stone-700 flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer shadow"
                >
                  <span>←</span>
                  <span>Back to Roles</span>
                </button>

                <button
                  type="submit"
                  className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-1 touch-manipulation cursor-pointer"
                >
                  <span>Verify & Enter →</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelectionModal;
