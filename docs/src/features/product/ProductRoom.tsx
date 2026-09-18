import type { ChangeEvent } from 'react'
import type { CompanyState, SemanticAction } from '../../contracts/game'

type Props = { state: CompanyState; dispatch: (action: SemanticAction) => void }
const components = [
  { id: 'observer', name: 'Change Observer', note: 'See what agents changed.' },
  { id: 'ledger', name: 'Reason Ledger', note: 'Explain why it changed.' },
  { id: 'meter', name: 'Usage Meter', note: 'Make the result billable.' },
]
const slots = [
  { id: 'observe', label: 'Observe' },
  { id: 'explain', label: 'Explain' },
  { id: 'bill', label: 'Bill' },
]

export function ProductRoom({ state, dispatch }: Props) {
  if (!state.qualifiedOpportunity) return <section className="room locked-center"><h2>No qualified demand yet</h2><p>Demand creates the finite opportunity Product works on.</p></section>

  return (
    <section className="room product-room">
      <div className="room-kicker">PRODUCT · ASSEMBLE</div>
      <div className="request-strip">Build for: <strong>{state.qualifiedOpportunity.title}</strong></div>
      <div className="component-tray">
        {components.map((component) => <div className="component" key={component.id}><strong>{component.name}</strong><small>{component.note}</small></div>)}
      </div>
      <div className="slot-grid">
        {slots.map((slot) => (
          <div className={`product-slot ${state.productSlots[slot.id] ? 'filled' : ''}`} key={slot.id}>
            <span>{slot.label}</span>
            <select
              aria-label={`${slot.label} component`}
              value={state.productSlots[slot.id] ?? ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => dispatch({ type: 'product.place', componentId: e.target.value, slotId: slot.id })}
            >
              <option value="">Choose component</option>
              {components.map((component) => <option value={component.id} key={component.id}>{component.name}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="action-row">
        <button className="secondary" onClick={() => dispatch({ type: 'product.verify' })}>Verify build</button>
        <button className="primary" disabled={!state.productVerified} onClick={() => dispatch({ type: 'product.ship' })}>Ship verified product</button>
      </div>
      <p className="prototype-note">This interaction is intentionally functional but visually crude. Slice S02 replaces selects with tactile assembly without changing semantic actions.</p>
    </section>
  )
}
