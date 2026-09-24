import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { GameState, DemandSignal, CustomerSegment, DemandTriageOutcome } from '../../../engine/types'
import type { GameAction } from '../../../engine/actions'
import { DEMAND_CHANNELS, DEMAND_CHANNEL_LIMITS, SEGMENT_PROFILES, LUCK_VARIANCE_CONFIG } from '../../../engine/constants'
import { sound } from '../../../audio/soundEngine'

interface DemandRoomProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

interface FeedbackSlot {
  outcome: DemandTriageOutcome
  signalTitle: string
  signalSegment: CustomerSegment
}

export const DemandRoom: React.FC<DemandRoomProps> = ({ state, dispatch }) => {
  const scaleRank = state.fleet?.demand?.scaleRank ?? 0
  const craftRank = state.fleet?.demand?.craftRank ?? 0
  const automateRank = state.fleet?.demand?.automateRank ?? 0
  const luckRank = state.fleet?.demand?.luckRank ?? 0

  const maxChannels = DEMAND_CHANNEL_LIMITS[scaleRank] || 1
  const activeChannels = DEMAND_CHANNELS.slice(0, maxChannels)
  const lockedChannels = DEMAND_CHANNELS.slice(maxChannels)

  const [selectedChannelIndex, setSelectedChannelIndex] = useState<number>(0)
  const [triagingSignalId, setTriagingSignalId] = useState<string | null>(null)
  const [affordabilityWarning, setAffordabilityWarning] = useState<string | null>(null)
  const warningTimeoutRef = useRef<number | null>(null)

  const demandSignals = state.demandSignals
  const qualifiedCount = state.qualifiedOpportunities?.length ?? 0

  // Calculate Craft & Luck yield metrics
  const cacDiscountPct = Math.round(Math.min(0.60, 0.12 * craftRank) * 100)
  const wtpBoostPct = Math.round(0.20 * craftRank * 100)

  // Feedback slots: keeps dramatic card feedback alive for 850ms without stalling normal card displays
  const [activeFeedbacks, setActiveFeedbacks] = useState<Record<number, FeedbackSlot>>({})
  const feedbackTimeoutsRef = useRef<Map<number, number>>(new Map())
  const lastProcessedOutcomeIdRef = useRef<string | null>(null)
  const lastActionChannelIndexRef = useRef<number>(0)

  // Listen to engine triage outcomes and trigger juiced card animations
  useEffect(() => {
    const outcome = state.lastTriageOutcome
    if (!outcome || outcome.id === lastProcessedOutcomeIdRef.current) return
    lastProcessedOutcomeIdRef.current = outcome.id

    // Only process recent outcomes (within 20 ticks) so stale outcomes don't replay on room switch
    if (state.elapsedTicks - outcome.tick > 20) return

    let targetIndex = lastActionChannelIndexRef.current ?? selectedChannelIndex
    if (targetIndex < 0 || targetIndex >= maxChannels) {
      targetIndex = 0
    }

    // Audio & tactile screen shake feedback
    if (!outcome.success) {
      sound.playRottenBuzzer()
      document.body.classList.add('screen-shake')
      window.setTimeout(() => {
        document.body.classList.remove('screen-shake')
      }, 320)
    } else {
      sound.playApplePop()
      sound.playSnap()
    }

    // Set feedback for target channel slot
    setActiveFeedbacks(prev => ({
      ...prev,
      [targetIndex]: {
        outcome,
        signalTitle: outcome.title,
        signalSegment: outcome.segment,
      },
    }))

    // Clear any existing timer on this slot
    const existingTimer = feedbackTimeoutsRef.current.get(targetIndex)
    if (existingTimer) {
      window.clearTimeout(existingTimer)
    }

    // Clear feedback after 850ms (independent of 100ms clock tick re-renders)
    const timerId = window.setTimeout(() => {
      feedbackTimeoutsRef.current.delete(targetIndex)
      setActiveFeedbacks(prev => {
        if (!prev[targetIndex]) return prev
        const next = { ...prev }
        delete next[targetIndex]
        return next
      })
    }, 850)

    feedbackTimeoutsRef.current.set(targetIndex, timerId)
  }, [state.lastTriageOutcome, state.elapsedTicks, maxChannels, selectedChannelIndex])

  // Clear pending timers on unmount
  useEffect(() => {
    const timeouts = feedbackTimeoutsRef.current
    return () => {
      timeouts.forEach(timer => window.clearTimeout(timer))
      timeouts.clear()
    }
  }, [])

  // Direct, rock-solid channel-to-signal mapping: channel i always displays demandSignals[i]
  const channelAssignments = useMemo(() => {
    return activeChannels.map((channel, idx) => ({
      channel,
      channelIndex: idx,
      signal: demandSignals[idx] as DemandSignal | undefined,
    }))
  }, [activeChannels, demandSignals])

  const selectedSlot = channelAssignments[selectedChannelIndex] || channelAssignments[0]

  // Clean up any pending warning timer on unmount
  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        window.clearTimeout(warningTimeoutRef.current)
      }
    }
  }, [])

  const triggerAffordabilityWarning = useCallback((msg: string) => {
    sound.playRottenBuzzer()
    setAffordabilityWarning(msg)
    if (warningTimeoutRef.current) {
      window.clearTimeout(warningTimeoutRef.current)
    }
    warningTimeoutRef.current = window.setTimeout(() => {
      setAffordabilityWarning(null)
    }, 4000)
  }, [])

  // Qualify specific signal [D]
  const handleQualify = useCallback((signal: DemandSignal, slotIndex?: number) => {
    const channelIdx = slotIndex ?? selectedChannelIndex
    if (activeFeedbacks[channelIdx]) return
    lastActionChannelIndexRef.current = channelIdx

    const rawCac = signal.acquisitionCostCents ?? 0
    const discountedCac = Math.round(rawCac * (1 - cacDiscountPct / 100))

    if (rawCac > 0 && state.cashCents < discountedCac) {
      triggerAffordabilityWarning(
        `Insufficient capital to qualify! Need $${Math.round(discountedCac / 100)} liquid cash. You have $${Math.round(state.cashCents / 100)}. Pass [A] or wait for subscription revenue.`
      )
      return
    }

    sound.playCashCascade()
    setAffordabilityWarning(null)
    setTriagingSignalId(signal.id)
    dispatch({ type: 'demand.triage', signalId: signal.id, decision: 'qualify' })
    setTriagingSignalId(null)
  }, [activeFeedbacks, selectedChannelIndex, cacDiscountPct, state.cashCents, triggerAffordabilityWarning, dispatch])

  // Dismiss specific signal [A]
  const handleDismiss = useCallback((signal: DemandSignal, slotIndex?: number) => {
    const channelIdx = slotIndex ?? selectedChannelIndex
    if (activeFeedbacks[channelIdx]) return
    lastActionChannelIndexRef.current = channelIdx

    sound.playMechanicalClick()
    setAffordabilityWarning(null)
    dispatch({ type: 'demand.triage', signalId: signal.id, decision: 'reject' })
  }, [activeFeedbacks, selectedChannelIndex, dispatch])

  // Hyper 2X specific signal [Space]
  const handleHyper = useCallback((signal: DemandSignal, slotIndex?: number) => {
    const channelIdx = slotIndex ?? selectedChannelIndex
    if (activeFeedbacks[channelIdx]) return
    lastActionChannelIndexRef.current = channelIdx

    const rawCac = signal.acquisitionCostCents ?? 0
    const discountedCac = Math.round(rawCac * (1 - cacDiscountPct / 100))
    const baseHyperCac = Math.round(discountedCac * 2)

    if (rawCac > 0 && state.cashCents < baseHyperCac) {
      triggerAffordabilityWarning(
        `Insufficient liquid cash for Hyper 2×! Requires $${Math.round(baseHyperCac / 100)} (2× direct CAC). You have $${Math.round(state.cashCents / 100)}. Qualify normally for $${Math.round(discountedCac / 100)} [D] or Pass [A].`
      )
      return
    }

    sound.playSubDrop()
    sound.playLaserSweep()
    setAffordabilityWarning(null)
    dispatch({ type: 'demand.hyper_triage', signalId: signal.id })
  }, [activeFeedbacks, selectedChannelIndex, cacDiscountPct, state.cashCents, triggerAffordabilityWarning, dispatch])

  // Batch Triage All Active Channels [Enter]
  const handleBatchTriageAll = useCallback(() => {
    if (demandSignals.length === 0) return
    lastActionChannelIndexRef.current = 0
    sound.playCashCascade()
    setAffordabilityWarning(null)
    dispatch({ type: 'demand.batch_triage' })
  }, [demandSignals.length, dispatch])

  // Refresh / Sweep Channels [R]
  const handleSweepChannels = useCallback(() => {
    sound.playClick()
    setAffordabilityWarning(null)
    dispatch({ type: 'demand.refresh_pool' })
  }, [dispatch])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        if (selectedSlot?.signal) {
          e.preventDefault()
          ;(e.target as HTMLElement)?.blur?.()
          handleQualify(selectedSlot.signal, selectedSlot.channelIndex)
        }
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        if (selectedSlot?.signal) {
          e.preventDefault()
          ;(e.target as HTMLElement)?.blur?.()
          handleDismiss(selectedSlot.signal, selectedSlot.channelIndex)
        }
      } else if (e.code === 'Space' || e.key === ' ' || e.key === 'Space') {
        if (selectedSlot?.signal) {
          e.preventDefault()
          ;(e.target as HTMLElement)?.blur?.()
          handleHyper(selectedSlot.signal, selectedSlot.channelIndex)
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        ;(e.target as HTMLElement)?.blur?.()
        handleBatchTriageAll()
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        ;(e.target as HTMLElement)?.blur?.()
        handleSweepChannels()
      } else if (e.key === 'Tab' || e.key === 'ArrowDown') {
        if (activeChannels.length > 1) {
          e.preventDefault()
          setSelectedChannelIndex(prev => (prev + 1) % activeChannels.length)
        }
      } else if (e.key === 'ArrowUp') {
        if (activeChannels.length > 1) {
          e.preventDefault()
          setSelectedChannelIndex(prev => (prev - 1 + activeChannels.length) % activeChannels.length)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [maxChannels, activeChannels.length, selectedSlot, handleQualify, handleDismiss, handleHyper, handleBatchTriageAll, handleSweepChannels])

  // Segment colors helper
  const getSegmentColor = (seg?: CustomerSegment) => {
    switch (seg) {
      case 'enterprise':
        return '#D97706'
      case 'team':
        return '#7C3AED'
      case 'creator':
      default:
        return '#0284C7'
    }
  }

  return (
    <div
      className="room-stage-container"
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '16px 20px 24px 20px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* 1. ROOM HEADER & UNIFIED TELEMETRY BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '2px',
          width: '100%',
          maxWidth: '680px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src="/assets/2.5d/nav_demand.png"
            alt="Demand"
            style={{ width: '42px', height: '42px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))', flexShrink: 0 }}
          />
          <div>
            <div className="room-eyebrow" style={{ color: 'var(--accent-demand)', marginBottom: '2px' }}>
              <span>01 / DEMAND & MULTI-CHANNEL MARKET RADAR</span>
            </div>
            <h2 className="room-title" style={{ margin: '0 0 3px 0', fontSize: '18px' }}>
              Inbound Market Command Center
            </h2>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span>
                Scale: <strong>{maxChannels} Active {maxChannels === 1 ? 'Channel' : 'Channels'}</strong> (Rank {scaleRank})
              </span>
              <span>·</span>
              <span>
                Craft Yield: <strong>{cacDiscountPct > 0 ? `-${cacDiscountPct}% CAC` : 'Baseline CAC'} · +{wtpBoostPct}% WTP</strong> (Rank {craftRank})
              </span>
              <span>·</span>
              <span style={{ color: automateRank > 0 ? 'var(--color-positive)' : 'var(--text-secondary)' }}>
                Automate: <strong>{automateRank > 0 ? `Rank ${automateRank} AI Inbound SDR` : 'Manual Triage'}</strong>
              </span>
              {luckRank > 0 && (
                <>
                  <span>·</span>
                  <span style={{ color: '#A855F7' }}>
                    Luck: <strong>+{Math.round((LUCK_VARIANCE_CONFIG[luckRank]?.maxBonus ?? 0) * 100)}% / -{Math.round((LUCK_VARIANCE_CONFIG[luckRank]?.maxPenalty ?? 0) * 100)}% Variance</strong> (Rank {luckRank})
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PRODUCT HOPPER BRIDGE BADGE */}
        <div
          onClick={() => dispatch({ type: 'attention.switch', functionId: 'product' })}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: qualifiedCount > 0 ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface-work)',
            border: qualifiedCount > 0 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-hairline)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 140ms ease',
          }}
          title="Click to view Product Coding Pods"
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: qualifiedCount > 0 ? '#10B981' : '#94A3B8',
              boxShadow: qualifiedCount > 0 ? '0 0 6px #10B981' : 'none',
            }}
          />
          <div>
            <div style={{ fontSize: '9.5px', fontWeight: 800, letterSpacing: '0.06em', color: qualifiedCount > 0 ? '#059669' : 'var(--text-secondary)' }}>
              PRODUCT HOPPER: {qualifiedCount} LEADS READY
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {qualifiedCount > 0 ? (
                <>
                  <span>Queued for autonomous Vibe Pods →</span>
                  <kbd className="btn-kbd" style={{ fontSize: '8px', padding: '0 4px', borderRadius: '3px', margin: 0 }}>2</kbd>
                </>
              ) : (
                'Triage inbound channels to feed Pods'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. GLOBAL RADAR CONTROLS BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '10px',
          padding: '8px 14px',
          boxShadow: 'var(--shadow-card)',
          width: '100%',
          maxWidth: '680px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-ink)' }}>
            📡 Market Scanner: {demandSignals.length} Active Inbound Signals
          </span>
          {automateRank > 0 && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              ● AI SDR SWARM ONLINE
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSweepChannels}
            className="cred-3d-button cred-3d-button-light"
            style={{
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Sweep Radar [R]"
          >
            <span>Sweep Radar</span>
            <kbd className="btn-kbd" style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(0, 0, 0, 0.08)', color: 'var(--text-ink)', margin: 0 }}>
              R
            </kbd>
          </button>

          <button
            onClick={handleBatchTriageAll}
            disabled={demandSignals.length === 0}
            className="cred-3d-button cred-3d-button-emerald"
            style={{
              padding: '5px 14px',
              fontSize: '11px',
              fontWeight: 800,
              opacity: demandSignals.length === 0 ? 0.5 : 1,
            }}
          >
            <span>Qualify All Channels</span>
            <kbd style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.25)' }}>
              ↵ Enter
            </kbd>
          </button>
        </div>
      </div>

      {/* Affordability & Triage Feedback Banner */}
      {affordabilityWarning && (
        <div
          style={{
            maxWidth: maxChannels === 1 ? '480px' : '960px',
            width: '100%',
            padding: '10px 14px',
            backgroundColor: 'rgba(225, 29, 72, 0.08)',
            border: '1.5px solid rgba(225, 29, 72, 0.4)',
            borderRadius: '10px',
            color: '#BE123C',
            fontSize: '11.5px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            boxSizing: 'border-box',
            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>⚠️</span>
            <span>{affordabilityWarning}</span>
          </div>
          <button
            onClick={() => setAffordabilityWarning(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#BE123C',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '14px',
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2.5 RECENT TRIAGE OUTCOME BANNER (PERSISTENT TELEMETRY) */}
      {state.lastTriageOutcome && (
        <div
          style={{
            maxWidth: maxChannels === 1 ? '480px' : '960px',
            width: '100%',
            padding: '8px 14px',
            borderRadius: '10px',
            backgroundColor: state.lastTriageOutcome.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: state.lastTriageOutcome.success ? '1.5px solid rgba(16, 185, 129, 0.35)' : '1.5px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxSizing: 'border-box',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>{state.lastTriageOutcome.success ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: state.lastTriageOutcome.success ? '#059669' : '#DC2626' }}>
                {state.lastTriageOutcome.success
                  ? `LATEST TRIAGE: ${state.lastTriageOutcome.title} Qualified → Routed to Product Pods`
                  : `LATEST TRIAGE: ${state.lastTriageOutcome.title} Disqualified · Did NOT proceed to Product`}
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                {state.lastTriageOutcome.success
                  ? `Successfully vetted at ${Math.round(state.lastTriageOutcome.probability * 100)}% Success Rate`
                  : (state.lastTriageOutcome.failureReason || `Vetting requirements not met (${Math.round(state.lastTriageOutcome.probability * 100)}% Success Rate)`)}
                {state.lastTriageOutcome.luckVariancePct !== 0 && (
                  <span style={{ color: state.lastTriageOutcome.luckVariancePct > 0 ? '#10B981' : '#EF4444', marginLeft: '6px' }}>
                    ({state.lastTriageOutcome.luckVariancePct > 0 ? `+${state.lastTriageOutcome.luckVariancePct}%` : `${state.lastTriageOutcome.luckVariancePct}%`} Luck)
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: state.lastTriageOutcome.success ? '#059669' : '#DC2626' }}>
              {state.lastTriageOutcome.success
                ? `+$${Math.round(state.lastTriageOutcome.effectiveWtp / 100)}/mo`
                : `-$${Math.round(state.lastTriageOutcome.effectiveCac / 100)} CAC`}
            </div>
            <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
              {state.lastTriageOutcome.success ? 'MRR Queued' : 'Lost Spend'}
            </div>
          </div>
        </div>
      )}

      {/* 3. RADAR WORKSTATIONS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: maxChannels === 1 ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '12px',
          width: '100%',
          maxWidth: maxChannels === 1 ? '480px' : '960px',
        }}
      >
        {channelAssignments.map(({ channel, channelIndex, signal }) => {
          // If this workstation slot is currently displaying a triage outcome (shake & break or success route)
          const feedback = activeFeedbacks[channelIndex]
          if (feedback) {
            const { outcome, signalTitle, signalSegment } = feedback
            const isFail = !outcome.success
            return (
              <div
                key={`feedback-${channel.id}-${outcome.id}`}
                className={isFail ? 'animate-demand-fail' : 'animate-demand-success'}
                style={{
                  borderRadius: '12px',
                  backgroundColor: isFail ? 'rgba(254, 242, 242, 0.97)' : 'rgba(236, 253, 245, 0.97)',
                  border: isFail ? '2.5px solid #EF4444' : '2.5px solid #10B981',
                  boxShadow: isFail
                    ? '0 0 28px rgba(239, 68, 68, 0.5), 0 8px 24px rgba(0,0,0,0.12)'
                    : '0 0 32px rgba(16, 185, 129, 0.6), 0 8px 24px rgba(0,0,0,0.12)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative',
                  minHeight: '275px',
                  height: '100%',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {/* Broken glass crack overlay on disqualification */}
                {isFail && (
                  <div
                    className="cracked-glass-overlay"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `radial-gradient(circle at 50% 40%, rgba(239, 68, 68, 0.25) 0%, transparent 65%),
                        repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(239, 68, 68, 0.12) 12px, rgba(239, 68, 68, 0.12) 14px),
                        repeating-linear-gradient(-45deg, transparent, transparent 16px, rgba(239, 68, 68, 0.08) 16px, rgba(239, 68, 68, 0.08) 18px)`,
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  />
                )}

                {/* Heavy Triage Stamp Slam Overlay */}
                <div
                  className="animate-stamp"
                  style={{
                    position: 'absolute',
                    top: '30%',
                    left: '6%',
                    right: '6%',
                    zIndex: 10,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      border: isFail ? '4px solid #DC2626' : '4px solid #059669',
                      backgroundColor: isFail ? '#FEF2F2' : '#ECFDF5',
                      color: isFail ? '#DC2626' : '#059669',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 900,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      boxShadow: isFail
                        ? '0 10px 25px rgba(220, 38, 38, 0.45), inset 0 0 10px rgba(220, 38, 38, 0.15)'
                        : '0 10px 25px rgba(5, 150, 105, 0.45), inset 0 0 10px rgba(5, 150, 105, 0.15)',
                      textAlign: 'center',
                      transform: isFail ? 'rotate(-6deg)' : 'rotate(4deg)',
                    }}
                  >
                    {isFail ? '❌ DISQUALIFIED' : '✓ QUALIFIED & ROUTED'}
                  </div>
                </div>

                {/* Channel Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.85 }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                    <span>{channel.icon}</span> CHANNEL // 0{channel.channelNumber}
                  </div>
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isFail ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: isFail ? '#DC2626' : '#059669',
                      border: isFail ? '1px solid #EF4444' : '1px solid #10B981',
                    }}
                  >
                    {Math.round(outcome.probability * 100)}% SUCCESS RATE
                  </span>
                </div>

                {/* Lead Title & Segment */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-ink)', textDecoration: isFail ? 'line-through' : 'none' }}>
                    {signalTitle}
                  </div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 700 }}>
                    {signalSegment.toUpperCase()} SEGMENT {outcome.isHyper ? '· HYPER 2×' : ''} {outcome.isLuckyWhale ? '· 🐋 WHALE CATALYST' : ''}
                  </div>
                </div>

                {/* Explanatory Causality Box */}
                <div
                  style={{
                    marginTop: 'auto',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: isFail ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    border: isFail ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1.5px solid rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    zIndex: 3,
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: isFail ? '#DC2626' : '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{isFail ? '⚠️ DID NOT PROCEED TO PRODUCT' : '🚀 ROUTED TO PRODUCT CODING PODS'}</span>
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: isFail ? '#991B1B' : '#065F46', lineHeight: 1.35 }}>
                    {isFail
                      ? (outcome.failureReason || `Lead failed qualification vetting (${Math.round(outcome.probability * 100)}% success rate).`)
                      : `Lead passed qualification vetting! Routed to autonomous Pods for assembly.`}
                  </div>
                  <div
                    style={{
                      fontSize: '9.5px',
                      color: isFail ? '#B91C1C' : '#047857',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '2px',
                      borderTop: isFail ? '1px dashed rgba(239,68,68,0.3)' : '1px dashed rgba(16,185,129,0.3)',
                      paddingTop: '5px',
                    }}
                  >
                    <span>{isFail ? 'CAC Lost (Unrecoverable):' : 'Effective CAC Paid:'}</span>
                    <strong style={{ fontWeight: 800 }}>${Math.round(outcome.effectiveCac / 100)}</strong>
                  </div>
                  {!isFail && (
                    <div style={{ fontSize: '9.5px', color: '#047857', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Projected Monthly WTP:</span>
                      <strong style={{ fontWeight: 800 }}>+${Math.round(outcome.effectiveWtp / 100)}/mo</strong>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          const isSelected = selectedChannelIndex === channelIndex
          const isTriaging = triagingSignalId === signal?.id
          const segColor = getSegmentColor(signal?.segment)

          const rawCac = signal ? signal.acquisitionCostCents : 0
          const discountedCac = Math.round(rawCac * (1 - cacDiscountPct / 100))
          const effectiveCacDollars = Math.round(discountedCac / 100)
          const baseHyperCac = Math.round(discountedCac * 2)
          const effectiveHyperCacDollars = Math.round(baseHyperCac / 100)

          const baseWtp = signal ? signal.estimatedWtpCents : 0
          const effectiveWtpDollars = Math.round((baseWtp * (1 + wtpBoostPct / 100)) / 100)
          const hyperWtpDollars = effectiveWtpDollars * 2
          const estimatedArrDollars = effectiveWtpDollars * 12

          const isWhale = signal && (signal.estimatedWtpCents >= 35_000 || signal.title.includes('Whale') || signal.acquisitionCostCents === 0)
          const isViral = signal && signal.acquisitionCostCents === 0

          const canAffordQualify = isViral || state.cashCents >= discountedCac
          const canAffordHyper = isViral || state.cashCents >= baseHyperCac

          return (
            <div
              key={channel.id}
              onClick={() => setSelectedChannelIndex(channelIndex)}
              style={{
                borderRadius: '12px',
                backgroundColor: 'var(--surface-card)',
                border: isSelected
                  ? '1.5px solid var(--accent-demand, #E11D48)'
                  : isWhale
                  ? '1.5px solid #F59E0B'
                  : '1.5px solid var(--border-hairline)',
                boxShadow: isSelected
                  ? '0 0 12px rgba(225, 29, 72, 0.15), var(--shadow-card)'
                  : isWhale
                  ? '0 0 12px rgba(245, 158, 11, 0.15)'
                  : 'var(--shadow-card)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                cursor: 'pointer',
                transition: 'border-color 140ms ease, box-shadow 140ms ease, opacity 140ms ease',
                position: 'relative',
                opacity: isTriaging ? 0.4 : 1,
                minHeight: '275px',
                height: '100%',
                boxSizing: 'border-box',
              }}
            >
              {/* Channel Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>{channel.icon}</span>
                    <span>CHANNEL // 0{channel.channelNumber}</span>
                    {isSelected && (
                      <span style={{ color: 'var(--accent-demand)', fontWeight: 800 }}>[ACTIVE]</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-ink)', marginTop: '2px' }}>
                    {channel.name}
                  </div>
                </div>

                {/* SDR Auto Tag */}
                {automateRank > 0 && (
                  <span
                    style={{
                      fontSize: '8px',
                      fontWeight: 800,
                      color: '#059669',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                    }}
                  >
                    AI SDR AUTO
                  </span>
                )}
              </div>

              {/* Signal Body or Listening State */}
              {signal ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {/* Tags: Segment & Clear Success Rate Badge & Whale / Viral Callout */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '8.5px',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: `${segColor}15`,
                        color: segColor,
                        border: `1px solid ${segColor}35`,
                      }}
                    >
                      {signal.segment.toUpperCase()}
                    </span>

                    <span
                      style={{
                        fontSize: '8.5px',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        backgroundColor:
                          signal.segment === 'enterprise'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : signal.segment === 'team'
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'rgba(16, 185, 129, 0.12)',
                        color:
                          signal.segment === 'enterprise'
                            ? '#DC2626'
                            : signal.segment === 'team'
                            ? '#D97706'
                            : '#059669',
                        border:
                          signal.segment === 'enterprise'
                            ? '1px solid rgba(239, 68, 68, 0.35)'
                            : signal.segment === 'team'
                            ? '1px solid rgba(245, 158, 11, 0.35)'
                            : '1px solid rgba(16, 185, 129, 0.35)',
                        letterSpacing: '0.04em',
                      }}
                      title={`Base Qualification Success Rate: ${Math.round((SEGMENT_PROFILES[signal.segment]?.qualificationSuccessRate ?? 0.8) * 100)}%`}
                    >
                      {signal.segment === 'enterprise'
                        ? '40% SUCCESS RATE (HIGH RISK)'
                        : signal.segment === 'team'
                        ? '70% SUCCESS RATE'
                        : '90% SUCCESS RATE'}
                    </span>

                    {isWhale && (
                      <span
                        style={{
                          fontSize: '8.5px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          color: '#D97706',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                        }}
                      >
                        🐋 WHALE INBOUND
                      </span>
                    )}

                    {isViral && (
                      <span
                        style={{
                          fontSize: '8.5px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#059669',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        ⚡ $0 CAC VIRAL
                      </span>
                    )}
                  </div>

                  {/* Visual Conversion Odds & Failure Risk Meter */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-hairline)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontWeight: 800 }}>
                      <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>CONVERSION ODDS:</span>
                      <span
                        style={{
                          color:
                            signal.segment === 'enterprise'
                              ? '#DC2626'
                              : signal.segment === 'team'
                              ? '#D97706'
                              : '#059669',
                        }}
                      >
                        {signal.segment === 'enterprise'
                          ? '40% SUCCESS RATE'
                          : signal.segment === 'team'
                          ? '70% SUCCESS RATE'
                          : '90% SUCCESS RATE'}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '5px',
                        backgroundColor: 'rgba(0, 0, 0, 0.08)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width:
                            signal.segment === 'enterprise'
                              ? '40%'
                              : signal.segment === 'team'
                              ? '70%'
                              : '90%',
                          height: '100%',
                          backgroundColor:
                            signal.segment === 'enterprise'
                              ? '#EF4444'
                              : signal.segment === 'team'
                              ? '#F59E0B'
                              : '#10B981',
                          borderRadius: '3px',
                          transition: 'width 200ms ease',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', lineHeight: 1.25 }}>
                      {signal.segment === 'enterprise'
                        ? '⚠️ 60% failure risk: if vetting fails, CAC is lost and lead will NOT reach Product'
                        : signal.segment === 'team'
                        ? '30% failure risk: departmental sign-off required'
                        : '10% failure risk: self-serve, high-velocity conversion'}
                    </div>
                  </div>

                  {/* Signal Title & Quote */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-ink)', lineHeight: 1.3 }}>
                      {signal.title}
                    </div>
                    <p className="mobile-hide" style={{ fontSize: '10.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4, fontStyle: 'italic' }}>
                      &ldquo;{signal.quote || signal.signalRationale}&rdquo;
                    </p>
                  </div>

                  {/* 2-Column Metrics */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '6px',
                      backgroundColor: 'var(--surface-sunken)',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-hairline)',
                      marginTop: 'auto',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        POTENTIAL ARR
                      </div>
                      <div className="font-display" style={{ fontSize: '13px', fontWeight: 800, color: '#059669' }}>
                        +${estimatedArrDollars.toLocaleString()}/yr
                      </div>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                        ${effectiveWtpDollars}/mo WTP
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        ACQUISITION CAC
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', flexWrap: 'wrap' }}>
                        <span className="font-display" style={{ fontSize: '13px', fontWeight: 800, color: isViral ? '#059669' : 'var(--text-ink)' }}>
                          {isViral ? '$0 FREE' : `$${effectiveCacDollars}`}
                        </span>
                        {!isViral && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              color: canAffordHyper ? '#0284C7' : '#94A3B8',
                              backgroundColor: canAffordHyper ? 'rgba(2, 132, 199, 0.08)' : 'rgba(148, 163, 184, 0.1)',
                              padding: '1px 4px',
                              borderRadius: '3px',
                            }}
                            title={`Hyper 2× CAC is $${effectiveHyperCacDollars} (2× direct CAC for 2× ARR)`}
                          >
                            Hyper: ${effectiveHyperCacDollars}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                        {isViral
                          ? 'Zero-CAC viral inbound'
                          : cacDiscountPct > 0
                          ? `-${cacDiscountPct}% Craft saved · 2× Hyper`
                          : 'Standard direct · 2× Hyper'}
                      </div>
                    </div>
                  </div>

                  {/* Tactile Action Controls */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr 1.25fr', gap: '5px', marginTop: '6px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDismiss(signal, channelIndex)
                      }}
                      className="cred-3d-button cred-3d-button-light"
                      style={{
                        padding: '6px 4px',
                        fontSize: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                      title="Dismiss Signal [A or ←]"
                    >
                      <span>Pass</span>
                      <kbd
                        className="btn-kbd"
                        style={{
                          fontSize: '8.5px',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          background: 'rgba(0, 0, 0, 0.08)',
                          color: 'var(--text-ink)',
                          margin: 0,
                        }}
                      >
                        A
                      </kbd>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleHyper(signal, channelIndex)
                      }}
                      className="cred-3d-button cred-3d-button-cyan"
                      style={{
                        padding: '6px 4px',
                        fontSize: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        opacity: canAffordHyper ? 1 : 0.5,
                        filter: canAffordHyper ? 'none' : 'grayscale(0.5)',
                        cursor: canAffordHyper ? 'pointer' : 'not-allowed',
                      }}
                      title={
                        canAffordHyper
                          ? `Hyper 2X Lead [Space] · Invest $${effectiveHyperCacDollars} CAC for 2X ARR ($${hyperWtpDollars}/mo WTP)`
                          : `Insufficient Cash: Hyper 2× requires $${effectiveHyperCacDollars} liquid cash (Have $${Math.round(state.cashCents / 100)})`
                      }
                    >
                      <span style={{ fontWeight: 800 }}>Hyper 2×</span>
                      <span style={{ fontSize: '8.5px', opacity: 0.9, fontWeight: 700 }}>
                        {isViral ? '$0' : `$${effectiveHyperCacDollars}`}
                      </span>
                      <kbd
                        className="btn-kbd"
                        style={{
                          fontSize: '8.5px',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          background: canAffordHyper ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.12)',
                          color: canAffordHyper ? '#FFF' : 'var(--text-muted)',
                          margin: 0,
                        }}
                      >
                        Space
                      </kbd>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQualify(signal, channelIndex)
                      }}
                      className="cred-3d-button cred-3d-button-emerald"
                      style={{
                        padding: '6px 4px',
                        fontSize: '10px',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        opacity: canAffordQualify ? 1 : 0.5,
                        filter: canAffordQualify ? 'none' : 'grayscale(0.5)',
                        cursor: canAffordQualify ? 'pointer' : 'not-allowed',
                      }}
                      title={
                        canAffordQualify
                          ? `Qualify & Route to Product Pods [D or →] ($${effectiveCacDollars} CAC)`
                          : `Insufficient Cash: Need $${effectiveCacDollars} liquid cash (Have $${Math.round(state.cashCents / 100)})`
                      }
                    >
                      <span>Qualify</span>
                      <span style={{ fontSize: '8.5px', opacity: 0.9, fontWeight: 700 }}>
                        {isViral ? '$0' : `$${effectiveCacDollars}`}
                      </span>
                      <kbd
                        className="btn-kbd"
                        style={{
                          fontSize: '8.5px',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          background: canAffordQualify ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.12)',
                          color: canAffordQualify ? '#FFF' : 'var(--text-muted)',
                          margin: 0,
                        }}
                      >
                        D
                      </kbd>
                    </button>
                  </div>
                </div>
              ) : (
                /* Channel Listening State */
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '24px 12px',
                    gap: '8px',
                    backgroundColor: 'var(--surface-work)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-hairline)',
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(2, 132, 199, 0.1)',
                      border: '1.5px solid rgba(2, 132, 199, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    📡
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-ink)' }}>
                    Scanning Market Channel
                  </div>
                  <p className="mobile-hide" style={{ fontSize: '9.5px', color: 'var(--text-secondary)', margin: 0, maxWidth: '180px' }}>
                    {channel.desc}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSweepChannels()
                    }}
                    className="cred-3d-button cred-3d-button-light"
                    style={{
                      padding: '4px 10px',
                      fontSize: '10px',
                      marginTop: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    title="Sweep Radar [R]"
                  >
                    <span>Sweep</span>
                    <kbd
                      className="btn-kbd"
                      style={{
                        fontSize: '8.5px',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        background: 'rgba(0, 0, 0, 0.08)',
                        color: 'var(--text-ink)',
                        margin: 0,
                      }}
                    >
                      R
                    </kbd>
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* 4. LOCKED RADAR CHANNEL WORKSTATIONS (UNIFORM WITH ACTIVE CARDS) */}
        {lockedChannels.length > 0 && (
          <div
            onClick={() => {
              sound.playClick()
              const openTree = (window as unknown as { openSkillTreeModal?: () => void })?.openSkillTreeModal
              if (openTree) openTree()
            }}
            style={{
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.65)',
              border: '1.5px dashed var(--border-graphite)',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '8px',
              cursor: 'pointer',
              minHeight: maxChannels === 1 ? '160px' : '275px',
              height: '100%',
              boxSizing: 'border-box',
              transition: 'background-color 140ms ease, border-color 140ms ease, transform 140ms ease',
            }}
            title="Upgrade Demand Scale in Skill Canvas [K] to unlock more channels"
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                marginBottom: '2px',
              }}
            >
              🔒
            </div>
            <div
              style={{
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#F1F5F9',
                border: '1px solid var(--border-hairline)',
              }}
            >
              [{lockedChannels.length} {lockedChannels.length === 1 ? 'CHANNEL' : 'CHANNELS'} LOCKED]
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-ink)' }}>
              Channels // 0{maxChannels + 1}–06 Standby
            </div>
            <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: 0, maxWidth: '240px', lineHeight: 1.4 }}>
              Upgrade <strong>Scale</strong> in Skill Canvas <kbd className="btn-kbd" style={{ fontSize: '8.5px', padding: '1px 5px', margin: 0 }}>K</kbd> to run concurrent radar channels.
            </p>
            <button
              className="cred-3d-button cred-3d-button-light"
              style={{
                padding: '5px 12px',
                fontSize: '10.5px',
                fontWeight: 700,
                marginTop: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>Unlock Channels</span>
              <kbd className="btn-kbd" style={{ fontSize: '8.5px', padding: '1px 4px', margin: 0 }}>K</kbd>
            </button>
          </div>
        )}
      </div>

      {/* 5. COCKPIT HOTKEYS QUICK REFERENCE */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '14px',
          padding: '8px 14px',
          borderRadius: '8px',
          backgroundColor: 'var(--surface-work)',
          border: '1px solid var(--border-hairline)',
          fontSize: '10px',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap',
          marginTop: '4px',
          width: '100%',
          maxWidth: maxChannels === 1 ? '480px' : '680px',
        }}
      >
        <span style={{ fontWeight: 800, color: 'var(--text-ink)', letterSpacing: '0.04em' }}>
          DEMAND HOTKEYS:
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <kbd className="btn-kbd" style={{ fontSize: '8.5px', padding: '1px 4px', margin: 0 }}>A</kbd> Pass
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <kbd className="btn-kbd" style={{ fontSize: '8.5px', padding: '1px 4px', margin: 0 }}>Space</kbd> Hyper 2× (2× CAC)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <kbd className="btn-kbd" style={{ fontSize: '8.5px', padding: '1px 4px', margin: 0 }}>D</kbd> Qualify
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <kbd className="btn-kbd" style={{ fontSize: '8.5px', padding: '1px 4px', margin: 0 }}>R</kbd> Sweep Radar
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <kbd className="btn-kbd" style={{ fontSize: '8.5px', padding: '1px 4px', margin: 0 }}>↵ Enter</kbd> Qualify All
        </span>
        {maxChannels > 1 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <kbd className="btn-kbd" style={{ fontSize: '8.5px', padding: '1px 4px', margin: 0 }}>Tab</kbd> Switch Channel
          </span>
        )}
      </div>
    </div>
  )
}
