import React, { useState, useCallback } from 'react';
import { CanvasContainer } from '../CanvasContainer';
import type { RoomViewport } from '../viewport';
import type { RetentionThreat, AgentTier } from '../../sim/types';
import { soundEngine } from '../../audio/soundEffects';
import { useV1Store } from '../../state/v1Store';
import { formatMoney } from '../../sim/math';

interface RetentionRoomCanvasProps {
  threats: RetentionThreat[];
  agentTier: AgentTier;
  onAim: (threatId: string | null) => void;
  onFireLaser: (threatId: string) => void;
}

export const RetentionRoomCanvas: React.FC<RetentionRoomCanvasProps> = ({
  threats,
  agentTier,
  onAim,
  onFireLaser,
}) => {
  const company = useV1Store((s) => s.company);
  const [aimCoords, setAimCoords] = useState<{ x: number; y: number }>({ x: 500, y: 400 });
  const [lastShotTime, setLastShotTime] = useState<number>(0);
  const [activeLaser, setActiveLaser] = useState<{ startX: number; startY: number; endX: number; endY: number; time: number } | null>(null);

  const CHURN_LINE_Y = 800;

  const findTargetThreat = useCallback(
    (coords: { x: number; y: number }): RetentionThreat | null => {
      let closest: RetentionThreat | null = null;
      let minDistance = 90;

      threats.forEach((t) => {
        const progress = Math.max(0, Math.min(1, 1 - t.travelTimeRemainingSec / t.travelTimeTotalSec));
        const threatY = 140 + progress * (CHURN_LINE_Y - 140);
        const threatX = 200 + (t.id.charCodeAt(t.id.length - 1) % 6) * 110;
        const dist = Math.hypot(coords.x - threatX, coords.y - threatY);
        if (dist < minDistance) {
          closest = t;
          minDistance = dist;
        }
      });

      return closest;
    },
    [threats, CHURN_LINE_Y]
  );

  const handlePointerMove = useCallback(
    (coords: { x: number; y: number }) => {
      setAimCoords(coords);
      const target = findTargetThreat(coords);
      onAim(target ? target.id : null);
    },
    [findTargetThreat, onAim]
  );

  const handlePointerDown = useCallback(
    (coords: { x: number; y: number }) => {
      handlePointerMove(coords);

      const now = Date.now();
      if (now - lastShotTime > 250 && threats.length > 0) {
        setLastShotTime(now);
        soundEngine.playTicketResolved();

        // Target aimed threat or closest to churn perimeter
        const target = findTargetThreat(coords) || threats[0];
        const progress = Math.max(0, Math.min(1, 1 - target.travelTimeRemainingSec / target.travelTimeTotalSec));
        const targetY = 140 + progress * (CHURN_LINE_Y - 140);
        const targetX = 200 + (target.id.charCodeAt(target.id.length - 1) % 6) * 110;

        setActiveLaser({
          startX: 500,
          startY: 900,
          endX: targetX,
          endY: targetY,
          time: now,
        });

        onFireLaser(target.id);
      }
    },
    [handlePointerMove, lastShotTime, threats, findTargetThreat, onFireLaser, CHURN_LINE_Y]
  );

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, _viewport: RoomViewport, _time: number) => {
      // Background Circular Radar Range Rings (Gleb aerospace styling)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      [200, 380, 560, 740].forEach((r) => {
        ctx.beginPath();
        ctx.arc(500, 900, r, Math.PI, 0, false);
        ctx.stroke();
      });

      // Header System Status
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('MODULE 04 // RETENTION & CHURN DEFENSE', 100, 80);

      ctx.textAlign = 'right';
      ctx.fillStyle = threats.length > 0 ? '#ef4444' : '#22c55e';
      ctx.fillText(threats.length > 0 ? `${threats.length} CHURN THREATS ACTIVE` : 'ZERO ACTIVE CHURN', 900, 80);

      // Section Title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 22px Inter, -apple-system, sans-serif';
      ctx.fillText('Account Retention Perimeter', 500, 115);

      // Churn Perimeter Line (Critical threshold)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(100, CHURN_LINE_Y);
      ctx.lineTo(900, CHURN_LINE_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('CRITICAL CHURN BOUNDARY', 890, CHURN_LINE_Y - 10);

      // Render Threats
      threats.forEach((t) => {
        const progress = Math.max(0, Math.min(1, 1 - t.travelTimeRemainingSec / t.travelTimeTotalSec));
        const threatY = 140 + progress * (CHURN_LINE_Y - 140);
        const threatX = 200 + (t.id.charCodeAt(t.id.length - 1) % 6) * 110;

        ctx.save();
        ctx.translate(threatX, threatY);

        const isAimTarget =
          Math.hypot(aimCoords.x - threatX, aimCoords.y - threatY) < 60;

        // Threat Body
        const threatColor = t.severity === 'S3' ? '#ef4444' : t.severity === 'S2' ? '#f59e0b' : '#eab308';
        ctx.fillStyle = threatColor;
        ctx.beginPath();
        const size = t.severity === 'S3' ? 30 : t.severity === 'S2' ? 24 : 18;
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        if (isAimTarget) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, size + 8, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Threat Severity label
        ctx.fillStyle = '#000000';
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${t.severity} (${t.hp})`, 0, 0);

        // Real Dollar ARR at Risk
        const atRiskStr = formatMoney((company.growthUnitCents * BigInt(t.arrValueMilliGu)) / 1000n);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillText(`-${atRiskStr} ARR`, 0, size + 16);

        ctx.restore();
      });

      // Active Laser Shot
      if (activeLaser && Date.now() - activeLaser.time < 120) {
        ctx.save();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(activeLaser.startX, activeLaser.startY);
        ctx.lineTo(activeLaser.endX, activeLaser.endY);
        ctx.stroke();
        ctx.restore();
      }

      // Founder Defense Turret (Gleb Hardware Base)
      const turretAngle = Math.atan2(aimCoords.y - 900, aimCoords.x - 500);

      ctx.save();
      ctx.translate(500, 900);

      // Base
      ctx.fillStyle = '#111113';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Barrel
      ctx.rotate(turretAngle);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, -6, 60, 12);
      ctx.restore();

      // Precision Aim Reticle
      ctx.save();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(aimCoords.x, aimCoords.y, 22, 0, Math.PI * 2);
      ctx.moveTo(aimCoords.x - 30, aimCoords.y);
      ctx.lineTo(aimCoords.x + 30, aimCoords.y);
      ctx.moveTo(aimCoords.x, aimCoords.y - 30);
      ctx.lineTo(aimCoords.x, aimCoords.y + 30);
      ctx.stroke();
      ctx.restore();

      // Autonomous Support Agent Turret Deck
      if (agentTier > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(140, 830, 720, 44, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(170, 852, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SUPPORT AGENT TIER ${agentTier} ACTIVE`, 186, 856);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'right';
        ctx.fillText('AUTO-FIRING SECONDARY TURRET · PREVENTING CHURNED ARR', 835, 856);
      }
    },
    [threats, aimCoords, activeLaser, agentTier, company.growthUnitCents, CHURN_LINE_Y]
  );

  return (
    <CanvasContainer
      onRender={render}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    />
  );
};
