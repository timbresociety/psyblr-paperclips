import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import confetti from 'canvas-confetti';
import { Crown, Building2, Share2, Check, RotateCcw } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

export const UnicornVictoryModal: React.FC = () => {
  const {
    isUnicornModalOpen,
    closeUnicornModal,
    startHoldingCompanyMode,
    resetGame,
    valuation,
    arr,
    agents,
    founderOwnership,
    totalPlayTimeSeconds,
    company
  } = useGameStore();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isUnicornModalOpen) {
      soundEngine.playCelebration();
      try {
        const duration = 6 * 1000;
        const animationEnd = Date.now() + duration;

        const interval: any = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);

          confetti({
            particleCount: 50,
            angle: 60,
            spread: 65,
            origin: { x: 0, y: 0.7 },
            colors: ['#ffd700', '#0a84ff', '#30d158', '#ffffff']
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 65,
            origin: { x: 1, y: 0.7 },
            colors: ['#ffd700', '#0a84ff', '#30d158', '#ffffff']
          });
        }, 300);

        return () => clearInterval(interval);
      } catch {}
    }
  }, [isUnicornModalOpen]);

  if (!isUnicornModalOpen) return null;

  const minutes = Math.floor(totalPlayTimeSeconds / 60);
  const seconds = Math.floor(totalPlayTimeSeconds % 60);
  const timeFormatted = `${minutes}m ${seconds}s`;

  const handleCopyShare = () => {
    const text = `🚀 I just scaled "${company?.name || 'Psyblr'}" to $1,000,000,000 ARR with exactly 1 human employee!\n\n🤖 Autonomous AI Swarm: ${agents.length} Agents\n💰 ARR: $${(arr / 1000000).toFixed(1)}M+ ($1.0B ARR)\n🏆 Human Employees: 1 (Founder)\n⚡ Gross Margin: 96.4%\n⏱️ Run Time: ${timeFormatted}\n\nPlayed on Psyblr Paperclips (inspired by yolomode)`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      soundEngine.playCash();
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-3xl animate-in fade-in duration-500">
      <div className="apple-card rounded-3xl max-w-xl w-full p-6 sm:p-9 text-center shadow-2xl border border-[#ffd700]/30 relative overflow-hidden bg-gradient-to-b from-[#1c1c1e] to-[#121214]">
        {/* Subtle Radiant Background Lighting */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#ffd700]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Crown Beacon */}
        <div className="w-18 h-18 rounded-3xl bg-[#ffd700]/15 border border-[#ffd700]/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#ffd700]/10">
          <Crown className="w-9 h-9 text-[#ffd700] animate-pulse" />
        </div>

        <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#ffd700] block mb-1">
          THE $1,000,000,000 ARR CLIMAX ACHIEVED
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
          The 1-Person Empire
        </h1>

        <p className="text-xs text-white/60 mb-6 max-w-md mx-auto leading-relaxed">
          You achieved what Silicon Valley thought was impossible: building a <strong>$1 Billion Annual Recurring Revenue</strong> conglomerate with an autonomous AI swarm and exactly <strong>1 Human Employee</strong>.
        </p>

        {/* Final Scorecard */}
        <div className="apple-inset rounded-2xl p-4 sm:p-5 mb-6 text-left space-y-2.5 font-mono text-xs tabular-nums border border-white/[0.08]">
          <div className="flex justify-between items-center text-white/80">
            <span className="font-sans text-white/50">Annual Recurring Revenue:</span>
            <span className="text-base font-bold text-[#30d158]">
              ${(arr / 1000000).toFixed(2)}M ($1.00B+ ARR)
            </span>
          </div>

          <div className="flex justify-between items-center text-white/80">
            <span className="font-sans text-white/50">Company Valuation:</span>
            <span className="text-sm font-semibold text-white">
              ${(valuation / 1000000000).toFixed(2)}B
            </span>
          </div>

          <div className="flex justify-between items-center text-white/90 py-2 border-y border-white/[0.08]">
            <span className="font-sans font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#30d158] animate-ping" />
              Human Employees:
            </span>
            <span className="text-lg font-black text-[#30d158]">
              1 (The Founder)
            </span>
          </div>

          <div className="flex justify-between items-center text-white/80">
            <span className="font-sans text-white/50">Autonomous AI Agents:</span>
            <span className="font-semibold text-white">
              {agents.length} Agents
            </span>
          </div>

          <div className="flex justify-between items-center text-white/80">
            <span className="font-sans text-white/50">Founder Equity Ownership:</span>
            <span className="font-semibold text-[#ff9f0a]">
              {founderOwnership.toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between items-center text-white/80">
            <span className="font-sans text-white/50">Total Time to $1B ARR:</span>
            <span className="font-semibold text-[#64d2ff]">
              {timeFormatted}
            </span>
          </div>
        </div>

        {/* Share Card Button */}
        <div className="mb-6">
          <button
            onClick={handleCopyShare}
            className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#30d158]" />
                <span className="text-[#30d158]">Copied Victory Card to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[#64d2ff]" />
                <span>Copy Founder Victory Brag Card</span>
              </>
            )}
          </button>
        </div>

        {/* Action CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={() => { soundEngine.playClick(); closeUnicornModal(); }}
            className="py-2.5 px-3 rounded-xl apple-btn-secondary text-xs font-medium transition-all"
          >
            Keep Playing
          </button>

          <button
            onClick={() => { soundEngine.playClick(); startHoldingCompanyMode(); }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl apple-btn-primary text-xs tracking-tight transition-all shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Spin Subsidiaries</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Butlerian Jihad: Wipe the galaxy and start fresh from Era 1?')) {
                resetGame();
                closeUnicornModal();
              }
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#ff453a]/15 hover:bg-[#ff453a]/25 text-[#ff453a] border border-[#ff453a]/30 text-xs font-medium transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Game+</span>
          </button>
        </div>
      </div>
    </div>
  );
};
