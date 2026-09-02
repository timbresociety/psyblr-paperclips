import React, { useState } from 'react';
import { useGameStore, calcAutonomyInfo } from '../../state/gameStore';
import { Volume2, VolumeX, RotateCcw, AlertTriangle, ShieldCheck, Flame, Cpu, Users, ChevronDown } from 'lucide-react';
import { ResetConfirmModal } from './ResetConfirmModal';

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

  const autonomy = calcAutonomyInfo({ agents, valuation, stage });
  const isComputeThrottled = computeUsed > computeCapacity && computeCapacity > 0;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0c0e17]/95 backdrop-blur-md border-b border-[#1f2438] px-4 py-2.5">
        {/* Top Headline Row */}
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Company Title, Company Switcher & Permanent Employee Badge */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white glow-purple">
                  {company ? company.name.toUpperCase() : 'ZERO EMPLOYEES'}
                </span>

                {/* Autonomy Badge */}
                <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold border ${autonomy.badgeClass}`}>
                  L{autonomy.level} AUTO
                </span>

                {/* Multi-Company Switcher Dropdown */}
                {companies.length > 1 && (
                  <div className="relative inline-flex items-center">
                    <select
                      value={activeCompanyId}
                      onChange={(e) => switchActiveCompany(e.target.value)}
                      className="text-xs bg-[#161a2e] border border-purple-500/40 text-purple-200 rounded-lg px-2.5 py-1 font-mono font-bold cursor-pointer hover:border-purple-400 focus:outline-none appearance-none pr-6"
                      title="Switch active subsidiary"
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#101222] text-white">
                          {c.name} (L{c.autonomyLevel || 1})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-purple-400 absolute right-1.5 pointer-events-none" />
                  </div>
                )}
              </div>

              {company && (
                <p className="text-[11px] text-slate-400 truncate max-w-xs font-mono">
                  {company.tagline}
                </p>
              )}
            </div>

            {/* THE CANONICAL EMPLOYEE COUNTER: ALWAYS 1 */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 font-bold">Employees:</span>
                <span className="text-sm font-black text-emerald-300 font-mono animate-pulse-subtle">
                  {employees}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Headline Numbers */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* MRR & ARR */}
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">MRR / ARR</div>
              <div className="text-base sm:text-lg font-black font-mono text-emerald-400 glow-green">
                ${mrr.toLocaleString()} <span className="text-xs text-slate-400 font-normal">(${(arr / 1000).toFixed(1)}k)</span>
              </div>
            </div>

            {/* Cash */}
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Cash</div>
              <div className="text-base sm:text-lg font-black font-mono text-white">
                ${Math.floor(cash).toLocaleString()}
              </div>
            </div>

            {/* Customers */}
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Customers</div>
              <div className="text-base sm:text-lg font-black font-mono text-blue-400">
                {Math.floor(customers).toLocaleString()}
              </div>
            </div>

            {/* Valuation */}
            <div className="text-right pl-2 border-l border-slate-700/60">
              <div className="text-[10px] uppercase tracking-wider text-purple-300 font-medium flex items-center justify-end gap-1">
                <span>Valuation</span>
                <span className="text-[10px] text-purple-400 font-mono">({valuationMultiple.toFixed(1)}x)</span>
              </div>
              <div className="text-base sm:text-lg font-black font-mono text-purple-300 glow-purple">
                ${valuation >= 1000000 ? `${(valuation / 1000000).toFixed(2)}M` : valuation.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Controls: Sound, Speed, Reset */}
          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="flex items-center bg-[#181b2a] rounded-lg border border-slate-700/60 p-0.5">
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setGameSpeed(s)}
                  className={`px-2 py-0.5 text-xs font-mono rounded font-medium transition-colors ${
                    gameSpeed === s
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
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
              className={`p-1.5 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-[#181b2a] border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-rose-950/40 border-rose-800/40 text-rose-400'
              }`}
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Reset Modal Trigger */}
            <button
              onClick={() => setIsResetOpen(true)}
              className="p-1.5 rounded-lg bg-[#181b2a] border border-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
              title="Reset Game"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Operational Status Bar */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-[#181b2b] grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {/* Trust Gauge */}
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-3.5 h-3.5 ${trust >= 60 ? 'text-emerald-400' : trust >= 30 ? 'text-amber-400' : 'text-rose-400'}`} />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Trust</span>
                <span className="font-mono font-bold text-slate-200">{trust.toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    trust >= 60 ? 'bg-emerald-500' : trust >= 30 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, trust))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Technical Debt Gauge */}
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-3.5 h-3.5 ${techDebt > 50 ? 'text-rose-400 animate-bounce' : 'text-amber-400'}`} />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Tech Debt</span>
                <span className={`font-mono font-bold ${techDebt > 70 ? 'text-rose-400' : 'text-amber-300'}`}>
                  {techDebt.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    techDebt > 70 ? 'bg-rose-500' : techDebt > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, techDebt))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Hype */}
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-pink-400" />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Hype</span>
                <span className="font-mono font-bold text-pink-300">{hype.toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, hype))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Compute Capacity & Throttling */}
          <div className="flex items-center gap-2">
            <Cpu className={`w-3.5 h-3.5 ${isComputeThrottled ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Compute</span>
                <span className={`font-mono font-bold ${isComputeThrottled ? 'text-rose-400' : 'text-cyan-300'}`}>
                  {computeUsed.toFixed(1)} / {computeCapacity} CU
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    isComputeThrottled ? 'bg-rose-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.min(100, (computeUsed / Math.max(1, computeCapacity)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Ownership */}
          <div className="hidden sm:flex items-center justify-end text-slate-400 text-xs">
            <span>Founder Stake: </span>
            <span className="ml-1 font-mono font-bold text-slate-200">{founderOwnership.toFixed(1)}%</span>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} />
    </>
  );
};
