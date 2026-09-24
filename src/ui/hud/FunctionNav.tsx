import React from 'react'
import type { GameState, FunctionId } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { sound } from '../../audio/soundEngine'
import { getMonetisationDealStats } from '../../engine/formulas'

interface FunctionNavProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  activeRoomOverride?: FunctionId
  onOpenSkillTree?: () => void
  onOpenFleetModal?: () => void
  onOpenLedger?: () => void
}

interface NavItem {
  id: FunctionId
  code: string
  name: string
  icon: string
  accentColor: string
}

const ROOMS: NavItem[] = [
  { id: 'demand', code: '01', name: 'Demand', icon: '/assets/2.5d/nav_demand.png', accentColor: '#FF5C9A' },
  { id: 'product', code: '02', name: 'Product', icon: '/assets/2.5d/nav_product.png', accentColor: '#58D9FF' },
  { id: 'monetisation', code: '03', name: 'Monetisation', icon: '/assets/2.5d/nav_monetise.png', accentColor: '#FFC857' },
  { id: 'retention', code: '04', name: 'Retention', icon: '/assets/2.5d/nav_retention.png', accentColor: '#6F8CFF' },
  { id: 'expansion', code: '05', name: 'Expansion', icon: '/assets/2.5d/nav_expansion.png', accentColor: '#A778FF' },
  { id: 'operations', code: '06', name: 'Operations', icon: '/assets/2.5d/nav_operations.png', accentColor: '#B5F35A' },
]

export const FunctionNav: React.FC<FunctionNavProps> = ({
  state,
  dispatch,
  activeRoomOverride,
  onOpenSkillTree,
  onOpenFleetModal,
}) => {
  const handleSelect = (fnId: FunctionId) => {
    sound.playClick()
    dispatch({ type: 'attention.switch', functionId: fnId })
  }

  // Actionable Backlog & Alert indicators per workstation function
  const demandAlertCount = (state.demandSignals || []).length

  const productReadyPods = (state.productPods || []).filter(p => p.isReadyToShip).length
  const productAlertCount = (state.qualifiedOpportunities || []).length + productReadyPods

  const monetisationAlertCount = getMonetisationDealStats(state).totalCount

  // Active retention threats: unique threatened accounts, active incidents, or crisis events
  const activeThreatIds = new Set<string>()
  ;(state.accounts || []).forEach(a => {
    if (a.isThreatened || (a.health !== undefined && a.health < 65)) {
      activeThreatIds.add(a.id)
    }
  })
  ;(state.retentionIncidents || []).forEach(inc => {
    activeThreatIds.add(inc.accountId || inc.id)
  })
  if (state.retentionEvent?.active && state.retentionEvent.accountId) {
    activeThreatIds.add(state.retentionEvent.accountId)
  }
  const retentionAlertCount =
    activeThreatIds.size + (state.retentionEvent?.active && !state.retentionEvent.accountId ? 1 : 0)


  const expansionOrdersCount = (state.expansionOrders || []).length

  const opsEventActive = state.operationsEvent?.active ? 1 : 0
  const opsIncidentsCount = state.operations?.incidentsBacklog || 0
  const opsBustedCount = (state.activeTickets || []).filter(t => t.isBusted).length
  const opsStrainAlert = (state.operations?.strainBacklog ?? 0) >= 10 ? 1 : 0
  const opsRotAlert = (state.operations?.contextRot ?? 0) >= 0.35 ? 1 : 0
  const opsUnackAlerts = (state.alerts || []).filter(
    a => !a.acknowledged && (a.targetFunction === 'operations' || (a.tone === 'critical' && (a.id.startsWith('ticket-') || a.id.startsWith('ops-'))))
  ).length
  const opsAlertCount = opsEventActive + opsIncidentsCount + opsBustedCount + opsStrainAlert + opsRotAlert + opsUnackAlerts

  return (
    <nav
      className="workstation-rail"
      style={{
        width: '248px',
        flexShrink: 0,
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid rgba(15, 23, 42, 0.07)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '18px 12px 16px 12px',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 20,
      }}
    >
      <div>
        {/* Section: YOUR ATTENTION */}
        <div
          className="font-mono"
          style={{
            fontSize: '9.5px',
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: '#94A3B8',
            textTransform: 'uppercase',
            padding: '0 8px 10px 8px',
          }}
        >
          YOUR ATTENTION
        </div>

        {/* 6 Operational Rooms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {ROOMS.map(room => {
            const currentActive = activeRoomOverride ?? state.activeFunction
            const isActive = currentActive === room.id
            const fleet = state.fleet[room.id as keyof typeof state.fleet]
            const units = fleet ? fleet.onlineUnits : 0
            const isAutomated = Boolean(fleet && fleet.automateRank > 0)
            const statusText = !isAutomated
              ? 'Manual'
              : units > 0
              ? `${units} ${units === 1 ? 'agent' : 'agents'} · running`
              : '0 agents · paused'
            let badgeCount = 0
            let badgeTone: 'critical' | 'warning' | 'info' | 'accent' = 'accent'

            if (room.id === 'demand') {
              badgeCount = demandAlertCount
              badgeTone = 'accent'
            } else if (room.id === 'product') {
              badgeCount = productAlertCount
              badgeTone = productReadyPods > 0 ? 'info' : 'accent'
            } else if (room.id === 'monetisation') {
              badgeCount = monetisationAlertCount
              badgeTone = 'warning'
            } else if (room.id === 'retention') {
              badgeCount = retentionAlertCount
              badgeTone = 'critical'
            } else if (room.id === 'expansion') {
              badgeCount = expansionOrdersCount
              badgeTone = 'accent'
            } else if (room.id === 'operations') {
              badgeCount = opsAlertCount
              badgeTone = opsEventActive || opsIncidentsCount > 0 || opsBustedCount > 0 ? 'critical' : 'warning'
            }

            const hasBadge = badgeCount > 0

            const badgeColor =
              badgeTone === 'critical'
                ? '#EF4444'
                : badgeTone === 'warning'
                ? '#D97706'
                : badgeTone === 'info'
                ? '#0284C7'
                : room.accentColor

            const isCritical = badgeTone === 'critical'

            return (
              <div
                key={room.id}
                onClick={() => handleSelect(room.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  border: isActive ? '1px solid #E2E8F0' : '1px solid transparent',
                  boxShadow: isActive ? '0 3px 10px rgba(15, 23, 42, 0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  {/* 2.5D Custom Nav Icon Container */}
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      backgroundColor: isActive ? 'rgba(2, 132, 199, 0.07)' : 'rgba(241, 245, 249, 0.9)',
                      border: `1px solid ${isActive ? room.accentColor : '#E2E8F0'}`,
                      boxShadow: isActive ? `0 2px 8px ${room.accentColor}33` : '0 1px 2px rgba(15, 23, 42, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      padding: '2px',
                    }}
                  >
                    <img
                      src={room.icon}
                      alt={room.name}
                      style={{
                        width: '22px',
                        height: '22px',
                        objectFit: 'contain',
                        filter: isActive ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))' : 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '10.5px',
                          color: isActive ? '#0284C7' : '#94A3B8',
                          fontWeight: 700,
                        }}
                      >
                        {room.code}
                      </span>
                      <span
                        style={{
                          fontSize: '12.5px',
                          fontWeight: isActive ? 800 : 600,
                          color: isActive ? '#0F172A' : '#475569',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {room.name}
                      </span>
                    </div>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '9.5px',
                        color: isAutomated && units > 0 ? '#10B981' : '#94A3B8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {statusText}
                    </span>
                  </div>
                </div>

                {hasBadge && (
                  <span
                    className={`font-mono ${isCritical ? 'animate-badge-glow-critical' : 'animate-badge-glow'}`}
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: badgeColor,
                      backgroundColor:
                        badgeTone === 'critical'
                          ? 'rgba(239, 68, 68, 0.12)'
                          : badgeTone === 'warning'
                          ? 'rgba(217, 119, 6, 0.12)'
                          : badgeTone === 'info'
                          ? 'rgba(2, 132, 199, 0.12)'
                          : `${room.accentColor}1A`,
                      border:
                        badgeTone === 'critical'
                          ? '1px solid rgba(239, 68, 68, 0.45)'
                          : badgeTone === 'warning'
                          ? '1px solid rgba(217, 119, 6, 0.45)'
                          : badgeTone === 'info'
                          ? '1px solid rgba(2, 132, 199, 0.45)'
                          : `1px solid ${room.accentColor}55`,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      flexShrink: 0,
                      ['--badge-glow' as any]: badgeColor,
                      boxShadow: `0 0 8px ${badgeColor}66, inset 0 0 2px ${badgeColor}33`,
                    }}
                  >
                    {badgeCount}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Section: BUILD THE COMPANY */}
        <div
          className="font-mono"
          style={{
            fontSize: '9.5px',
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: '#94A3B8',
            textTransform: 'uppercase',
            padding: '20px 8px 10px 8px',
          }}
        >
          BUILD THE COMPANY
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {/* Skill Trees */}
          <div
            onClick={() => {
              sound.playClick()
              const openFn = onOpenSkillTree || onOpenFleetModal
              if (openFn) openFn()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '10px',
              backgroundColor: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 120ms ease',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              {/* 2.5D Custom Nav Icon Container for Skill Trees */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: 'rgba(241, 245, 249, 0.9)',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  padding: '2px',
                }}
              >
                <img
                  src="/assets/2.5d/nav_skills.png"
                  alt="Skill Trees"
                  style={{
                    width: '22px',
                    height: '22px',
                    objectFit: 'contain',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0F172A' }}>
                  Skill trees
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '9.5px',
                    color: '#94A3B8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Craft · Scale · Auto · Luck
                </span>
              </div>
            </div>
          </div>

          {/* Finance */}
          <div
            onClick={() => handleSelect('finance')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '10px',
              backgroundColor: state.activeFunction === 'finance' ? '#FFFFFF' : 'transparent',
              border: state.activeFunction === 'finance' ? '1px solid #E2E8F0' : '1px solid transparent',
              boxShadow: state.activeFunction === 'finance' ? '0 3px 10px rgba(15, 23, 42, 0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 120ms ease',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              {/* 2.5D Custom Nav Icon Container for Finance */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  backgroundColor: state.activeFunction === 'finance' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(241, 245, 249, 0.9)',
                  border: `1px solid ${state.activeFunction === 'finance' ? '#10B981' : '#E2E8F0'}`,
                  boxShadow: state.activeFunction === 'finance' ? '0 2px 8px rgba(16, 185, 129, 0.2)' : '0 1px 2px rgba(15, 23, 42, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  padding: '2px',
                }}
              >
                <img
                  src="/assets/2.5d/nav_finance.png"
                  alt="Finance"
                  style={{
                    width: '22px',
                    height: '22px',
                    objectFit: 'contain',
                    filter: state.activeFunction === 'finance' ? 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' : 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '10.5px',
                      color: state.activeFunction === 'finance' ? '#059669' : '#94A3B8',
                      fontWeight: 700,
                    }}
                  >
                    07
                  </span>
                  <span
                    style={{
                      fontSize: '12.5px',
                      fontWeight: state.activeFunction === 'finance' ? 800 : 600,
                      color: state.activeFunction === 'finance' ? '#0F172A' : '#475569',
                    }}
                  >
                    Finance
                  </span>
                </div>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '9.5px',
                    color: '#94A3B8',
                  }}
                >
                  Cashflow & capital
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
