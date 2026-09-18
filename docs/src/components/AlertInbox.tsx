import type { CompanyState } from '../contracts/game'
export function AlertInbox({ state }: { state: CompanyState }) {
  return <aside className="alert-inbox"><div className="aside-title">ALERT INBOX <span>{state.alerts.length}</span></div>{state.alerts.map(a => <div className={`alert ${a.tone}`} key={a.id}>{a.text}</div>)}</aside>
}
