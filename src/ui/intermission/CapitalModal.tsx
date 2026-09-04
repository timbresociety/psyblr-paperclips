import React, { useState } from 'react';
import { useV1Store } from '../../state/v1Store';
import { formatMoney, formatBps, dollarsToCents } from '../../sim/math';
import {
  calcLocLimit,
  calcLocAprBps,
  calcPreSeedOffer,
  calcPricedRoundOffer,
} from '../../sim/capital';

export const CapitalModal: React.FC = () => {
  const {
    activeModal,
    company,
    drawLoc,
    repayLoc,
    acceptFinancing,
    finishIntermission,
  } = useV1Store();

  const [drawInput, setDrawInput] = useState<string>('25000');
  const [selectedRaiseOptionIndex, setSelectedRaiseOptionIndex] = useState<number>(1);

  if (activeModal !== 'intermission_capital') return null;

  const isCapitalUnlocked = company.quarter >= 4;

  const locLimit = calcLocLimit(company.arrCents, company.valuationCents);
  const isLeveragedGrowth = company.upgrades.includes('cursed_leveraged_growth');
  const aprInfo = calcLocAprBps(company.debtCents, locLimit, company.valuationMultiple, isLeveragedGrowth);
  const availableCredit = locLimit > company.debtCents ? locLimit - company.debtCents : 0n;

  // Determine current eligible funding round
  let currentStage: 'preseed' | 'seed' | 'series_a' | 'series_b' = 'preseed';
  if (company.financingRounds.some((r) => r.stage === 'series_a')) {
    currentStage = 'series_b';
  } else if (company.financingRounds.some((r) => r.stage === 'seed')) {
    currentStage = 'series_a';
  } else if (company.financingRounds.some((r) => r.stage === 'preseed')) {
    currentStage = 'seed';
  }

  const fundingOffer =
    currentStage === 'preseed'
      ? calcPreSeedOffer(company.valuationCents, company.founderHistory)
      : calcPricedRoundOffer(currentStage, company.valuationCents, company.founderHistory);

  const selectedRaiseCents = fundingOffer.raiseOptionsCents[selectedRaiseOptionIndex] || fundingOffer.raiseOptionsCents[0];

  const handleDraw = () => {
    const amount = dollarsToCents(parseFloat(drawInput) || 0);
    drawLoc(amount);
  };

  const handleRepay = () => {
    const amount = dollarsToCents(parseFloat(drawInput) || 0);
    repayLoc(amount);
  };

  const handleAcceptFunding = () => {
    acceptFinancing(currentStage, selectedRaiseCents);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto p-3 sm:p-4 md:p-6 flex justify-center items-start sm:items-center">
      <div className="bg-[#0c0c0e] border border-[#1e1e24] rounded-2xl max-w-5xl w-full p-4 sm:p-6 space-y-4 sm:space-y-4.5 shadow-2xl text-left my-auto">
        {/* Header */}
        <div className="border-b border-[#1e1e24] pb-3.5 sm:pb-4">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-white/40 block">
            SYS.CAPITAL // CAPITAL STRUCTURE & LIQUIDITY
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
            Capital Structure Strategy
          </h2>
          <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
            Capital buys automation licenses and absorbs operational shockwaves, but does not mint ARR. Institutional financing unlocks in Q4 after proving product-market traction.
          </p>
        </div>

        {/* 3 Capital Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* 1. BOOTSTRAP */}
          <div className="p-5 rounded-xl bg-[#111114] border border-[#1e1e24] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold font-mono text-white tracking-tight uppercase">
                  1. Organic Bootstrap
                </h3>
                <span className="text-[10px] font-mono text-[#30d158] bg-[#30d158]/10 border border-[#30d158]/30 px-1.5 py-0.5 rounded">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed mt-2">
                Retain 100% of the cap table. Fund all engineering and operations strictly through customer collections and prepayments.
              </p>
              <div className="mt-4 p-3 bg-black/40 border border-[#1e1e24] rounded-lg font-mono text-xs space-y-1.5">
                <div className="flex justify-between text-white/50">
                  <span>Dilution:</span>
                  <span className="text-[#30d158] font-bold">0.00%</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Debt Interest:</span>
                  <span className="text-[#30d158] font-bold">$0</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Founder Equity:</span>
                  <span className="text-white font-bold">{formatBps(company.founderOwnershipBps)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#1e1e24] text-center text-[11px] font-mono text-white/40">
              DEFAULT ALIVE // NO DILUTION
            </div>
          </div>

          {/* 2. LINE OF CREDIT */}
          <div className="p-5 rounded-xl bg-[#111114] border border-[#1e1e24] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold font-mono text-white tracking-tight uppercase">
                  2. Line of Credit
                </h3>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isCapitalUnlocked
                    ? 'text-[#0a84ff] bg-[#0a84ff]/10 border-[#0a84ff]/30'
                    : 'text-white/40 bg-white/[0.04] border-white/[0.08]'
                }`}>
                  {isCapitalUnlocked ? 'ELIGIBLE' : 'Q4 LOCK'}
                </span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed mt-2">
                Revolving facility underwritten by recurring ARR and enterprise valuation. Non-dilutive working capital.
              </p>

              <div className="mt-4 p-3 bg-black/40 border border-[#1e1e24] rounded-lg font-mono text-xs space-y-1.5">
                <div className="flex justify-between text-white/50">
                  <span>Limit:</span>
                  <span className="text-white font-bold">{isCapitalUnlocked ? formatMoney(locLimit) : '$0'}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Available:</span>
                  <span className="text-[#30d158] font-bold">{isCapitalUnlocked ? formatMoney(availableCredit) : '$0'}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Current Debt:</span>
                  <span className={company.debtCents > 0n ? 'text-[#ff9f0a] font-bold' : 'text-white'}>
                    {formatMoney(company.debtCents)}
                  </span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>APR:</span>
                  <span className="text-[#ffd60a] font-bold">{formatBps(aprInfo.aprBps)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <input
                type="number"
                disabled={!isCapitalUnlocked}
                value={drawInput}
                onChange={(e) => setDrawInput(e.target.value)}
                placeholder="Amount in $"
                className="w-full bg-black/60 border border-[#1e1e24] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none disabled:opacity-30"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDraw}
                  disabled={!isCapitalUnlocked || availableCredit <= 0n}
                  className="py-1.5 bg-white text-black font-bold font-mono text-xs rounded-lg hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  DRAW
                </button>
                <button
                  onClick={handleRepay}
                  disabled={!isCapitalUnlocked || company.debtCents <= 0n}
                  className="py-1.5 bg-white/[0.08] text-white font-bold font-mono text-xs rounded-lg hover:bg-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  REPAY
                </button>
              </div>
            </div>
          </div>

          {/* 3. VENTURE CAPITAL */}
          <div className="p-5 rounded-xl bg-[#111114] border border-[#1e1e24] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold font-mono text-white tracking-tight uppercase">
                  3. Venture Capital
                </h3>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isCapitalUnlocked
                    ? 'text-[#bf5af2] bg-[#bf5af2]/10 border-[#bf5af2]/30'
                    : 'text-white/40 bg-white/[0.04] border-white/[0.08]'
                }`}>
                  {isCapitalUnlocked ? 'TERMS READY' : 'Q4 LOCK'}
                </span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed mt-2">
                Institutional priced rounds. Issue newly minted shares in exchange for massive expansion firepower.
              </p>

              <div className="mt-4 p-3 bg-black/40 border border-[#1e1e24] rounded-lg font-mono text-xs space-y-1.5">
                <div className="flex justify-between text-white/50">
                  <span>Stage:</span>
                  <span className="text-[#bf5af2] font-bold uppercase">{currentStage}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Valuation:</span>
                  <span className="text-white font-bold">
                    {'safeCapCents' in fundingOffer
                      ? formatMoney(fundingOffer.safeCapCents)
                      : formatMoney(fundingOffer.preMoneyCents)}
                  </span>
                </div>
              </div>

              {/* Raise Options Select */}
              {isCapitalUnlocked && (
                <div className="mt-3 space-y-1">
                  <span className="text-[10px] font-mono text-white/40 block">Select Check Size:</span>
                  <div className="grid grid-cols-3 gap-1">
                    {fundingOffer.raiseOptionsCents.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedRaiseOptionIndex(i)}
                        className={`py-1 rounded font-mono text-[10px] font-bold border transition ${
                          selectedRaiseOptionIndex === i
                            ? 'bg-white text-black border-white'
                            : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                        }`}
                      >
                        {formatMoney(opt)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleAcceptFunding}
              disabled={!isCapitalUnlocked}
              className={`mt-4 w-full py-2 font-bold font-mono text-xs rounded-lg transition ${
                isCapitalUnlocked
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-white/[0.04] text-white/30 cursor-not-allowed'
              }`}
            >
              {isCapitalUnlocked
                ? `ACCEPT TERM SHEET (${formatMoney(selectedRaiseCents)})`
                : 'UNDERWRITING LOCKED (Q4)'}
            </button>
          </div>
        </div>

        {/* Footer Finish Button */}
        <div className="pt-4 border-t border-[#1e1e24] flex justify-end">
          <button
            onClick={finishIntermission}
            className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition flex items-center gap-2 text-xs font-mono tracking-wider"
          >
            <span>START QUARTER {company.quarter + 1} →</span>
          </button>
        </div>
      </div>
    </div>
  );
};

