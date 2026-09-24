import React from 'react'
import type { Alert, FunctionId } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { sound } from '../../audio/soundEngine'

interface AlertInboxProps {
  alerts: Alert[]
  dispatch?: React.Dispatch<GameAction>
}

export const AlertInbox: React.FC<AlertInboxProps> = ({ alerts, dispatch }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set())

  const visibleAlerts = alerts
    .filter(a => !dismissedIds.has(a.id))
    .slice(-8)
    .reverse()

  const criticalCount = visibleAlerts.filter(a => a.tone === 'critical').length

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    sound.playClick()
    setDismissedIds(prev => new Set(prev).add(id))
    if (dispatch) {
      dispatch({ type: 'alerts.dismiss', alertId: id })
    }
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    sound.playClick()
    if (dispatch) {
      dispatch({ type: 'alerts.clear_all' })
    }
    setDismissedIds(new Set(alerts.map(a => a.id)))
  }

  const resolveTargetFunction = (alert: Alert): FunctionId | undefined => {
    if (alert.targetFunction) return alert.targetFunction
    const text = (alert.title + ' ' + alert.message + ' ' + alert.id).toLowerCase()
    if (alert.id.startsWith('ticket-') || alert.id.startsWith('ops-') || alert.id.startsWith('rack-') || text.includes('ops') || text.includes('strain') || text.includes('failover') || text.includes('rot') || text.includes('cluster') || text.includes('thermal') || text.includes('telemetry') || text.includes('rack 0')) return 'operations'
    if (text.includes('runway') || text.includes('bill') || text.includes('debt') || text.includes('cash') || text.includes('finance') || text.includes('liquidity')) return 'finance'
    if (text.includes('threat') || text.includes('sla') || text.includes('churn') || text.includes('retention') || text.includes('squash')) return 'retention'
    if (text.includes('deal') || text.includes('monet') || text.includes('pricing') || text.includes('contract') || text.includes('wtp')) return 'monetisation'
    if (text.includes('pod') || text.includes('build') || text.includes('shipped') || text.includes('product') || text.includes('primitive')) return 'product'
    if (text.includes('demand') || text.includes('signal') || text.includes('lead') || text.includes('cac')) return 'demand'
    if (text.includes('expansion') || text.includes('rfp') || text.includes('order')) return 'expansion'
    return undefined
  }

  if (!isOpen) {
    if (criticalCount === 0 && visibleAlerts.length === 0) return null
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="floating-alerts-pill cred-3d-button cred-3d-button-light"
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '304px',
          zIndex: 60,
          borderRadius: '20px',
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10.5px',
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
        }}
        title="View Alerts"
      >
        <span className="font-mono" style={{ fontWeight: 800 }}>INBOX</span>
        <span className="font-mono">[{visibleAlerts.length}]</span>
        {criticalCount > 0 && (
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 6px #EF4444' }} />
        )}
      </button>
    )
  }

  return (
    <aside
      className="alerts-sidebar"
      style={{
        position: 'fixed',
        right: '304px',
        bottom: '16px',
        width: '320px',
        maxHeight: '420px',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-hairline)',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 60,
        overflow: 'hidden',
      }}
    >
      {/* Sidebar Header / Toggle */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-hairline)',
          cursor: 'pointer',
          backgroundColor: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="font-mono"
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 5px',
              borderRadius: '4px',
              backgroundColor: 'rgba(0,0,0,0.06)',
              color: 'var(--text-secondary)',
            }}
          >
            INBOX
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-ink)' }}>
            Signals & Alerts
          </span>
          {criticalCount > 0 && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-critical)',
                color: '#FFF',
              }}
            >
              {criticalCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {visibleAlerts.length > 1 && (
            <button
              onClick={handleClearAll}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                padding: '2px 4px',
              }}
              title="Clear all alerts"
            >
              CLEAR ALL
            </button>
          )}
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1 }}>✕</span>
        </div>
      </div>

      {/* Alerts List */}
      {isOpen && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {visibleAlerts.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px' }}>
              All operating channels clear
            </div>
          ) : (
            visibleAlerts.map(alert => {
              const isCritical = alert.tone === 'critical'
              const isWarning = alert.tone === 'warning'
              const accentColor = isCritical ? 'var(--color-critical)' : isWarning ? 'var(--color-warning)' : 'var(--accent-product)'
              const targetFn = resolveTargetFunction(alert)

              return (
                <div
                  key={alert.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.35)' : isWarning ? 'rgba(245, 158, 11, 0.35)' : 'var(--border-hairline)'}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    boxShadow: isCritical ? '0 4px 14px rgba(239, 68, 68, 0.12)' : '0 2px 6px rgba(15, 23, 42, 0.04)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: accentColor,
                        }}
                      />
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-ink)' }}>
                        {alert.title}
                      </span>
                    </div>

                    <button
                      onClick={e => handleDismiss(alert.id, e)}
                      style={{ padding: '2px 4px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '11px' }}
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {alert.message}
                  </div>

                  {targetFn && (
                    <button
                      onClick={() => {
                        sound.playClick()
                        if (dispatch) {
                          dispatch({ type: 'attention.switch', functionId: targetFn })
                        }
                        setIsOpen(false)
                      }}
                      className={`cred-3d-button ${isCritical ? 'cred-3d-button-amber' : 'cred-3d-button-cyan'}`}
                      style={{
                        alignSelf: 'flex-start',
                        marginTop: '4px',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>{alert.actionLabel || `Open ${targetFn.toUpperCase()} →`}</span>
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </aside>
  )
}
