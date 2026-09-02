import React from 'react';
import { useGameStore, calcAutonomyInfo } from '../../state/gameStore';
import { FounderActions } from './FounderActions';
import { LiveActivityFeed } from './LiveActivityFeed';
import { ArrowRight, Building2 } from 'lucide-react';

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
    roadmapFeatures,
    activeRoadmapId,
    setActiveTab,
    companies
  } = useGameStore();

  const activeFeature = roadmapFeatures.find(f => f.id === activeRoadmapId);
  const bpPercent = (buildPoints / Math.max(1, buildPointsTarget)) * 100;
  const autonomy = calcAutonomyInfo({ agents, valuation, stage });

  return (
    <div className="space-y-5 text-left">
      {/* Stage Badge & Funnel Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Autonomy Tier & Stage Card */}
        <div className="bg-[#121522] border border-[#21273d] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Autonomy Tier</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${autonomy.badgeClass}`}>
                {autonomy.title.split(':')[0]} ({autonomy.percent}%)
              </span>
            </div>
            <div className="mt-2">
              <div className="text-base font-black text-white font-mono truncate">
                {autonomy.title.split(':')[1] || stage.replace('_', ' ')}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                {autonomy.subtitle}
              </p>
            </div>

            {/* Autonomy Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2.5">
              <div
                className={`h-full transition-all duration-300 ${
                  autonomy.level === 5 ? 'bg-emerald-400' : autonomy.level >= 3 ? 'bg-cyan-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.max(5, autonomy.percent)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-mono line-clamp-1">
              {autonomy.nextRequirement}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setActiveTab('agents')}
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-medium group"
            >
              <span>{agents.length} Active Agents</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            {companies && companies.length > 1 && (
              <button
                onClick={() => setActiveTab('holding')}
                className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                title="View holding portfolio"
              >
                <Building2 className="w-3 h-3" />
                <span>{companies.length} Cos</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Level Card */}
        <div className="bg-[#121522] border border-[#21273d] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Product Velocity</span>
            <span className="text-xs font-mono font-bold text-cyan-400">Level {productLevel}</span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>{Math.floor(buildPoints)} BP</span>
              <span className="text-slate-500">/ {buildPointsTarget} BP</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${bpPercent}%` }} />
            </div>
            {activeFeature && (
              <p className="text-[11px] text-slate-400 truncate mt-1.5 font-mono">
                Shipping: {activeFeature.name}
              </p>
            )}
          </div>
          <button
            onClick={() => setActiveTab('product')}
            className="mt-2 flex items-center justify-between text-xs text-cyan-400 hover:text-cyan-300 font-medium group"
          >
            <span>Roadmap & Debt</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Growth Funnel Card */}
        <div className="bg-[#121522] border border-[#21273d] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Customer Funnel</span>
            <span className="text-xs font-mono font-bold text-pink-400">{Math.floor(attention)} Att</span>
          </div>
          <div className="mt-2 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Leads:</span>
              <span className="font-bold text-amber-300">{Math.floor(leads)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Paying Users:</span>
              <span className="font-bold text-emerald-400">{Math.floor(customers)}</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('growth')}
            className="mt-3 flex items-center justify-between text-xs text-pink-400 hover:text-pink-300 font-medium group"
          >
            <span>Trends & Marketing</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Unit Economics Card */}
        <div className="bg-[#121522] border border-[#21273d] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Unit Economics</span>
            <span className="text-xs font-mono font-bold text-emerald-400">${mrr.toLocaleString()} MRR</span>
          </div>
          <div className="mt-2 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Gross Margin:</span>
              <span className="font-bold text-emerald-300">96.4%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Payroll Cost:</span>
              <span className="font-bold text-emerald-400">$0 / mo</span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('finance')}
            className="mt-3 flex items-center justify-between text-xs text-emerald-400 hover:text-emerald-300 font-medium group"
          >
            <span>P&L & VC Term Sheets</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Founder Actions */}
      <FounderActions />

      {/* Live Feed */}
      <LiveActivityFeed />
    </div>
  );
};
