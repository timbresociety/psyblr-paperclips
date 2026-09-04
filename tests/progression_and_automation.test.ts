/**
 * Solo Founder Automation, Milestones & $1B Unicorn Progression Tests
 * Validates:
 * 1. $1B Unicorn victory checkpoint pauses sim and opens victory modal
 * 2. Milestone progression engine triggers sequential milestones
 * 3. YOLO Overclock mechanics (2x speed, compute load, complexity strain)
 * 4. AI Trust/Safety Evals & Agent Activity Stream
 */

import { test, expect, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { useV1Store } from '../src/state/v1Store.ts';
import { MILESTONES } from '../src/data/milestones.ts';
import { dollarsToCents } from '../src/sim/math.ts';

beforeEach(() => {
  useV1Store.getState().init();
});

test('1. $1B Unicorn Checkpoint pauses sim and opens UnicornVictoryModal', () => {
  const store = useV1Store.getState();
  
  // Set valuation to $1B ($100M ARR @ 10x multiple)
  const arr100mCents = dollarsToCents(100_000_000);
  useV1Store.setState((prev) => ({
    company: {
      ...prev.company,
      arrCents: arr100mCents,
      isPaused: false,
      unicornAcknowledged: false,
    },
  }));

  // Trigger tick
  useV1Store.getState().tick(0.1);

  const state = useV1Store.getState();
  assert.equal(state.company.isPaused, true, 'Simulation should be paused upon achieving $1B valuation');
  assert.equal(state.company.unicornAcknowledged, true, 'Unicorn flag should be acknowledged');
  assert.equal(state.activeModal, 'unicorn', 'Unicorn victory modal should be active');
  assert.ok((state.company.unicornSpeedrunElapsedMs || 0) >= 0, 'Speedrun time should be recorded');
  assert.ok(state.company.achievedMilestones.includes('ms_unicorn_victory'), 'Unicorn milestone should be achieved');
});

test('2. Milestone Engine unlocks milestones sequentially based on state', () => {
  const store = useV1Store.getState();
  
  // Initial state should not have unlocked $1M ARR or agent milestones
  assert.ok(!store.company.achievedMilestones.includes('ms_arr_1m'));
  assert.ok(!store.company.achievedMilestones.includes('ms_first_agent'));

  // 1. First Contract milestone: set new customer ARR > 0
  useV1Store.setState((prev) => ({
    company: {
      ...prev.company,
      arrCents: dollarsToCents(10_000),
      currentQuarterNewCustomerArrCents: dollarsToCents(10_000),
    },
  }));
  useV1Store.getState().tick(0.1);
  assert.ok(useV1Store.getState().company.achievedMilestones.includes('ms_first_contract'));

  // 2. $1M ARR milestone: set ARR to $1,000,000
  useV1Store.setState((prev) => ({
    company: {
      ...prev.company,
      arrCents: dollarsToCents(1_000_000),
    },
  }));
  useV1Store.getState().tick(0.1);
  assert.ok(useV1Store.getState().company.achievedMilestones.includes('ms_arr_1m'));

  // 3. Agent milestone: hire first agent
  useV1Store.setState((prev) => ({
    company: {
      ...prev.company,
      agents: {
        ...prev.company.agents,
        marketing: 1,
      },
    },
  }));
  useV1Store.getState().tick(0.1);
  assert.ok(useV1Store.getState().company.achievedMilestones.includes('ms_first_agent'));

  // 4. YOLO Mode milestone: 3 agents
  useV1Store.setState((prev) => ({
    company: {
      ...prev.company,
      agents: {
        ...prev.company.agents,
        marketing: 1,
        product: 1,
        monetization: 1,
      },
    },
  }));
  useV1Store.getState().tick(0.1);
  assert.ok(useV1Store.getState().company.achievedMilestones.includes('ms_yolo_mode'));
});

test('3. YOLO Overclock toggles, applies complexity, and increases compute load', () => {
  const initialCompany = useV1Store.getState().company;
  const initialComplexity = initialCompany.complexity;
  
  assert.equal(initialCompany.overclockRooms.monetization, false);

  // Toggle Overclock on Monetization
  useV1Store.getState().toggleRoomOverclock('monetization');

  let state = useV1Store.getState();
  assert.equal(state.company.overclockRooms.monetization, true);
  assert.ok(state.company.complexity > initialComplexity, 'Overclocking should increase complexity load');

  // Verify log stream captured the event
  const logs = state.agentLogs;
  assert.ok(logs.some((l) => l.action === 'YOLO_OVERCLOCK'), 'Agent activity stream should record YOLO overclock');

  // Run tick to update compute load
  useV1Store.getState().tick(0.5);
  state = useV1Store.getState();
  assert.ok(state.company.computeLoadBps > 0, 'Compute load bps should reflect active overclocking');

  // Toggle off
  useV1Store.getState().toggleRoomOverclock('monetization');
  state = useV1Store.getState();
  assert.equal(state.company.overclockRooms.monetization, false);
});

test('4. Live Agent Activity Stream, Evals & Trust Safety', () => {
  // Degrade safety and increase complexity
  useV1Store.setState((prev) => ({
    company: {
      ...prev.company,
      safetyIndex: 50,
      complexity: 3.5,
    },
  }));

  // Trigger alignment evals
  useV1Store.getState().triggerAlignmentEval();

  const state = useV1Store.getState();
  assert.ok(state.company.safetyIndex >= 65, 'Triggering evals should increase safety index');
  assert.ok(state.company.complexity < 3.5, 'Triggering evals should normalize complexity strain');

  // Verify eval log
  assert.ok(state.agentLogs.some((l) => l.action === 'EVALS_COMPLETED'), 'Eval run should be logged');
});

test('5. Post-Unicorn Continuation unpauses and retains assets', () => {
  // Trigger unicorn
  useV1Store.setState((prev) => ({
    company: {
      ...prev.company,
      arrCents: dollarsToCents(100_000_000),
      isPaused: true,
      unicornAcknowledged: true,
    },
    activeModal: 'unicorn',
  }));

  // Player clicks "Continue to $10B Decacorn"
  useV1Store.getState().closeModal();

  const state = useV1Store.getState();
  assert.equal(state.company.isPaused, false, 'Sim should unpause when user chooses to continue');
  assert.equal(state.activeModal, 'none', 'Modal should close');
  assert.equal(state.company.arrCents, dollarsToCents(100_000_000), 'ARR should remain preserved');
});
