import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { COMPUTE_TIERS } from '../../data/vcOffers';
import { DollarSign, Cpu, Handshake, CheckCircle2 } from 'lucide-react';

export const FinanceScreen: React.FC = () => {
  const {
    mrr,
    arr,
    cash,
    valuation,
    valuationMultiple,
    founderOwnership,
    totalCapitalRaised,
    vcOffers,
    acceptVcOffer,
    currentComputeTierId,
    upgradeComputeTier,
    trust,
    productLevel,
    agents
  } = useGameStore();

  const currentTier = COMPUTE_TIERS.find(t => t.id === currentComputeTierId) || COMPUTE_TIERS[0];
  const monthlyBurn = currentTier.monthlyCost;
  const runwayMonths = monthlyBurn > 0 ? (cash / monthlyBurn).toFixed(1) : 'Infinite';

  const hasManager = agents.some(a => a.role === 'MANAGER');
  const hasExec = agents.some(a => a.role === 'EXECUTIVE');
  const hasCEO = agents.some(a => a.role === 'CEO');

  return (
    <div className="space-y-6 text-left">
      {/* Financial Overview Header */}
      <div className="bg-[#111422] border border-[#20263c] rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-black tracking-tight text-white">
                FINANCIALS & VALUATION
              </h2>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                ${mrr.toLocaleString()} MRR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Valuation is derived from ARR multiplied by a multiple driven by autonomous scale, hype, and low tech debt.
            </p>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-xs font-mono text-slate-400">Company Valuation:</span>
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

        {/* Valuation Formula Breakdown */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#171b2d] p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Annual Run Rate (ARR)</span>
            <span className="text-sm font-bold text-white">${arr.toLocaleString()}</span>
          </div>
          <div className="bg-[#171b2d] p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Valuation Multiple</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-purple-300">{valuationMultiple.toFixed(2)}x</span>
              {agents.length === 0 ? (
                <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800" title="Key-person risk penalty">
                  MANUAL RISK
                </span>
              ) : (
                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  {agents.length} AGENTS
                </span>
              )}
            </div>
          </div>
          <div className="bg-[#171b2d] p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Total Capital Raised</span>
            <span className="text-sm font-bold text-emerald-400">${totalCapitalRaised.toLocaleString()}</span>
          </div>
          <div className="bg-[#171b2d] p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Runway</span>
            <span className="text-sm font-bold text-cyan-300">{runwayMonths} Months</span>
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
                    <span>Valuation: ${(offer.valuation / 1000000).toFixed(1)}M</span>
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
                        <CheckCircle2 className="w-3.5 h-3.5" /> ROUND CLOSED
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
                          ? `Accept Term Sheet (+${offer.hypeBoost}% Hype)`
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
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Compute Infrastructure Tiers
          </h3>

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
                    <span>Setup: ${tier.setupCost}</span>
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
                            ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
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
