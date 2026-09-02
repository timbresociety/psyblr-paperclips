import { EVENTS_POOL, getRandomEvent, isEventEligible } from '../src/data/eventsPool.js';

console.log('🧪 Running unit tests on factual event conditions...');

// 1. Test Solo Founder (0 agents, low MRR)
const soloContext = {
  mrr: 200,
  customers: 3,
  techDebt: 5,
  agents: [],
  seenEventIds: new Set()
};

// Check that CFO/CTO event is NOT eligible
const cfoEvent = EVENTS_POOL.find(e => e.id === 'evt_cfo_terminates_cto');
const cfoEligible = isEventEligible(cfoEvent, soloContext);
console.log('CFO/CTO event eligible for solo founder:', cfoEligible);
if (cfoEligible) throw new Error('CFO/CTO event should NOT be eligible when 0 agents exist!');

// Check that Support Refund event is NOT eligible
const supportEvent = EVENTS_POOL.find(e => e.id === 'evt_support_refund_spree');
const supportEligible = isEventEligible(supportEvent, soloContext);
console.log('Support Refund event eligible for solo founder:', supportEligible);
if (supportEligible) throw new Error('Support event should NOT be eligible when 0 support agents exist!');

// Check that Sales SOC2 event is NOT eligible
const soc2Event = EVENTS_POOL.find(e => e.id === 'evt_soc2_hallucination');
const soc2Eligible = isEventEligible(soc2Event, soloContext);
console.log('SOC2 event eligible for solo founder:', soc2Eligible);
if (soc2Eligible) throw new Error('SOC2 event should NOT be eligible without Sales agent!');

// Check that early founder events ARE eligible
const promptInjEvent = EVENTS_POOL.find(e => e.id === 'evt_prompt_injection_username');
const promptEligible = isEventEligible(promptInjEvent, soloContext);
console.log('Prompt Injection event eligible for early founder:', promptEligible);
if (!promptEligible) throw new Error('Prompt injection event should be eligible for early founder!');

// 2. Test Non-Repetition (Deduplication)
const seenIds = new Set(['evt_prompt_injection_username', 'evt_dark_mode_inverted', 'evt_sentry_alert_tsunami', 'evt_spiritually_non_refundable', 'evt_too_fast_complaint', 'evt_tiktok_brainrot_surge']);
const nextEvt = getRandomEvent({
  ...soloContext,
  seenEventIds: seenIds
});
console.log('Next event after seeing all early events:', nextEvt);
if (nextEvt && seenIds.has(nextEvt.templateId)) {
  throw new Error('Deduplication failed: generated a seen event!');
}

console.log('✅ ALL FACTUAL EVENT VERIFICATION TESTS PASSED!');
