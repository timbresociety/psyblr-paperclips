import React, { useState } from 'react'
import type { GameAction } from '../../engine/actions'
import { sound } from '../../audio/soundEngine'

interface GuidedTutorialModalProps {
  onClose: () => void
  dispatch: React.Dispatch<GameAction>
}

interface TutorialSlide {
  stepNumber: string
  title: string
  tagline: string
  diagramIcon: string
  content: string[]
  keyTakeaway: string
  highlightRoom?: string
}

const SLIDES: TutorialSlide[] = [
  {
    stepNumber: '01 / 04',
    title: 'THE 6-ROOM AUTONOMOUS ENGINE',
    tagline: 'Assembly-line throughput from Demand to Operations',
    diagramIcon: '/assets/2.5d/nav_demand.png',
    content: [
      'Demand [1] qualifies customer cohorts and market inbound signals.',
      'Product [2] synthesizes prompt specs, diffs, tests, and deploys into feature pods.',
      'Monetisation [3] converts activated trials into contracted Annual Recurring Revenue (ARR).',
      'Retention [4] quashes churn threats and restores enterprise customer health.',
      'Expansion [5] merges upsell upgrades and add-on packs to expand Net Revenue Retention.',
      'Operations [6] clears server strain and prevents catastrophic context rot across your agent fleet.',
    ],
    keyTakeaway: 'The founder can manually work any room, but autonomous agents handle throughput in parallel.',
    highlightRoom: 'Demand & Product',
  },
  {
    stepNumber: '02 / 04',
    title: 'ENTERPRISE VALUATION VS CASH RUNWAY',
    tagline: 'Growth is vanity, profit is sanity, but cash is oxygen',
    diagramIcon: '/assets/2.5d/nav_finance.png',
    content: [
      'Enterprise Valuation = Contractual ARR × Multiplier (e.g. 15x–30x). Your ultimate goal is $1,000,000,000 ($1B Unicorn).',
      'Liquid Cash is spent on CAC, agent payroll, and monthly server infrastructure bills.',
      'If Liquid Cash drops below $0 when a monthly bill or debt note matures, your company defaults (Game Over)!',
      'Finance [7] lets you take non-dilutive debt or draw venture SAFE notes when runway gets tight.',
    ],
    keyTakeaway: 'Keep at least 6 months of runway in Liquid Cash while compounding high-margin ARR.',
    highlightRoom: 'Finance & Treasury',
  },
  {
    stepNumber: '03 / 04',
    title: 'SWARM AUTOMATION & UPGRADES',
    tagline: 'Automate mundane tasks to unlock late-game singularity',
    diagramIcon: '/assets/2.5d/node_golden_core.png',
    content: [
      'Press [S] or [K] at any time to enter the Radial Skill Tree.',
      'Each of the 6 rooms has 4 upgrade axes: Craft (quality), Scale (capacity), Automate (background agents), and Luck (variance).',
      'Upgrading Automate from Rank 1 to Rank 5 deploys autonomous background agents that execute room tasks automatically!',
      'When all 6 rooms are automated, your company runs as a self-driving machine — but monitor Operations strain!',
    ],
    keyTakeaway: 'Prioritize Automate and Scale upgrades early so your attention is freed for macro strategy.',
    highlightRoom: 'Skill Tree [S]',
  },
  {
    stepNumber: '04 / 04',
    title: 'ROGUELIKE RELICS & QUARTER REVIEWS',
    tagline: 'Compound unfair advantages every 90 days',
    diagramIcon: '/assets/2.5d/expansion_intelligence.png',
    content: [
      'Every 90 in-game days (~3 minutes), the Board of Directors convenes for Quarter Review.',
      'You are evaluated on Net ARR Addition, Gross Margins, and Churn Rate.',
      'Exceeding your quarterly target grants Prestige Tokens to draft powerful Relics and Tactical Consumables.',
      'Relics grant permanent game-warping passives (e.g., automated CI/CD diff checks, viral growth loops, emergency liquidity cushions).',
      'Consumables sit in your holster and can be deployed instantly during emergencies.',
    ],
    keyTakeaway: 'Synergize your Relics with your Engine Archetype to reach the coveted $1 Billion valuation.',
    highlightRoom: 'Quarter Review & Holster',
  },
]

export const GuidedTutorialModal: React.FC<GuidedTutorialModalProps> = ({ onClose, dispatch }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  const slide = SLIDES[currentSlideIndex]
  const isFirst = currentSlideIndex === 0
  const isLast = currentSlideIndex === SLIDES.length - 1

  const handleNext = () => {
    sound.playClick()
    if (isLast) {
      dispatch({ type: 'tutorial.complete' })
      onClose()
    } else {
      setCurrentSlideIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    sound.playClick()
    if (!isFirst) {
      setCurrentSlideIndex(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    sound.playClick()
    dispatch({ type: 'tutorial.complete' })
    onClose()
  }

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) handleSkip()
      }}
    >
      <div
        className="tutorial-modal-card animate-slide-up liquid-chrome-border"
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -10px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'relative',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                className="font-mono"
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  color: '#0284C7',
                  backgroundColor: 'rgba(2, 132, 199, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                }}
              >
                NEXUS ONBOARDING GUIDE
              </span>
              <span
                className="font-mono"
                style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}
              >
                STEP {slide.stepNumber}
              </span>
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                margin: '10px 0 4px 0',
              }}
            >
              {slide.title}
            </h2>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
              {slide.tagline}
            </p>
          </div>

          <button
            onClick={handleSkip}
            className="cred-3d-button cred-3d-button-light font-mono"
            style={{
              fontSize: '11px',
              padding: '6px 12px',
            }}
          >
            SKIP TUTORIAL ✕
          </button>
        </div>

        {/* Visual Presentation Area */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            padding: '20px',
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
          }}
        >
          <div
            className="liquid-chrome-icon-box"
            style={{
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src={slide.diagramIcon}
              alt={slide.title}
              style={{
                width: '56px',
                height: '56px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {slide.content.map((bullet, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: '12.5px',
                    color: '#1E293B',
                    lineHeight: '1.45',
                  }}
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Key Takeaway Callout */}
        <div
          style={{
            backgroundColor: '#F0F9FF',
            borderLeft: '3px solid #0284C7',
            padding: '12px 16px',
            borderRadius: '0 8px 8px 0',
          }}
        >
          <div
            className="font-mono"
            style={{ fontSize: '9.5px', fontWeight: 800, color: '#0284C7', letterSpacing: '0.1em' }}
          >
            TACTICAL PRINCIPLE
          </div>
          <p
            style={{
              fontSize: '12.5px',
              color: '#0F172A',
              margin: '4px 0 0 0',
              fontWeight: 500,
            }}
          >
            {slide.keyTakeaway}
          </p>
        </div>

        {/* Stepper Dots & Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sound.playClick()
                  setCurrentSlideIndex(idx)
                }}
                style={{
                  width: idx === currentSlideIndex ? '28px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: idx === currentSlideIndex ? '#0284C7' : '#CBD5E1',
                  transition: 'all 200ms ease',
                }}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="cred-3d-button cred-3d-button-light font-mono"
                style={{
                  padding: '9px 18px',
                  fontSize: '12px',
                }}
              >
                ← PREV
              </button>
            )}

            <button
              onClick={handleNext}
              className={`cred-3d-button ${isLast ? 'cred-3d-button-emerald' : 'cred-3d-button-cyan'} font-mono`}
              style={{
                padding: '9px 24px',
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              {isLast ? 'LAUNCH FOUNDER RUN ⚡' : 'NEXT STEP →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
