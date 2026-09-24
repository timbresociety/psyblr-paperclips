import React from 'react'
import type { GameState, Relic, Consumable } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { sound } from '../../audio/soundEngine'
import {
  RELIC_PRICING,
  CONSUMABLE_PRICING,
  QUARTER_REROLL_BASE_COST_CENTS,
  MAX_CONSUMABLE_SLOTS,
} from '../../engine/constants'
import { getMilestoneUpgradeAsset } from '../../engine/assets'
import { reconcileQuarterBridge } from '../../engine/formulas'


interface QuarterReviewProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

const CONSUMABLE_ASSETS: Record<string, string> = {
  hn_blitz: '/assets/2.5d/node_rebate_token.png',
  emergency_safe: '/assets/2.5d/node_golden_core.png',
  war_room: '/assets/2.5d/tool_coffee_surge.png',
  exec_golf: '/assets/2.5d/shield_perimeter_secure.png',
  kernel_purge: '/assets/2.5d/node_memory_purge.png',
  defense_rfp: '/assets/2.5d/threat_contract_breach.png',
  tech_raid: '/assets/2.5d/tool_hotfix_sledge.png',
  debt_bridge: '/assets/2.5d/node_golden_core.png',
}

const RARITY_THEME: Record<
  'rare' | 'monumental' | 'ethereal',
  { color: string; border: string; bg: string; glow: string }
> = {
  rare: {
    color: '#38BDF8',
    border: 'rgba(56, 189, 248, 0.35)',
    bg: 'rgba(56, 189, 248, 0.08)',
    glow: 'none',
  },
  monumental: {
    color: '#F59E0B',
    border: 'rgba(245, 158, 11, 0.45)',
    bg: 'rgba(245, 158, 11, 0.08)',
    glow: '0 0 16px rgba(245, 158, 11, 0.2)',
  },
  ethereal: {
    color: '#C084FC',
    border: 'rgba(192, 132, 252, 0.55)',
    bg: 'rgba(192, 132, 252, 0.12)',
    glow: '0 0 24px rgba(192, 132, 252, 0.35)',
  },
}

export const QuarterReviewModal: React.FC<QuarterReviewProps> = ({ state, dispatch }) => {
  const isVisible = Boolean(state.quarterReviewPending)

  React.useEffect(() => {
    if (!isVisible) return
    const handleKeyDown = (e: KeyboardEvent) => {
      // Quarter review modal is strictly non-dismissable via keyboard shortcuts or escape
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isVisible])

  if (!isVisible) return null

  const rerollCostCents = QUARTER_REROLL_BASE_COST_CENTS * Math.max(1, Math.floor(state.quarter / 2))
  const canAffordReroll = state.cashCents >= rerollCostCents
  const lockedRelicIds = new Set(state.lockedQuarterRelicIds || [])
  const lockedConsIds = new Set(state.lockedQuarterConsumableIds || [])
  const currentInvLength = (state.consumablesInventory || []).length

  const handlePickRelic = (relic: Relic) => {
    const cost = relic.costCents ?? RELIC_PRICING[relic.rarity] ?? 0
    if (state.cashCents < cost) return
    sound.playMilestone()
    dispatch({ type: 'relic.select', relicId: relic.id })
  }

  const handleToggleLockRelic = (relicId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    sound.playClick()
    dispatch({ type: 'relic.lock', relicId })
  }

  const handlePickConsumable = (item: Consumable) => {
    const cost = item.costCents ?? CONSUMABLE_PRICING[item.rarity] ?? 0
    if (state.cashCents < cost || currentInvLength >= MAX_CONSUMABLE_SLOTS) return
    sound.playMilestone()
    dispatch({ type: 'consumable.select', consumableId: item.id })
  }

  const handleToggleLockConsumable = (consumableId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    sound.playClick()
    dispatch({ type: 'consumable.lock', consumableId })
  }

  const handleReroll = () => {
    if (!canAffordReroll) return
    sound.playCashTick()
    dispatch({ type: 'quarter.reroll' })
  }

  const handleDismiss = () => {
    sound.playClick()
    dispatch({ type: 'quarter.close_review' })
  }

  const bridge = reconcileQuarterBridge(state)
  const formatArr = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`

  return (
    <div
      onClick={(e) => {
        // Quarter review modal is non-dismissable by clicking backdrop / elsewhere
        e.stopPropagation()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--backdrop-modal)',
        backdropFilter: 'blur(16px) saturate(140%)',
        WebkitBackdropFilter: 'blur(16px) saturate(140%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
      }}
    >
      <div
        className="animate-slide-up"
        onClick={(e) => {
          e.stopPropagation()
        }}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          backgroundColor: 'var(--surface-modal)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '18px',
          boxShadow: '0 24px 64px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        {/* Fixed Top Header & Re-roll Button */}
        <div
          style={{
            padding: '20px 24px 16px 24px',
            borderBottom: '1px solid var(--border-hairline)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
            flexShrink: 0,
            backgroundColor: 'var(--surface-modal)',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-monetisation)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span className="font-mono" style={{ fontSize: '10px', color: 'var(--accent-monetisation)', fontWeight: 800 }}>[BOARD AUDIT]</span>
              Quarter {state.quarter - 1} Board Review & Architecture Shop
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-ink)', marginTop: '4px', letterSpacing: '-0.02em', margin: 0 }}>
              Operating Audit & Strategic Procurements
            </h2>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
              Procure architectural relics, lock critical technologies across quarters, and holster tactical founder powers.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Treasury Cash
              </div>
              <div className="font-mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-positive)' }}>
                ${Math.round(state.cashCents / 100).toLocaleString()}
              </div>
            </div>

            <button
              onClick={handleReroll}
              disabled={!canAffordReroll}
              className={`cred-3d-button ${canAffordReroll ? 'cred-3d-button-light' : 'cred-3d-button-disabled'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '6px',
                cursor: canAffordReroll ? 'pointer' : 'not-allowed',
              }}
              title="Reroll unlocked relics and powers"
            >
              <span style={{ fontSize: '12px' }}>↺</span>
              <span>Reroll (${Math.round(rerollCostCents / 100).toLocaleString()})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px 28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* ARR Reconciliation Bridge */}
          <div
            style={{
              backgroundColor: 'var(--surface-work)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '2px' }}>
            Audited ARR Bridge
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Opening Eligible ARR</span>
            <span className="font-mono">{formatArr(bridge.openingArrCents)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--color-positive)' }}>+ New Customer Bookings</span>
            <span className="font-mono" style={{ color: 'var(--color-positive)' }}>+{formatArr(bridge.newArrCents)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--accent-expansion)' }}>+ Account Add-On Expansions</span>
            <span className="font-mono" style={{ color: 'var(--accent-expansion)' }}>+{formatArr(bridge.expansionArrCents)}</span>
          </div>

          {(bridge.contractionArrCents ?? 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--color-critical)' }}>- Account Contractions</span>
              <span className="font-mono" style={{ color: 'var(--color-critical)' }}>-{formatArr(bridge.contractionArrCents)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--color-critical)' }}>- Churned / Cancelled ARR</span>
            <span className="font-mono" style={{ color: 'var(--color-critical)' }}>-{formatArr(bridge.churnArrCents)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13.5px',
              fontWeight: 800,
              paddingTop: '8px',
              borderTop: '1px solid var(--border-hairline)',
              marginTop: '2px',
            }}
          >
            <span style={{ color: 'var(--text-ink)' }}>Ending Eligible ARR</span>
            <span className="font-mono" style={{ color: 'var(--color-positive)' }}>
              {formatArr(bridge.closingArrCents || state.eligibleArrCents)}
            </span>
          </div>
        </div>

        {/* SECTION 1: ARCHITECTURAL RELICS (SHOP & LOCK) */}
        {state.availableQuarterRelics.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-demand)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="font-mono" style={{ fontSize: '10px', color: 'var(--accent-demand)', fontWeight: 800 }}>[MILESTONES]</span>
                <span>1. Active Milestone Upgrades (Shop & Lock)</span>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                Equipped: <strong style={{ color: 'var(--text-bright)' }}>{state.activeRelics.length}</strong> active
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {state.availableQuarterRelics.map(relic => {
                const cost = relic.costCents ?? RELIC_PRICING[relic.rarity] ?? 0
                const canAfford = state.cashCents >= cost
                const isLocked = lockedRelicIds.has(relic.id)
                const theme = RARITY_THEME[relic.rarity]

                return (
                  <div
                    key={relic.id}
                    style={{
                      backgroundColor: 'var(--surface-card)',
                      border: isLocked ? '1.5px solid var(--accent-monetisation)' : `1px solid ${theme.border}`,
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: theme.glow !== 'none' ? theme.glow : '0 2px 8px rgba(15, 23, 42, 0.05)',
                      position: 'relative',
                      transition: 'all 140ms ease',
                    }}
                  >
                    <div>
                      {/* Top status bar: Rarity + Lock Button */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: theme.color,
                            backgroundColor: theme.bg,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {relic.rarity} · {relic.category}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleToggleLockRelic(relic.id, e)}
                          className={`cred-3d-button ${isLocked ? 'cred-3d-button-amber' : 'cred-3d-button-light'}`}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            fontSize: '9px',
                            fontWeight: 800,
                          }}
                          title={isLocked ? 'Locked for next quarter & rerolls (Click to unlock)' : 'Lock to keep in shop across quarters & rerolls'}
                        >
                          <span style={{ fontSize: '10px' }}>{isLocked ? '🔒' : '🔓'}</span>
                          <span className="font-mono">
                            {isLocked ? '[LOCKED]' : '[LOCK]'}
                          </span>
                        </button>
                      </div>

                      {/* 2.5D Relic Asset with Liquid Chrome frame */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div
                          className="liquid-chrome-icon-box"
                          style={{
                            width: '46px',
                            height: '46px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={getMilestoneUpgradeAsset(relic.id)}
                            alt={relic.name}
                            style={{
                              width: '32px',
                              height: '32px',
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-ink)', lineHeight: 1.2 }}>
                            {relic.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-positive)', lineHeight: 1.35, fontWeight: 600 }}>
                            {relic.effectSummary}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.3 }}>
                        "{relic.flavor}"
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Procurement Cost:</span>
                        <span className="font-mono" style={{ fontSize: '12.5px', fontWeight: 800, color: canAfford ? 'var(--color-positive)' : 'var(--color-critical)' }}>
                          ${Math.round(cost / 100).toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => handlePickRelic(relic)}
                        disabled={!canAfford}
                        className={`cred-3d-button ${canAfford ? 'cred-3d-button-emerald' : 'cred-3d-button-disabled'}`}
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          padding: '8px 12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          borderRadius: '8px',
                          gap: '6px',
                        }}
                      >
                        <span style={{ fontWeight: 800 }}>✓</span>
                        <span>{canAfford ? 'Procure Milestone Upgrade' : 'Insufficient Capital'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: TACTICAL CONSUMABLES (SHOP & LOCK) */}
        {state.availableQuarterConsumables && state.availableQuarterConsumables.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="font-mono" style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--accent-monetisation)' }}>
                  [POWERS]
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  2. Tactical Founder Powers (Shop & Lock)
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Holster: <strong style={{ color: currentInvLength >= MAX_CONSUMABLE_SLOTS ? 'var(--color-critical)' : 'var(--text-ink)' }}>{currentInvLength}/{MAX_CONSUMABLE_SLOTS}</strong> slots
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {state.availableQuarterConsumables.map((item: Consumable) => {
                const isLocked = lockedConsIds.has(item.id)
                const cost = item.costCents ?? CONSUMABLE_PRICING[item.rarity] ?? 0
                const canAfford = state.cashCents >= cost
                const hasInventoryRoom = currentInvLength < MAX_CONSUMABLE_SLOTS
                const theme = RARITY_THEME[item.rarity as keyof typeof RARITY_THEME] || RARITY_THEME.rare
                const assetKey = item.actionType || item.id.replace('cons-', '').replace(/-/g, '_')
                const assetSrc = CONSUMABLE_ASSETS[assetKey] || CONSUMABLE_ASSETS[item.id] || '/assets/2.5d/node_rebate_token.png'

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'var(--surface-work)',
                      border: isLocked ? '1.5px solid var(--accent-monetisation)' : `1px solid ${theme.border}`,
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isLocked ? '0 0 12px rgba(245, 158, 11, 0.15)' : 'none',
                      position: 'relative',
                    }}
                  >
                    <div>
                      {/* Top status bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            color: theme.color,
                            backgroundColor: theme.bg,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {item.rarity} · Consumable
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleToggleLockConsumable(item.id, e)}
                          className={`cred-3d-button ${isLocked ? 'cred-3d-button-amber' : 'cred-3d-button-light'}`}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            fontSize: '9px',
                            fontWeight: 800,
                          }}
                          title={isLocked ? 'Locked for next quarter & rerolls (Click to unlock)' : 'Lock to keep in shop across quarters & rerolls'}
                        >
                          <span style={{ fontSize: '10px' }}>{isLocked ? '🔒' : '🔓'}</span>
                          <span className="font-mono">
                            {isLocked ? '[LOCKED]' : '[LOCK]'}
                          </span>
                        </button>
                      </div>

                      {/* 2.5D Dimensional Graphic Hero Asset with Liquid Chrome frame */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div
                          className="liquid-chrome-icon-box"
                          style={{
                            width: '46px',
                            height: '46px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={assetSrc}
                            alt={item.name}
                            style={{
                              width: '32px',
                              height: '32px',
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-ink)', lineHeight: 1.2 }}>
                          {item.name}
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.35, fontWeight: 500, marginBottom: '6px' }}>
                        {item.effectSummary}
                      </div>

                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.3 }}>
                        "{item.flavor}"
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Purchase Cost:</span>
                        <span className="font-mono" style={{ fontSize: '12.5px', fontWeight: 800, color: canAfford ? 'var(--color-positive)' : 'var(--color-critical)' }}>
                          ${Math.round(cost / 100).toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => handlePickConsumable(item)}
                        disabled={!canAfford || !hasInventoryRoom}
                        className={`cred-3d-button ${canAfford && hasInventoryRoom ? 'cred-3d-button-cyan' : 'cred-3d-button-disabled'}`}
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          padding: '8px 12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          borderRadius: '8px',
                          gap: '6px',
                        }}
                      >
                        <span className="font-mono" style={{ fontSize: '10px', fontWeight: 800 }}>[+]</span>
                        <span>
                          {!hasInventoryRoom
                            ? 'Holster Full (6/6)'
                            : !canAfford
                            ? 'Insufficient Capital'
                            : 'Holster Power Card'}
                        </span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </div>

        {/* Fixed Action Footer - Non-overlapping */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px 24px',
            borderTop: '1px solid var(--border-hairline)',
            backgroundColor: 'var(--surface-modal)',
            zIndex: 10,
          }}
        >
          <button
            onClick={handleDismiss}
            className="cred-3d-button cred-3d-button-emerald"
            style={{ width: '100%', padding: '12px 18px', justifyContent: 'center', fontSize: '13px', fontWeight: 800, borderRadius: '9px', letterSpacing: '0.03em' }}
          >
            <span>Continue Operating Quarter {state.quarter} →</span>
          </button>
        </div>
      </div>
    </div>
  )
}

