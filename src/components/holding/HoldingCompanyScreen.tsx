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
import { soundEngine } from '../../audio/soundEffects';

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
    soundEngine.playCelebration();
    launchSubsidiary(idea, selectedSeedFunding, switchImmediately);
    setIsNewStartupModalOpen(false);
  };

  const handleExecuteInjection = () => {
    if (!injectModalTarget) return;
    soundEngine.playCash();
    const success = injectCapital(injectModalTarget.id, injectAmount);
    if (success) {
      setInjectModalTarget(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Holding Company Header Banner */}
      <div className="apple-card rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#5e5ce6]/15 text-[#5e5ce6] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h1 className="text-base font-semibold text-white tracking-tight">
                Autonomous Holding Conglomerate
              </h1>
            </div>
            <p className="text-xs text-white/50 mt-1.5 max-w-2xl leading-relaxed">
              Your autonomous conglomerate launches and operates independent AI startups. Take operational command of any subsidiary to guide it from <strong>Level 1 (Founder)</strong> to <strong>Level 5 (Unicorn Autonomy)</strong>.
            </p>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              setChoices(getRandomStartupChoices(3));
              setIsNewStartupModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl apple-btn-primary text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Subsidiary Venture</span>
          </button>
        </div>

        {/* Aggregate Conglomerate Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 mt-5 pt-5 border-t border-white/[0.06] font-mono text-xs">
          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 text-[10px] block uppercase font-sans">Total Conglomerate Value</span>
            <span className="text-sm font-semibold text-white tabular-nums mt-0.5 block">
              ${(totalPortfolioValuation / 1000000).toFixed(1)}M
            </span>
          </div>

          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 text-[10px] block uppercase font-sans">Portfolio Subsidiaries</span>
            <span className="text-sm font-semibold text-white tabular-nums mt-0.5 block">
              {companies.length} Startup{companies.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 text-[10px] block uppercase font-sans">Consolidated Agents</span>
            <span className="text-sm font-semibold text-white/80 tabular-nums mt-0.5 block">
              {totalAgents} Agents
            </span>
          </div>

          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 text-[10px] block uppercase font-sans">Consolidated ARR</span>
            <span className="text-sm font-semibold text-[#30d158] tabular-nums mt-0.5 block">
              ${(totalPortfolioArr / 1000).toFixed(0)}k ARR
            </span>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 apple-inset p-3 rounded-xl">
            <span className="text-white/40 text-[10px] block uppercase font-sans">Conglomerate Treasury</span>
            <span className="text-sm font-semibold text-white/90 tabular-nums mt-0.5 block">
              ${Math.floor(conglomerateTreasury || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Synergies Bar */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-white/70">
            <Zap className="w-3.5 h-3.5 text-[#ff9f0a]" />
            <span className="font-semibold text-white">Conglomerate Synergies:</span>
            <span className="text-white/40 text-[11px]">
              {companies.length >= 3 ? 'Shared Brand Trust (+10% Conversion) & Compute Bulk Discount (-20% Costs)' : 'Shared Talent Pool (+10% Agent Output)'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#ff9f0a]">
            Synergy Multiplier: <strong>{Math.max(1, companies.length)}x</strong>
          </div>
        </div>
      </div>

      {/* Portfolio Subsidiaries List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#5e5ce6]" />
            <span>Portfolio Subsidiaries ({companies.length})</span>
          </h2>
          <span className="text-[11px] text-white/40">
            Click any company to assume operational command
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((sub) => {
            const autonomy = calcAutonomyInfo(sub);
            const isActive = sub.id === activeCompanyId;

            return (
              <div
                key={sub.id}
                className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 border ${
                  isActive
                    ? 'apple-card border-[#0a84ff] ring-1 ring-[#0a84ff]/30 shadow-xs'
                    : 'apple-card hover:border-white/[0.14]'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.08]">
                      {sub.idea.archetype}
                    </span>

                    <span className={`text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full border ${autonomy.badgeClass}`}>
                      {autonomy.title.split(':')[0]} ({autonomy.percent}% Auto)
                    </span>
                  </div>

                  {/* Company Name & Tagline */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{sub.name}</h3>
                      <p className="text-[11px] text-white/50 italic mt-0.5 font-serif">
                        "{sub.idea.tagline}"
                      </p>
                    </div>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-[#0a84ff] text-white text-[10px] font-mono font-medium shrink-0 shadow-xs">
                        Active Helm
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-white/50 mt-2.5 line-clamp-2 leading-relaxed">
                    {sub.idea.description}
                  </p>

                  {/* Autonomy Level Progress Section */}
                  <div className="mt-4 p-3 rounded-xl apple-inset space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white/40 text-[10px] font-sans">Autonomy Level</span>
                      <span className="text-white font-medium">{autonomy.title}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          autonomy.level === 5
                            ? 'bg-[#30d158]'
                            : autonomy.level >= 3
                            ? 'bg-[#64d2ff]'
                            : 'bg-[#ff9f0a]'
                        }`}
                        style={{ width: `${Math.max(5, autonomy.percent)}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-white/40 flex items-start gap-1.5 pt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#30d158] shrink-0 mt-0.5" />
                      <span className="leading-tight">{autonomy.nextRequirement}</span>
                    </div>
                  </div>

                  {/* Financial & Workforce Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono tabular-nums">
                    <div className="apple-inset p-2 rounded-xl">
                      <span className="text-white/40 text-[10px] font-sans block uppercase">Valuation</span>
                      <span className="font-semibold text-white">
                        ${sub.valuation >= 1000000 ? `${(sub.valuation / 1000000).toFixed(2)}M` : sub.valuation.toLocaleString()}
                      </span>
                    </div>

                    <div className="apple-inset p-2 rounded-xl">
                      <span className="text-white/40 text-[10px] font-sans block uppercase">Revenue</span>
                      <span className="font-semibold text-[#30d158]">
                        ${(sub.arr / 1000).toFixed(0)}k ARR
                      </span>
                    </div>

                    <div className="apple-inset p-2 rounded-xl">
                      <span className="text-white/40 text-[10px] font-sans block uppercase">Cash</span>
                      <span className="font-semibold text-white/90">
                        ${Math.floor(sub.cash).toLocaleString()}
                      </span>
                    </div>

                    <div className="apple-inset p-2 rounded-xl">
                      <span className="text-white/40 text-[10px] font-sans block uppercase">Workforce</span>
                      <span className="font-semibold text-white">
                        {sub.agents.length} Agents
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Take Operational Command & Wire Capital */}
                <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center gap-2">
                  {isActive ? (
                    <button
                      onClick={() => { soundEngine.playClick(); setActiveTab('command'); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl apple-btn-primary text-xs transition-all shadow-sm"
                    >
                      <span>Command Center</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { soundEngine.playClick(); switchActiveCompany(sub.id); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl apple-btn-secondary text-xs transition-all"
                    >
                      <span>Take Operational Helm</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => { soundEngine.playClick(); setInjectModalTarget(sub); }}
                    className="p-1.5 rounded-xl apple-btn-secondary transition-colors"
                    title="Inject Seed Capital"
                  >
                    <DollarSign className="w-4 h-4 text-[#30d158]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Launch New Subsidiary Modal */}
      {isNewStartupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
          <div className="apple-card rounded-2xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Launch Subsidiary Venture
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Select a business model to launch as a new subsidiary under your autonomous holding umbrella.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { soundEngine.playClick(); setChoices(getRandomStartupChoices(3)); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl apple-btn-secondary transition-colors font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#ff9f0a]" />
                  <span>Reroll Ideas</span>
                </button>
                <button
                  onClick={() => setIsNewStartupModalOpen(false)}
                  className="p-1.5 rounded-xl text-white/40 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Seed Capital Allocation Picker */}
            <div className="apple-inset rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-semibold text-white/80">
                    Seed Capital Allocation
                  </span>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Wire funding from holding capital to kickstart agent hiring.
                  </p>
                </div>
                <span className="text-xs font-mono text-white/90 font-medium tabular-nums">
                  Available: ${Math.floor(totalAvailableCapital).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs tabular-nums">
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
                      onClick={() => { soundEngine.playClick(); setSelectedSeedFunding(opt.amount); }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#0a84ff] border-[#0a84ff] text-white shadow-xs'
                          : canAfford
                          ? 'apple-card text-white/80 hover:border-white/[0.14]'
                          : 'bg-white/[0.02] border-white/[0.04] text-white/30 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-[11px] font-sans font-medium">{opt.label}</div>
                      <div className={`font-semibold mt-0.5 ${isSelected ? 'text-white' : 'text-[#30d158]'}`}>${opt.amount.toLocaleString()}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                <input
                  type="checkbox"
                  id="switchImmediately"
                  checked={switchImmediately}
                  onChange={(e) => setSwitchImmediately(e.target.checked)}
                  className="rounded border-white/[0.2] bg-black/40 text-[#0a84ff] focus:ring-[#0a84ff]"
                />
                <label htmlFor="switchImmediately" className="text-xs text-white/70 cursor-pointer">
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
                  className="group flex flex-col justify-between apple-inset hover:border-white/[0.2] rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/[0.08]">
                        {idea.archetype}
                      </span>
                      <span className="text-xs font-mono font-medium text-[#30d158] tabular-nums">
                        ${idea.arpu}/mo ARPU
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-white group-hover:text-white transition-colors">
                      {idea.name}
                    </h4>
                    <p className="text-[11px] text-white/50 italic mt-0.5 font-serif">
                      "{idea.tagline}"
                    </p>

                    <p className="text-xs text-white/50 mt-2.5 line-clamp-3 leading-relaxed">
                      {idea.description}
                    </p>
                  </div>

                  <button className="mt-5 w-full py-1.5 rounded-xl apple-btn-primary text-xs font-medium transition-all shadow-sm flex items-center justify-center gap-1.5">
                    <span>Found Subsidiary</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="apple-inset p-3 rounded-xl text-xs text-white/50 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#30d158] shrink-0" />
              <span>
                New subsidiaries start at <strong>Level 1 Autonomy (Founder)</strong>. You can take operational command to vibe code, hire specialized agents, and guide it to <strong>Level 5 (Unicorn Autonomy)</strong>.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Capital Injection Modal */}
      {injectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
          <div className="apple-card rounded-2xl max-w-md w-full p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#30d158]" />
                <h3 className="text-sm font-semibold text-white">
                  Inject Holding Capital
                </h3>
              </div>
              <button
                onClick={() => setInjectModalTarget(null)}
                className="p-1 rounded-xl text-white/40 hover:text-white bg-white/[0.06] hover:bg-white/[0.12]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/50 mb-4">
              Transfer funds from holding treasury/active cash to subsidiary <strong>"{injectModalTarget.name}"</strong>.
            </p>

            <div className="apple-inset p-3 rounded-xl space-y-1 mb-4 font-mono text-xs tabular-nums">
              <div className="flex justify-between text-white/40">
                <span>Target Company Cash:</span>
                <span className="font-semibold text-white">${Math.floor(injectModalTarget.cash).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-white/40">
                <span>Total Available Capital:</span>
                <span className="font-semibold text-white">${Math.floor(totalAvailableCapital).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              <label className="text-xs font-medium text-white/70">
                Select Wire Amount
              </label>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs tabular-nums">
                {[10000, 50000, 250000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => { soundEngine.playClick(); setInjectAmount(amt); }}
                    className={`py-2 rounded-xl border text-center transition-all ${
                      injectAmount === amt
                        ? 'bg-[#0a84ff] border-[#0a84ff] text-white font-medium shadow-xs'
                        : 'apple-inset text-white/80 hover:border-white/[0.14]'
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
                className="flex-1 py-1.5 rounded-xl apple-btn-secondary text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteInjection}
                disabled={totalAvailableCapital < injectAmount}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl font-medium text-xs transition-all ${
                  totalAvailableCapital >= injectAmount
                    ? 'apple-btn-primary'
                    : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
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
