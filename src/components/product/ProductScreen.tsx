import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { TECH_DEBT_REFACTORS } from '../../data/productFeatures';
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Sparkles,
  Zap,
  Gauge,
  UserMinus,
  Activity,
  Cpu,
  ShieldCheck
} from 'lucide-react';

import { soundEngine } from '../../audio/soundEffects';

const getUpgradeImpact = (arch: { id: string; level: number; maxLevel: number }) => {
  const isCiCd = arch.id.includes('ci_cd') || arch.id.includes('cicd');
  const isCaching = arch.id.includes('caching') || arch.id.includes('redis');

  if (isCiCd) {
    const currentReduction = arch.level * 15;
    const nextReduction = Math.min(75, (arch.level + 1) * 15);
    return {
      icon: Cpu,
      color: 'text-[#bf5af2]',
      bg: 'bg-[#bf5af2]/10',
      border: 'border-[#bf5af2]/20',
      tag: 'TECH DEBT SHIELD',
      currentBuff: arch.level > 0 ? `-${currentReduction}% Tech Debt generated from agent code sprints` : 'Inactive (0% reduction)',
      nextBuff: arch.level < arch.maxLevel ? `-${nextReduction}% Tech Debt per sprint` : null,
      gameplaySummary: 'Engineering agents generate far less technical debt per story shipped, preventing codebase drag and outages.'
    };
  }

  if (isCaching) {
    const currentReduction = arch.level * 10;
    const nextReduction = Math.min(50, (arch.level + 1) * 10);
    return {
      icon: Zap,
      color: 'text-[#30d158]',
      bg: 'bg-[#30d158]/10',
      border: 'border-[#30d158]/20',
      tag: 'COMPUTE OPTIMIZER',
      currentBuff: arch.level > 0 ? `-${currentReduction}% Swarm Compute consumption & API latency` : 'Inactive (0% reduction)',
      nextBuff: arch.level < arch.maxLevel ? `-${nextReduction}% Compute load` : null,
      gameplaySummary: 'Absorbs database queries in RAM to slash GPU token consumption and prevent API rate-limiting during agent spikes.'
    };
  }

  // Chaos testing
  const currentReduction = arch.level * 15;
  const nextReduction = Math.min(75, (arch.level + 1) * 15);
  return {
    icon: ShieldCheck,
    color: 'text-[#ff9f0a]',
    bg: 'bg-[#ff9f0a]/10',
    border: 'border-[#ff9f0a]/20',
    tag: 'RELIABILITY & TRUST',
    currentBuff: arch.level > 0 ? `-${currentReduction}% Customer support tickets & outage churn` : 'Inactive (0% reduction)',
    nextBuff: arch.level < arch.maxLevel ? `-${nextReduction}% Tickets & churn` : null,
    gameplaySummary: 'Proactively hardens software against bugs, drastically cutting customer ticket volume and preventing cancellations.'
  };
};

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
    quickRefactorManual,
    architectureUpgrades,
    upgradeArchitecture,
    cash,
    focus,
    agents
  } = useGameStore();

  const bpPercent = Math.min(100, (buildPoints / Math.max(1, buildPointsTarget)) * 100);
  const engAgents = agents.filter(a => a.role === 'ENGINEERING');
  const allFeaturesCompleted = roadmapFeatures.length > 0 && roadmapFeatures.every(f => f.isCompleted);
  const completedCount = roadmapFeatures.filter(f => f.isCompleted).length;


  // Exact Mechanical Consequences of Tech Debt
  const velocityDragPct = Math.round((1 - Math.max(0.20, 1 - (techDebt / 100) * 0.70)) * 100);
  const churnSpikePct = Math.round(Math.pow(techDebt / 45, 2) * 100);
  const outageRisk = techDebt > 70 ? 'CRITICAL' : techDebt > 45 ? 'ELEVATED' : 'NOMINAL';
  const outageRiskColor = techDebt > 70 ? 'text-[#ff453a]' : techDebt > 45 ? 'text-[#ff9f0a]' : 'text-[#30d158]';

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
      {/* Product Level & Autonomous Agile Header */}
      <div className="apple-card rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#64d2ff]/15 text-[#64d2ff] flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-white tracking-tight">
                    Product Architecture &amp; Pipeline
                  </h1>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.08]">
                    Level {productLevel}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Autonomous sprint velocity directly compounds customer conversion, retention, and blended ARPU.
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

        {/* Autonomous Agile Pipeline Status Toast */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#30d158] animate-pulse" />
            <span className="font-semibold text-white/80">Autonomous Sprint Dispatch:</span>
            <span className="text-white/50">
              {engAgents.length > 0
                ? `${engAgents.length} Engineering Agent(s) automatically pull &amp; build the next feature in the queue.`
                : 'Solo founder coding. Hire Engineering Agents in the Workforce tab to automate 24/7 feature delivery.'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#64d2ff]">
            Auto-Queue Active
          </span>
        </div>
      </div>

      {/* 2-Column Grid: Roadmap Features & Tech Debt Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roadmap Features (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#64d2ff]" />
              <span>Feature Roadmap Queue</span>
            </h2>
            <span className="text-[11px] text-white/40">
              {allFeaturesCompleted ? 'All Core Epics Complete' : 'Auto-dispatched sequentially · Click to prioritize'}
            </span>
          </div>

          {allFeaturesCompleted && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#30d158]/15 via-[#0a84ff]/10 to-transparent border border-[#30d158]/30 space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#30d158]/20 text-[#30d158] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Entire Product Roadmap Shipped! ({completedCount}/{roadmapFeatures.length} Features Active)
                  </h3>
                  <p className="text-[11px] text-[#30d158] font-mono font-medium">
                    All conversion boosts, ARPU multipliers, and viral retention loops are 100% active in production.
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed pl-10.5">
                Your Engineering Swarm has transitioned to <strong className="text-white">Autonomous Maintenance Mode</strong>: continuously burning down Tech Debt and stabilizing architecture to minimize customer churn.
              </p>
            </div>
          )}

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
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] animate-pulse" />
                          Building Now
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
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06]">
                    <div className="flex justify-between text-[11px] font-mono text-white/40 mb-1">
                      <span>{isActive ? 'Active Sprint Build' : isDone ? 'Complete' : 'Queued'}</span>
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
          {/* Tech Debt Health & Real Impact Breakdown Box */}
          <div className="apple-card rounded-2xl p-4 space-y-3.5 border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#ff9f0a] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#ff9f0a]" /> Tech Debt Impact
              </span>
              <span className={`text-base font-mono font-bold tabular-nums ${techDebt > 60 ? 'text-[#ff453a]' : techDebt > 30 ? 'text-[#ff9f0a]' : 'text-[#30d158]'}`}>
                {techDebt.toFixed(0)}%
              </span>
            </div>

            {/* Impact Metrics Matrix */}
            <div className="apple-inset rounded-xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#64d2ff]" />
                  Velocity Drag:
                </span>
                <span className={`font-mono font-semibold ${velocityDragPct > 35 ? 'text-[#ff453a]' : 'text-white/90'}`}>
                  -{velocityDragPct}% Build Speed
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1.5">
                  <UserMinus className="w-3.5 h-3.5 text-[#ff9f0a]" />
                  Customer Churn:
                </span>
                <span className={`font-mono font-semibold ${churnSpikePct > 100 ? 'text-[#ff453a]' : 'text-white/90'}`}>
                  +{churnSpikePct}% Churn Spike
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#bf5af2]" />
                  Outage Risk:
                </span>
                <span className={`font-mono font-bold ${outageRiskColor}`}>
                  {outageRisk}
                </span>
              </div>
            </div>

            {/* Plain English Explainer */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/60 leading-relaxed space-y-1">
              <span className="font-semibold text-white/90 block">Why Tech Debt Matters Now:</span>
              <p>
                As features ship, technical shortcuts accumulate. At <strong className="text-[#ff453a]">{techDebt.toFixed(0)}% debt</strong>, software bugs cause customers to rage-quit <strong className="text-[#ff453a]">(+{churnSpikePct}% Churn Spike)</strong>.
              </p>
              <p className="text-white/40">
                Run the Refactor Sprints below or let your engineers auto-refactor to crush debt to 0% and protect recurring revenue.
              </p>
            </div>

            {/* Quick Founder Hotfix Button */}
            <button
              onClick={() => {
                soundEngine.playDeploy();
                quickRefactorManual();
              }}
              disabled={focus < 1 || techDebt <= 0}
              className="w-full py-2 px-3 rounded-xl bg-[#ff9f0a]/15 hover:bg-[#ff9f0a]/25 text-[#ff9f0a] border border-[#ff9f0a]/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Founder Hotfix (-8% Debt, 1 Focus)</span>
            </button>

            {/* Refactor Engineering Tasks */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider block">
                  Engineering Refactor Sprints
                </span>
                <span className="text-[10px] text-white/40 font-mono">
                  Wipes Out Churn
                </span>
              </div>


              {TECH_DEBT_REFACTORS.map((task) => {
                const canAfford = cash >= task.cashCost || buildPoints >= task.buildPointsCost;

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
                        ? 'apple-inset hover:border-white/[0.2] hover:bg-white/[0.04]'
                        : 'bg-white/[0.02] border-white/[0.04] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{task.name}</span>
                      <span className="text-[10px] font-mono text-[#30d158] font-bold tabular-nums">
                        -{task.debtReduced}% Debt
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-white/40 mt-1 tabular-nums">
                      <span>Cost: ${task.cashCost} Cash</span>
                      <span>OR {task.buildPointsCost} BP</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Architecture Upgrades */}
          <div className="apple-card rounded-2xl p-4 space-y-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#64d2ff]" /> Infrastructure Stability
              </h3>
              <p className="text-[11px] text-white/40 mt-0.5">
                Permanent architectural upgrades that suppress tech debt, slash compute load, and prevent customer churn.
              </p>
            </div>

            <div className="space-y-3">
              {architectureUpgrades.map((arch) => {
                const cost = Math.round(arch.cost * Math.pow(1.5, arch.level));
                const canUpgrade = cash >= cost && arch.level < arch.maxLevel;
                const impact = getUpgradeImpact(arch);
                const IconComponent = impact.icon;

                return (
                  <div key={arch.id} className="p-3.5 apple-inset rounded-xl space-y-2.5">
                    {/* Header: Icon, Name, Category Tag & Level Pips */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${impact.bg} ${impact.color} flex items-center justify-center border ${impact.border} shrink-0`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-white">{arch.name}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${impact.bg} ${impact.color} ${impact.border} font-medium`}>
                              {impact.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                            {arch.description}
                          </p>
                        </div>
                      </div>

                      {/* Level Pips */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.08] tabular-nums font-semibold">
                          Lv.{arch.level}/{arch.maxLevel}
                        </span>
                        <div className="flex items-center gap-1 mt-1.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`h-1.5 w-2 rounded-xs transition-colors ${
                                arch.level >= lvl
                                  ? 'bg-[#30d158]'
                                  : 'bg-white/[0.12]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Active Gameplay Buff Banner (Self-Explanatory & High-Contrast) */}
                    <div className={`p-2.5 rounded-lg border ${
                      arch.level > 0
                        ? 'bg-[#30d158]/5 border-[#30d158]/20 text-[#30d158]'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/40'
                    }`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-white/60">
                          Active Gameplay Buff
                        </span>
                        <span className="font-semibold font-mono text-[11px] tabular-nums">
                          {impact.currentBuff}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60 mt-1 leading-snug">
                        {impact.gameplaySummary}
                      </p>
                      {impact.nextBuff && (
                        <div className="text-[10px] font-mono text-white/40 mt-1.5 pt-1.5 border-t border-white/[0.06] flex items-center justify-between">
                          <span>Next Level Benefit:</span>
                          <span className="text-white/80 font-medium">{impact.nextBuff}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <button
                      onClick={() => { soundEngine.playClick(); upgradeArchitecture(arch.id); }}
                      disabled={!canUpgrade}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        arch.level >= arch.maxLevel
                          ? 'bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20 cursor-default font-medium'
                          : canUpgrade
                          ? 'apple-btn-secondary font-semibold hover:border-white/[0.2]'
                          : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
                      }`}
                    >
                      {arch.level < arch.maxLevel
                        ? `Upgrade to Lv.${arch.level + 1} ($${cost.toLocaleString()})`
                        : '✓ Maxed Out (Maximum Stability Active)'}
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
