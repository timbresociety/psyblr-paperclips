import type { FunctionId } from '../../contracts/game'

export function LockedRoom({ id }: { id: FunctionId }) {
  const descriptions: Record<FunctionId, string> = {
    demand: '', product: '', monetisation: '',
    retention: 'Protect ARR by prioritising a concrete customer threat.',
    expansion: 'Merge account needs into a fitted package that creates addon ARR.',
    operations: 'Reveal evidence, diagnose failures, and spend finite capacity to repair strain and rot.',
  }
  return <section className="room locked-center"><span className="lock-mark">LOCKED</span><h2>{id[0].toUpperCase() + id.slice(1)}</h2><p>{descriptions[id]}</p><small>Not part of the starter golden loop. See task waves.</small></section>
}
