import React, { useState, useEffect, useCallback, useRef } from "react"
import type { GameState, FunctionId, ProgressionAxis } from "../../engine/types"
import type { GameAction } from "../../engine/actions"
import { sound } from "../../audio/soundEngine"
import {
  SCALE_UNITS,
  getMaxUnlockedSpeed,
} from "../../engine/constants"
import { getUpgradeRankCost } from "../../engine/formulas"
import { getSkillTreeUpgradeAsset, getSkillTreeUpgradeInfo } from "../../engine/assets"


interface SkillTreeModalProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onClose: () => void
}

type OperationalFunctionId = Exclude<FunctionId, "finance">

interface NodeIdentifier {
  functionId: OperationalFunctionId
  axis: ProgressionAxis
  tier: number // 1 to 5
}

const FUNCTIONS_ORDER: OperationalFunctionId[] = [
  "demand",
  "product",
  "monetisation",
  "retention",
  "expansion",
  "operations"
]

const FUNCTION_INFO: Record<
  Exclude<FunctionId, "finance">,
  {
    name: string
    code: string
    angleDeg: number
    color: string
    glowColor: string
    desc: string
  }
> = {
  demand: {
    name: "Demand",
    code: "01",
    angleDeg: -90, // Top
    color: "#E11D48",
    glowColor: "rgba(225, 29, 72, 0.25)",
    desc: "Inbound market signals, qualification filters, and lead acquisition.",
  },
  product: {
    name: "Product",
    code: "02",
    angleDeg: -30, // Top-Right
    color: "#58D9FF",
    glowColor: "rgba(88, 217, 255, 0.35)",
    desc: "Autonomous build pipelines, capability synthesis, and defect prevention.",
  },
  monetisation: {
    name: "Monetisation",
    code: "03",
    angleDeg: 30, // Bottom-Right
    color: "#FFC857",
    glowColor: "rgba(255, 200, 87, 0.35)",
    desc: "Contract pricing yield, closing velocity, and ARR compounding.",
  },
  retention: {
    name: "Retention",
    code: "04",
    angleDeg: 90, // Bottom
    color: "#6F8CFF",
    glowColor: "rgba(111, 140, 255, 0.35)",
    desc: "Account telemetry, health stabilization, and anti-churn triage.",
  },
  expansion: {
    name: "Expansion",
    code: "05",
    angleDeg: 150, // Bottom-Left
    color: "#A778FF",
    glowColor: "rgba(167, 120, 255, 0.35)",
    desc: "Account upsells, module add-ons, and contractual NRR expansion.",
  },
  operations: {
    name: "Operations",
    code: "06",
    angleDeg: 210, // Top-Left
    color: "#B5F35A",
    glowColor: "rgba(181, 243, 90, 0.35)",
    desc: "Fleet coordination, context rot hygiene, and incident resolution.",
  },
}

const AXIS_KEYS: ProgressionAxis[] = ["craft", "scale", "automate", "luck"]

const AXIS_CONFIG: Record<
  ProgressionAxis,
  {
    name: string
    code: string
    color: string
    angleOffsetDeg: number
  }
> = {
  craft: {
    name: "CRAFT",
    code: "CRFT",
    color: "#58D9FF",
    angleOffsetDeg: -19,
  },
  scale: {
    name: "SCALE",
    code: "SCLE",
    color: "#FFC857",
    angleOffsetDeg: -6.5,
  },
  automate: {
    name: "AUTOMATE",
    code: "AUTO",
    color: "#B5F35A",
    angleOffsetDeg: 6.5,
  },
  luck: {
    name: "LUCK",
    code: "LUCK",
    color: "#A778FF",
    angleOffsetDeg: 19,
  },
}

// Distance constants for concentric rings (5 tiers)
const RADIUS_HUB = 250
const TIER_RADII = [420, 600, 780, 960, 1140]

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({ state, dispatch, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.85)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<NodeIdentifier | null>({
    functionId: "product",
    axis: "automate",
    tier: (state.fleet.product.automateRank < 5 ? state.fleet.product.automateRank + 1 : 5)
  })
  const [selectedHub, setSelectedHub] = useState<OperationalFunctionId | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'canvas'>(() => (typeof window !== 'undefined' && window.innerWidth <= 768) ? 'cards' : 'canvas')
  const [activeSector, setActiveSector] = useState<OperationalFunctionId>('demand')
  const hasSyndicate = state.activeRelics.some(r => r.id === 'relic-syndicate')
  const hasHoldingSwarm = state.activeRelics.some(r => r.id === 'relic-holding-swarm')

  // Center canvas on mount & handle viewport resize
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPan({ x: rect.width / 2, y: rect.height / 2 })
    }

    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setPan({ x: rect.width / 2, y: rect.height / 2 })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate total researched nodes
  let totalResearched = 0
  FUNCTIONS_ORDER.forEach(fn => {
    const f = state.fleet[fn]
    totalResearched += f.craftRank + f.scaleRank + f.automateRank + f.luckRank
  })

  // Pan interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
    setZoom(prev => Math.min(1.8, Math.max(0.35, prev * zoomFactor)))
  }

  // Quick jump to sector
  const handleFocusSector = (fn: OperationalFunctionId | 'core') => {
    sound.playClick()
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    if (fn === 'core') {
      setSelectedHub(null)
      setPan({ x: centerX, y: centerY })
      setZoom(0.85)
      return
    }

    setSelectedHub(fn)
    const info = FUNCTION_INFO[fn]
    const rad = (info.angleDeg * Math.PI) / 180
    const targetDist = 600
    const targetX = targetDist * Math.cos(rad)
    const targetY = targetDist * Math.sin(rad)

    setPan({
      x: centerX - targetX * 0.75,
      y: centerY - targetY * 0.75
    })
    setZoom(0.75)
  }

  // Buy upgrade action
  const handleBuyUpgrade = useCallback(
    (fn: OperationalFunctionId, axis: ProgressionAxis) => {
      sound.playClick()
      dispatch({ type: "fleet.buy_upgrade", functionId: fn, axis })
    },
    [dispatch]
  )

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault()
        setZoom(prev => Math.min(1.8, prev * 1.15))
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault()
        setZoom(prev => Math.max(0.35, prev * 0.85))
      } else if (e.key === "0") {
        e.preventDefault()
        handleFocusSector('core')
      } else if ((e.key === "Enter" || e.key === " " || (e.key >= "1" && e.key <= "5")) && selectedNode) {
        const f = state.fleet[selectedNode.functionId]
        const currentRank = f[`${selectedNode.axis}Rank`]
        const nextCost = currentRank < 5 ? getUpgradeRankCost(currentRank, hasSyndicate) : null
        if (nextCost && state.cashCents >= nextCost) {
          e.preventDefault()
          handleBuyUpgrade(selectedNode.functionId, selectedNode.axis)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, selectedNode, state.cashCents, state.fleet, handleBuyUpgrade, hasSyndicate])

  // Helper to format currency
  const formatCost = (cents: number) => {
    if (cents >= 1_000_000) return `$${(cents / 100_000).toFixed(1)}k`
    if (cents >= 100_000) return `$${Math.round(cents / 100).toLocaleString()}`
    return `$${Math.round(cents / 100)}`
  }

  const formatDollars = (cents: number) => {
    const dollars = Math.round(cents / 100)
    if (dollars >= 1_000_000_000) return `$${(dollars / 1_000_000_000).toFixed(2)}B`
    if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`
    if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`
    return `$${dollars.toLocaleString()}`
  }

  // Quarter countdown: 1,800 ticks per quarter (10 ticks/second = 180s)
  const quarterTicks = 1800
  const elapsedInQuarter = state.elapsedTicks % quarterTicks
  const ticksRemaining = Math.max(0, quarterTicks - elapsedInQuarter)
  const secondsRemaining = Math.floor(ticksRemaining / 10)
  const mins = Math.floor(secondsRemaining / 60)
  const secs = secondsRemaining % 60
  const quarterProgressPct = Math.min(100, (elapsedInQuarter / quarterTicks) * 100)

  // 180s obligations: upcoming bills due in next quarter
  const upcomingObligationsCents = (state.mandatoryBills || []).reduce((acc, b) => acc + b.amountCents, 0)
    || (state.opexMonthCents + state.cogsMonthCents) * 3

  // Next operating bill obligation & critical alert threshold:
  const nextBill = state.mandatoryBills?.[0]
  const nextBillAmountCents = nextBill?.amountCents ?? (state.opexMonthCents + state.cogsMonthCents)
  const isOnlyNextBillRemaining = state.cashCents <= nextBillAmountCents && nextBillAmountCents > 0

  const handleTogglePause = () => {
    sound.playClick()
    dispatch({ type: state.paused ? 'run.resume' : 'run.pause' })
  }

  const handleCycleSpeed = () => {
    sound.playClick()
    const maxUnlockedSpeed = getMaxUnlockedSpeed(state.founderHistory)
    const speeds = [1, 2, 5].filter(s => s <= maxUnlockedSpeed)
    const currentIdx = speeds.indexOf(state.speedMultiplier)
    const nextSpeed = speeds[(currentIdx + 1) % speeds.length]
    dispatch({ type: 'run.set_speed', speed: nextSpeed })
    if (state.paused) dispatch({ type: 'run.resume' })
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 15, 29, 0.72)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Top Glass Header & Navigation Bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          borderBottom: "1px solid rgba(15, 23, 42, 0.12)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
          zIndex: 10,
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "220px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              flexShrink: 0,
            }}
          >
            <span className="font-mono" style={{ fontSize: '12px', fontWeight: 900, color: '#4F46E5' }}>120</span>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
                Architecture Matrix
              </span>
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 700,
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  color: "#4F46E5",
                  padding: "1px 6px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  textTransform: "uppercase",
                }}
              >
                120 Nodes
              </span>
            </div>
          </div>
        </div>

        {/* Quick-Sector Jump Navigation Pills */}
        <div className="mobile-hide" style={{ display: "flex", alignItems: "center", gap: "5px", overflowX: "auto", maxWidth: "100%", padding: "2px 0", WebkitOverflowScrolling: "touch" }}>
          <button
            onClick={() => handleFocusSector('core')}
            style={{
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "10.5px",
              fontWeight: 600,
              backgroundColor: selectedHub === null ? "#0284C7" : "rgba(15, 23, 42, 0.05)",
              color: selectedHub === null ? "#FFFFFF" : "#475569",
              border: selectedHub === null ? "1px solid #0284C7" : "1px solid rgba(15, 23, 42, 0.1)",
              cursor: "pointer",
              transition: "all 120ms ease",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            NEXUS ({totalResearched}/120)
          </button>

          {FUNCTIONS_ORDER.map(fn => {
            const info = FUNCTION_INFO[fn]
            const fleet = state.fleet[fn]
            const sectorResearched = fleet.craftRank + fleet.scaleRank + fleet.automateRank + fleet.luckRank
            const isSelected = selectedHub === fn

            return (
              <button
                key={fn}
                onClick={() => handleFocusSector(fn)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: 600,
                  backgroundColor: isSelected ? info.color : "rgba(15, 23, 42, 0.04)",
                  color: isSelected ? "#FFFFFF" : "#334155",
                  border: isSelected ? `1px solid ${info.color}` : "1px solid rgba(15, 23, 42, 0.08)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 120ms ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: isSelected ? "#FFFFFF" : info.color,
                  }}
                />
                <span>{info.name}</span>
                <span style={{ opacity: 0.75, fontSize: "10px" }}>({sectorResearched}/20)</span>
              </button>
            )
          })}
        </div>

        {/* Header Right: Mode Toggle, Cash & Close Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* View Mode Toggle Button */}
          <button
            onClick={() => {
              sound.playClick()
              setViewMode(prev => prev === 'cards' ? 'canvas' : 'cards')
            }}
            className="cred-3d-button cred-3d-button-light font-mono"
            style={{
              padding: "5px 10px",
              fontSize: "11px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title={viewMode === 'cards' ? 'Switch to Radial Holographic Canvas' : 'Switch to Touch Cards View'}
          >
            {viewMode === 'cards' ? '🌐 Canvas' : '📋 Cards'}
          </button>

          <button
            onClick={onClose}
            className="cred-3d-button cred-3d-button-light"
            style={{
              padding: "6px 12px",
              fontSize: "14px",
              lineHeight: 1,
            }}
            title="Close Architecture Matrix (Esc)"
          >
            ✕
          </button>
        </div>
      </header>

      {/* AEROSPACE TELEMETRY RIBBON (Top HUD Metrics) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          flexWrap: "wrap",
          gap: "12px",
          zIndex: 9,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          {/* VALUATION */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '95px' }}>
            <span className="font-mono" style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.1em', color: '#64748B' }}>
              VALUATION
            </span>
            <span className="font-display" style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {formatDollars(state.valuationCents)}
            </span>
            <span className="font-mono" style={{ fontSize: '8.5px', color: '#94A3B8' }}>
              TARGET $1B
            </span>
          </div>

          {/* ARR */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '95px' }}>
            <span className="font-mono" style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.1em', color: '#64748B' }}>
              ARR
            </span>
            <span className="font-display" style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {formatDollars(state.contractualArrCents)}
            </span>
            <span className="font-mono" style={{ fontSize: '8.5px', color: '#64748B' }}>
              {state.accounts.length} paying customers
            </span>
          </div>

          {/* LIQUID CASH */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '115px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="font-mono" style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.1em', color: '#64748B' }}>
                LIQUID CASH
              </span>
              {isOnlyNextBillRemaining && (
                <span
                  className="font-mono animate-pulse-critical"
                  style={{
                    fontSize: '7.5px',
                    fontWeight: 800,
                    color: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    padding: '0 4px',
                    borderRadius: '9999px',
                    lineHeight: 1.2,
                  }}
                  title={`Critical treasury alert: Cash ($${Math.round(state.cashCents / 100).toLocaleString()}) only covers next bill ($${Math.round(nextBillAmountCents / 100).toLocaleString()})!`}
                >
                  ⚠️ 1 BILL LEFT
                </span>
              )}
            </div>
            <span className="font-display" style={{ fontSize: '17px', fontWeight: 800, color: isOnlyNextBillRemaining || state.cashCents < 50_000_00 ? '#E11D48' : '#059669', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {formatDollars(state.cashCents)}
            </span>
            <span className="font-mono" style={{ fontSize: '8.5px', color: '#64748B' }}>
              {formatDollars(upcomingObligationsCents)} 180s obligations
            </span>
          </div>

          {/* QUARTER PROGRESS */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '95px' }}>
            <span className="font-mono" style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.1em', color: '#64748B' }}>
              QUARTER {state.quarter}
            </span>
            <span className="font-mono" style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
            <div
              style={{
                width: '100%',
                height: '3px',
                backgroundColor: '#E2E8F0',
                borderRadius: '2px',
                overflow: 'hidden',
                marginTop: '2px',
              }}
            >
              <div
                style={{
                  width: `${quarterProgressPct}%`,
                  height: '100%',
                  backgroundColor: '#0284C7',
                  transition: 'width 250ms ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Simulation Controls: Pause & Speed */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={handleTogglePause}
            className={`cred-3d-button font-mono ${state.paused ? 'cred-3d-button-amber' : 'cred-3d-button-light'}`}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
            }}
            title={state.paused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {state.paused ? '▶ Resume' : '⏸ Pause'}
          </button>

          <button
            onClick={handleCycleSpeed}
            className="cred-3d-button cred-3d-button-light font-mono"
            style={{
              padding: '4px 9px',
              fontSize: '11px',
              fontWeight: 700,
            }}
            title="Cycle Speed (1x, 2x, 5x)"
          >
            {state.speedMultiplier}×
          </button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        /* TOUCH-FRIENDLY MOBILE CARDS VIEW */
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '14px 14px 36px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            WebkitOverflowScrolling: 'touch',
            maxWidth: '640px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {/* 1. HORIZONTAL SECTOR SELECTOR STRIP */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              padding: '4px 2px 8px 2px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              width: '100%',
              flexShrink: 0,
            }}
          >
            {FUNCTIONS_ORDER.map(fn => {
              const info = FUNCTION_INFO[fn]
              const isSelected = activeSector === fn
              const f = state.fleet[fn]
              const sectorResearched = f.craftRank + f.scaleRank + f.automateRank + f.luckRank

              return (
                <button
                  key={fn}
                  onClick={() => {
                    sound.playClick()
                    setActiveSector(fn)
                  }}
                  style={{
                    flexShrink: 0,
                    padding: '8px 14px',
                    borderRadius: '12px',
                    border: isSelected ? `2px solid ${info.color}` : '1px solid rgba(255, 255, 255, 0.22)',
                    backgroundColor: isSelected ? '#FFFFFF' : 'rgba(15, 23, 42, 0.65)',
                    color: isSelected ? '#0F172A' : '#F8FAFC',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '4px',
                    minWidth: '105px',
                    minHeight: '52px',
                    boxSizing: 'border-box',
                    transition: 'all 120ms ease',
                    boxShadow: isSelected ? `0 4px 14px rgba(0,0,0,0.25), 0 0 10px ${info.glowColor}` : '0 2px 6px rgba(0,0,0,0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: info.color,
                        boxShadow: isSelected ? `0 0 6px ${info.color}` : 'none',
                      }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>{info.name}</span>
                  </div>
                  <span style={{ fontSize: '10px', opacity: isSelected ? 0.75 : 0.7, fontFamily: 'monospace' }}>
                    {sectorResearched}/20 Ranks
                  </span>
                </button>
              )
            })}
          </div>

          {/* 2. SECTOR HEADER BANNER */}
          {(() => {
            const activeInfo = FUNCTION_INFO[activeSector]
            const f = state.fleet[activeSector]
            const activeTotal = f.craftRank + f.scaleRank + f.automateRank + f.luckRank
            const pct = Math.round((activeTotal / 20) * 100)

            return (
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.96)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  border: `1.5px solid ${activeInfo.color}45`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 900,
                        letterSpacing: '0.1em',
                        color: activeInfo.color,
                        textTransform: 'uppercase',
                        fontFamily: 'monospace',
                      }}
                    >
                      SECTOR // 0{FUNCTIONS_ORDER.indexOf(activeSector) + 1}
                    </span>
                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>·</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                      {activeTotal}/20 Researched
                    </span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                    {activeInfo.name} Architecture
                  </div>
                </div>

                <div
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    backgroundColor: `${activeInfo.color}18`,
                    border: `1px solid ${activeInfo.color}40`,
                    fontSize: '12px',
                    fontWeight: 800,
                    color: activeInfo.color,
                    fontFamily: 'monospace',
                  }}
                >
                  {pct}%
                </div>
              </div>
            )
          })()}

          {/* 3. THE 4 PROGRESSION AXIS CARDS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {AXIS_KEYS.map(axis => {
              const axisCfg = AXIS_CONFIG[axis]
              const f = state.fleet[activeSector]
              const currentRank = f[`${axis}Rank`]
              const isMaxed = currentRank >= 5
              const nextTierIdx = currentRank
              const nextCostCents = !isMaxed ? getUpgradeRankCost(currentRank, hasSyndicate) : null
              const canAfford = nextCostCents !== null && state.cashCents >= nextCostCents
              const currentTierInfo = currentRank > 0 ? getSkillTreeUpgradeInfo(activeSector, axis, currentRank) : null
              const nextTierInfo = !isMaxed ? getSkillTreeUpgradeInfo(activeSector, axis, nextTierIdx + 1) : null

              return (
                <div
                  key={axis}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '14px',
                    border: `1.5px solid ${currentRank > 0 ? axisCfg.color + '45' : 'rgba(15, 23, 42, 0.08)'}`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {/* Card Top: Axis Tag + 5-Pip Rank Meter */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 900,
                          letterSpacing: '0.08em',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: `${axisCfg.color}18`,
                          color: axisCfg.color,
                          fontFamily: 'monospace',
                        }}
                      >
                        {axisCfg.code}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                        {axisCfg.name}
                      </span>
                    </div>

                    {/* 5 Rank Pips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map(step => (
                        <span
                          key={step}
                          style={{
                            width: '14px',
                            height: '6px',
                            borderRadius: '2px',
                            backgroundColor: step <= currentRank ? axisCfg.color : '#E2E8F0',
                            transition: 'background-color 200ms ease',
                          }}
                        />
                      ))}
                      <span className="font-mono" style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', marginLeft: '4px' }}>
                        {currentRank}/5
                      </span>
                    </div>
                  </div>

                  {/* Current Active Perk */}
                  <div
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.03)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#64748B', flexShrink: 0 }}>
                      Current:
                    </div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: currentRank > 0 ? '#0F172A' : '#94A3B8', textAlign: 'right' }}>
                      {currentTierInfo ? currentTierInfo.desc : 'Baseline (Rank 0)'}
                    </div>
                  </div>

                  {/* Next Tier Upgrade Info & 1-Tap Research Button */}
                  {!isMaxed && nextTierInfo ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={getSkillTreeUpgradeAsset(activeSector, axis, currentRank + 1)}
                          alt={nextTierInfo.label}
                          style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                            Tier {currentRank + 1}: {nextTierInfo.label}
                          </div>
                          <div style={{ fontSize: '11px', color: axisCfg.color, fontWeight: 700, marginTop: '1px' }}>
                            {nextTierInfo.desc}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleBuyUpgrade(activeSector, axis)}
                        disabled={!canAfford}
                        className={`cred-3d-button ${canAfford ? 'cred-3d-button-emerald' : 'cred-3d-button-light'}`}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          fontSize: '12.5px',
                          fontWeight: 800,
                          opacity: canAfford ? 1 : 0.6,
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        {canAfford ? (
                          <>
                            <span>Research Tier {currentRank + 1}</span>
                            <span className="font-mono">({formatCost(nextCostCents!)})</span>
                            {hasSyndicate && (
                              <span style={{ fontSize: '9px', backgroundColor: '#B5F35A', color: '#0F172A', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                                -35% Syndicate
                              </span>
                            )}
                            <span>→</span>
                          </>
                        ) : (
                          <>
                            <span>Requires {formatCost(nextCostCents!)}</span>
                            {hasSyndicate && (
                              <span style={{ fontSize: '9px', backgroundColor: '#E2E8F0', color: '#64748B', padding: '1px 4px', borderRadius: '4px', fontWeight: 800 }}>
                                -35%
                              </span>
                            )}
                            <span className="font-mono" style={{ fontSize: '10.5px', opacity: 0.8 }}>
                              (Have {formatCost(state.cashCents)})
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        textAlign: 'center',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        color: '#059669',
                      }}
                    >
                      ✦ MAX TIER 5 COMPLETED
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Main Interactive Radial Canvas */
        <div
          ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          flex: 1,
          position: "relative",
          cursor: isDragging ? "grabbing" : "grab",
          overflow: "hidden",
          backgroundColor: "#F1F5F9",
          backgroundImage: `
            radial-gradient(circle, rgba(148, 163, 184, 0.35) 1.2px, transparent 1.2px)
          `,
          backgroundSize: "28px 28px",
        }}
      >
        {/* Floating Zoom & Canvas Controls (Bottom-Right) */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            zIndex: 20,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: "6px",
            borderRadius: "12px",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border-hairline)",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
          }}
        >
          <button
            onClick={() => setZoom(prev => Math.min(1.8, prev * 1.2))}
            style={{ padding: "8px", color: "var(--text-ink)", borderRadius: "8px", cursor: "pointer", background: "transparent", border: "none" }}
            title="Zoom In (+)"
          >
            <span className="font-mono" style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1 }}>+</span>
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.35, prev * 0.8))}
            style={{ padding: "8px", color: "var(--text-ink)", borderRadius: "8px", cursor: "pointer", background: "transparent", border: "none" }}
            title="Zoom Out (-)"
          >
            <span className="font-mono" style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1 }}>−</span>
          </button>
          <button
            onClick={() => handleFocusSector('core')}
            style={{ padding: "8px", color: "var(--text-ink)", borderRadius: "8px", cursor: "pointer", background: "transparent", border: "none" }}
            title="Reset to Center (0)"
          >
            <span className="font-mono" style={{ fontSize: '10px', fontWeight: 800 }}>RST</span>
          </button>
          <div
            className="font-mono"
            style={{
              fontSize: "10px",
              color: "var(--text-secondary)",
              textAlign: "center",
              padding: "4px 0",
              borderTop: "1px solid var(--border-hairline)",
            }}
          >
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Floating Inspector Panel (Bottom-Left) */}
        {selectedNode && (
          <div
            className="animate-slide-up"
            style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              width: "calc(100% - 40px)",
              maxWidth: "360px",
              backgroundColor: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1.5px solid ${AXIS_CONFIG[selectedNode.axis].color}55`,
              borderRadius: "18px",
              padding: "20px",
              color: "var(--text-ink)",
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.04)",
              zIndex: 20,
            }}
          >
            {(() => {
              const fn = selectedNode.functionId
              const fnInfo = FUNCTION_INFO[fn]
              const axis = selectedNode.axis
              const axisInfo = AXIS_CONFIG[axis]
              const tier = selectedNode.tier
              const tierInfo = getSkillTreeUpgradeInfo(fn, axis, tier)
              const f = state.fleet[fn]
              const currentRank = f[`${axis}Rank`]
              const isResearched = currentRank >= tier
              const isAvailable = currentRank === tier - 1
              const cost = getUpgradeRankCost(tier - 1, hasSyndicate)
              const canAfford = state.cashCents >= cost

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Breadcrumbs */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", color: fnInfo.color }}>
                      <span>{fnInfo.name}</span>
                      <span style={{ color: "#64748B" }}>/</span>
                      <span style={{ color: axisInfo.color }}>{axisInfo.name}</span>
                      <span style={{ color: "#64748B" }}>/</span>
                      <span style={{ color: "#94A3B8" }}>TIER {tier}</span>
                    </div>

                    <button
                      onClick={() => setSelectedNode(null)}
                      style={{ color: "#64748B", padding: "2px", cursor: "pointer" }}
                    >
                      <span style={{ fontSize: '13px', lineHeight: 1, fontFamily: 'monospace' }}>✕</span>
                    </button>
                  </div>

                  {/* Title & 2.5D Icon */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      className="liquid-chrome-icon-box"
                      style={{
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={getSkillTreeUpgradeAsset(fn, axis, tier)}
                        alt={tierInfo.label}
                        style={{ width: "38px", height: "38px", objectFit: "contain" }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-ink)" }}>
                        {tierInfo.label}
                      </div>
                      <div style={{ fontSize: "11px", color: axisInfo.color, fontWeight: 600 }}>
                        {tierInfo.desc}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.45, backgroundColor: "var(--surface-work)", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-hairline)" }}>
                    {tierInfo.detail}
                  </div>

                  {/* Pricing and Action */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                        Research Investment
                      </div>
                      <div className="font-mono" style={{ fontSize: "16px", fontWeight: 800, color: canAfford ? "var(--color-positive)" : "var(--color-critical)" }}>
                        {formatCost(cost)}
                        {hasSyndicate && (
                          <span style={{ fontSize: "10px", color: "#10B981", marginLeft: "6px", fontWeight: 800 }}>
                            (-35% Syndicate)
                          </span>
                        )}
                      </div>
                    </div>

                    {isResearched ? (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                          color: "#10B981",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          padding: "8px 16px",
                          borderRadius: "9999px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ fontWeight: 800 }}>✓</span>
                        <span>ACTIVE / RESEARCHED</span>
                      </div>
                    ) : isAvailable ? (
                      <button
                        onClick={() => handleBuyUpgrade(fn, axis)}
                        disabled={!canAfford}
                        className={`cred-3d-button ${canAfford ? 'cred-3d-button-emerald' : 'cred-3d-button-disabled'}`}
                        style={{
                          padding: "8px 18px",
                          fontSize: "12px",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontWeight: 800 }}>→</span>
                        <span>RESEARCH TIER {tier}</span>
                      </button>
                    ) : (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "#F1F5F9",
                          color: "#64748B",
                          border: "1px solid var(--border-hairline)",
                          padding: "8px 14px",
                          borderRadius: "9999px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        <span className="font-mono" style={{ fontSize: '9px', fontWeight: 800 }}>[LOCK]</span>
                        <span>LOCKED (Needs Tier {tier - 1})</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* TRANSFORMATION STAGE: World space anchored at (pan.x, pan.y) with scale(zoom) */}
        <div
          style={{
            position: "absolute",
            left: `${pan.x}px`,
            top: `${pan.y}px`,
            transform: `scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isDragging ? "none" : "transform 140ms ease-out",
            pointerEvents: "none",
          }}
        >
          {/* SVG CABLES & CONNECTIONS LAYER */}
          <svg
            style={{
              position: "absolute",
              left: "-1800px",
              top: "-1800px",
              width: "3600px",
              height: "3600px",
              pointerEvents: "none",
              overflow: "visible",
            }}
          >
            {/* Shift SVG coordinate space so (1800, 1800) maps to (0, 0) */}
            <g transform="translate(1800, 1800)">
              {/* Concentric Guide Orbit Rings */}
              <circle r={RADIUS_HUB} fill="none" stroke="rgba(148, 163, 184, 0.4)" strokeDasharray="4 8" strokeWidth="1" />
              {TIER_RADII.map((r, idx) => (
                <circle
                  key={idx}
                  r={r}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.3)"
                  strokeDasharray="6 12"
                  strokeWidth="1"
                />
              ))}

              {/* Draw Cables from Center to 6 Functional Hubs, then to 4 Axes & 4 Tiers */}
              {FUNCTIONS_ORDER.map(fn => {
                const info = FUNCTION_INFO[fn]
                const fleet = state.fleet[fn]
                const radCenter = (info.angleDeg * Math.PI) / 180
                const hubX = RADIUS_HUB * Math.cos(radCenter)
                const hubY = RADIUS_HUB * Math.sin(radCenter)

                // Cable from Origin (0, 0) to Hub
                const hubHasUpgrades = (fleet.craftRank + fleet.scaleRank + fleet.automateRank + fleet.luckRank) > 0

                return (
                  <g key={fn}>
                    {/* Cable Center -> Hub */}
                    <line
                      x1={0}
                      y1={0}
                      x2={hubX}
                      y2={hubY}
                      stroke={hubHasUpgrades ? info.color : "rgba(148, 163, 184, 0.45)"}
                      strokeWidth={hubHasUpgrades ? 2.5 : 1.5}
                      strokeDasharray={hubHasUpgrades ? undefined : "3 6"}
                      opacity={hubHasUpgrades ? 0.8 : 0.4}
                    />

                    {/* For each of the 4 axes */}
                    {AXIS_KEYS.map(axis => {
                      const axisInfo = AXIS_CONFIG[axis]
                      const totalAngleDeg = info.angleDeg + axisInfo.angleOffsetDeg
                      const totalRad = (totalAngleDeg * Math.PI) / 180
                      const rank = fleet[`${axis}Rank`]

                      // Cable Hub -> Tier 1
                      const t1X = TIER_RADII[0] * Math.cos(totalRad)
                      const t1Y = TIER_RADII[0] * Math.sin(totalRad)
                      const isT1Active = rank >= 1

                      return (
                        <g key={axis}>
                          {/* Bézier curve from Hub to Tier 1 */}
                          <path
                            d={`M ${hubX} ${hubY} Q ${(hubX + t1X) / 2} ${(hubY + t1Y) / 2} ${t1X} ${t1Y}`}
                            fill="none"
                            stroke={isT1Active ? axisInfo.color : "rgba(148, 163, 184, 0.4)"}
                            strokeWidth={isT1Active ? 2.5 : 1.2}
                            strokeDasharray={isT1Active ? undefined : "4 6"}
                            opacity={isT1Active ? 0.9 : 0.4}
                          />

                          {/* Consecutive tier cables: T1 -> T2 -> T3 -> T4 -> T5 */}
                          {[1, 2, 3, 4].map(tIdx => {
                            const pX = TIER_RADII[tIdx - 1] * Math.cos(totalRad)
                            const pY = TIER_RADII[tIdx - 1] * Math.sin(totalRad)
                            const nX = TIER_RADII[tIdx] * Math.cos(totalRad)
                            const nY = TIER_RADII[tIdx] * Math.sin(totalRad)
                            const isNextActive = rank >= (tIdx + 1)
                            const isNextAvailable = rank === tIdx

                            return (
                              <line
                                key={tIdx}
                                x1={pX}
                                y1={pY}
                                x2={nX}
                                y2={nY}
                                stroke={
                                  isNextActive
                                    ? axisInfo.color
                                    : isNextAvailable
                                    ? axisInfo.color
                                    : "rgba(148, 163, 184, 0.35)"
                                }
                                strokeWidth={isNextActive ? 2.5 : isNextAvailable ? 1.8 : 1}
                                strokeDasharray={isNextActive ? undefined : "3 5"}
                                opacity={isNextActive ? 0.85 : isNextAvailable ? 0.5 : 0.3}
                              />
                            )
                          })}
                        </g>
                      )
                    })}
                  </g>
                )
              })}
            </g>
          </svg>

          {/* HTML INTERACTIVE NODES LAYER */}
          <div style={{ position: "absolute", left: 0, top: 0, pointerEvents: "auto" }}>
            {/* 1. CENTER FOUNDER ARCHITECTURE NEXUS */}
            <div
              onClick={() => handleFocusSector('core')}
              style={{
                position: "absolute",
                transform: "translate(-50%, -50%)",
                width: "160px",
                height: "160px",
                borderRadius: "50%",
                backgroundColor: "#FFFFFF",
                border: "2.5px solid #6366F1",
                boxShadow: "0 0 40px rgba(99, 102, 241, 0.22), 0 4px 20px rgba(15, 23, 42, 0.08)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: "12px",
                textAlign: "center",
                zIndex: 15,
                transition: "all 180ms ease",
              }}
              className="hover-card"
            >
              <span className="font-mono" style={{ fontSize: '20px', fontWeight: 900, color: '#4F46E5', letterSpacing: '-1px' }}>120</span>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-ink)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                SOLOUNICORN
              </div>
              <div style={{ fontSize: "9px", color: "var(--text-secondary)", marginTop: "2px" }}>
                FOUNDER NEXUS
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#059669",
                  marginTop: "6px",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                }}
              >
                {totalResearched} / 120 Active
              </div>
            </div>

            {/* 2. THE 6 RADIAL FUNCTIONAL HUBS */}
            {FUNCTIONS_ORDER.map(fn => {
              const info = FUNCTION_INFO[fn]
              const fleet = state.fleet[fn]
              const rad = (info.angleDeg * Math.PI) / 180
              const x = RADIUS_HUB * Math.cos(rad)
              const y = RADIUS_HUB * Math.sin(rad)
              const isSelected = selectedHub === fn
              const sectorResearched = fleet.craftRank + fleet.scaleRank + fleet.automateRank + fleet.luckRank

              return (
                <div
                  key={fn}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedHub(fn)
                    sound.playClick()
                  }}
                  style={{
                    position: "absolute",
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: "translate(-50%, -50%)",
                    width: "140px",
                    backgroundColor: "#FFFFFF",
                    border: `1.5px solid ${isSelected ? info.color : `var(--border-hairline)`}`,
                    borderRadius: "14px",
                    padding: "10px 12px",
                    boxShadow: isSelected
                      ? `0 0 24px ${info.glowColor}, 0 6px 20px rgba(15, 23, 42, 0.12)`
                      : "0 2px 10px rgba(15, 23, 42, 0.06)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    zIndex: 14,
                    transition: "all 140ms ease",
                  }}
                  className="hover-card"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: info.color, letterSpacing: "0.08em" }}>
                      HUB {info.code}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        backgroundColor: `${info.color}18`,
                        color: info.color,
                        padding: "1px 5px",
                        borderRadius: "4px",
                      }}
                    >
                      {sectorResearched}/20
                    </span>
                  </div>

                  <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-ink)" }}>
                    {info.name}
                  </div>

                  {/* Online Agent Units Control */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "var(--surface-work)",
                      border: "1px solid var(--border-hairline)",
                      padding: "3px 6px",
                      borderRadius: "6px",
                      marginTop: "2px",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ fontSize: "9px", color: "var(--text-secondary)", fontWeight: 600 }}>Units:</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        onClick={() => {
                          if (fleet.onlineUnits > 1) {
                            sound.playClick()
                            dispatch({ type: "fleet.set_online_units", functionId: fn, units: fleet.onlineUnits - 1 })
                          }
                        }}
                        disabled={fleet.onlineUnits <= 1}
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(15, 23, 42, 0.08)",
                          color: "var(--text-ink)",
                          fontSize: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: fleet.onlineUnits > 1 ? "pointer" : "default",
                          opacity: fleet.onlineUnits > 1 ? 1 : 0.3,
                          border: "none",
                        }}
                      >
                        -
                      </button>
                      <span className="font-mono" style={{ fontSize: "11px", fontWeight: 700, color: "#0284C7" }}>
                        {fleet.onlineUnits}
                      </span>
                      <button
                        onClick={() => {
                          const baseMax = SCALE_UNITS[fleet.scaleRank] || 1
                          const maxUnits = baseMax * (hasHoldingSwarm ? 2 : 1)
                          if (fleet.onlineUnits < maxUnits) {
                            sound.playClick()
                            dispatch({ type: "fleet.set_online_units", functionId: fn, units: fleet.onlineUnits + 1 })
                          }
                        }}
                        disabled={fleet.onlineUnits >= ((SCALE_UNITS[fleet.scaleRank] || 1) * (hasHoldingSwarm ? 2 : 1))}
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(15, 23, 42, 0.08)",
                          color: "var(--text-ink)",
                          fontSize: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: fleet.onlineUnits < ((SCALE_UNITS[fleet.scaleRank] || 1) * (hasHoldingSwarm ? 2 : 1)) ? "pointer" : "default",
                          opacity: fleet.onlineUnits < ((SCALE_UNITS[fleet.scaleRank] || 1) * (hasHoldingSwarm ? 2 : 1)) ? 1 : 0.3,
                          border: "none",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* 3. THE 120 DEPTH TIER NODES (6 Hubs x 4 Axes x 5 Tiers) */}
            {FUNCTIONS_ORDER.map(fn => {
              const info = FUNCTION_INFO[fn]
              const fleet = state.fleet[fn]

              return AXIS_KEYS.map(axis => {
                const axisInfo = AXIS_CONFIG[axis]
                const totalAngleDeg = info.angleDeg + axisInfo.angleOffsetDeg
                const rad = (totalAngleDeg * Math.PI) / 180
                const currentRank = fleet[`${axis}Rank`]

                return [1, 2, 3, 4, 5].map(tier => {
                  const dist = TIER_RADII[tier - 1]
                  const x = dist * Math.cos(rad)
                  const y = dist * Math.sin(rad)
                  const tierInfo = getSkillTreeUpgradeInfo(fn, axis, tier)
                  const isResearched = currentRank >= tier
                  const isAvailable = currentRank === tier - 1
                  const cost = getUpgradeRankCost(tier - 1, hasSyndicate)
                  const canAfford = state.cashCents >= cost
                  const isFocused =
                    selectedNode?.functionId === fn &&
                    selectedNode?.axis === axis &&
                    selectedNode?.tier === tier

                  return (
                    <div
                      key={`${fn}-${axis}-${tier}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        sound.playClick()
                        setSelectedNode({ functionId: fn, axis, tier })
                        setSelectedHub(fn)
                      }}
                      style={{
                        position: "absolute",
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: `translate(-50%, -50%) ${isFocused ? "scale(1.12)" : "scale(1)"}`,
                        width: "128px",
                        backgroundColor: isResearched
                          ? "#FFFFFF"
                          : isAvailable
                          ? "#FFFFFF"
                          : "rgba(255, 255, 255, 0.65)",
                        border: isFocused
                          ? `2px solid #0EA5E9`
                          : isResearched
                          ? `1.5px solid ${axisInfo.color}`
                          : isAvailable
                          ? `1.5px dashed ${axisInfo.color}99`
                          : "1px solid var(--border-hairline)",
                        borderRadius: "10px",
                        padding: "7px 9px",
                        boxShadow: isFocused
                          ? `0 0 20px rgba(14, 165, 233, 0.35), 0 4px 12px rgba(15, 23, 42, 0.1)`
                          : isResearched
                          ? `0 2px 8px rgba(15, 23, 42, 0.06)`
                          : isAvailable && canAfford
                          ? `0 0 12px ${axisInfo.color}33`
                          : "none",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                        zIndex: isFocused ? 18 : isResearched ? 12 : isAvailable ? 11 : 10,
                        opacity: isResearched || isAvailable ? 1 : 0.6,
                        transition: "all 120ms ease",
                      }}
                      className="hover-card"
                    >
                      {/* Top Header: Badge and Status */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span className="font-mono" style={{ fontSize: '7.5px', fontWeight: 900, color: axisInfo.color }}>{axisInfo.code}</span>
                          <span style={{ fontSize: "8px", fontWeight: 700, color: axisInfo.color, textTransform: "uppercase" }}>
                            T{tier}
                          </span>
                        </div>

                        {isResearched ? (
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#10B981' }}>✓</span>
                        ) : isAvailable ? (
                          <span className="font-mono" style={{ fontSize: "9px", fontWeight: 700, color: canAfford ? "#10B981" : "#F43F5E" }}>
                            {formatCost(cost)}
                          </span>
                        ) : (
                          <span className="font-mono" style={{ fontSize: '7.5px', color: '#94A3B8', fontWeight: 700 }}>[LOCK]</span>
                        )}
                      </div>

                      {/* 2.5D Tier Node Icon & Name */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "1px 0" }}>
                        <div
                          className="liquid-chrome-icon-box"
                          style={{
                            width: "22px",
                            height: "22px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={getSkillTreeUpgradeAsset(fn, axis, tier)}
                            alt={tierInfo.label}
                            style={{ width: "16px", height: "16px", objectFit: "contain" }}
                          />
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: isResearched ? "var(--text-ink)" : isAvailable ? "var(--text-ink)" : "var(--text-secondary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            flex: 1,
                          }}
                        >
                          {tierInfo.label}
                        </div>
                      </div>

                      {/* Sub-label / Stat */}
                      <div
                        style={{
                          fontSize: "8px",
                          color: isResearched ? axisInfo.color : "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {tierInfo.desc.split(" · ")[0]}
                      </div>
                    </div>
                  )
                })
              })
            })}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
