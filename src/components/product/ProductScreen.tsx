import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { TECH_DEBT_REFACTORS } from '../../data/productFeatures';
import { Boxes, AlertTriangle, CheckCircle2, Wrench, Sparkles } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

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
      case 'enterprise': return 'bg-[#5e5ce6]/15 text-[#5e5ce6] border-[#5e5ce6]/30';
      case 'viral': return 'bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/30';
      case 'retention': return 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30';
      case 'monetization': return 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30';
      case 'ai_magic': return 'bg-[#64d2ff]/15 text-[#64d2ff] border-[#64d2ff]/30';
      default: return 'bg-white/[0.06] text-white/70 border-white/[0.08]';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Product Level & Progress Header */}
      <div className="apple-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#64d2ff]/15 text-[#64d2ff] flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-white tracking-tight">
                    Product Progression
                  </h1>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.08]">
                    Level {productLevel}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Higher product velocity increases lead conversion and customer lifetime retention.
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-sans text-white/40 block">Build Points Progress</span>
            <div className="text-sm font-semibold font-mono text-white tabular-nums mt-0.5">
              {Math.floor(buildPoints).toLocaleString()} / {buildPointsTarget.toLocaleString()} BP
            </div>
          </div>
        </div>

        {/* BP Progress Bar */}
        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#64d2ff] transition-all duration-300 rounded-full"
            style={{ width: `${bpPercent}%` }}
          />
        </div>
      </div>

      {/* 2-Column Grid: Roadmap Features & Tech Debt Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roadmap Features (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#64d2ff]" />
              <span>Feature Roadmap Tree</span>
            </h2>
            <span className="text-[11px] text-white/40">
              Click a feature to focus engineering swarm
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {roadmapFeatures.map((feat) => {
              const isActive = activeRoadmapId === feat.id;
              const isDone = feat.isCompleted;
              const featPercent = Math.min(100, (feat.buildPointsCompleted / feat.buildPointsRequired) * 100);

              return (
                <div
                  key={feat.id}
                  onClick={() => {
                    if (!isDone) {
                      soundEngine.playClick();
                      setActiveRoadmap(feat.id);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isDone
                      ? 'apple-inset opacity-75 cursor-default'
                      : isActive
                      ? 'bg-[#0a84ff]/10 border-[#0a84ff] ring-1 ring-[#0a84ff]/40 shadow-sm cursor-pointer'
                      : 'apple-card hover:border-white/[0.14] cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${getCategoryBadge(feat.category)}`}>
                        {feat.category}
                      </span>
                      {isDone ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-[#30d158]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Shipped
                        </span>
                      ) : isActive ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#0a84ff]/20 text-[#0a84ff] border border-[#0a84ff]/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] animate-status-dot" />
                          Active Sprint
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-white/40 tabular-nums">
                          {feat.buildPointsRequired} BP
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-white text-xs tracking-tight">
                      {feat.name}
                    </h3>
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                      {feat.description}
                    </p>

                    {/* Effect Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {feat.effects.arpuBoost && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20">
                          +${feat.effects.arpuBoost}/mo ARPU
                        </span>
                      )}
                      {feat.effects.conversionBoost && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20">
                          +{Math.round(feat.effects.conversionBoost * 100)}% Conv
                        </span>
                      )}
                      {feat.effects.retentionBoost && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#64d2ff]/10 text-[#64d2ff] border border-[#64d2ff]/20">
                          +{Math.round(feat.effects.retentionBoost * 100)}% Retention
                        </span>
                      )}
                      {feat.effects.viralityBoost && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#bf5af2]/10 text-[#bf5af2] border border-[#bf5af2]/20">
                          +{Math.round(feat.effects.viralityBoost * 100)}% Virality
                        </span>
                      )}
                      {feat.id === 'feat_sso_saml' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5e5ce6]/10 text-[#5e5ce6] border border-[#5e5ce6]/20">
                          Enterprise Tier
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06]">
                    <div className="flex justify-between text-[11px] font-mono text-white/40 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold text-white/80 tabular-nums">{featPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isDone ? 'bg-[#30d158]' : isActive ? 'bg-[#0a84ff]' : 'bg-[#64d2ff]'
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
          <div className="apple-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#ff9f0a] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#ff9f0a]" /> Technical Debt
              </span>
              <span className={`text-sm font-mono font-semibold tabular-nums ${techDebt > 60 ? 'text-[#ff453a]' : 'text-[#ff9f0a]'}`}>
                {techDebt.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Rapid vibe coding increases technical debt. High debt causes ticket surges, hallucinations, and decreases valuation.
            </p>

            {/* Refactor Actions */}
            <div className="space-y-2">
              {TECH_DEBT_REFACTORS.map((task) => {
                const canAfford = cash >= task.cashCost && buildPoints >= task.buildPointsCost;

                return (
                  <button
                    key={task.id}
                    onClick={() => {
                      soundEngine.playDeploy();
                      executeTechDebtRefactor(task.debtReduced, task.buildPointsCost, task.cashCost, task.name);
                    }}
                    disabled={!canAfford}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      canAfford
                        ? 'apple-inset hover:border-white/[0.15] hover:bg-white/[0.04]'
                        : 'bg-white/[0.02] border-white/[0.04] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{task.name}</span>
                      <span className="text-[10px] font-mono text-[#30d158] font-semibold tabular-nums">
                        -{task.debtReduced}% Debt
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-white/40 mt-1 tabular-nums">
                      <span>Cost: ${task.cashCost.toLocaleString()}</span>
                      <span>{task.buildPointsCost} BP</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Architecture Upgrades */}
          <div className="apple-card rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#64d2ff]" /> Infrastructure Stability
            </h3>

            <div className="space-y-2.5">
              {architectureUpgrades.map((arch) => {
                const cost = Math.round(arch.cost * Math.pow(1.5, arch.level));
                const canUpgrade = cash >= cost && arch.level < arch.maxLevel;

                return (
                  <div key={arch.id} className="p-3 apple-inset rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{arch.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.08] tabular-nums">
                        Lv.{arch.level}/{arch.maxLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">{arch.description}</p>
                    
                    <button
                      onClick={() => { soundEngine.playClick(); upgradeArchitecture(arch.id); }}
                      disabled={!canUpgrade}
                      className={`mt-2.5 w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                        canUpgrade
                          ? 'apple-btn-secondary'
                          : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
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

