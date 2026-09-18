import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { CompanyState, SemanticAction } from '../../contracts/game'

type Props = { state: CompanyState; dispatch: (action: SemanticAction) => void }

export function DemandRoom({ state, dispatch }: Props) {
  const startX = useRef<number | null>(null)
  const [offset, setOffset] = useState(0)
  const opportunity = state.opportunity

  if (!opportunity) return <Empty title="No live signal" body="Reset the starter to replay the first demand interaction." />

  const decide = (decision: 'reject' | 'qualify') => dispatch({ type: 'demand.triage', opportunityId: opportunity.id, decision })

  return (
    <section className="room demand-room" aria-label="Demand workbench">
      <div className="room-kicker">DEMAND · TRIAGE</div>
      <div
        className="signal-card"
        style={{ transform: `translateX(${offset}px) rotate(${offset / 28}deg)` }}
        onPointerDown={(e: ReactPointerEvent<HTMLDivElement>) => { startX.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={(e: ReactPointerEvent<HTMLDivElement>) => { if (startX.current !== null) setOffset(Math.max(-140, Math.min(140, e.clientX - startX.current))) }}
        onPointerUp={() => {
          if (offset > 90) decide('qualify')
          else if (offset < -90) decide('reject')
          startX.current = null
          setOffset(0)
        }}
      >
        <div className="signal-meta"><span>{opportunity.segment}</span><span>Cost ${opportunity.acquisitionCost}</span></div>
        <h2>{opportunity.title}</h2>
        <p>{opportunity.signal}</p>
        <div className="swipe-hint"><span>← reject</span><strong>drag the signal</strong><span>qualify →</span></div>
      </div>
      <div className="action-row">
        <button className="secondary" onClick={() => decide('reject')}>Reject</button>
        <button className="primary" onClick={() => decide('qualify')}>Qualify</button>
      </div>
    </section>
  )
}

function Empty({ title, body }: { title: string; body: string }) {
  return <section className="room empty-room"><div><h2>{title}</h2><p>{body}</p></div></section>
}
