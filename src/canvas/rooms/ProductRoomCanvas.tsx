import React, { useState, useCallback, useEffect } from 'react';
import { CanvasContainer } from '../CanvasContainer';
import type { RoomViewport } from '../viewport';
import type { ProductSlot, ProductPieceType, AgentTier } from '../../sim/types';
import { canMergePiece } from '../../sim/rooms/product';
import { soundEngine } from '../../audio/soundEffects';
import { formatMoney } from '../../sim/math';
import confetti from 'canvas-confetti';

interface ProductRoomCanvasProps {
  slots: ProductSlot[];
  agentTier: AgentTier;
  demandBacklogMilliGu: number;
  activationBacklogMilliGu: number;
  cashCents?: bigint;
  capitalUnitCents?: bigint;
  onBuySprint?: (tier?: 'boost' | 'ship_all') => boolean;
  onMerge: (slotId: string, piece: ProductPieceType) => void;
  onEarlyDeploy: (slotId: string) => void;
  onVerifySuite?: (slotId: string) => void;
  onSwitchToPricing: () => void;
  onSwitchToMarketing?: () => void;
}

interface PieceDef {
  type: ProductPieceType;
  x: number;
  y: number;
  label: string;
  shapeLabel: string;
  glyph: string;
  color: string;
  glowColor: string;
  shortcut: string;
  role: string;
}

interface FeatureArchetype {
  name: string;
  tag: string;
  desc: string;
  diff: string;
  code: string;
}

const FEATURE_ARCHETYPES: FeatureArchetype[] = [
  { name: 'API GATEWAY', tag: 'CORE INFRA', desc: 'Reverse proxy & auth filter', diff: '+184 / -32 lines', code: 'export const gateway = new Router();' },
  { name: 'VECTOR SEARCH', tag: 'AI ENGINE', desc: 'HNSW index & embeddings', diff: '+320 / -14 lines', code: 'const docs = await vectorIdx.query(q);' },
  { name: 'AUTH & RBAC', tag: 'SECURITY', desc: 'OAuth2 session & role tokens', diff: '+142 / -56 lines', code: 'validateSessionToken(jwt, { rbac: true });' },
  { name: 'BILLING ENGINE', tag: 'FINTECH', desc: 'Stripe idempotency ledger', diff: '+210 / -19 lines', code: 'await stripe.charges.create({...});' },
  { name: 'REALTIME SSE', tag: 'STREAMING', desc: 'Bidirectional state sync', diff: '+98 / -12 lines', code: 'stream.pipeTo(eventSink.writable);' },
  { name: 'SWARM ROUTER', tag: 'AGENT ORCH', desc: 'Autonomous DAG pipeline', diff: '+412 / -88 lines', code: 'const plan = await swarm.compile(spec);' },
];

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
}

function drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawTriangle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.866, cy + r * 0.5);
  ctx.lineTo(cx - r * 0.866, cy + r * 0.5);
  ctx.closePath();
}

function drawOrb(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
}

function drawPiecePolygon(
  ctx: CanvasRenderingContext2D,
  type: ProductPieceType,
  cx: number,
  cy: number,
  r: number
) {
  switch (type) {
    case 'PROMPT':
      drawDiamond(ctx, cx, cy, r);
      break;
    case 'DIFF':
      drawHexagon(ctx, cx, cy, r);
      break;
    case 'TEST':
      drawTriangle(ctx, cx, cy, r);
      break;
    case 'DEPLOY':
      drawOrb(ctx, cx, cy, r);
      break;
  }
}

export const ProductRoomCanvas: React.FC<ProductRoomCanvasProps> = ({
  slots,
  agentTier,
  demandBacklogMilliGu,
  activationBacklogMilliGu,
  cashCents,
  capitalUnitCents,
  onBuySprint,
  onMerge,
  onEarlyDeploy,
  onVerifySuite,
  onSwitchToPricing,
  onSwitchToMarketing,
}) => {
  const [draggedPiece, setDraggedPiece] = useState<ProductPieceType | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<ProductPieceType | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [feedback, setFeedback] = useState<{
    text: string;
    subtext: string;
    isSuccess: boolean;
    time: number;
    color: string;
  } | null>(null);
  const [mismatchSlotId, setMismatchSlotId] = useState<string | null>(null);

  const unitCents = capitalUnitCents || 2500000n;
  const currentCash = cashCents || 0n;
  const sprintCostCents = (unitCents * 50n) / 100n; // 0.5 CU
  const canAffordSprint = currentCash >= sprintCostCents;

  // Bottom tray pieces (Shape Arsenal / Vibe Coding primitives)
  const trayPieces: PieceDef[] = [
    {
      type: 'PROMPT',
      x: 180,
      y: 724,
      label: 'PROMPT',
      shapeLabel: 'CYAN [>_]',
      glyph: '>_',
      color: '#00f5ff',
      glowColor: 'rgba(0, 245, 255, 0.6)',
      shortcut: 'P',
      role: 'Prompt Spec',
    },
    {
      type: 'DIFF',
      x: 390,
      y: 724,
      label: 'DIFF',
      shapeLabel: 'VIOLET [{ }]',
      glyph: '{ }',
      color: '#c084fc',
      glowColor: 'rgba(192, 132, 252, 0.6)',
      shortcut: 'D',
      role: 'AST Synthesizer',
    },
    {
      type: 'TEST',
      x: 600,
      y: 724,
      label: 'TEST',
      shapeLabel: 'GOLD [✓]',
      glyph: '✓',
      color: '#fbbf24',
      glowColor: 'rgba(251, 191, 36, 0.6)',
      shortcut: 'T',
      role: 'Automated CI/CD',
    },
    {
      type: 'DEPLOY',
      x: 810,
      y: 724,
      label: 'DEPLOY',
      shapeLabel: 'EMERALD [▲]',
      glyph: '▲',
      color: '#34d399',
      glowColor: 'rgba(52, 211, 153, 0.6)',
      shortcut: 'S',
      role: 'Production Rollout',
    },
  ];

  // 6 slots in a 3x2 layout: width 274, height 260
  const slotBounds: Array<{ id: string; x: number; y: number; w: number; h: number }> = slots.map(
    (slot, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      return {
        id: slot.id,
        x: 70 + col * 293,
        y: 92 + row * 274,
        w: 274,
        h: 260,
      };
    }
  );

  // Keyboard controls for power-user shape selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const key = e.key.toUpperCase();
      if (key === 'P') {
        setSelectedPiece((prev) => (prev === 'PROMPT' ? null : 'PROMPT'));
        soundEngine.playClick();
      } else if (key === 'D') {
        setSelectedPiece((prev) => (prev === 'DIFF' ? null : 'DIFF'));
        soundEngine.playClick();
      } else if (key === 'T') {
        setSelectedPiece((prev) => (prev === 'TEST' ? null : 'TEST'));
        soundEngine.playClick();
      } else if (key === 'S') {
        setSelectedPiece((prev) => (prev === 'DEPLOY' ? null : 'DEPLOY'));
        soundEngine.playClick();
      } else if (e.key === 'Escape') {
        setSelectedPiece(null);
        setDraggedPiece(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle snapping piece into a slot
  const attemptMerge = useCallback(
    (slot: ProductSlot, piece: ProductPieceType) => {
      const isValid = canMergePiece(slot, piece);

      if (!isValid) {
        soundEngine.playWarningAlert();
        setMismatchSlotId(slot.id);
        setTimeout(() => setMismatchSlotId(null), 1000);

        setFeedback({
          text: '⚠ SOCKET MISMATCH',
          subtext: `Slot requires a different compilation stage. Check requirements.`,
          isSuccess: false,
          time: Date.now(),
          color: '#f87171',
        });

        onMerge(slot.id, piece);
        return;
      }

      // Valid merge!
      if (piece === 'DEPLOY') {
        soundEngine.playCelebration();
        soundEngine.playCash();
        try {
          confetti({
            particleCount: 30,
            spread: 50,
            origin: { y: 0.6 },
            colors: ['#34d399', '#00f5ff', '#ffffff'],
          });
        } catch {
          // ignore
        }
        setFeedback({
          text: '🚀 FEATURE SHIPPED TO PRODUCTION',
          subtext: '+1 Activation unlocked for Pricing Deck (Room 3)',
          isSuccess: true,
          time: Date.now(),
          color: '#34d399',
        });
      } else {
        soundEngine.playBuild();
        const stageName = piece === 'PROMPT' ? 'PROMPT SPEC' : piece === 'DIFF' ? 'CODE DIFF' : 'EVAL TEST';
        const stageColor = piece === 'PROMPT' ? '#00f5ff' : piece === 'DIFF' ? '#c084fc' : '#fbbf24';
        setFeedback({
          text: `MATCHED ${stageName} INTO POD`,
          subtext: 'Synthesizing module AST in background swarm',
          isSuccess: true,
          time: Date.now(),
          color: stageColor,
        });
      }

      onMerge(slot.id, piece);
      setSelectedPiece(null);
    },
    [onMerge]
  );

  const handlePointerDown = useCallback(
    (coords: { x: number; y: number }) => {
      // 1. Demand Hopper Marketing Shortcut button (when demand is 0)
      if (demandBacklogMilliGu < 1000 && onSwitchToMarketing) {
        if (coords.x >= 730 && coords.x <= 915 && coords.y >= 26 && coords.y <= 68) {
          soundEngine.playClick();
          onSwitchToMarketing();
          return;
        }
      }

      // 2. Floating Pricing CTA when activation backlog ready
      if (activationBacklogMilliGu >= 1000) {
        if (coords.x >= 230 && coords.x <= 770 && coords.y >= 645 && coords.y <= 695) {
          soundEngine.playDeploy();
          onSwitchToPricing();
          return;
        }
      }

      // 3. Tray Pieces Selection
      for (const p of trayPieces) {
        const dist = Math.hypot(coords.x - p.x, coords.y - p.y);
        if (dist < 46) {
          soundEngine.playClick();
          if (selectedPiece === p.type) {
            setSelectedPiece(null);
            setDraggedPiece(null);
          } else {
            setSelectedPiece(p.type);
            setDraggedPiece(p.type);
            setPointerPos(coords);
          }
          return;
        }
      }

      // 4. Click inside a Slot Card
      for (let i = 0; i < slotBounds.length; i++) {
        const sb = slotBounds[i];
        if (
          coords.x >= sb.x &&
          coords.x <= sb.x + sb.w &&
          coords.y >= sb.y &&
          coords.y <= sb.y + sb.h
        ) {
          const targetSlot = slots[i];
          if (!targetSlot) continue;

          // Check if clicked the [YOLO SHIP] button on this card
          // y: sb.y + 218 to sb.y + 248
          const isYoloClick =
            coords.y >= sb.y + 216 &&
            coords.y <= sb.y + 248 &&
            coords.x >= sb.x + 14 &&
            coords.x <= sb.x + sb.w / 2 - 4;

          if (isYoloClick) {
            soundEngine.playDeploy();
            setFeedback({
              text: '⚡ YOLO DEPLOY TRIGGERED!',
              subtext: '+1 Activation · Incurred +20% Vibe Debt risk',
              isSuccess: true,
              time: Date.now(),
              color: '#f59e0b',
            });
            onEarlyDeploy(targetSlot.id);
            setSelectedPiece(null);
            return;
          }

          // Check if clicked the [VERIFY CI/CD] button on this card
          const isVerifyClick =
            coords.y >= sb.y + 216 &&
            coords.y <= sb.y + 248 &&
            coords.x >= sb.x + sb.w / 2 + 4 &&
            coords.x <= sb.x + sb.w - 14;

          if (isVerifyClick) {
            soundEngine.playCelebration();
            setFeedback({
              text: '✓ CI/CD TEST SUITE VERIFIED',
              subtext: 'Zero defects · Purged -25% Vibe Debt',
              isSuccess: true,
              time: Date.now(),
              color: '#34d399',
            });
            if (onVerifySuite) {
              onVerifySuite(targetSlot.id);
            } else {
              onMerge(targetSlot.id, 'DEPLOY');
            }
            setSelectedPiece(null);
            return;
          }

          // If a piece from tray is currently selected, attempt to snap it!
          if (selectedPiece) {
            attemptMerge(targetSlot, selectedPiece);
            return;
          }

          // If no piece is held, guide user toward the needed step
          soundEngine.playClick();
          let neededType: ProductPieceType = 'PROMPT';
          let neededLabel = 'PROMPT [>_]';
          let shapeColor = '#00f5ff';

          if (targetSlot.requirements && targetSlot.requirements.length > 0) {
            const filled = targetSlot.filledIndices || [];
            const nextIdx = targetSlot.requirements.findIndex((_, idx) => !filled.includes(idx));
            if (nextIdx !== -1) {
              neededType = targetSlot.requirements[nextIdx];
              neededLabel =
                neededType === 'PROMPT'
                  ? 'PROMPT SPEC [>_]'
                  : neededType === 'DIFF'
                  ? 'CODE DIFF [{ }]'
                  : 'CI TEST [✓]';
              shapeColor =
                neededType === 'PROMPT' ? '#00f5ff' : neededType === 'DIFF' ? '#c084fc' : '#fbbf24';
            } else {
              neededType = 'DEPLOY';
              neededLabel = 'DEPLOY ORB [▲]';
              shapeColor = '#34d399';
            }
          } else {
            if (targetSlot.state === 'REQUEST') {
              neededType = !targetSlot.hasPrompt ? 'PROMPT' : 'DIFF';
              neededLabel = !targetSlot.hasPrompt ? 'PROMPT SPEC [>_]' : 'CODE DIFF [{ }]';
              shapeColor = !targetSlot.hasPrompt ? '#00f5ff' : '#c084fc';
            } else if (targetSlot.state === 'IMPLEMENTATION') {
              neededType = 'TEST';
              neededLabel = 'CI TEST [✓]';
              shapeColor = '#fbbf24';
            } else {
              neededType = 'DEPLOY';
              neededLabel = 'DEPLOY ORB [▲]';
              shapeColor = '#34d399';
            }
          }

          setSelectedPiece(neededType);
          setFeedback({
            text: `SELECTED ${neededLabel}`,
            subtext: `Tap socket again to synthesize into Pod #${i + 1}`,
            isSuccess: true,
            time: Date.now(),
            color: shapeColor,
          });
          return;
        }
      }

      // 5. R&D CLOUD SPRINT ACCELERATOR (below tray at y: 826..874)
      if (onBuySprint && coords.x >= 280 && coords.x <= 720 && coords.y >= 826 && coords.y <= 874) {
        if (canAffordSprint) {
          const ok = onBuySprint('boost');
          if (ok) {
            soundEngine.playDeploy();
            setFeedback({
              text: '⚡ CLOUD R&D BURST EXECUTED',
              subtext: `Advanced specifications across active pods (${formatMoney(sprintCostCents)})`,
              isSuccess: true,
              color: '#00f5ff',
              time: Date.now(),
            });
          }
        } else {
          soundEngine.playAlarm();
        }
        return;
      }
    },
    [
      demandBacklogMilliGu,
      onSwitchToMarketing,
      activationBacklogMilliGu,
      onSwitchToPricing,
      trayPieces,
      selectedPiece,
      slotBounds,
      slots,
      attemptMerge,
      onEarlyDeploy,
      onVerifySuite,
      onMerge,
      onBuySprint,
      canAffordSprint,
      sprintCostCents,
    ]
  );

  const handlePointerMove = useCallback(
    (coords: { x: number; y: number }) => {
      if (draggedPiece) {
        setPointerPos(coords);
      }
    },
    [draggedPiece]
  );

  const handlePointerUp = useCallback(
    (coords: { x: number; y: number }) => {
      if (!draggedPiece) return;

      for (let i = 0; i < slotBounds.length; i++) {
        const sb = slotBounds[i];
        if (
          coords.x >= sb.x &&
          coords.x <= sb.x + sb.w &&
          coords.y >= sb.y &&
          coords.y <= sb.y + sb.h
        ) {
          const targetSlot = slots[i];
          if (targetSlot) {
            attemptMerge(targetSlot, draggedPiece);
          }
          break;
        }
      }

      setDraggedPiece(null);
    },
    [draggedPiece, slotBounds, slots, attemptMerge]
  );

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, _viewport: RoomViewport, time: number) => {
      const activePiece = draggedPiece || selectedPiece;
      const now = Date.now();
      const demandCount = Math.floor(demandBacklogMilliGu / 1000);

      // =====================================================================
      // 1. MILKINSIDE DEEP OBSIDIAN BACKDROP & SYNAPTIC NEURAL WEB
      // =====================================================================
      ctx.fillStyle = '#030307';
      ctx.fillRect(0, 0, 1000, 1000);

      // Soft ambient radial glow in the center
      const coreGrad = ctx.createRadialGradient(500, 360, 20, 500, 360, 480);
      coreGrad.addColorStop(0, 'rgba(6, 182, 212, 0.07)');
      coreGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.04)');
      coreGrad.addColorStop(1, 'rgba(3, 3, 7, 0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(0, 0, 1000, 1000);

      // Synaptic connection curves between pods
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const p1 = slotBounds[r * 3 + c];
          const p2 = slotBounds[r * 3 + c + 1];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x + p1.w, p1.y + p1.h / 2);
            ctx.bezierCurveTo(
              p1.x + p1.w + 10,
              p1.y + p1.h / 2,
              p2.x - 10,
              p2.y + p2.h / 2,
              p2.x,
              p2.y + p2.h / 2
            );
            ctx.stroke();
          }
        }
      }

      // Floating neural particle pulses
      for (let p = 0; p < 12; p++) {
        const px = (p * 83 + (time / 35) * (p % 2 === 0 ? 1 : -1) * 6) % 900 + 50;
        const py = (p * 77 + (time / 45) * 8) % 850 + 50;
        ctx.fillStyle = p % 2 === 0 ? 'rgba(0, 245, 255, 0.25)' : 'rgba(192, 132, 252, 0.2)';
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // =====================================================================
      // 2. INBOUND DEMAND HOPPER & HEADER HUD (Top Banner)
      // =====================================================================
      ctx.save();
      ctx.fillStyle = 'rgba(10, 14, 26, 0.75)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(70, 16, 860, 62, 16);
      ctx.fill();
      ctx.stroke();

      // Left Header: Module title & system status
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('NEURAL OS // PIPELINE 02', 90, 36);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 14px Inter, sans-serif';
      ctx.fillText('Autonomous Vibe Coding Pods', 90, 56);

      // Right Header: Radiant INBOUND DEMAND HOPPER
      const hopperX = 450;
      const hopperY = 22;
      const hopperW = 465;
      const hopperH = 50;

      if (demandCount > 0) {
        const pulse = 1.0 + Math.sin(time / 200) * 0.03;
        ctx.fillStyle = 'rgba(52, 211, 153, 0.08)';
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(52, 211, 153, 0.35)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(hopperX, hopperY, hopperW, hopperH, 12);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Pulsing green beacon
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(hopperX + 16, hopperY + 25, 4.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`DEMAND HOPPER: ${demandCount} LEADS READY`, hopperX + 30, hopperY + 20);

        // Visual Queued Lead Tokens (Chips)
        const maxVisibleTokens = Math.min(demandCount, 5);
        for (let k = 0; k < maxVisibleTokens; k++) {
          const chipX = hopperX + 30 + k * 72;
          const chipY = hopperY + 28;
          ctx.fillStyle = 'rgba(52, 211, 153, 0.18)';
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(chipX, chipY, 66, 16, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`⚡ LEAD #${k + 1}`, chipX + 33, chipY + 11);
        }

        if (demandCount > 5) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`+${demandCount - 5}`, hopperX + 398, hopperY + 40);
        }
      } else {
        // Demand Hopper Empty state
        ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(hopperX, hopperY, hopperW, hopperH, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(hopperX + 16, hopperY + 25, 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('DEMAND HOPPER EMPTY (0 LEADS)', hopperX + 30, hopperY + 22);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText('Synthesize specs or acquire qualified leads', hopperX + 30, hopperY + 39);

        // Clickable CTA badge to switch to Marketing
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(hopperX + 285, hopperY + 9, 165, 32, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('→ RUN RADAR [1]', hopperX + 367, hopperY + 29);
      }
      ctx.restore();

      // =====================================================================
      // 3. RENDER 6 POD CARDS (FROSTED OBSIDIAN GLASS)
      // =====================================================================
      slots.forEach((slot, i) => {
        const bounds = slotBounds[i];
        if (!bounds) return;

        const archetype = FEATURE_ARCHETYPES[i] || {
          name: slot.name || `FEATURE #${i + 1}`,
          tag: slot.tag || 'SERVICE',
          desc: slot.desc || 'Architecture module',
          diff: '+150 / -30 lines',
          code: 'export const module = {};',
        };

        const isLocked = slot.lockedUntilMs > 0 || mismatchSlotId === slot.id;
        const isCompatibleWithActive = activePiece ? canMergePiece(slot, activePiece) : false;

        ctx.save();

        // Card Container Styling (Frosted Milkinside Glass)
        ctx.fillStyle = isLocked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(9, 13, 23, 0.88)';

        if (isCompatibleWithActive) {
          const glow = 1.0 + Math.sin(time / 140) * 0.12;
          ctx.strokeStyle =
            activePiece === 'PROMPT'
              ? '#00f5ff'
              : activePiece === 'DIFF'
              ? '#c084fc'
              : activePiece === 'TEST'
              ? '#fbbf24'
              : '#34d399';
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 14;
          ctx.lineWidth = 2.2 * glow;
        } else if (isLocked) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.8;
        } else {
          ctx.strokeStyle =
            slot.state === 'VERIFIED'
              ? 'rgba(52, 211, 153, 0.5)'
              : slot.state === 'IMPLEMENTATION'
              ? 'rgba(192, 132, 252, 0.4)'
              : 'rgba(255, 255, 255, 0.07)';
          ctx.lineWidth = 1.2;
        }

        const shakeOffset = isLocked ? Math.sin(time / 25) * 3 : 0;
        ctx.beginPath();
        ctx.roundRect(bounds.x + shakeOffset, bounds.y, bounds.w, bounds.h, 16);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        const cardLeft = bounds.x + shakeOffset + 14;
        const cardRight = bounds.x + shakeOffset + bounds.w - 14;

        // Card Header: Pod ID + Tag
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`POD // 0${i + 1} · ${archetype.tag}`, cardLeft, bounds.y + 20);

        // Feature Name
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 13px Inter, sans-serif';
        ctx.fillText(archetype.name, cardLeft, bounds.y + 38);

        // Diff Telemetry Badge at Top Right
        ctx.fillStyle = 'rgba(0, 245, 255, 0.7)';
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(archetype.diff, cardRight, bounds.y + 20);

        // Micro Code Window (Translucent Inset)
        const codeY = bounds.y + 46;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cardLeft, codeY, bounds.w - 28, 26, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(archetype.code, cardLeft + 8, codeY + 16);

        // ===================================================================
        // SHAPE SOCKETS AREA
        // ===================================================================
        const reqs = slot.requirements || ['PROMPT', 'DIFF', 'TEST'];
        const filled = slot.filledIndices || [];
        const isAllFilled = filled.length >= reqs.length;

        // Sockets Y center
        const socketY = bounds.y + 128;
        const numSockets = reqs.length;

        reqs.forEach((reqType, idx) => {
          let socketX = 0;
          if (numSockets === 2) {
            socketX = idx === 0 ? bounds.x + shakeOffset + 70 : bounds.x + shakeOffset + bounds.w - 70;
          } else {
            if (idx === 0) socketX = bounds.x + shakeOffset + 50;
            else if (idx === 1) socketX = bounds.x + shakeOffset + bounds.w / 2;
            else socketX = bounds.x + shakeOffset + bounds.w - 50;
          }

          const isFilled = filled.includes(idx);
          const isHighlight = !isFilled && activePiece === reqType;
          const shapeColor = reqType === 'PROMPT' ? '#00f5ff' : reqType === 'DIFF' ? '#c084fc' : '#fbbf24';
          const glyph = reqType === 'PROMPT' ? '>_' : reqType === 'DIFF' ? '{ }' : '✓';

          ctx.save();
          if (isFilled) {
            ctx.fillStyle = shapeColor;
            ctx.shadowColor = shapeColor;
            ctx.shadowBlur = 10;
            drawPiecePolygon(ctx, reqType, socketX, socketY, 22);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#000000';
            ctx.font = 'bold 11px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(glyph, socketX, socketY);

            ctx.fillStyle = shapeColor;
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.fillText(`${reqType} ✓`, socketX, socketY + 30);
          } else {
            ctx.fillStyle = isHighlight ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)';
            ctx.strokeStyle = isHighlight ? shapeColor : `${shapeColor}44`;
            ctx.lineWidth = isHighlight ? 2 : 1;
            if (isHighlight) {
              ctx.setLineDash([3, 3]);
              ctx.shadowColor = shapeColor;
              ctx.shadowBlur = 8;
            }
            drawPiecePolygon(ctx, reqType, socketX, socketY, 22);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;

            ctx.fillStyle = isHighlight ? shapeColor : `${shapeColor}88`;
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(glyph, socketX, socketY);

            ctx.fillStyle = isHighlight ? '#ffffff' : `${shapeColor}aa`;
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.fillText(reqType, socketX, socketY + 30);
          }
          ctx.restore();
        });

        // ===================================================================
        // DUAL INTERACTIVE ACTION ROW (YOLO SHIP vs CI/CD VERIFY)
        // ===================================================================
        const btnY = bounds.y + 218;
        const btnH = 28;

        if (isAllFilled || slot.state === 'VERIFIED') {
          // Full-width ready to ship button
          ctx.save();
          const pulse = 1.0 + Math.sin(time / 160) * 0.03;
          ctx.fillStyle = 'rgba(52, 211, 153, 0.18)';
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.5 * pulse;
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.roundRect(cardLeft, btnY, bounds.w - 28, btnH, 8);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('▲ READY TO SHIP TO PRODUCTION', bounds.x + bounds.w / 2, btnY + btnH / 2);
          ctx.restore();
        } else {
          // Button 1: YOLO SHIP (Amber)
          const yoloW = (bounds.w - 36) / 2;
          ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(cardLeft, btnY, yoloW, btnH, 7);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡ YOLO SHIP', cardLeft + yoloW / 2, btnY + 10);

          ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
          ctx.font = '7px "JetBrains Mono", monospace';
          ctx.fillText('+VIBE DEBT', cardLeft + yoloW / 2, btnY + 21);

          // Button 2: VERIFY CI/CD (Cyan)
          const verifyX = cardLeft + yoloW + 8;
          ctx.fillStyle = 'rgba(0, 245, 255, 0.12)';
          ctx.strokeStyle = '#00f5ff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(verifyX, btnY, yoloW, btnH, 7);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#00f5ff';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✓ VERIFY CI', verifyX + yoloW / 2, btnY + 10);

          ctx.fillStyle = 'rgba(0, 245, 255, 0.7)';
          ctx.font = '7px "JetBrains Mono", monospace';
          ctx.fillText('PURGE DEBT', verifyX + yoloW / 2, btnY + 21);
        }

        // Sub-progress bar on bottom rim
        const progressFrac = isAllFilled ? 1.0 : filled.length / reqs.length;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(cardLeft, bounds.y + bounds.h - 8, bounds.w - 28, 3, 1.5);
        ctx.fill();

        ctx.fillStyle = isAllFilled ? '#34d399' : filled.length > 0 ? '#c084fc' : '#00f5ff';
        ctx.beginPath();
        ctx.roundRect(cardLeft, bounds.y + bounds.h - 8, (bounds.w - 28) * progressFrac, 3, 1.5);
        ctx.fill();

        // Locked penalty overlay
        if (isLocked) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(cardLeft + 10, bounds.y + 90, bounds.w - 48, 54, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚠ PENALTY LOCK (1s)', bounds.x + bounds.w / 2, bounds.y + 115);

          ctx.font = '10px Inter, sans-serif';
          ctx.fillText('Compilation mismatch bounce', bounds.x + bounds.w / 2, bounds.y + 132);
        }

        ctx.restore();
      });

      // =====================================================================
      // 4. FLOATING FEEDBACK BANNER (Interactive outcomes)
      // =====================================================================
      if (feedback && now - feedback.time < 3200) {
        const age = now - feedback.time;
        const opacity = age > 2400 ? (3200 - age) / 800 : 1.0;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = 'rgba(12, 16, 28, 0.92)';
        ctx.strokeStyle = feedback.color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = feedback.color;
        ctx.shadowBlur = 15;
        const feedbackY = activationBacklogMilliGu >= 1000 ? 600 : 635;
        ctx.beginPath();
        ctx.roundRect(240, feedbackY, 520, 40, 10);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = feedback.color;
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(feedback.text, 500, feedbackY + 16);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(feedback.subtext, 500, feedbackY + 31);
        ctx.restore();
      }

      // =====================================================================
      // 5. FLOATING PRICING HERO BANNER (When Activation Backlog is Ready)
      // =====================================================================
      if (activationBacklogMilliGu >= 1000) {
        const pulse = 1.0 + Math.sin(time / 180) * 0.03;
        ctx.save();
        ctx.translate(500, 645);
        ctx.scale(pulse, pulse);

        ctx.fillStyle = 'rgba(52, 211, 153, 0.2)';
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(-260, -22, 520, 44, 12);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `💰 ${Math.floor(activationBacklogMilliGu / 1000)} DEALS READY! OPEN PRICING (Press 3)`,
          0,
          0
        );
        ctx.restore();
      }

      // =====================================================================
      // 6. BOTTOM PIECE TRAY (FROSTED MILKINSIDE DOCK)
      // =====================================================================
      const trayY = 675;
      const trayH = 142;

      ctx.save();
      ctx.fillStyle = 'rgba(10, 14, 25, 0.88)';
      ctx.strokeStyle = selectedPiece ? '#fbbf24' : 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = selectedPiece ? 1.8 : 1;
      ctx.beginPath();
      ctx.roundRect(70, trayY, 860, trayH, 18);
      ctx.fill();
      ctx.stroke();

      // Tray Header Bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SPECIFICATION ARSENAL // AI PRIMITIVES', 95, trayY + 22);

      ctx.textAlign = 'right';
      if (selectedPiece) {
        ctx.fillStyle = '#fbbf24';
        const pDef = trayPieces.find((p) => p.type === selectedPiece);
        ctx.fillText(
          `ACTIVE: [${pDef?.shapeLabel || selectedPiece}] → TAP MATCHING POD`,
          905,
          trayY + 22
        );
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillText('SELECT SHAPE OR DRAG INTO POD [HOTKEYS: P, D, T, S]', 905, trayY + 22);
      }

      // Render 4 Shape Stations
      trayPieces.forEach((p) => {
        const isSel = selectedPiece === p.type;

        ctx.save();
        ctx.fillStyle = isSel ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)';
        ctx.strokeStyle = isSel ? p.color : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = isSel ? 2 : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (isSel) {
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = 20;
        }

        // Polygon Shape
        ctx.fillStyle = p.color;
        drawPiecePolygon(ctx, p.type, p.x, p.y, isSel ? 28 : 25);
        ctx.fill();

        ctx.strokeStyle = isSel ? '#ffffff' : 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = isSel ? 2.5 : 1.2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Center Glyph
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.glyph, p.x, p.y);

        // Keyboard Shortcut Pill at top right
        ctx.fillStyle = '#1e2333';
        ctx.strokeStyle = isSel ? p.color : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(p.x + 18, p.y - 36, 20, 16, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isSel ? p.color : 'rgba(255, 255, 255, 0.6)';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillText(p.shortcut, p.x + 28, p.y - 28);

        // Label below shape
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.fillText(p.label, p.x, p.y + 48);

        // Role description
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(p.role, p.x, p.y + 60);

        ctx.restore();
      });
      ctx.restore();

      // =====================================================================
      // 7. RENDER FLOATING DRAGGED PIECE FOLLOWING POINTER
      // =====================================================================
      if (draggedPiece) {
        const found = trayPieces.find((tp) => tp.type === draggedPiece);
        if (found) {
          ctx.save();
          ctx.shadowColor = found.glowColor;
          ctx.shadowBlur = 24;

          ctx.fillStyle = found.color;
          drawPiecePolygon(ctx, found.type, pointerPos.x, pointerPos.y, 34);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#000000';
          ctx.font = 'bold 14px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(found.glyph, pointerPos.x, pointerPos.y);

          // Trailing label pill
          ctx.fillStyle = '#121624';
          ctx.strokeStyle = found.color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(pointerPos.x - 45, pointerPos.y + 38, 90, 20, 5);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = found.color;
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillText(found.shapeLabel, pointerPos.x, pointerPos.y + 48);
          ctx.restore();
        }
      }

      // =====================================================================
      // 8. R&D CLOUD SPRINT ACCELERATOR (Convert Cash to Feature Velocity)
      // =====================================================================
      if (onBuySprint) {
        ctx.save();
        ctx.fillStyle = canAffordSprint ? 'rgba(10, 20, 36, 0.85)' : 'rgba(8, 10, 16, 0.7)';
        ctx.strokeStyle = canAffordSprint ? '#00f5ff' : 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = canAffordSprint ? 1.4 : 1;
        ctx.beginPath();
        ctx.roundRect(280, 826, 440, 44, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = canAffordSprint ? '#00f5ff' : 'rgba(255, 255, 255, 0.25)';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`⚡ CLOUD R&D BURST · ${formatMoney(sprintCostCents)}`, 500, 846);

        ctx.fillStyle = canAffordSprint ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.2)';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText('Auto-advance specifications across all active pods with compute', 500, 861);
        ctx.restore();
      }
    },
    [
      slots,
      slotBounds,
      selectedPiece,
      demandBacklogMilliGu,
      feedback,
      activationBacklogMilliGu,
      trayPieces,
      draggedPiece,
      pointerPos,
      agentTier,
      mismatchSlotId,
      onBuySprint,
      canAffordSprint,
      sprintCostCents,
    ]
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
