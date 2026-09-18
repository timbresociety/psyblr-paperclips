import React, { useEffect, useState } from 'react'
import type { GameState } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { sound } from '../../audio/soundEngine'
import { getMaxUnlockedSpeed } from '../../engine/constants'

interface PauseModalProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onOpenShortcuts?: () => void
}

export const PauseModal: React.FC<PauseModalProps> = ({ state, dispatch, onOpenShortcuts }) => {
  const [isMuted, setIsMuted] = useState(() => sound.isMuted())
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)

  // Capture Space, Esc, or P to instantly resume
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.code === 'Space' || e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        sound.playClick()
        dispatch({ type: 'run.resume' })
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [dispatch])

  const handleResume = () => {
    sound.playClick()
    dispatch({ type: 'run.resume' })
  }

  const maxUnlockedSpeed = getMaxUnlockedSpeed(state.founderHistory)

  const handleSetSpeed = (speed: number) => {
    if (speed > maxUnlockedSpeed) {
      sound.playRottenBuzzer()
      return
    }
    sound.playClick()
    dispatch({ type: 'run.set_speed', speed })
  }

  const handleToggleMute = () => {
    const muted = sound.toggleMute()
    setIsMuted(muted)
    if (!muted) sound.playClick()
  }

  const handleTriggerReset = () => {
    sound.playClick()
    dispatch({ type: 'run.reset' })
  }

  const year = Math.floor((state.quarter - 1) / 4) + 1
  const quarterInYear = ((state.quarter - 1) % 4) + 1
  const quarterTicks = 1800
  const elapsedInQuarter = state.elapsedTicks % quarterTicks
  const ticksRemaining = quarterTicks - elapsedInQuarter
  const quarterProgressPercent = Math.min(100, Math.round((elapsedInQuarter / quarterTicks) * 100))
  const monthlyBurn = state.opexMonthCents + state.cogsMonthCents

  const strain = state.operations.strainBacklog
  const rot = state.operations.contextRot
  const strainStatusColor =
    strain > 10 ? 'var(--color-critical)' : strain > 4 ? 'var(--color-warning)' : 'var(--color-positive)'
  const rotStatusColor =
    rot > 0.4 ? 'var(--color-critical)' : rot > 0.15 ? 'var(--color-warning)' : 'var(--color-positive)'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Simulation Paused"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--backdrop-modal)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
      onClick={e => {
        e.stopPropagation()
      }}
    >
      <div
        className="animate-slide-up"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: 'var(--surface-modal)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '20px',
          padding: '28px 32px',
          boxShadow: '0 24px 64px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'relative',
        }}
      >
        {/* Header with status pill & pulse */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                border: '1.5px solid #0EA5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284C7',
                boxShadow: '0 2px 10px rgba(14, 165, 233, 0.18)',
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-1px' }}>❚❚</span>
            </div>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#0284C7',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#0EA5E9',
                    display: 'inline-block',
                    boxShadow: '0 0 6px #0EA5E9',
                  }}
                />
                Executive Command Freeze
              </div>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-ink)',
                  margin: '2px 0 0 0',
                }}
              >
                Simulation Suspended
              </h1>
            </div>
          </div>

          <div
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#0284C7',
              letterSpacing: '0.04em',
            }}
          >
            STATE FROZEN
          </div>
        </div>

        {/* Telemetry Snapshot Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}
        >
          {/* Card 1: Quarter Period */}
          <div
            style={{
              backgroundColor: 'var(--surface-work)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <span className="font-mono" style={{ fontSize: '9px', fontWeight: 800, color: '#0284C7', letterSpacing: '0.08em' }}>[TIME]</span>
              Timeline & Period
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text-ink)',
                marginTop: '4px',
              }}
            >
              Q{quarterInYear} · Year {year}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Quarter progress: {quarterProgressPercent}% ({Math.ceil(ticksRemaining / 10)}s remaining)
            </div>
          </div>

          {/* Card 2: Liquid Cash */}
          <div
            style={{
              backgroundColor: 'var(--surface-work)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <span className="font-mono" style={{ fontSize: '9px', fontWeight: 800, color: 'var(--color-positive)', letterSpacing: '0.08em' }}>[CASH]</span>
              Liquid Treasury
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--color-positive)',
                marginTop: '4px',
              }}
            >
              ${(state.cashCents / 100).toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Burn: ${(monthlyBurn / 100).toLocaleString()}/mo
            </div>
          </div>

          {/* Card 3: Contractual ARR */}
          <div
            style={{
              backgroundColor: 'var(--surface-work)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <span className="font-mono" style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent-monetisation)', letterSpacing: '0.08em' }}>[ARR]</span>
              Contractual ARR
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text-ink)',
                marginTop: '4px',
              }}
            >
              ${(state.contractualArrCents / 100).toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {state.accounts.length} enterprise account{state.accounts.length === 1 ? '' : 's'} active
            </div>
          </div>

          {/* Card 4: Operating Stability */}
          <div
            style={{
              backgroundColor: 'var(--surface-work)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <span className="font-mono" style={{ fontSize: '9px', fontWeight: 800, color: strainStatusColor, letterSpacing: '0.08em' }}>[OPS]</span>
              Operations Vitals
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-ink)',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span>
                Strain: <strong style={{ color: strainStatusColor }}>{strain.toFixed(1)}</strong>
              </span>
              <span>
                Rot: <strong style={{ color: rotStatusColor }}>{(rot * 100).toFixed(0)}%</strong>
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Attention docked at: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{state.activeFunction}</span> room
            </div>
          </div>
        </div>

        {/* Primary Hero Resume Button */}
        <div>
          <button
            onClick={handleResume}
            className="cred-3d-button cred-3d-button-cyan"
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.02em',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '14px', lineHeight: 1 }}>▶</span>
            <span>Resume Simulation</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
              <kbd
                className="btn-kbd"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                Space
              </kbd>
              <kbd
                className="btn-kbd"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                Esc
              </kbd>
              <kbd
                className="btn-kbd"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                P
              </kbd>
            </div>
          </button>
        </div>

        {/* Cockpit Tuning Strip: Speed, Audio, Shortcuts */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-hairline)',
          }}
        >
          {/* Speed selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>
              Clock Speed:
            </span>
            {[1, 2, 5].map(spd => {
              const active = state.speedMultiplier === spd
              const isLocked = spd > maxUnlockedSpeed
              const lockTooltip = spd === 2
                ? "Locked: Unlock 'Overclocked Silicon' founder relic (Series A / $10M Valuation) to unlock 2× speed"
                : spd === 5
                ? "Locked: Unlock 'Tachyon Chronometer' founder relic (Unicorn / $1B Valuation) to unlock 5× speed"
                : `Set clock speed to ${spd}×`

              return (
                <button
                  key={spd}
                  onClick={() => handleSetSpeed(spd)}
                  title={lockTooltip}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: active ? 800 : 600,
                    borderRadius: '6px',
                    backgroundColor: active ? '#0EA5E9' : 'var(--surface-work)',
                    color: isLocked ? '#94A3B8' : active ? '#FFFFFF' : 'var(--text-secondary)',
                    border: active ? '1px solid #0EA5E9' : '1px solid var(--border-hairline)',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    opacity: isLocked ? 0.45 : 1,
                    transition: 'all 120ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  {isLocked && <span style={{ fontSize: '9px' }}>🔒</span>}
                  <span>{spd}×</span>
                </button>
              )
            })}
          </div>

          {/* Sound & Shortcuts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleToggleMute}
              className="cred-3d-button cred-3d-button-light"
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                gap: '6px',
              }}
              title="Toggle Synthesizer Sound (M)"
            >
              <span className="font-mono" style={{ fontSize: '10px', fontWeight: 800, color: isMuted ? 'var(--color-critical)' : 'inherit' }}>{isMuted ? '[MUT]' : '[SND]'}</span>
              <span style={{ color: isMuted ? 'var(--color-critical)' : 'inherit' }}>{isMuted ? 'Audio Muted' : 'Audio On'}</span>
              <kbd className="btn-kbd">M</kbd>
            </button>

            {onOpenShortcuts && (
              <button
                onClick={() => {
                  sound.playClick()
                  onOpenShortcuts()
                }}
                className="cred-3d-button cred-3d-button-light"
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  gap: '6px',
                }}
              >
                <span className="font-mono" style={{ fontSize: '10px', fontWeight: 800 }}>[?]</span>
                <span>Shortcuts</span>
                <kbd className="btn-kbd">?</kbd>
              </button>
            )}
          </div>
        </div>

        {/* Danger zone: Reset run option */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '4px',
          }}
        >
          {isConfirmingReset ? (
            <div
              className="animate-slide-up"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <span className="font-mono" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-critical)' }}>[!]</span>
              <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600 }}>Abandon current run and reset?</span>
              <button
                onClick={handleTriggerReset}
                className="cred-3d-button cred-3d-button-danger"
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                }}
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setIsConfirmingReset(false)}
                className="cred-3d-button cred-3d-button-light"
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingReset(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-critical)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <span style={{ fontSize: '12px' }}>↺</span>
              <span>Reset & Restart Simulation Run</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
