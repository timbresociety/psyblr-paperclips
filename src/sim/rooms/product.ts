/**
 * Product Room Logic: MERGE
 * Product Truth: company_sim_v1/product_final.md Section 9.2
 *
 * Canonical Chain:
 * PROMPT + DIFF -> IMPLEMENTATION
 * IMPLEMENTATION + TEST -> VERIFIED
 * VERIFIED + DEPLOY -> SHIPPED (+1 Activation GU)
 *
 * Early Deploy: DEPLOY on unverified IMPLEMENTATION:
 * +1 Activation GU, +0.25 Churn Threat GU, +0.10 CU Ops leak
 */

import type { ProductSlot, ProductPieceType, ProductPieceShape, MoneyCents } from '../types';

export interface ProductResolution {
  slotId: string;
  success: boolean;
  isShipped: boolean;
  isEarlyDeploy: boolean;
  activationDeltaMilliGu: number;
  churnThreatDeltaMilliGu: number;
  opsLeakDeltaCents: MoneyCents;
  lockDurationMs: number;
}

export interface FeatureArchetype {
  name: string;
  tag: string;
  desc: string;
}

export const FEATURE_CATALOG: FeatureArchetype[] = [
  { name: 'API GATEWAY', tag: 'CORE INFRA', desc: 'Reverse proxy & auth token filter' },
  { name: 'VECTOR SEARCH', tag: 'AI ENGINE', desc: 'HNSW index & similarity embeddings' },
  { name: 'AUTH & RBAC', tag: 'SECURITY', desc: 'OAuth2 session & role tokens' },
  { name: 'BILLING ENGINE', tag: 'FINTECH', desc: 'Stripe idempotency ledger' },
  { name: 'REALTIME SOCKETS', tag: 'STREAMING', desc: 'Bidirectional SSE state broadcast' },
  { name: 'WORKFLOW GRAPH', tag: 'UI / AGENT', desc: 'Autonomous DAG pipeline' },
  { name: 'GPU INFERENCE CACHE', tag: 'PERFORMANCE', desc: 'KV cache pagination for LLMs' },
  { name: 'SQL MIGRATION RUNNER', tag: 'DATABASE', desc: 'Zero-downtime schema migrations' },
  { name: 'RATE LIMITER', tag: 'TRAFFIC', desc: 'Sliding window Redis token bucket' },
  { name: 'AUDIT LOG STREAM', tag: 'COMPLIANCE', desc: 'Tamper-evident hash ledger' },
  { name: 'SEMANTIC CACHE', tag: 'AI INFRA', desc: 'Vector cosine similarity cache' },
  { name: 'MULTI-TENANT ISOLATION', tag: 'SECURITY', desc: 'RLS database tenant sandbox' },
  { name: 'WEBHOOK WORKER', tag: 'INTEGRATIONS', desc: 'Exponential backoff event delivery' },
  { name: 'K8S AUTOSCALER', tag: 'DEVOPS', desc: 'Pod horizontal auto-scale metrics' },
  { name: 'GRAPHQL FEDERATION', tag: 'API MESH', desc: 'Sub-graph schema stitching' },
  { name: 'ZERO-KNOWLEDGE PROOF', tag: 'CRYPTO', desc: 'zk-SNARK identity verification' },
  { name: 'DARK MODE CANVAS', tag: 'DESIGN SYSTEM', desc: 'OLED contrast token theme engine' },
  { name: 'TELEMETRY PIPELINE', tag: 'OBSERVABILITY', desc: 'OpenTelemetry span aggregation' },
  { name: 'EDGE CDN WORKER', tag: 'NETWORKING', desc: 'V8 isolate latency optimization' },
  { name: 'AI COPILOT AGENT', tag: 'AGENTIC', desc: 'Context-aware code autocomplete' },
];

const POSSIBLE_RECIPES: ProductPieceType[][] = [
  ['PROMPT', 'DIFF'],
  ['DIFF', 'TEST'],
  ['PROMPT', 'TEST'],
  ['PROMPT', 'DIFF', 'TEST'],
  ['DIFF', 'PROMPT', 'DIFF'],
  ['PROMPT', 'PROMPT', 'DIFF'],
  ['DIFF', 'TEST', 'TEST'],
  ['TEST', 'DIFF', 'PROMPT'],
  ['PROMPT', 'TEST', 'DIFF'],
  ['DIFF', 'DIFF', 'TEST'],
  ['PROMPT', 'TEST', 'TEST'],
  ['TEST', 'PROMPT', 'DIFF'],
];

export const SHAPE_POOL: ProductPieceShape[] = [
  'DIAMOND',
  'HEXAGON',
  'TRIANGLE',
  'ORB',
  'SQUARE',
  'STAR',
  'PENTAGON',
  'PLUS',
];

export function generateRandomFeatureRequest(id: string): ProductSlot {
  const randIdx = Math.floor(Math.random() * FEATURE_CATALOG.length);
  const arch = FEATURE_CATALOG[randIdx];
  const recipe = POSSIBLE_RECIPES[Math.floor(Math.random() * POSSIBLE_RECIPES.length)];

  // Stroop Test dynamics: Assign randomized shapes to requirements
  const requirementShapes: ProductPieceShape[] = recipe.map(() => {
    return SHAPE_POOL[Math.floor(Math.random() * SHAPE_POOL.length)];
  });

  return {
    id,
    state: 'REQUEST',
    hasPrompt: false,
    hasDiff: false,
    hasTest: false,
    lockedUntilMs: 0,
    name: arch.name,
    tag: arch.tag,
    desc: arch.desc,
    requirements: [...recipe],
    requirementShapes,
    filledIndices: [],
  };
}

export function canMergePiece(slot: ProductSlot, piece: ProductPieceType): boolean {
  // 1. Dynamic shape-matching requirements (when defined on slot)
  if (slot.requirements && slot.requirements.length > 0) {
    const filled = slot.filledIndices || [];
    const isAllFilled = filled.length >= slot.requirements.length;

    if (piece === 'DEPLOY') {
      // Clean ship if all filled; early deploy if at least 1 filled
      return isAllFilled || filled.length > 0;
    }

    // For non-deploy pieces: can place if piece matches at least one unfilled requirement
    return slot.requirements.some((req, idx) => req === piece && !filled.includes(idx));
  }

  // 2. Canonical fallback for legacy slots / unit tests
  if (slot.state === 'REQUEST') {
    if (piece === 'PROMPT') return !slot.hasPrompt;
    if (piece === 'DIFF') return !slot.hasDiff;
    return false;
  }
  if (slot.state === 'IMPLEMENTATION') {
    return piece === 'TEST' || piece === 'DEPLOY';
  }
  if (slot.state === 'VERIFIED') {
    return piece === 'DEPLOY';
  }
  return false;
}

export function mergePieceIntoSlot(
  slot: ProductSlot,
  piece: ProductPieceType,
  capitalUnitCents: MoneyCents
): { nextSlot: ProductSlot; resolution: ProductResolution } {
  const opsLeakCents = capitalUnitCents / 10n; // 0.10 CU

  // Invalid piece for state: bounce and lock for 1 second
  if (!canMergePiece(slot, piece)) {
    return {
      nextSlot: {
        ...slot,
        lockedUntilMs: 1000,
      },
      resolution: {
        slotId: slot.id,
        success: false,
        isShipped: false,
        isEarlyDeploy: false,
        activationDeltaMilliGu: 0,
        churnThreatDeltaMilliGu: 0,
        opsLeakDeltaCents: 0n,
        lockDurationMs: 1000,
      },
    };
  }

  // =========================================================================
  // DYNAMIC SHAPE-MATCHING FLOW
  // =========================================================================
  if (slot.requirements && slot.requirements.length > 0) {
    const currentFilled = slot.filledIndices || [];

    if (piece === 'DEPLOY') {
      const isCleanShip = currentFilled.length >= slot.requirements.length;

      // When deployed, SHUFFLE TO A BRAND NEW FEATURE REQUEST!
      const nextFreshSlot = generateRandomFeatureRequest(slot.id);

      return {
        nextSlot: nextFreshSlot,
        resolution: {
          slotId: slot.id,
          success: true,
          isShipped: true,
          isEarlyDeploy: !isCleanShip,
          activationDeltaMilliGu: 1000, // +1 Activation GU
          churnThreatDeltaMilliGu: isCleanShip ? 0 : 250, // +0.25 Churn if early
          opsLeakDeltaCents: isCleanShip ? 0n : opsLeakCents, // +0.10 CU leak if early
          lockDurationMs: 0,
        },
      };
    }

    // Find the first unfilled index matching this piece
    const matchIdx = slot.requirements.findIndex(
      (req, idx) => req === piece && !currentFilled.includes(idx)
    );

    if (matchIdx !== -1) {
      const nextFilled = [...currentFilled, matchIdx];
      const isAllFilled = nextFilled.length >= slot.requirements.length;

      const nextSlot: ProductSlot = {
        ...slot,
        filledIndices: nextFilled,
        state: isAllFilled ? 'VERIFIED' : 'IMPLEMENTATION',
        hasPrompt: slot.requirements.some((r, i) => r === 'PROMPT' && nextFilled.includes(i)),
        hasDiff: slot.requirements.some((r, i) => r === 'DIFF' && nextFilled.includes(i)),
        hasTest: slot.requirements.some((r, i) => r === 'TEST' && nextFilled.includes(i)),
        lockedUntilMs: 0,
      };

      return {
        nextSlot,
        resolution: {
          slotId: slot.id,
          success: true,
          isShipped: false,
          isEarlyDeploy: false,
          activationDeltaMilliGu: 0,
          churnThreatDeltaMilliGu: 0,
          opsLeakDeltaCents: 0n,
          lockDurationMs: 0,
        },
      };
    }
  }

  // =========================================================================
  // CANONICAL FALLBACK FLOW (For backward compatibility / unit tests)
  // =========================================================================
  if (slot.state === 'REQUEST') {
    const hasPrompt = slot.hasPrompt || piece === 'PROMPT';
    const hasDiff = slot.hasDiff || piece === 'DIFF';
    const isNowImpl = hasPrompt && hasDiff;

    const nextSlot: ProductSlot = {
      ...slot,
      hasPrompt,
      hasDiff,
      state: isNowImpl ? 'IMPLEMENTATION' : 'REQUEST',
      lockedUntilMs: 0,
    };

    return {
      nextSlot,
      resolution: {
        slotId: slot.id,
        success: true,
        isShipped: false,
        isEarlyDeploy: false,
        activationDeltaMilliGu: 0,
        churnThreatDeltaMilliGu: 0,
        opsLeakDeltaCents: 0n,
        lockDurationMs: 0,
      },
    };
  }

  if (slot.state === 'IMPLEMENTATION') {
    if (piece === 'TEST') {
      const nextSlot: ProductSlot = {
        ...slot,
        hasTest: true,
        state: 'VERIFIED',
        lockedUntilMs: 0,
      };
      return {
        nextSlot,
        resolution: {
          slotId: slot.id,
          success: true,
          isShipped: false,
          isEarlyDeploy: false,
          activationDeltaMilliGu: 0,
          churnThreatDeltaMilliGu: 0,
          opsLeakDeltaCents: 0n,
          lockDurationMs: 0,
        },
      };
    }

    if (piece === 'DEPLOY') {
      // Early deploy on unverified implementation!
      const nextSlot: ProductSlot = {
        ...slot,
        state: 'REQUEST',
        hasPrompt: false,
        hasDiff: false,
        hasTest: false,
        lockedUntilMs: 0,
      };

      return {
        nextSlot,
        resolution: {
          slotId: slot.id,
          success: true,
          isShipped: true,
          isEarlyDeploy: true,
          activationDeltaMilliGu: 1000,   // +1 Activation GU
          churnThreatDeltaMilliGu: 250,   // +0.25 Churn Threat GU
          opsLeakDeltaCents: opsLeakCents,// +0.10 CU leak token
          lockDurationMs: 0,
        },
      };
    }
  }

  if (slot.state === 'VERIFIED' && piece === 'DEPLOY') {
    // Verified deploy: clean ship!
    const nextSlot: ProductSlot = {
      ...slot,
      state: 'REQUEST',
      hasPrompt: false,
      hasDiff: false,
      hasTest: false,
      lockedUntilMs: 0,
    };

    return {
      nextSlot,
      resolution: {
        slotId: slot.id,
        success: true,
        isShipped: true,
        isEarlyDeploy: false,
        activationDeltaMilliGu: 1000, // +1 Activation GU
        churnThreatDeltaMilliGu: 0,
        opsLeakDeltaCents: 0n,
        lockDurationMs: 0,
      },
    };
  }

  return {
    nextSlot: slot,
    resolution: {
      slotId: slot.id,
      success: false,
      isShipped: false,
      isEarlyDeploy: false,
      activationDeltaMilliGu: 0,
      churnThreatDeltaMilliGu: 0,
      opsLeakDeltaCents: 0n,
      lockDurationMs: 0,
    },
  };
}
