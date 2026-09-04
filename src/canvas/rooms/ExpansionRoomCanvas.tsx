import React, { useState, useCallback } from 'react';
import { CanvasContainer } from '../CanvasContainer';
import type { RoomViewport } from '../viewport';
import type { ExpansionAccount, ExpansionModule, AgentTier } from '../../sim/types';
import {
  SAMPLE_EXPANSION_MODULES,
  analyzeExpansionFit,
  resolveExpansionPack,
} from '../../sim/rooms/expansion';
import { formatMoney } from '../../sim/math';
import { soundEngine } from '../../audio/soundEffects';

interface ExpansionRoomCanvasProps {
  account: ExpansionAccount | null;
  growthUnitCents?: bigint;
  queueCount?: number;
  agentTier: AgentTier;
  onPackComplete: (fitScore: number, expansionArrMilliGu: number, churnThreatMilliGu: number) => void;
}

export const ExpansionRoomCanvas: React.FC<ExpansionRoomCanvasProps> = ({
  account,
  growthUnitCents = 2500000n,
  queueCount = 1,
  agentTier,
  onPackComplete,
}) => {
  const [placedModules, setPlacedModules] = useState<ExpansionModule[]>([]);
  const [draggedModule, setDraggedModule] = useState<ExpansionModule | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOriginRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedModRef = React.useRef<ExpansionModule | null>(null);

  const GRID_SIZE = 4;
  const CELL_SIZE = 92;
  const GRID_START_X = 130;
  const GRID_START_Y = 300;

  const analysis = account ? analyzeExpansionFit(account, placedModules) : null;
  const packResolution = account ? resolveExpansionPack(account, placedModules) : null;

  const handlePointerDown = useCallback(
    (coords: { x: number; y: number }) => {
      // 1. Check Submit Button
      if (
        coords.x >= 130 &&
        coords.x <= 510 &&
        coords.y >= 700 &&
        coords.y <= 770 &&
        account &&
        placedModules.length > 0
      ) {
        soundEngine.playDeploy();
        const res = resolveExpansionPack(account, placedModules);
        if (res.fitScore >= 3) {
          soundEngine.playCash();
          soundEngine.playCelebration();
        }
        onPackComplete(res.fitScore, res.expansionArrMilliGu, res.churnThreatMilliGu);
        setPlacedModules([]);
        return;
      }

      // 2. Check if clicked a placed module on the grid to REMOVE it
      for (let i = placedModules.length - 1; i >= 0; i--) {
        const modX = GRID_START_X + 16 + (i % 2) * 176;
        const modY = GRID_START_Y + 16 + Math.floor(i / 2) * 176;
        if (coords.x >= modX && coords.x <= modX + 160 && coords.y >= modY && coords.y <= modY + 160) {
          soundEngine.playClick();
          setPlacedModules((prev) => prev.filter((_, idx) => idx !== i));
          return;
        }
      }

      // 3. Check module catalog on the right
      SAMPLE_EXPANSION_MODULES.forEach((mod, i) => {
        const trayY = 220 + i * 88;
        if (
          coords.x >= 560 &&
          coords.x <= 910 &&
          coords.y >= trayY &&
          coords.y <= trayY + 74
        ) {
          soundEngine.playClick();
          draggedModRef.current = mod;
          dragOriginRef.current = coords;
          setDraggedModule(mod);
          setPointerPos(coords);
        }
      });
    },
    [account, placedModules, onPackComplete]
  );

  const handlePointerMove = useCallback(
    (coords: { x: number; y: number }) => {
      if (draggedModRef.current) {
        setPointerPos(coords);
      }
    },
    []
  );

  const handlePointerUp = useCallback(
    (coords: { x: number; y: number }) => {
      const mod = draggedModRef.current;
      if (!mod) return;

      const gridEndX = GRID_START_X + GRID_SIZE * CELL_SIZE;
      const gridEndY = GRID_START_Y + GRID_SIZE * CELL_SIZE;

      const droppedInGrid =
        coords.x >= GRID_START_X &&
        coords.x <= gridEndX &&
        coords.y >= GRID_START_Y &&
        coords.y <= gridEndY;

      const dist = Math.hypot(coords.x - dragOriginRef.current.x, coords.y - dragOriginRef.current.y);
      const isClick = dist < 45;

      if (droppedInGrid || isClick) {
        setPlacedModules((prev) => {
          if (prev.length < 4) {
            soundEngine.playClick();
            return [...prev, mod];
          }
          return prev;
        });
      }

      draggedModRef.current = null;
      setDraggedModule(null);
    },
    []
  );

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, _viewport: RoomViewport, _time: number) => {
      // Header Instruction
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SYS.EXPANSION // UPSELL & RETENTION EXPANSION PACKER', 130, 52);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 24px "Inter", sans-serif';
      ctx.fillText('Account Expansion Protocol', 130, 84);

      // Pipeline status indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`PIPELINE: ${Math.max(1, queueCount)} ACCOUNTS IN QUEUE`, 910, 84);

      if (account) {
        // Account Specs Banner
        ctx.fillStyle = '#111114';
        ctx.strokeStyle = '#222226';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(130, 104, 780, 84, 8);
        ctx.fill();
        ctx.stroke();

        // Account Name & Archetype Badge
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 17px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(account.name, 150, 134);

        // Archetype Badge Pill
        const tierBadge = account.tierBadge || 'ENTERPRISE';
        const tierColor = account.tierColor || '#0a84ff';
        const multLabel = account.archetypeMultiplier ? `${account.archetypeMultiplier.toFixed(1)}x VALUE` : '1.8x VALUE';

        ctx.fillStyle = `${tierColor}20`;
        ctx.strokeStyle = tierColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(150, 146, 200, 26, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = tierColor;
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.fillText(`[${tierBadge} • ${multLabel}]`, 158, 163);

        // Account Tags
        ctx.fillStyle = '#30d158';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(`+ NEED: ${account.requiredTags.join(', ').toUpperCase()}`, 380, 134);

        ctx.fillStyle = '#0a84ff';
        ctx.fillText(`~ FIT: ${account.compatibleTags.join(', ').toUpperCase()}`, 380, 163);

        ctx.fillStyle = '#ff453a';
        ctx.fillText(`! CONFLICT: ${account.conflictingTags.join(', ').toUpperCase()}`, 640, 134);

        // -------------------------------------------------------------
        // COMBINATION & SYNERGY HUD BANNER (between Banner & Grid)
        // -------------------------------------------------------------
        const comboBannerY = 202;
        ctx.fillStyle = '#0c0c0f';
        ctx.strokeStyle = '#1d1d24';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(130, comboBannerY, 368, 86, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';

        if (analysis && analysis.activeSynergies.length > 0) {
          analysis.activeSynergies.slice(0, 2).forEach((syn, sIdx) => {
            const syY = comboBannerY + 22 + sIdx * 18;
            ctx.fillStyle = '#ffd60a';
            ctx.fillText(`⚡ SYNERGY: ${syn.name} (+${syn.fitBonus} Fit, +${syn.arrMultiplierBonusBps / 100}% ARR)`, 145, syY);
          });
          if (analysis.activeSynergies.length > 2) {
            ctx.fillStyle = '#ff9f0a';
            ctx.fillText(`+ ${analysis.activeSynergies.length - 2} more synergy combos active!`, 145, comboBannerY + 58);
          }
        } else if (analysis && analysis.isFullCoverage) {
          ctx.fillStyle = '#30d158';
          ctx.fillText('🌟 TOTAL SOLUTION MASTERY (+3 Fit, +50% ARR)', 145, comboBannerY + 28);
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillText('⚡ COMBO HINT: Pair complementary modules', 145, comboBannerY + 24);
          ctx.fillText('   e.g. SSO + Audit Logs or Analytics + Webhooks', 145, comboBannerY + 44);
        }

        if (analysis && analysis.hasDiminishingReturns) {
          ctx.fillStyle = '#ff9f0a';
          ctx.fillText('⚠️ Notice: Duplicate modules suffer diminishing returns', 145, comboBannerY + 74);
        } else if (analysis && analysis.isFullCoverage && analysis.activeSynergies.length <= 2) {
          ctx.fillStyle = '#30d158';
          ctx.fillText('✓ Full need & fit coverage achieved (+50% ARR)', 145, comboBannerY + 74);
        }

        // 4x4 Grid Board
        ctx.fillStyle = '#0c0c0e';
        ctx.strokeStyle = '#1e1e24';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(GRID_START_X, GRID_START_Y, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE, 8);
        ctx.fill();
        ctx.stroke();

        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const cellX = GRID_START_X + c * CELL_SIZE;
            const cellY = GRID_START_Y + r * CELL_SIZE;

            ctx.strokeStyle = '#16161a';
            ctx.lineWidth = 1;
            ctx.strokeRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
          }
        }

        // Track module counts for duplicate indicators
        const placedCountMap = new Map<string, number>();

        // Render Placed Modules
        placedModules.forEach((mod, i) => {
          const count = (placedCountMap.get(mod.id) || 0) + 1;
          placedCountMap.set(mod.id, count);

          const modX = GRID_START_X + 16 + (i % 2) * 176;
          const modY = GRID_START_Y + 16 + Math.floor(i / 2) * 176;

          const isConflicted =
            mod.tags.some((t) => account.conflictingTags.includes(t)) ||
            mod.conflicts.some((c) => account.requiredTags.includes(c) || account.compatibleTags.includes(c));

          const isNeedMatch = mod.tags.some((t) => account.requiredTags.includes(t));
          const isFitMatch = mod.tags.some((t) => account.compatibleTags.includes(t));

          let borderColor = '#30d158';
          let bgColor = '#142018';
          if (isConflicted) {
            borderColor = '#ff453a';
            bgColor = '#2c1517';
          } else if (count > 1) {
            borderColor = '#ff9f0a';
            bgColor = '#261b10';
          } else if (isNeedMatch) {
            borderColor = '#30d158';
            bgColor = '#142018';
          } else if (isFitMatch) {
            borderColor = '#0a84ff';
            bgColor = '#101d2a';
          }

          ctx.fillStyle = bgColor;
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(modX, modY, 160, 160, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = borderColor;
          ctx.font = '700 13px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(mod.name.toUpperCase(), modX + 80, modY + 50);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = '11px "JetBrains Mono", monospace';
          ctx.fillText(`[${mod.tags.join(', ')}]`, modX + 80, modY + 74);

          // Duplicate penalty indicator
          if (count === 2) {
            ctx.fillStyle = '#ff9f0a';
            ctx.font = '600 10px "JetBrains Mono", monospace';
            ctx.fillText('2ND COPY (-50% VALUE)', modX + 80, modY + 98);
          } else if (count >= 3) {
            ctx.fillStyle = '#ff453a';
            ctx.font = '600 10px "JetBrains Mono", monospace';
            ctx.fillText(`${count}TH COPY (SATURATED 0%)`, modX + 80, modY + 98);
          }

          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText('(Click to remove)', modX + 80, modY + 128);
        });

        // -------------------------------------------------------------
        // SUBMIT BUTTON WITH REAL DYNAMIC ARR PREVIEW & SCALING
        // -------------------------------------------------------------
        const currentFit = analysis?.totalFitScore ?? 0;
        let arrYieldLabel = '+ $0 ARR';
        let buttonColor = '#ffffff';
        let buttonBg = '#141416';
        let buttonBorder = '#2a2a30';

        if (packResolution && placedModules.length > 0) {
          const expansionArrCents = (growthUnitCents * BigInt(packResolution.expansionArrMilliGu)) / 1000n;
          const formattedArr = formatMoney(expansionArrCents);

          if (currentFit >= 9) {
            arrYieldLabel = `+ ${formattedArr} ARR · MASTERCLASS COMBO`;
            buttonColor = '#ffd60a';
            buttonBorder = '#ffd60a';
            buttonBg = '#272008';
          } else if (currentFit >= 7) {
            arrYieldLabel = `+ ${formattedArr} ARR · EXCEPTIONAL EXPANSION`;
            buttonColor = '#ffd60a';
            buttonBorder = '#ffd60a';
            buttonBg = '#221e10';
          } else if (currentFit >= 5) {
            arrYieldLabel = `+ ${formattedArr} ARR · STRONG COMBO`;
            buttonColor = '#30d158';
            buttonBorder = '#30d158';
            buttonBg = '#112216';
          } else if (currentFit >= 3) {
            arrYieldLabel = `+ ${formattedArr} ARR · STANDARD PACK`;
            buttonColor = '#0a84ff';
            buttonBorder = '#0a84ff';
            buttonBg = '#101d2a';
          } else if (currentFit >= 1) {
            arrYieldLabel = `+ ${formattedArr} ARR · MINOR UPSELL`;
            buttonColor = '#64d2ff';
            buttonBorder = '#64d2ff';
            buttonBg = '#101924';
          } else {
            const churnPenalty = formatMoney((growthUnitCents * 250n) / 1000n);
            arrYieldLabel = `RISK: +${churnPenalty} CHURN THREAT (CONFLICT)`;
            buttonColor = '#ff453a';
            buttonBorder = '#ff453a';
            buttonBg = '#2a1114';
          }
        }

        ctx.fillStyle = buttonBg;
        ctx.strokeStyle = buttonBorder;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(GRID_START_X, 700, 368, 70, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = buttonColor;
        ctx.font = '700 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';

        const submitTitle =
          placedModules.length === 0
            ? 'SLOT MODULES TO COMPOSE PACK'
            : `SUBMIT EXPANSION PACK [FIT: ${currentFit}${packResolution?.isExceptional ? ' · STAR' : ''}]`;

        ctx.fillText(submitTitle, GRID_START_X + 184, 730);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(arrYieldLabel, GRID_START_X + 184, 752);

        // Catalog Header
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('MODULE CATALOG (CLICK OR DRAG TO SLOT)', 560, 204);

        SAMPLE_EXPANSION_MODULES.forEach((mod, i) => {
          const trayY = 220 + i * 88;

          ctx.fillStyle = '#111114';
          ctx.strokeStyle = '#222226';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(560, trayY, 350, 74, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = '600 14px "Inter", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(mod.name, 580, trayY + 30);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '11px "JetBrains Mono", monospace';
          ctx.fillText(`Tags: ${mod.tags.join(', ')}`, 580, trayY + 54);
        });

        // Dragged Ghost
        if (draggedModule) {
          ctx.save();
          ctx.fillStyle = '#30d158';
          ctx.beginPath();
          ctx.roundRect(pointerPos.x - 70, pointerPos.y - 35, 140, 70, 6);
          ctx.fill();

          ctx.fillStyle = '#000000';
          ctx.font = '700 13px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(draggedModule.name, pointerPos.x, pointerPos.y + 5);
          ctx.restore();
        }
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '15px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SCANNING ACCOUNT COHORTS FOR UPSELL OPPORTUNITIES...', 500, 500);
      }

      // Automated Agent Badge
      if (agentTier > 0) {
        ctx.fillStyle = '#111114';
        ctx.strokeStyle = '#30d158';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(680, 840, 230, 44, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#30d158';
        ctx.beginPath();
        ctx.arc(702, 862, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`AGENT TIER ${agentTier} AUTO-UPSELLING`, 718, 866);
      }
    },
    [account, placedModules, draggedModule, pointerPos, analysis, packResolution, agentTier, growthUnitCents, queueCount]
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


