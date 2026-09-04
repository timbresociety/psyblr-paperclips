import React from 'react';
import { useV1Store } from '../../state/v1Store';
import { formatMoney } from '../../sim/math';

export const QuarterReviewModal: React.FC = () => {
  const { company, activeModal, openModal } = useV1Store();

  if (activeModal !== 'intermission_review') return null;

  const latestBridge = company.historicalBridges[company.historicalBridges.length - 1];
  const startArr = latestBridge ? latestBridge.startingArrCents : company.quarterStartArrCents;
  const endArr = company.arrCents;
  const newCustomer = latestBridge ? latestBridge.newCustomerArrCents : 0n;
  const expansion = latestBridge ? latestBridge.expansionArrCents : 0n;
  const churned = latestBridge ? latestBridge.churnedArrCents : 0n;

  const growthPct = startArr > 0n ? Number(((endArr - startArr) * 10000n) / startArr) / 100 : 0;
  const founderStake = (company.valuationCents * BigInt(company.founderOwnershipBps)) / 10000n;

  const handleNext = () => {
    if (company.isBankrupt) {
      openModal('game_over');
    } else if (company.quarter >= 4) {
      openModal('intermission_commitment');
    } else {
      openModal('intermission_shop');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c0c0e] border border-[#1e1e24] rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1e1e24] pb-5">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block">
              SYS.FINANCE // QUARTER {company.quarter} CLOSE
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Financial Performance Statement
            </h2>
          </div>
          <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white flex items-center justify-center font-bold font-mono text-sm">
            Q{company.quarter}
          </div>
        </div>

        {/* Canonical ARR Bridge Breakdown */}
        <div className="space-y-2.5 font-mono text-xs bg-[#111114] border border-[#1e1e24] p-4 rounded-xl">
          <div className="flex justify-between text-white/60">
            <span>STARTING ARR</span>
            <span className="text-white font-semibold">{formatMoney(startArr)}</span>
          </div>
          <div className="flex justify-between text-[#30d158]">
            <span>+ NEW CUSTOMER ARR</span>
            <span className="font-semibold">+{formatMoney(newCustomer)}</span>
          </div>
          <div className="flex justify-between text-white">
            <span>+ EXPANSION ARR</span>
            <span className="font-semibold">+{formatMoney(expansion)}</span>
          </div>
          <div className="flex justify-between text-[#ff453a]">
            <span>- CHURNED ARR</span>
            <span className="font-semibold">-{formatMoney(churned)}</span>
          </div>
          <div className="pt-2 border-t border-[#1e1e24] flex justify-between text-sm font-bold text-white">
            <span>= ENDING ARR</span>
            <span className="text-[#30d158]">{formatMoney(endArr)}</span>
          </div>
        </div>

        {/* Growth & Re-rating Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
          <div className="bg-[#111114] p-3 rounded-lg border border-[#1e1e24]">
            <span className="text-[10px] text-white/40 block">GROWTH</span>
            <span className={`text-sm font-bold ${growthPct >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
              {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%
            </span>
          </div>

          <div className="bg-[#111114] p-3 rounded-lg border border-[#1e1e24]">
            <span className="text-[10px] text-white/40 block">MULTIPLE</span>
            <span className="text-sm font-bold text-white">
              {company.valuationMultiple}x
            </span>
          </div>

          <div className="bg-[#111114] p-3 rounded-lg border border-[#1e1e24]">
            <span className="text-[10px] text-white/40 block">VALUATION</span>
            <span className="text-sm font-bold text-white">
              {formatMoney(company.valuationCents)}
            </span>
          </div>

          <div className="bg-[#111114] p-3 rounded-lg border border-[#1e1e24]">
            <span className="text-[10px] text-white/40 block">FOUNDER STAKE</span>
            <span className="text-sm font-bold text-[#30d158]">
              {formatMoney(founderStake)}
            </span>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleNext}
          className={`w-full py-3 font-semibold rounded-xl transition flex items-center justify-center gap-2 text-xs font-mono tracking-wider ${
            company.isBankrupt
              ? 'bg-[#ff453a] hover:bg-[#ff453a]/90 text-black font-bold animate-pulse'
              : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          <span>{company.isBankrupt ? 'VIEW BOARD TERMINATION NOTICE →' : 'PROCEED TO INTERMISSION →'}</span>
        </button>
      </div>
    </div>
  );
};

