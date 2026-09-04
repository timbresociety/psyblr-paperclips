import React, { useRef, useState, useCallback } from 'react';
import { CanvasContainer } from '../CanvasContainer';
import type { RoomViewport } from '../viewport';
import type { MarketingCard, AgentTier } from '../../sim/types';
import { soundEngine } from '../../audio/soundEffects';
import { formatMoney } from '../../sim/math';

interface MarketingRoomCanvasProps {
  card: MarketingCard | null;
  comboCount: number;
  agentTier: AgentTier;
  hasTrendRadar: boolean;
  demandBacklogMilliGu: number;
  cashCents?: bigint;
  capitalUnitCents?: bigint;
  onBuyCampaign?: (tier: 'blitz' | 'surge' | 'outbound') => void;
  onSwipe: (action: 'LEFT' | 'RIGHT' | 'UP') => void;
  onSwitchToProduct: () => void;
}

interface FlyingCard {
  card: MarketingCard;
  action: 'LEFT' | 'RIGHT' | 'UP';
  startX: number;
  startY: number;
  startTime: number;
}

interface OutcomeFeedback {
  text: string;
  subtext: string;
  color: string;
  time: number;
}

export const MarketingRoomCanvas: React.FC<MarketingRoomCanvasProps> = ({
  card,
  comboCount,
  agentTier,
  hasTrendRadar,
  demandBacklogMilliGu,
  cashCents,
  capitalUnitCents,
  onBuyCampaign,
  onSwipe,
  onSwitchToProduct,
}) => {
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [flyingCard, setFlyingCard] = useState<FlyingCard | null>(null);
  const [feedback, setFeedback] = useState<OutcomeFeedback | null>(null);

  const unitCents = capitalUnitCents || 2500000n;
  const currentCash = cashCents || 0n;

  const costCentsBlitz = (unitCents * 50n) / 100n; // 0.5 CU
  const costCentsSurge = (unitCents * 200n) / 100n; // 2.0 CU
  const costCentsOutbound = (unitCents * 500n) / 100n; // 5.0 CU

  const triggerSwipe = useCallback(
    (action: 'LEFT' | 'RIGHT' | 'UP', currentDrag: { x: number; y: number } = { x: 0, y: 0 }) => {
      if (!card) return;

      if (action === 'UP') {
        soundEngine.playDeploy();
        setFeedback({
          text: '+$50,000 DEMAND BURST!',
          subtext: '-$500 Ad Spend · Transferred to Product Pipeline',
          color: '#00f5ff',
          time: Date.now(),
        });
      } else if (action === 'RIGHT') {
        soundEngine.playCash();
        setFeedback({
          text: '+$25,000 DEMAND GENERATED!',
          subtext: 'Qualified lead transferred to Product Pipeline',
          color: '#34d399',
          time: Date.now(),
        });
      } else {
        soundEngine.playClick();
        setFeedback({
          text: 'LEAD FILTERED AS NOISE',
          subtext: 'Unqualified lead dismissed · Bandwidth preserved',
          color: 'rgba(255, 255, 255, 0.65)',
          time: Date.now(),
        });
      }

      setFlyingCard({
        card,
        action,
        startX: 500 + currentDrag.x,
        startY: 385 + currentDrag.y,
        startTime: Date.now(),
      });

      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);

      onSwipe(action);
    },
    [card, onSwipe]
  );

  const handlePointerDown = useCallback(
    (coords: { x: number; y: number }) => {
      // 1. Check Floating CTA Banner to switch to Product room
      if (demandBacklogMilliGu > 0) {
        if (coords.x >= 240 && coords.x <= 760 && coords.y >= 620 && coords.y <= 680) {
          soundEngine.playDeploy();
          onSwitchToProduct();
          return;
        }
      }

      // 2. Check Tactile Swipe Buttons
      if (card) {
        // Left button: Ignore
        if (coords.x >= 230 && coords.x <= 380 && coords.y >= 710 && coords.y <= 775) {
          triggerSwipe('LEFT');
          return;
        }
        // Center button: Boost Up
        if (coords.x >= 415 && coords.x <= 585 && coords.y >= 710 && coords.y <= 775) {
          triggerSwipe('UP');
          return;
        }
        // Right button: Pursue
        if (coords.x >= 620 && coords.x <= 770 && coords.y >= 710 && coords.y <= 775) {
          triggerSwipe('RIGHT');
          return;
        }

        // 3. Card drag area
        const cardW = 390;
        const cardH = 410;
        const cardX = 500;
        const cardY = 365;
        if (
          coords.x >= cardX - cardW / 2 &&
          coords.x <= cardX + cardW / 2 &&
          coords.y >= cardY - cardH / 2 &&
          coords.y <= cardY + cardH / 2
        ) {
          setIsDragging(true);
          dragStartRef.current = coords;
        }
      }

      // 4. Check Paid Acquisition Campaigns (y: 865 to 950)
      if (onBuyCampaign && coords.y >= 865 && coords.y <= 950) {
        // Blitz: x: 120..360
        if (coords.x >= 120 && coords.x <= 360) {
          if (currentCash >= costCentsBlitz) {
            onBuyCampaign('blitz');
            soundEngine.playCash();
            setFeedback({
              text: '+$5.0 GU INBOUND BLITZ PURCHASED!',
              subtext: `${formatMoney(costCentsBlitz)} deployed · 5.0 GU demand pipelined to Product`,
              color: '#34d399',
              time: Date.now(),
            });
          } else {
            soundEngine.playAlarm();
          }
          return;
        }
        // Surge: x: 380..620
        if (coords.x >= 380 && coords.x <= 620) {
          if (currentCash >= costCentsSurge) {
            onBuyCampaign('surge');
            soundEngine.playCash();
            setFeedback({
              text: '+$25.0 GU GROWTH SURGE PURCHASED!',
              subtext: `${formatMoney(costCentsSurge)} deployed · 25.0 GU demand pipelined to Product`,
              color: '#00f5ff',
              time: Date.now(),
            });
          } else {
            soundEngine.playAlarm();
          }
          return;
        }
        // Outbound: x: 640..880
        if (coords.x >= 640 && coords.x <= 880) {
          if (currentCash >= costCentsOutbound) {
            onBuyCampaign('outbound');
            soundEngine.playCash();
            soundEngine.playCelebration();
            setFeedback({
              text: '+$75.0 GU ENTERPRISE OUTBOUND PURCHASED!',
              subtext: `${formatMoney(costCentsOutbound)} deployed · 75.0 GU demand pipelined to Product`,
              color: '#fbbf24',
              time: Date.now(),
            });
          } else {
            soundEngine.playAlarm();
          }
          return;
        }
      }
    },
    [
      card,
      demandBacklogMilliGu,
      onSwitchToProduct,
      triggerSwipe,
      onBuyCampaign,
      currentCash,
      costCentsBlitz,
      costCentsSurge,
      costCentsOutbound,
    ]
  );

  const handlePointerMove = useCallback(
    (coords: { x: number; y: number }) => {
      if (!isDragging) return;
      setDragOffset({
        x: coords.x - dragStartRef.current.x,
        y: coords.y - dragStartRef.current.y,
      });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 110;
    if (dragOffset.y < -threshold) {
      triggerSwipe('UP', dragOffset);
    } else if (dragOffset.x > threshold) {
      triggerSwipe('RIGHT', dragOffset);
    } else if (dragOffset.x < -threshold) {
      triggerSwipe('LEFT', dragOffset);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isDragging, dragOffset, triggerSwipe]);

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, _viewport: RoomViewport, time: number) => {
      const now = Date.now();

      // =====================================================================
      // 1. MILKINSIDE RADAR SOUNDSTAGE & ORBITAL SWEEP
      // =====================================================================
      ctx.fillStyle = '#030307';
      ctx.fillRect(0, 0, 1000, 1000);

      // Ambient radial lighting
      const radGrad = ctx.createRadialGradient(500, 370, 20, 500, 370, 480);
      radGrad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      radGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.04)');
      radGrad.addColorStop(1, 'rgba(3, 3, 7, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 1000, 1000);

      // Orbital Concentric Range Circles
      const radarCenter = { x: 500, y: 370 };
      const radii = [120, 210, 310, 420];

      ctx.save();
      radii.forEach((r, idx) => {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.025 + idx * 0.01})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(radarCenter.x, radarCenter.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Distance range tick label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`RANGE ${(idx + 1) * 25}k`, radarCenter.x, radarCenter.y - r + 12);
      });

      // Rotating Radar Sweep Beam
      const sweepAngle = (time / 1800) % (Math.PI * 2);
      const sweepGrad = ctx.createConicGradient(sweepAngle, radarCenter.x, radarCenter.y);
      sweepGrad.addColorStop(0, 'rgba(0, 245, 255, 0.12)');
      sweepGrad.addColorStop(0.12, 'rgba(0, 245, 255, 0.0)');
      sweepGrad.addColorStop(1, 'rgba(0, 245, 255, 0.0)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.arc(radarCenter.x, radarCenter.y, 430, 0, Math.PI * 2);
      ctx.fill();

      // Crosshairs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(radarCenter.x, 20);
      ctx.lineTo(radarCenter.x, 720);
      ctx.moveTo(80, radarCenter.y);
      ctx.lineTo(920, radarCenter.y);
      ctx.stroke();
      ctx.restore();

      // Top Title Bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SIGNAL HORIZON RADAR // AUTONOMOUS LEAD DISCOVERY', 500, 36);

      // Subtle directional guidelines
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fillText('← REFUSE NOISE [Q ≤ 0]', 140, 370);

      ctx.fillStyle = 'rgba(52, 211, 153, 0.3)';
      ctx.fillText('PURSUE LEAD [Q 1..3] →', 860, 370);

      ctx.fillStyle = 'rgba(0, 245, 255, 0.3)';
      ctx.fillText('↑ 2X INBOUND BURST [Q ≥ 4]', 500, 80);

      // =====================================================================
      // 2. RENDER FLYING / EXIT ANIMATED CARD
      // =====================================================================
      if (flyingCard) {
        const elapsed = (now - flyingCard.startTime) / 280;
        if (elapsed >= 1.0) {
          setFlyingCard(null);
        } else {
          ctx.save();
          const easeOut = 1 - Math.pow(1 - elapsed, 3);
          let targetDx = 0;
          let targetDy = 0;
          let targetRot = 0;

          if (flyingCard.action === 'RIGHT') {
            targetDx = 700 * easeOut;
            targetRot = 0.25 * easeOut;
          } else if (flyingCard.action === 'LEFT') {
            targetDx = -700 * easeOut;
            targetRot = -0.25 * easeOut;
          } else if (flyingCard.action === 'UP') {
            targetDy = -600 * easeOut;
            targetRot = 0;
          }

          ctx.translate(flyingCard.startX + targetDx, flyingCard.startY + targetDy);
          ctx.rotate(targetRot);
          ctx.globalAlpha = Math.max(0, 1 - elapsed);

          ctx.fillStyle = 'rgba(10, 14, 26, 0.9)';
          ctx.strokeStyle =
            flyingCard.action === 'RIGHT'
              ? '#34d399'
              : flyingCard.action === 'UP'
              ? '#00f5ff'
              : '#f87171';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(-195, -205, 390, 410, 20);
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        }
      }

      // =====================================================================
      // 3. RENDER ACTIVE LEAD HOLOGRAM CARD
      // =====================================================================
      if (card && !flyingCard) {
        const cardX = 500 + dragOffset.x;
        const cardY = 365 + dragOffset.y;
        const cardW = 390;
        const cardH = 410;
        const rotation = (dragOffset.x / 1000) * 0.22;

        ctx.save();
        ctx.translate(cardX, cardY);
        ctx.rotate(rotation);

        // Dynamic border color depending on drag
        const isDragUp = dragOffset.y < -70;
        const isDragRight = dragOffset.x > 70;
        const isDragLeft = dragOffset.x < -70;

        const borderColor = isDragUp
          ? '#00f5ff'
          : isDragRight
          ? '#34d399'
          : isDragLeft
          ? '#f87171'
          : 'rgba(255, 255, 255, 0.12)';

        if (isDragUp || isDragRight || isDragLeft) {
          ctx.shadowColor = borderColor;
          ctx.shadowBlur = 24;
        }

        // Card Body (Frosted Obsidian Glass)
        ctx.fillStyle = 'rgba(9, 13, 24, 0.92)';
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isDragUp || isDragRight || isDragLeft ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 20);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Card Header
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('INBOUND VECTOR · SIGNAL 01', -cardW / 2 + 24, -cardH / 2 + 32);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 18px Inter, sans-serif';
        ctx.fillText('ENTERPRISE LEAD', -cardW / 2 + 24, -cardH / 2 + 56);

        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(0, 245, 255, 0.8)';
        ctx.textAlign = 'right';
        ctx.fillText(`ID: ${card.id.slice(-8)}`, cardW / 2 - 24, -cardH / 2 + 36);

        // Divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-cardW / 2 + 24, -cardH / 2 + 72);
        ctx.lineTo(cardW / 2 - 24, -cardH / 2 + 72);
        ctx.stroke();

        // Signals breakdown table (Progress gauges)
        const signals = [
          { label: 'Relevance', val: card.relevance, max: 4, color: '#00f5ff' },
          { label: 'Audience Fit', val: card.audienceFit, max: 4, color: '#34d399' },
          { label: 'Trend Velocity', val: card.trendVelocity, max: 4, color: '#c084fc' },
          { label: 'Market Saturation', val: card.saturation, max: 4, color: '#fbbf24', hide: !hasTrendRadar },
        ];

        let startY = -cardH / 2 + 104;
        signals.forEach((s) => {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.font = '11px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(s.label, -cardW / 2 + 24, startY);

          const barW = 140;
          const barH = 6;
          const barX = cardW / 2 - 24 - barW;
          const barY = startY - 8;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW, barH, 3);
          ctx.fill();

          if (!s.hide) {
            const frac = Math.min(1.0, Math.max(0.1, s.val / s.max));
            ctx.fillStyle = s.color;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW * frac, barH, 3);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.round(frac * 100)}%`, barX - 10, startY);
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText('LOCKED', barX - 10, startY);
          }

          startY += 34;
        });

        // Computed Q Score Summary Banner inside card
        const verdictY = cardH / 2 - 82;
        const verdictH = 58;
        const isHighQ = card.scoreQ >= 4;
        const isMedQ = card.scoreQ >= 1;

        ctx.fillStyle = isHighQ
          ? 'rgba(251, 191, 36, 0.12)'
          : isMedQ
          ? 'rgba(52, 211, 153, 0.12)'
          : 'rgba(239, 68, 68, 0.1)';
        ctx.strokeStyle = isHighQ ? '#fbbf24' : isMedQ ? '#34d399' : '#f87171';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-cardW / 2 + 20, verdictY, cardW - 40, verdictH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isHighQ ? '#fbbf24' : isMedQ ? '#34d399' : '#f87171';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
          isHighQ
            ? '🔥 HIGH QUALITY VECTOR (Q ≥ 4)'
            : isMedQ
            ? '✓ QUALIFIED AUDIENCE FIT (Q 1..3)'
            : '⚠ LOW QUALITY NOISE (Q ≤ 0)',
          -cardW / 2 + 34,
          verdictY + 24
        );

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(
          isHighQ
            ? 'Swipe UP or tap BOOST for 2x velocity throughput'
            : isMedQ
            ? 'Swipe RIGHT or tap PURSUE to convert into pipeline'
            : 'Swipe LEFT or tap DISMISS to preserve bandwidth',
          -cardW / 2 + 34,
          verdictY + 44
        );

        ctx.restore();

        // 3 Tactile Tap Buttons (Touch-friendly & Desktop alternative to dragging)
        // 1. Ignore Button (Left)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(230, 710, 150, 56, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← DISMISS', 305, 742);

        // 2. Boost Button (Up)
        ctx.fillStyle = 'rgba(0, 245, 255, 0.12)';
        ctx.strokeStyle = '#00f5ff';
        ctx.beginPath();
        ctx.roundRect(415, 710, 170, 56, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#00f5ff';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText('↑ BOOST (-$500)', 500, 735);
        ctx.fillStyle = 'rgba(0, 245, 255, 0.7)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText('2X DEMAND BURST', 500, 752);

        // 3. Pursue Button (Right)
        ctx.fillStyle = 'rgba(52, 211, 153, 0.12)';
        ctx.strokeStyle = '#34d399';
        ctx.beginPath();
        ctx.roundRect(620, 710, 150, 56, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText('PURSUE →', 695, 742);
      } else if (!flyingCard) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Scanning radar horizon for inbound enterprise signals...', 500, 370);
      }

      // Floating Feedback Banner (Shows outcome after swiping)
      if (feedback && now - feedback.time < 3200) {
        const age = now - feedback.time;
        const opacity = age > 2400 ? (3200 - age) / 800 : 1.0;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = 'rgba(10, 14, 26, 0.94)';
        ctx.strokeStyle = feedback.color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = feedback.color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.roundRect(250, 140, 500, 56, 12);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = feedback.color;
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(feedback.text, 500, 166);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(feedback.subtext, 500, 184);
        ctx.restore();
      }

      // UNMISSABLE HERO CALL-TO-ACTION: When Demand Backlog > 0
      if (demandBacklogMilliGu > 0) {
        const pulse = 1.0 + Math.sin(time / 200) * 0.03;
        ctx.save();
        ctx.translate(500, 645);
        ctx.scale(pulse, pulse);

        ctx.fillStyle = 'rgba(52, 211, 153, 0.18)';
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(-240, -24, 480, 48, 12);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `★ ${(demandBacklogMilliGu / 1000).toFixed(1)} DEMAND READY ➔ OPEN PRODUCT STUDIO [KEY 2]`,
          0,
          0
        );
        ctx.restore();
      }

      // Autonomous Marketing Agent Telemetry Deck
      if (agentTier > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(140, 785, 720, 36, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(165, 803, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`MARKETING AGENT TIER ${agentTier} ENGAGED`, 180, 807);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'right';
        ctx.fillText('AUTONOMOUS RADAR INTAKE ACTIVE', 835, 807);
      }

      // Paid Acquisition Console Deck (Convert Cash into Demand)
      const canAffordBlitz = currentCash >= costCentsBlitz;
      const canAffordSurge = currentCash >= costCentsSurge;
      const canAffordOutbound = currentCash >= costCentsOutbound;

      ctx.fillStyle = 'rgba(10, 14, 25, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(100, 840, 800, 88, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('PAID GROWTH PIPELINE // DEPLOY CASH INTO DEMAND BACKLOG', 120, 858);

      const campaigns = [
        {
          name: 'INBOUND BLITZ',
          yieldText: '+5.0 GU DEMAND',
          costText: formatMoney(costCentsBlitz),
          canAfford: canAffordBlitz,
          x: 120,
          w: 240,
          color: '#34d399',
        },
        {
          name: 'GROWTH SURGE',
          yieldText: '+25.0 GU DEMAND',
          costText: formatMoney(costCentsSurge),
          canAfford: canAffordSurge,
          x: 380,
          w: 240,
          color: '#00f5ff',
        },
        {
          name: 'ENTERPRISE GTM',
          yieldText: '+75.0 GU DEMAND',
          costText: formatMoney(costCentsOutbound),
          canAfford: canAffordOutbound,
          x: 640,
          w: 240,
          color: '#fbbf24',
        },
      ];

      campaigns.forEach((camp) => {
        ctx.save();
        ctx.fillStyle = camp.canAfford ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.015)';
        ctx.strokeStyle = camp.canAfford ? camp.color : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = camp.canAfford ? 1.4 : 1;
        ctx.beginPath();
        ctx.roundRect(camp.x, 868, camp.w, 52, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = camp.canAfford ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(camp.name, camp.x + 12, 886);

        ctx.fillStyle = camp.canAfford ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.25)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(camp.costText, camp.x + camp.w - 12, 886);

        ctx.fillStyle = camp.canAfford ? camp.color : 'rgba(255, 255, 255, 0.25)';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(camp.yieldText, camp.x + 12, 908);

        ctx.fillStyle = camp.canAfford ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)';
        ctx.font = '8px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(camp.canAfford ? 'DEPLOY ➔' : 'INSUFFICIENT', camp.x + camp.w - 12, 908);

        ctx.restore();
      });
    },
    [
      card,
      dragOffset,
      comboCount,
      agentTier,
      hasTrendRadar,
      flyingCard,
      feedback,
      demandBacklogMilliGu,
      currentCash,
      costCentsBlitz,
      costCentsSurge,
      costCentsOutbound,
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
