import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { Code, Share2, DollarSign, LifeBuoy, Zap, Bot } from 'lucide-react';

export const FounderActions: React.FC = () => {
  const {
    focus,
    maxFocus,
    vibeCodeManual,
    postManual,
    sellManual,
    supportManual,
    agents,
    leads,
    attention,
    tickets
  } = useGameStore();

  const hasEngAgent = agents.some(a => a.role === 'ENGINEERING');
  const hasGrowthAgent = agents.some(a => a.role === 'GROWTH');
  const hasSalesAgent = agents.some(a => a.role === 'SALES');
  const hasSupportAgent = agents.some(a => a.role === 'SUPPORT');

  const focusPercent = Math.min(100, Math.max(0, (focus / maxFocus) * 100));

  return (
    <div className="bg-[#121522] border border-[#21273d] rounded-xl p-4 sm:p-5">
      {/* Focus Gauge Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
            Founder Focus
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-amber-300">
            {focus.toFixed(1)} / {maxFocus}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">(+0.5 / sec)</span>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-150"
          style={{ width: `${focusPercent}%` }}
        />
      </div>

      {/* 4 Core Founder Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. VIBE CODE */}
        <div className="relative group flex flex-col justify-between bg-[#181c2e] hover:bg-[#1f243b] border border-slate-800 hover:border-purple-500/50 rounded-xl p-4 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-300">
                <Code className="w-4 h-4" />
              </div>
              {hasEngAgent ? (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  <Bot className="w-3 h-3 text-emerald-400" /> MANAGED
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400">1 Focus</span>
              )}
            </div>

            <h4 className="text-sm font-bold text-white">VIBE CODE</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              +15 BP, +2.0% Tech Debt. Rapid prototyping with heavy debt accumulation.
            </p>
          </div>

          <button
            onClick={vibeCodeManual}
            disabled={focus < 1}
            className={`mt-4 w-full py-2 px-3 rounded-lg font-bold text-xs tracking-wide transition-all ${
              focus >= 1
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md hover:shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            {hasEngAgent ? 'Assist Agent (+15 BP)' : 'Vibe Code (1 Focus)'}
          </button>
        </div>

        {/* 2. POST */}
        <div className="relative group flex flex-col justify-between bg-[#181c2e] hover:bg-[#1f243b] border border-slate-800 hover:border-pink-500/50 rounded-xl p-4 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-pink-950/60 border border-pink-800/60 text-pink-300">
                <Share2 className="w-4 h-4" />
              </div>
              {hasGrowthAgent ? (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  <Bot className="w-3 h-3 text-emerald-400" /> MANAGED
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400">1 Focus</span>
              )}
            </div>

            <h4 className="text-sm font-bold text-white">POST</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Viral social post. Diminishing returns as audience saturates; hire Growth Agents for scale.
            </p>
          </div>

          <button
            onClick={() => postManual()}
            disabled={focus < 1}
            className={`mt-4 w-full py-2 px-3 rounded-lg font-bold text-xs tracking-wide transition-all ${
              focus >= 1
                ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-md hover:shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            {hasGrowthAgent ? 'Drop Viral Thread' : 'Post Content (1 Focus)'}
          </button>
        </div>

        {/* 3. SELL */}
        <div className="relative group flex flex-col justify-between bg-[#181c2e] hover:bg-[#1f243b] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                <DollarSign className="w-4 h-4" />
              </div>
              {hasSalesAgent ? (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  <Bot className="w-3 h-3 text-emerald-400" /> MANAGED
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400 font-medium">
                  {Math.floor(leads)} Leads
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-white">SELL</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Pitch 1 lead. High-touch manual selling decays past early beta; hire Sales Agents to close whales.
            </p>
          </div>

          <button
            onClick={sellManual}
            disabled={focus < 1 || (leads < 1 && attention < 50)}
            className={`mt-4 w-full py-2 px-3 rounded-lg font-bold text-xs tracking-wide transition-all ${
              focus >= 1 && (leads >= 1 || attention >= 50)
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            {hasSalesAgent ? 'Close Whale Lead' : 'Pitch 1 Lead (1 Focus)'}
          </button>
        </div>

        {/* 4. SUPPORT */}
        <div className="relative group flex flex-col justify-between bg-[#181c2e] hover:bg-[#1f243b] border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-300">
                <LifeBuoy className="w-4 h-4" />
              </div>
              {hasSupportAgent ? (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  <Bot className="w-3 h-3 text-emerald-400" /> MANAGED
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400 font-medium">
                  {Math.floor(tickets)} Open
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-white">SUPPORT</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Resolve 2 tickets. Restores Trust (+0.5%) and stops customer churn.
            </p>
          </div>

          <button
            onClick={supportManual}
            disabled={focus < 1 || tickets <= 0}
            className={`mt-4 w-full py-2 px-3 rounded-lg font-bold text-xs tracking-wide transition-all ${
              focus >= 1 && tickets > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            {tickets > 0 ? `Resolve Tickets (${Math.floor(tickets)})` : 'Inbox Zero'}
          </button>
        </div>
      </div>
    </div>
  );
};
