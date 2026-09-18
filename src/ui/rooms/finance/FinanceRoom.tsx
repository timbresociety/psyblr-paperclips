import React, { useState, useEffect, useCallback } from 'react'
import type { GameState } from '../../../engine/types'
import type { GameAction } from '../../../engine/actions'
import { sound } from '../../../audio/soundEngine'


interface FinanceRoomProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

export const FinanceRoom: React.FC<FinanceRoomProps> = ({ state, dispatch }) => {
  const [borrowAmountInput, setBorrowAmountInput] = useState('500')

  const handleDrawDebt = useCallback(() => {
    const dollars = parseFloat(borrowAmountInput) || 0
    if (dollars <= 0) return
    sound.playCashTick()
    dispatch({ type: 'finance.draw_debt', amountCents: Math.round(dollars * 100) })
  }, [borrowAmountInput, dispatch])

  const handleRepayDebt = useCallback(() => {
    sound.playClick()
    dispatch({ type: 'finance.repay_debt', amountCents: state.debt.principalCents })
  }, [state.debt.principalCents, dispatch])

  const handleAcceptVC = useCallback(() => {
    sound.playCashTick()
    dispatch({ type: 'finance.accept_vc_mandate' })
  }, [dispatch])

  const eligibleMrrDollars = (state.eligibleArrCents / 12) / 100
  const maxBorrowDollars = Math.max(0, eligibleMrrDollars * 3 - (state.debt.principalCents / 100))
  const canBorrow = state.eligibleArrCents >= 120_000 && maxBorrowDollars > 0 // $1k/mo ARR min

  const canRaiseVC = !state.vc.accepted && state.eligibleArrCents >= 1_200_000 // $12k/yr ARR min
  const vcPreMoneyDollars = (state.eligibleArrCents * 4) / 100
  const vcRaiseDollars = vcPreMoneyDollars * 0.25

  // Desktop keyboard shortcuts for Finance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === 'd' || e.key === 'D') {
        if (canBorrow) {
          e.preventDefault()
          handleDrawDebt()
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (state.debt.principalCents > 0) {
          e.preventDefault()
          handleRepayDebt()
        }
      } else if (e.key === 'v' || e.key === 'V') {
        if (canRaiseVC) {
          e.preventDefault()
          handleAcceptVC()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canBorrow, state.debt.principalCents, canRaiseVC, handleDrawDebt, handleRepayDebt, handleAcceptVC])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '860px',
        margin: '0 auto',
        gap: '12px',
        paddingBottom: '12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          className="liquid-chrome-icon-box"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <img
            src="/assets/2.5d/nav_finance.png"
            alt="Finance"
            style={{ width: '30px', height: '30px', objectFit: 'contain' }}
          />
        </div>
        <div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#059669', fontWeight: 800 }}>
            07 / Corporate Treasury & Capitalization
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-ink)', marginTop: '2px', margin: 0, letterSpacing: '-0.02em' }}>
            Finance & Capital Facilities
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
            Manage liquid runway, draw debt credit lines <kbd className="mini-kbd" style={{ background: '#FFFFFF', border: '1px solid var(--border-hairline)', color: 'var(--text-ink)' }}>D</kbd>, or accept VC growth term sheets <kbd className="mini-kbd" style={{ background: '#FFFFFF', border: '1px solid var(--border-hairline)', color: 'var(--text-ink)' }}>V</kbd>.
          </p>
        </div>
      </div>

      {/* Runway & Liquidity Radar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
        }}
      >
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-hairline)', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 2px 8px rgba(18, 22, 26, 0.04)' }}>
          <div style={{ fontSize: '9.5px', color: 'var(--color-positive)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>
            Liquid Cash
          </div>
          <div className="font-mono font-display" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-ink)', marginTop: '2px', letterSpacing: '-0.03em' }}>
            ${(state.cashCents / 100).toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Liquid balance on hand
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-hairline)', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 2px 8px rgba(18, 22, 26, 0.04)' }}>
          <div style={{ fontSize: '9.5px', color: '#0284C7', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>
            Contractual ARR
          </div>
          <div className="font-mono font-display" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-ink)', marginTop: '2px', letterSpacing: '-0.03em' }}>
            ${(state.contractualArrCents / 100).toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {state.accounts.length} active customer accounts
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-hairline)', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 2px 8px rgba(18, 22, 26, 0.04)' }}>
          <div style={{ fontSize: '9.5px', color: '#7C3AED', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>
            Valuation
          </div>
          <div className="font-mono font-display" style={{ fontSize: '20px', fontWeight: 800, color: '#7C3AED', marginTop: '2px', letterSpacing: '-0.03em' }}>
            ${(state.valuationCents / 100).toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {(state.growthMultiple).toFixed(1)}x multiple · Q{state.quarter}
          </div>
        </div>
      </div>

      {/* 3-Month Cashflow Forecast */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-hairline)',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 2px 8px rgba(18, 22, 26, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-ink)' }}>
            3-Month Cashflow Forecast (1,800 Ticks)
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Conservative 80% collections haircut
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Mandatory Obligations</div>
            <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-critical)', marginTop: '2px' }}>
              ${(state.forecastObligationsCents / 100).toLocaleString()}
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Expected Collections</div>
            <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-positive)', marginTop: '2px' }}>
              ${(state.forecastExpectedCollectionsCents / 100).toLocaleString()}
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Projected Peak Shortfall</div>
            <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: state.peakNegativeCashCents > 0 ? 'var(--color-critical)' : 'var(--color-positive)', marginTop: '2px' }}>
              ${(state.peakNegativeCashCents / 100).toLocaleString()}
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Shortfall Fraction</div>
            <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: state.shortfallFraction > 0 ? 'var(--color-warning)' : 'var(--color-positive)', marginTop: '2px' }}>
              {(state.shortfallFraction * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Capital Facilities: Debt & VC Side-by-Side Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
        {/* Debt Credit Facility */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-hairline)',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 2px 8px rgba(18, 22, 26, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: "#FEF3C7",
                    color: "#B45309",
                    border: "1px solid #FDE68A",
                  }}
                >
                  DEBT
                </span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-ink)' }}>
                  Revolving Debt Facility (18% APR)
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="font-mono" style={{ fontSize: '14px', fontWeight: 800, color: state.debt.principalCents > 0 ? 'var(--color-critical)' : 'var(--text-ink)' }}>
                  ${(state.debt.principalCents / 100).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Amortized over 6 monthly installments. Mandatory cash obligation.
            </div>
          </div>

          {canBorrow ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: '10px', top: '7px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>$</span>
                <input
                  type="number"
                  value={borrowAmountInput}
                  onChange={e => setBorrowAmountInput(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '6px',
                    padding: '6px 10px 6px 22px',
                    color: 'var(--text-ink)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                onClick={handleDrawDebt}
                className="cred-3d-button cred-3d-button-amber"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <span>Draw Capital</span>
                <kbd style={{ background: 'rgba(0,0,0,0.15)', color: '#0F172A', padding: '1px 4px', borderRadius: '3px', fontSize: '9.5px', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>D</kbd>
              </button>

              {state.debt.principalCents > 0 && (
                <button
                  onClick={handleRepayDebt}
                  className="cred-3d-button cred-3d-button-light"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  <span>Repay</span>
                  <kbd style={{ background: '#E2E8F0', color: '#334155', padding: '1px 4px', borderRadius: '3px', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>R</kbd>
                </button>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {state.eligibleArrCents < 120_000
                ? 'Reach $100/mo ($1,200/yr) ARR to unlock lender credit facilities.'
                : 'Credit facility fully drawn. Repay principal to borrow more.'}
            </div>
          )}
        </div>

        {/* VC Term Sheet Section */}
        <div
          style={{
            backgroundColor: state.vc.accepted ? '#F0FDFA' : '#FFFFFF',
            border: `1px solid ${state.vc.accepted ? '#99F6E4' : 'var(--border-hairline)'}`,
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '0 2px 8px rgba(18, 22, 26, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-ink)' }}>
                  Series A Venture Capital Mandate
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  4x ARR valuation multiple. Binding +50% ARR growth.
                </div>
              </div>

              <span
                style={{
                  fontSize: '9px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: state.vc.accepted ? '#CCFBF1' : '#F1F5F9',
                  color: state.vc.accepted ? '#0F766E' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {state.vc.accepted ? 'ACTIVE' : 'UNCOMMITTED'}
              </span>
            </div>
          </div>

          {state.vc.accepted ? (
            <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CCFBF1' }}>
              <div style={{ fontSize: '10px', color: '#D97706', fontWeight: 700 }}>
                BOARD MANDATE:
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '2px' }}>
                Achieve <strong className="font-mono">${(state.vc.baselineArrCents * 1.5 / 100).toLocaleString()}/yr ARR</strong> by Q{state.quarter + 1} or face liquidation!
              </div>
            </div>
          ) : canRaiseVC ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="font-mono" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-ink)' }}>
                  Raise ${vcRaiseDollars.toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Sell 20% equity (Pre: ${vcPreMoneyDollars.toLocaleString()})
                </div>
              </div>

              <button
                onClick={handleAcceptVC}
                className="cred-3d-button cred-3d-button-cyan"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <span>Take Capital</span>
                <kbd style={{ background: 'rgba(255,255,255,0.25)', color: '#FFF', padding: '1px 4px', borderRadius: '3px', fontSize: '9.5px', fontFamily: 'var(--font-mono)' }}>V</kbd>
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Requires min $12k/yr ARR for term sheet. Current: ${(state.eligibleArrCents / 100).toLocaleString()}/yr.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
