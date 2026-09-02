import React, { useState } from 'react';
import { useGameStore, calcAutonomyInfo } from '../../state/gameStore';
import { getRandomStartupChoices } from '../../data/companyIdeas';
import type { StartupIdea, CompanyState } from '../../types/game';
import {
  Building2,
  Plus,
  Layers,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Sparkles,
  Zap,
  ShieldCheck,
  Send,
  X
} from 'lucide-react';

export const HoldingCompanyScreen: React.FC = () => {
  const {
    companies,
    activeCompanyId,
    cash,
    conglomerateTreasury,
    launchSubsidiary,
    switchActiveCompany,
    injectCapital,
    setActiveTab
  } = useGameStore();

  const [isNewStartupModalOpen, setIsNewStartupModalOpen] = useState(false);
  const [choices, setChoices] = useState<StartupIdea[]>(() => getRandomStartupChoices(3));
  const [selectedSeedFunding, setSelectedSeedFunding] = useState<number>(2000);
  const [switchImmediately, setSwitchImmediately] = useState<boolean>(true);

  // Capital Injection Modal State
  const [injectModalTarget, setInjectModalTarget] = useState<CompanyState | null>(null);
  const [injectAmount, setInjectAmount] = useState<number>(25000);

  const totalPortfolioValuation = companies.reduce((acc, sub) => acc + sub.valuation, 0);
  const totalPortfolioArr = companies.reduce((acc, sub) => acc + sub.arr, 0);
  const totalAgents = companies.reduce((acc, sub) => acc + sub.agents.length, 0);
  const totalAvailableCapital = cash + (conglomerateTreasury || 0);

  const handleLaunch = (idea: StartupIdea) => {
    launchSubsidiary(idea, selectedSeedFunding, switchImmediately);
    setIsNewStartupModalOpen(false);
  };

  const handleExecuteInjection = () => {
    if (!injectModalTarget) return;
    const success = injectCapital(injectModalTarget.id, injectAmount);
    if (success) {
      setInjectModalTarget(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Holding Company Header Banner */}
      <div className="bg-[#101222] border border-purple-500/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-black tracking-tight text-white glow-purple">
                AUTONOMOUS HOLDING CONGLOMERATE
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Your autonomous conglomerate launches and operates independent AI startups. Take operational command of any subsidiary to guide it from <strong>Level 1 (Manual Founder)</strong> to <strong>Level 5 (100% Autonomous Unicorn)</strong>.
            </p>
          </div>

          <button
            onClick={() => {
              setChoices(getRandomStartupChoices(3));
              setIsNewStartupModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Subsidiary Venture</span>
          </button>
        </div>

        {/* Aggregate Conglomerate Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-800 font-mono text-xs">
          <div className="bg-[#161a2f] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-medium">Total Conglomerate Value</span>
            <span className="text-base font-black text-purple-300">
              ${(totalPortfolioValuation / 1000000).toFixed(1)}M
            </span>
          </div>

          <div className="bg-[#161a2f] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-medium">Portfolio Subsidiaries</span>
            <span className="text-base font-black text-white">
              {companies.length} Startup{companies.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="bg-[#161a2f] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-medium">Consolidated Agents</span>
            <span className="text-base font-black text-cyan-300">
              {totalAgents} Agents
            </span>
          </div>

          <div className="bg-[#161a2f] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-medium">Consolidated ARR</span>
            <span className="text-base font-black text-emerald-400">
              ${(totalPortfolioArr / 1000).toFixed(0)}k ARR
            </span>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-[#161a2f] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-medium">Conglomerate Treasury</span>
            <span className="text-base font-black text-amber-300">
              ${Math.floor(conglomerateTreasury || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Synergies Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="font-bold">Conglomerate Synergies:</span>
            <span className="text-slate-400 text-[11px]">
              {companies.length >= 3 ? 'Shared Brand Trust (+10% Conversion) & Compute Bulk Discount (-20% Costs)' : 'Shared Talent Pool (+10% Agent Output)'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-purple-300">
            Synergy Level: <strong>{Math.max(1, companies.length)}x</strong>
          </div>
        </div>
      </div>

      {/* Portfolio Subsidiaries List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Portfolio Subsidiaries ({companies.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Click any company to assume operational command
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((sub) => {
            const autonomy = calcAutonomyInfo(sub);
            const isActive = sub.id === activeCompanyId;

            return (
              <div
                key={sub.id}
                className={`bg-[#131627] border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${
                  isActive
                    ? 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.25)] ring-1 ring-purple-500/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      {sub.idea.archetype}
                    </span>

                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${autonomy.badgeClass}`}>
                      {autonomy.title.split(':')[0]} ({autonomy.percent}% Auto)
                    </span>
                  </div>

                  {/* Company Name & Tagline */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-lg font-black text-white">{sub.name}</h4>
                      <p className="text-xs text-purple-200/80 italic font-medium mt-0.5">
                        "{sub.idea.tagline}"
                      </p>
                    </div>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold shrink-0">
                        ACTIVE HELM
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-2.5 line-clamp-2">
                    {sub.idea.description}
                  </p>

                  {/* Autonomy Level Progress Section */}
                  <div className="mt-4 p-3 rounded-xl bg-[#0d0f1a] border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[11px] font-bold">Autonomy Level:</span>
                      <span className="text-white font-bold">{autonomy.title}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          autonomy.level === 5
                            ? 'bg-emerald-400'
                            : autonomy.level >= 3
                            ? 'bg-cyan-400'
                            : 'bg-amber-400'
                        }`}
                        style={{ width: `${Math.max(5, autonomy.percent)}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-start gap-1.5 pt-0.5">
                      <TrendingUp className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{autonomy.nextRequirement}</span>
                    </div>
                  </div>

                  {/* Financial & Workforce Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-[#171b2d] p-2 rounded-lg border border-slate-850">
                      <span className="text-slate-500 text-[10px] block">VALUATION</span>
                      <span className="font-black text-purple-300">
                        ${sub.valuation >= 1000000 ? `${(sub.valuation / 1000000).toFixed(2)}M` : sub.valuation.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-[#171b2d] p-2 rounded-lg border border-slate-850">
                      <span className="text-slate-500 text-[10px] block">REVENUE</span>
                      <span className="font-black text-emerald-400">
                        ${(sub.arr / 1000).toFixed(0)}k ARR
                      </span>
                    </div>

                    <div className="bg-[#171b2d] p-2 rounded-lg border border-slate-850">
                      <span className="text-slate-500 text-[10px] block">CASH</span>
                      <span className="font-bold text-white">
                        ${Math.floor(sub.cash).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-[#171b2d] p-2 rounded-lg border border-slate-850">
                      <span className="text-slate-500 text-[10px] block">WORKFORCE</span>
                      <span className="font-bold text-cyan-300">
                        {sub.agents.length} Agents
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Take Operational Command & Wire Capital */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2">
                  {isActive ? (
                    <button
                      onClick={() => setActiveTab('command')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md"
                    >
                      <span>Command Center</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => switchActiveCompany(sub.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white font-bold text-xs transition-all border border-slate-700 hover:border-purple-500"
                    >
                      <span>Take Operational Helm</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => setInjectModalTarget(sub)}
                    className="p-2 rounded-xl bg-[#181c2f] hover:bg-[#222742] text-emerald-400 hover:text-emerald-300 border border-slate-700 transition-colors"
                    title="Inject Seed Capital"
                  >
                    <DollarSign className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Launch New Subsidiary Modal */}
      {isNewStartupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#111422] border border-purple-500/40 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.25)] text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div>
                <h3 className="text-lg font-black text-white tracking-wide">
                  LAUNCH SUBSIDIARY VENTURE
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a business model to launch as a new subsidiary under your autonomous holding umbrella.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChoices(getRandomStartupChoices(3))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Reroll Ideas</span>
                </button>
                <button
                  onClick={() => setIsNewStartupModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Seed Capital Allocation Picker */}
            <div className="bg-[#161a2d] border border-slate-800 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                    Seed Capital Allocation
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Wire funding from holding capital to kickstart agent hiring.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400">
                  Available: ${Math.floor(totalAvailableCapital).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                {[
                  { label: 'Bootstrap', amount: 2000 },
                  { label: 'Angel Seed', amount: 25000 },
                  { label: 'Series Seed', amount: 100000 },
                  { label: 'Growth Seed', amount: 500000 }
                ].map(opt => {
                  const isSelected = selectedSeedFunding === opt.amount;
                  const canAfford = totalAvailableCapital >= opt.amount;
                  return (
                    <button
                      key={opt.amount}
                      disabled={!canAfford && opt.amount > 2000}
                      onClick={() => setSelectedSeedFunding(opt.amount)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                          : canAfford
                          ? 'bg-[#1a1f36] border-slate-750 text-slate-300 hover:border-slate-600'
                          : 'bg-slate-900/40 border-slate-850 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-[11px] font-sans font-bold">{opt.label}</div>
                      <div className="font-bold text-emerald-400 mt-0.5">${opt.amount.toLocaleString()}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800">
                <input
                  type="checkbox"
                  id="switchImmediately"
                  checked={switchImmediately}
                  onChange={(e) => setSwitchImmediately(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="switchImmediately" className="text-xs text-slate-300 cursor-pointer">
                  Take operational command immediately upon founding (recommended)
                </label>
              </div>
            </div>

            {/* Idea Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {choices.map((idea) => (
                <div
                  key={idea.id}
                  onClick={() => handleLaunch(idea)}
                  className="group flex flex-col justify-between bg-[#171b2d] hover:bg-[#1f253d] border border-slate-800 hover:border-purple-500 rounded-xl p-5 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        {idea.archetype}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        ${idea.arpu}/mo ARPU
                      </span>
                    </div>

                    <h4 className="text-base font-black text-white group-hover:text-purple-300 transition-colors">
                      {idea.name}
                    </h4>
                    <p className="text-xs text-purple-200/80 italic mt-0.5">
                      "{idea.tagline}"
                    </p>

                    <p className="text-xs text-slate-400 mt-2.5 line-clamp-3">
                      {idea.description}
                    </p>
                  </div>

                  <button className="mt-5 w-full py-2 rounded-lg bg-purple-600 group-hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5">
                    <span>Found Subsidiary</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-[#141727] p-3 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                New subsidiaries start at <strong>Level 1 Autonomy (Manual Founder)</strong>. You can take operational command to vibe code, hire specialized agents, and guide it to <strong>Level 5 (Unicorn Autonomy)</strong>.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Capital Injection Modal */}
      {injectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#111422] border border-purple-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">
                  INJECT HOLDING CAPITAL
                </h3>
              </div>
              <button
                onClick={() => setInjectModalTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Transfer funds from holding treasury/active cash to subsidiary <strong>"{injectModalTarget.name}"</strong>.
            </p>

            <div className="bg-[#171b2d] p-3 rounded-xl border border-slate-800 space-y-1 mb-4 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Target Company Cash:</span>
                <span className="font-bold text-white">${Math.floor(injectModalTarget.cash).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Available Capital:</span>
                <span className="font-bold text-emerald-400">${Math.floor(totalAvailableCapital).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              <label className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Select Wire Amount
              </label>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                {[10000, 50000, 250000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setInjectAmount(amt)}
                    className={`py-2 rounded-lg border text-center transition-all ${
                      injectAmount === amt
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-[#181c2f] border-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    ${(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setInjectModalTarget(null)}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteInjection}
                disabled={totalAvailableCapital < injectAmount}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs transition-all ${
                  totalAvailableCapital >= injectAmount
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Wire ${injectAmount.toLocaleString()}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
