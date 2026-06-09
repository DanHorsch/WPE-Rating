import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound, Timer, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PasswordGateProps {
  onSuccess: () => void;
}

export default function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [remainingTries, setRemainingTries] = useState(5);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [unlockCountdown, setUnlockCountdown] = useState('');
  const [isSubmitShake, setIsSubmitShake] = useState(false);

  const ONE_HOUR_MS = 3600000;
  const PASSWORD_TARGET = 'camp26';

  // Helper: Get valid failed attempts from localStorage
  const getValidAttempts = (): number[] => {
    try {
      const stored = localStorage.getItem('camp_failed_attempts');
      if (!stored) return [];
      const attempts: number[] = JSON.parse(stored);
      // Filter out attempts older than 1 hour
      const now = Date.now();
      return attempts.filter((t) => now - t < ONE_HOUR_MS);
    } catch (e) {
      return [];
    }
  };

  // Helper: Save failed attempts
  const saveAttempts = (attempts: number[]) => {
    try {
      localStorage.setItem('camp_failed_attempts', JSON.stringify(attempts));
    } catch (e) {
      console.error(e);
    }
  };

  // Check locking state and update ticks
  const checkLockState = () => {
    const valid = getValidAttempts();
    const triesCount = valid.length;
    
    if (triesCount >= 5) {
      setIsLockedOut(true);
      setRemainingTries(0);
      
      // Calculate how long until oldest attempt expires
      const oldest = Math.min(...valid);
      const now = Date.now();
      const timeLeft = oldest + ONE_HOUR_MS - now;
      
      if (timeLeft <= 0) {
        // Oldest attempt expired, refresh lock state
        setIsLockedOut(false);
        setRemainingTries(5 - getValidAttempts().length);
        setErrorMsg('');
      } else {
        const mins = Math.floor(timeLeft / 60000);
        const secs = Math.floor((timeLeft % 60000) / 1000);
        setUnlockCountdown(`${mins}m ${secs}s`);
      }
    } else {
      setIsLockedOut(false);
      setRemainingTries(5 - triesCount);
    }
  };

  // Run on mount and periodically update lock countdowns
  useEffect(() => {
    checkLockState();
    const interval = setInterval(() => {
      checkLockState();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Re-check lock first
    const valid = getValidAttempts();
    if (valid.length >= 5) {
      setIsLockedOut(true);
      setErrorMsg('This workstation is currently locked due to too many failed attempts.');
      return;
    }

    if (password === PASSWORD_TARGET) {
      // Clear attempts and trigger success
      localStorage.setItem('camp_failed_attempts', '[]');
      localStorage.setItem('camp_support_authorized', 'true');
      onSuccess();
    } else {
      // Record a new failed attempt
      const newAttempts = [...valid, Date.now()];
      saveAttempts(newAttempts);
      
      // Shake animation
      setIsSubmitShake(true);
      setTimeout(() => setIsSubmitShake(false), 500);

      const remaining = 5 - newAttempts.length;
      if (remaining <= 0) {
        setIsLockedOut(true);
        setRemainingTries(0);
        setErrorMsg('Too many wrong password attempts. Locked for 1 hour.');
      } else {
        setRemainingTries(remaining);
        setErrorMsg(`Incorrect password. Access Denied. You have ${remaining} ${remaining === 1 ? 'try' : 'tries'} remaining in this hour.`);
      }
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-camp-green/10 rounded-full blur-3xl pointer-events-none select-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none select-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-slate-950/70 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center">
          
          {/* Main lock icon container */}
          <div className={`p-4 rounded-full mb-5 border transition-all duration-300 ${
            isLockedOut 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse' 
              : 'bg-camp-green/10 border-camp-green/20 text-camp-green'
          }`}>
            {isLockedOut ? (
              <ShieldAlert className="w-8 h-8" />
            ) : (
              <Lock className="w-8 h-8" />
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-white mb-2">
            DevSecOps Gate
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6 font-medium">
            Authorization required to view the internal WP Engine Support Review Trackers database.
          </p>

          <AnimatePresence mode="wait">
            {isLockedOut ? (
              <motion.div
                key="locked"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full px-4 py-5 bg-rose-950/40 border border-rose-900/40 rounded-xl flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-1.5 text-rose-400 font-mono font-bold text-xs uppercase tracking-wider animate-pulse">
                  <Timer className="w-4 h-4" />
                  <span>Workstation Locked</span>
                </div>
                
                <p className="text-rose-200 text-xs font-semibold max-w-xs leading-normal">
                  Too many incorrect password attempts. To protect internal logs, this terminal is temporarily offline.
                </p>

                <div className="mt-2.5 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Unlock Window Opens In</span>
                  <span className="text-lg font-mono font-extrabold text-rose-400 mt-1">{unlockCountdown}</span>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="input-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="w-full space-y-4"
              >
                {/* Password field with optional shake */}
                <motion.div 
                  animate={isSubmitShake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <label className="sr-only" htmlFor="camp-pass-gate">Master Password</label>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="camp-pass-gate"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter Master Password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-9.5 pr-10 py-2.5 bg-slate-900/90 border border-slate-850 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-camp-green/10 focus:border-camp-green transition-all font-mono font-semibold"
                    disabled={isLockedOut}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </motion.div>

                {errorMsg && (
                  <div className="p-3 bg-rose-950/40 border border-rose-900/30 rounded-xl text-center">
                    <p className="text-[11px] font-semibold text-rose-400 leading-normal">
                      {errorMsg}
                    </p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 font-mono font-bold text-xs bg-camp-green hover:bg-camp-green/90 active:scale-[0.98] text-white rounded-xl shadow-lg shadow-camp-green/15 transition-all cursor-pointer"
                  disabled={isLockedOut}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Verify Access Keys
                </button>

                {/* Remaining tries progress bar indicator */}
                <div className="pt-2 text-center">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                    <span>Brute-force Shield</span>
                    <span>{remainingTries} / 5 tries remaining</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        remainingTries <= 1 
                          ? 'bg-rose-500 shadow-sm shadow-rose-500/50' 
                          : remainingTries <= 3 
                            ? 'bg-amber-500' 
                            : 'bg-camp-green'
                      }`}
                      style={{ width: `${(remainingTries / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Secure watermark */}
          <div className="mt-8 flex items-center gap-1 text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest leading-none select-none">
            <span>Secure Tunnel</span>
            <span>•</span>
            <span>Port 3000 Node</span>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
