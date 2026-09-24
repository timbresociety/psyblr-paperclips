import React from 'react'
import type { GameState, FunctionId } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { sound } from '../../audio/soundEngine'
import { getMonetisationDealStats } from '../../engine/formulas'

interface MobileBottomNavProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onOpenCompanyDrawer: () => void
  isCompanyDrawerOpen: boolean
}

interface NavItem {
  id: FunctionId | 'company'
  code: string
  label: string
  icon: string
  accentColor: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'demand', code: '01', label: 'Demand', icon: '/assets/2.5d/nav_demand.png', accentColor: '#E11D48' },
  { id: 'product', code: '02', label: 'Product', icon: '/assets/2.5d/nav_product.png', accentColor: '#0284C7' },
  { id: 'monetisation', code: '03', label: 'Monetise', icon: '/assets/2.5d/nav_monetise.png', accentColor: '#D97706' },
  { id: 'retention', code: '04', label: 'Retention', icon: '/assets/2.5d/nav_retention.png', accentColor: '#4F46E5' },
  { id: 'expansion', code: '05', label: 'Expansion', icon: '/assets/2.5d/nav_expansion.png', accentColor: '#7C3AED' },
  { id: 'operations', code: '06', label: 'Ops', icon: '/assets/2.5d/nav_operations.png', accentColor: '#059669' },
  { id: 'company', code: '🏢', label: 'Company', icon: '/assets/2.5d/nav_finance.png', accentColor: '#0F172A' },
]

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  state,
  dispatch,
  onOpenCompanyDrawer,
  isCompanyDrawerOpen,
}) => {
  // Alert counts
  const demandAlerts = (state.demandSignals || []).length
  const productReadyPods = (state.productPods || []).filter(p => p.isReadyToShip).length
  const productAlerts = (state.qualifiedOpportunities || []).length + productReadyPods
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
  const retentionAlerts =
    activeThreatIds.size + (state.retentionEvent?.active && !state.retentionEvent.accountId ? 1 : 0)
  const monetisationAlerts = getMonetisationDealStats(state).totalCount
  const expansionAlerts = (state.expansionOrders || []).length
  const opsBustedTickets = (state.activeTickets || []).filter(t => t.isBusted).length
  const opsStrainAlert = (state.operations?.strainBacklog ?? 0) >= 10 ? 1 : 0
  const opsRotAlert = (state.operations?.contextRot ?? 0) >= 0.35 ? 1 : 0
  const opsUnackAlerts = (state.alerts || []).filter(
    a => !a.acknowledged && (a.targetFunction === 'operations' || (a.tone === 'critical' && (a.id.startsWith('ticket-') || a.id.startsWith('ops-'))))
  ).length
  const opsAlerts = (state.operationsEvent?.active ? 1 : 0) + (state.operations?.incidentsBacklog || 0) + opsBustedTickets + opsStrainAlert + opsRotAlert + opsUnackAlerts

  const getAlertBadge = (id: FunctionId | 'company') => {
    switch (id) {
      case 'demand':
        return demandAlerts > 0 ? demandAlerts : null
      case 'product':
        return productAlerts > 0 ? productAlerts : null
      case 'monetisation':
        return monetisationAlerts > 0 ? monetisationAlerts : null
      case 'retention':
        return retentionAlerts > 0 ? retentionAlerts : null
      case 'expansion':
        return expansionAlerts > 0 ? expansionAlerts : null
      case 'operations':
        return opsAlerts > 0 ? opsAlerts : null
      default:
        return null
    }
  }

  const handleNavClick = (item: NavItem) => {
    sound.playClick()
    if (item.id === 'company') {
      onOpenCompanyDrawer()
      return
    }
    dispatch({ type: 'attention.switch', functionId: item.id })
  }

  return (
    <nav className="mobile-bottom-nav-container" aria-label="Mobile Navigation">
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === 'company' ? isCompanyDrawerOpen : (!isCompanyDrawerOpen && state.activeFunction === item.id)
        const badgeCount = getAlertBadge(item.id)

        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            style={{
              borderBottom: isActive ? `2px solid ${item.accentColor}` : '2px solid transparent',
            }}
            aria-label={item.label}
          >
            <img
              src={item.icon}
              alt=""
              className="mobile-nav-btn-icon"
              style={{
                filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' : 'none',
              }}
            />
            <span
              className="mobile-nav-btn-label"
              style={{
                color: isActive ? item.accentColor : 'var(--text-secondary)',
              }}
            >
              {item.label}
            </span>

            {badgeCount !== null && (
              <span
                className="mobile-nav-badge animate-badge-glow"
                style={{
                  ['--badge-glow' as any]: item.accentColor,
                  boxShadow: `0 0 8px ${item.accentColor}80`,
                }}
              >
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
