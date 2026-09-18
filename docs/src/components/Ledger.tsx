import type { CompanyState } from '../contracts/game'
export function Ledger({ state }: { state: CompanyState }) {
  return <aside className="ledger"><div className="aside-title">WHAT CHANGED?</div>{state.ledger.slice(-5).reverse().map((entry, i) => <div className="ledger-entry" key={`${entry}-${i}`}>{entry}</div>)}</aside>
}
