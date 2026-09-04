import React from 'react';
import { useV1Store } from '../../state/v1Store';
import { formatMoney, formatBps } from '../../sim/math';
import { soundEngine } from '../../audio/soundEffects';

export const GameOverModal: React.FC = () => {
  const { company, activeModal, resetGame, openModal } = useV1Store();

  const isVisible = activeModal === 'game_over' || (company.isBankrupt && activeModal === 'none');
  if (!isVisible) return null;

  const isGrowthMissed = company.bankruptcyReason === 'growth_mandate_missed';
  const committedPct = company.growthCommitment ? Math.round(company.growthCommitment * 100) : 25;
  const founderStake = (company.valuationCents * BigInt(company.founderOwnershipBps)) / 10000n;

  // Calculate growth achieved in the most recent quarter
  const latestBridge = company.historicalBridges[company.historicalBridges.length - 1];
  const startArr = latestBridge ? latestBridge.startingArrCents : company.quarterStartArrCents;
  const endArr = latestBridge ? latestBridge.endingArrCents : company.arrCents;
  const growthPct = startArr > 0n ? Number(((endArr - startArr) * 10000n) / startArr) / 100 : 0;

  const handleReboot = async () => {
    soundEngine.playClick();
    if (window.confirm('REBOOT MACHINE: Reset all company progress and start fresh from Q1 Step 1?')) {
      await resetGame();
    }
  };

  const handleHoldingCompany = () => {
    soundEngine.playClick();
    openModal('holding_company');
  };

  const handleRescueContinue = () => {
    soundEngine.playCelebration();
    // Emergency board rescue: unblocks simulation so player can continue sandbox play
    useV1Store.setState((s) => ({
      company: {
        ...s.company,
        isBankrupt: false,
        bankruptcyReason: undefined,
        bankruptcyGraceRemainingMs: 20_000,
      },
      activeModal: 'none',
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 select-none">
      <div className="bg-[#0e0e11] border border-[#ff453a]/40 rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-[0_0_50px_rgba(255,69,58,0.15)] text-left animate-in fade-in zoom-in-95 duration-200">
        {/* Terminal Header */}
        <div className="border-b border-[#1e1e24] pb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#ff453a] tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#ff453a] animate-pulse" />
              <span>TERMINATION POST-MORTEM // Q{company.quarter}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1 font-mono">
              {isGrowthMissed ? 'GROWTH MANDATE MISSED' : 'LIQUIDITY INSOLVENCY'}
            </h2>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">
              {isGrowthMissed
                ? 'Your board, seed syndicate, and growth partners have terminated operating autonomy.'
                : 'Treasury liquidity reached negative reserves and expired unserviced beyond the grace period.'}
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#ff453a]/10 border border-[#ff453a]/30 text-[#ff453a] font-mono font-bold text-xs shrink-0">
            BANKRUPT
          </div>
        </div>

        {/* Mandate Comparison Breakdown */}
        {isGrowthMissed && (
          <div className="p-4 rounded-xl bg-black/50 border border-[#1e1e24] space-y-3 font-mono text-xs">
            <span className="text-[10px] text-white/40 uppercase tracking-wider block">
              MANDATE AUDIT COMPLIANCE
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-[#1e1e24]">
                <span className="text-[10px] text-white/40 block">TARGET COMMITTED</span>
                <span className="text-base font-bold text-white">+{committedPct}% Growth</span>
              </div>
              <div className="p-3 rounded-lg bg-[#ff453a]/10 border border-[#ff453a]/30">
                <span className="text-[10px] text-[#ff453a]/80 block">ACTUAL ACHIEVED</span>
                <span className="text-base font-bold text-[#ff453a]">
                  {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}% Growth
                </span>
              </div>
            </div>
            <p className="text-[11px] text-white/40 italic leading-snug">
              "Failing to achieve contracted quarterly ARR expansion terminates autonomy under Section 5.2."
            </p>
          </div>
        )}

        {/* Company Legacy Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
          <div className="bg-[#141418] p-3 rounded-lg border border-[#1e1e24]">
            <span className="text-[10px] text-white/40 block">FINAL ARR</span>
            <span className="text-xs font-bold text-white mt-0.5 block">{formatMoney(company.arrCents)}</span>
          </div>

          <div className="bg-[#141418] p-3 rounded-lg border border-[#1e1e24]">
            <span className="text-[10px] text-white/40 block">PEAK VALUATION</span>
            <span className="text-xs font-bold text-white mt-0.5 block">{formatMoney(company.peakValuationCents)}</span>
          </div>

          <div className="bg-[#141418] p-3 rounded-lg border border-[#1e1e24]">
            <span className="text-[10px] text-white/40 block">EQUITY HELD</span>
            <span className="text-xs font-bold text-white mt-0.5 block">{formatBps(company.founderOwnershipBps)}</span>
          </div>

          <div className="bg-[#141418] p-3 rounded-lg border border-[#1e1e24]">
            <span className="text-[10px] text-white/40 block">STAKE VALUE</span>
            <span className="text-xs font-bold text-[#30d158] mt-0.5 block">{formatMoney(founderStake)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-2">
          {/* Primary: Reboot Fresh Run */}
          <button
            onClick={handleReboot}
            className="w-full py-3 bg-[#ff453a] hover:bg-[#ff453a]/90 text-black font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs font-mono tracking-wider"
          >
            <span>REBOOT RUN (START FRESH Q1) ↺</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Meta: Portfolio Holding Company */}
            <button
              onClick={handleHoldingCompany}
              className="py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-[#1e1e24] font-mono text-xs rounded-xl transition"
            >
              PORTFOLIO // HOLDING CO
            </button>

            {/* Sandbox Rescue: Override & Continue */}
            <button
              onClick={handleRescueContinue}
              title="Board emergency waiver: Resets bankruptcy flag to unfreeze and continue playing this company in sandbox mode."
              className="py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-[#ffd60a] border border-[#ffd60a]/30 font-mono text-xs rounded-xl transition"
            >
              WAIVE PENALTY &amp; RESUME →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
