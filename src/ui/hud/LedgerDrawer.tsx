import React, { useState } from 'react'
import type { LedgerEntry } from '../../engine/types'


interface LedgerDrawerProps {
  ledger: LedgerEntry[]
  isOpen?: boolean
  onToggle?: () => void
}

export const LedgerDrawer: React.FC<LedgerDrawerProps> = ({ ledger, isOpen: controlledIsOpen, onToggle }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen

  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else {
      setInternalIsOpen(!isOpen)
    }
  }

  const entries = [...ledger].reverse()

  const formatDelta = (cents?: number) => {
    if (!cents) return null
    const isPos = cents > 0
    const dollars = Math.abs(cents) / 100
    return (
      <span
        className="font-mono"
        style={{
          color: isPos ? 'var(--color-positive)' : 'var(--color-negative)',
          fontWeight: 600,
          fontSize: '11px',
        }}
      >
        {isPos ? '+' : '-'}${dollars.toLocaleString()}
      </span>
    )
  }

  const formatArrDelta = (cents?: number) => {
    if (cents === undefined || cents === 0) return null
    const isPos = cents > 0
    const dollars = Math.abs(cents) / 100
    return (
      <span
        className="font-mono"
        style={{
          color: isPos ? 'var(--color-positive)' : '#EF4444',
          fontWeight: 700,
          fontSize: '11px',
        }}
      >
        {isPos ? '+' : '-'}${dollars.toLocaleString()}/yr ARR
      </span>
    )
  }

  return (
    <aside
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: isOpen ? '380px' : '0px',
        backgroundColor: '#FFFFFF',
        borderLeft: isOpen ? '1px solid var(--border-hairline)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 50,
        boxShadow: isOpen ? '-12px 0 36px rgba(15, 23, 42, 0.08)' : 'none',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 18px',
          borderBottom: '1px solid var(--border-hairline)',
          cursor: 'pointer',
          backgroundColor: '#FFFFFF',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="font-mono"
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '5px',
              backgroundColor: '#F1F5F9',
              color: 'var(--text-secondary)',
            }}
          >
            AUDIT
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-ink)' }}>
            Ledger & System Trail ({entries.length})
          </span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>→</span>
      </div>

      {isOpen && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Chronological system transactions & causal deltas
          </div>

          {entries.map(item => {
            const isChurn =
              item.id.includes('churn') ||
              item.message.toLowerCase().includes('churn') ||
              (item.deltaArrCents !== undefined && item.deltaArrCents < 0)

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: isChurn ? 'rgba(239, 68, 68, 0.05)' : '#F8FAFC',
                  border: isChurn ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-hairline)',
                  borderLeft: isChurn ? '4px solid #EF4444' : '1px solid var(--border-hairline)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  boxShadow: isChurn ? '0 2px 8px rgba(239, 68, 68, 0.08)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isChurn && (
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '8.5px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          letterSpacing: '0.06em',
                        }}
                      >
                        CHURN
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: isChurn ? '#B91C1C' : 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.category} · Tick {item.tick}
                    </span>
                  </div>
                  <div>
                    {item.deltaArrCents ? formatArrDelta(item.deltaArrCents) : formatDelta(item.deltaCashCents)}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '11.5px',
                    color: isChurn ? '#991B1B' : 'var(--text-ink)',
                    lineHeight: 1.4,
                    fontWeight: isChurn ? 600 : 500,
                  }}
                >
                  {item.message}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}
