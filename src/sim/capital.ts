/**
 * Capital, Debt, Line of Credit & Venture Financing Invariants
 * Product Truth: company_sim_v1/product_final.md Section 8, 13, 14
 */

import type {
  MoneyCents,
  BasisPoints,
  GrowthMultiple,
  FinancingRound,
  FounderHistoryId,
} from './types';
import { BPS_DIVISOR, dollarsToCents } from './math';

export const LOC_UNLOCK_ARR_CENTS: MoneyCents = 500_000n * 100n; // $500,000 in cents

/**
 * Section 13.2: Credit limit
 * LOC_LIMIT = min(15% x ARR, 1% x Current Valuation)
 * Unlocks at ARR >= $500,000.
 */
export function calcLocLimit(arrCents: MoneyCents, valuationCents: MoneyCents): MoneyCents {
  if (arrCents < LOC_UNLOCK_ARR_CENTS) {
    return 0n;
  }
  const arrShare = (arrCents * 15n) / 100n;       // 15% ARR
  const valShare = valuationCents / 100n;         // 1% Valuation
  return arrShare < valShare ? arrShare : valShare;
}

/**
 * Section 13.3: Risk premium by valuation multiple
 */
export function getMultipleRiskPremiumBps(multiple: GrowthMultiple): BasisPoints {
  switch (multiple) {
    case 2:
      return 1_000; // +10 pp
    case 4:
      return 800;   // +8 pp
    case 6:
      return 600;   // +6 pp
    case 10:
      return 300;   // +3 pp
    case 14:
      return 100;   // +1 pp
    case 20:
    case 28:
    case 40:
    default:
      return 0;     // +0 pp
  }
}

/**
 * Section 13.3 & 13.4: Line of Credit APR
 * APR = 10% base + 10% * utilization + multiple risk premium (+ 6% if over limit)
 */
export function calcLocAprBps(
  debtCents: MoneyCents,
  limitCents: MoneyCents,
  multiple: GrowthMultiple,
  isLeveragedGrowthCurse: boolean = false
): { aprBps: BasisPoints; isOverLimit: boolean; utilizationBps: BasisPoints } {
  const isOverLimit = limitCents > 0n && debtCents > limitCents;
  let utilizationBps = 0;

  if (limitCents > 0n) {
    const rawUtil = Number((debtCents * BigInt(BPS_DIVISOR)) / limitCents);
    utilizationBps = Math.min(BPS_DIVISOR, Math.max(0, rawUtil));
  }

  // Base: 10% (1,000 bps) + 10% * utilization (up to 1,000 bps) + risk premium
  let aprBps = 1_000 + Math.round((1_000 * utilizationBps) / BPS_DIVISOR) + getMultipleRiskPremiumBps(multiple);

  if (isOverLimit) {
    aprBps += 600; // +6 pp surcharge
  }

  if (isLeveragedGrowthCurse) {
    aprBps += 800; // Leveraged Growth curse: +8 pp
  }

  return { aprBps, isOverLimit, utilizationBps };
}

/**
 * Section 13.3: Monthly interest = Debt x APR / 12
 */
export function calcMonthlyInterestCents(debtCents: MoneyCents, aprBps: BasisPoints): MoneyCents {
  if (debtCents <= 0n) return 0n;
  const annualInterest = (debtCents * BigInt(aprBps)) / BigInt(BPS_DIVISOR);
  return annualInterest / 12n;
}

/**
 * Section 14.1: Pre-seed SAFE offer calculation
 */
export function calcPreSeedOffer(
  valuationCents: MoneyCents,
  history: FounderHistoryId
): {
  safeCapCents: MoneyCents;
  raiseOptionsCents: MoneyCents[];
} {
  const historyMod = history === 'repeat_founder' ? 1.30 : 1.0;
  const modifiedAnchor = dollarsToCents(15_000_000 * historyMod);
  const valShare = (valuationCents * 75n) / 100n; // 75% of Valuation

  const safeCapCents = valShare > modifiedAnchor ? valShare : modifiedAnchor;

  return {
    safeCapCents,
    raiseOptionsCents: [
      dollarsToCents(750_000),   // $0.75M
      dollarsToCents(1_500_000), // $1.50M
      dollarsToCents(2_250_000), // $2.25M
    ],
  };
}

/**
 * Section 14.2, 14.3, 14.4: Priced round offer calculations
 */
export function calcPricedRoundOffer(
  stage: 'seed' | 'series_a' | 'series_b',
  valuationCents: MoneyCents,
  history: FounderHistoryId
): {
  preMoneyCents: MoneyCents;
  raiseOptionsCents: MoneyCents[];
} {
  let refPreMoneyDollars: number;
  let raiseOptionsDollars: number[];
  let historyMod = 1.0;

  if (stage === 'seed') {
    refPreMoneyDollars = 20_200_000;
    if (history === 'repeat_founder') historyMod = 1.15;
    raiseOptionsDollars = [2_050_000, 4_100_000, 6_150_000];
  } else if (stage === 'series_a') {
    refPreMoneyDollars = 65_600_000;
    raiseOptionsDollars = [7_200_000, 14_400_000, 21_600_000];
  } else {
    refPreMoneyDollars = 166_000_000;
    raiseOptionsDollars = [12_500_000, 25_000_000, 37_500_000];
  }

  const modifiedRefCents = dollarsToCents(refPreMoneyDollars * historyMod);
  const valShareCents = (valuationCents * 65n) / 100n; // 65% of Valuation
  const preMoneyCents = valShareCents > modifiedRefCents ? valShareCents : modifiedRefCents;

  return {
    preMoneyCents,
    raiseOptionsCents: raiseOptionsDollars.map(dollarsToCents),
  };
}

/**
 * Section 14.5: Multiplicative founder dilution compounding
 * For SAFE: dilutionBps = floor(CashRaised * 10,000 / safeCap)
 * For Priced: dilutionBps = floor(CashRaised * 10,000 / (preMoney + CashRaised))
 * OwnershipAfter = floor(OwnershipBefore * (10,000 - dilutionBps) / 10,000)
 */
export function executeFinancingRound(
  stage: 'preseed' | 'seed' | 'series_a' | 'series_b',
  quarter: number,
  cashRaisedCents: MoneyCents,
  valuationCents: MoneyCents,
  history: FounderHistoryId,
  ownershipBeforeBps: BasisPoints
): FinancingRound {
  let dilutionBps: BasisPoints;
  let preMoneyCents: MoneyCents | undefined;
  let safeCapCents: MoneyCents | undefined;

  if (stage === 'preseed') {
    const offer = calcPreSeedOffer(valuationCents, history);
    safeCapCents = offer.safeCapCents;
    dilutionBps = Number((cashRaisedCents * BigInt(BPS_DIVISOR)) / safeCapCents);
  } else {
    const offer = calcPricedRoundOffer(stage, valuationCents, history);
    preMoneyCents = offer.preMoneyCents;
    const postMoneyCents = preMoneyCents + cashRaisedCents;
    dilutionBps = Number((cashRaisedCents * BigInt(BPS_DIVISOR)) / postMoneyCents);
  }

  // Cap dilution at 100% (10,000 bps)
  if (dilutionBps > BPS_DIVISOR) dilutionBps = BPS_DIVISOR;

  // Multiplicative ownership update
  const ownershipAfterBps = Math.floor(
    (ownershipBeforeBps * (BPS_DIVISOR - dilutionBps)) / BPS_DIVISOR
  );

  return {
    stage,
    quarter,
    cashRaisedCents,
    preMoneyCents,
    safeCapCents,
    dilutionBps,
    ownershipBeforeBps,
    ownershipAfterBps,
  };
}
