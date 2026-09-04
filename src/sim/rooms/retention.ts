/**
 * Retention Room Logic: AIM / AUTO-FIRE
 * Product Truth: company_sim_v1/product_final.md Section 9.4
 *
 * S1: 1 HP, 0.25 GU ARR churn value, 8s base travel time
 * S2: 2 HP, 0.50 GU ARR churn value, 7s base travel time
 * S3: 4 HP, 1.00 GU ARR churn value, 6s base travel time
 *
 * Founder Turret: 0.45s fire interval, 1 damage, 35% rate when away
 */

import type { RetentionThreat } from '../types';
import { SeededRng } from '../rng';

export interface ThreatResolution {
  destroyedThreats: RetentionThreat[];
  churnedThreats: RetentionThreat[];
  churnedMilliGu: number;
}

export function createRetentionThreat(
  _rng: SeededRng,
  id: string,
  severity: 'S1' | 'S2' | 'S3' = 'S1',
  causeId: string = 'bug'
): RetentionThreat {
  let hp = 1;
  let arrValueMilliGu = 250; // 0.25 GU
  let travelTimeTotalSec = 8.0;

  if (severity === 'S2') {
    hp = 2;
    arrValueMilliGu = 500;   // 0.50 GU
    travelTimeTotalSec = 7.0;
  } else if (severity === 'S3') {
    hp = 4;
    arrValueMilliGu = 1000;  // 1.00 GU
    travelTimeTotalSec = 6.0;
  }

  return {
    id,
    severity,
    hp,
    maxHp: hp,
    arrValueMilliGu,
    travelTimeTotalSec,
    travelTimeRemainingSec: travelTimeTotalSec,
    causeId,
  };
}

export function updateRetentionBattlefield(
  threats: RetentionThreat[],
  deltaSec: number,
  aimThreatId: string | null,
  turretCooldownSec: number,
  isFounderPresent: boolean,
  agentDamageBonus: number = 0
): {
  remainingThreats: RetentionThreat[];
  destroyedThreats: RetentionThreat[];
  churnedThreats: RetentionThreat[];
  churnedMilliGu: number;
  newTurretCooldownSec: number;
} {
  let cooldown = turretCooldownSec - deltaSec;
  const fireInterval = isFounderPresent ? 0.45 : 0.45 / 0.35; // 0.45s vs ~1.28s

  const updatedThreats = threats.map((t) => ({
    ...t,
    travelTimeRemainingSec: t.travelTimeRemainingSec - deltaSec,
  }));

  const destroyedThreats: RetentionThreat[] = [];
  const churnedThreats: RetentionThreat[] = [];
  let churnedMilliGu = 0;

  // Filter out threats that crossed the churn line
  const activeThreats: RetentionThreat[] = [];
  for (const t of updatedThreats) {
    if (t.travelTimeRemainingSec <= 0) {
      churnedThreats.push(t);
      churnedMilliGu += t.arrValueMilliGu;
    } else {
      activeThreats.push(t);
    }
  }

  // Turret auto-fire against prioritized target or closest target
  if (cooldown <= 0 && activeThreats.length > 0) {
    cooldown = fireInterval;
    let targetIndex = -1;

    if (aimThreatId) {
      targetIndex = activeThreats.findIndex((t) => t.id === aimThreatId);
    }
    if (targetIndex === -1) {
      // Prioritize highest ARR danger or least remaining time
      let leastTime = Infinity;
      for (let i = 0; i < activeThreats.length; i++) {
        if (activeThreats[i].travelTimeRemainingSec < leastTime) {
          leastTime = activeThreats[i].travelTimeRemainingSec;
          targetIndex = i;
        }
      }
    }

    if (targetIndex !== -1) {
      const target = activeThreats[targetIndex];
      const damage = 1 + agentDamageBonus;
      const nextHp = target.hp - damage;

      if (nextHp <= 0) {
        destroyedThreats.push({ ...target, hp: 0 });
        activeThreats.splice(targetIndex, 1);
      } else {
        activeThreats[targetIndex] = { ...target, hp: nextHp };
      }
    }
  }

  return {
    remainingThreats: activeThreats,
    destroyedThreats,
    churnedThreats,
    churnedMilliGu,
    newTurretCooldownSec: cooldown > 0 ? cooldown : 0,
  };
}
