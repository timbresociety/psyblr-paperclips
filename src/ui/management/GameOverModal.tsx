import React from 'react'
import type { GameState } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { sound } from '../../audio/soundEngine'

interface GameOverModalProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ state, dispatch }) => {
  if (state.runStatus !== 'failed') return null

  const handleReset = () => {
    sound.playClick()
    dispatch({ type: 'run.reset' })
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleReset()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--backdrop-modal)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        padding: '12px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--surface-modal)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '20px',
          padding: '32px 28px',
          boxShadow: '0 24px 64px -12px rgba(239, 68, 68, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1.5px solid var(--color-critical)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '24px',
            fontWeight: 900,
            color: 'var(--color-critical)',
            boxShadow: '0 2px 12px rgba(239, 68, 68, 0.18)',
          }}
        >
          !
        </div>

        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-critical)', fontWeight: 800 }}>
            [ TERMINAL AUDIT · INVOLUNTARY DISSOLUTION ]
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-ink)', marginTop: '6px', letterSpacing: '-0.02em' }}>
            COMPANY SHUTDOWN
          </h2>
        </div>

        {/* Post-Mortem Cause */}
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FEE2E2',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--color-critical)', fontWeight: 800, letterSpacing: '0.08em' }}>
            Root Cause Post-Mortem
          </div>
          <p style={{ fontSize: '13px', color: '#7F1D1D', marginTop: '6px', lineHeight: 1.5, fontWeight: 500 }}>
            {state.failureReason ?? 'Inability to satisfy mandatory cash obligations.'}
          </p>
        </div>

        {/* Run Performance Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            width: '100%',
            backgroundColor: 'var(--surface-work)',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid var(--border-hairline)',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>SURVIVED</div>
            <div className="font-mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-ink)', marginTop: '3px' }}>
              Q{state.quarter} M{state.monthInQuarter}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>CLOSING ARR</div>
            <div className="font-mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-positive)', marginTop: '3px' }}>
              ${Math.round(state.eligibleArrCents / 100).toLocaleString()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>FOUNDER RUNS</div>
            <div className="font-mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-monetisation)', marginTop: '3px' }}>
              #{state.founderHistory.totalRuns}
            </div>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="cred-3d-button cred-3d-button-cyan"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.02em',
            gap: '8px',
          }}
        >
          <span>Found Next Company (Restart Run)</span>
          <kbd className="btn-kbd" style={{ background: 'rgba(0,0,0,0.15)', color: 'inherit', fontSize: '9.5px', padding: '2px 6px' }}>
            SPACE / ENTER
          </kbd>
          <span>→</span>
        </button>
      </div>
    </div>
  )
}
