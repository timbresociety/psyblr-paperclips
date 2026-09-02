import React, { useEffect } from 'react';
import { useGameStore } from '../../state/gameStore';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

export const MilestoneCelebration: React.FC = () => {
  const { activeMilestoneCelebration, closeMilestoneModal } = useGameStore();

  useEffect(() => {
    if (activeMilestoneCelebration) {
      soundEngine.playCelebration();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl">
      <div className="apple-card rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#ffd60a]/15 border border-[#ffd60a]/30 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-7 h-7 text-[#ffd60a]" />
        </div>

        <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-[#ffd60a] block mb-1">
          Milestone Unlocked
        </span>

        <h2 className="text-xl font-bold text-white mb-2">
          {activeMilestoneCelebration.bannerTitle}
        </h2>

        <p className="text-xs text-white/60 italic font-serif mb-4">
          {activeMilestoneCelebration.flavorQuote}
        </p>

        <p className="text-xs text-white/80 leading-relaxed mb-6 apple-inset p-3.5 rounded-xl">
          {activeMilestoneCelebration.rewardFlavor}
        </p>

        <button
          onClick={() => { soundEngine.playClick(); closeMilestoneModal(); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl apple-btn-primary text-xs font-medium tracking-tight transition-all shadow-sm"
        >
          <span>Continue Building</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

