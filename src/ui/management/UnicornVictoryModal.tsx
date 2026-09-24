import React, { useEffect } from 'react'
import type { GameState } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { sound } from '../../audio/soundEngine'

interface UnicornVictoryProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

export const UnicornVictoryModal: React.FC<UnicornVictoryProps> = ({ state, dispatch }) => {
  const isVisible = state.runStatus === 'unicorn_victory'

  useEffect(() => {
    if (isVisible) {
      sound.playMilestone()
    }
  }, [isVisible])

  if (!isVisible) return null

  const handleContinue = () => {
    sound.playClick()
    dispatch({ type: 'run.resume' })
  }

  const handleReset = () => {
    sound.playClick()
    dispatch({ type: 'run.reset' })
  }

  const activeMinutes = (state.elapsedTicks / 600).toFixed(1)
  const finalArrDollars = (state.eligibleArrCents / 100).toLocaleString()
  const founderEquityPercent = Math.round(((state.vc?.founderOwnershipRatio ?? 1) * 100) * 10) / 10
  const founderEquityDisplay = `${founderEquityPercent}%`

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
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--surface-modal)',
          border: '1.5px solid rgba(14, 165, 233, 0.4)',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 24px 64px -12px rgba(14, 165, 233, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Iridescent Badge */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 50%, #A855F7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(14, 165, 233, 0.35)',
          }}
        >
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em' }}>$1B</span>
        </div>

        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#0284C7', fontWeight: 800 }}>
            [ ASCENSION · $1,000,000,000 VALUATION MILESTONE ]
          </div>
          <h1
            style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.03em', marginTop: '8px', color: 'var(--text-ink)' }}
          >
            VALIDATED $1B UNICORN
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '460px', lineHeight: 1.55 }}>
            You achieved what was promised in the memes: a 1-person founder operating an autonomous AI-assisted software machine valued at over <strong>$1 Billion</strong>.
          </p>
        </div>

        {/* Operating Scorecard */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            width: '100%',
            backgroundColor: 'var(--surface-work)',
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid var(--border-hairline)',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Active Time</div>
            <div className="font-mono" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-ink)', marginTop: '2px' }}>
              {activeMinutes} mins
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Eligible ARR</div>
            <div className="font-mono" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-positive)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ${finalArrDollars}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Quarter</div>
            <div className="font-mono" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--accent-monetisation)', marginTop: '2px' }}>
              Q{state.quarter}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Founder Equity</div>
            <div className="font-mono" style={{ fontSize: '17px', fontWeight: 800, color: '#0284C7', marginTop: '2px' }}>
              {founderEquityDisplay}
            </div>
          </div>
        </div>

        {/* Upgrades Loadout */}
        {state.activeRelics.length > 0 && (
          <div style={{ width: '100%', textAlign: 'left' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Upgrades in Play:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {state.activeRelics.map(r => (
                <span
                  key={r.id}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-work)',
                    color: 'var(--text-ink)',
                    border: '1px solid var(--border-hairline)',
                    fontWeight: 600,
                  }}
                >
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button
            onClick={handleReset}
            className="cred-3d-button cred-3d-button-light"
            style={{
              flex: 1,
              padding: '14px',
              fontSize: '13px',
              gap: '8px',
            }}
          >
            <span>↺</span>
            <span>New Founder Run</span>
          </button>

          <button
            onClick={handleContinue}
            className="cred-3d-button cred-3d-button-cyan"
            style={{
              flex: 1,
              padding: '14px',
              fontWeight: 800,
              fontSize: '13px',
              gap: '8px',
            }}
          >
            <span>Continue in Endless Mode</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
