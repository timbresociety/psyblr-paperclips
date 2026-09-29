import type { GameState, FunctionId } from '../../engine/types'
import { getMonetisationDealStats } from '../../engine/formulas'

export type BadgeTone = 'critical' | 'warning' | 'info' | 'accent'

export interface QueueBadge {
  count: number
  tone: BadgeTone
}

/**
 * Actionable backlog per operating function — the single source both the
 * FunctionNav rail and the HQ desk badges read, so attention pressure reads
 * identically everywhere.
 */
export function computeQueueBadges(state: GameState): Record<Exclude<FunctionId, 'finance'>, QueueBadge> {
  const demand = (state.demandSignals || []).length

  const productReadyPods = (state.productPods || []).filter(p => p.isReadyToShip).length
  const product = (state.qualifiedOpportunities || []).length + productReadyPods

  const monetisation = getMonetisationDealStats(state).totalCount

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
  const retention =
    activeThreatIds.size + (state.retentionEvent?.active && !state.retentionEvent.accountId ? 1 : 0)

  const expansion = (state.expansionOrders || []).length

  const opsEventActive = state.operationsEvent?.active ? 1 : 0
  const opsIncidentsCount = state.operations?.incidentsBacklog || 0
  const opsBustedCount = (state.activeTickets || []).filter(t => t.isBusted).length
  const opsStrainAlert = (state.operations?.strainBacklog ?? 0) >= 10 ? 1 : 0
  const opsRotAlert = (state.operations?.contextRot ?? 0) >= 0.35 ? 1 : 0
  const opsUnackAlerts = (state.alerts || []).filter(
    a => !a.acknowledged && (a.targetFunction === 'operations' || (a.tone === 'critical' && (a.id.startsWith('ticket-') || a.id.startsWith('ops-'))))
  ).length
  const operations = opsEventActive + opsIncidentsCount + opsBustedCount + opsStrainAlert + opsRotAlert + opsUnackAlerts

  return {
    demand: { count: demand, tone: 'accent' },
    product: { count: product, tone: productReadyPods > 0 ? 'info' : 'accent' },
    monetisation: { count: monetisation, tone: 'accent' },
    retention: { count: retention, tone: retention > 0 ? 'critical' : 'accent' },
    expansion: { count: expansion, tone: 'accent' },
    operations: { count: operations, tone: operations > 0 ? 'warning' : 'accent' },
  }
}
