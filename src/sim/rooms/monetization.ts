/**
 * Monetization Room Logic: TAP
 * Product Truth: company_sim_v1/product_final.md Section 9.3
 *
 * Base zone proportions:
 * Too Cheap:     20% (0.0 to 0.20)  -> +0.5 New Customer ARR GU
 * Good:          25% (0.20 to 0.45) -> +1.0 New Customer ARR GU
 * Perfect:       10% (0.45 to 0.55) -> +1.5 New Customer ARR GU
 * Good:          25% (0.55 to 0.80) -> +1.0 New Customer ARR GU
 * Too Expensive: 20% (0.80 to 1.00) -> 0.0 New Customer ARR GU
 */

import type { MonetizationOpportunity } from '../types';
import { SeededRng } from '../rng';

export type PricingZone = 'TOO_CHEAP' | 'GOOD' | 'PERFECT' | 'TOO_EXPENSIVE';

export interface PricingResolution {
  opportunityId: string;
  zone: PricingZone;
  newCustomerArrMilliGu: number;
}

export function createMonetizationOpportunity(
  rng: SeededRng,
  id: string,
  isMonetizationNerdHistory: boolean = false
): MonetizationOpportunity {
  // Band shifts between 3,000 and 7,000 bps with varied widths (2,800 to 4,200 bps)
  const centerBps = rng.int(3_200, 6_800);
  const widthBps = rng.int(2_800, 4_200); // Varied width for each customer deal
  const speed = (6_000 / 1.8) * (isMonetizationNerdHistory ? 0.85 : 1.0);

  return {
    id,
    cursorPositionBps: centerBps - widthBps / 2,
    cursorSpeedBpsPerSec: speed,
    cursorDirection: 1,
    centerBps,
    widthBps,
    expiresInSeconds: 5.0,
  };
}

export function resolvePricingTap(
  opp: MonetizationOpportunity,
  perfectZoneWidthMultiplier: number = 1.0,
  isEnterprisePackagingUpgrade: boolean = false
): PricingResolution {
  // Normalize cursor position relative to band [center - width/2, center + width/2]
  const halfWidth = opp.widthBps / 2;
  const bandStart = opp.centerBps - halfWidth;
  const bandEnd = opp.centerBps + halfWidth;

  const pos = opp.cursorPositionBps;

  // Normalized relative coordinate: 0.0 to 1.0 within band
  let relPos = 0.5;
  if (pos <= bandStart) relPos = 0.0;
  else if (pos >= bandEnd) relPos = 1.0;
  else relPos = (pos - bandStart) / opp.widthBps;

  // Calculate zone boundaries
  // Default Perfect is [0.45, 0.55] (10% wide)
  const perfectHalf = 0.05 * perfectZoneWidthMultiplier;
  const perfectMin = 0.50 - perfectHalf;
  const perfectMax = 0.50 + perfectHalf;

  let zone: PricingZone;
  let newCustomerArrMilliGu = 0;

  if (relPos < 0.20) {
    zone = 'TOO_CHEAP';
    newCustomerArrMilliGu = 500; // +0.5 GU
  } else if (relPos < perfectMin) {
    zone = 'GOOD';
    newCustomerArrMilliGu = 1000; // +1.0 GU
  } else if (relPos <= perfectMax) {
    zone = 'PERFECT';
    newCustomerArrMilliGu = isEnterprisePackagingUpgrade ? 2500 : 1500; // +1.5 GU (or +2.5 GU with upgrade)
  } else if (relPos <= 0.80) {
    zone = 'GOOD';
    newCustomerArrMilliGu = 1000; // +1.0 GU
  } else {
    zone = 'TOO_EXPENSIVE';
    newCustomerArrMilliGu = 0;
  }

  return {
    opportunityId: opp.id,
    zone,
    newCustomerArrMilliGu,
  };
}
