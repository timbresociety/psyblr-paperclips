import React, { useEffect, useState } from 'react';
import { useV1Store } from '../../state/v1Store';
import confetti from 'canvas-confetti';
import { Crown, Sparkles, Building2, Share2, Check, ArrowRight, RotateCcw } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';
import { formatMoney, formatBps } from '../../sim/math';
import { calcFounderStakeValue } from '../../sim/valuation';

export const UnicornVictoryModal: React.FC = () => {
  const { company, activeModal, closeModal, openModal, resetGame } = useV1Store();
  const [copied, setCopied] = useState(false);

  const isOpen = activeModal === 'unicorn';

  useEffect(() => {
    if (isOpen) {
      soundEngine.playCelebration();
      try {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;

        const interval: ReturnType<typeof setInterval> = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);

          confetti({
            particleCount: 40,
            angle: 60,
            spread: 60,
            origin: { x: 0.1, y: 0.7 },
            colors: ['#f59e0b', '#10b981', '#38bdf8', '#ffffff'],
          });
          confetti({
            particleCount: 40,
            angle: 120,
            spread: 60,
            origin: { x: 0.9, y: 0.7 },
            colors: ['#f59e0b', '#10b981', '#38bdf8', '#ffffff'],
          });
        }, 250);

        return () => clearInterval(interval);
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalActions = (company.totalManualActions || 0) + (company.totalAutomatedActions || 0);
  const autonomyRate =
    totalActions > 0
      ? Math.min(100, Math.round(((company.totalAutomatedActions || 0) / totalActions) * 100))
      : 85;

  let postUnicornBadge = 'Actually Autonomous';
  if (company.valuationCents >= 2_000_000_000_00n) {
    postUnicornBadge = 'One-Person Decacorn Candidate';
  } else if (autonomyRate >= 95) {
    postUnicornBadge = 'Money Printer';
  }

  const founderStake = calcFounderStakeValue(company.valuationCents, company.founderOwnershipBps);

  const totalSec = Math.floor((company.unicornSpeedrunElapsedMs || company.quarterElapsedMs) / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const speedrunStr = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

  const totalAgentTiers = (Object.values(company.agents) as number[]).reduce((a, b) => a + b, 0);

  const asciiReceipt = `┌───────────────────────────────────────────────┐
│ PSYBLR PAPERCLIPS // UNICORN VICTORY RECORD   │
├───────────────────────────────────────────────┤
│ COMPANY:    ${company.name.toUpperCase().padEnd(33)} │
│ VALUATION:  ${formatMoney(company.valuationCents).padEnd(14)} [${company.valuationMultiple}X MULTIPLE]    │
│ ANNUAL ARR: ${formatMoney(company.arrCents).padEnd(33)} │
│ LIQUIDITY:  ${formatMoney(company.cashCents).padEnd(33)} │
│ EQUITY:     ${formatBps(company.founderOwnershipBps)} (${formatMoney(founderStake)} NET WORTH) │
│ EMPLOYEES:  1 HUMAN CEO (PERPETUALLY)         │
│ SWARM SIZE: ${String(totalAgentTiers).padEnd(2)} AGENT TIERS (${autonomyRate}% AUTONOMOUS)   │
│ SPEEDRUN:   QUARTER ${String(company.quarter).padEnd(2)} // ${speedrunStr.padEnd(22)} │
│ STATUS:     ${postUnicornBadge.toUpperCase().padEnd(33)} │
└───────────────────────────────────────────────┘`;

  const handleCopyReceipt = () => {
    navigator.clipboard
      .writeText(
        `🦄 I built a ${formatMoney(company.valuationCents)} Unicorn company with 1 Human Employee!\n\n` +
          `💰 Valuation: ${formatMoney(company.valuationCents)} (${company.valuationMultiple}x)\n` +
          `📈 Annual ARR: ${formatMoney(company.arrCents)}\n` +
          `🤖 Autonomy: ${autonomyRate}% (Gas Town Swarm)\n` +
          `⏱️ Speedrun: Quarter ${company.quarter} in ${speedrunStr}\n\n` +
          `Played on Psyblr Paperclips (1-Person AI CEO Terminal)`
      )
      .then(() => {
        setCopied(true);
        soundEngine.playCash();
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(() => {});
  };

  const handleContinue = () => {
    soundEngine.playClick();
    // Unpause simulation and resume play
    useV1Store.setState((s) => ({
      company: {
        ...s.company,
        isPaused: false,
        unicornAcknowledged: true,
      },
    }));
    closeModal();
  };

  const handleOpenPortfolio = () => {
    soundEngine.playClick();
    useV1Store.setState((s) => ({
      company: {
        ...s.company,
        isPaused: false,
        unicornAcknowledged: true,
      },
    }));
    openModal('holding_company');
  };

  const handleNewRun = async () => {
    if (window.confirm('START PRESTIGE RUN: Archive this company and launch a new subsidiary?')) {
      await resetGame();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-[#09090c] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.18)] overflow-hidden text-center text-white flex flex-col items-center">
        {/* Luminous Ambient Phosphor Radial Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Industrial Badge Header */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono tracking-widest uppercase mb-4 shadow-sm">
          <Sparkles className="w-3 h-3 animate-spin" />
          <span>MISSION CLIMAX REACHED // $1,000,000,000 VALUATION</span>
        </div>

        {/* Hardware Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
          <Crown className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1 font-sans">
          The 1-Person Unicorn
        </h1>
        <p className="text-xs sm:text-sm text-white/60 max-w-lg mb-6 font-mono leading-relaxed">
          You accomplished the holy grail of modern autonomous capitalism: scaling{' '}
          <span className="text-white font-bold">{company.name}</span> past{' '}
          <span className="text-amber-400 font-bold">$1 Billion Valuation</span> with an autonomous
          swarm and exactly <span className="text-emerald-400 font-bold">1 Human Employee</span>.
        </p>

        {/* Gleb Industrial Telemetry Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-left font-mono">
          <div className="bg-[#121216] border border-white/[0.08] rounded-xl p-3">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block">VALUATION</span>
            <span className="text-base sm:text-lg font-bold text-amber-400">
              {formatMoney(company.valuationCents)}
            </span>
            <span className="text-[10px] text-white/40 block mt-0.5">{company.valuationMultiple}x Multiple</span>
          </div>

          <div className="bg-[#121216] border border-white/[0.08] rounded-xl p-3">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block">FOUNDER NET WORTH</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400">
              {formatMoney(founderStake)}
            </span>
            <span className="text-[10px] text-white/40 block mt-0.5">{formatBps(company.founderOwnershipBps)} Stake</span>
          </div>

          <div className="bg-[#121216] border border-white/[0.08] rounded-xl p-3">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block">SWARM AUTONOMY</span>
            <span className="text-base sm:text-lg font-bold text-sky-400">{autonomyRate}%</span>
            <span className="text-[10px] text-white/40 block mt-0.5">{totalAgentTiers} Agent Tiers</span>
          </div>

          <div className="bg-[#121216] border border-white/[0.08] rounded-xl p-3">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block">SPEEDRUN TIME</span>
            <span className="text-base sm:text-lg font-bold text-white">{speedrunStr}</span>
            <span className="text-[10px] text-white/40 block mt-0.5">Quarter {company.quarter}</span>
          </div>
        </div>

        {/* ASCII Receipt / Record */}
        <div className="w-full relative mb-5">
          <pre className="text-[10px] font-mono text-left text-white/70 bg-[#0d0d10] border border-white/[0.07] rounded-xl p-3 overflow-x-auto select-all leading-tight">
            {asciiReceipt}
          </pre>
          <button
            onClick={handleCopyReceipt}
            className="absolute top-2 right-2 px-2.5 py-1 rounded bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-[10px] font-mono text-white flex items-center gap-1.5 transition shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">COPIED</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3" />
                <span>SHARE RECORD</span>
              </>
            )}
          </button>
        </div>

        {/* Decision & Action Bar */}
        <div className="w-full flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-white/[0.08] font-mono">
          <button
            onClick={handleContinue}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(245,158,11,0.25)]"
          >
            <span>CONTINUE TO $10B DECACORN</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenPortfolio}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Building2 className="w-4 h-4 text-sky-400" />
            <span>HOLDING CONGLOMERATE</span>
          </button>

          <button
            onClick={handleNewRun}
            className="w-full sm:w-auto py-3 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-white/60 hover:text-white text-xs transition"
            title="Start new prestige run"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
