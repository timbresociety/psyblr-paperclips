import type { CompanyState } from '../contracts/game'

const money = (n: number) => `$${Intl.NumberFormat('en-US', { notation: n >= 1_000_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n)}`

export function Hud({ state }: { state: CompanyState }) {
  return <header className="hud">
    <div className="brand"><img src="/references/structure-monogram-primary.png" alt="SoloUnicorn mark" /><span>SOLOUNICORN</span></div>
    <div className="metric"><small>VALUATION</small><strong>{money(state.valuation)}</strong></div>
    <div className="metric"><small>ELIGIBLE ARR</small><strong>{money(state.eligibleArr)}</strong></div>
    <div className="metric"><small>CASH</small><strong>{money(state.cash)}</strong></div>
    <div className="metric"><small>ACTIVE TIME</small><strong>{Math.floor(state.elapsedSeconds / 60)}:{String(state.elapsedSeconds % 60).padStart(2, '0')}</strong></div>
  </header>
}
