import React from 'react';
import { useGameStore, calcAutonomyInfo } from '../../state/gameStore';
import { FounderActions } from './FounderActions';
import { LiveActivityFeed } from './LiveActivityFeed';
import { ArrowRight, Building2, DollarSign, Cpu, TrendingUp, Sparkles, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

export const CommandCenter: React.FC = () => {
  const {
    stage,
    valuation,
    productLevel,
    buildPoints,
    buildPointsTarget,
    attention,
    leads,
    customers,
    mrr,
    agents,
    techDebt,
    roadmapFeatures,
    activeRoadmapId,
    setActiveTab,
    companies
  } = useGameStore();

  const activeFeature = roadmapFeatures.find(f => f.id === activeRoadmapId);
  const bpPercent = (buildPoints / Math.max(1, buildPointsTarget)) * 100;
  const autonomy = calcAutonomyInfo({ agents, valuation, stage });

  const handleTabJump = (tab: any) => {
    soundEngine.playClick();
    setActiveTab(tab);
  };

  return (
    <div className="space-y-5 text-left">
      {/* 4 Mission Control Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Autonomy Matrix */}
        <div className="apple-card rounded-2xl p-4 flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white/50 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#5e5ce6]" />
                Autonomy
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-medium bg-white/[0.06] text-white/80 border border-white/[0.08]">
                Tier {autonomy.level} ({autonomy.percent}%)
              </span>
            </div>

            <div className="mt-3">
              <div className="text-base font-semibold text-white tracking-tight truncate">
                {autonomy.title.split(':')[1] || stage.replace('_', ' ')}
              </div>
              <p className="text-xs text-white/50 mt-0.5 line-clamp-1">
                {autonomy.subtitle}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-3">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  autonomy.level === 5 ? 'bg-[#30d158]' : 'bg-[#5e5ce6]'
                }`}
                style={{ width: `${Math.max(5, autonomy.percent)}%` }}
              />
            </div>
            <p className="text-[11px] text-white/40 mt-2 font-mono line-clamp-1">
              Req: {autonomy.nextRequirement}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <button
              onClick={() => handleTabJump('agents')}
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white font-medium transition-colors"
            >
              <span>{agents.length} Active Agents</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {companies && companies.length > 1 && (
              <button
                onClick={() => handleTabJump('holding')}
                className="text-[11px] font-mono text-white/40 hover:text-white/80 flex items-center gap-1"
                title="View holding portfolio"
              >
                <Building2 className="w-3 h-3" />
                <span>{companies.length} Subs</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Product Velocity */}
        <div className="apple-card rounded-2xl p-4 flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white/50 flex items-center gap-1.5 uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-[#64d2ff]" />
                Product Velocity
              </span>
              <span className="text-xs font-mono font-medium text-white/70">Lvl {productLevel}</span>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs text-white/80 mb-1">
                <span className="font-mono font-semibold text-white tabular-nums">{Math.floor(buildPoints)} BP</span>
                <span className="text-white/40 font-mono">/ {buildPointsTarget} BP</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-[#64d2ff] transition-all duration-200 rounded-full" style={{ width: `${Math.min(100, bpPercent)}%` }} />
              </div>
              {activeFeature ? (
                <p className="text-xs text-white/70 truncate mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#64d2ff]" />
                  <span className="truncate">{activeFeature.name}</span>
                </p>
              ) : (
                <p className="text-xs text-white/40 mt-2">
                  All sprint tickets resolved
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <button
              onClick={() => handleTabJump('product')}
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white font-medium transition-colors"
            >
              <span>Roadmap Tree</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
            </button>
            {techDebt > 30 && (
              <span className={`flex items-center gap-1 text-[11px] font-mono font-medium ${techDebt > 60 ? 'text-[#ff453a]' : 'text-[#ff9f0a]'}`}>
                <ShieldAlert className="w-3 h-3" /> Debt {techDebt.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* 3. Growth Funnel */}
        <div className="apple-card rounded-2xl p-4 flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white/50 flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-[#bf5af2]" />
                Growth Funnel
              </span>
              <span className="text-xs font-mono font-medium text-white/80 tabular-nums">{Math.floor(attention)} Att</span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between items-center bg-white/[0.03] px-2.5 py-1.5 rounded-xl border border-white/[0.04]">
                <span className="text-white/50">Marketing Leads</span>
                <span className="font-mono font-semibold text-white tabular-nums">{Math.floor(leads)}</span>
              </div>
              <div className="flex justify-between items-center bg-white/[0.03] px-2.5 py-1.5 rounded-xl border border-white/[0.04]">
                <span className="text-white/50">Paying Customers</span>
                <span className="font-mono font-semibold text-white tabular-nums">{Math.floor(customers)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => handleTabJump('growth')}
              className="flex items-center justify-between w-full text-xs text-white/70 hover:text-white font-medium transition-colors"
            >
              <span>Trends &amp; Campaigns</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 4. Unit Economics */}
        <div className="apple-card rounded-2xl p-4 flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white/50 flex items-center gap-1.5 uppercase tracking-wider">
                <DollarSign className="w-3.5 h-3.5 text-[#30d158]" />
                Unit Economics
              </span>
              <span className="text-xs font-mono font-semibold text-[#30d158] tabular-nums">${mrr.toLocaleString()} MRR</span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between items-center bg-white/[0.03] px-2.5 py-1.5 rounded-xl border border-white/[0.04]">
                <span className="text-white/50">Gross Margin</span>
                <span className="font-mono font-semibold text-white/90">96.4%</span>
              </div>
              <div className="flex justify-between items-center bg-white/[0.03] px-2.5 py-1.5 rounded-xl border border-white/[0.04]">
                <span className="text-white/50">Payroll OPEX</span>
                <span className="font-mono font-semibold text-white/90">$0.00 / mo</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <button
              onClick={() => handleTabJump('finance')}
              className="flex items-center justify-between w-full text-xs text-white/70 hover:text-white font-medium transition-colors"
            >
              <span>P&amp;L &amp; Term Sheets</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Founder Tactical Actions Deck */}
      <FounderActions />

      {/* Live Mission Control Terminal Log Stream */}
      <LiveActivityFeed />
    </div>
  );
};

