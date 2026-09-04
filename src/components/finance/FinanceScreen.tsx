import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { COMPUTE_TIERS } from '../../data/vcOffers';
import { DollarSign, Cpu, Handshake, CheckCircle2, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

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
      <div className="apple-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#30d158]/15 text-[#30d158] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-white tracking-tight">
                    Financials &amp; Valuation
                  </h1>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#30d158]/10 text-[#30d158] border border-[#30d158]/20 tabular-nums">
                    ${mrr.toLocaleString()} MRR
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Valuation is anchored to signed VC term sheets (Post-Money Valuation) or driven organically by ARR &times; Multiple.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-[11px] font-sans text-white/40 block">Post-Money Valuation</span>
              <div className="text-lg font-semibold font-mono text-white tabular-nums mt-0.5">
                ${valuation >= 1000000 ? `${(valuation / 1000000).toFixed(2)}M` : valuation.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-sans text-white/40 block">Founder Stake</span>
              <div className="text-sm font-semibold font-mono text-white/90 tabular-nums mt-0.5">
                {founderOwnership.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Valuation Logic Breakdown Box */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 block text-[10px] font-sans uppercase tracking-wider">Latest Priced Round Floor</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-sm font-semibold text-white tabular-nums">
                ${(lastValuation || 0) >= 1000000 ? `${((lastValuation || 0) / 1000000).toFixed(1)}M` : (lastValuation || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-white/40">
                {latestAcceptedOffer ? `(${latestAcceptedOffer.roundStage})` : '(Pre-Funding)'}
              </span>
            </div>
            <p className="text-[11px] text-white/50 mt-1 font-sans">
              Post-money valuation agreed upon in your signed term sheet.
            </p>
          </div>

          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 block text-[10px] font-sans uppercase tracking-wider">Organic Multiple Valuation</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-sm font-semibold text-white tabular-nums">
                ${organicValuation >= 1000000 ? `${(organicValuation / 1000000).toFixed(2)}M` : organicValuation.toLocaleString()}
              </span>
              <span className="text-[10px] text-white/50">
                (${arr.toLocaleString()} ARR &times; {valuationMultiple.toFixed(1)}x)
              </span>
            </div>
            <p className="text-[11px] text-white/50 mt-1 font-sans">
              Scales higher when revenue multiple surpasses priced round benchmark.
            </p>
          </div>

          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 block text-[10px] font-sans uppercase tracking-wider">Total Capital Raised</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-sm font-semibold text-white tabular-nums">
                ${totalCapitalRaised.toLocaleString()}
              </span>
              <span className="text-[10px] text-white/40">
                (${Math.floor(cash).toLocaleString()} in bank)
              </span>
            </div>
            <p className="text-[11px] text-white/50 mt-1 font-sans">
              Cumulative non-debt venture equity capital raised to date.
            </p>
          </div>
        </div>
      </div>

      {/* P&L / Income Statement & Cashflow Card */}
      <div className="apple-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#30d158]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              Live SaaS Income Statement (P&amp;L) &amp; Runway
            </h2>
          </div>
          <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-medium ${
            isProfitable
              ? 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30'
              : runwayMonths === 'Infinite' || Number(runwayMonths) > 12
              ? 'bg-white/[0.06] text-white/80 border-white/[0.08]'
              : Number(runwayMonths) > 6
              ? 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30'
              : 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30 animate-status-dot'
          }`}>
            {isProfitable ? 'Cashflow Positive' : `${runwayMonths} Months Runway`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 block text-[10px] font-sans">Monthly Revenue (MRR)</span>
            <div className="flex items-center gap-1 text-[#30d158] font-semibold text-xs mt-1 tabular-nums">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+${mrr.toLocaleString()}/mo</span>
            </div>
          </div>

          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 block text-[10px] font-sans">Compute Cloud OPEX</span>
            <div className="flex items-center gap-1 text-[#ff453a] font-semibold text-xs mt-1 tabular-nums">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>-${monthlyComputeCost.toLocaleString()}/mo</span>
            </div>
          </div>

          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 block text-[10px] font-sans">Marketing Campaigns</span>
            <div className="flex items-center gap-1 text-white/70 font-semibold text-xs mt-1 tabular-nums">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>-${monthlyCampaignsCost.toLocaleString()}/mo</span>
            </div>
          </div>

          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 block text-[10px] font-sans">Net Cashflow</span>
            <div className={`flex items-center gap-1 font-semibold text-xs mt-1 tabular-nums ${netMonthlyCashflow >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
              <span>{netMonthlyCashflow >= 0 ? `+$${netMonthlyCashflow.toLocaleString()}/mo` : `-$${Math.abs(netMonthlyCashflow).toLocaleString()}/mo`}</span>
            </div>
          </div>

          <div className="apple-inset p-3 rounded-xl">
            <span className="text-white/40 block text-[10px] font-sans">Gross Margin</span>
            <div className="text-white/90 font-semibold text-xs mt-1 tabular-nums">
              {grossMargin.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: VC Term Sheets + Compute Upgrades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venture Capital Term Sheets */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
            <Handshake className="w-3.5 h-3.5 text-[#0a84ff]" />
            <span>Venture Capital Term Sheets</span>
          </h2>

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
                  className={`p-4 rounded-2xl border transition-all ${
                    offer.isAccepted
                      ? 'apple-inset opacity-75'
                      : offer.isAvailable
                      ? 'bg-[#0a84ff]/10 border-[#0a84ff]/40 shadow-sm'
                      : 'apple-card opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-semibold text-white/90">
                      {offer.roundStage.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#30d158] tabular-nums">
                      Raise: ${offer.raiseAmount.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white text-xs tracking-tight">
                    {offer.firmName}
                  </h3>
                  <p className="text-[11px] text-white/50 italic my-2 font-serif">
                    {offer.investorThesis}
                  </p>

                  <div className="flex items-center justify-between text-xs font-mono text-white/80 pt-2 border-t border-white/[0.06] tabular-nums">
                    <span className="font-semibold text-white">Valuation: ${(offer.valuation / 1000000).toFixed(1)}M</span>
                    <span className="text-white/60">Dilution: {offer.dilutionPercent}%</span>
                  </div>

                  {/* Prerequisites Checklist */}
                  {!offer.isAccepted && (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] space-y-1.5 text-[11px] font-mono">
                      <span className="text-[10px] text-white/40 uppercase tracking-wider block font-sans">
                        Round Prerequisites:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className={`flex items-center gap-1.5 ${isMrrMet ? 'text-[#30d158]' : 'text-white/40'}`}>
                          <span>{isMrrMet ? '✓' : '✗'}</span>
                          <span>${offer.requiredMrr.toLocaleString()} MRR</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${isTrustMet ? 'text-[#30d158]' : 'text-white/40'}`}>
                          <span>{isTrustMet ? '✓' : '✗'}</span>
                          <span>{offer.requiredTrust}% Trust</span>
                        </div>
                        {offer.requiredAgents && (
                          <div className={`flex items-center gap-1.5 ${isAgentsMet ? 'text-[#30d158]' : 'text-white/40'}`}>
                            <span>{isAgentsMet ? '✓' : '✗'}</span>
                            <span>{offer.requiredAgents}+ Agents ({agents.length})</span>
                          </div>
                        )}
                        {offer.requiredProductLevel && (
                          <div className={`flex items-center gap-1.5 ${isProductMet ? 'text-[#30d158]' : 'text-white/40'}`}>
                            <span>{isProductMet ? '✓' : '✗'}</span>
                            <span>Product Lv.{offer.requiredProductLevel}+</span>
                          </div>
                        )}
                        {reqComputeTier && (
                          <div className={`flex items-center gap-1.5 ${hasReqCompute ? 'text-[#30d158]' : 'text-white/40'}`}>
                            <span>{hasReqCompute ? '✓' : '✗'}</span>
                            <span className="truncate">{reqComputeTier.name.split(' ')[0]} Tier</span>
                          </div>
                        )}
                        {offer.requiresManager && (
                          <div className={`flex items-center gap-1.5 ${isManagerMet ? 'text-[#30d158]' : 'text-white/40'}`}>
                            <span>{isManagerMet ? '✓' : '✗'}</span>
                            <span>Manager Agent</span>
                          </div>
                        )}
                        {offer.requiresExecutive && (
                          <div className={`flex items-center gap-1.5 ${isExecMet ? 'text-[#30d158]' : 'text-white/40'}`}>
                            <span>{isExecMet ? '✓' : '✗'}</span>
                            <span>Executive Agent</span>
                          </div>
                        )}
                        {offer.requiresCEO && (
                          <div className={`flex items-center gap-1.5 ${isCEOMet ? 'text-[#30d158]' : 'text-white/40'}`}>
                            <span>{isCEOMet ? '✓' : '✗'}</span>
                            <span>CEO Agent</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    {offer.isAccepted ? (
                      <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/30 text-xs font-mono font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Round Closed (${(offer.valuation / 1000000).toFixed(1)}M Benchmark)
                      </div>
                    ) : offer.isExpired ? (
                      <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.03] text-white/40 border border-white/[0.06] text-xs font-mono">
                        Round Outgrown (Company ARR exceeds stage limit)
                      </div>
                    ) : (
                      <button
                        onClick={() => { soundEngine.playCash(); acceptVcOffer(offer.id); }}
                        disabled={!offer.isAvailable}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                          offer.isAvailable
                            ? 'apple-btn-primary shadow-sm'
                            : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
                        }`}
                      >
                        {offer.isAvailable ? `Sign Term Sheet (Raise $${(offer.raiseAmount / 1000000).toFixed(1)}M)` : 'Requirements Not Met'}
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
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-[#64d2ff]" />
              <span>Compute Infrastructure Tiers</span>
            </h2>
            <span className="text-xs font-mono font-medium text-white/80 tabular-nums">
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
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-white/[0.04] border-white/[0.14] shadow-xs'
                      : 'apple-card'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white text-xs">{tier.name}</span>
                    <span className="text-xs font-mono font-medium text-[#64d2ff] tabular-nums">
                      {tier.capacityCU} CU Capacity
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 mb-2 leading-relaxed">{tier.description}</p>

                  <div className="flex items-center justify-between text-xs font-mono text-white/40 pt-2 border-t border-white/[0.06] tabular-nums">
                    <span>Monthly OPEX: ${tier.monthlyCost}/mo</span>
                    <span>Setup: ${tier.setupCost.toLocaleString()}</span>
                  </div>

                  <div className="mt-3">
                    {isCurrent ? (
                      <div className="text-center py-1.5 rounded-xl bg-white/[0.06] text-white/80 border border-white/[0.08] text-xs font-mono font-medium">
                        Active Infrastructure
                      </div>
                    ) : (
                      <button
                        onClick={() => { soundEngine.playDeploy(); upgradeComputeTier(tier.id); }}
                        disabled={!canAfford}
                        className={`w-full py-1.5 px-3 rounded-xl font-medium text-xs transition-all ${
                          canAfford
                            ? 'apple-btn-secondary'
                            : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.05]'
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


