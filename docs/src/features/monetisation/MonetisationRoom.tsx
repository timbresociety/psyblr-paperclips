import { useEffect, useState } from 'react'
import type { CompanyState, SemanticAction } from '../../contracts/game'

type Props = { state: CompanyState; dispatch: (action: SemanticAction) => void }

export function MonetisationRoom({ state, dispatch }: Props) {
  const [cursor, setCursor] = useState(0)
  useEffect(() => {
    if (state.customerSigned) return
    const started = performance.now()
    const id = window.setInterval(() => {
      const t = ((performance.now() - started) / 1700) % 2
      setCursor(t <= 1 ? t : 2 - t)
    }, 24)
    return () => window.clearInterval(id)
  }, [state.customerSigned])

  if (!state.productShipped) return <section className="room locked-center"><h2>No activation yet</h2><p>Ship a verified Product build first.</p></section>
  if (state.customerSigned) return <section className="room success-room"><div className="success-orb">$12k</div><h2>First contract signed</h2><p>ARR increased. Cash does not move until collection.</p></section>

  return (
    <section className="room monetisation-room">
      <div className="room-kicker">MONETISATION · PRICE FIT</div>
      <h2>Find willingness to pay</h2>
      <p>Commit while the cursor is inside the fit band. The band represents customer value, not a casino reward.</p>
      <div className="price-track" aria-label="Price fit track">
        <div className="fit-band" />
        <div className="price-cursor" style={{ left: `${cursor * 100}%` }} />
      </div>
      <div className="price-labels"><span>Too cheap</span><span>Fit</span><span>Too expensive</span></div>
      <button className="primary commit-price" onClick={() => dispatch({ type: 'monetisation.commit', normalizedPriceFit: cursor })}>Lock price</button>
    </section>
  )
}
