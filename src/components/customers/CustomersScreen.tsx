import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { CUSTOMER_QUOTES } from '../../data/customerQuotes';
import { Users, LifeBuoy, MessageSquare, Building2 } from 'lucide-react';

export const CustomersScreen: React.FC = () => {
  const {
    customers,
    arpu,
    tickets,
    totalTicketsResolved,
    trust,
    customerSegments,
    supportManual,
    focus
  } = useGameStore();

  return (
    <div className="space-y-6 text-left">
      {/* Customers Header */}
      <div className="bg-[#111422] border border-[#20263c] rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-black tracking-tight text-white">
                CUSTOMER BASE & RETENTION
              </h2>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                {Math.floor(customers).toLocaleString()} ACTIVE SUBSCRIBERS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Paying customers generate recurring MRR, refer peers, and submit endless support tickets.
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
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            Customer Segments
          </h3>

          <div className="space-y-2.5">
            {customerSegments.map((seg) => (
              <div
                key={seg.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  seg.unlocked
                    ? 'bg-[#151827] border-slate-800'
                    : 'bg-slate-900/40 border-slate-800/50 opacity-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{seg.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                      ${seg.arpu}/mo
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {seg.unlocked ? `${seg.count} active accounts` : 'Unlocks at higher customer tiers'}
                  </p>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs text-slate-500 block">Churn Rate</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {seg.churnRate}% / mo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Ticket Queue */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-amber-400" />
            Support Ticket Queue
          </h3>

          <div className="bg-[#151827] border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Unresolved Tickets:</span>
                <div className="text-xl font-black font-mono text-amber-300 mt-0.5">
                  {Math.floor(tickets)} Tickets
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Resolved to Date:</span>
                <div className="text-base font-black font-mono text-emerald-400 mt-0.5">
                  {Math.floor(totalTicketsResolved).toLocaleString()}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              When ticket backlog exceeds capacity, customers lose patience and Trust decays. Hire Support Agents or resolve tickets manually.
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
              {tickets > 0 ? `Personally Resolve 2 Tickets (1 Focus)` : 'Inbox Zero (No Open Tickets)'}
            </button>
          </div>
        </div>
      </div>

      {/* Live Customer Feedback Stream */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          Recent Customer Messages & Support Logs
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CUSTOMER_QUOTES.map((quote) => (
            <div key={quote.id} className="bg-[#141726] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <p className="text-xs text-slate-300 leading-relaxed italic mb-3">
                "{quote.text}"
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-slate-200 truncate max-w-[120px]">{quote.author}</span>
                <span className="text-slate-500">{quote.plan}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
