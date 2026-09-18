import React, { useState } from 'react'
import type { GameState } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { sound } from '../../audio/soundEngine'

interface StarterPlaybookWidgetProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onOpenSkillTree: () => void
}

interface PlaybookStep {
  id: string
  title: string
  hint: string
  isDone: (state: GameState) => boolean
  onClickAction?: () => void
}

export const StarterPlaybookWidget: React.FC<StarterPlaybookWidgetProps> = ({
  state,
  dispatch,
  onOpenSkillTree,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (state.playbookDismissed) {
    return null
  }

  const steps: PlaybookStep[] = [
    {
      id: 'step_demand',
      title: 'Qualify Prospect Signal',
      hint: 'Press [1] Demand → Swipe/Press [D] Pursue',
      isDone: s => (s.qualifiedOpportunities?.length ?? 0) > 0 || s.accounts.length > 0,
      onClickAction: () => {
        sound.playClick()
        dispatch({ type: 'attention.switch', functionId: 'demand' })
      },
    },
    {
      id: 'step_product',
      title: 'Assemble Product Pod',
      hint: 'Press [2] Product → Match Prompt/Diff/Test/Deploy',
      isDone: s => s.productVerified || s.activationsQueue.length > 0 || s.accounts.length > 0,
      onClickAction: () => {
        sound.playClick()
        dispatch({ type: 'attention.switch', functionId: 'product' })
      },
    },
    {
      id: 'step_monetisation',
      title: 'Close First Customer ARR',
      hint: 'Press [3] Monetisation → Strike Pricing Arc',
      isDone: s => s.accounts.length > 0,
      onClickAction: () => {
        sound.playClick()
        dispatch({ type: 'attention.switch', functionId: 'monetisation' })
      },
    },
    {
      id: 'step_upgrade',
      title: 'Upgrade Swarm Blueprint',
      hint: 'Press [S] Skill Grid → Purchase Rank 1 upgrade',
      isDone: s =>
        Object.values(s.fleet).some(
          f => f.craftRank > 0 || f.scaleRank > 0 || f.automateRank > 0 || f.luckRank > 0
        ),
      onClickAction: () => {
        sound.playClick()
        onOpenSkillTree()
      },
    },
    {
      id: 'step_operations',
      title: 'Monitor Operations Strain',
      hint: 'Press [6] Operations → Keep cluster stable',
      isDone: s => s.elapsedTicks > 200,
      onClickAction: () => {
        sound.playClick()
        dispatch({ type: 'attention.switch', functionId: 'operations' })
      },
    },
  ]

  const completedCount = steps.filter(step => step.isDone(state)).length
  const totalCount = steps.length
  const allCompleted = completedCount === totalCount
  const progressPct = Math.round((completedCount / totalCount) * 100)

  const handleDismiss = () => {
    sound.playClick()
    dispatch({ type: 'playbook.dismiss' })
  }

  if (isCollapsed) {
    return (
      <button
        onClick={() => {
          sound.playClick()
          setIsCollapsed(false)
        }}
        className="animate-float-pop liquid-chrome-border"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '260px',
          zIndex: 80,
          backgroundColor: '#FFFFFF',
          borderRadius: '9999px',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '12px' }}>📋</span>
        <span className="font-mono" style={{ fontSize: '11px', color: '#0284C7', fontWeight: 700 }}>
          PLAYBOOK ({completedCount}/{totalCount})
        </span>
      </button>
    )
  }

  return (
    <div
      className="starter-playbook-card animate-slide-up"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '260px',
        zIndex: 80,
        width: '320px',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        boxShadow: '0 16px 36px -8px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.04)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Playbook Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px' }}>📋</span>
          <span
            className="font-mono"
            style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', color: '#0F172A' }}
          >
            FOUNDER PLAYBOOK
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: '9px',
              backgroundColor: allCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 132, 199, 0.1)',
              color: allCompleted ? '#059669' : '#0284C7',
              padding: '1px 5px',
              borderRadius: '4px',
              fontWeight: 700,
            }}
          >
            {progressPct}%
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => {
              sound.playClick()
              setIsCollapsed(true)
            }}
            title="Minimize Playbook"
            style={{
              fontSize: '11px',
              color: '#64748B',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            —
          </button>
          <button
            onClick={handleDismiss}
            title="Dismiss Playbook"
            style={{
              fontSize: '11px',
              color: '#64748B',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#F1F5F9',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            backgroundColor: allCompleted ? '#10B981' : '#0284C7',
            transition: 'width 250ms ease',
          }}
        />
      </div>

      {/* Step checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {steps.map(step => {
          const done = step.isDone(state)
          return (
            <div
              key={step.id}
              onClick={step.onClickAction}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: done ? '#F0FDF4' : '#F8FAFC',
                border: done ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                cursor: step.onClickAction ? 'pointer' : 'default',
                transition: 'all 120ms ease',
              }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: '11px',
                  color: done ? '#059669' : '#94A3B8',
                  fontWeight: 800,
                  width: '14px',
                  textAlign: 'center',
                }}
              >
                {done ? '✓' : '○'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: done ? 500 : 600,
                    color: done ? '#94A3B8' : '#0F172A',
                    textDecoration: done ? 'line-through' : 'none',
                  }}
                >
                  {step.title}
                </span>
                {!done && (
                  <span
                    className="font-mono"
                    style={{ fontSize: '9px', color: '#0284C7', marginTop: '1px' }}
                  >
                    {step.hint}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
