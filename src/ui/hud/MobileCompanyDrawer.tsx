import React from 'react'
import type { GameState } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { sound } from '../../audio/soundEngine'
import { CompanyRail } from './CompanyRail'

interface MobileCompanyDrawerProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  isOpen: boolean
  onClose: () => void
  onOpenLedger: () => void
  onOpenSkillTree: () => void
  onOpenFounderRelics: () => void
}

export const MobileCompanyDrawer: React.FC<MobileCompanyDrawerProps> = ({
  state,
  dispatch,
  isOpen,
  onClose,
  onOpenLedger,
  onOpenSkillTree,
  onOpenFounderRelics,
}) => {
  if (!isOpen) return null

  const handleClose = () => {
    sound.playClick()
    onClose()
  }

  return (
    <div className="mobile-company-backdrop" onClick={handleClose}>
      <div
        className="mobile-company-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Company Vitals"
      >
        {/* Drawer Drag Bar & Close Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 16px 8px 16px',
            borderBottom: '1px solid var(--border-hairline)',
            backgroundColor: '#FFFFFF',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Visual Grab Handle */}
          <div
            style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'var(--border-graphite)',
              marginBottom: '10px',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                className="font-mono"
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: 'var(--text-ink)',
                  textTransform: 'uppercase',
                }}
              >
                THE COMPANY & INFRASTRUCTURE
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
            </div>

            <button
              onClick={handleClose}
              style={{
                background: 'rgba(15, 23, 42, 0.06)',
                border: 'none',
                borderRadius: '9999px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              aria-label="Close Company Sheet"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Company Rail Contents */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <CompanyRail
            state={state}
            dispatch={dispatch}
            onOpenLedger={() => {
              onClose()
              onOpenLedger()
            }}
            onOpenSkillTree={() => {
              onClose()
              onOpenSkillTree()
            }}
            onOpenFounderRelics={() => {
              onClose()
              onOpenFounderRelics()
            }}
            isDrawer={true}
          />
        </div>
      </div>
    </div>
  )
}
