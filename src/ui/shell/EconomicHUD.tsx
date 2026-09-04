import React, { useState } from 'react';
import { useV1Store } from '../../state/v1Store';
import { formatMoney, formatBps } from '../../sim/math';
import { UNICORN_VALUATION_CENTS } from '../../sim/engine';

export interface EconomicHUDProps {
  onToggleTerminal?: () => void;
  isTerminalOpen?: boolean;
}

export const EconomicHUD: React.FC<EconomicHUDProps> = () => {
  const { company, settings, updateSettings, openModal, resetGame, executeClearVibeDebt } = useV1Store();
  const [isExpanded, setIsExpanded] = useState(false);

  const elapsedSec = Math.floor(company.quarterElapsedMs / 1000);
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')} / 2:30`;

  const unicornProgress = Math.min(
    100,
    Number((company.valuationCents * 100n) / UNICORN_VALUATION_CENTS)
  );

  // Vibe Coding Stage Metadata (Milkinside styling)
  const stage = company.vibeCodingStage || 'manual';
  const stageMeta: Record<
    typeof stage,
    { label: string; tag: string; color: string; border: string; glow: string }
  > = {
    manual: {
      label: 'STAGE 1: MANUAL HACKER',
      tag: '0% AUTONOMY · MANUAL CODE',
      color: 'text-white/70',
      border: 'border-white/10 bg-white/[0.03]',
      glow: '',
    },
    prompter: {
      label: 'STAGE 2: CURSOR PROMPTER',
      tag: 'AI PROMPT SPECS · DIFF REVIEW',
      color: 'text-cyan-300',
      border: 'border-cyan-500/30 bg-cyan-500/10',
      glow: 'shadow-[0_0_12px_rgba(6,182,212,0.25)]',
    },
    yolo: {
      label: 'STAGE 3: YOLO SWARM',
      tag: 'AUTO-MERGE · 2X VELOCITY',
      color: 'text-amber-300',
      border: 'border-amber-500/30 bg-amber-500/10',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    },
    swarm: {
      label: 'STAGE 4: GAS TOWN SWARM',
      tag: 'MULTI-AGENT DAG FACTORY',
      color: 'text-purple-300',
      border: 'border-purple-500/30 bg-purple-500/10',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.25)]',
    },
    sovereign: {
      label: 'STAGE 5: SOVEREIGN AI',
      tag: '$1B UNICORN · 1 HUMAN CEO',
      color: 'text-amber-400 font-extrabold',
      border: 'border-amber-400/50 bg-amber-400/15',
      glow: 'shadow-[0_0_25px_rgba(251,191,36,0.35)]',
    },
  };
  const activeStage = stageMeta[stage];

  const handleReset = async () => {
    if (window.confirm('REBOOT MACHINE: Reset company and restart from Q1?')) {
      await resetGame();
    }
  };

  const burnRateSec = company.tokenBurnRateCentsPerSec || 0n;
  const vibeDebt = company.vibeDebt || 0;

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 pt-2 pb-1 bg-transparent">
      {/* Floating Milkinside Frosted Glass Capsule */}
      <div className="max-w-7xl mx-auto rounded-2xl bg-[#06070d]/85 backdrop-blur-2xl border border-white/[0.09] shadow-[0_10px_40px_rgba(0,0,0,0.7)] p-2.5 sm:px-4 sm:py-3 transition-all">
        {/* Top Main Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Vibe Stage */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-white tracking-tight flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${
                      company.isBankrupt
                        ? 'bg-red-400 animate-ping'
                        : company.isIntermission || company.isPaused
                        ? 'bg-amber-400'
                        : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse'
                    }`}
                  />
                  <span className="font-mono tracking-wider font-semibold">{company.name.toUpperCase()}</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-white/70 font-mono border border-white/[0.08]">
                  Q{company.quarter}
                </span>

                {/* Evolution Stage Pill */}
                <div
                  className={`hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-mono tracking-wider transition-all ${activeStage.border} ${activeStage.glow}`}
                >
                  <span className={`font-bold ${activeStage.color}`}>{activeStage.label}</span>
                  <span className="text-white/30 hidden lg:inline">· {activeStage.tag}</span>
                </div>

                {company.isBankrupt && (
                  <button
                    onClick={() => openModal('game_over')}
                    className="text-[9px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 font-mono font-bold animate-pulse"
                  >
                    TERMINATED
                  </button>
                )}
                {!company.isBankrupt && company.isIntermission && (
                  <button
                    onClick={() => openModal('intermission_review')}
                    className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold hover:bg-amber-500/30"
                  >
                    INTERMISSION REVIEW
                  </button>
                )}
              </div>
              <span className="text-[9px] text-white/40 font-mono hidden sm:inline mt-0.5">
                CYCLE: {company.isIntermission || company.isPaused ? 'PAUSED' : timeStr}
              </span>
            </div>
          </div>

          {/* Core Numbers: ARR, VALUATION, LIQUIDITY */}
          <div className="flex items-center gap-4 sm:gap-7 font-mono">
            {/* Token Burn Rate Ticker (Only visible if agents burning tokens) */}
            {burnRateSec > 0n && (
              <div className="hidden xl:flex flex-col items-end">
                <span className="text-[9px] text-amber-400/70 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  API TOKEN BURN
                </span>
                <span className="text-xs font-bold text-amber-300 tracking-tight">
                  -{formatMoney(burnRateSec)}/s
                </span>
              </div>
            )}

            {/* Vibe Debt Gauge */}
            {vibeDebt > 0 && (
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[9px] text-white/40 uppercase tracking-wider">VIBE DEBT</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold ${
                      vibeDebt > 50 ? 'text-red-400 animate-pulse' : vibeDebt > 25 ? 'text-amber-400' : 'text-cyan-300'
                    }`}
                  >
                    {vibeDebt}%
                  </span>
                  {vibeDebt > 20 && (
                    <button
                      onClick={executeClearVibeDebt}
                      className="px-1.5 py-0.2 rounded text-[8px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition"
                      title="Run synthetic regression suite to purge vibe debt & context rot"
                    >
                      PURGE CI/CD
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ARR */}
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-white/40 uppercase tracking-wider">ANNUAL ARR</span>
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {formatMoney(company.arrCents)}
              </span>
            </div>

            {/* VALUATION */}
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-white/40 uppercase tracking-wider">
                VALUATION ({company.valuationMultiple}X)
              </span>
              <span
                className={`text-xs sm:text-sm font-bold tracking-tight ${
                  company.valuationCents >= UNICORN_VALUATION_CENTS
                    ? 'text-amber-400 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'text-white'
                }`}
              >
                {formatMoney(company.valuationCents)}
              </span>
            </div>

            {/* LIQUIDITY */}
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-white/40 uppercase tracking-wider">LIQUIDITY</span>
              <span
                className={`text-xs sm:text-sm font-bold tracking-tight ${
                  company.cashCents < 0n ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {formatMoney(company.cashCents)}
              </span>
            </div>
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => openModal('intermission_capital')}
              className="px-2.5 py-1 text-[10px] font-mono text-white/80 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.08] rounded-xl transition"
            >
              CAPITAL
            </button>

            <button
              onClick={() => openModal('holding_company')}
              className="px-2.5 py-1 text-[10px] font-mono text-white/80 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.08] rounded-xl transition"
            >
              PORTFOLIO
            </button>

            <button
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className="px-2 py-1 text-[10px] font-mono text-white/50 hover:text-white rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition hidden sm:inline"
              title="Toggle Audio"
            >
              {settings.soundEnabled ? 'SFX: ON' : 'SFX: OFF'}
            </button>

            <button
              onClick={handleReset}
              className="px-2 py-1 text-[10px] font-mono text-white/40 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-xl transition hidden sm:inline"
              title="Reset simulation"
            >
              RESET
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-1 text-[10px] font-mono text-white/40 hover:text-white rounded-lg border border-white/[0.08] transition sm:hidden"
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Secondary Drawer Row */}
        <div
          className={`pt-2.5 border-t border-white/[0.06] mt-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono ${
            isExpanded ? 'block' : 'hidden sm:flex'
          }`}
        >
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-1.5 text-white/60">
              <span className="text-white/40">EQUITY:</span>
              <span className="font-semibold text-white">{formatBps(company.founderOwnershipBps)}</span>
            </div>

            <div className="flex items-center gap-1.5 text-white/60">
              <span className="text-white/40">DEBT:</span>
              <span className={company.debtCents > 0n ? 'text-amber-400' : 'text-white'}>
                {formatMoney(company.debtCents)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-white/40">COMPLEXITY:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  company.strainState === 'stable'
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    : company.strainState === 'strained'
                    ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                    : company.strainState === 'overloaded'
                    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                    : 'text-red-400 border-red-500/30 bg-red-500/10 animate-pulse'
                }`}
              >
                {company.strainState.toUpperCase()} ({company.complexity.toFixed(1)} / {company.opsCapacity})
              </span>
            </div>
          </div>

          {/* $1B Scale Progress Bar */}
          <div className="flex items-center gap-2 text-white/60 min-w-[240px]">
            <span className="text-[10px] text-white/40 font-mono tracking-wider">$1B SCALE:</span>
            <div className="flex-1 bg-white/[0.05] h-1.5 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  unicornProgress >= 100
                    ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b]'
                    : 'bg-gradient-to-r from-cyan-400 to-indigo-500'
                }`}
                style={{ width: `${unicornProgress}%` }}
              />
            </div>
            {unicornProgress >= 100 ? (
              <button
                onClick={() => openModal('unicorn')}
                className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-[9px] font-mono font-bold animate-pulse flex items-center gap-1 transition shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                title="View $1B Unicorn Victory Record"
              >
                <span>🦄 $1B RECORD</span>
              </button>
            ) : (
              <span className="text-[10px] font-bold font-mono text-white">{unicornProgress.toFixed(1)}%</span>
            )}
          </div>
        </div>

        {/* Critical Insolvency Alert */}
        {company.cashCents < 0n && (
          <div className="mt-2 bg-red-500/10 border border-red-500/40 text-red-400 rounded-xl px-3 py-1.5 text-xs font-mono flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <span>[CRITICAL] RUNWAY EXHAUSTED! Insolvency timer: {(company.bankruptcyGraceRemainingMs / 1000).toFixed(0)}s</span>
            </div>
            <button
              onClick={() => openModal('intermission_capital')}
              className="px-2 py-0.5 bg-red-500 text-black font-bold text-[10px] rounded hover:bg-red-400"
            >
              DRAW CREDIT
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
