/**
 * Marketing Room Logic: SWIPE
 * Product Truth: company_sim_v1/product_final.md Section 9.1
 *
 * Q = Relevance + AudienceFit + TrendVelocity - Saturation - ChannelCost
 * Correct Action Bands:
 * Q <= 0: LEFT
 * Q 1..3: RIGHT
 * Q >= 4: UP (optimal), RIGHT (safe)
 */

import type { MarketingCard, MoneyCents } from '../types';
import { SeededRng } from '../rng';

export interface MarketingResolution {
  cardId: string;
  action: 'LEFT' | 'RIGHT' | 'UP';
  isCorrect: boolean;
  demandDeltaMilliGu: number;
  isLowQuality: boolean;
  cashDeltaCents: MoneyCents;
  comboCount: number;
}

export function createMarketingCard(rng: SeededRng, id: string): MarketingCard {
  const relevance = rng.int(0, 2);
  const audienceFit = rng.int(0, 2);
  const trendVelocity = rng.int(0, 2);
  const saturation = rng.int(0, 2);
  const channelCost = rng.int(0, 2);

  const scoreQ = relevance + audienceFit + trendVelocity - saturation - channelCost;

  return {
    id,
    relevance,
    audienceFit,
    trendVelocity,
    saturation,
    channelCost,
    scoreQ,
    expiresInSeconds: 14.0,
  };
}

export function resolveMarketingSwipe(
  card: MarketingCard,
  action: 'LEFT' | 'RIGHT' | 'UP',
  currentCombo: number,
  capitalUnitCents: MoneyCents
): MarketingResolution {
  const q = card.scoreQ;
  let isCorrect = false;
  let isLowQuality = false;
  let demandDeltaMilliGu = 0;
  let cashDeltaCents = 0n;
  let newCombo = currentCombo;

  // Up action costs 0.10 CU cash
  const upCostCents = capitalUnitCents / 10n;

  if (action === 'LEFT') {
    if (q <= 0) {
      isCorrect = true;
      newCombo += 1;
      // Refusing bad demand protects downstream capacity without creating demand
    } else {
      newCombo = 0;
    }
  } else if (action === 'RIGHT') {
    if (q <= 0) {
      // Wrong RIGHT on Q <= 0: +1 Low-Quality Demand GU
      isCorrect = false;
      isLowQuality = true;
      demandDeltaMilliGu = 1000;
      newCombo = 0;
    } else if (q >= 1 && q <= 3) {
      isCorrect = true;
      demandDeltaMilliGu = 1000;
      newCombo += 1;
    } else {
      // Safe RIGHT on Q >= 4: +1 Demand GU
      isCorrect = true;
      demandDeltaMilliGu = 1000;
      newCombo += 1;
    }
  } else if (action === 'UP') {
    cashDeltaCents = -upCostCents;
    if (q >= 4) {
      isCorrect = true;
      demandDeltaMilliGu = 2000;
      newCombo += 1;
    } else {
      // Wrong UP on Q < 4: +2 Low-Quality Demand GU, -0.10 CU Cash
      isCorrect = false;
      isLowQuality = true;
      demandDeltaMilliGu = 2000;
      newCombo = 0;
    }
  }

  // 5-streak combo bonus: grants +0.5 Demand GU (500 milli-GU)
  if (isCorrect && (action === 'RIGHT' || action === 'UP') && currentCombo >= 5) {
    demandDeltaMilliGu += 500;
    newCombo = 0; // Combo consumed
  }

  return {
    cardId: card.id,
    action,
    isCorrect,
    demandDeltaMilliGu,
    isLowQuality,
    cashDeltaCents,
    comboCount: newCombo,
  };
}
