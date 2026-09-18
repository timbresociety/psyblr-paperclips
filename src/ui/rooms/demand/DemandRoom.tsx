import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { GameState, DemandSignal, CustomerSegment } from '../../../engine/types'
import type { GameAction } from '../../../engine/actions'
import { DEMAND_CHANNELS, DEMAND_CHANNEL_LIMITS } from '../../../engine/constants'
import { sound } from '../../../audio/soundEngine'

interface DemandRoomProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
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

  const demandSignals = state.demandSignals || []
  const qualifiedCount = state.qualifiedOpportunities?.length ?? 0

  // Calculate Craft & Luck yield metrics
  const cacDiscountPct = Math.round(Math.min(0.60, 0.12 * craftRank) * 100)
  const wtpBoostPct = Math.round(0.20 * craftRank * 100)
  const whaleLuckChancePct = Math.round(luckRank * 10)

  // Map demand signals into channel slots
  const channelAssignments = useMemo(() => {
    return activeChannels.map((channel, idx) => {
      const signal = demandSignals[idx] as DemandSignal | undefined
      return {
        channel,
        channelIndex: idx,
        signal,
      }
    })
  }, [activeChannels, demandSignals])

  const selectedSlot = channelAssignments[selectedChannelIndex] || channelAssignments[0]

  // Qualify specific signal
  const handleQualify = useCallback((signal: DemandSignal) => {
    sound.playCashCascade()
    setTriagingSignalId(signal.id)
    setTimeout(() => {
      dispatch({ type: 'demand.triage', signalId: signal.id, decision: 'qualify' })
      setTriagingSignalId(null)
    }, 120)
  }, [dispatch])

  // Dismiss specific signal
  const handleDismiss = useCallback((signal: DemandSignal) => {
    sound.playMechanicalClick()
    setTriagingSignalId(signal.id)
    setTimeout(() => {
      dispatch({ type: 'demand.triage', signalId: signal.id, decision: 'reject' })
      setTriagingSignalId(null)
    }, 120)
  }, [dispatch])

  // Hyper 2X specific signal
  const handleHyper = useCallback((signal: DemandSignal) => {
    sound.playSubDrop()
    sound.playLaserSweep()
    setTriagingSignalId(signal.id)
    setTimeout(() => {
      dispatch({ type: 'demand.hyper_triage', signalId: signal.id })
      setTriagingSignalId(null)
    }, 160)
  }, [dispatch])

  // Batch Triage All Active Channels [Enter]
  const handleBatchTriageAll = useCallback(() => {
    if (demandSignals.length === 0) return
    sound.playCashCascade()
    dispatch({ type: 'demand.batch_triage' })
  }, [demandSignals.length, dispatch])

  // Refresh / Sweep Channels [R]
  const handleSweepChannels = useCallback(() => {
    sound.playClick()
    dispatch({ type: 'demand.refresh_pool' })
  }, [dispatch])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

      if (e.key === 'd' || e.key === 'D') {
        if (selectedSlot?.signal) {
          e.preventDefault()
          handleQualify(selectedSlot.signal)
        }
      } else if (e.key === 'a' || e.key === 'A') {
        if (selectedSlot?.signal) {
          e.preventDefault()
          handleDismiss(selectedSlot.signal)
        }
      } else if (e.code === 'Space') {
        if (selectedSlot?.signal) {
          e.preventDefault()
          handleHyper(selectedSlot.signal)
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleBatchTriageAll()
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        handleSweepChannels()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [maxChannels, selectedSlot, handleQualify, handleDismiss, handleHyper, handleBatchTriageAll, handleSweepChannels])

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
        maxWidth: '1040px',
        margin: '0 auto',
        padding: '16px 20px 24px 20px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
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
                    Luck: <strong>+{whaleLuckChancePct}% Whale Bias</strong> (Rank {luckRank})
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
            <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '1px' }}>
              {qualifiedCount > 0 ? 'Queued for autonomous Vibe Pods → [2]' : 'Triage inbound channels to feed Pods'}
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
            }}
          >
            <span>Sweep Radar [R]</span>
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

      {/* 3. RADAR WORKSTATIONS GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {channelAssignments.map(({ channel, channelIndex, signal }) => {
          const isSelected = selectedChannelIndex === channelIndex
          const isTriaging = triagingSignalId === signal?.id
          const segColor = getSegmentColor(signal?.segment)

          const rawCac = signal ? signal.acquisitionCostCents : 0
          const discountedCac = Math.round(rawCac * (1 - cacDiscountPct / 100))
          const effectiveCacDollars = Math.round(discountedCac / 100)

          const baseWtp = signal ? signal.estimatedWtpCents : 0
          const effectiveWtpDollars = Math.round((baseWtp * (1 + wtpBoostPct / 100)) / 100)
          const estimatedArrDollars = effectiveWtpDollars * 12

          const isWhale = signal && (signal.estimatedWtpCents >= 35_000 || signal.title.includes('Whale') || signal.acquisitionCostCents === 0)
          const isViral = signal && signal.acquisitionCostCents === 0

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
                  : '1px solid var(--border-hairline)',
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
                transition: 'all 140ms ease',
                position: 'relative',
                opacity: isTriaging ? 0.4 : 1,
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
                  {/* Tags: Segment & Whale / Viral Callout */}
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
                      <div className="font-display" style={{ fontSize: '13px', fontWeight: 800, color: isViral ? '#059669' : 'var(--text-ink)' }}>
                        {isViral ? '$0 FREE' : `$${effectiveCacDollars}`}
                      </div>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>
                        {cacDiscountPct > 0 ? `-${cacDiscountPct}% Craft saved` : 'Standard direct'}
                      </div>
                    </div>
                  </div>

                  {/* Tactile Action Controls */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.6fr', gap: '5px', marginTop: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDismiss(signal)
                      }}
                      className="cred-3d-button cred-3d-button-light"
                      style={{ padding: '6px 4px', fontSize: '10px' }}
                      title="Dismiss Signal [A]"
                    >
                      <span>Pass</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleHyper(signal)
                      }}
                      className="cred-3d-button cred-3d-button-cyan"
                      style={{ padding: '6px 4px', fontSize: '10px' }}
                      title="Hyper 2X Lead [Space]"
                    >
                      <span>Hyper 2×</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQualify(signal)
                      }}
                      className="cred-3d-button cred-3d-button-emerald"
                      style={{ padding: '6px 6px', fontSize: '10.5px', fontWeight: 800 }}
                      title="Qualify & Route to Product Pods [D]"
                    >
                      <span>Qualify →</span>
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
                    style={{ padding: '4px 10px', fontSize: '10px', marginTop: '4px' }}
                  >
                    <span>Sweep [R]</span>
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* 4. LOCKED RADAR CHANNEL WORKSTATIONS */}
        {lockedChannels.length > 0 && (
          <div
            onClick={() => dispatch({ type: 'attention.switch', functionId: 'operations' })}
            style={{
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              border: '1.5px dashed var(--border-graphite)',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '6px',
              cursor: 'pointer',
              minHeight: '130px',
            }}
            title="Upgrade Demand Scale in Skill Canvas [K] to unlock more channels"
          >
            <div
              style={{
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: '#F1F5F9',
                border: '1px solid var(--border-hairline)',
              }}
            >
              [{lockedChannels.length} CHANNELS LOCKED]
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-ink)' }}>
              Channels // 0{maxChannels + 1}–06 Standby
            </div>
            <p className="mobile-hide" style={{ fontSize: '9.5px', color: 'var(--text-muted)', margin: 0, maxWidth: '170px', lineHeight: 1.35 }}>
              Upgrade <strong>Scale</strong> in Skill Canvas [K] to run concurrent radar channels.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
