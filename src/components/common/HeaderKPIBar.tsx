import React, { useState } from 'react';
import { useGameStore, calcAutonomyInfo } from '../../state/gameStore';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Cpu,
  Users,
  ChevronDown,
  Command
} from 'lucide-react';
import { ResetConfirmModal } from './ResetConfirmModal';
import { CommandPaletteModal } from './CommandPaletteModal';

export const HeaderKPIBar: React.FC = () => {
  const {
    company,
    companies,
    activeCompanyId,
    switchActiveCompany,
    stage,
    agents,
    mrr,
    arr,
    cash,
    customers,
    valuation,
    valuationMultiple,
    trust,
    techDebt,
    hype,
    computeUsed,
    computeCapacity,
    founderOwnership,
    employees,
    soundEnabled,
    gameSpeed,
    toggleSound,
    setGameSpeed
  } = useGameStore();

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const autonomy = calcAutonomyInfo({ agents, valuation, stage });
  const isComputeThrottled = computeUsed > computeCapacity && computeCapacity > 0;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#161618]/90 backdrop-blur-2xl border-b border-white/[0.08] px-3 sm:px-5 py-2.5">
        {/* Top Headline Row */}
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Company Title, Company Switcher & Permanent Employee Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30d158] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30d158]"></span>
                    </span>
                    {company ? company.name : 'Autonomous CEO'}
                  </span>

                  {/* Autonomy Badge */}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border tracking-wider ${autonomy.badgeClass}`}>
                    L{autonomy.level} Auto
                  </span>

                  {/* Multi-Company Switcher Dropdown */}
                  {companies.length > 1 && (
                    <div className="relative inline-flex items-center">
                      <select
                        value={activeCompanyId}
                        onChange={(e) => switchActiveCompany(e.target.value)}
                        className="text-[11px] bg-white/[0.06] border border-white/[0.12] text-white/80 rounded-lg px-2.5 py-1 font-mono font-medium cursor-pointer hover:border-white/[0.2] focus:outline-none appearance-none pr-6"
                        title="Switch active subsidiary"
                      >
                        {companies.map((c) => (
                          <option key={c.id} value={c.id} className="bg-[#1c1c1e] text-white">
                            {c.name} (L{c.autonomyLevel || 1})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-white/50 absolute right-1.5 pointer-events-none" />
                    </div>
                  )}
                </div>

                {company && (
                  <p className="text-[10px] text-white/40 truncate max-w-xs font-sans">
                    {company.tagline}
                  </p>
                )}
              </div>
            </div>

            {/* THE CANONICAL EMPLOYEE COUNTER: ALWAYS 1 */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
              <Users className="w-3.5 h-3.5 text-[#30d158]" />
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">Employees:</span>
                <span className="text-xs font-semibold text-[#30d158] font-mono">
                  {employees}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Headline Numbers (Telemetry Tickers) */}
          <div className="flex items-center gap-3 sm:gap-6 font-mono">
            {/* MRR & ARR */}
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/40 font-sans">MRR / ARR</div>
              <div className="text-xs sm:text-sm font-semibold text-[#30d158] tabular-nums">
                ${mrr.toLocaleString()} <span className="text-[11px] text-white/40 font-normal">(${(arr / 1000).toFixed(1)}k)</span>
              </div>
            </div>

            {/* Cash */}
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/40 font-sans">Cash Treasury</div>
              <div className="text-xs sm:text-sm font-semibold text-white/90 tabular-nums">
                ${Math.floor(cash).toLocaleString()}
              </div>
            </div>

            {/* Customers */}
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-white/40 font-sans">Subscribers</div>
              <div className="text-xs sm:text-sm font-semibold text-white tabular-nums">
                {Math.floor(customers).toLocaleString()}
              </div>
            </div>

            {/* Valuation */}
            <div className="text-right pl-3 border-l border-white/[0.08]">
              <div className="text-[10px] uppercase tracking-wider text-white/40 font-sans flex items-center justify-end gap-1">
                <span>Valuation</span>
                <span className="text-[10px] text-white/60 font-mono">({valuationMultiple.toFixed(1)}x)</span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white tabular-nums">
                ${valuation >= 1000000 ? `${(valuation / 1000000).toFixed(2)}M` : valuation.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Controls: Command Palette, Speed, Sound, Reset */}
          <div className="flex items-center gap-2">
            {/* Command Palette Button */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl apple-btn-secondary text-xs font-mono transition-all group shadow-sm"
              title="Open Command Palette (⌘K)"
            >
              <Command className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
              <span className="hidden sm:inline text-[11px] font-medium">⌘K</span>
            </button>

            {/* Speed Selector */}
            <div className="flex items-center bg-black/40 rounded-xl border border-white/[0.06] p-0.5">
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setGameSpeed(s)}
                  className={`px-2 py-0.5 text-xs font-mono rounded-lg font-medium transition-all ${
                    gameSpeed === s
                      ? 'bg-white/[0.16] text-white shadow-xs'
                      : 'text-white/40 hover:text-white'
                  }`}
                  title={`Simulation speed ${s}x`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Sound */}
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'apple-btn-secondary'
                  : 'bg-[#ff453a]/15 border-[#ff453a]/30 text-[#ff453a]'
              }`}
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-white/70" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Reset Modal Trigger */}
            <button
              onClick={() => setIsResetOpen(true)}
              className="p-1.5 rounded-xl apple-btn-secondary text-white/40 hover:text-[#ff453a] transition-colors"
              title="Reset Game"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Operational Status Bar */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {/* Trust Gauge */}
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-3.5 h-3.5 ${trust >= 60 ? 'text-[#30d158]' : trust >= 30 ? 'text-[#ff9f0a]' : 'text-[#ff453a]'}`} />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-white/40">
                <span>Trust Index</span>
                <span className="font-mono font-medium text-white/80 tabular-nums">{trust.toFixed(0)}%</span>
              </div>
              <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    trust >= 60 ? 'bg-[#30d158]' : trust >= 30 ? 'bg-[#ff9f0a]' : 'bg-[#ff453a]'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, trust))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Technical Debt Gauge */}
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-3.5 h-3.5 ${techDebt > 50 ? 'text-[#ff453a]' : 'text-[#ff9f0a]'}`} />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-white/40">
                <span>Tech Debt</span>
                <span className={`font-mono font-medium tabular-nums ${techDebt > 70 ? 'text-[#ff453a]' : techDebt > 30 ? 'text-[#ff9f0a]' : 'text-[#30d158]'}`}>
                  {techDebt.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    techDebt > 70 ? 'bg-[#ff453a]' : techDebt > 30 ? 'bg-[#ff9f0a]' : 'bg-[#30d158]'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, techDebt))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Hype */}
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-[#ff9f0a]" />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-white/40">
                <span>Hype Velocity</span>
                <span className="font-mono font-medium text-[#ff9f0a] tabular-nums">{hype.toFixed(0)}%</span>
              </div>
              <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-[#ff9f0a] transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, hype))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Compute Capacity & Throttling */}
          <div className="flex items-center gap-2">
            <Cpu className={`w-3.5 h-3.5 ${isComputeThrottled ? 'text-[#ff453a] animate-pulse' : 'text-[#64d2ff]'}`} />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-white/40">
                <span>GPU Cluster</span>
                <span className={`font-mono font-medium tabular-nums ${isComputeThrottled ? 'text-[#ff453a]' : 'text-[#64d2ff]'}`}>
                  {computeUsed.toFixed(1)} / {computeCapacity} CU
                </span>
              </div>
              <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    isComputeThrottled ? 'bg-[#ff453a]' : 'bg-[#64d2ff]'
                  }`}
                  style={{ width: `${Math.min(100, (computeUsed / Math.max(1, computeCapacity)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ownership */}
          <div className="hidden sm:flex items-center justify-end text-white/40 text-xs">
            <span className="text-[11px] text-white/40">Founder Stake: </span>
            <span className="ml-1.5 font-mono font-medium text-white/80 tabular-nums">{founderOwnership.toFixed(1)}%</span>
          </div>
        </div>
      </header>

      {/* Modals */}
      <ResetConfirmModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} />
      <CommandPaletteModal isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
};
