import { FUNCTION_ORDER, type CompanyState, type FunctionId, type SemanticAction } from '../contracts/game'

export function FunctionNav({ state, dispatch }: { state: CompanyState; dispatch: (action: SemanticAction) => void }) {
  return <nav className="function-nav" aria-label="Work functions">
    {FUNCTION_ORDER.map((id) => {
      const unlocked = state.unlockedFunctions.includes(id)
      return <button
        key={id}
        disabled={!unlocked}
        className={`${state.activeFunction === id ? 'active' : ''} fn-${id}`}
        onClick={() => dispatch({ type: 'attention.switch', functionId: id as FunctionId })}
      ><span>{id}</span><small>{unlocked ? 'ready' : 'locked'}</small></button>
    })}
  </nav>
}
