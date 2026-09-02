import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { CUSTOMER_QUOTES } from '../../data/customerQuotes';
import { Users, LifeBuoy, MessageSquare, Building2, AlertTriangle } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

export const CustomersScreen: React.FC = () => {
  const {
    customers,
    arpu,
    tickets,
    totalTicketsResolved,
    trust,
    customerSegments,
    supportManual,
    focus,
    agents
  } = useGameStore();

  const totalCust = Math.floor(customers);
  const supportAgents = agents.filter(a => a.role === 'SUPPORT');
  const supportResolutionPerMin = Math.round(supportAgents.reduce((acc, a) => acc + a.outputPerSec, 0) * 60);

  const csatScore = Math.max(10, Math.min(100, Math.round(trust * 1.1 - (tickets > 5 ? tickets * 2 : 0))));

  const isBacklogCritical = tickets >= 8;
  const isInboxZero = tickets <= 0 && totalCust > 0;

  const handleResolveTickets = () => {
    soundEngine.playTicketResolved();
    supportManual();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Customers Header */}
      <div className="apple-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ff9f0a]/15 text-[#ff9f0a] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-white tracking-tight">
                    Customer Base &amp; Retention
                  </h1>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-white/80 border border-white/[0.08] tabular-nums">
                    {totalCust.toLocaleString()} Subscribers
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Subscribers generate recurring MRR across SMB, Pro, and Enterprise cohorts. Blended ARPU expands dynamically as higher tiers unlock.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-[11px] font-sans text-white/40 block">Blended ARPU</span>
              <div className="text-sm font-semibold font-mono text-[#30d158] tabular-nums mt-0.5">
                ${arpu}/mo
              </div>
            </div>
            <div>
              <span className="text-[11px] font-sans text-white/40 block">CSAT Rating</span>
              <div className="text-sm font-semibold font-mono text-white tabular-nums mt-0.5">
                {csatScore}%
              </div>
            </div>
            <div>
              <span className="text-[11px] font-sans text-white/40 block">Trust Score</span>
              <div className="text-sm font-semibold font-mono text-white/80 tabular-nums mt-0.5">
                {trust.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Customer Segments + Support Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Cohort Segments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-[#5e5ce6]" />
              <span>Subscription Tiers &amp; Cohorts</span>
            </h2>
            <span className="text-[11px] text-white/40 font-mono">
              Auto-tier allocation
            </span>
          </div>

          <div className="space-y-3">
            {customerSegments.map((seg) => {
              const segShare = totalCust > 0 ? ((seg.count / totalCust) * 100).toFixed(0) : '0';
              const segMrr = seg.count * seg.arpu;

              return (
                <div
                  key={seg.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    seg.unlocked
                      ? 'apple-card'
                      : 'apple-card opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{seg.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/90 font-medium border border-white/[0.08] tabular-nums">
                        ${seg.arpu}/mo
                      </span>
                    </div>
                    {seg.unlocked ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20 font-medium">
                        Active ({segShare}% Share)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 border border-white/[0.08]">
                        Locked
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/[0.06] text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-white/40 font-sans block">Subscribers</span>
                      <span className="font-semibold text-white tabular-nums">{seg.unlocked ? seg.count : 0} accounts</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 font-sans block">MRR Share</span>
                      <span className="font-semibold text-[#30d158] tabular-nums">${seg.unlocked ? segMrr.toLocaleString() : 0}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-white/40 font-sans block">Monthly Churn</span>
                      <span className="font-semibold text-white/80 tabular-nums">{seg.churnRate}% / mo</span>
                    </div>
                  </div>

                  {!seg.unlocked && (
                    <p className="text-[11px] text-[#ff9f0a] mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{seg.id === 'pro' ? 'Requires 20+ active customers to unlock pro tier.' : 'Requires 100+ customers OR shipping SSO / SAML feature.'}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Ticket Queue & SLA Desk */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
              <LifeBuoy className="w-3.5 h-3.5 text-[#ff9f0a]" />
              <span>Customer Support Desk</span>
            </h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-medium ${
              isBacklogCritical
                ? 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30'
                : isInboxZero
                ? 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30'
                : 'bg-white/[0.06] text-white/70 border-white/[0.08]'
            }`}>
              {isBacklogCritical ? 'Critical Backlog' : isInboxZero ? 'Inbox Zero (+Trust)' : 'Healthy Queue'}
            </span>
          </div>

          <div className="apple-card rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="apple-inset p-3 rounded-xl">
                <span className="text-white/40 text-[10px] font-sans block">Backlog Queue</span>
                <div className={`text-base font-semibold mt-0.5 tabular-nums ${isBacklogCritical ? 'text-[#ff453a]' : 'text-white'}`}>
                  {Math.floor(tickets)} Tickets
                </div>
              </div>
              <div className="apple-inset p-3 rounded-xl">
                <span className="text-white/40 text-[10px] font-sans block">Velocity</span>
                <div className="text-xs font-semibold text-white/90 mt-1 tabular-nums">
                  +{supportResolutionPerMin}/min ({supportAgents.length} Agents)
                </div>
              </div>
              <div className="apple-inset p-3 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-white/40 text-[10px] font-sans block">Total Resolved</span>
                <div className="text-xs font-semibold text-white/80 mt-1 tabular-nums">
                  {Math.floor(totalTicketsResolved).toLocaleString()}
                </div>
              </div>
            </div>

            <p className="text-xs text-white/50 leading-relaxed">
              When ticket backlog surges, customers lose confidence and Trust decays, accelerating churn. Deploy Support Agents to triage queues 24/7 or personally resolve tickets.
            </p>

            <button
              onClick={handleResolveTickets}
              disabled={focus < 1 || tickets <= 0}
              className={`w-full py-2 px-4 rounded-xl font-medium text-xs tracking-tight transition-all ${
                focus >= 1 && tickets > 0
                  ? 'apple-btn-secondary'
                  : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
              }`}
            >
              {tickets > 0 ? `Personally Resolve 2 Tickets (1 Focus &rarr; +0.5% Trust)` : 'Inbox Zero (Support SLA Maintained)'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Customer Feedback Stream */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-[#bf5af2]" />
          <span>Recent Customer Feedback Stream</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CUSTOMER_QUOTES.map((quote) => (
            <div key={quote.id} className="apple-card rounded-2xl p-4 flex flex-col justify-between">
              <p className="text-xs text-white/70 leading-relaxed italic mb-3 font-serif">
                "{quote.text}"
              </p>
              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                <span className="font-semibold text-white/90 truncate max-w-[120px] font-sans">{quote.author}</span>
                <span className="text-white/60">{quote.plan}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


