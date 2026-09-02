import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { CUSTOMER_QUOTES } from '../../data/customerQuotes';
import { Users, LifeBuoy, MessageSquare, Building2, AlertTriangle } from 'lucide-react';

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

  return (
    <div className="space-y-6 text-left">
      {/* Customers Header */}
      <div className="bg-[#111422] border border-[#20263c] rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-black tracking-tight text-white">
                CUSTOMER BASE &amp; UNIT RETENTION
              </h2>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                {totalCust.toLocaleString()} ACTIVE SUBSCRIBERS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Subscribers generate recurring MRR across SMB, Pro, and Enterprise cohorts. Blended ARPU expands dynamically as higher tiers unlock.
            </p>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-xs font-mono text-slate-400">Blended ARPU:</span>
              <div className="text-base font-black font-mono text-emerald-400">
                ${arpu}/mo
              </div>
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400">CSAT Score:</span>
              <div className="text-base font-black font-mono text-cyan-300">
                {csatScore}%
              </div>
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400">Trust Score:</span>
              <div className="text-base font-black font-mono text-slate-200">
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Subscription Tiers &amp; Cohorts
            </h3>
            <span className="text-xs font-mono text-slate-500">
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
                  className={`p-4 rounded-xl border transition-all ${
                    seg.unlocked
                      ? 'bg-[#151827] border-slate-800 hover:border-slate-700 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{seg.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                        ${seg.arpu}/mo
                      </span>
                    </div>
                    {seg.unlocked ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                        ACTIVE ({segShare}% SHARE)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        LOCKED
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Subscribers</span>
                      <span className="font-bold text-white">{seg.unlocked ? seg.count : 0} accounts</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">MRR Contribution</span>
                      <span className="font-bold text-emerald-400">${seg.unlocked ? segMrr.toLocaleString() : 0}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Monthly Churn</span>
                      <span className="font-bold text-cyan-300">{seg.churnRate}% / mo</span>
                    </div>
                  </div>

                  {!seg.unlocked && (
                    <p className="text-[10px] text-amber-400/90 font-mono mt-2 pt-1.5 border-t border-slate-800/60 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{seg.id === 'pro' ? 'Requires 20+ active customers to unlock pro teams.' : 'Requires 100+ customers OR shipping SSO / SAML feature.'}</span>
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-amber-400" />
              Customer Support Desk &amp; SLA Status
            </h3>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isBacklogCritical
                ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                : isInboxZero
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-amber-950 text-amber-300 border-amber-800'
            }`}>
              {isBacklogCritical ? 'CRITICAL BACKLOG' : isInboxZero ? 'INBOX ZERO (+TRUST)' : 'HEALTHY QUEUE'}
            </span>
          </div>

          <div className="bg-[#151827] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-[#181c2f] p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Unresolved Backlog</span>
                <div className="text-lg font-black text-amber-300 mt-0.5">
                  {Math.floor(tickets)} Tickets
                </div>
              </div>
              <div className="bg-[#181c2f] p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Burn Velocity</span>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  +{supportResolutionPerMin}/min ({supportAgents.length} Agents)
                </div>
              </div>
              <div className="bg-[#181c2f] p-3 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-slate-400 text-[10px] block">Total Resolved</span>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">
                  {Math.floor(totalTicketsResolved).toLocaleString()}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              When ticket backlog surges, customers lose confidence and Trust decays, directly accelerating churn. Hire Support Agents to triage queues 24/7 or personally resolve tickets.
            </p>

            <button
              onClick={supportManual}
              disabled={focus < 1 || tickets <= 0}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all ${
                focus >= 1 && tickets > 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {tickets > 0 ? `Personally Resolve 2 Tickets (1 Focus &rarr; +0.5% Trust)` : 'Inbox Zero (Support SLA Maintained)'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Customer Feedback Stream */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          Recent Customer Messages &amp; Feedback Stream
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CUSTOMER_QUOTES.map((quote) => (
            <div key={quote.id} className="bg-[#141726] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <p className="text-xs text-slate-300 leading-relaxed italic mb-3">
                "{quote.text}"
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-slate-200 truncate max-w-[120px]">{quote.author}</span>
                <span className="text-cyan-400">{quote.plan}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

