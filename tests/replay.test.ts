import { describe, it, expect } from 'vitest';
import { SeededRng } from '../src/sim/rng';
import {
  createInitialCompanyState,
  executeMonthlyCashClose,
  executeQuarterClose,
  beginNextQuarter,
} from '../src/sim/engine';
import { createMarketingCard, resolveMarketingSwipe } from '../src/sim/rooms/marketing';
import { mergePieceIntoSlot } from '../src/sim/rooms/product';
import { createMonetizationOpportunity, resolvePricingTap } from '../src/sim/rooms/monetization';
import { CompanyState } from '../src/sim/types';

function runQuarterScenario(seed: number): {
  finalState: CompanyState;
  arr: bigint;
  cash: bigint;
  valuation: bigint;
} {
  const rng = new SeededRng(seed);
  let state = createInitialCompanyState({ seed, history: 'vibe_coder' });

  // 1. Marketing room: player evaluates card scoreQ and acts according to game rules:
  // Q <= 0 -> LEFT (refuse)
  // Q >= 4 -> UP (growth burst)
  // Q 1..3 -> RIGHT (safe accept)
  for (let i = 0; i < 8; i++) {
    const card = createMarketingCard(rng, `card_${i}`);
    let action: 'LEFT' | 'RIGHT' | 'UP' = 'RIGHT';
    if (card.scoreQ <= 0) {
      action = 'LEFT';
    } else if (card.scoreQ >= 4) {
      action = 'UP';
    } else {
      action = 'RIGHT';
    }

    const swipeRes = resolveMarketingSwipe(card, action, state.marketing.comboCount, state.capitalUnitCents);
    state = {
      ...state,
      demandBacklogMilliGu: state.demandBacklogMilliGu + swipeRes.demandDeltaMilliGu,
      cashCents: state.cashCents + swipeRes.cashDeltaCents,
      marketing: {
        ...state.marketing,
        comboCount: swipeRes.comboCount,
      },
    };
  }

  // Month 1 cash close
  state = executeMonthlyCashClose(state, 1);

  // 2. Product room: merge into slots
  for (let s = 0; s < 2; s++) {
    const slot = state.product.slots[s];
    const { nextSlot: slotAfterPrompt } = mergePieceIntoSlot(slot, 'PROMPT', state.capitalUnitCents);
    const { nextSlot: slotAfterDiff, resolution } = mergePieceIntoSlot(slotAfterPrompt, 'DIFF', state.capitalUnitCents);
    
    state = {
      ...state,
      activationBacklogMilliGu: state.activationBacklogMilliGu + resolution.activationDeltaMilliGu,
      churnThreatMilliGu: state.churnThreatMilliGu + resolution.churnThreatDeltaMilliGu,
      product: {
        ...state.product,
        slots: state.product.slots.map((sl, idx) => (idx === s ? slotAfterDiff : sl)),
      },
    };
  }

  // Month 2 cash close
  state = executeMonthlyCashClose(state, 2);

  // 3. Monetization room: capture pricing opportunity at random simulated cursor positions
  const opp = createMonetizationOpportunity(rng, 'opp_test_1');
  // Advance cursor by PRNG-driven amount
  opp.cursorPositionBps = opp.centerBps + rng.int(-2000, 2000);
  const pricingRes = resolvePricingTap(opp);
  const newArr = (state.growthUnitCents * BigInt(pricingRes.newCustomerArrMilliGu)) / 1000n;
  state = {
    ...state,
    arrCents: state.arrCents + newArr,
    currentQuarterNewCustomerArrCents: state.currentQuarterNewCustomerArrCents + newArr,
  };

  // Month 3 cash close
  state = executeMonthlyCashClose(state, 3);

  // Quarter Close & Valuation Lock
  state = executeQuarterClose(state);

  return {
    finalState: state,
    arr: state.arrCents,
    cash: state.cashCents,
    valuation: state.valuationCents,
  };
}

describe('Seeded Replay Determinism', () => {
  it('produces identical state and numbers when replayed with the same seed', () => {
    const seed = 133742;
    const run1 = runQuarterScenario(seed);
    const run2 = runQuarterScenario(seed);

    expect(run1.arr).toBe(run2.arr);
    expect(run1.cash).toBe(run2.cash);
    expect(run1.valuation).toBe(run2.valuation);
    expect(run1.finalState.valuationMultiple).toBe(run2.finalState.valuationMultiple);
    expect(run1.finalState.demandBacklogMilliGu).toBe(run2.finalState.demandBacklogMilliGu);
    expect(run1.finalState.activationBacklogMilliGu).toBe(run2.finalState.activationBacklogMilliGu);
    expect(run1.finalState.historicalBridges.length).toBe(run2.finalState.historicalBridges.length);

    // Exact ARR bridge match
    const b1 = run1.finalState.historicalBridges[0];
    const b2 = run2.finalState.historicalBridges[0];
    expect(b1.endingArrCents).toBe(b2.endingArrCents);
    expect(b1.newCustomerArrCents).toBe(b2.newCustomerArrCents);
    expect(b1.expansionArrCents).toBe(b2.expansionArrCents);
    expect(b1.churnedArrCents).toBe(b2.churnedArrCents);
  });

  it('produces divergent results when run with different seeds', () => {
    const runA = runQuarterScenario(12345);
    const runB = runQuarterScenario(67890);

    // Seeds generate different cards, qualities, and opportunity zones
    const isDifferent =
      runA.arr !== runB.arr ||
      runA.cash !== runB.cash ||
      runA.finalState.demandBacklogMilliGu !== runB.finalState.demandBacklogMilliGu;

    expect(isDifferent).toBe(true);
  });
});
