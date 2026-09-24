import { useEffect, useReducer, useRef, useCallback } from 'react'
import type { GameAction } from '../engine/actions'
import { gameReducer } from '../engine/reducer'
import { loadCheckpoint, saveCheckpoint } from '../engine/persistence'
import { TICKS_PER_SECOND } from '../engine/constants'

export function useGameEngine() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadCheckpoint)
  const stateRef = useRef(state)
  
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Periodic autosave (throttled every 4 seconds to prevent 10Hz/60Hz disk I/O thrashing)
  useEffect(() => {
    const saveInterval = window.setInterval(() => {
      saveCheckpoint(stateRef.current)
    }, 4000)

    const handleBeforeUnload = () => {
      saveCheckpoint(stateRef.current)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.clearInterval(saveInterval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Simulation 10Hz master clock loop
  useEffect(() => {
    const baseIntervalMs = 1000 / TICKS_PER_SECOND

    const intervalId = window.setInterval(() => {
      const currentState = stateRef.current
      if (!currentState.paused && currentState.runStatus === 'running' && !currentState.quarterReviewPending) {
        // Multiplier controls how many ticks are resolved per tick interval
        const speed = currentState.speedMultiplier || 1
        dispatch({ type: 'clock.tick', dtTicks: Math.round(speed) })
      }
    }, baseIntervalMs)

    return () => window.clearInterval(intervalId)
  }, [])

  const safeDispatch = useCallback((action: GameAction) => {
    dispatch(action)
  }, [])

  return { state, dispatch: safeDispatch }
}
