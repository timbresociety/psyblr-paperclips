import React from 'react'
import type { GameState } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { MAX_CONSUMABLE_SLOTS, ENGINE_ARCHETYPES, FOUNDER_ACHIEVEMENTS_AND_RELICS } from '../../engine/constants'
import { calculateOperationsMetrics, getActiveEvolutionTier } from '../../engine/formulas'
import {
  getMilestoneUpgradeAsset,
  getConsumableAsset,
  getActiveSkillTreeUpgrades,
} from '../../engine/assets'
import { sound } from '../../audio/soundEngine'
import { CompanyTopology } from './CompanyTopology'

const MAX_RELIC_SLOTS = 6

interface CompanyRailProps {
  state: GameState
  dispatch?: React.Dispatch<GameAction>
  onOpenLedger: () => void
  onOpenSkillTree?: () => void
  onOpenFounderRelics?: () => void
  isDrawer?: boolean
}

export const CompanyRail: React.FC<CompanyRailProps> = ({
  state,
  dispatch,
  onOpenLedger,
  onOpenSkillTree,
  onOpenFounderRelics,
  isDrawer,
}) => {
  const activeRelics = state.activeRelics || []
  const consumables = state.consumablesInventory || []
  const activeSkillTreeUpgrades = getActiveSkillTreeUpgrades(state.fleet)
  const archetype = ENGINE_ARCHETYPES[state.activeArchetype || 'product_led_machine']
  const equippedRelicEntry = FOUNDER_ACHIEVEMENTS_AND_RELICS.find(
    a => a.relicId === state.founderHistory?.equippedFounderRelicId || a.id === state.founderHistory?.equippedFounderRelicId
  )
  const displayRelicName = equippedRelicEntry ? equippedRelicEntry.unlockedRelic.name : (archetype?.name || 'Product-Led Autonomous Machine')
  const displayRelicBuffs = equippedRelicEntry ? equippedRelicEntry.unlockedRelic.effectSummary : (archetype?.buffsSummary || '+25% Build Yield · -20% Defect Escape · +1 Base Pod Slot')
  const displayRelicIcon = equippedRelicEntry ? equippedRelicEntry.unlockedRelic.icon : (archetype?.assetPath || '/assets/archetypes/archetype_product_led_machine.png')

  const opsMetrics = calculateOperationsMetrics(
    state.fleet,
    state.operations.strainBacklog,
    state.operations.contextRot,
    state.activeRelics?.some(r => r.id === 'relic-circuit-breaker')
  )

  const stabilityPct = Math.round(Math.min(1, Math.max(0, opsMetrics.speedFactor)) * 100)

  // Next operating bill calculations
  const nextBill = state.mandatoryBills?.[0]
  const nextBillAmountCents = nextBill?.amountCents ?? (state.opexMonthCents + state.cogsMonthCents)
  const nextBillDueTick = nextBill?.dueTick ?? (state.elapsedTicks + 600)
  const ticksUntilBill = Math.max(0, nextBillDueTick - state.elapsedTicks)
  const secondsUntilBill = Math.floor(ticksUntilBill / 10)
  const billMins = Math.floor(secondsUntilBill / 60)
  const billSecs = secondsUntilBill % 60

  const formatDollars = (cents: number) => {
    const dollars = Math.round(cents / 100)
    if (dollars >= 1_000_000_000) return `$${(dollars / 1_000_000_000).toFixed(2)}B`
    if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`
    if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(0)}k`
    return `$${dollars.toLocaleString()}`
  }

  const handleUseConsumable = (consumableId: string) => {
    if (dispatch) {
      sound.playMilestone()
      dispatch({ type: 'consumable.use', consumableId })
    }
  }

  const qualifiedPipelineCount = state.qualifiedOpportunities?.length ?? 0
  const activatedTrialsCount = state.activationsQueue?.length ?? 0

  return (
    <aside
      className={isDrawer ? "company-rail-drawer" : "company-rail"}
      style={isDrawer ? {
        width: '100%',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        overflowY: 'auto',
      } : {
        width: '280px',
        flexShrink: 0,
        backgroundColor: '#FFFFFF',
        borderLeft: '1px solid rgba(15, 23, 42, 0.07)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 20,
      }}
    >
      {/* 1. HEADER: THE COMPANY + AUDIT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            className="font-mono"
            style={{
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#0F172A',
              textTransform: 'uppercase',
            }}
          >
            THE COMPANY
          </span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
        </div>

        <button
          onClick={() => {
            sound.playClick()
            onOpenLedger()
          }}
          className="font-mono cred-3d-button cred-3d-button-light"
          style={{
            fontSize: '9.5px',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            letterSpacing: '0.06em',
          }}
        >
          AUDIT
        </button>
      </div>

      {/* 2. ACTIVE ENGINE ARCHETYPE (FOUNDER RELIC EQUIVALENT) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            className="font-mono"
            style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', color: '#64748B' }}
          >
            ACTIVE ENGINE ARCHETYPE
          </span>
          <button
            onClick={() => {
              sound.playClick()
              onOpenFounderRelics?.()
            }}
            className="font-mono"
            style={{
              fontSize: '8.5px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: '#F8FAFC',
              color: '#475569',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background-color 140ms ease, border-color 140ms ease',
            }}
            title="Open Founder Relics Codex"
          >
            <span>CODEX ({state.founderHistory?.unlockedAchievementIds?.length || 0}/12)</span>
            <span>→</span>
          </button>
        </div>

        <div
          onClick={() => {
            sound.playClick()
            onOpenFounderRelics?.()
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            borderRadius: '10px',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03), 0 1px 2px rgba(15, 23, 42, 0.02)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'border-color 140ms ease, box-shadow 140ms ease, transform 100ms ease',
          }}
          title="Click to open Founder Relics & Achievements Codex"
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#F1F5F9',
              border: '1px solid rgba(15, 23, 42, 0.07)',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            <img
              src={displayRelicIcon}
              alt={displayRelicName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1.25,
                wordBreak: 'break-word',
              }}
            >
              {displayRelicName}
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: '8.5px',
                fontWeight: 600,
                color: '#0284C7',
                marginTop: '3px',
                lineHeight: 1.35,
                wordBreak: 'break-word',
              }}
            >
              {displayRelicBuffs}
            </span>
          </div>
        </div>
      </div>

      {/* 3. SWARM TOPOLOGY RADAR */}
      <CompanyTopology state={state} dispatch={dispatch} />

      {/* 3. PIPELINE CONVERSION FLOW */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
            {qualifiedPipelineCount}
          </span>
          <span className="font-mono" style={{ fontSize: '9px', color: '#94A3B8' }}>
            qualified pipeline
          </span>
        </div>

        <span style={{ fontSize: '14px', color: '#CBD5E1' }}>→</span>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
            {activatedTrialsCount}
          </span>
          <span className="font-mono" style={{ fontSize: '9px', color: '#94A3B8' }}>
            activated trials
          </span>
        </div>
      </div>

      {/* 4. OPERATING STABILITY */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            className="font-mono"
            style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.08em', color: '#64748B' }}
          >
            OPERATING STABILITY
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: stabilityPct < 70 ? '#E11D48' : '#0F172A',
            }}
          >
            {stabilityPct}%
          </span>
        </div>

        <p style={{ fontSize: '11px', color: '#64748B', margin: 0, lineHeight: 1.35 }}>
          {opsMetrics.excessStrain > 0.5
            ? 'Coordination slowing work. Repair strain or upgrade Operations.'
            : 'Nominal operations throughput. Fleet coordination balanced.'}
        </p>

        <div
          className="font-mono"
          style={{
            fontSize: '9.5px',
            color: '#64748B',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            marginTop: '2px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Strain backlog</span>
            <span style={{ color: state.operations.strainBacklog > 5 ? '#E11D48' : '#0F172A' }}>
              {state.operations.strainBacklog.toFixed(1)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Worst context rot</span>
            <span style={{ color: state.operations.contextRot > 0.3 ? '#E11D48' : '#0F172A' }}>
              {Math.round(state.operations.contextRot * 100)}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Coordination</span>
            <span>
              {opsMetrics.coordinationLoad.toFixed(1)} / {opsMetrics.opsCapacity.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. NEXT OPERATING BILL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            className="font-mono"
            style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: '#94A3B8' }}
          >
            NEXT OPERATING BILL
          </span>
          <span
            className="font-mono"
            style={{ fontSize: '8.5px', color: '#0284C7', textTransform: 'uppercase', fontWeight: 700 }}
          >
            {getActiveEvolutionTier(state).tier} TIER
          </span>
        </div>

        <div className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
          ~{formatDollars(nextBillAmountCents)}
        </div>

        <span className="font-mono" style={{ fontSize: '9.5px', color: '#64748B' }}>
          Due in {billMins}:{billSecs.toString().padStart(2, '0')} · cash {formatDollars(state.cashCents)}
        </span>
      </div>

      {/* 6. CONSUMABLES HOLSTER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            className="font-mono"
            style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: '#94A3B8' }}
          >
            CONSUMABLES HOLSTER
          </span>
          <span className="font-mono" style={{ fontSize: '9px', color: '#64748B' }}>
            {consumables.length}/{MAX_CONSUMABLE_SLOTS}
          </span>
        </div>

        {consumables.length === 0 ? (
          <div
            className="font-mono"
            style={{
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px dashed #E2E8F0',
              textAlign: 'center',
              fontSize: '9px',
              color: '#94A3B8',
            }}
          >
            [HOLSTER EMPTY · ACQUIRE IN QTR REVIEW]
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {consumables.map(c => {
              const assetSrc = getConsumableAsset(c.id)
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      className="liquid-chrome-icon-box"
                      style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <img src={assetSrc} alt={c.name} style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>{c.name}</span>
                      <span className="font-mono" style={{ fontSize: '8.5px', color: '#64748B' }}>{c.effectSummary}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUseConsumable(c.id)}
                    className="font-mono cred-3d-button cred-3d-button-cyan"
                    style={{
                      padding: '2px 8px',
                      borderRadius: '5px',
                      fontSize: '9px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      letterSpacing: '0.04em',
                    }}
                  >
                    USE
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 7. ACTIVE MILESTONE UPGRADES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            className="font-mono"
            style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', color: '#94A3B8' }}
          >
            ACTIVE MILESTONE UPGRADES
          </span>
          <span className="font-mono" style={{ fontSize: '9px', color: '#64748B' }}>
            {activeRelics.length}/{MAX_RELIC_SLOTS}
          </span>
        </div>

        {activeRelics.length === 0 ? (
          <div
            className="font-mono"
            style={{
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px dashed #E2E8F0',
              textAlign: 'center',
              fontSize: '9px',
              color: '#94A3B8',
            }}
          >
            [NO MILESTONES ACTIVE · UNLOCK IN REVIEW]
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeRelics.map(r => {
              const assetSrc = getMilestoneUpgradeAsset(r.id)
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    className="liquid-chrome-icon-box"
                    style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <img src={assetSrc} alt={r.name} style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#0F172A',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.name}
                      </span>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '8px',
                          fontWeight: 700,
                          color: r.rarity === 'ethereal' ? '#7C3AED' : r.rarity === 'monumental' ? '#D97706' : '#059669',
                          textTransform: 'uppercase',
                        }}
                      >
                        {r.rarity}
                      </span>
                    </div>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '8.5px',
                        color: '#64748B',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.effectSummary}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 8. ACTIVE SKILL TREE UPGRADES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            className="font-mono"
            style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', color: '#94A3B8' }}
          >
            ACTIVE SKILL TREE UPGRADES
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="font-mono" style={{ fontSize: '9px', color: '#0284C7', fontWeight: 700 }}>
              {activeSkillTreeUpgrades.length}/24
            </span>
            {onOpenSkillTree && (
              <button
                onClick={() => {
                  sound.playClick()
                  onOpenSkillTree()
                }}
                className="font-mono cred-3d-button cred-3d-button-cyan"
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                }}
              >
                MANAGE
              </button>
            )}
          </div>
        </div>

        {activeSkillTreeUpgrades.length === 0 ? (
          <div
            className="font-mono"
            style={{
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px dashed #E2E8F0',
              textAlign: 'center',
              fontSize: '9px',
              color: '#94A3B8',
            }}
          >
            [NO SKILL TREE UPGRADES ACTIVE · VISIT TREE]
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '180px', overflowY: 'auto' }}>
            {activeSkillTreeUpgrades.map(u => (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 7px',
                  borderRadius: '6px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div
                  className="liquid-chrome-icon-box"
                  style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <img src={u.assetPath} alt={u.name} style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#0F172A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {u.name}
                    </span>
                    <span className="font-mono" style={{ fontSize: '8px', color: u.color, fontWeight: 800 }}>
                      {u.functionCode} · T{u.tier}
                    </span>
                  </div>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '8px',
                      color: '#64748B',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {u.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

        {/* Tactile CRED-Style 3D Button to Access Radial Skill Grid */}
        {onOpenSkillTree && (
          <button
            onClick={() => {
              sound.playClick()
              onOpenSkillTree()
            }}
            className="cred-3d-button cred-3d-button-cyan"
            style={{
              marginTop: '8px',
              marginBottom: '16px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <span>ACCESS SKILL GRID</span>
            <kbd
              className="font-mono"
              style={{
                fontSize: '9px',
                padding: '2px 5px',
                borderRadius: '3px',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: '#FFFFFF',
                fontWeight: 800,
              }}
            >
              S
            </kbd>
          </button>
        )}
    </aside>
  )
}
