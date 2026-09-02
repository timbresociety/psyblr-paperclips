import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { TECH_DEBT_REFACTORS } from '../../data/productFeatures';
import { Boxes, AlertTriangle, CheckCircle2, Wrench, Sparkles } from 'lucide-react';

export const ProductScreen: React.FC = () => {
  const {
    productLevel,
    buildPoints,
    buildPointsTarget,
    techDebt,
    roadmapFeatures,
    activeRoadmapId,
    setActiveRoadmap,
    executeTechDebtRefactor,
    architectureUpgrades,
    upgradeArchitecture,
    cash
  } = useGameStore();

  const bpPercent = Math.min(100, (buildPoints / Math.max(1, buildPointsTarget)) * 100);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'enterprise': return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'viral': return 'bg-pink-950 text-pink-300 border-pink-800';
      case 'retention': return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'monetization': return 'bg-yellow-950 text-yellow-300 border-yellow-800';
      case 'ai_magic': return 'bg-purple-950 text-purple-300 border-purple-800';
      default: return 'bg-cyan-950 text-cyan-300 border-cyan-800';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Product Level & Progress Header */}
      <div className="bg-[#111422] border border-[#20263c] rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-black tracking-tight text-white">
                PRODUCT PROGRESSION
              </h2>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                LEVEL {productLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Higher product level increases visitor-to-lead conversion and customer retention.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-slate-400">Build Points Progress:</span>
            <div className="text-base font-black font-mono text-cyan-300">
              {Math.floor(buildPoints).toLocaleString()} / {buildPointsTarget.toLocaleString()} BP
            </div>
          </div>
        </div>

        {/* BP Progress Bar */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
            style={{ width: `${bpPercent}%` }}
          />
        </div>
      </div>

      {/* 2-Column Grid: Roadmap Features & Tech Debt Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roadmap Features (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Feature Roadmap
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Click feature to assign engineering focus
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roadmapFeatures.map((feat) => {
              const isActive = activeRoadmapId === feat.id;
              const isDone = feat.isCompleted;
              const featPercent = Math.min(100, (feat.buildPointsCompleted / feat.buildPointsRequired) * 100);

              return (
                <div
                  key={feat.id}
                  onClick={() => !isDone && setActiveRoadmap(feat.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isDone
                      ? 'bg-[#131926]/60 border-emerald-800/40 opacity-80'
                      : isActive
                      ? 'bg-[#191e33] border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-[#151827] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getCategoryBadge(feat.category)}`}>
                        {feat.category.toUpperCase()}
                      </span>
                      {isDone ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> SHIPPED
                        </span>
                      ) : isActive ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700 font-bold animate-pulse">
                          ACTIVE FOCUS
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">
                          {feat.buildPointsRequired} BP
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-white text-sm">
                      {feat.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {feat.description}
                    </p>

                    {/* Effect Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {feat.effects.arpuBoost && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                          +${feat.effects.arpuBoost}/mo ARPU
                        </span>
                      )}
                      {feat.effects.conversionBoost && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/80">
                          +{Math.round(feat.effects.conversionBoost * 100)}% Conv
                        </span>
                      )}
                      {feat.effects.retentionBoost && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                          +{Math.round(feat.effects.retentionBoost * 100)}% Retention
                        </span>
                      )}
                      {feat.effects.viralityBoost && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-pink-950/80 text-pink-300 border border-pink-800/80">
                          +{Math.round(feat.effects.viralityBoost * 100)}% Virality
                        </span>
                      )}
                      {feat.id === 'feat_sso_saml' && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80">
                          🏢 UNLOCKS ENTERPRISE
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className="font-bold text-slate-200">{featPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isDone ? 'bg-emerald-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${featPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tech Debt Refactors & Architecture Upgrades (1 Col) */}
        <div className="space-y-5">
          {/* Tech Debt Overview Box */}
          <div className="bg-[#151724] border border-amber-900/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Technical Debt
              </span>
              <span className={`text-sm font-mono font-black ${techDebt > 60 ? 'text-rose-400' : 'text-amber-400'}`}>
                {techDebt.toFixed(0)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Fast vibe coding increases technical debt. High debt causes ticket surges, hallucinations, and lowers valuation multiple.
            </p>

            {/* Refactor Actions */}
            <div className="space-y-2">
              {TECH_DEBT_REFACTORS.map((task) => {
                const canAfford = cash >= task.cashCost && buildPoints >= task.buildPointsCost;

                return (
                  <button
                    key={task.id}
                    onClick={() => executeTechDebtRefactor(task.debtReduced, task.buildPointsCost, task.cashCost, task.name)}
                    disabled={!canAfford}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      canAfford
                        ? 'bg-[#1a1d2e] hover:bg-[#22273d] border-slate-700 hover:border-amber-500/50'
                        : 'bg-slate-900/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{task.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        -{task.debtReduced}% Debt
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-1">
                      <span>Cost: ${task.cashCost}</span>
                      <span>{task.buildPointsCost} BP</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Architecture Upgrades */}
          <div className="bg-[#121524] border border-[#1f253a] rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-cyan-400" /> Infrastructure Stability
            </h4>

            <div className="space-y-3">
              {architectureUpgrades.map((arch) => {
                const cost = Math.round(arch.cost * Math.pow(1.5, arch.level));
                const canUpgrade = cash >= cost && arch.level < arch.maxLevel;

                return (
                  <div key={arch.id} className="p-3 bg-[#181c2d] rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{arch.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        L{arch.level}/{arch.maxLevel}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{arch.description}</p>
                    
                    <button
                      onClick={() => upgradeArchitecture(arch.id)}
                      disabled={!canUpgrade}
                      className={`mt-2 w-full py-1 px-2 rounded text-[11px] font-bold font-mono transition-all ${
                        canUpgrade
                          ? 'bg-cyan-700 hover:bg-cyan-600 text-white'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {arch.level < arch.maxLevel ? `Upgrade ($${cost.toLocaleString()})` : 'Maxed Out'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
