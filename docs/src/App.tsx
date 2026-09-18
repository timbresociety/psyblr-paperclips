import { useEffect, useReducer } from 'react'
import { Hud } from './components/Hud'
import { FunctionNav } from './components/FunctionNav'
import { AlertInbox } from './components/AlertInbox'
import { Ledger } from './components/Ledger'
import { DemandRoom } from './features/demand/DemandRoom'
import { ProductRoom } from './features/product/ProductRoom'
import { MonetisationRoom } from './features/monetisation/MonetisationRoom'
import { LockedRoom } from './features/locked/LockedRoom'
import { initialState } from './state/fixture'
import { reducer } from './state/reducer'
import type { CompanyState, SemanticAction } from './contracts/game'

const STORAGE_KEY = 'solounicorn.starter.v1'
type LocalAction = SemanticAction | { type: 'clock.tick' }

function restore(): CompanyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...structuredClone(initialState), ...JSON.parse(raw) } : structuredClone(initialState)
  } catch { return structuredClone(initialState) }
}

function localReducer(state: CompanyState, action: LocalAction): CompanyState {
  if (action.type !== 'clock.tick') return reducer(state, action)
  const elapsedSeconds = state.elapsedSeconds + 1
  if (state.collectionDueSeconds !== null && elapsedSeconds >= state.collectionDueSeconds) {
    return {
      ...state,
      elapsedSeconds,
      cash: state.cash + 1_000,
      collectionDueSeconds: null,
      alerts: [{ id: 'collected', tone: 'info', text: '$1,000 collected. Now the company has liquid cash.' }],
      ledger: [...state.ledger, 'Collected first $1,000 monthly invoice.'],
    }
  }
  return { ...state, elapsedSeconds }
}

export default function App() {
  const [state, dispatch] = useReducer(localReducer, undefined, restore)
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }, [state])
  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'clock.tick' }), 1000)
    return () => window.clearInterval(id)
  }, [])

  const room = state.activeFunction === 'demand' ? <DemandRoom state={state} dispatch={dispatch} />
    : state.activeFunction === 'product' ? <ProductRoom state={state} dispatch={dispatch} />
    : state.activeFunction === 'monetisation' ? <MonetisationRoom state={state} dispatch={dispatch} />
    : <LockedRoom id={state.activeFunction} />

  return <div className="app-shell">
    <Hud state={state} />
    <FunctionNav state={state} dispatch={dispatch} />
    <main className="workspace"><AlertInbox state={state} /><div className="center-stage">{room}</div><Ledger state={state} /></main>
    <footer className="footer"><span>Fixture economy · not balance canon</span><button onClick={() => dispatch({ type: 'run.reset' })}>Reset starter</button></footer>
  </div>
}
