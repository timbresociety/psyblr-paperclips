import React, { useState, useEffect, useRef } from 'react'
import { useGameEngine } from '../store/gameStore'
import { getActiveEvolutionTier } from '../engine/formulas'
import { sound } from '../audio/soundEngine'
import type { FunctionId } from '../engine/types'
import { TopPerimeterHud } from './hud/TopPerimeterHud'
import { FunctionNav } from './hud/FunctionNav'
import { CompanyRail } from './hud/CompanyRail'
import { AlertInbox } from './hud/AlertInbox'
import { LedgerDrawer } from './hud/LedgerDrawer'
import { MobileBottomNav } from './hud/MobileBottomNav'
import { MobileCompanyDrawer } from './hud/MobileCompanyDrawer'

import { DemandRoom } from './rooms/demand/DemandRoom'
import { ProductRoom } from './rooms/product/ProductRoom'
import { MonetisationRoom } from './rooms/monetisation/MonetisationRoom'
import { RetentionRoom } from './rooms/retention/RetentionRoom'
import { ExpansionRoom } from './rooms/expansion/ExpansionRoom'
import { OperationsRoom } from './rooms/operations/OperationsRoom'
import { FinanceRoom } from './rooms/finance/FinanceRoom'

import { SkillTreeModal } from './management/SkillTreeModal'
import { QuarterReviewModal } from './management/QuarterReviewModal'
import { UnicornVictoryModal } from './management/UnicornVictoryModal'
import { GameOverModal } from './management/GameOverModal'
import { KeyboardShortcutsModal } from './management/KeyboardShortcutsModal'
import { PauseModal } from './management/PauseModal'
import { GuidedTutorialModal } from './management/GuidedTutorialModal'
import { FounderRelicsModal } from './management/FounderRelicsModal'
import { getMaxUnlockedSpeed } from '../engine/constants'

import '../styles/base.css'
import '../styles/animations.css'

export default function App() {
  const { state, dispatch } = useGameEngine()
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false)
  const [isLedgerOpen, setIsLedgerOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isFounderRelicsOpen, setIsFounderRelicsOpen] = useState(false)
  const [isCompanyDrawerOpen, setIsCompanyDrawerOpen] = useState(false)
  const [isTutorialOpen, setIsTutorialOpen] = useState(!state.hasSeenTutorial && state.elapsedTicks < 60)

  // Delayed room transition state: lets DemandRoom animate the green success shake & glide before navigating to Product
  const [displayedRoom, setDisplayedRoom] = useState<FunctionId>(state.activeFunction)
  const roomTransitionTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    // When transitioning from demand to product after a successful qualification,
    // delay room switch by 850ms so user can see the green success shake and moving into product!
    if (displayedRoom === 'demand' && state.activeFunction === 'product' && state.lastTriageOutcome?.success) {
      if (roomTransitionTimeoutRef.current) {
        window.clearTimeout(roomTransitionTimeoutRef.current)
      }
      roomTransitionTimeoutRef.current = window.setTimeout(() => {
        setDisplayedRoom('product')
      }, 850)
      return
    }

    if (roomTransitionTimeoutRef.current) {
      window.clearTimeout(roomTransitionTimeoutRef.current)
      roomTransitionTimeoutRef.current = null
    }
    setDisplayedRoom(state.activeFunction)
  }, [state.activeFunction, state.lastTriageOutcome, displayedRoom])

  useEffect(() => {
    return () => {
      if (roomTransitionTimeoutRef.current) {
        window.clearTimeout(roomTransitionTimeoutRef.current)
      }
    }
  }, [])

  const tierInfo = getActiveEvolutionTier(state)

  useEffect(() => {
    (window as any).__SOLO_UNICORN__ = { state, dispatch }
  }, [state, dispatch])

  // =========================================================================
  // GLOBAL KEYBOARD SHORTCUTS CONTROLLER
  // =========================================================================
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside text fields
      const targetTag = (e.target as HTMLElement)?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur()
        }
        return
      }

      // Quarter review modal is strictly non-dismissable: ignore all shortcuts
      if (state.quarterReviewPending) {
        if (e.key === 'Escape') {
          e.preventDefault()
        }
        return
      }

      // Close open modals on Escape
      if (e.key === 'Escape') {
        if (isTutorialOpen) {
          setIsTutorialOpen(false)
          sound.playClick()
          return
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false)
          sound.playClick()
          return
        }
        if (isSkillTreeOpen) {
          setIsSkillTreeOpen(false)
          sound.playClick()
          return
        }
        if (isLedgerOpen) {
          setIsLedgerOpen(false)
          sound.playClick()
          return
        }
      }

      // Toggle shortcuts cheat-sheet on '?' or '/'
      if (e.key === '?' || (e.key === '/' && !e.shiftKey)) {
        e.preventDefault()
        sound.playClick()
        setIsShortcutsOpen(prev => !prev)
        return
      }

      // Pause / Resume simulation on Pause key or Shift+Space (avoiding collision with minigame Space / P hotkeys)
      if (e.key === 'Pause' || (e.shiftKey && e.code === 'Space')) {
        e.preventDefault()
        sound.playClick()
        dispatch({ type: state.paused ? 'run.resume' : 'run.pause' })
        return
      }

      // Speed toggles: '[' = slower, ']' = faster
      if (e.key === '[') {
        e.preventDefault()
        sound.playClick()
        const maxSpeed = getMaxUnlockedSpeed(state.founderHistory)
        const speeds = [1, 2, 5].filter(s => s <= maxSpeed)
        const currentIdx = speeds.indexOf(state.speedMultiplier)
        const nextSpeed = speeds[Math.max(0, currentIdx - 1)]
        dispatch({ type: 'run.set_speed', speed: nextSpeed })
        return
      }
      if (e.key === ']') {
        e.preventDefault()
        const maxSpeed = getMaxUnlockedSpeed(state.founderHistory)
        const speeds = [1, 2, 5].filter(s => s <= maxSpeed)
        const currentIdx = speeds.indexOf(state.speedMultiplier)
        if (currentIdx < speeds.length - 1) {
          sound.playClick()
          const nextSpeed = speeds[currentIdx + 1]
          dispatch({ type: 'run.set_speed', speed: nextSpeed })
          if (state.paused) dispatch({ type: 'run.resume' })
        } else {
          sound.playRottenBuzzer()
        }
        return
      }

      // Audio Mute toggle on 'M'
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        const isMuted = sound.toggleMute()
        if (!isMuted) sound.playClick()
        return
      }

      // Toggle Skill Tree on 'K', 'F', or 'S' (when not on Product deploy)
      if (e.key === 'k' || e.key === 'K' || e.key === 'f' || e.key === 'F' || ((e.key === 's' || e.key === 'S') && state.activeFunction !== 'product')) {
        e.preventDefault()
        sound.playClick()
        setIsSkillTreeOpen(prev => !prev)
        return
      }

      // Toggle Financial Ledger on 'L'
      if ((e.key === 'l' || e.key === 'L') && state.activeFunction !== 'operations' && state.activeFunction !== 'demand') {
        e.preventDefault()
        sound.playClick()
        setIsLedgerOpen(prev => !prev)
        return
      }

      // Switch Attention Room (Digit keys 1 - 7)
      // Note: Only switch rooms when NOT in Product or Demand rooms if those rooms handle 1-6 internally!
      // But 1-7 with Alt/Ctrl/Cmd or when on global scope can switch rooms.
      // Switch Attention Room (Digit keys 1 - 7 globally)
      const roomMap: Record<string, FunctionId> = {
        '1': 'demand',
        '2': 'product',
        '3': 'monetisation',
        '4': 'retention',
        '5': 'expansion',
        '6': 'operations',
        '7': 'finance',
      }

      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && roomMap[e.key]) {
        e.preventDefault()
        sound.playClick()
        dispatch({ type: 'attention.switch', functionId: roomMap[e.key] })
        return
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [state.paused, state.speedMultiplier, state.activeFunction, state.quarterReviewPending, state.founderHistory, isTutorialOpen, isShortcutsOpen, isSkillTreeOpen, isLedgerOpen, dispatch])

  const renderActiveRoom = () => {
    switch (displayedRoom) {
      case 'demand':
        return <DemandRoom state={state} dispatch={dispatch} />
      case 'product':
        return <ProductRoom state={state} dispatch={dispatch} />
      case 'monetisation':
        return <MonetisationRoom state={state} dispatch={dispatch} />
      case 'retention':
        return <RetentionRoom state={state} dispatch={dispatch} />
      case 'expansion':
        return <ExpansionRoom state={state} dispatch={dispatch} />
      case 'operations':
        return <OperationsRoom state={state} dispatch={dispatch} />
      case 'finance':
        return <FinanceRoom state={state} dispatch={dispatch} />
      default:
        return <DemandRoom state={state} dispatch={dispatch} />
    }
  }

  return (
    <div className="app-layout" data-theme={tierInfo.tier}>
      {/* Perimeter Top HUD */}
      <TopPerimeterHud
        state={state}
        dispatch={dispatch}
        onOpenSkillTree={() => setIsSkillTreeOpen(true)}
        onOpenLedger={() => setIsLedgerOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenCompany={() => setIsCompanyDrawerOpen(true)}
      />

      {/* 3-Column Cockpit Workspace */}
      <div className="app-body">
        {/* Column 1: YOUR ATTENTION */}
        <FunctionNav
          state={state}
          dispatch={dispatch}
          activeRoomOverride={displayedRoom}
          onOpenFleetModal={() => setIsSkillTreeOpen(true)}
          onOpenLedger={() => setIsLedgerOpen(true)}
        />

        {/* Column 2: TACTILE WORK OBJECT */}
        <main className="center-stage" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
          <div className="center-stage-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', minHeight: 0 }}>
            {renderActiveRoom()}
          </div>
        </main>

        {/* Column 3: THE COMPANY */}
        <CompanyRail
          state={state}
          dispatch={dispatch}
          onOpenLedger={() => setIsLedgerOpen(true)}
          onOpenSkillTree={() => setIsSkillTreeOpen(true)}
          onOpenFounderRelics={() => setIsFounderRelicsOpen(true)}
        />

        {/* Floating System Alerts */}
        <AlertInbox alerts={state.alerts} dispatch={dispatch} />

        {/* Audit Log / Financial Ledger */}
        <LedgerDrawer
          ledger={state.ledger}
          isOpen={isLedgerOpen}
          onToggle={() => setIsLedgerOpen(!isLedgerOpen)}
        />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        state={state}
        dispatch={dispatch}
        onOpenCompanyDrawer={() => setIsCompanyDrawerOpen(true)}
        isCompanyDrawerOpen={isCompanyDrawerOpen}
      />

      {/* Mobile Company Sheet / Drawer */}
      <MobileCompanyDrawer
        state={state}
        dispatch={dispatch}
        isOpen={isCompanyDrawerOpen}
        onClose={() => setIsCompanyDrawerOpen(false)}
        onOpenLedger={() => setIsLedgerOpen(true)}
        onOpenSkillTree={() => setIsSkillTreeOpen(true)}
        onOpenFounderRelics={() => setIsFounderRelicsOpen(true)}
      />

      {/* Modals & Overlays */}
      {isTutorialOpen && (
        <GuidedTutorialModal
          onClose={() => setIsTutorialOpen(false)}
          dispatch={dispatch}
        />
      )}

      {state.paused && state.runStatus === 'running' && !state.quarterReviewPending && (
        <PauseModal
          state={state}
          dispatch={dispatch}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
      )}

      {isShortcutsOpen && (
        <KeyboardShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
      )}

      {isFounderRelicsOpen && (
        <FounderRelicsModal
          state={state}
          dispatch={dispatch}
          onClose={() => setIsFounderRelicsOpen(false)}
        />
      )}

      {isSkillTreeOpen && (
        <SkillTreeModal
          state={state}
          dispatch={dispatch}
          onClose={() => setIsSkillTreeOpen(false)}
        />
      )}

      {state.quarterReviewPending && (
        <QuarterReviewModal state={state} dispatch={dispatch} />
      )}

      {state.runStatus === 'unicorn_victory' && (
        <UnicornVictoryModal state={state} dispatch={dispatch} />
      )}

      {state.runStatus === 'failed' && (
        <GameOverModal state={state} dispatch={dispatch} />
      )}
    </div>
  )
}
