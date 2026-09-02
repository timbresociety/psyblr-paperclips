import React, { useEffect } from 'react';
import { useGameStore } from '../../state/gameStore';
import confetti from 'canvas-confetti';
import { Crown, Building2 } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

export const UnicornVictoryModal: React.FC = () => {
  const {
    isUnicornModalOpen,
    closeUnicornModal,
    startHoldingCompanyMode,
    valuation,
    arr,
    agents,
    founderOwnership,
    techDebt
  } = useGameStore();

  useEffect(() => {
    if (isUnicornModalOpen) {
      soundEngine.playCelebration();
      try {
        const duration = 4 * 1000;
        const animationEnd = Date.now() + duration;

        const interval: any = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);

          confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 250);

        return () => clearInterval(interval);
      } catch {}
    }
  }, [isUnicornModalOpen]);

  if (!isUnicornModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
      <div className="apple-card rounded-3xl max-w-xl w-full p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-[#ffd60a]/15 border border-[#ffd60a]/30 flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-[#ffd60a]" />
        </div>

        <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-[#ffd60a] block mb-1">
          Zero Employees — Victory Condition Met
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
          Congratulations
        </h1>

        <p className="text-xs text-white/60 mb-6 font-sans">
          You built a $1 Billion Unicorn without ever hiring another human.
        </p>

        {/* Final Unicorn Scorecard Card */}
        <div className="apple-inset rounded-2xl p-5 mb-6 text-left space-y-2.5 font-mono text-xs tabular-nums">
          <div className="flex justify-between items-center text-white/70">
            <span className="font-sans text-white/50">Valuation:</span>
            <span className="text-base font-semibold text-white">
              ${(valuation / 1000000).toFixed(2)}M ($1.04B)
            </span>
          </div>

          <div className="flex justify-between items-center text-white/70">
            <span className="font-sans text-white/50">Annual Recurring Revenue (ARR):</span>
            <span className="text-sm font-semibold text-[#30d158]">
              ${(arr / 1000000).toFixed(2)}M
            </span>
          </div>

          <div className="flex justify-between items-center text-white/70 py-1.5 border-y border-white/[0.06]">
            <span className="font-sans font-medium text-white">Human Employees:</span>
            <span className="text-lg font-bold text-[#30d158]">
              1
            </span>
          </div>

          <div className="flex justify-between items-center text-white/70">
            <span className="font-sans text-white/50">Autonomous Agents:</span>
            <span className="font-semibold text-white">
              {agents.length}
            </span>
          </div>

          <div className="flex justify-between items-center text-white/70">
            <span className="font-sans text-white/50">Founder Ownership:</span>
            <span className="font-semibold text-[#ff9f0a]">
              {founderOwnership.toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between items-center text-white/70">
            <span className="font-sans text-white/50">Technical Debt:</span>
            <span className="font-semibold text-[#ff453a]">
              {techDebt.toFixed(0)}%
            </span>
          </div>
        </div>

        <p className="text-xs text-white/40 italic mb-6 font-serif">
          "You did it. Perfectly automated."
        </p>

        {/* Action CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => { soundEngine.playClick(); closeUnicornModal(); }}
            className="py-2.5 px-4 rounded-xl apple-btn-secondary text-xs font-medium transition-all"
          >
            Continue Operating
          </button>

          <button
            onClick={() => { soundEngine.playClick(); startHoldingCompanyMode(); }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl apple-btn-primary text-xs tracking-tight transition-all shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            <span>Form Holding Company</span>
          </button>
        </div>
      </div>
    </div>
  );
};

