import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { Code, Share2, DollarSign, LifeBuoy, Zap, Bot } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

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

  const handleAction = (action: () => void, soundType: 'click' | 'cash' | 'deploy' | 'ticket') => {
    if (soundType === 'cash') soundEngine.playCash();
    else if (soundType === 'deploy') soundEngine.playDeploy();
    else if (soundType === 'ticket') soundEngine.playTicketResolved();
    else soundEngine.playClick();
    action();
  };

  return (
    <div className="apple-card rounded-2xl p-5 text-left space-y-4">
      {/* Focus Gauge Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-[#0a84ff]/15 text-[#0a84ff]">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-white tracking-tight">
              Founder Focus Energy
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono font-semibold text-[#0a84ff] tabular-nums">
              {focus.toFixed(1)} / {maxFocus}
            </span>
            <span className="text-[11px] text-white/40">(+0.5/s)</span>
          </div>
        </div>

        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0a84ff] transition-all duration-150 rounded-full"
            style={{ width: `${focusPercent}%` }}
          />
        </div>
      </div>

      {/* 4 Core Tactical Founder Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. VIBE CODE */}
        <div className="apple-inset rounded-xl p-3.5 flex flex-col justify-between transition-all group hover:border-white/[0.12]">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#64d2ff]/15 text-[#64d2ff]">
                  <Code className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 border border-white/[0.08]">
                  C
                </span>
              </div>
              {hasEngAgent ? (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#64d2ff]/10 text-[#64d2ff] border border-[#64d2ff]/20">
                  <Bot className="w-3 h-3 text-[#64d2ff]" /> Managed
                </span>
              ) : (
                <span className="text-[11px] font-mono text-white/40">1.0 Focus</span>
              )}
            </div>

            <h4 className="text-xs font-semibold text-white tracking-tight">
              Vibe Code
            </h4>
            <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
              +15 BP, +2.0% Tech Debt. Rapid prototyping with debt accumulation.
            </p>
          </div>

          <button
            onClick={() => handleAction(vibeCodeManual, 'deploy')}
            disabled={focus < 1}
            className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-medium tracking-tight transition-all apple-btn-secondary`}
          >
            {hasEngAgent ? 'Assist Agent (+15 BP)' : 'Vibe Code (1 Focus)'}
          </button>
        </div>

        {/* 2. POST */}
        <div className="apple-inset rounded-xl p-3.5 flex flex-col justify-between transition-all group hover:border-white/[0.12]">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#bf5af2]/15 text-[#bf5af2]">
                  <Share2 className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 border border-white/[0.08]">
                  P
                </span>
              </div>
              {hasGrowthAgent ? (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#bf5af2]/10 text-[#bf5af2] border border-[#bf5af2]/20">
                  <Bot className="w-3 h-3 text-[#bf5af2]" /> Managed
                </span>
              ) : (
                <span className="text-[11px] font-mono text-white/40">1.0 Focus</span>
              )}
            </div>

            <h4 className="text-xs font-semibold text-white tracking-tight">
              Post Content
            </h4>
            <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
              Publish viral thread. Generates high attention; automated by Growth Agents.
            </p>
          </div>

          <button
            onClick={() => handleAction(postManual, 'click')}
            disabled={focus < 1}
            className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-medium tracking-tight transition-all apple-btn-secondary`}
          >
            {hasGrowthAgent ? 'Drop Viral Thread' : 'Post Content (1 Focus)'}
          </button>
        </div>

        {/* 3. SELL */}
        <div className="apple-inset rounded-xl p-3.5 flex flex-col justify-between transition-all group hover:border-white/[0.12]">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#30d158]/15 text-[#30d158]">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 border border-white/[0.08]">
                  S
                </span>
              </div>
              {hasSalesAgent ? (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20">
                  <Bot className="w-3 h-3 text-[#30d158]" /> Managed
                </span>
              ) : (
                <span className="text-[11px] font-mono text-white/40 tabular-nums">
                  {Math.floor(leads)} Leads
                </span>
              )}
            </div>

            <h4 className="text-xs font-semibold text-white tracking-tight">
              Pitch Lead (Sell)
            </h4>
            <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
              Convert 1 qualified lead into recurring MRR. Sales Agents close deals 24/7.
            </p>
          </div>

          <button
            onClick={() => handleAction(sellManual, 'cash')}
            disabled={focus < 1 || (leads < 1 && attention < 50)}
            className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-medium tracking-tight transition-all apple-btn-secondary`}
          >
            {hasSalesAgent ? 'Close Whale Lead' : 'Pitch Lead (1 Focus)'}
          </button>
        </div>

        {/* 4. SUPPORT */}
        <div className="apple-inset rounded-xl p-3.5 flex flex-col justify-between transition-all group hover:border-white/[0.12]">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#ff9f0a]/15 text-[#ff9f0a]">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-white/70 border border-white/[0.08]">
                  T
                </span>
              </div>
              {hasSupportAgent ? (
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#ff9f0a]/10 text-[#ff9f0a] border border-[#ff9f0a]/20">
                  <Bot className="w-3 h-3 text-[#ff9f0a]" /> Managed
                </span>
              ) : (
                <span className="text-[11px] font-mono text-white/40 tabular-nums">
                  {Math.floor(tickets)} Open
                </span>
              )}
            </div>

            <h4 className="text-xs font-semibold text-white tracking-tight">
              Resolve Support
            </h4>
            <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
              Resolve 2 tickets. Restores Trust (+0.5%) and protects user retention.
            </p>
          </div>

          <button
            onClick={() => handleAction(supportManual, 'ticket')}
            disabled={focus < 1 || tickets <= 0}
            className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-medium tracking-tight transition-all apple-btn-secondary`}
          >
            {tickets > 0 ? `Resolve Tickets (${Math.floor(tickets)})` : 'Inbox Zero'}
          </button>
        </div>
      </div>
    </div>
  );
};

