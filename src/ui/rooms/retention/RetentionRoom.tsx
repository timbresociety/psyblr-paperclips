import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { GameState, CustomerAccount, RetentionIncident } from '../../../engine/types'
import type { GameAction } from '../../../engine/actions'
import { sound } from '../../../audio/soundEngine'
import { RETENTION_BAY_LIMITS } from '../../../engine/constants'


interface RetentionRoomProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

interface FloatingParticle {
  id: number
  x: number
  y: number
  text: string
  color: string
}

export const RetentionRoom: React.FC<RetentionRoomProps> = ({ state, dispatch }) => {
  const scaleRank = state.fleet?.retention?.scaleRank ?? 0
  const craftRank = state.fleet?.retention?.craftRank ?? 0
  const automateRank = state.fleet?.retention?.automateRank ?? 0
  const luckRank = state.fleet?.retention?.luckRank ?? 0
  const maxBays = RETENTION_BAY_LIMITS[scaleRank] || 1
  const craftHealthBonusPct = Math.round(35 * (1 + 0.35 * craftRank))

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [squashingId, setSquashingId] = useState<string | null>(null)
  const [isScreenShaking, setIsScreenShaking] = useState(false)
  const [particles, setParticles] = useState<FloatingParticle[]>([])
  const [activeTool, setActiveTool] = useState<'slap' | 'mallet' | 'coffee'>('slap')

  // Priority queue: accounts needing immediate attention auto-spotlight to top shelf
  const prioritizedAccounts: CustomerAccount[] = useMemo(() => {
    const list: CustomerAccount[] = [...state.accounts]
    return list.sort((a, b) => {
      // 1. Explicitly selected account always takes top priority
      if (selectedAccountId) {
        if (a.id === selectedAccountId) return -1
        if (b.id === selectedAccountId) return 1
      }
      // 2. Active critical event account
      if (state.retentionEvent?.active) {
        if (a.id === state.retentionEvent.accountId) return -1
        if (b.id === state.retentionEvent.accountId) return 1
      }
      // 3. Threatened status or low health
      const aThreat = a.isThreatened || a.health < 65
      const bThreat = b.isThreatened || b.health < 65
      if (aThreat && !bThreat) return -1
      if (!aThreat && bThreat) return 1
      // 4. Lowest health first (most at-risk accounts spotlighted to the top)
      if (a.health !== b.health) return a.health - b.health
      // 5. Higher ARR at risk first
      const aArr = (a.baseMrrCents + a.addonMrrCents) * 12
      const bArr = (b.baseMrrCents + b.addonMrrCents) * 12
      return bArr - aArr
    })
  }, [state.accounts, selectedAccountId, state.retentionEvent])

  const threatenedAccounts = state.accounts.filter(a => a.isThreatened || a.health < 65)
  const activeTarget: CustomerAccount | undefined = prioritizedAccounts[0] || state.accounts[0]

  // Construct active squishable issues from retentionIncidents or threatened accounts
  const liveIncidents: RetentionIncident[] = state.retentionIncidents && state.retentionIncidents.length > 0
    ? state.retentionIncidents
    : threatenedAccounts.map(a => ({
        id: `threat-${a.id}`,
        accountId: a.id,
        accountName: a.name,
        title: a.threatReason || (a.health < 40 ? 'Severe Latency Degradation' : 'Executive Sponsor Churn Warning'),
        category: 'executive',
        urgencyTicks: 120,
        maxUrgencyTicks: 120,
        consequence: 'Contract Cancellation',
        hp: 4,
        maxHp: 4,
        threatType: a.health < 40 ? 'bug' : 'piggy',
      }))

  const combo = state.retentionCombo ?? 0

  const spawnParticle = (x: number, y: number, text: string, color: string) => {
    const pId = Date.now() + Math.random()
    setParticles(prev => [...prev.slice(-8), { id: pId, x, y, text, color }])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== pId))
    }, 600)
  }

  // Squashing action (Bills Must Be Paid mechanic)
  const handleSquash = useCallback(
    (incident: RetentionIncident, accountId?: string, e?: React.MouseEvent) => {
      const damage = activeTool === 'mallet' ? 5 : 1
      const cost = activeTool === 'mallet' ? 1000 : 0
      if (cost > 0 && state.cashCents < cost) return

      sound.playSquash()
      setSquashingId(incident.id)
      setIsScreenShaking(true)

      const rect = (e?.currentTarget as HTMLElement)?.getBoundingClientRect?.()
      const clickX = rect ? rect.width / 2 : 50
      const clickY = rect ? rect.height / 2 : 30
      spawnParticle(
        clickX + (Math.random() * 20 - 10),
        clickY,
        damage > 1 ? `-${damage} CRUSH!` : '-1 SQUASH',
        damage > 1 ? '#F59E0B' : '#EF4444'
      )

      setTimeout(() => {
        setSquashingId(null)
        setIsScreenShaking(false)
      }, 240)

      dispatch({
        type: 'retention.squash_hit',
        incidentId: incident.id,
        accountId: accountId || incident.accountId,
        damage,
        costCents: cost,
      })

      if ((incident.hp ?? 4) - damage <= 0) {
        sound.playCombo(combo + 1)
      }
    },
    [activeTool, state.cashCents, combo, dispatch]
  )

  const handleCoffeeSurge = useCallback(() => {
    if (state.cashCents < 2000) return
    sound.playMilestone()
    dispatch({ type: 'retention.tool_surge', tool: 'coffee' })
    spawnParticle(120, 40, 'COFFEE SURGE CLEARED ALL!', '#10B981')
  }, [state.cashCents, dispatch])

  // Desktop keyboard shortcuts: Space/Enter = smash active, 1 = Slap, 2 = Sledge, 3 = Coffee
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === ' ' || e.key === 'Enter') {
        if (state.accounts.length > 0) {
          e.preventDefault()
          const threatened = liveIncidents.find(i => (i.hp ?? 4) > 0) || liveIncidents[0]
          if (threatened) {
            handleSquash(threatened, threatened.accountId)
          } else {
            const firstAcc = activeTarget || state.accounts[0]
            handleSquash({
              id: `threat-${firstAcc.id}`,
              accountId: firstAcc.id,
              accountName: firstAcc.name,
              title: 'Customer SLA Defense',
              category: 'executive',
              urgencyTicks: 120,
              maxUrgencyTicks: 120,
              consequence: 'Contract Retention',
              hp: 4,
              maxHp: 4,
              threatType: 'piggy',
            }, firstAcc.id)
          }
          return
        }
      }

      const k = e.key.toLowerCase()
      if (k === 'q') {
        e.preventDefault()
        setActiveTool('slap')
        sound.playClick()
      } else if (k === 'w') {
        e.preventDefault()
        setActiveTool('mallet')
        sound.playClick()
      } else if (k === 'e') {
        e.preventDefault()
        handleCoffeeSurge()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.paused, state.accounts, liveIncidents, activeTarget, handleSquash, handleCoffeeSurge])

  if (state.accounts.length === 0) {
    return (
      <div className="room-stage-container" style={{ maxWidth: '640px' }}>
        <div className="room-header" style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <img
            src="/assets/2.5d/nav_retention.png"
            alt="Retention"
            style={{ width: '42px', height: '42px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div className="room-eyebrow" style={{ color: 'var(--accent-retention)' }}>
              <span>04 / RETENTION & ACCOUNT DEFENSE</span>
            </div>
            <h2 className="room-title">Retention Arena Standby</h2>
            <p className="room-subtitle">
              No active paying customers yet. Land contracts in Monetisation to activate continuous account health monitoring.
            </p>
          </div>
        </div>

        <div
          className="room-card"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            background: 'var(--surface-work)',
            border: '1px dashed var(--border-hairline)',
            borderRadius: '16px',
          }}
        >
          <img
            src="/assets/2.5d/nav_retention.png"
            alt="Retention Shield"
            style={{ width: '56px', height: '56px', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' }}
          />

          <div style={{ maxWidth: '400px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-ink)' }}>
              No Accounts to Retain Yet
            </h3>
            <p className="mobile-hide" style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Acquire customer contracts through Demand generation and Monetisation to unlock SLA defense, churn prevention, and founder intervention drills.
            </p>
          </div>

          <button
            onClick={() => {
              sound.playClick()
              dispatch({ type: 'attention.switch', functionId: 'demand' })
            }}
            className="cred-3d-button cred-3d-button-cyan"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              marginTop: '8px',
            }}
          >
            <span>Acquire First Customer in Demand →</span>
            <kbd className="btn-kbd" style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>1</kbd>
          </button>
        </div>
      </div>
    )
  }

  const activeArrDollars = activeTarget
    ? (((activeTarget.baseMrrCents + activeTarget.addonMrrCents) * 12) / 100).toLocaleString()
    : '11,520'

  // Shelf items strictly mapped from actual live customer accounts (up to maxBays priority accounts)
  const activeShelfAccounts = prioritizedAccounts.slice(0, maxBays)

  const shelfSlots = activeShelfAccounts.map((account, idx) => {
    const incident = (state.retentionIncidents ?? []).find(i => i.accountId === account.id || i.id === `threat-${account.id}`) ||
      liveIncidents.find(i => i.accountId === account.id || i.id === `threat-${account.id}`)
    const arrProtected = Math.round(((account.baseMrrCents + account.addonMrrCents) * 12) / 100)
    const isThreatened = account.isThreatened || account.health < 65
    const effectiveHp = incident?.hp ?? 4
    const isDamaged = effectiveHp < 4 || squashingId === (incident?.id || `threat-${account.id}`) || isThreatened
    const threatTitle = incident?.title || account.threatReason || (account.health < 50 ? 'Severe Latency Degradation' : 'Executive Churn Risk')

    return {
      index: idx,
      account,
      incident: incident || {
        id: `threat-${account.id}`,
        accountId: account.id,
        accountName: account.name,
        title: threatTitle,
        category: 'executive' as const,
        urgencyTicks: 120,
        maxUrgencyTicks: 120,
        consequence: 'Contract Retention',
        hp: 4,
        maxHp: 4,
        threatType: 'piggy' as const,
      },
      accountNum: account.id.replace(/\D/g, '') || `${idx + 1}`,
      arrProtected,
      isDamaged,
      isThreatened,
      effectiveHp,
      threatTitle,
      subtitle: isThreatened
        ? `⚠️ At Risk: ${threatTitle}`
        : '✔ SLA Nominal · Contract Stable',
    }
  })

  return (
    <div className="room-stage-container" style={{ maxWidth: '840px', width: '100%', paddingBottom: '12px' }}>
      {/* Homogenous Room Top Header */}
      <div className="room-top-header" style={{ marginBottom: '10px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '620px' }}>
          <img
            src="/assets/2.5d/nav_retention.png"
            alt="Retention"
            style={{ width: '42px', height: '42px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))', flexShrink: 0 }}
          />
          <div className="header-text-group">
            <div className="room-eyebrow" style={{ color: '#0284C7', fontSize: '10px', letterSpacing: '0.14em', marginBottom: '2px', fontWeight: 700 }}>
              <span>04 / RETENTION • CUSTOMER SLA & RECURRING REVENUE DEFENSE</span>
            </div>
            <h2 className="room-title" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-ink)', margin: '0 0 2px 0', lineHeight: 1.2 }}>
              Defend Contracted ARR
            </h2>
            <p className="room-subtitle" style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 4px 0' }}>
              Operations strain and context rot erode customer health over time. Squash emergent churn threats on the defense shelf or deploy direct founder interventions.
            </p>
            <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span>
                Scale: <strong>{maxBays} Sentinel {maxBays === 1 ? 'Bay' : 'Bays'}</strong> (Rank {scaleRank})
              </span>
              <span>·</span>
              <span>
                Craft Yield: <strong>+{craftHealthBonusPct}% SLA Recovery</strong> (Rank {craftRank})
              </span>
              <span>·</span>
              <span style={{ color: automateRank > 0 ? "var(--color-positive)" : "var(--text-secondary)" }}>
                Automate: <strong>{automateRank > 0 ? `Rank ${automateRank} Autonomous CS Swarm` : "Manual Defense"}</strong>
              </span>
              {luckRank > 0 && (
                <>
                  <span>·</span>
                  <span style={{ color: "#A855F7" }}>
                    Luck: <strong>+{luckRank * 10}% Viral Advocacy Skew</strong> (Rank {luckRank})
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className="font-mono" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            COMBO
          </span>
          <div className="font-display" style={{ fontSize: '22px', fontWeight: 800, color: combo > 1 ? 'var(--color-positive)' : 'var(--text-ink)', lineHeight: 1 }}>
            {combo > 0 ? `${combo}×` : '1×'}
          </div>
        </div>
      </div>

      {/* Emergency Churn Incident Banner if retentionEvent is active */}
      {state.retentionEvent?.active && (
        <div
          className="animate-slide-up"
          style={{
            width: '100%',
            marginBottom: '10px',
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 2px 10px rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: 'var(--color-critical)',
                  letterSpacing: '0.06em',
                }}
              >
                CRITICAL CHURN ESCALATION
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-critical)', fontWeight: 800 }}>
                {state.retentionEvent.accountName}
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-bright)', fontWeight: 700 }}>
              {state.retentionEvent.reason} · Risk: <span className="font-mono" style={{ color: 'var(--color-critical)' }}>${Math.round(state.retentionEvent.savedArrCents / 100).toLocaleString()}/yr</span>
            </div>
          </div>

          <div
            className="font-mono"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--color-critical)',
              fontSize: '10px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>DEFEND ON SHELF ↓</span>
            <kbd className="btn-kbd" style={{ background: 'rgba(239, 68, 68, 0.25)', color: 'var(--color-critical)', fontSize: '9px' }}>Space</kbd>
          </div>
        </div>
      )}

      {/* Floating Combat Particles Overlay */}
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
          {particles.map(p => (
            <div
              key={p.id}
              className="animate-float-up"
              style={{
                position: 'absolute',
                left: `${p.x}px`,
                top: `${p.y}px`,
                fontWeight: 800,
                fontSize: '12px',
                color: p.color,
                textShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
            >
              {p.text}
            </div>
          ))}
        </div>

        {/* Real Customer Accounts Defense Shelf */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: shelfSlots.length === 1
              ? 'minmax(260px, 380px)'
              : 'repeat(auto-fit, minmax(200px, 1fr))',
            justifyContent: shelfSlots.length === 1 ? 'center' : 'stretch',
            gap: '10px',
            marginBottom: '10px',
          }}
        >
          {shelfSlots.map((slot) => {
            const isSquashing = squashingId === slot.incident.id
            const imgSrc = slot.isDamaged
              ? '/assets/2.5d/piggy_bank_cracked.png'
              : '/assets/2.5d/piggy_bank_intact.png'

            return (
              <div
                key={slot.index}
                onClick={(e) => handleSquash(slot.incident, slot.account?.id, e)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  padding: '10px 8px 12px 8px',
                  borderRadius: '12px',
                  backgroundColor: slot.isThreatened ? 'rgba(239, 68, 68, 0.04)' : 'rgba(255, 255, 255, 0.55)',
                  border: slot.isThreatened ? '1.5px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-subtle)',
                  transition: 'transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
                  userSelect: 'none',
                }}
                className="rescue-shelf-card"
                title="Click or press Space to squash!"
              >
                {/* Top Label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="font-mono" style={{ fontSize: '8.5px', fontWeight: 800, color: 'var(--text-muted)' }}>
                    SENTINEL // 0{slot.index + 1}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      color: slot.isThreatened ? 'var(--color-critical)' : 'var(--color-positive)',
                      textTransform: 'uppercase',
                      backgroundColor: slot.isThreatened ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      padding: '1px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    {slot.isThreatened ? '⚠️ CHURN THREAT' : '✔ SLA NOMINAL'}
                  </span>
                </div>

                {/* 3D Piggy Bank Asset */}
                <div
                  style={{
                    width: '72px',
                    height: '65px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isSquashing ? 'scale(1.18, 0.82)' : 'scale(1)',
                    transition: 'transform 100ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    marginBottom: '4px',
                  }}
                >
                  <img
                    src={imgSrc}
                    alt="Customer Care Piggy Bank"
                    style={{
                      width: '68px',
                      height: '60px',
                      objectFit: 'contain',
                      filter: slot.isThreatened
                        ? 'drop-shadow(0 6px 10px rgba(239, 68, 68, 0.25))'
                        : 'drop-shadow(0 6px 10px rgba(0, 0, 0, 0.12))',
                    }}
                  />
                </div>

                {/* 4-tick Durability / Squash Meter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '4px' }}>
                  {[0, 1, 2, 3].map(step => (
                    <div
                      key={step}
                      style={{
                        width: '14px',
                        height: '3px',
                        borderRadius: '2px',
                        backgroundColor: step < slot.effectiveHp
                          ? (slot.isThreatened ? '#EF4444' : '#10B981')
                          : 'rgba(0,0,0,0.14)',
                        transition: 'background-color 140ms ease',
                      }}
                      title={`Durability: ${slot.effectiveHp}/4`}
                    />
                  ))}
                  <span className="font-mono" style={{ fontSize: '8.5px', fontWeight: 800, color: 'var(--text-muted)', marginLeft: '2px' }}>
                    {slot.effectiveHp}/4
                  </span>
                </div>

                {/* Health Meter Bar if account present */}
                {slot.account && (
                  <div style={{ width: '100%', maxWidth: '120px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', marginBottom: '1px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Health</span>
                      <span className="font-mono" style={{ fontWeight: 700, color: slot.account.health < 65 ? 'var(--color-critical)' : 'var(--color-positive)' }}>
                        {Math.round(slot.account.health)}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${slot.account.health}%`,
                          height: '100%',
                          backgroundColor: slot.account.health < 65 ? 'var(--color-critical)' : 'var(--color-positive)',
                          transition: 'width 200ms ease',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Dollar Amount */}
                <div className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-ink)', lineHeight: 1.1 }}>
                  ${slot.arrProtected.toLocaleString()}
                </div>

                {/* ARR to protect subtext */}
                <div className="font-mono" style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', margin: '2px 0', textTransform: 'uppercase' }}>
                  ARR · {slot.account?.name || `ACCOUNT ${slot.accountNum}`}
                </div>

                {/* Action / Flavor copy */}
                <div style={{ fontSize: '9.5px', color: slot.isThreatened ? 'var(--color-critical)' : 'var(--text-secondary)', lineHeight: 1.25, maxWidth: '160px', fontWeight: slot.isThreatened ? 600 : 400 }}>
                  {slot.isThreatened ? (
                    <span>Click or [Space] (-{activeTool === 'mallet' ? 5 : 1} HP)</span>
                  ) : (
                    <span>Click for care (+{craftHealthBonusPct}% HP)</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Consolidated Locked Sentinel Bays */}
          {maxBays < 6 && (
            <div
              onClick={() => dispatch({ type: 'attention.switch', functionId: 'operations' })}
              style={{
                padding: '14px 12px',
                borderRadius: '12px',
                border: '1.5px dashed var(--border-graphite)',
                backgroundColor: 'rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '6px',
                minHeight: '130px',
                cursor: 'pointer',
              }}
              title="Upgrade Retention Scale in Skill Canvas [K] to unlock parallel defense bays"
            >
              <div style={{ fontSize: '18px', opacity: 0.6 }}>🛡️🔒</div>
              <div className="font-mono" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)' }}>
                +{6 - maxBays} SENTINEL {6 - maxBays === 1 ? 'BAY' : 'BAYS'} LOCKED
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', maxWidth: '160px', lineHeight: 1.3 }}>
                Upgrade Scale in Skill Canvas <kbd className="btn-kbd" style={{ fontSize: '8px' }}>K</kbd> to unlock parallel account defense bays.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Equippable Squashing Arsenal Bar */}
      <div
        className="room-card"
        style={{
          padding: '8px 12px',
          marginBottom: '10px',
          backgroundColor: 'var(--surface-raised)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              Equipped Squashing Arsenal
            </span>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#0284C7', backgroundColor: 'rgba(2, 132, 199, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
              Craft SLA Armor: +{craftHealthBonusPct}% HP Restored
            </span>
          </div>
          <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
            Switch: <kbd className="btn-kbd" style={{ fontSize: '8.5px', padding: '1px 4px' }}>Q</kbd> <kbd className="btn-kbd" style={{ fontSize: '8.5px', padding: '1px 4px' }}>W</kbd> <kbd className="btn-kbd" style={{ fontSize: '8.5px', padding: '1px 4px' }}>E</kbd>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
          {/* Tool 1: Fast Slap */}
          <button
            onClick={() => { setActiveTool('slap'); sound.playClick() }}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: activeTool === 'slap' ? '2px solid var(--color-brand)' : '1px solid var(--border-hairline)',
              backgroundColor: activeTool === 'slap' ? 'rgba(37, 99, 235, 0.08)' : 'var(--surface-work)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div
              className="font-mono"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 900,
                color: 'var(--color-brand)',
                flexShrink: 0,
              }}
            >
              Q
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-bright)' }}>
                [Q] Quick Slap
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                1 dmg · Free
              </div>
            </div>
          </button>

          {/* Tool 2: Heavy Mallet */}
          <button
            onClick={() => { setActiveTool('mallet'); sound.playClick() }}
            disabled={state.cashCents < 1000}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: activeTool === 'mallet' ? '2px solid var(--accent-monetisation)' : '1px solid var(--border-hairline)',
              backgroundColor: activeTool === 'mallet' ? 'rgba(245, 158, 11, 0.08)' : 'var(--surface-work)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: state.cashCents >= 1000 ? 'pointer' : 'not-allowed',
              opacity: state.cashCents >= 1000 ? 1 : 0.5,
              textAlign: 'left',
            }}
          >
            <img
              src="/assets/2.5d/tool_hotfix_sledge.png"
              alt="Hotfix Sledge"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-bright)' }}>
                [W] Sledge
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                5 dmg · $10
              </div>
            </div>
          </button>

          {/* Tool 3: Coffee Surge */}
          <button
            onClick={handleCoffeeSurge}
            disabled={state.cashCents < 2000 || liveIncidents.length === 0}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: state.cashCents >= 2000 && liveIncidents.length > 0 ? 'pointer' : 'not-allowed',
              opacity: state.cashCents >= 2000 && liveIncidents.length > 0 ? 1 : 0.5,
              textAlign: 'left',
            }}
          >
            <img
              src="/assets/2.5d/tool_coffee_surge.png"
              alt="Coffee Surge"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-positive)' }}>
                [E] Coffee
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                Room Clear · $20
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Customer Fleet Health Radar Strip */}
      <div style={{ width: '100%' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            marginBottom: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Active Accounts Fleet ({state.accounts.length})</span>
          <span style={{ fontSize: '9.5px', color: 'var(--text-secondary)', textTransform: 'none' }}>
            Click account to spotlight
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '135px', overflowY: 'auto', paddingRight: '4px' }}>
          {prioritizedAccounts.map((account) => {
            const isSelected = activeTarget?.id === account.id
            const isThreatened = account.isThreatened || account.health < 65
            const arrDollars = (((account.baseMrrCents + account.addonMrrCents) * 12) / 100).toLocaleString()

            return (
              <div
                key={account.id}
                onClick={() => { sound.playClick(); setSelectedAccountId(account.id) }}
                className="room-card"
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  border: isSelected
                    ? '1.5px solid var(--color-brand)'
                    : isThreatened
                    ? '1px solid var(--color-critical)'
                    : '1px solid var(--border-hairline)',
                  backgroundColor: isSelected
                    ? 'rgba(37, 99, 235, 0.04)'
                    : isThreatened
                    ? 'rgba(239, 68, 68, 0.02)'
                    : 'var(--surface-raised)',
                  transition: 'all 140ms ease',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }}>
                          {account.name}
                        </span>
                        {isThreatened && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              color: 'var(--color-critical)',
                              backgroundColor: 'rgba(239, 68, 68, 0.12)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                            }}
                          >
                            THREATENED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {account.segment.toUpperCase()} · ARR: ${arrDollars}/yr · Addons: {account.addonSlotsUsed}/2
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: account.health >= 65 ? 'var(--color-positive)' : 'var(--color-critical)' }}>
                          {Math.round(account.health)}%
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>Health</div>
                      </div>
                    </div>
                  </div>

                  {/* Account Spotlight on Defense Shelf */}
                  {isSelected && (
                    <div
                      style={{
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-hairline)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span style={{ fontSize: '10.5px', color: isThreatened ? 'var(--color-critical)' : 'var(--text-muted)' }}>
                        {isThreatened
                          ? '⚠️ Account threatened! Squash threat on Defense Shelf above using Slap [1], Sledge [2], or Coffee [3].'
                          : 'Spotlighted on Defense Shelf above. Click piggy bank to apply preventive care (+35% Health).'}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedAccountId(account.id)
                          sound.playClick()
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="cred-3d-button cred-3d-button-light font-mono"
                        style={{
                          padding: '4px 10px',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        Spotlight on Shelf ↑
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
