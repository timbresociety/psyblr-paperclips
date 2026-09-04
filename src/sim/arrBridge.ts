/**
 * Canonical ARR Bridge & Invariant Verification
 * Product Truth: company_sim_v1/product_final.md Section 2.1, 2.2
 *
 * Invariant:
 * ARR_END = ARR_START + NEW_CUSTOMER_ARR + EXPANSION_ARR - CHURNED_ARR
 *
 * Subtotal:
 * NEW_ARR = NEW_CUSTOMER_ARR + EXPANSION_ARR
 *
 * Expansion must never be added twice. ARR must never drop below zero.
 */

import type { ArrBridge, MoneyCents } from './types';

export function createArrBridge(
  startingArrCents: MoneyCents,
  newCustomerArrCents: MoneyCents,
  expansionArrCents: MoneyCents,
  churnedArrCents: MoneyCents
): ArrBridge {
  if (startingArrCents < 0n) throw new Error('startingArrCents cannot be negative');
  if (newCustomerArrCents < 0n) throw new Error('newCustomerArrCents cannot be negative');
  if (expansionArrCents < 0n) throw new Error('expansionArrCents cannot be negative');
  if (churnedArrCents < 0n) throw new Error('churnedArrCents cannot be negative');

  const grossAddition = newCustomerArrCents + expansionArrCents;
  const netEnding = startingArrCents + grossAddition - churnedArrCents;
  const endingArrCents = netEnding < 0n ? 0n : netEnding;

  const bridge: ArrBridge = {
    startingArrCents,
    newCustomerArrCents,
    expansionArrCents,
    churnedArrCents,
    endingArrCents,
  };

  assertArrBridge(bridge);
  return bridge;
}

export function assertArrBridge(bridge: ArrBridge): void {
  const {
    startingArrCents,
    newCustomerArrCents,
    expansionArrCents,
    churnedArrCents,
    endingArrCents,
  } = bridge;

  if (startingArrCents < 0n) {
    throw new Error(`ARR Invariant Violation: starting ARR cannot be negative: ${startingArrCents}`);
  }
  if (newCustomerArrCents < 0n) {
    throw new Error(`ARR Invariant Violation: newCustomerArr cannot be negative: ${newCustomerArrCents}`);
  }
  if (expansionArrCents < 0n) {
    throw new Error(`ARR Invariant Violation: expansionArr cannot be negative: ${expansionArrCents}`);
  }
  if (churnedArrCents < 0n) {
    throw new Error(`ARR Invariant Violation: churnedArr cannot be negative: ${churnedArrCents}`);
  }
  if (endingArrCents < 0n) {
    throw new Error(`ARR Invariant Violation: endingArr cannot be negative: ${endingArrCents}`);
  }

  const expectedEnding = startingArrCents + newCustomerArrCents + expansionArrCents - churnedArrCents;
  const clampedExpected = expectedEnding < 0n ? 0n : expectedEnding;

  if (endingArrCents !== clampedExpected) {
    throw new Error(
      `ARR Invariant Violation: endingArr ${endingArrCents} does not match starting (${startingArrCents}) + newCustomer (${newCustomerArrCents}) + expansion (${expansionArrCents}) - churned (${churnedArrCents}) = ${clampedExpected}`
    );
  }
}
