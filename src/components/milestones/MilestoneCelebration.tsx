import React, { useEffect } from 'react';
import { useGameStore } from '../../state/gameStore';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight } from 'lucide-react';

export const MilestoneCelebration: React.FC = () => {
  const { activeMilestoneCelebration, closeMilestoneModal } = useGameStore();

  useEffect(() => {
    if (activeMilestoneCelebration) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  }, [activeMilestoneCelebration]);

  if (!activeMilestoneCelebration) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#111424] border border-purple-500/60 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-center">
        <div className="w-14 h-14 rounded-full bg-purple-950 border border-purple-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          <Trophy className="w-7 h-7 text-yellow-400" />
        </div>

        <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-purple-400 block mb-1">
          MILESTONE UNLOCKED
        </span>

        <h2 className="text-2xl font-black text-white glow-purple mb-2">
          {activeMilestoneCelebration.bannerTitle}
        </h2>

        <p className="text-xs text-purple-200/90 italic font-mono mb-4">
          {activeMilestoneCelebration.flavorQuote}
        </p>

        <p className="text-xs text-slate-300 leading-relaxed mb-6 bg-[#161a2f] p-3.5 rounded-xl border border-slate-800">
          {activeMilestoneCelebration.rewardFlavor}
        </p>

        <button
          onClick={closeMilestoneModal}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
        >
          <span>Continue Building</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
