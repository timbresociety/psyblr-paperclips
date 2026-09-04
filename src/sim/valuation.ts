/**
 * Valuation and Founder Stake Value Invariants
 * Product Truth: company_sim_v1/product_final.md Section 2.3, 2.4
 *
 * VALUATION = CURRENT_ARR x CURRENT_GROWTH_MULTIPLE
 * FOUNDER_STAKE_VALUE = FOUNDER_OWNERSHIP x VALUATION
 */

import type { MoneyCents, BasisPoints, GrowthMultiple } from './types';
import { BPS_DIVISOR } from './math';

export function calcValuation(arrCents: MoneyCents, multiple: GrowthMultiple): MoneyCents {
  if (arrCents < 0n) throw new Error('arrCents cannot be negative');
  return arrCents * BigInt(multiple);
}

export function calcFounderStakeValue(
  valuationCents: MoneyCents,
  founderOwnershipBps: BasisPoints
): MoneyCents {
  if (valuationCents < 0n) throw new Error('valuationCents cannot be negative');
  if (founderOwnershipBps < 0 || founderOwnershipBps > BPS_DIVISOR) {
    throw new Error(`founderOwnershipBps must be between 0 and ${BPS_DIVISOR}, received ${founderOwnershipBps}`);
  }
  return (valuationCents * BigInt(founderOwnershipBps)) / BigInt(BPS_DIVISOR);
}
