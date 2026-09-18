import React from 'react'
import { sound } from '../../audio/soundEngine'

interface KeyboardShortcutsModalProps {
  onClose: () => void
}

interface ShortcutGroup {
  title: string
  items: { key: string; description: string }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Global Navigation & Cockpit',
    items: [
      { key: '1 – 6', description: 'Switch room (Demand, Product, Monetise, Retention, Expansion, Ops)' },
      { key: '7', description: 'Switch to Finance room' },
      { key: 'Space', description: 'Minigame primary action / Smash / Strike' },
      { key: '[ / ]', description: 'Cycle simulation speed (1×, 2×, 5×)' },
      { key: 'M', description: 'Toggle sound mute' },
      { key: 'K or F', description: 'Open Skill Trees & Agent Fleet' },
      { key: 'L', description: 'Toggle Financial Ledger & Audit Trail' },
      { key: '? or /', description: 'Open this Keyboard Shortcuts cheat-sheet' },
      { key: 'Esc', description: 'Close any open modal or drawer' },
    ],
  },
  {
    title: '01 / Demand Room',
    items: [
      { key: '→ or D or Enter', description: 'Pursue / Qualify signal (spend CAC, ship to Product)' },
      { key: '← or A or Esc', description: 'Pass / Discard signal (keep capital)' },
      { key: 'Tab', description: 'Cycle segment filter (All, Creators, Teams, Enterprise)' },
      { key: 'R', description: 'Sweep market channels for fresh prospects' },
      { key: 'Finger Swipe', description: 'Swipe right to pursue, swipe left to pass' },
    ],
  },
  {
    title: '02 / Product Room',
    items: [
      { key: '1 – 2', description: 'Toggle Speed architecture modules' },
      { key: '3 – 4', description: 'Toggle Collaboration architecture modules' },
      { key: '5 – 6', description: 'Toggle Control architecture modules' },
      { key: 'V', description: 'Run integrity verification' },
      { key: 'S or Enter', description: 'Ship verified architecture to Monetisation' },
    ],
  },
  {
    title: '03 / Monetisation Room',
    items: [
      { key: '← / → or ↓ / ↑', description: 'Calibrate monthly price slider ($10 / step, $50 with Shift)' },
      { key: 'Space or Enter', description: 'Lock in Contract & Book ARR' },
    ],
  },
  {
    title: '04 / Retention Room',
    items: [
      { key: 'Space', description: 'Smash and rescue high-risk churn account' },
      { key: '1 or H', description: 'Deploy Hotfix ($25) on top critical account' },
      { key: '2 or F', description: 'Founder Call ($50) on top critical account' },
      { key: '3 or C', description: 'Grant Concession ($100) on top critical account' },
    ],
  },
  {
    title: '06 / Operations Room',
    items: [
      { key: 'Click Node', description: 'Probe telemetry node sector for cash, strain flush, and rot purge' },
      { key: 'Space', description: 'Commit & Cash Out banked telemetry recovery patch' },
      { key: 'Enter', description: 'Reset Diagnostic Rig after trip/claim, or complete active drill' },
    ],
  },
]

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  return (
    <div
      className="modal-backdrop animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--backdrop-modal)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="modal-content animate-slide-up"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--surface-modal)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 24px 64px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          color: 'var(--text-ink)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366F1',
              }}
            >
              <span className="font-mono" style={{ fontSize: '15px', fontWeight: 800 }}>⌘</span>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-ink)', margin: 0, letterSpacing: '-0.02em' }}>
                Cockpit Keyboard Shortcuts
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                High-speed controls for keyboard-first gameplay
              </p>
            </div>
          </div>

          <button
            onClick={() => { sound.playClick(); onClose() }}
            className="cred-3d-button cred-3d-button-light"
            style={{
              padding: '6px 10px',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: 1,
            }}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Shortcut Groups Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {SHORTCUT_GROUPS.map(group => (
            <div
              key={group.title}
              style={{
                backgroundColor: 'var(--surface-work)',
                border: '1px solid var(--border-hairline)',
                borderRadius: '12px',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#0284C7',
                  marginBottom: '10px',
                }}
              >
                {group.title}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                {group.items.map(item => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--text-ink)', fontWeight: 500 }}>{item.description}</span>
                    <kbd
                      style={{
                        display: 'inline-block',
                        padding: '3px 7px',
                        fontSize: '10.5px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        lineHeight: 1,
                        color: 'var(--text-ink)',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
                        marginLeft: '10px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          <span>Press <kbd style={{ padding: '2px 5px', borderRadius: '3px', background: '#FFFFFF', border: '1px solid var(--border-subtle)', color: 'var(--text-ink)' }}>?</kbd> anytime to toggle</span>
          <button
            onClick={() => { sound.playClick(); onClose() }}
            className="cred-3d-button cred-3d-button-cyan"
            style={{
              padding: '7px 18px',
              fontSize: '12px',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
