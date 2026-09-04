import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CanvasContainer } from '../CanvasContainer';
import type { RoomViewport } from '../viewport';
import type { MonetizationOpportunity, AgentTier } from '../../sim/types';
import { resolvePricingTap, type PricingZone } from '../../sim/rooms/monetization';
import { soundEngine } from '../../audio/soundEffects';
import { useV1Store } from '../../state/v1Store';
import { formatMoney } from '../../sim/math';
import confetti from 'canvas-confetti';

/**
 * Normalizes deterministic linear sweep for the strike needle across the entire track.
 * Period is 1.9 seconds (0.0 -> 1.0 -> 0.0)
 */
export const getNeedleSweepNormalized = (timeMs: number): number => {
  const cycle = (timeMs % 1900) / 1900;
  return cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
};

/**
 * Dynamic width for the moving pricing window.
 */
export const getDynamicBarWidthNormalized = (timeMs: number, baseFraction = 0.31): number => {
  const pulse = Math.sin((timeMs / 1850) * Math.PI * 2);
  return baseFraction * (1 + 0.16 * pulse);
};

/**
 * Continuous moving placement for the pricing bar center.
 */
export const getDynamicBarCenterNormalized = (
  timeMs: number,
  widthNorm: number,
  phaseSeed: number = 0
): number => {
  const halfW = widthNorm / 2;
  const minCenter = 0.06 + halfW;
  const maxCenter = 0.94 - halfW;
  const midCenter = 0.50;
  const maxAmplitude = (maxCenter - minCenter) / 2;

  const t = (timeMs / 3600) * Math.PI * 2 + phaseSeed;
  const wave = 0.82 * Math.sin(t) + 0.18 * Math.sin(t * 2.1 + 0.8);

  return midCenter + wave * maxAmplitude * 0.94;
};

export const getPhaseSeedFromId = (id?: string): number => {
  if (!id) return 0;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % 100) / 100) * Math.PI * 2;
};

interface ImpactShockwave {
  x: number;
  y: number;
  color: string;
  startTime: number;
  maxRadius: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  startTime: number;
  lifeMs: number;
}

interface FloatingTextParticle {
  text: string;
  color: string;
  x: number;
  y: number;
  startTime: number;
}

interface MonetizationRoomCanvasProps {
  opportunity: MonetizationOpportunity | null;
  agentTier: AgentTier;
  onTap: (zone: PricingZone, milliGu: number) => void;
  onSwitchToProduct?: () => void;
}

export const MonetizationRoomCanvas: React.FC<MonetizationRoomCanvasProps> = ({
  opportunity,
  agentTier,
  onTap,
  onSwitchToProduct,
}) => {
  const company = useV1Store((s) => s.company);
  const toggleRoomOverclock = useV1Store((s) => s.toggleRoomOverclock);
  const isOverclocked = company.overclockRooms?.monetization ?? false;
  const [feedback, setFeedback] = useState<{ zone: PricingZone; text: string; subtext: string; time: number } | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  // Shockwave & particle visual effects
  const shockwavesRef = useRef<ImpactShockwave[]>([]);
  const sparksRef = useRef<SparkParticle[]>([]);
  const floatingTextsRef = useRef<FloatingTextParticle[]>([]);

  // Growth Unit in dollars for real metric display
  const guCents = company.growthUnitCents;
  const perfectArrStr = `+${formatMoney((guCents * 1500n) / 1000n)} ARR`;
  const goodArrStr = `+${formatMoney(guCents)} ARR`;
  const cheapArrStr = `+${formatMoney((guCents * 500n) / 1000n)} ARR`;

  // Track Dimensions
  const trackX = 140;
  const trackY = 380;
  const trackW = 720;
  const trackH = 96;

  const performStrike = useCallback(() => {
    if (!opportunity) return;

    const now = performance.now();
    if (now - lastTapTimeRef.current < 250) return;
    lastTapTimeRef.current = now;

    const needleNorm = getNeedleSweepNormalized(now);
    const centerNorm = (opportunity.centerBps || 5000) / 10000;
    const widthNorm = (opportunity.widthBps || 3200) / 10000;

    const tappedOpp: MonetizationOpportunity = {
      ...opportunity,
      centerBps: Math.round(centerNorm * 10000),
      widthBps: Math.round(widthNorm * 10000),
      cursorPositionBps: Math.round(needleNorm * 10000),
    };

    const resolution = resolvePricingTap(tappedOpp);
    const strikeX = trackX + needleNorm * trackW;
    const strikeY = trackY + trackH / 2;

    const zoneColor =
      resolution.zone === 'PERFECT'
        ? '#fbbf24'
        : resolution.zone === 'GOOD'
        ? '#34d399'
        : resolution.zone === 'TOO_CHEAP'
        ? '#f59e0b'
        : '#f87171';

    // Spawn concentric impact shockwave
    shockwavesRef.current.push({
      x: strikeX,
      y: strikeY,
      color: zoneColor,
      startTime: now,
      maxRadius: resolution.zone === 'PERFECT' ? 140 : 90,
    });

    // Spawn floating ARR reward text
    const textArr =
      resolution.zone === 'PERFECT'
        ? perfectArrStr
        : resolution.zone === 'GOOD'
        ? goodArrStr
        : resolution.zone === 'TOO_CHEAP'
        ? cheapArrStr
        : '+$0 ARR';

    floatingTextsRef.current.push({
      text: textArr,
      color: zoneColor,
      x: strikeX,
      y: trackY - 20,
      startTime: now,
    });

    // Spawn spark particles for PERFECT bullseye
    if (resolution.zone === 'PERFECT') {
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const speed = 2.5 + Math.random() * 5.0;
        sparksRef.current.push({
          x: strikeX,
          y: strikeY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() > 0.3 ? '#fbbf24' : '#ffffff',
          size: 2.5 + Math.random() * 2.5,
          startTime: now,
          lifeMs: 550 + Math.random() * 350,
        });
      }
    }

    if (resolution.zone === 'PERFECT') {
      soundEngine.playCelebration();
      soundEngine.playCash();
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.55 },
          colors: ['#fbbf24', '#34d399', '#ffffff'],
        });
      } catch {
        // Safe fallback
      }
      setFeedback({
        zone: 'PERFECT',
        text: `★ HARMONIC LOCK: ${perfectArrStr}`,
        subtext: 'Optimal strike inside moving sweet spot · Maximum retention stability',
        time: Date.now(),
      });
    } else if (resolution.zone === 'GOOD') {
      soundEngine.playCash();
      setFeedback({
        zone: 'GOOD',
        text: `✓ CONTRACT CAPTURED: ${goodArrStr}`,
        subtext: 'Solid ARR locked to annual recurring revenue',
        time: Date.now(),
      });
    } else if (resolution.zone === 'TOO_CHEAP') {
      soundEngine.playCash();
      setFeedback({
        zone: 'TOO_CHEAP',
        text: `⚠ DISCOUNTED CONTRACT: ${cheapArrStr}`,
        subtext: 'Discount accepted below customer willingness to pay',
        time: Date.now(),
      });
    } else {
      soundEngine.playAlarm();
      setFeedback({
        zone: 'TOO_EXPENSIVE',
        text: '✕ DEAL LOST: $0 ARR',
        subtext: 'Strike exceeded buyer budget limit · Opportunity expired',
        time: Date.now(),
      });
    }

    onTap(resolution.zone, resolution.newCustomerArrMilliGu);
  }, [opportunity, onTap, trackX, trackW, trackY, trackH, perfectArrStr, goodArrStr, cheapArrStr]);

  // Pointer Tap Handler
  const handlePointerDown = useCallback(
    (coords: { x: number; y: number }) => {
      // Check YOLO Overclock Switch click (x: 630..850, y: 825..870)
      if (coords.x >= 630 && coords.x <= 850 && coords.y >= 825 && coords.y <= 870) {
        toggleRoomOverclock('monetization');
        soundEngine.playClick();
        return;
      }

      // If empty state, check if clicked the CTA button to switch to product room
      if (!opportunity) {
        if (onSwitchToProduct && coords.x >= 280 && coords.x <= 720 && coords.y >= 610 && coords.y <= 690) {
          soundEngine.playClick();
          onSwitchToProduct();
        }
        return;
      }

      performStrike();
    },
    [opportunity, onSwitchToProduct, performStrike, toggleRoomOverclock]
  );

  // Keyboard Hotkey Handler: Spacebar or Enter to strike, 'O' to toggle Overclock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        performStrike();
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        toggleRoomOverclock('monetization');
        soundEngine.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performStrike, toggleRoomOverclock]);

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, _viewport: RoomViewport, time: number) => {
      // =====================================================================
      // 1. MILKINSIDE OBSIDIAN SPACE & FLUID HARMONIC FILAMENTS
      // =====================================================================
      ctx.fillStyle = '#030307';
      ctx.fillRect(0, 0, 1000, 1000);

      // Core radial ambient aura
      const radGrad = ctx.createRadialGradient(500, 360, 20, 500, 360, 480);
      radGrad.addColorStop(0, isOverclocked ? 'rgba(245, 158, 11, 0.08)' : 'rgba(6, 182, 212, 0.08)');
      radGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.04)');
      radGrad.addColorStop(1, 'rgba(3, 3, 7, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 1000, 1000);

      // Header System Status
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('MODULE 03 // HARMONIC RESONANCE DECK', 140, 80);

      ctx.textAlign = 'right';
      ctx.fillStyle = opportunity ? '#34d399' : 'rgba(255, 255, 255, 0.3)';
      ctx.fillText(opportunity ? 'CONTRACT IN SWEET SPOT' : 'PIPELINE CLEAR', 860, 80);

      // Section Title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 22px Inter, -apple-system, sans-serif';
      ctx.fillText('Customer Pricing Frequency', 500, 126);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '400 12px Inter, -apple-system, sans-serif';
      ctx.fillText('Calibrated Target Window · Strike needle in gold core to maximize recurring ARR', 500, 148);

      // =====================================================================
      // 2. MULTI-HARMONIC IRIDESCENT FLUID RESONANCE CHAMBER
      // =====================================================================
      ctx.save();
      const waveBoxX = 140;
      const waveBoxY = 168;
      const waveBoxW = 720;
      const waveBoxH = 114;

      ctx.fillStyle = 'rgba(10, 14, 26, 0.75)';
      ctx.strokeStyle = isOverclocked ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 245, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(waveBoxX, waveBoxY, waveBoxW, waveBoxH, 14);
      ctx.fill();
      ctx.stroke();

      // Draw 3 fluid harmonic wave filaments (Cyan, Violet, Gold)
      const filaments = [
        {
          color: isOverclocked ? 'rgba(245, 158, 11, 0.85)' : 'rgba(0, 245, 255, 0.85)',
          freq: 0.012,
          speedMult: 1.0,
          amp: isOverclocked ? 24 : 16,
          offsetY: waveBoxY + waveBoxH / 2,
        },
        {
          color: 'rgba(192, 132, 252, 0.65)',
          freq: 0.018,
          speedMult: -0.7,
          amp: isOverclocked ? 18 : 12,
          offsetY: waveBoxY + waveBoxH / 2,
        },
        {
          color: 'rgba(251, 191, 36, 0.55)',
          freq: 0.008,
          speedMult: 1.4,
          amp: isOverclocked ? 14 : 9,
          offsetY: waveBoxY + waveBoxH / 2,
        },
      ];

      filaments.forEach((fil) => {
        ctx.strokeStyle = fil.color;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = fil.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        const t = (time / 1000) * (isOverclocked ? 4.5 : 2.0) * fil.speedMult;
        for (let x = waveBoxX; x <= waveBoxX + waveBoxW; x += 3) {
          const y = fil.offsetY + Math.sin(x * fil.freq + t) * fil.amp + Math.cos(x * fil.freq * 2.2 - t * 0.8) * (fil.amp * 0.4);
          if (x === waveBoxX) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Calibration labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '500 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(isOverclocked ? 'HARMONIC: 2X OVERCLOCK · HIGH FLUX' : 'HARMONIC: RESONANCE SYNCED · 100% PHASE', waveBoxX + 14, waveBoxY + 18);
      ctx.textAlign = 'right';
      ctx.fillText(isOverclocked ? 'TRIG: YOLO-STRIKE' : 'TRIG: INTERNAL [NORM]', waveBoxX + waveBoxW - 14, waveBoxY + 18);
      ctx.restore();

      // =====================================================================
      // 3. TARGET PRICING CAPSULE TRACK
      // =====================================================================
      // Outer Frosted Frame
      ctx.fillStyle = 'rgba(10, 14, 25, 0.9)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(trackX - 12, trackY - 12, trackW + 24, trackH + 24, 16);
      ctx.fill();
      ctx.stroke();

      // Track Bed Interior
      ctx.fillStyle = '#060810';
      ctx.beginPath();
      ctx.roundRect(trackX, trackY, trackW, trackH, 10);
      ctx.fill();

      // Ticks (Top & Bottom)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i <= 20; i++) {
        const tickX = trackX + (i / 20) * trackW;
        const isMajor = i % 5 === 0;
        const tickH = isMajor ? 8 : 4;
        ctx.fillRect(tickX - 0.5, trackY - 16 - tickH, 1, tickH);
        ctx.fillRect(tickX - 0.5, trackY + trackH + 16, 1, tickH);

        if (isMajor) {
          ctx.font = '500 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          const label = i === 0 ? '$0' : i === 10 ? 'MEDIAN' : i === 20 ? 'CEILING' : `${i * 5}%`;
          ctx.fillText(label, tickX, trackY - 26);
        }
      }

      if (opportunity) {
        const needleNorm = getNeedleSweepNormalized(time);
        const centerNorm = (opportunity.centerBps || 5000) / 10000;
        const widthNorm = (opportunity.widthBps || 3200) / 10000;

        const barWPx = widthNorm * trackW;
        const barCenterPx = trackX + centerNorm * trackW;
        const barStartPx = barCenterPx - barWPx / 2;
        const barEndPx = barCenterPx + barWPx / 2;
        const needleX = trackX + needleNorm * trackW;

        const relPos = (needleX - barStartPx) / barWPx;
        const isNeedleInsideBar = needleX >= barStartPx && needleX <= barEndPx;

        let currentLockZone: PricingZone | 'OUT_CHEAP' | 'OUT_EXPENSIVE';
        if (needleX < barStartPx) currentLockZone = 'OUT_CHEAP';
        else if (needleX > barEndPx) currentLockZone = 'OUT_EXPENSIVE';
        else if (relPos < 0.20) currentLockZone = 'TOO_CHEAP';
        else if (relPos < 0.45) currentLockZone = 'GOOD';
        else if (relPos <= 0.55) currentLockZone = 'PERFECT';
        else if (relPos <= 0.80) currentLockZone = 'GOOD';
        else currentLockZone = 'TOO_EXPENSIVE';

        // Sweet Spot Ambient Glow
        const capsuleGlow = ctx.createRadialGradient(
          barCenterPx,
          trackY + trackH / 2,
          barWPx * 0.2,
          barCenterPx,
          trackY + trackH / 2,
          barWPx * 0.75
        );
        capsuleGlow.addColorStop(0, currentLockZone === 'PERFECT' ? 'rgba(251, 191, 36, 0.25)' : isNeedleInsideBar ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.04)');
        capsuleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = capsuleGlow;
        ctx.fillRect(barStartPx - 40, trackY - 15, barWPx + 80, trackH + 30);

        // Moving Pricing Bar Capsule Container
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(barStartPx, trackY + 2, barWPx, trackH - 4, 10);
        ctx.clip();

        const segments = [
          {
            shortLabel: 'DISC',
            fullLabel: 'DISCOUNT',
            sub: cheapArrStr,
            w: barWPx * 0.20,
            bg: 'rgba(245, 158, 11, 0.18)',
            border: 'rgba(245, 158, 11, 0.4)',
            textColor: '#f59e0b',
          },
          {
            shortLabel: 'TARGET',
            fullLabel: 'TARGET',
            sub: goodArrStr,
            w: barWPx * 0.25,
            bg: 'rgba(52, 211, 153, 0.18)',
            border: 'rgba(52, 211, 153, 0.45)',
            textColor: '#34d399',
          },
          {
            shortLabel: '★',
            fullLabel: 'PREMIUM',
            sub: perfectArrStr,
            w: barWPx * 0.10,
            bg: 'rgba(251, 191, 36, 0.35)',
            border: 'rgba(251, 191, 36, 0.95)',
            textColor: '#fbbf24',
          },
          {
            shortLabel: 'TARGET',
            fullLabel: 'TARGET',
            sub: goodArrStr,
            w: barWPx * 0.25,
            bg: 'rgba(52, 211, 153, 0.18)',
            border: 'rgba(52, 211, 153, 0.45)',
            textColor: '#34d399',
          },
          {
            shortLabel: 'OVER',
            fullLabel: 'OVERPRICED',
            sub: '$0 ARR',
            w: barWPx * 0.20,
            bg: 'rgba(239, 68, 68, 0.18)',
            border: 'rgba(239, 68, 68, 0.4)',
            textColor: '#f87171',
          },
        ];

        let segX = barStartPx;
        segments.forEach((seg, idx) => {
          ctx.fillStyle = seg.bg;
          ctx.fillRect(segX, trackY + 2, seg.w, trackH - 4);

          ctx.strokeStyle = seg.border;
          ctx.lineWidth = idx === 2 ? 1.5 : 1;
          ctx.strokeRect(segX, trackY + 2, seg.w, trackH - 4);

          if (idx === 2) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = '700 13px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('★', segX + seg.w / 2, trackY + 24);

            ctx.font = '700 9px "JetBrains Mono", monospace';
            ctx.fillText('MAX', segX + seg.w / 2, trackY + trackH - 14);
          } else {
            ctx.fillStyle = seg.textColor;
            ctx.textAlign = 'center';
            ctx.font = '700 10px "JetBrains Mono", monospace';
            ctx.fillText(seg.shortLabel, segX + seg.w / 2, trackY + trackH / 2 - 2);

            ctx.font = '500 8px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(seg.sub, segX + seg.w / 2, trackY + trackH / 2 + 12);
          }
          segX += seg.w;
        });

        ctx.restore();

        // Lock-On Telemetry Badge (Above the track)
        const badgeW = 440;
        const badgeH = 32;
        const badgeX = 500 - badgeW / 2;
        const badgeY = trackY - 48;

        const lockBorder =
          currentLockZone === 'PERFECT'
            ? '#fbbf24'
            : currentLockZone === 'GOOD'
            ? '#34d399'
            : currentLockZone === 'TOO_CHEAP' || currentLockZone === 'OUT_CHEAP'
            ? '#f59e0b'
            : '#f87171';

        ctx.fillStyle = 'rgba(10, 14, 26, 0.9)';
        ctx.strokeStyle = lockBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = lockBorder;
        ctx.beginPath();
        ctx.arc(badgeX + 22, badgeY + badgeH / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.textAlign = 'center';
        if (currentLockZone === 'PERFECT') {
          ctx.fillStyle = '#fbbf24';
          ctx.font = '700 11px "JetBrains Mono", monospace';
          ctx.fillText(`★ LOCK-ON: PREMIUM SWEET SPOT · ${perfectArrStr}`, 500 + 8, badgeY + 20);
        } else if (currentLockZone === 'GOOD') {
          ctx.fillStyle = '#34d399';
          ctx.font = '700 11px "JetBrains Mono", monospace';
          ctx.fillText(`✓ LOCK-ON: TARGET ARR ZONE · ${goodArrStr}`, 500 + 8, badgeY + 20);
        } else if (currentLockZone === 'TOO_CHEAP' || currentLockZone === 'OUT_CHEAP') {
          ctx.fillStyle = '#f59e0b';
          ctx.font = '600 11px "JetBrains Mono", monospace';
          ctx.fillText(`⚠ DISCOUNT RANGE · ${cheapArrStr}`, 500 + 8, badgeY + 20);
        } else {
          ctx.fillStyle = '#f87171';
          ctx.font = '600 11px "JetBrains Mono", monospace';
          ctx.fillText('✕ MISALIGNED: OVERPRICED CEILING · $0 ARR', 500 + 8, badgeY + 20);
        }

        // Sweeping Strike Needle (Focused Chromatic Beam)
        const needleColor =
          currentLockZone === 'PERFECT'
            ? '#fbbf24'
            : currentLockZone === 'GOOD'
            ? '#34d399'
            : currentLockZone === 'TOO_CHEAP'
            ? '#f59e0b'
            : currentLockZone === 'TOO_EXPENSIVE'
            ? '#f87171'
            : '#ffffff';

        ctx.strokeStyle = needleColor;
        ctx.lineWidth = currentLockZone === 'PERFECT' ? 3.5 : 2.5;
        ctx.shadowColor = needleColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(needleX, trackY - 18);
        ctx.lineTo(needleX, trackY + trackH + 18);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Central Target Reticle Ring
        ctx.strokeStyle = needleColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(needleX, trackY + trackH / 2, 8, 0, Math.PI * 2);
        ctx.stroke();

        // Tap / Space Prompt
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[ CLICK CANVAS OR PRESS SPACE TO STRIKE ]', 500, 580);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '400 12px Inter, sans-serif';
        ctx.fillText('Strike within calibrated window · Instant contract lock at needle position', 500, 606);
      } else {
        // Empty State: clear guidance to Product room
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 15px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('All inbound demand is priced. Pipeline clear.', 500, 550);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '400 12px Inter, sans-serif';
        ctx.fillText('Ship features in the Product room to unlock new customer contracts.', 500, 576);

        // Tactile CTA button
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(320, 610, 360, 48, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillText('→ GO TO PRODUCT STUDIO [KEY 2]', 500, 639);
      }

      // Render Expanding Shockwaves
      const now = performance.now();
      shockwavesRef.current = shockwavesRef.current.filter((sw) => {
        const age = now - sw.startTime;
        const progress = age / 450;
        if (progress >= 1) return false;

        const currentRadius = 8 + progress * (sw.maxRadius - 8);
        const alpha = Math.max(0, 1 - progress);

        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 2.5 * (1 - progress * 0.5);
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        return true;
      });

      // Render Spark Particles
      sparksRef.current = sparksRef.current.filter((spark) => {
        const age = now - spark.startTime;
        if (age >= spark.lifeMs) return false;

        const progress = age / spark.lifeMs;
        const currentX = spark.x + spark.vx * (age * 0.05);
        const currentY = spark.y + spark.vy * (age * 0.05);
        const alpha = Math.max(0, 1 - progress);

        ctx.save();
        ctx.fillStyle = spark.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(currentX, currentY, spark.size * (1 - progress * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return true;
      });

      // Render Floating Text Particles
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
        const age = now - ft.startTime;
        if (age >= 1100) return false;

        const progress = age / 1100;
        const currentY = ft.y - progress * 40;
        const alpha = Math.max(0, 1 - progress);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.font = '700 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, currentY);
        ctx.restore();

        return true;
      });

      // Tactile Feedback Stamp (when deal signed)
      if (feedback && Date.now() - feedback.time < 3500) {
        const age = Date.now() - feedback.time;
        const opacity = Math.max(0, 1 - age / 3500);

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.textAlign = 'center';

        ctx.fillStyle = 'rgba(10, 14, 26, 0.94)';
        ctx.strokeStyle =
          feedback.zone === 'PERFECT'
            ? '#fbbf24'
            : feedback.zone === 'GOOD'
            ? '#34d399'
            : feedback.zone === 'TOO_CHEAP'
            ? '#f59e0b'
            : '#f87171';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(240, 230, 520, 76, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle =
          feedback.zone === 'PERFECT'
            ? '#fbbf24'
            : feedback.zone === 'GOOD'
            ? '#34d399'
            : feedback.zone === 'TOO_CHEAP'
            ? '#f59e0b'
            : '#f87171';
        ctx.font = '700 16px "JetBrains Mono", monospace';
        ctx.fillText(feedback.text, 500, 262);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '400 11px Inter, sans-serif';
        ctx.fillText(feedback.subtext, 500, 286);

        ctx.restore();
      }

      // Autonomous Agent & YOLO Hardware Control Deck
      const deckY = 820;
      ctx.fillStyle = isOverclocked ? 'rgba(245, 158, 11, 0.08)' : 'rgba(10, 14, 25, 0.85)';
      ctx.strokeStyle = isOverclocked ? 'rgba(245, 158, 11, 0.35)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(140, deckY, 720, 50, 12);
      ctx.fill();
      ctx.stroke();

      if (agentTier > 0) {
        ctx.fillStyle = isOverclocked ? '#f59e0b' : '#34d399';
        ctx.beginPath();
        ctx.arc(165, deckY + 25, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SALES AGENT TIER ${agentTier} // ${isOverclocked ? '2X YOLO VELOCITY' : 'AUTONOMOUS'}`, 180, deckY + 21);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '400 10px Inter, sans-serif';
        ctx.fillText('Auto-closing pricing windows · Continuous recurring ARR capture', 180, deckY + 36);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(165, deckY + 25, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('MANUAL FOUNDER PRICING MODE', 180, deckY + 21);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '400 10px Inter, sans-serif';
        ctx.fillText('Upgrade Autopilot in Holding Co. [H] to deploy autonomous sales swarms', 180, deckY + 36);
      }

      // YOLO Overclock Rocker Switch
      const swX = 635;
      const swY = deckY + 9;
      const swW = 210;
      const swH = 32;

      ctx.fillStyle = isOverclocked ? 'rgba(245, 158, 11, 0.22)' : 'rgba(255, 255, 255, 0.04)';
      ctx.strokeStyle = isOverclocked ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = isOverclocked ? 1.4 : 1;
      ctx.beginPath();
      ctx.roundRect(swX, swY, swW, swH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isOverclocked ? '#f59e0b' : 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(swX + 16, swY + swH / 2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isOverclocked ? '#fbbf24' : 'rgba(255, 255, 255, 0.7)';
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(isOverclocked ? '⚡ OVERCLOCK: 2X SPEED' : '⚡ OVERCLOCK: OFF [O]', swX + 28, swY + 20);
    },
    [opportunity, feedback, agentTier, isOverclocked, cheapArrStr, goodArrStr, perfectArrStr, trackX, trackW, trackY, trackH]
  );

  return <CanvasContainer onRender={render} onPointerDown={handlePointerDown} />;
};
