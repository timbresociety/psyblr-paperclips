/**
 * Canonical Accounting and Simulation Invariant Tests
 * Product Truth: company_sim_v1/product_final.md Section 2, 5, 13, 14
 */

import { test, expect } from 'vitest';
import assert from 'node:assert/strict';

import {
  dollarsToCents,
  centsToDollars,
  formatMoney,
  calcUnits,
  calcGrowthMultiple,
  multiplyBps,
} from '../src/sim/math.ts';
import { createArrBridge, assertArrBridge } from '../src/sim/arrBridge.ts';
import { calcValuation, calcFounderStakeValue } from '../src/sim/valuation.ts';
import {
  calcLocLimit,
  calcLocAprBps,
  calcMonthlyInterestCents,
  executeFinancingRound,
} from '../src/sim/capital.ts';
import { calcComplexity, calcStrainDetails } from '../src/sim/complexity.ts';
import {
  createInitialCompanyState,
  executeMonthlyCashClose,
  executeQuarterClose,
  beginNextQuarter,
  STARTING_CASH_CENTS,
} from '../src/sim/engine.ts';
import { SeededRng } from '../src/sim/rng.ts';

test('1. ARR Bridge Exactness & Invariants', () => {
  const start = dollarsToCents(100_000);
  const newCust = dollarsToCents(25_000);
  const expansion = dollarsToCents(5_000);
  const churned = dollarsToCents(2_000);

  const bridge = createArrBridge(start, newCust, expansion, churned);

  // ARR_END = ARR_START + NEW_CUSTOMER_ARR + EXPANSION_ARR - CHURNED_ARR
  assert.equal(bridge.endingArrCents, dollarsToCents(128_000));
  assert.equal(bridge.newCustomerArrCents + bridge.expansionArrCents, dollarsToCents(30_000));

  // Asserting invariant throws on mismatch
  assert.throws(() => {
    assertArrBridge({
      startingArrCents: start,
      newCustomerArrCents: newCust,
      expansionArrCents: expansion,
      churnedArrCents: churned,
      endingArrCents: dollarsToCents(150_000), // invalid ending
    });
  });

  // Churn cannot push ARR below 0
  const catastrophicBridge = createArrBridge(start, 0n, 0n, dollarsToCents(200_000));
  assert.equal(catastrophicBridge.endingArrCents, 0n);
});

test('2. Growth Multiple Table Thresholds', () => {
  const start = dollarsToCents(100_000);

  // Negative growth -> 2x
  assert.equal(calcGrowthMultiple(start, dollarsToCents(90_000)).multiple, 2);

  // 0% to <10% -> 4x
  assert.equal(calcGrowthMultiple(start, dollarsToCents(100_000)).multiple, 4);
  assert.equal(calcGrowthMultiple(start, dollarsToCents(109_000)).multiple, 4);

  // 10% to <25% -> 6x
  assert.equal(calcGrowthMultiple(start, dollarsToCents(110_000)).multiple, 6);
  assert.equal(calcGrowthMultiple(start, dollarsToCents(124_000)).multiple, 6);

  // 25% to <50% -> 10x
  assert.equal(calcGrowthMultiple(start, dollarsToCents(125_000)).multiple, 10);
  assert.equal(calcGrowthMultiple(start, dollarsToCents(149_000)).multiple, 10);

  // 50% to <75% -> 14x
  assert.equal(calcGrowthMultiple(start, dollarsToCents(150_000)).multiple, 14);

  // 75% to <100% -> 20x
  assert.equal(calcGrowthMultiple(start, dollarsToCents(175_000)).multiple, 20);

  // 100% to <150% -> 28x
  assert.equal(calcGrowthMultiple(start, dollarsToCents(200_000)).multiple, 28);

  // 150%+ -> 40x
  assert.equal(calcGrowthMultiple(start, dollarsToCents(250_000)).multiple, 40);
  assert.equal(calcGrowthMultiple(start, dollarsToCents(500_000)).multiple, 40);
});

test('3. Valuation & Founder Stake Invariants', () => {
  const arr = dollarsToCents(1_000_000);
  const multiple = 10;
  const valuation = calcValuation(arr, multiple);

  assert.equal(valuation, dollarsToCents(10_000_000)); // $10M

  // 100% ownership
  assert.equal(calcFounderStakeValue(valuation, 10_000), dollarsToCents(10_000_000));

  // 80% ownership
  assert.equal(calcFounderStakeValue(valuation, 8_000), dollarsToCents(8_000_000));
});

test('4. Line of Credit (LOC) Limit & APR', () => {
  // Below $500K ARR -> LOC is locked at $0
  assert.equal(calcLocLimit(dollarsToCents(400_000), dollarsToCents(4_000_000)), 0n);

  // At $1M ARR and 10x valuation ($10M):
  // 15% ARR = $150K, 1% valuation = $100K -> LOC = $100K
  const limit1 = calcLocLimit(dollarsToCents(1_000_000), dollarsToCents(10_000_000));
  assert.equal(limit1, dollarsToCents(100_000));

  // At $10M ARR and 20x valuation ($200M):
  // 15% ARR = $1.5M, 1% valuation = $2.0M -> LOC = $1.5M
  const limit2 = calcLocLimit(dollarsToCents(10_000_000), dollarsToCents(200_000_000));
  assert.equal(limit2, dollarsToCents(1_500_000));

  // APR at 10x multiple and 50% utilization:
  // 10% base + 5% util + 3% risk premium = 18% APR (1,800 bps)
  const debt = dollarsToCents(50_000);
  const aprInfo = calcLocAprBps(debt, limit1, 10);
  assert.equal(aprInfo.aprBps, 1_800);
  assert.equal(aprInfo.isOverLimit, false);

  // Monthly interest on $50K debt at 18% APR = $50,000 * 0.18 / 12 = $750
  const interest = calcMonthlyInterestCents(debt, aprInfo.aprBps);
  assert.equal(interest, dollarsToCents(750));

  // Over-limit surcharge (+600 bps)
  const overLimitDebt = dollarsToCents(120_000);
  const overApr = calcLocAprBps(overLimitDebt, limit1, 10);
  assert.equal(overApr.isOverLimit, true);
  assert.equal(overApr.aprBps, 1_000 + 1_000 + 300 + 600); // 29% APR
});

test('5. Multiplicative Equity Dilution Compounding', () => {
  const initialOwnershipBps = 10_000; // 100.00%
  const valCents = dollarsToCents(20_000_000);

  // Round 1: Pre-seed raise $1.5M at $15M cap -> 10% dilution (1,000 bps)
  const round1 = executeFinancingRound('preseed', 1, dollarsToCents(1_500_000), valCents, 'fresh', initialOwnershipBps);
  assert.equal(round1.dilutionBps, 1_000); // 10%
  assert.equal(round1.ownershipAfterBps, 9_000); // 90%

  // Round 2: Seed raise $4.1M on $20.2M pre-money ($24.3M post-money) -> ~16.87% dilution (1,687 bps)
  const round2 = executeFinancingRound('seed', 3, dollarsToCents(4_100_000), valCents, 'fresh', round1.ownershipAfterBps);
  // Ownership after = 9,000 * (10,000 - 1,687) / 10,000 = 7,481 bps (~74.81%)
  assert.ok(round2.ownershipAfterBps < round1.ownershipAfterBps);
  assert.equal(round2.ownershipAfterBps, Math.floor((9_000 * (10_000 - round2.dilutionBps)) / 10_000));
});

test('6. Complexity, Ops Capacity & Strain States', () => {
  const agents = {
    marketing: 1, // Worker: +1.0
    product: 2,   // Specialist: +1.5
    monetization: 0,
    retention: 0,
    expansion: 0,
    operations: 0,
  } as const;

  const comp = calcComplexity(agents);
  assert.equal(comp, 2.5);

  // Capacity = 4 -> Strain = 2.5 / 4 = 0.625 (Stable)
  const stable = calcStrainDetails(comp, 4);
  assert.equal(stable.state, 'stable');
  assert.equal(stable.agentReliabilityModifierBps, 10_000);

  // Strained: Strain 1.10 (comp = 4.4, cap = 4)
  const strained = calcStrainDetails(4.4, 4);
  assert.equal(strained.state, 'strained');
  assert.equal(strained.agentReliabilityModifierBps, 9_500);

  // Critical: Strain > 1.5 (comp = 7.0, cap = 4)
  const critical = calcStrainDetails(7.0, 4);
  assert.equal(critical.state, 'critical');
  assert.equal(critical.agentReliabilityModifierBps, 7_500);
});

test('7. PRNG Determinism & Stream Isolation', () => {
  const rng1 = new SeededRng(42);
  const rng2 = new SeededRng(42);

  for (let i = 0; i < 20; i++) {
    assert.equal(rng1.random(), rng2.random());
  }

  // Domain isolation produces deterministic sub-streams
  const mktRng1 = rng1.forDomain('marketing');
  const mktRng2 = rng2.forDomain('marketing');
  for (let i = 0; i < 10; i++) {
    assert.equal(mktRng1.random(), mktRng2.random());
  }
});

test('8. Quarter Lifecycle & Invariant State Transitions', () => {
  let state = createInitialCompanyState({ history: 'fresh' });
  assert.equal(state.arrCents, dollarsToCents(100_000));
  assert.equal(state.cashCents, dollarsToCents(25_000));
  assert.equal(state.valuationMultiple, 10);
  assert.equal(state.valuationCents, dollarsToCents(1_000_000));

  // Simulate monthly close 1
  state = executeMonthlyCashClose(state, 1);
  // Monthly cash added = 100K / 12 = 8,333.33, costs = 30% = 2,500.00
  assert.ok(state.cashCents > STARTING_CASH_CENTS);

  // Add quarterly ARR gains
  state.currentQuarterNewCustomerArrCents = dollarsToCents(50_000);
  state.currentQuarterExpansionArrCents = dollarsToCents(10_000);
  state.currentQuarterChurnedArrCents = dollarsToCents(5_000);

  // Close quarter
  state = executeQuarterClose(state);
  assert.equal(state.isIntermission, true);
  assert.equal(state.arrCents, dollarsToCents(155_000)); // 100K + 50K + 10K - 5K
  // Growth = (155K - 100K) / 100K = 55% -> 14x multiple
  assert.equal(state.valuationMultiple, 14);
  assert.equal(state.valuationCents, dollarsToCents(155_000 * 14));

  // Begin next quarter
  state = beginNextQuarter(state);
  assert.equal(state.quarter, 2);
  assert.equal(state.isIntermission, false);
  assert.equal(state.quarterStartArrCents, dollarsToCents(155_000));
  assert.equal(state.currentQuarterNewCustomerArrCents, 0n);
});

test('9. Growth Mandate Failure & Bankruptcy Guards', () => {
  let state = createInitialCompanyState({ history: 'fresh' });
  state.quarter = 6;
  state.growthCommitment = 0.50; // Committed to +50% growth
  state.quarterStartArrCents = dollarsToCents(1_000_000);
  // Achieved only +10% growth ($100K)
  state.currentQuarterNewCustomerArrCents = dollarsToCents(100_000);
  state.currentQuarterExpansionArrCents = 0n;
  state.currentQuarterChurnedArrCents = 0n;

  // Execute quarter close
  state = executeQuarterClose(state);
  assert.equal(state.isBankrupt, true);
  assert.equal(state.bankruptcyReason, 'growth_mandate_missed');
  assert.equal(state.isIntermission, true);

  // Attempting to begin next quarter while bankrupt should NOT advance to Q7
  const nextAttempt = beginNextQuarter(state);
  assert.equal(nextAttempt.quarter, 6);
  assert.equal(nextAttempt.isBankrupt, true);
});

test('10. Strain State Recalculation & Invariants', () => {
  // Base ops capacity = 4, complexity = 20 -> strain = 5.0 (critical)
  const strainInfo = calcStrainDetails(20, 4);
  assert.equal(strainInfo.state, 'critical');
  assert.ok(strainInfo.strain > 1.5);

  const stableInfo = calcStrainDetails(3, 4);
  assert.equal(stableInfo.state, 'stable');
});
