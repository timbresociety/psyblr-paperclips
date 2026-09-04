import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CanvasContainer } from '../CanvasContainer';
import type { RoomViewport } from '../viewport';
import type { OperationsIncident, AgentTier } from '../../sim/types';
import { scratchMaskCells, resolveIncidentDiagnosis } from '../../sim/rooms/operations';
import { soundEngine } from '../../audio/soundEffects';
import { useV1Store } from '../../state/v1Store';
import { formatMoney } from '../../sim/math';

interface OperationsRoomCanvasProps {
  incident: OperationsIncident | null;
  agentTier: AgentTier;
  onResolve: (isCorrect: boolean) => void;
}

export const OperationsRoomCanvas: React.FC<OperationsRoomCanvasProps> = ({
  incident,
  agentTier,
  onResolve,
}) => {
  const company = useV1Store((s) => s.company);
  const [localIncident, setLocalIncident] = useState<OperationsIncident | null>(incident);
  const isScrubbingRef = useRef(false);
  const [feedback, setFeedback] = useState<{ text: string; subtext: string; isCorrect: boolean; time: number } | null>(null);

  useEffect(() => {
    setLocalIncident(incident);
  }, [incident]);

  const SCOPE_X = 140;
  const SCOPE_Y = 200;
  const SCOPE_W = 720;
  const SCOPE_H = 320;

  // Real dollar burn for incident severity
  const leakPerMonthStr = incident?.severity === 'S3'
    ? formatMoney((company.capitalUnitCents * 25n) / 100n)
    : incident?.severity === 'S2'
    ? formatMoney((company.capitalUnitCents * 10n) / 100n)
    : formatMoney((company.capitalUnitCents * 5n) / 100n);

  const scrubAt = useCallback(
    (coords: { x: number; y: number }) => {
      setLocalIncident((curr) => {
        if (!curr || curr.lockedUntilMs > 0) return curr;
        // Map pointer position in scope (140..860 x 200..520) to 16x16 grid
        const normX = Math.max(0, Math.min(1, (coords.x - SCOPE_X) / SCOPE_W));
        const normY = Math.max(0, Math.min(1, (coords.y - SCOPE_Y) / SCOPE_H));

        const cellC = Math.floor(normX * 16);
        const cellR = Math.floor(normY * 16);

        if (cellC >= 0 && cellC < 16 && cellR >= 0 && cellR < 16) {
          const cellsToReveal: Array<[number, number]> = [];
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              cellsToReveal.push([cellR + dr, cellC + dc]);
            }
          }
          const updated = scratchMaskCells(curr, cellsToReveal);
          return updated;
        }
        return curr;
      });
    },
    [SCOPE_W, SCOPE_H]
  );

  const handlePointerDown = useCallback(
    (coords: { x: number; y: number }) => {
      if (!localIncident || localIncident.lockedUntilMs > 0) return;

      // Check if clicked one of the 3 diagnosis hypothesis cards (if revealed >= 35%)
      if (localIncident.revealedPercentage >= 35) {
        localIncident.diagnosisOptions.forEach((_opt, idx) => {
          const btnY = 560 + idx * 64;
          if (
            coords.x >= SCOPE_X &&
            coords.x <= SCOPE_X + SCOPE_W &&
            coords.y >= btnY &&
            coords.y <= btnY + 54
          ) {
            const res = resolveIncidentDiagnosis(localIncident, idx, company.capitalUnitCents);
            setLocalIncident(res.nextIncident);
            if (res.resolution.isCorrect) {
              soundEngine.playTicketResolved();
              soundEngine.playCash();
              setFeedback({
                text: '✓ INCIDENT RESOLVED',
                subtext: `Bug patched · ${leakPerMonthStr}/mo operational burn terminated`,
                isCorrect: true,
                time: Date.now(),
              });
              onResolve(true);
            } else {
              soundEngine.playAlarm();
              setFeedback({
                text: '✕ WRONG DIAGNOSIS',
                subtext: 'Patch failed · Lockout cooldown active',
                isCorrect: false,
                time: Date.now(),
              });
              onResolve(false);
            }
            return;
          }
        });
      }

      // Check if scrub inside telemetry scope
      if (
        coords.x >= SCOPE_X &&
        coords.x <= SCOPE_X + SCOPE_W &&
        coords.y >= SCOPE_Y &&
        coords.y <= SCOPE_Y + SCOPE_H
      ) {
        isScrubbingRef.current = true;
        scrubAt(coords);
      }
    },
    [localIncident, onResolve, scrubAt, company.capitalUnitCents, leakPerMonthStr]
  );

  const handlePointerMove = useCallback(
    (coords: { x: number; y: number }) => {
      if (!isScrubbingRef.current) return;
      scrubAt(coords);
    },
    [scrubAt]
  );

  const handlePointerUp = useCallback(() => {
    isScrubbingRef.current = false;
  }, []);

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, _viewport: RoomViewport, time: number) => {
      const activeInc = localIncident || incident;

      // Subtle Background Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 100; x < 900; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 80);
        ctx.lineTo(x, 920);
        ctx.stroke();
      }

      // Header System Status
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('MODULE 06 // RELIABILITY & OPERATIONS', 140, 90);

      ctx.textAlign = 'right';
      ctx.fillStyle = activeInc ? '#ef4444' : '#22c55e';
      ctx.fillText(activeInc ? `CRITICAL ALERT [${activeInc.severity}]` : 'ALL SYSTEMS NOMINAL', 860, 90);

      // Section Title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 24px Inter, -apple-system, sans-serif';
      ctx.fillText(activeInc ? 'Active Service Outage Detected' : 'Infrastructure Telemetry', 500, 140);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '400 13px Inter, -apple-system, sans-serif';
      ctx.fillText(
        activeInc
          ? `Scrub the telemetry scope to analyze traces, then deploy the root-cause patch`
          : 'Zero active incidents. Systems operating within baseline tolerances.',
        500,
        168
      );

      if (activeInc && !activeInc.isResolved) {
        // Main Telemetry Scope Deck
        ctx.fillStyle = '#0d0d10';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(SCOPE_X, SCOPE_Y, SCOPE_W, SCOPE_H, 14);
        ctx.fill();
        ctx.stroke();

        // Scope Top Bar
        ctx.fillStyle = '#18181b';
        ctx.fillRect(SCOPE_X + 1, SCOPE_Y + 1, SCOPE_W - 2, 34);
        ctx.fillStyle = activeInc.severity === 'S3' ? '#ef4444' : '#f59e0b';
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`● [${activeInc.severity}] ${activeInc.category.toUpperCase()} OUTAGE`, SCOPE_X + 16, SCOPE_Y + 22);

        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'right';
        ctx.fillText(`ACTIVE LEAK: -${leakPerMonthStr} / MO CASH`, SCOPE_X + SCOPE_W - 16, SCOPE_Y + 22);

        // Render Anomaly Waveform across Scope
        const pct = activeInc.revealedPercentage;
        ctx.save();
        ctx.beginPath();
        ctx.rect(SCOPE_X, SCOPE_Y + 36, SCOPE_W, SCOPE_H - 36);
        ctx.clip();

        // Waveform trace
        ctx.strokeStyle = activeInc.severity === 'S3' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < SCOPE_W; x += 4) {
          const freq = 0.03 + (1 - pct / 100) * 0.05;
          const noise = (1 - pct / 100) * (Math.sin(x * 0.2 + time * 0.01) * 20);
          const y = SCOPE_Y + 140 + Math.sin(x * freq + time * 0.005) * 40 + noise;
          if (x === 0) ctx.moveTo(SCOPE_X + x, y);
          else ctx.lineTo(SCOPE_X + x, y);
        }
        ctx.stroke();

        // Terminal stack traces (revealed progressively as player scrubs)
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';

        const traces = [
          { depth: 10, text: 'CRITICAL: Worker process thread saturation detected', color: 'rgba(255, 255, 255, 0.5)' },
          { depth: 25, text: 'at Pool.acquireConnection (pg-driver.ts:88)', color: 'rgba(255, 255, 255, 0.6)' },
          { depth: 40, text: 'WARN: Mutex contention exceeding 4500ms threshold', color: '#f59e0b' },
          { depth: 55, text: `EVIDENCE: ${activeInc.diagnosisOptions[activeInc.correctDiagnosisIndex]}`, color: '#22c55e' },
          { depth: 75, text: 'STACK: 92% of CPU idle awaiting locked vector database shard', color: 'rgba(255, 255, 255, 0.7)' },
        ];

        traces.forEach((tr, i) => {
          if (pct >= tr.depth) {
            ctx.fillStyle = tr.color;
            ctx.fillText(tr.text, SCOPE_X + 24, SCOPE_Y + 210 + i * 22);
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.fillText('[ ENCRYPTED TELEMETRY TRACE — SCRUB TO DECODE ]', SCOPE_X + 24, SCOPE_Y + 210 + i * 22);
          }
        });

        // Interactive Scrub Indicator Bar at bottom of scope
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(SCOPE_X, SCOPE_Y + SCOPE_H - 12, SCOPE_W, 12);

        ctx.fillStyle = pct >= 35 ? '#22c55e' : '#f59e0b';
        ctx.fillRect(SCOPE_X, SCOPE_Y + SCOPE_H - 12, (pct / 100) * SCOPE_W, 12);

        ctx.restore();

        // Instruction / Scrubber Callout
        ctx.fillStyle = pct >= 35 ? '#22c55e' : 'rgba(255, 255, 255, 0.5)';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          pct >= 35
            ? `✓ TRACE ANALYSIS COMPLETE (${pct.toFixed(0)}%) — SELECT ROOT CAUSE TO DEPLOY PATCH`
            : `← DRAG / SCRUB MOUSE ACROSS SCOPE TO SCAN TRACES (${pct.toFixed(0)}% / 35% REQUIRED) →`,
          500,
          540
        );

        // 3 Diagnosis Hypotheses Buttons (y: 560..760)
        activeInc.diagnosisOptions.forEach((opt, idx) => {
          const btnY = 560 + idx * 64;
          const isReady = pct >= 35;

          ctx.fillStyle = isReady ? '#18181b' : 'rgba(255, 255, 255, 0.02)';
          ctx.strokeStyle = isReady ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(SCOPE_X, btnY, SCOPE_W, 52, 10);
          ctx.fill();
          ctx.stroke();

          // Tag [A], [B], [C]
          const tagLetter = String.fromCharCode(65 + idx);
          ctx.fillStyle = isReady ? '#ffffff' : 'rgba(255, 255, 255, 0.2)';
          ctx.font = '700 12px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`[${tagLetter}]`, SCOPE_X + 20, btnY + 31);

          ctx.font = isReady ? '600 14px Inter, sans-serif' : '400 13px Inter, sans-serif';
          ctx.fillText(
            isReady ? `DEPLOY PATCH: ${opt}` : `Hypothesis [${tagLetter}] Locked (Scrub scope to 35%)`,
            SCOPE_X + 60,
            btnY + 31
          );

          if (isReady) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '500 11px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText('CLICK TO COMMIT', SCOPE_X + SCOPE_W - 20, btnY + 31);
          }
        });
      } else {
        // Nominal All-Green State
        ctx.fillStyle = 'rgba(34, 197, 94, 0.05)';
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(SCOPE_X, SCOPE_Y, SCOPE_W, SCOPE_H, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.font = '700 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓ All Services Healthy', 500, SCOPE_Y + 140);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '400 13px Inter, sans-serif';
        ctx.fillText('Compute clusters, vector caches, and database pools are operating at peak efficiency.', 500, SCOPE_Y + 175);
      }

      // Feedback Toast
      if (feedback && Date.now() - feedback.time < 2200) {
        const age = Date.now() - feedback.time;
        const opacity = Math.max(0, 1 - age / 2200);

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.textAlign = 'center';

        ctx.fillStyle = '#18181b';
        ctx.strokeStyle = feedback.isCorrect ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(240, 420, 520, 76, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = feedback.isCorrect ? '#22c55e' : '#ef4444';
        ctx.font = '700 16px "JetBrains Mono", monospace';
        ctx.fillText(feedback.text, 500, 452);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '400 12px Inter, sans-serif';
        ctx.fillText(feedback.subtext, 500, 476);

        ctx.restore();
      }

      // Autonomous Operations Agent Telemetry Deck
      if (agentTier > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(140, 780, 720, 44, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(170, 802, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`OPERATIONS AGENT TIER ${agentTier} ACTIVE`, 186, 806);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'right';
        ctx.fillText('AUTO-TRIAGING INCIDENTS · AUTOMATED SYSTEM SELF-HEALING', 835, 806);
      }
    },
    [localIncident, incident, agentTier, leakPerMonthStr, feedback]
  );

  return (
    <CanvasContainer
      onRender={render}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
};
