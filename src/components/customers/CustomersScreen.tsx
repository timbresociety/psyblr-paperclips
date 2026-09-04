import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { CUSTOMER_QUOTES } from '../../data/customerQuotes';
import {
  Users,
  LifeBuoy,
  MessageSquare,
  Building2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

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
    agents,
    setActiveTab
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
    <div className="space-y-5 text-left animate-fade-in pb-12">
      {/* 1. Customers Header */}
      <div className="apple-card rounded-2xl p-5 border border-white/[0.1]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#ff9f0a]/15 text-[#ff9f0a] flex items-center justify-center border border-[#ff9f0a]/25">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight">
                    Customer Base &amp; Retention
                  </h1>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/90 border border-white/[0.08] tabular-nums">
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
              <span className="text-[10px] font-sans text-white/40 block uppercase font-semibold">Blended ARPU</span>
              <div className="text-sm font-bold font-mono text-[#30d158] tabular-nums mt-0.5">
                ${arpu}/mo
              </div>
            </div>
            <div>
              <span className="text-[10px] font-sans text-white/40 block uppercase font-semibold">CSAT Rating</span>
              <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
                {csatScore}%
              </div>
            </div>
            <div>
              <span className="text-[10px] font-sans text-white/40 block uppercase font-semibold">Trust Score</span>
              <div className="text-sm font-bold font-mono text-white/80 tabular-nums mt-0.5">
                {trust.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Purpose & Gameplay Impact Explainer Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#ff9f0a]/10 via-[#5e5ce6]/05 to-transparent border border-white/[0.08] text-left space-y-1.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#ff9f0a]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            What This Tab Does &amp; Why It Matters in Gameplay
          </h3>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          This is your company's <strong>Retention &amp; Unit Economics Engine</strong>. It shows how your paying subscribers breakdown into tiers (Solo $299/mo, Pro $897/mo, Enterprise $4,485/mo) and defends your recurring ARR against cancellations.
          <strong className="text-white"> Why Support Matters:</strong> Unresolved support tickets cause Trust to drop and customer churn to spike! Keep the queue at Inbox Zero with Support Agents to maintain 100% Trust and maximize subscriber retention.
        </p>
      </div>

      {/* 3. 2-Column Grid: Customer Segments + Support Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Cohort Segments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
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
                      ? 'apple-card border-white/[0.08]'
                      : 'apple-card opacity-50 border-dashed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{seg.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-white/90 font-bold border border-white/[0.08] tabular-nums">
                        ${seg.arpu}/mo
                      </span>
                    </div>
                    {seg.unlocked ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20 font-bold">
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
                      <span className="text-[10px] text-white/40 font-sans block uppercase">Subscribers</span>
                      <span className="font-bold text-white tabular-nums">{seg.unlocked ? seg.count.toLocaleString() : 0} accounts</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 font-sans block uppercase">MRR Share</span>
                      <span className="font-bold text-[#30d158] tabular-nums">${seg.unlocked ? segMrr.toLocaleString() : 0}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-white/40 font-sans block uppercase">Monthly Churn</span>
                      <span className="font-bold text-white/80 tabular-nums">{seg.churnRate}% / mo</span>
                    </div>
                  </div>

                  {!seg.unlocked && (
                    <p className="text-[11px] text-[#ff9f0a] mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-1 font-mono">
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <LifeBuoy className="w-3.5 h-3.5 text-[#ff9f0a]" />
              <span>Customer Support Desk</span>
            </h2>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
              isBacklogCritical
                ? 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30'
                : isInboxZero
                ? 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30'
                : 'bg-white/[0.06] text-white/70 border-white/[0.08]'
            }`}>
              {isBacklogCritical ? '⚠️ Critical Backlog' : isInboxZero ? '✓ Inbox Zero (+Trust)' : 'Healthy Queue'}
            </span>
          </div>

          <div className="apple-card rounded-2xl p-5 space-y-4 border border-white/[0.08]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="apple-inset p-3 rounded-xl border border-white/[0.04]">
                <span className="text-white/40 text-[10px] font-sans block uppercase">Backlog Queue</span>
                <div className={`text-base font-bold mt-0.5 tabular-nums ${isBacklogCritical ? 'text-[#ff453a]' : 'text-white'}`}>
                  {Math.floor(tickets)} Tickets
                </div>
              </div>
              <div className="apple-inset p-3 rounded-xl border border-white/[0.04]">
                <span className="text-white/40 text-[10px] font-sans block uppercase">Velocity</span>
                <div className="text-xs font-bold text-white/90 mt-1 tabular-nums">
                  +{supportResolutionPerMin}/min ({supportAgents.length} Agents)
                </div>
              </div>
              <div className="apple-inset p-3 rounded-xl col-span-2 sm:col-span-1 border border-white/[0.04]">
                <span className="text-white/40 text-[10px] font-sans block uppercase">Total Resolved</span>
                <div className="text-xs font-bold text-white/80 mt-1 tabular-nums">
                  {Math.floor(totalTicketsResolved).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Backlog Impact Explainer */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/60 leading-relaxed space-y-1">
              <span className="font-semibold text-white/90 block">SLA &amp; Trust Mechanics:</span>
              <p>
                Customers file tickets as your user base scales. If tickets accumulate (&ge;8), Trust drops by <strong className="text-[#ff453a]">-2%/sec</strong>, triggering customer churn and cancellations.
              </p>
              {supportAgents.length === 0 && (
                <button
                  onClick={() => setActiveTab('agents')}
                  className="text-[11px] text-[#64d2ff] font-bold underline hover:text-white transition-colors block pt-1"
                >
                  Deploy Support Agents in Workforce to automate ticket resolution 24/7 &rarr;
                </button>
              )}
            </div>

            <button
              onClick={handleResolveTickets}
              disabled={focus < 1 || tickets <= 0}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-tight transition-all ${
                focus >= 1 && tickets > 0
                  ? 'apple-btn-secondary shadow-md'
                  : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
              }`}
            >
              {tickets > 0 ? `Personally Resolve 2 Tickets (1 Focus → +0.5% Trust)` : 'Inbox Zero (Support SLA Maintained)'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Live Customer Feedback Stream */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-[#bf5af2]" />
          <span>Recent Customer Feedback Stream</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CUSTOMER_QUOTES.map((quote) => (
            <div key={quote.id} className="apple-card rounded-2xl p-4 flex flex-col justify-between border border-white/[0.06]">
              <p className="text-xs text-white/75 leading-relaxed italic mb-3 font-serif">
                "{quote.text}"
              </p>
              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-white/90 truncate max-w-[120px] font-sans">{quote.author}</span>
                <span className="text-white/60 font-medium">{quote.plan}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
