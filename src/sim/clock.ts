/**
 * Simulation Quarter Clock & Monthly Boundary Tracking
 * Product Truth: company_sim_v1/product_final.md Section 5.1
 *
 * Quarter = 150 seconds of active simulation.
 * Monthly cash closes at:
 * 50s, 100s, 150s.
 */

export const QUARTER_DURATION_MS = 150_000; // 150 seconds
export const MONTH_1_CLOSE_MS = 50_000;     // 50 seconds
export const MONTH_2_CLOSE_MS = 100_000;    // 100 seconds
export const MONTH_3_CLOSE_MS = 150_000;    // 150 seconds

export interface ClockState {
  quarter: number;
  quarterElapsedMs: number;
  closedMonths: {
    month1: boolean;
    month2: boolean;
    month3: boolean;
  };
  isQuarterEnded: boolean;
}

export function createClock(quarter: number = 1): ClockState {
  return {
    quarter,
    quarterElapsedMs: 0,
    closedMonths: {
      month1: false,
      month2: false,
      month3: false,
    },
    isQuarterEnded: false,
  };
}

export function tickClock(
  clock: ClockState,
  deltaMs: number
): {
  clock: ClockState;
  monthsToClose: number[]; // e.g. [1], [2], [3]
  quarterJustEnded: boolean;
} {
  const newElapsed = clock.quarterElapsedMs + deltaMs;
  const monthsToClose: number[] = [];

  const closedMonths = { ...clock.closedMonths };

  if (newElapsed >= MONTH_1_CLOSE_MS && !closedMonths.month1) {
    closedMonths.month1 = true;
    monthsToClose.push(1);
  }

  if (newElapsed >= MONTH_2_CLOSE_MS && !closedMonths.month2) {
    closedMonths.month2 = true;
    monthsToClose.push(2);
  }

  if (newElapsed >= MONTH_3_CLOSE_MS && !closedMonths.month3) {
    closedMonths.month3 = true;
    monthsToClose.push(3);
  }

  const isQuarterEnded = newElapsed >= QUARTER_DURATION_MS;
  const quarterJustEnded = isQuarterEnded && !clock.isQuarterEnded;

  return {
    clock: {
      ...clock,
      quarterElapsedMs: newElapsed,
      closedMonths,
      isQuarterEnded,
    },
    monthsToClose,
    quarterJustEnded,
  };
}

export function resetClockForNextQuarter(clock: ClockState): ClockState {
  return {
    quarter: clock.quarter + 1,
    quarterElapsedMs: 0,
    closedMonths: {
      month1: false,
      month2: false,
      month3: false,
    },
    isQuarterEnded: false,
  };
}
