import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { COMPUTE_TIERS } from '../../data/vcOffers';
import { DollarSign, Cpu, Handshake, CheckCircle2, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const FinanceScreen: React.FC = () => {
  const {
    mrr,
    arr,
    cash,
    valuation,
    lastValuation,
    valuationMultiple,
    founderOwnership,
    totalCapitalRaised,
    vcOffers,
    acceptVcOffer,
    currentComputeTierId,
    upgradeComputeTier,
    trust,
    productLevel,
    agents,
    growthCampaigns,
    computeUsed,
    computeCapacity
  } = useGameStore();

  const currentTier = COMPUTE_TIERS.find(t => t.id === currentComputeTierId) || COMPUTE_TIERS[0];
  const monthlyComputeCost = currentTier.monthlyCost;
  
  const activeCampaigns = (growthCampaigns || []).filter(c => c.isActive);
  const monthlyCampaignsCost = activeCampaigns.reduce((acc, c) => acc + c.monthlyCost, 0);

  const totalMonthlyBurn = monthlyComputeCost + monthlyCampaignsCost;
  const netMonthlyCashflow = mrr - totalMonthlyBurn;
  const isProfitable = netMonthlyCashflow >= 0;

  const runwayMonths = !isProfitable && totalMonthlyBurn > mrr
    ? (cash / (totalMonthlyBurn - mrr)).toFixed(1)
    : 'Infinite';

  const grossMargin = mrr > 0
    ? Math.max(0, Math.min(100, ((mrr - monthlyComputeCost) / mrr) * 100))
    : 100;

  const organicValuation = Math.round(arr * valuationMultiple);
  const hasManager = agents.some(a => a.role === 'MANAGER');
  const hasExec = agents.some(a => a.role === 'EXECUTIVE');
  const hasCEO = agents.some(a => a.role === 'CEO');

  const latestAcceptedOffer = [...vcOffers].reverse().find(o => o.isAccepted);

  return (
    <div className="space-y-6 text-left">
      {/* Financial Overview Header */}
      <div className="bg-[#111422] border border-[#20263c] rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-black tracking-tight text-white">
                FINANCIALS & VALUATION BENCHMARK
              </h2>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                ${mrr.toLocaleString()} MRR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Valuation is anchored to your closed VC priced rounds (Post-Money Valuation) or driven higher organically by ARR &times; Multiple.
            </p>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-xs font-mono text-slate-400">Post-Money Valuation:</span>
              <div className="text-xl font-black font-mono text-purple-300 glow-purple">
                ${valuation >= 1000000 ? `${(valuation / 1000000).toFixed(2)}M` : valuation.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400">Founder Stake:</span>
              <div className="text-base font-black font-mono text-slate-200">
                {founderOwnership.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Valuation Logic Breakdown Box */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-[#171b2d] p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Latest Priced Round Floor</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base font-bold text-purple-300">
                ${(lastValuation || 0) >= 1000000 ? `${((lastValuation || 0) / 1000000).toFixed(1)}M` : (lastValuation || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">
                {latestAcceptedOffer ? `(${latestAcceptedOffer.roundStage})` : '(Pre-Funding)'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              Post-money valuation agreed upon in your signed term sheet.
            </p>
          </div>

          <div className="bg-[#171b2d] p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Organic Multiple Valuation</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base font-bold text-white">
                ${organicValuation >= 1000000 ? `${(organicValuation / 1000000).toFixed(2)}M` : organicValuation.toLocaleString()}
              </span>
              <span className="text-[10px] text-purple-400">
                (${arr.toLocaleString()} ARR &times; {valuationMultiple.toFixed(1)}x)
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              Scales higher when revenue multiple surpasses priced round benchmark.
            </p>
          </div>

          <div className="bg-[#171b2d] p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Total Capital Injected</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base font-bold text-emerald-400">
                ${totalCapitalRaised.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">
                (${Math.floor(cash).toLocaleString()} in bank)
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">
              Cumulative non-debt venture equity capital raised to date.
            </p>
          </div>
        </div>
      </div>

      {/* P&L / Income Statement & Cashflow Card */}
      <div className="bg-[#121524] border border-[#20273e] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Live SaaS Income Statement (P&amp;L) &amp; Runway
            </h3>
          </div>
          <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
            isProfitable
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : runwayMonths === 'Infinite' || Number(runwayMonths) > 12
              ? 'bg-blue-950 text-blue-300 border-blue-800'
              : Number(runwayMonths) > 6
              ? 'bg-amber-950 text-amber-300 border-amber-800'
              : 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
          }`}>
            {isProfitable ? 'CASHFLOW POSITIVE' : `${runwayMonths} MONTHS RUNWAY`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="bg-[#171b2e] p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Monthly Revenue (MRR)</span>
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+${mrr.toLocaleString()}/mo</span>
            </div>
          </div>

          <div className="bg-[#171b2e] p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Compute Cloud OPEX</span>
            <div className="flex items-center gap-1 text-rose-400 font-bold text-sm mt-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>-${monthlyComputeCost.toLocaleString()}/mo</span>
            </div>
          </div>

          <div className="bg-[#171b2e] p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Marketing Campaigns OPEX</span>
            <div className="flex items-center gap-1 text-pink-400 font-bold text-sm mt-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>-${monthlyCampaignsCost.toLocaleString()}/mo</span>
            </div>
          </div>

          <div className="bg-[#171b2e] p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Net Monthly Cashflow</span>
            <div className={`flex items-center gap-1 font-bold text-sm mt-0.5 ${netMonthlyCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span>{netMonthlyCashflow >= 0 ? `+$${netMonthlyCashflow.toLocaleString()}/mo` : `-$${Math.abs(netMonthlyCashflow).toLocaleString()}/mo`}</span>
            </div>
          </div>

          <div className="bg-[#171b2e] p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Gross Margin</span>
            <div className="text-cyan-300 font-bold text-sm mt-0.5">
              {grossMargin.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: VC Term Sheets + Compute Upgrades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venture Capital Term Sheets */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Handshake className="w-4 h-4 text-emerald-400" />
            Venture Capital Term Sheets
          </h3>

          <div className="space-y-3">
            {vcOffers.map((offer) => {
              const reqComputeTier = offer.requiredComputeTierId
                ? COMPUTE_TIERS.find(t => t.id === offer.requiredComputeTierId)
                : null;
              const currentComputeIdx = COMPUTE_TIERS.findIndex(t => t.id === currentComputeTierId);
              const reqComputeIdx = offer.requiredComputeTierId
                ? COMPUTE_TIERS.findIndex(t => t.id === offer.requiredComputeTierId)
                : -1;
              const hasReqCompute = reqComputeIdx === -1 || currentComputeIdx >= reqComputeIdx;

              const isMrrMet = mrr >= offer.requiredMrr;
              const isTrustMet = trust >= offer.requiredTrust;
              const isAgentsMet = !offer.requiredAgents || agents.length >= offer.requiredAgents;
              const isProductMet = !offer.requiredProductLevel || productLevel >= offer.requiredProductLevel;
              const isManagerMet = !offer.requiresManager || hasManager;
              const isExecMet = !offer.requiresExecutive || hasExec;
              const isCEOMet = !offer.requiresCEO || hasCEO;

              return (
                <div
                  key={offer.id}
                  className={`p-4 rounded-xl border transition-all ${
                    offer.isAccepted
                      ? 'bg-[#131a26]/60 border-emerald-800/40 opacity-80'
                      : offer.isAvailable
                      ? 'bg-[#181c2f] border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'bg-slate-900/40 border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-purple-300">
                      {offer.roundStage.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Raise: ${offer.raiseAmount.toLocaleString()}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm">
                    {offer.firmName}
                  </h4>
                  <p className="text-xs text-slate-400 italic my-2">
                    {offer.investorThesis}
                  </p>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-2 border-t border-slate-800">
                    <span className="font-bold text-purple-300">Valuation: ${(offer.valuation / 1000000).toFixed(1)}M</span>
                    <span>Dilution: {offer.dilutionPercent}%</span>
                  </div>

                  {/* Prerequisites Checklist */}
                  {!offer.isAccepted && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans font-bold">
                        Round Prerequisites:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className={`flex items-center gap-1.5 ${isMrrMet ? 'text-emerald-400' : 'text-slate-400'}`}>
                          <span>{isMrrMet ? '✓' : '✗'}</span>
                          <span>${offer.requiredMrr.toLocaleString()} MRR</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${isTrustMet ? 'text-emerald-400' : 'text-slate-400'}`}>
                          <span>{isTrustMet ? '✓' : '✗'}</span>
                          <span>{offer.requiredTrust}% Trust</span>
                        </div>
                        {offer.requiredAgents && (
                          <div className={`flex items-center gap-1.5 ${isAgentsMet ? 'text-emerald-400' : 'text-slate-400'}`}>
                            <span>{isAgentsMet ? '✓' : '✗'}</span>
                            <span>{offer.requiredAgents}+ Agents ({agents.length})</span>
                          </div>
                        )}
                        {offer.requiredProductLevel && (
                          <div className={`flex items-center gap-1.5 ${isProductMet ? 'text-emerald-400' : 'text-slate-400'}`}>
                            <span>{isProductMet ? '✓' : '✗'}</span>
                            <span>Product L{offer.requiredProductLevel}+</span>
                          </div>
                        )}
                        {reqComputeTier && (
                          <div className={`flex items-center gap-1.5 ${hasReqCompute ? 'text-emerald-400' : 'text-slate-400'}`}>
                            <span>{hasReqCompute ? '✓' : '✗'}</span>
                            <span className="truncate">{reqComputeTier.name.split(' ')[0]} Tier</span>
                          </div>
                        )}
                        {offer.requiresManager && (
                          <div className={`flex items-center gap-1.5 ${isManagerMet ? 'text-emerald-400' : 'text-slate-400'}`}>
                            <span>{isManagerMet ? '✓' : '✗'}</span>
                            <span>Manager Agent</span>
                          </div>
                        )}
                        {offer.requiresExecutive && (
                          <div className={`flex items-center gap-1.5 ${isExecMet ? 'text-emerald-400' : 'text-slate-400'}`}>
                            <span>{isExecMet ? '✓' : '✗'}</span>
                            <span>Executive Agent</span>
                          </div>
                        )}
                        {offer.requiresCEO && (
                          <div className={`flex items-center gap-1.5 ${isCEOMet ? 'text-emerald-400' : 'text-slate-400'}`}>
                            <span>{isCEOMet ? '✓' : '✗'}</span>
                            <span>CEO Agent</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    {offer.isAccepted ? (
                      <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 text-xs font-mono font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ROUND CLOSED (${(offer.valuation / 1000000).toFixed(1)}M BENCHMARK)
                      </div>
                    ) : (
                      <button
                        onClick={() => acceptVcOffer(offer.id)}
                        disabled={!offer.isAvailable}
                        className={`w-full py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                          offer.isAvailable
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {offer.isAvailable
                          ? `Sign Term Sheet (${(offer.valuation / 1000000).toFixed(1)}M Post-Money)`
                          : `Prerequisites Incomplete`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compute Infrastructure Tiers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Compute Infrastructure Tiers
            </h3>
            <span className="text-xs font-mono font-bold text-cyan-300">
              Load: {computeUsed.toFixed(1)} / {computeCapacity} CU
            </span>
          </div>

          <div className="space-y-3">
            {COMPUTE_TIERS.map((tier) => {
              const isCurrent = currentComputeTierId === tier.id;
              const canAfford = cash >= tier.setupCost;

              return (
                <div
                  key={tier.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-[#151c2e] border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-[#151827] border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm">{tier.name}</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {tier.capacityCU} CU Capacity
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{tier.description}</p>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
                    <span>Monthly OPEX: ${tier.monthlyCost}/mo</span>
                    <span>Setup: ${tier.setupCost.toLocaleString()}</span>
                  </div>

                  <div className="mt-3">
                    {isCurrent ? (
                      <div className="text-center py-1.5 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 text-xs font-mono font-bold">
                        ACTIVE INFRASTRUCTURE
                      </div>
                    ) : (
                      <button
                        onClick={() => upgradeComputeTier(tier.id)}
                        disabled={!canAfford}
                        className={`w-full py-1.5 px-3 rounded-lg font-bold text-xs transition-all ${
                          canAfford
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Upgrade Infrastructure (${tier.setupCost.toLocaleString()})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

