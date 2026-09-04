/**
 * Operations Room Logic: SCRATCH / REVEAL
 * Product Truth: company_sim_v1/product_final.md Section 9.6
 *
 * 16x16 coarse mask (256 cells)
 * At 35% revealed area (90 cells), 3 diagnosis options unlock.
 * Correct diagnosis resolves incident.
 * Wrong diagnosis locks card for 6s and adds 0.05 CU cost.
 *
 * S1 unresolved: +0.05 CU monthly leak
 * S2 unresolved: +0.10 CU monthly leak, +0.25 Churn Threat GU after 30s
 * S3 unresolved: +0.25 CU monthly leak, -2 Ops Capacity, +0.50 Churn Threat GU every 30s
 */

import type { OperationsIncident, MoneyCents } from '../types';
import { SeededRng } from '../rng';

export interface OperationsDiagnosisResolution {
  incidentId: string;
  isCorrect: boolean;
  isResolved: boolean;
  costPenaltyCents: MoneyCents;
  lockDurationMs: number;
}

export function createOperationsIncident(
  rng: SeededRng,
  id: string,
  severity: 'S1' | 'S2' | 'S3' = 'S1',
  category: string = 'Inference Cost Leak',
  initialRevealPercentage: number = 0
): OperationsIncident {
  const diagnosisPools = {
    'Inference Cost Leak': ['Uncached Prompt Loops', 'Missing Max Tokens Param', 'Runaway Agent Retry Worker'],
    'Database Migration Deadlock': ['Missing Index on TenantId', 'Unbounded Foreign Key Lock', 'Concurrent Schema Alter'],
    'Auth Token Expiry Spike': ['Stale JWKS Cache', 'Misconfigured Clock Skew', 'Refresh Token Invalidation'],
  };

  const pool = diagnosisPools[category as keyof typeof diagnosisPools] || [
    'Config Desync',
    'Out of Memory Threshold',
    'Zombie Webhook Worker',
  ];

  const correctIndex = rng.int(0, pool.length - 1);

  // Initialize 16x16 mask
  const revealedMask: boolean[][] = Array.from({ length: 16 }, () =>
    Array.from({ length: 16 }, () => false)
  );

  let revealedCount = 0;
  if (initialRevealPercentage > 0) {
    const targetCells = Math.round((256 * initialRevealPercentage) / 100);
    for (let r = 0; r < 16 && revealedCount < targetCells; r++) {
      for (let c = 0; c < 16 && revealedCount < targetCells; c++) {
        revealedMask[r][c] = true;
        revealedCount++;
      }
    }
  }

  return {
    id,
    severity,
    category,
    diagnosisOptions: pool,
    correctDiagnosisIndex: correctIndex,
    revealedMask,
    revealedPercentage: (revealedCount / 256) * 100,
    activeDurationSec: 0,
    lockedUntilMs: 0,
    isResolved: false,
  };
}

export function scratchMaskCells(
  incident: OperationsIncident,
  cellsToReveal: Array<[number, number]>
): OperationsIncident {
  const mask = incident.revealedMask.map((row) => [...row]);
  let count = 0;

  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      if (mask[r][c]) count++;
    }
  }

  for (const [r, c] of cellsToReveal) {
    if (r >= 0 && r < 16 && c >= 0 && c < 16) {
      if (!mask[r][c]) {
        mask[r][c] = true;
        count++;
      }
    }
  }

  const revealedPercentage = (count / 256) * 100;

  return {
    ...incident,
    revealedMask: mask,
    revealedPercentage,
  };
}

export function resolveIncidentDiagnosis(
  incident: OperationsIncident,
  selectedChoiceIndex: number,
  capitalUnitCents: MoneyCents
): { nextIncident: OperationsIncident; resolution: OperationsDiagnosisResolution } {
  const penaltyCents = capitalUnitCents / 20n; // 0.05 CU

  if (selectedChoiceIndex === incident.correctDiagnosisIndex) {
    return {
      nextIncident: {
        ...incident,
        isResolved: true,
        lockedUntilMs: 0,
      },
      resolution: {
        incidentId: incident.id,
        isCorrect: true,
        isResolved: true,
        costPenaltyCents: 0n,
        lockDurationMs: 0,
      },
    };
  }

  // Wrong diagnosis: lock for 6 seconds and add penalty
  return {
    nextIncident: {
      ...incident,
      lockedUntilMs: 6000,
    },
    resolution: {
      incidentId: incident.id,
      isCorrect: false,
      isResolved: false,
      costPenaltyCents: penaltyCents,
      lockDurationMs: 6000,
    },
  };
}
