import React, { useState } from 'react'
import type { GameState } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { sound } from '../../audio/soundEngine'
import { getActiveEvolutionTier } from '../../engine/formulas'
import { getMaxUnlockedSpeed } from '../../engine/constants'

interface TopHudProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onOpenSkillTree: () => void
  onOpenLedger?: () => void
  onOpenShortcuts?: () => void
  onOpenTutorial?: () => void
  onOpenCompany?: () => void
}

export const TopPerimeterHud: React.FC<TopHudProps> = ({
  state,
  dispatch,
  onOpenSkillTree,
  onOpenLedger,
  onOpenShortcuts,
  onOpenTutorial,
  onOpenCompany,
}) => {
  const [muted, setMuted] = useState(sound.isMuted())

  const handleToggleMute = () => {
    const isMutedNow = sound.toggleMute()
    setMuted(isMutedNow)
    if (!isMutedNow) sound.playClick()
  }

  const handleTogglePause = () => {
    sound.playClick()
    dispatch({ type: state.paused ? 'run.resume' : 'run.pause' })
  }

  const handleReset = () => {
    sound.playClick()
    if (window.confirm('Reset current company simulation run back to Day 1?')) {
      dispatch({ type: 'run.reset' })
    }
  }

  const handleCycleSpeed = () => {
    sound.playClick()
    const maxUnlockedSpeed = getMaxUnlockedSpeed(state.founderHistory)
    const speeds = [1, 2, 5].filter(s => s <= maxUnlockedSpeed)
    const currentIdx = speeds.indexOf(state.speedMultiplier)
    const nextSpeed = speeds[(currentIdx + 1) % speeds.length]
    dispatch({ type: 'run.set_speed', speed: nextSpeed })
    if (state.paused) dispatch({ type: 'run.resume' })
  }

  const formatDollars = (cents: number) => {
    const dollars = Math.round(cents / 100)
    if (dollars >= 1_000_000_000) return `$${(dollars / 1_000_000_000).toFixed(2)}B`
    if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`
    if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`
    return `$${dollars.toLocaleString()}`
  }

  // Quarter countdown: 1,800 ticks per quarter (10 ticks/second = 180s)
  const quarterTicks = 1800
  const elapsedInQuarter = state.elapsedTicks % quarterTicks
  const ticksRemaining = Math.max(0, quarterTicks - elapsedInQuarter)
  const secondsRemaining = Math.floor(ticksRemaining / 10)
  const mins = Math.floor(secondsRemaining / 60)
  const secs = secondsRemaining % 60
  const quarterProgressPct = Math.min(100, (elapsedInQuarter / quarterTicks) * 100)

  // 180s obligations: upcoming bills due in next quarter
  const upcomingObligationsCents = (state.mandatoryBills || []).reduce((acc, b) => acc + b.amountCents, 0)
    || (state.opexMonthCents + state.cogsMonthCents) * 3

  // Next operating bill obligation & critical alert threshold:
  const nextBill = state.mandatoryBills?.[0]
  const nextBillAmountCents = nextBill?.amountCents ?? (state.opexMonthCents + state.cogsMonthCents)
  const isOnlyNextBillRemaining = state.cashCents <= nextBillAmountCents && nextBillAmountCents > 0

  return (
    <header className="top-hud top-perimeter-hud">
      {/* DESKTOP AEROSPACE COCKPIT BAR */}
      <div className="top-hud-desktop">
        {/* 1. BRAND IDENTITY */}
        <div className="top-hud-brand" style={{ display: 'flex', flexDirection: 'column', minWidth: '130px', flexShrink: 0 }}>
          <div
            className="font-display"
            style={{
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#0F172A',
            }}
          >
            ONE / PERSON
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: '11px',
              color: '#0284C7',
              textTransform: 'capitalize',
              marginTop: '1px',
            }}
          >
            {getActiveEvolutionTier(state).tier} / 0{state.quarter}
          </div>
        </div>

        {/* 2. CENTER FINANCIAL TELEMETRY & CLOCK */}
        <div className="top-hud-telemetry">
          {/* VALUATION */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '110px' }}>
            <span
              className="font-mono"
              style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: '#64748B' }}
            >
              VALUATION
            </span>
            <span
              className="font-display"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                margin: '1px 0',
              }}
            >
              {formatDollars(state.valuationCents)}
            </span>
            <span className="font-mono" style={{ fontSize: '9px', color: '#94A3B8' }}>
              TARGET $1B
            </span>
          </div>

          {/* ARR */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '110px' }}>
            <span
              className="font-mono"
              style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: '#64748B' }}
            >
              ARR
            </span>
            <span
              className="font-display"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                margin: '1px 0',
              }}
            >
              {formatDollars(state.contractualArrCents)}
            </span>
            <span className="font-mono" style={{ fontSize: '9px', color: '#64748B' }}>
              {state.accounts.length} paying customers
            </span>
          </div>

          {/* LIQUID CASH */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                className="font-mono"
                style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: '#64748B' }}
              >
                LIQUID CASH
              </span>
              {isOnlyNextBillRemaining && (
                <span
                  className="font-mono animate-pulse-critical"
                  style={{
                    fontSize: '8px',
                    fontWeight: 800,
                    color: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    padding: '1px 5px',
                    borderRadius: '9999px',
                    letterSpacing: '0.04em',
                    lineHeight: 1.2,
                  }}
                  title={`Critical treasury alert: Cash ($${Math.round(state.cashCents / 100).toLocaleString()}) only covers next bill ($${Math.round(nextBillAmountCents / 100).toLocaleString()})!`}
                >
                  ⚠️ 1 BILL LEFT
                </span>
              )}
            </div>
            <span
              className="font-display"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: isOnlyNextBillRemaining || state.cashCents < 50_000_00 ? '#E11D48' : '#0F172A',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                margin: '1px 0',
              }}
            >
              {formatDollars(state.cashCents)}
            </span>
            <span className="font-mono" style={{ fontSize: '9px', color: '#64748B' }}>
              {formatDollars(upcomingObligationsCents)} 180s obligations
            </span>
          </div>

          {/* QUARTER PROGRESS */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '100px' }}>
            <span
              className="font-mono"
              style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: '#64748B' }}
            >
              QUARTER {state.quarter}
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                margin: '1px 0',
              }}
            >
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
            <div
              style={{
                width: '100%',
                height: '3px',
                backgroundColor: '#E2E8F0',
                borderRadius: '2px',
                overflow: 'hidden',
                marginTop: '2px',
              }}
            >
              <div
                style={{
                  width: `${quarterProgressPct}%`,
                  height: '100%',
                  backgroundColor: '#0284C7',
                  transition: 'width 250ms ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* 3. AUXILIARY CONTROLS */}
        <div className="top-hud-controls" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Pause / Resume */}
        <button
          onClick={handleTogglePause}
          className={`cred-3d-button font-mono ${state.paused ? 'cred-3d-button-amber' : 'cred-3d-button-light'}`}
          style={{
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          {state.paused ? 'Resume' : 'Pause'}
        </button>

        {/* Speed 1x 2x 5x */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '6px',
            padding: '2px',
          }}
        >
          {(() => {
            const maxUnlockedSpeed = getMaxUnlockedSpeed(state.founderHistory)
            return [1, 2, 5].map(spd => {
              const isLocked = spd > maxUnlockedSpeed
              const lockTooltip = spd === 2
                ? "Locked: Unlock 'Overclocked Silicon' founder relic (Series A / $10M Valuation) to unlock 2× speed"
                : spd === 5
                ? "Locked: Unlock 'Tachyon Chronometer' founder relic (Unicorn / $1B Valuation) to unlock 5× speed"
                : `Set simulation clock to ${spd}×`

              return (
                <button
                  key={spd}
                  onClick={() => {
                    if (isLocked) {
                      sound.playRottenBuzzer()
                      return
                    }
                    sound.playClick()
                    dispatch({ type: 'run.set_speed', speed: spd })
                    if (state.paused) dispatch({ type: 'run.resume' })
                  }}
                  className="font-mono"
                  title={lockTooltip}
                  style={{
                    padding: '3px 7px',
                    fontSize: '10.5px',
                    fontWeight: state.speedMultiplier === spd ? 800 : 500,
                    backgroundColor: state.speedMultiplier === spd && !state.paused ? '#FFFFFF' : 'transparent',
                    color: isLocked ? '#94A3B8' : state.speedMultiplier === spd && !state.paused ? '#0F172A' : '#64748B',
                    borderRadius: '4px',
                    border: 'none',
                    boxShadow: state.speedMultiplier === spd && !state.paused ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    opacity: isLocked ? 0.45 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  {isLocked && <span style={{ fontSize: '8px' }}>🔒</span>}
                  <span>{spd}×</span>
                </button>
              )
            })
          })()}
        </div>

        {/* Shortcuts Modal [K] */}
        {onOpenShortcuts && (
          <button
            onClick={() => {
              sound.playClick()
              onOpenShortcuts()
            }}
            title="Keyboard Shortcuts [K or ?]"
            className="cred-3d-button cred-3d-button-light font-mono"
            style={{
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            K
          </button>
        )}

        {/* Ledger Drawer [L] */}
        {onOpenLedger && (
          <button
            onClick={() => {
              sound.playClick()
              onOpenLedger()
            }}
            title="Financial Ledger [L]"
            className="cred-3d-button cred-3d-button-light font-mono"
            style={{
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            L
          </button>
        )}

        {/* Audio Mute [SND] */}
        <button
          onClick={handleToggleMute}
          title={muted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
          className={`cred-3d-button font-mono ${muted ? 'cred-3d-button-danger' : 'cred-3d-button-light'}`}
          style={{
            padding: '5px 9px',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          SND
        </button>

        {/* Tutorial Guide [?] */}
        {onOpenTutorial && (
          <button
            onClick={() => {
              sound.playClick()
              onOpenTutorial()
            }}
            title="Guided Onboarding [?]"
            className="cred-3d-button cred-3d-button-light font-mono"
            style={{
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            ?
          </button>
        )}

          {/* Reset [RST] */}
          <button
            onClick={handleReset}
            title="Reset Simulation Run"
            className="cred-3d-button cred-3d-button-light font-mono"
            style={{
              padding: '5px 9px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-critical)',
            }}
          >
            RST
          </button>
        </div>
      </div>

      {/* MOBILE RECOMPOSED 2-TIER HUD */}
      <div className="top-hud-mobile">
        {/* Tier 1: Brand + Quarter Countdown + Action Buttons */}
        <div className="top-hud-mobile-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div>
              <div
                className="font-display"
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: '#0F172A',
                  lineHeight: 1.1,
                }}
              >
                ONE / PERSON
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: '9.5px',
                  color: '#0284C7',
                  textTransform: 'capitalize',
                  fontWeight: 600,
                }}
              >
                {getActiveEvolutionTier(state).tier} · Q{state.quarter}
              </div>
            </div>
          </div>

          <div
            className="font-mono"
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#0F172A',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(15, 23, 42, 0.04)',
            }}
          >
            ⏱ {mins}:{secs.toString().padStart(2, '0')}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handleTogglePause}
              className={`cred-3d-button font-mono ${state.paused ? 'cred-3d-button-amber' : 'cred-3d-button-light'}`}
              style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700 }}
              aria-label={state.paused ? 'Resume' : 'Pause'}
            >
              {state.paused ? '▶' : '⏸'}
            </button>

            <button
              onClick={handleCycleSpeed}
              className="cred-3d-button cred-3d-button-light font-mono"
              style={{ padding: '4px 7px', fontSize: '10px', fontWeight: 700 }}
              title="Cycle Speed"
            >
              {state.speedMultiplier}×
            </button>

            <button
              onClick={handleToggleMute}
              className={`cred-3d-button font-mono ${muted ? 'cred-3d-button-danger' : 'cred-3d-button-light'}`}
              style={{ padding: '4px 7px', fontSize: '10px', fontWeight: 700 }}
              title="Mute/Unmute Audio"
            >
              {muted ? '🔇' : '🔊'}
            </button>

            {onOpenSkillTree && (
              <button
                onClick={() => {
                  sound.playClick()
                  onOpenSkillTree()
                }}
                className="cred-3d-button cred-3d-button-light font-mono"
                style={{ padding: '4px 7px', fontSize: '10px', fontWeight: 700 }}
                title="Skill Tree Matrix"
                aria-label="Skill Tree"
              >
                🌳
              </button>
            )}

            {onOpenCompany && (
              <button
                onClick={() => {
                  sound.playClick()
                  onOpenCompany()
                }}
                className="cred-3d-button cred-3d-button-light font-mono"
                style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700 }}
                title="Open Company Vitals"
              >
                🏢
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: 3-Column Compact Telemetry Grid */}
        <div className="top-hud-mobile-telemetry">
          <div className="telemetry-col">
            <span className="telemetry-label font-mono" style={{ color: '#64748B' }}>
              VALUATION
            </span>
            <span className="telemetry-number font-display">
              {formatDollars(state.valuationCents)}
            </span>
          </div>

          <div className="telemetry-col">
            <span className="telemetry-label font-mono" style={{ color: '#64748B' }}>
              ARR ({state.accounts.length})
            </span>
            <span className="telemetry-number font-display">
              {formatDollars(state.contractualArrCents)}
            </span>
          </div>

          <div className="telemetry-col">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span className="telemetry-label font-mono" style={{ color: '#64748B' }}>
                LIQUID CASH
              </span>
              {isOnlyNextBillRemaining && (
                <span
                  className="font-mono animate-pulse-critical"
                  style={{
                    fontSize: '7.5px',
                    fontWeight: 800,
                    color: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    padding: '0 4px',
                    borderRadius: '9999px',
                  }}
                >
                  ⚠️ 1 BILL
                </span>
              )}
            </div>
            <span
              className="telemetry-number font-display"
              style={{ color: isOnlyNextBillRemaining || state.cashCents < 50_000_00 ? '#E11D48' : '#0F172A' }}
            >
              {formatDollars(state.cashCents)}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
