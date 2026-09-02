import React, { useEffect } from 'react';
import { useGameStore } from '../../state/gameStore';
import confetti from 'canvas-confetti';
import { Crown, Building2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
      <div className="bg-[#0f111c] border-2 border-purple-500 rounded-3xl max-w-xl w-full p-8 text-center shadow-[0_0_80px_rgba(168,85,247,0.4)]">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(168,85,247,0.6)]">
          <Crown className="w-10 h-10 text-white" />
        </div>

        <span className="text-xs font-mono font-black tracking-widest uppercase text-purple-400 block mb-1">
          ZERO EMPLOYEES — VICTORY CONDITION MET
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-white glow-purple mb-2">
          CONGRATULATIONS
        </h1>

        <p className="text-sm text-purple-200 font-mono mb-6">
          You built a $1 Billion Unicorn without ever hiring another human.
        </p>

        {/* Final Unicorn Scorecard Card */}
        <div className="bg-[#151829] border border-purple-500/40 rounded-2xl p-5 mb-6 text-left space-y-2.5 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>Valuation:</span>
            <span className="text-base font-black text-purple-300">
              ${(valuation / 1000000).toFixed(2)}M ($1.04B)
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Annual Recurring Revenue (ARR):</span>
            <span className="text-sm font-bold text-emerald-400">
              ${(arr / 1000000).toFixed(2)}M
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300 py-1 border-y border-slate-800">
            <span className="font-bold text-white">Employees:</span>
            <span className="text-xl font-black text-emerald-400 glow-green">
              1
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Autonomous Agents:</span>
            <span className="font-bold text-cyan-300">
              {agents.length}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Founder Ownership:</span>
            <span className="font-bold text-amber-300">
              {founderOwnership.toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Technical Debt:</span>
            <span className="font-bold text-rose-400">
              {techDebt.toFixed(0)}%
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 italic mb-6">
          "You did it. Somehow."
        </p>

        {/* Action CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={closeUnicornModal}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs tracking-wider uppercase transition-all"
          >
            Continue Operating
          </button>

          <button
            onClick={startHoldingCompanyMode}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
          >
            <Building2 className="w-4 h-4" />
            <span>Form Holding Company</span>
          </button>
        </div>
      </div>
    </div>
  );
};
