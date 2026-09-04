/**
 * Room Interaction & Consequence Resolution Tests
 * Product Truth: company_sim_v1/product_final.md Section 9
 */

import { test, expect } from 'vitest';
import assert from 'node:assert/strict';

import { SeededRng } from '../src/sim/rng.ts';
import { dollarsToCents } from '../src/sim/math.ts';
import { createMarketingCard, resolveMarketingSwipe } from '../src/sim/rooms/marketing.ts';
import { canMergePiece, mergePieceIntoSlot } from '../src/sim/rooms/product.ts';
import { createMonetizationOpportunity, resolvePricingTap } from '../src/sim/rooms/monetization.ts';
import {
  getNeedleSweepNormalized,
  getDynamicBarWidthNormalized,
  getDynamicBarCenterNormalized,
} from '../src/canvas/rooms/MonetizationRoomCanvas.tsx';
import { createRetentionThreat, updateRetentionBattlefield } from '../src/sim/rooms/retention.ts';
import {
  createExpansionAccount,
  calcExpansionFitScore,
  analyzeExpansionFit,
  resolveExpansionPack,
  SAMPLE_EXPANSION_MODULES,
} from '../src/sim/rooms/expansion.ts';
import {
  createOperationsIncident,
  scratchMaskCells,
  resolveIncidentDiagnosis,
} from '../src/sim/rooms/operations.ts';
import type { ProductSlot } from '../src/sim/types.ts';
import { useV1Store } from '../src/state/v1Store.ts';

const CU_CENTS = dollarsToCents(5_000);

test('1. Marketing Room: Score Q & Action Bands', () => {
  const badCard = {
    id: 'card_bad',
    relevance: 0,
    audienceFit: 0,
    trendVelocity: 0,
    saturation: 2,
    channelCost: 2,
    scoreQ: -4,
    expiresInSeconds: 14,
  };

  // Correct LEFT on Q <= 0
  const leftRes = resolveMarketingSwipe(badCard, 'LEFT', 0, CU_CENTS);
  assert.equal(leftRes.isCorrect, true);
  assert.equal(leftRes.demandDeltaMilliGu, 0);
  assert.equal(leftRes.comboCount, 1);

  // Wrong RIGHT on Q <= 0 -> Low quality demand
  const wrongRightRes = resolveMarketingSwipe(badCard, 'RIGHT', 2, CU_CENTS);
  assert.equal(wrongRightRes.isCorrect, false);
  assert.equal(wrongRightRes.isLowQuality, true);
  assert.equal(wrongRightRes.demandDeltaMilliGu, 1000);
  assert.equal(wrongRightRes.comboCount, 0); // resets combo

  // Optimal UP on Q >= 4
  const greatCard = {
    id: 'card_great',
    relevance: 2,
    audienceFit: 2,
    trendVelocity: 2,
    saturation: 0,
    channelCost: 0,
    scoreQ: 6,
    expiresInSeconds: 14,
  };
  const upRes = resolveMarketingSwipe(greatCard, 'UP', 0, CU_CENTS);
  assert.equal(upRes.isCorrect, true);
  assert.equal(upRes.demandDeltaMilliGu, 2000);
  assert.equal(upRes.cashDeltaCents, -dollarsToCents(500)); // -0.10 CU

  // 5-streak combo gives +0.5 Demand GU (+500 milli-GU)
  const comboRes = resolveMarketingSwipe(greatCard, 'UP', 5, CU_CENTS);
  assert.equal(comboRes.demandDeltaMilliGu, 2500);
});

test('2. Product Room: Merge Recipes, Verified vs Early Deploy', () => {
  let slot: ProductSlot = {
    id: 'slot_0',
    state: 'REQUEST',
    hasPrompt: false,
    hasDiff: false,
    hasTest: false,
    lockedUntilMs: 0,
  };

  // PROMPT + DIFF -> IMPLEMENTATION
  let step1 = mergePieceIntoSlot(slot, 'PROMPT', CU_CENTS);
  assert.equal(step1.resolution.success, true);
  assert.equal(step1.nextSlot.state, 'REQUEST');

  let step2 = mergePieceIntoSlot(step1.nextSlot, 'DIFF', CU_CENTS);
  assert.equal(step2.nextSlot.state, 'IMPLEMENTATION');

  // TEST -> VERIFIED
  let step3 = mergePieceIntoSlot(step2.nextSlot, 'TEST', CU_CENTS);
  assert.equal(step3.nextSlot.state, 'VERIFIED');

  // DEPLOY -> SHIPPED (+1 Activation GU, 0 Churn Threat)
  let step4 = mergePieceIntoSlot(step3.nextSlot, 'DEPLOY', CU_CENTS);
  assert.equal(step4.resolution.isShipped, true);
  assert.equal(step4.resolution.isEarlyDeploy, false);
  assert.equal(step4.resolution.activationDeltaMilliGu, 1000);
  assert.equal(step4.resolution.churnThreatDeltaMilliGu, 0);

  // Early Deploy from IMPLEMENTATION state:
  const implSlot: ProductSlot = {
    id: 'slot_1',
    state: 'IMPLEMENTATION',
    hasPrompt: true,
    hasDiff: true,
    hasTest: false,
    lockedUntilMs: 0,
  };
  const earlyDeploy = mergePieceIntoSlot(implSlot, 'DEPLOY', CU_CENTS);
  assert.equal(earlyDeploy.resolution.isShipped, true);
  assert.equal(earlyDeploy.resolution.isEarlyDeploy, true);
  assert.equal(earlyDeploy.resolution.activationDeltaMilliGu, 1000);
  assert.equal(earlyDeploy.resolution.churnThreatDeltaMilliGu, 250); // +0.25 Churn Threat GU
  assert.equal(earlyDeploy.resolution.opsLeakDeltaCents, dollarsToCents(500)); // +0.10 CU
});

test('2b. Product Room: Dynamic Shape Requirements & Feature Shuffling', () => {
  // Slot with custom 3-shape recipe: DIFF, TEST, DIFF
  const customSlot: ProductSlot = {
    id: 'slot_custom',
    state: 'REQUEST',
    hasPrompt: false,
    hasDiff: false,
    hasTest: false,
    lockedUntilMs: 0,
    name: 'GPU INFERENCE CACHE',
    tag: 'PERFORMANCE',
    desc: 'KV cache pagination for LLMs',
    requirements: ['DIFF', 'TEST', 'DIFF'],
    filledIndices: [],
  };

  // 1. PROMPT should be rejected (not in requirements)
  assert.equal(canMergePiece(customSlot, 'PROMPT'), false);
  const promptAttempt = mergePieceIntoSlot(customSlot, 'PROMPT', CU_CENTS);
  assert.equal(promptAttempt.resolution.success, false);
  assert.equal(promptAttempt.nextSlot.lockedUntilMs, 1000);

  // 2. First DIFF should match into socket 0
  assert.equal(canMergePiece(customSlot, 'DIFF'), true);
  const step1 = mergePieceIntoSlot(customSlot, 'DIFF', CU_CENTS);
  assert.equal(step1.resolution.success, true);
  assert.deepEqual(step1.nextSlot.filledIndices, [0]);
  assert.equal(step1.nextSlot.state, 'IMPLEMENTATION');

  // 3. Second piece: TEST should match into socket 1
  assert.equal(canMergePiece(step1.nextSlot, 'TEST'), true);
  const step2 = mergePieceIntoSlot(step1.nextSlot, 'TEST', CU_CENTS);
  assert.equal(step2.resolution.success, true);
  assert.deepEqual(step2.nextSlot.filledIndices, [0, 1]);

  // 4. Third piece: Second DIFF should match into socket 2 -> state becomes VERIFIED
  assert.equal(canMergePiece(step2.nextSlot, 'DIFF'), true);
  const step3 = mergePieceIntoSlot(step2.nextSlot, 'DIFF', CU_CENTS);
  assert.equal(step3.resolution.success, true);
  assert.deepEqual(step3.nextSlot.filledIndices, [0, 1, 2]);
  assert.equal(step3.nextSlot.state, 'VERIFIED');

  // 5. DEPLOY ships to production and shuffles to a fresh new feature request!
  assert.equal(canMergePiece(step3.nextSlot, 'DEPLOY'), true);
  const shipStep = mergePieceIntoSlot(step3.nextSlot, 'DEPLOY', CU_CENTS);
  assert.equal(shipStep.resolution.success, true);
  assert.equal(shipStep.resolution.isShipped, true);
  assert.equal(shipStep.resolution.isEarlyDeploy, false);
  assert.equal(shipStep.resolution.activationDeltaMilliGu, 1000);

  // Verifies the slot shuffled to a new feature request with its own requirements and reset filled indices!
  assert.ok(shipStep.nextSlot.name);
  assert.ok(shipStep.nextSlot.tag);
  assert.ok(shipStep.nextSlot.requirements && shipStep.nextSlot.requirements.length >= 2);
  assert.deepEqual(shipStep.nextSlot.filledIndices, []);
});

test('3. Monetization Room: Cursor Zones & Taps', () => {
  const opp = {
    id: 'opp_1',
    cursorPositionBps: 5_000,
    cursorSpeedBpsPerSec: 3_333,
    cursorDirection: 1 as const,
    centerBps: 5_000,
    widthBps: 6_000,
    expiresInSeconds: 5,
  };

  // Center tap is PERFECT (+1.5 New Customer ARR GU)
  const perfectTap = resolvePricingTap(opp);
  assert.equal(perfectTap.zone, 'PERFECT');
  assert.equal(perfectTap.newCustomerArrMilliGu, 1500);

  // Too Cheap tap (far left)
  const cheapOpp = { ...opp, cursorPositionBps: 2_200 };
  const cheapTap = resolvePricingTap(cheapOpp);
  assert.equal(cheapTap.zone, 'TOO_CHEAP');
  assert.equal(cheapTap.newCustomerArrMilliGu, 500);

  // Too Expensive tap (far right)
  const expOpp = { ...opp, cursorPositionBps: 7_800 };
  const expTap = resolvePricingTap(expOpp);
  assert.equal(expTap.zone, 'TOO_EXPENSIVE');
  assert.equal(expTap.newCustomerArrMilliGu, 0);
});

test('3b. Monetization Room: Dynamic Width & Moving Placement Mechanics', () => {
  // 1. Dynamic Width Bounding: verifies breathing composure cycle bounds
  for (let t = 0; t <= 4000; t += 200) {
    const w = getDynamicBarWidthNormalized(t);
    // Base is 0.31 with +/- 16% breathing: range is ~0.26 to ~0.36
    assert.ok(w >= 0.25, `Width ${w} should be >= 0.25 at t=${t}`);
    assert.ok(w <= 0.38, `Width ${w} should be <= 0.38 at t=${t}`);
  }

  // 2. Moving Placement Bounding: verifies continuous movement stays safely on track
  const centers: number[] = [];
  for (let t = 0; t <= 4000; t += 200) {
    const w = getDynamicBarWidthNormalized(t);
    const c = getDynamicBarCenterNormalized(t, w, 0);
    centers.push(c);

    // Left and right edges of capsule
    const leftEdge = c - w / 2;
    const rightEdge = c + w / 2;

    assert.ok(leftEdge >= 0.05, `Left edge ${leftEdge} should be >= 0.05 track margin at t=${t}`);
    assert.ok(rightEdge <= 0.95, `Right edge ${rightEdge} should be <= 0.95 track margin at t=${t}`);
  }

  // Placement must actually move (not be static)
  const minCenter = Math.min(...centers);
  const maxCenter = Math.max(...centers);
  assert.ok(maxCenter - minCenter >= 0.30, `Center placement should traverse at least 30% of track (traversed ${maxCenter - minCenter})`);

  // 3. Dynamic Resolution with shifted moving center:
  // Suppose dynamic bar is currently at center 3500 bps (0.35) with width 2800 bps (0.28)
  // Band is [3500 - 1400, 3500 + 1400] = [2100, 4900]
  const movingOpp = {
    id: 'opp_moving_1',
    cursorPositionBps: 3500, // dead center of shifted bar
    cursorSpeedBpsPerSec: 3333,
    cursorDirection: 1 as const,
    centerBps: 3500,
    widthBps: 2800,
    expiresInSeconds: 5,
  };

  // Center tap inside the moving bar is PERFECT
  const resPerfect = resolvePricingTap(movingOpp);
  assert.equal(resPerfect.zone, 'PERFECT');
  assert.equal(resPerfect.newCustomerArrMilliGu, 1500);

  // Tap in the left target wing of the moving bar
  // Band [2100, 4900]: relPos = 0.35 -> pos = 2100 + 0.35 * 2800 = 3080
  const resTarget = resolvePricingTap({ ...movingOpp, cursorPositionBps: 3080 });
  assert.equal(resTarget.zone, 'GOOD');
  assert.equal(resTarget.newCustomerArrMilliGu, 1000);

  // Tap to the right of the moving bar (outside) -> TOO_EXPENSIVE
  const resOverpriced = resolvePricingTap({ ...movingOpp, cursorPositionBps: 5200 });
  assert.equal(resOverpriced.zone, 'TOO_EXPENSIVE');
  assert.equal(resOverpriced.newCustomerArrMilliGu, 0);

  // Tap to the left of the moving bar (outside) -> TOO_CHEAP
  const resTooCheap = resolvePricingTap({ ...movingOpp, cursorPositionBps: 1800 });
  assert.equal(resTooCheap.zone, 'TOO_CHEAP');
  assert.equal(resTooCheap.newCustomerArrMilliGu, 500);
});

test('4. Retention Room: Battlefield & Churn Line Crossing', () => {
  const t1 = createRetentionThreat(new SeededRng(1), 't1', 'S1'); // travel 8s
  const t2 = createRetentionThreat(new SeededRng(2), 't2', 'S2'); // travel 7s

  // Step 2 seconds with turret firing at prioritized t1
  const update = updateRetentionBattlefield([t1, t2], 2.0, 't1', 0, true);
  assert.equal(update.destroyedThreats.length, 1); // t1 had 1 HP, destroyed
  assert.equal(update.remainingThreats.length, 1);

  // Step 10 seconds: t2 crosses churn line
  const churnUpdate = updateRetentionBattlefield(update.remainingThreats, 10.0, null, 0, true);
  assert.equal(churnUpdate.churnedThreats.length, 1);
  assert.equal(churnUpdate.churnedMilliGu, 500); // S2 = 0.50 GU
});

test('5. Expansion Room: Account Needs & Fit Scoring', () => {
  const account = {
    id: 'acc_1',
    name: 'Test Corp',
    archetype: 'Mid-Market',
    requiredTags: ['security', 'compliance'],
    compatibleTags: ['analytics'],
    conflictingTags: ['consumer_lite'],
    revealedNeedsCount: 2,
    grid: Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => null)),
    expiresInSeconds: 30,
    packWindowSeconds: 15,
    isOpen: true,
  };

  // Pack SSO module (has security, compliance) + Audit logging (compliance)
  const sso = SAMPLE_EXPANSION_MODULES.find((m) => m.id === 'sso_auth')!;
  const audit = SAMPLE_EXPANSION_MODULES.find((m) => m.id === 'audit_logs')!;

  const res = resolveExpansionPack(account, [sso, audit]);
  assert.ok(res.fitScore >= 3);
  assert.ok(res.expansionArrMilliGu >= 1000);
});

test('5b. Expansion Room: Combination Synergies vs Duplicate Spamming', () => {
  const account = {
    id: 'acc_combo_test',
    name: 'OmniCorp Global #42',
    archetype: 'Global Fortune 500',
    archetypeMultiplier: 4.2,
    tierBadge: 'FORTUNE 500',
    tierColor: '#ffd60a',
    requiredTags: ['security'],
    compatibleTags: ['compliance', 'analytics'],
    conflictingTags: ['consumer_lite'],
    revealedNeedsCount: 2,
    grid: Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => null)),
    expiresInSeconds: 30,
    packWindowSeconds: 15,
    isOpen: true,
  };

  const seats = SAMPLE_EXPANSION_MODULES.find((m) => m.id === 'seats_pack')!;
  const sso = SAMPLE_EXPANSION_MODULES.find((m) => m.id === 'sso_auth')!;
  const audit = SAMPLE_EXPANSION_MODULES.find((m) => m.id === 'audit_logs')!;
  const analytics = SAMPLE_EXPANSION_MODULES.find((m) => m.id === 'analytics_hub')!;
  const webhooks = SAMPLE_EXPANSION_MODULES.find((m) => m.id === 'custom_webhooks')!;

  // 1. Spamming 4x Seats (duplicate spamming)
  const spamAnalysis = analyzeExpansionFit(account, [seats, seats, seats, seats]);
  expect(spamAnalysis.hasDiminishingReturns).toBe(true);
  expect(spamAnalysis.duplicatePenalty).toBeGreaterThanOrEqual(1);

  const spamRes = resolveExpansionPack(account, [seats, seats, seats, seats]);

  // 2. Thoughtful combination: SSO + Audit (Compliance Fortress) + Analytics + Webhooks (Data Pipeline)
  const comboAnalysis = analyzeExpansionFit(account, [sso, audit, analytics, webhooks]);
  expect(comboAnalysis.activeSynergies.length).toBeGreaterThanOrEqual(2);
  expect(comboAnalysis.activeSynergies.some((s) => s.id === 'compliance_fortress')).toBe(true);
  expect(comboAnalysis.activeSynergies.some((s) => s.id === 'data_pipeline')).toBe(true);
  expect(comboAnalysis.hasDiminishingReturns).toBe(false);

  const comboRes = resolveExpansionPack(account, [sso, audit, analytics, webhooks]);

  // Synergistic combination MUST yield significantly higher ARR than naive duplicate spam
  expect(comboRes.fitScore).toBeGreaterThan(spamRes.fitScore);
  expect(comboRes.expansionArrMilliGu).toBeGreaterThan(spamRes.expansionArrMilliGu * 2);
  expect(comboRes.isExceptional).toBe(true);
  expect(comboRes.synergies).toContain('Compliance Fortress');
});

test('5c. Expansion Room: Pipeline Progression & Account Consumption (No Constant Requests)', () => {
  const store = useV1Store.getState();

  // Seed two distinct accounts into expansion queue
  const acc1 = createExpansionAccount(store.rng, 'acc_alpha');
  const acc2 = createExpansionAccount(store.rng, 'acc_beta');

  useV1Store.setState({
    company: {
      ...useV1Store.getState().company,
      expansion: {
        accounts: [acc1, acc2],
        activeAccountIndex: null,
        quarterlyExpansionArrCents: 0n,
        nextAccountTimerSec: 16,
      },
    },
  });

  const initialArr = useV1Store.getState().company.arrCents;
  const accountsBefore = useV1Store.getState().company.expansion.accounts;
  expect(accountsBefore.length).toBe(2);
  expect(accountsBefore[0].id).toBe('acc_alpha');

  // Submit expansion pack for acc_alpha
  useV1Store.getState().executePackExpansion(7, 2800, 0);

  const accountsAfter = useV1Store.getState().company.expansion.accounts;
  // acc_alpha must have been consumed/removed from head of queue!
  expect(accountsAfter[0].id).toBe('acc_beta');
  expect(useV1Store.getState().company.arrCents).toBeGreaterThan(initialArr);

  // Submit second pack for acc_beta -> queue becomes empty -> fresh account spawned
  useV1Store.getState().executePackExpansion(5, 1800, 0);
  const accountsAfterSecond = useV1Store.getState().company.expansion.accounts;
  expect(accountsAfterSecond.length).toBeGreaterThan(0);
  expect(accountsAfterSecond[0].id).not.toBe('acc_beta');
  expect(accountsAfterSecond[0].id).not.toBe('acc_alpha');
});

test('5d. Expansion Room: Archetype Scaling & Contract Size Multipliers', () => {
  const sso = SAMPLE_EXPANSION_MODULES.find((m) => m.id === 'sso_auth')!;
  const audit = SAMPLE_EXPANSION_MODULES.find((m) => m.id === 'audit_logs')!;

  const smbAccount = {
    id: 'smb_1',
    name: 'Acme Early Startup',
    archetype: 'Early-Stage Startup',
    archetypeMultiplier: 1.0,
    requiredTags: ['security'],
    compatibleTags: ['compliance'],
    conflictingTags: [],
    revealedNeedsCount: 2,
    grid: Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => null)),
    expiresInSeconds: 30,
    packWindowSeconds: 15,
    isOpen: true,
  };

  const enterpriseAccount = {
    id: 'ent_1',
    name: 'OmniCorp Global Whale',
    archetype: 'Global Fortune 500',
    archetypeMultiplier: 4.2,
    requiredTags: ['security'],
    compatibleTags: ['compliance'],
    conflictingTags: [],
    revealedNeedsCount: 2,
    grid: Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => null)),
    expiresInSeconds: 30,
    packWindowSeconds: 15,
    isOpen: true,
  };

  const smbRes = resolveExpansionPack(smbAccount, [sso, audit]);
  const entRes = resolveExpansionPack(enterpriseAccount, [sso, audit]);

  // Enterprise account with 4.2x multiplier must yield roughly 4.2x more ARR than SMB
  expect(entRes.expansionArrMilliGu).toBeGreaterThanOrEqual(smbRes.expansionArrMilliGu * 3);
});

test('6. Operations Room: Reveal Percentage & Diagnosis', () => {
  const incident = createOperationsIncident(new SeededRng(1), 'inc_1', 'S1', 'Inference Cost Leak', 0);
  assert.equal(incident.revealedPercentage, 0);

  // Scratch 100 cells
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      cells.push([r, c]);
    }
  }
  const scratched = scratchMaskCells(incident, cells);
  assert.ok(scratched.revealedPercentage >= 35); // Unlocks diagnosis!

  // Correct diagnosis
  const correctRes = resolveIncidentDiagnosis(scratched, scratched.correctDiagnosisIndex, CU_CENTS);
  assert.equal(correctRes.resolution.isCorrect, true);
  assert.equal(correctRes.nextIncident.isResolved, true);

  // Wrong diagnosis locks for 6s and penalizes
  const wrongRes = resolveIncidentDiagnosis(scratched, (scratched.correctDiagnosisIndex + 1) % 3, CU_CENTS);
  assert.equal(wrongRes.resolution.isCorrect, false);
  assert.equal(wrongRes.nextIncident.lockedUntilMs, 6000);
  assert.equal(wrongRes.resolution.costPenaltyCents, dollarsToCents(250)); // 0.05 CU
});

test('7. Autonomous Simulation Tick & Economy Invariants', async () => {
  const { useV1Store } = await import('../src/state/v1Store.ts');
  const store = useV1Store.getState();
  await store.resetGame();

  const state = useV1Store.getState();
  assert.equal(state.company.quarter, 1);
  assert.equal(state.onboardingStep, 'q1_marketing');

  // Verify fractional CU buy works and charges correctly
  useV1Store.setState((s) => ({
    company: {
      ...s.company,
      cashCents: dollarsToCents(100_000),
      capitalUnitCents: dollarsToCents(5_000),
      agents: {
        ...s.company.agents,
        marketing: 2,
        product: 2,
        monetization: 2,
      },
    },
    shopOfferedUpgrades: [
      {
        id: 'upgrade_fractional_1',
        name: 'Test 2.5 CU',
        description: 'Testing fractional CU',
        rarity: 'rare',
        costCu: 2.5,
        complexity: 0.5,
        mechanicNote: 'Test',
      },
      {
        id: 'upgrade_fractional_2',
        name: 'Test 1.5 CU',
        description: 'Testing fractional CU with surge',
        rarity: 'uncommon',
        costCu: 1.5,
        complexity: 0.2,
        mechanicNote: 'Test',
      },
      {
        id: 'upgrade_excess_3',
        name: 'Test Excess',
        description: 'Should be rejected',
        rarity: 'common',
        costCu: 1.0,
        complexity: 0,
        mechanicNote: 'Test',
      },
    ],
    shopPurchasedCount: 0,
  }));

  // First purchase: 2.5 CU * $5,000 = $12,500
  const initialCash = useV1Store.getState().company.cashCents;
  const ok1 = useV1Store.getState().buyUpgrade('upgrade_fractional_1');
  assert.equal(ok1, true);
  assert.equal(useV1Store.getState().shopPurchasedCount, 1);
  assert.equal(useV1Store.getState().company.cashCents, initialCash - dollarsToCents(12_500));

  // Second purchase: 1.5 CU * 1.5 surge * $5,000 = $11,250
  const midCash = useV1Store.getState().company.cashCents;
  const ok2 = useV1Store.getState().buyUpgrade('upgrade_fractional_2');
  assert.equal(ok2, true);
  assert.equal(useV1Store.getState().shopPurchasedCount, 2);
  assert.equal(useV1Store.getState().company.cashCents, midCash - dollarsToCents(11_250));

  // Third purchase: rejected by max 2 purchases per quarter
  const ok3 = useV1Store.getState().buyUpgrade('upgrade_excess_3');
  assert.equal(ok3, false);
  assert.equal(useV1Store.getState().shopPurchasedCount, 2);

  // Simulation tick test: with tier 2 agents, tick should execute work without error
  for (let i = 0; i < 40; i++) {
    useV1Store.getState().tick(100);
  }

  // Reset run test
  await useV1Store.getState().resetGame();
  const resetState = useV1Store.getState();
  assert.equal(resetState.company.quarter, 1);
  assert.equal(resetState.shopPurchasedCount, 0);
  assert.equal(resetState.company.upgrades.length, 0);
});

test('7. Upgrade Shop Card Locking & Reroll/Quarter Persistence', () => {
  const store = useV1Store.getState();

  // Set up mock offered upgrades
  useV1Store.setState({
    shopOfferedUpgrades: [
      { id: 'card_a', name: 'Card A', description: 'Desc A', rarity: 'common', costCu: 1.0, complexity: 0, mechanicNote: '' },
      { id: 'card_b', name: 'Card B', description: 'Desc B', rarity: 'rare', costCu: 2.0, complexity: 1, mechanicNote: '' },
      { id: 'card_c', name: 'Card C', description: 'Desc C', rarity: 'legendary', costCu: 3.0, complexity: 2, mechanicNote: '' },
    ],
    shopLockedUpgradeIds: [],
    shopRerollCount: 0,
    company: {
      ...useV1Store.getState().company,
      cashCents: dollarsToCents(500_000),
      capitalUnitCents: dollarsToCents(25_000),
    },
  });

  // Lock card_b
  useV1Store.getState().toggleLockUpgrade('card_b');
  expect(useV1Store.getState().shopLockedUpgradeIds).toContain('card_b');

  // Reroll shop: card_b must remain in offered upgrades
  useV1Store.getState().rerollShop();
  const offeredAfterReroll = useV1Store.getState().shopOfferedUpgrades;
  const containsCardB = offeredAfterReroll.some((u) => u.id === 'card_b');
  expect(containsCardB).toBe(true);

  // Toggle lock off and on again
  useV1Store.getState().toggleLockUpgrade('card_b');
  expect(useV1Store.getState().shopLockedUpgradeIds).not.toContain('card_b');
  useV1Store.getState().toggleLockUpgrade('card_b');
  expect(useV1Store.getState().shopLockedUpgradeIds).toContain('card_b');

  // Quarter close: locked unpurchased card must persist to next quarter
  useV1Store.getState().tick(150_000);
  const offeredNextQuarter = useV1Store.getState().shopOfferedUpgrades;
  const containsCardBNextQuarter = offeredNextQuarter.some((u) => u.id === 'card_b');
  expect(containsCardBNextQuarter).toBe(true);
});

test('8. Autonomous Agent Licensing: 2 Per Quarter Limit & Throughput', () => {
  useV1Store.setState({
    company: {
      ...useV1Store.getState().company,
      quarter: 3, // Q3 unlocks automation
      isIntermission: false,
      cashCents: dollarsToCents(1_000_000),
      capitalUnitCents: dollarsToCents(25_000),
      agents: { marketing: 0, product: 0, monetization: 0, retention: 0, expansion: 0, operations: 0 },
    },
    shopAgentUpgradesPurchased: 0,
  });

  // Purchase 1: marketing agent tier 1
  const ok1 = useV1Store.getState().buyAgentTier('marketing');
  expect(ok1).toBe(true);
  expect(useV1Store.getState().company.agents.marketing).toBe(1);
  expect(useV1Store.getState().shopAgentUpgradesPurchased).toBe(1);

  // Purchase 2: product agent tier 1
  const ok2 = useV1Store.getState().buyAgentTier('product');
  expect(ok2).toBe(true);
  expect(useV1Store.getState().company.agents.product).toBe(1);
  expect(useV1Store.getState().shopAgentUpgradesPurchased).toBe(2);

  // Purchase 3 in same quarter: blocked by 2-per-quarter limit
  const ok3 = useV1Store.getState().buyAgentTier('monetization');
  expect(ok3).toBe(false);
  expect(useV1Store.getState().company.agents.monetization).toBe(0);
  expect(useV1Store.getState().shopAgentUpgradesPurchased).toBe(2);

  // Quarter close resets quarterly limit
  useV1Store.getState().tick(150_000);
  expect(useV1Store.getState().shopAgentUpgradesPurchased).toBe(0);

  // Re-enable run post-intermission
  useV1Store.setState({
    company: {
      ...useV1Store.getState().company,
      isIntermission: false,
    },
  });

  // Now can purchase again in new quarter
  const ok4 = useV1Store.getState().buyAgentTier('monetization');
  expect(ok4).toBe(true);
  expect(useV1Store.getState().company.agents.monetization).toBe(1);
  expect(useV1Store.getState().shopAgentUpgradesPurchased).toBe(1);
});

test('9. Marketing Paid Acquisition Campaigns & Product Cloud Sprints', () => {
  const capitalUnit = dollarsToCents(20_000); // 1 CU = $20,000

  useV1Store.setState({
    company: {
      ...useV1Store.getState().company,
      cashCents: dollarsToCents(200_000),
      capitalUnitCents: capitalUnit,
      demandBacklogMilliGu: 0,
      activationBacklogMilliGu: 0,
    },
  });

  // Blitz: -0.5 CU ($10,000), +5,000 mGU (+5 GU) demand
  const initialCash = useV1Store.getState().company.cashCents;
  const okBlitz = useV1Store.getState().buyDemandCampaign('blitz');
  expect(okBlitz).toBe(true);
  expect(useV1Store.getState().company.demandBacklogMilliGu).toBe(5000);
  expect(useV1Store.getState().company.cashCents).toBe(initialCash - dollarsToCents(10_000));

  // Surge: -2.0 CU ($40,000), +25,000 mGU (+25 GU) demand
  const postBlitzCash = useV1Store.getState().company.cashCents;
  const okSurge = useV1Store.getState().buyDemandCampaign('surge');
  expect(okSurge).toBe(true);
  expect(useV1Store.getState().company.demandBacklogMilliGu).toBe(30000);
  expect(useV1Store.getState().company.cashCents).toBe(postBlitzCash - dollarsToCents(40_000));

  // Product Sprint Boost: -0.5 CU ($10,000), advances active slot specs
  const preSprintCash = useV1Store.getState().company.cashCents;
  const okSprint = useV1Store.getState().buyProductSprint('boost');
  expect(okSprint).toBe(true);
  expect(useV1Store.getState().company.cashCents).toBe(preSprintCash - dollarsToCents(10_000));
});

test('10. Retention Threats & Expansion Accounts Active Spawning', () => {
  useV1Store.setState({
    company: {
      ...useV1Store.getState().company,
      quarter: 2,
      isIntermission: false,
      isBankrupt: false,
      arrCents: dollarsToCents(250_000),
      churnThreatMilliGu: 2500, // 2.5 GU accumulated churn threat
      retention: {
        threats: [],
        founderAimThreatId: null,
      },
      expansion: {
        accounts: [],
        activeAccountIndex: null,
      },
    },
  });

  // Run a series of ticks
  for (let i = 0; i < 30; i++) {
    useV1Store.getState().tick(100);
  }

  const postTickState = useV1Store.getState().company;
  // Threats must have spawned from churn threat backlog!
  expect(postTickState.retention.threats.length).toBeGreaterThan(0);
  // Expansion accounts must have spawned!
  expect(postTickState.expansion.accounts.length).toBeGreaterThan(0);
});


