/**
 * Fixed-point and Integer Currency Arithmetic Utilities
 * Product Truth: company_sim_v1/product_final.md Section 4, 5, 7
 */

import type { MoneyCents, BasisPoints, GrowthMultiple } from './types';

export const CENTS_PER_DOLLAR = 100n;
export const BPS_DIVISOR = 10_000;

export function dollarsToCents(dollars: number): MoneyCents {
  return BigInt(Math.round(dollars * 100));
}

export function centsToDollars(cents: MoneyCents): number {
  return Number(cents) / 100;
}

export function formatMoney(cents: MoneyCents | number): string {
  const c = typeof cents === 'bigint' ? cents : BigInt(Math.round(cents));
  const isNegative = c < 0n;
  const absCents = isNegative ? -c : c;
  const dollars = absCents / 100n;
  const remCents = absCents % 100n;

  // For compact large numbers ($1.0M, $10.5B, etc.)
  if (dollars >= 1_000_000_000n) {
    const val = Number(absCents) / 100_000_000_000;
    return `${isNegative ? '-' : ''}$${val.toFixed(val >= 10 ? 1 : 2)}B`;
  }
  if (dollars >= 1_000_000n) {
    const val = Number(absCents) / 100_000_000;
    return `${isNegative ? '-' : ''}$${val.toFixed(val >= 10 ? 1 : 2)}M`;
  }
  if (dollars >= 1_000n) {
    const val = Number(absCents) / 100_000;
    return `${isNegative ? '-' : ''}$${val.toFixed(val >= 100 ? 0 : 1)}K`;
  }

  return `${isNegative ? '-' : ''}$${dollars.toLocaleString()}.${remCents.toString().padStart(2, '0')}`;
}

export function formatBps(bps: BasisPoints): string {
  const percent = bps / 100;
  return `${percent.toFixed(percent % 1 === 0 ? 0 : 2)}%`;
}

export function multiplyBps(cents: MoneyCents, bps: BasisPoints): MoneyCents {
  return (cents * BigInt(bps)) / BigInt(BPS_DIVISOR);
}

export function divideCents(
  cents: MoneyCents,
  divisor: bigint | number
): { quotient: MoneyCents; remainder: MoneyCents } {
  const div = typeof divisor === 'bigint' ? divisor : BigInt(divisor);
  if (div === 0n) throw new Error('Divide by zero');
  return {
    quotient: cents / div,
    remainder: cents % div,
  };
}

/**
 * Section 7.1 & 7.2: Normalized economic units locked at quarter start.
 * GU = max($25,000, 1% * Starting ARR)
 * CU = max($5,000, 0.75% * Starting ARR)
 */
export function calcUnits(arrStartCents: MoneyCents): {
  growthUnitCents: MoneyCents;
  capitalUnitCents: MoneyCents;
} {
  const baseGu = 25_000n * CENTS_PER_DOLLAR; // $25,000 in cents
  const arrPctGu = arrStartCents / 100n;     // 1% of Starting ARR
  const growthUnitCents = arrPctGu > baseGu ? arrPctGu : baseGu;

  const baseCu = 5_000n * CENTS_PER_DOLLAR;   // $5,000 in cents
  const arrPctCu = (arrStartCents * 75n) / 10_000n; // 0.75% of Starting ARR
  const capitalUnitCents = arrPctCu > baseCu ? arrPctCu : baseCu;

  return { growthUnitCents, capitalUnitCents };
}

/**
 * Section 5.3: Growth multiple table from quarterly ARR growth.
 * Growth = (ARR_END - ARR_START) / ARR_START
 */
export function calcGrowthMultiple(
  arrStartCents: MoneyCents,
  arrEndCents: MoneyCents
): { multiple: GrowthMultiple; growthBps: number } {
  if (arrStartCents <= 0n) {
    return { multiple: 2, growthBps: 0 };
  }

  const delta = arrEndCents - arrStartCents;
  const growthBps = Number((delta * BigInt(BPS_DIVISOR)) / arrStartCents);

  let multiple: GrowthMultiple;
  if (growthBps < 0) {
    multiple = 2;
  } else if (growthBps < 1_000) {      // <10%
    multiple = 4;
  } else if (growthBps < 2_500) {      // 10% to <25%
    multiple = 6;
  } else if (growthBps < 5_000) {      // 25% to <50%
    multiple = 10;
  } else if (growthBps < 7_500) {      // 50% to <75%
    multiple = 14;
  } else if (growthBps < 10_000) {     // 75% to <100%
    multiple = 20;
  } else if (growthBps < 15_000) {     // 100% to <150%
    multiple = 28;
  } else {                             // 150%+
    multiple = 40;
  }

  return { multiple, growthBps };
}
