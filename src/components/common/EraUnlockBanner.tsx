import React, { useEffect } from 'react';
import { useGameStore } from '../../state/gameStore';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

export const EraUnlockBanner: React.FC = () => {
  const { activeEraUnlock, closeEraUnlockBanner } = useGameStore();

  useEffect(() => {
    if (activeEraUnlock) {
      soundEngine.playDeploy();
      const timer = setTimeout(() => {
        closeEraUnlockBanner();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeEraUnlock, closeEraUnlockBanner]);

  if (!activeEraUnlock) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] sm:w-full animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="apple-glass rounded-2xl p-4 sm:p-5 shadow-2xl border border-[#0a84ff]/40 bg-[#161618]/95 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#0a84ff]/15 border border-[#0a84ff]/30 text-[#0a84ff] shrink-0">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>

          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#0a84ff]/20 text-[#64d2ff] font-semibold border border-[#0a84ff]/30">
                Era {activeEraUnlock.era} Unlocked
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
              {activeEraUnlock.name}
            </h3>

            <p className="text-xs text-white/70 leading-relaxed">
              {activeEraUnlock.description}
            </p>

            {activeEraUnlock.unlockedItem && (
              <div className="pt-1 flex items-center gap-1.5 text-xs text-[#30d158] font-medium font-mono">
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Revealed: {activeEraUnlock.unlockedItem}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={closeEraUnlockBanner}
          className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
          aria-label="Close unlock announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
