import React, { useEffect } from 'react'
import type { GameState } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { FOUNDER_ACHIEVEMENTS_AND_RELICS, getMaxUnlockedSpeed } from '../../engine/constants'
import { sound } from '../../audio/soundEngine'

interface FounderRelicsModalProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onClose: () => void
}

export const FounderRelicsModal: React.FC<FounderRelicsModalProps> = ({
  state,
  dispatch,
  onClose,
}) => {
  useEffect(() => {
    sound.playClick()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const [activeTab, setActiveTab] = React.useState<'all' | 'easy' | 'effort'>('all')

  const unlockedIds = new Set(state.founderHistory?.unlockedAchievementIds || [])
  const equippedId = state.founderHistory?.equippedFounderRelicId
  const maxSpeed = getMaxUnlockedSpeed(state.founderHistory)
  const totalUnlocked = FOUNDER_ACHIEVEMENTS_AND_RELICS.filter(
    a => unlockedIds.has(a.id) || unlockedIds.has(a.relicId)
  ).length
  const easyUnlocked = FOUNDER_ACHIEVEMENTS_AND_RELICS.filter(
    a => a.difficulty === 'easy' && (unlockedIds.has(a.id) || unlockedIds.has(a.relicId))
  ).length
  const effortUnlocked = FOUNDER_ACHIEVEMENTS_AND_RELICS.filter(
    a => a.difficulty === 'effort' && (unlockedIds.has(a.id) || unlockedIds.has(a.relicId))
  ).length

  const handleEquip = (relicId: string) => {
    sound.playCashCascade()
    dispatch({ type: 'founder.equip_relic', relicId })
  }

  const displayedRelics = FOUNDER_ACHIEVEMENTS_AND_RELICS.filter(item => {
    if (activeTab === 'easy') return item.difficulty === 'easy'
    if (activeTab === 'effort') return item.difficulty === 'effort'
    return true
  })

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
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          backgroundColor: 'var(--surface-modal, #FFFFFF)',
          color: 'var(--text-ink, #0F172A)',
          border: '1px solid var(--border-hairline, rgba(15, 23, 42, 0.08))',
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: '0 24px 64px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div
              className="font-mono"
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: 'var(--accent-monetisation, #D97706)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              META-PROGRESSION CODEX // PERMANENT FOUNDER RELICS
            </div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--text-ink, #0F172A)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Founder Relics & End-of-Run Achievements
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', marginTop: '4px', margin: 0 }}>
              Enduring operational monuments earned across lifecycles. Unlocking relics grants permanent meta-buffs and unlocks high-frequency simulation speeds.
            </p>
          </div>

          <button
            onClick={() => {
              sound.playClick()
              onClose()
            }}
            className="cred-3d-button cred-3d-button-light"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              borderRadius: '8px',
            }}
          >
            Close [Esc]
          </button>
        </div>

        {/* Speed Status & Unlock Overview Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            padding: '10px 16px',
            backgroundColor: '#F8FAFC',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            borderRadius: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="font-mono" style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                Relics Unlocked
              </span>
              <span className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                {totalUnlocked} / {FOUNDER_ACHIEVEMENTS_AND_RELICS.length}
              </span>
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(15, 23, 42, 0.1)' }} />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="font-mono" style={{ fontSize: '9px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                Max Simulation Speed
              </span>
              <span className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: '#0284C7' }}>
                {maxSpeed}× Real-Time
              </span>
            </div>
          </div>

          {/* Speed Milestones Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: maxSpeed >= 2 ? 'rgba(16, 185, 129, 0.1)' : '#F1F5F9',
                border: `1px solid ${maxSpeed >= 2 ? 'rgba(16, 185, 129, 0.3)' : '#E2E8F0'}`,
              }}
            >
              <span style={{ fontSize: '11px' }}>{maxSpeed >= 2 ? '⚡' : '🔒'}</span>
              <span className="font-mono" style={{ fontSize: '10px', fontWeight: 700, color: maxSpeed >= 2 ? '#059669' : '#64748B' }}>
                2× Speed {maxSpeed >= 2 ? 'Active' : 'Locked'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: maxSpeed >= 5 ? 'rgba(16, 185, 129, 0.1)' : '#F1F5F9',
                border: `1px solid ${maxSpeed >= 5 ? 'rgba(16, 185, 129, 0.3)' : '#E2E8F0'}`,
              }}
            >
              <span style={{ fontSize: '11px' }}>{maxSpeed >= 5 ? '🌀' : '🔒'}</span>
              <span className="font-mono" style={{ fontSize: '10px', fontWeight: 700, color: maxSpeed >= 5 ? '#059669' : '#64748B' }}>
                5× Speed {maxSpeed >= 5 ? 'Active' : 'Locked'}
              </span>
            </div>
          </div>
        </div>

        {/* Difficulty Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                border: activeTab === 'all' ? '1px solid #0284C7' : '1px solid #E2E8F0',
                backgroundColor: activeTab === 'all' ? '#0284C7' : '#F8FAFC',
                color: activeTab === 'all' ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              All Relics ({FOUNDER_ACHIEVEMENTS_AND_RELICS.length})
            </button>
            <button
              onClick={() => setActiveTab('easy')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                border: activeTab === 'easy' ? '1px solid #059669' : '1px solid #E2E8F0',
                backgroundColor: activeTab === 'easy' ? '#059669' : '#F8FAFC',
                color: activeTab === 'easy' ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                transition: 'all 120ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🌱 Founder Essentials ({easyUnlocked}/6)</span>
            </button>
            <button
              onClick={() => setActiveTab('effort')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                border: activeTab === 'effort' ? '1px solid #D97706' : '1px solid #E2E8F0',
                backgroundColor: activeTab === 'effort' ? '#D97706' : '#F8FAFC',
                color: activeTab === 'effort' ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                transition: 'all 120ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>👑 Legendary Pinnacles ({effortUnlocked}/6)</span>
            </button>
          </div>

          <div className="font-mono" style={{ fontSize: '10px', color: '#64748B' }}>
            {activeTab === 'easy'
              ? 'Easy to unlock // Solid starter operational buffs'
              : activeTab === 'effort'
              ? 'Genuine effort // Transcendent founder power'
              : 'Half Essentials • Half High-Effort Pinnacles'}
          </div>
        </div>

        {/* 12 Relic Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px',
            paddingRight: '4px',
          }}
        >
          {displayedRelics.map((item, idx) => {
            const isUnlocked = unlockedIds.has(item.id) || unlockedIds.has(item.relicId)
            const isEquipped = equippedId === item.relicId || (!equippedId && idx === 0 && isUnlocked)
            const isEffort = item.difficulty === 'effort'
            const isMonolith = item.id === 'ach_solopreneur_monolith'

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: isUnlocked ? '#FFFFFF' : '#F8FAFC',
                  border: isEquipped
                    ? '1.5px solid #0284C7'
                    : isMonolith
                    ? '1.5px solid #F59E0B'
                    : isUnlocked
                    ? isEffort
                      ? '1px solid rgba(217, 119, 6, 0.25)'
                      : '1px solid rgba(15, 23, 42, 0.1)'
                    : '1px dashed #CBD5E1',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  opacity: isUnlocked ? 1 : 0.65,
                  position: 'relative',
                  boxShadow: isEquipped
                    ? '0 4px 12px rgba(2, 132, 199, 0.14)'
                    : isMonolith
                    ? '0 4px 16px rgba(245, 158, 11, 0.12)'
                    : isUnlocked
                    ? '0 1px 3px rgba(15, 23, 42, 0.04)'
                    : 'none',
                  transition: 'all 160ms ease',
                }}
              >
                <div>
                  {/* Card Header: Icon & Difficulty Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: isEffort ? 'rgba(217, 119, 6, 0.06)' : '#F1F5F9',
                        border: isEffort ? '1px solid rgba(217, 119, 6, 0.15)' : '1px solid rgba(15, 23, 42, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        filter: isUnlocked ? 'none' : 'grayscale(100%)',
                      }}
                    >
                      <img
                        src={item.unlockedRelic.icon}
                        alt={item.unlockedRelic.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '8px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: isEffort ? 'rgba(217, 119, 6, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: isEffort ? '#D97706' : '#059669',
                          border: isEffort ? '1px solid rgba(217, 119, 6, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isMonolith ? '🔥 HERO MONOLITH' : isEffort ? '👑 GENUINE EFFORT' : '🌱 ESSENTIAL'}
                      </span>

                      {item.unlockedRelic.speedBonus && (
                        <span
                          className="font-mono"
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(2, 132, 199, 0.1)',
                            color: '#0284C7',
                            border: '1px solid rgba(2, 132, 199, 0.25)',
                          }}
                        >
                          {item.unlockedRelic.speedBonus}× SPEED
                        </span>
                      )}
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '8.5px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: isUnlocked ? 'rgba(16, 185, 129, 0.1)' : '#E2E8F0',
                          color: isUnlocked ? '#059669' : '#64748B',
                          border: isUnlocked ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #CBD5E1',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isUnlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                  </div>

                  {/* Relic & Achievement Name */}
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', lineHeight: 1.25 }}>
                    {item.unlockedRelic.name}
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: '9px',
                      color: isEffort ? 'var(--accent-monetisation, #D97706)' : '#64748B',
                      marginTop: '2px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: 700,
                    }}
                  >
                    {item.name}
                  </div>

                  {/* Buff Summary */}
                  <div
                    className="font-mono"
                    style={{
                      fontSize: '9.5px',
                      color: isEffort ? '#0F172A' : '#1E293B',
                      marginTop: '6px',
                      lineHeight: 1.35,
                      backgroundColor: isEffort ? '#FFFBEB' : '#F8FAFC',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: isEffort ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(15, 23, 42, 0.06)',
                    }}
                  >
                    {item.unlockedRelic.effectSummary}
                  </div>

                  {/* Unlock Condition */}
                  <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '6px', lineHeight: 1.35 }}>
                    <strong style={{ color: '#334155' }}>Requirement:</strong> {item.description}
                  </div>
                </div>

                {/* Bottom Action: Equip */}
                <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(15, 23, 42, 0.06)' }}>
                  {isUnlocked ? (
                    <button
                      onClick={() => handleEquip(item.relicId)}
                      disabled={isEquipped}
                      className={`cred-3d-button ${isEquipped ? 'cred-3d-button-cyan' : isEffort ? 'cred-3d-button-amber' : 'cred-3d-button-light'}`}
                      style={{
                        width: '100%',
                        padding: '5px 10px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        cursor: isEquipped ? 'default' : 'pointer',
                      }}
                    >
                      {isEquipped ? '✔ ACTIVE FOUNDER RELIC' : 'Equip Relic'}
                    </button>
                  ) : (
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '9px',
                        color: isEffort ? '#B45309' : '#94A3B8',
                        textAlign: 'center',
                        padding: '4px',
                      }}
                    >
                      🔒 {isEffort ? 'Requires genuine effort in run to unlock' : 'Complete requirement in run to unlock'}
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
