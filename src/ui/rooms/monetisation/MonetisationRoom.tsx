import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import type { GameState, ProductActivation, CustomerSegment } from "../../../engine/types"
import type { GameAction } from "../../../engine/actions"
import { sound } from "../../../audio/soundEngine"
import { calculateCustomerConversion, clamp } from "../../../engine/formulas"
import { SEGMENT_PROFILES, MONETISATION_CRAFT_MULTIPLIERS, MONETISATION_DESK_LIMITS } from "../../../engine/constants"

// =========================================================================
// RADIAL ARC GEOMETRY CONSTANTS
// =========================================================================
const CX = 200
const CY = 180
const R_OUTER = 142
const R_INNER = 94
const R_BEZEL = 152

function getArcPoint(cx: number, cy: number, r: number, v: number) {
  const angleRad = (1 - clamp(v, 0, 1)) * Math.PI
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy - r * Math.sin(angleRad),
  }
}

function makeWedgePath(v1: number, v2: number, rOut: number, rIn: number): string {
  if (v2 <= v1) return ""
  const p1 = getArcPoint(CX, CY, rOut, v1)
  const p2 = getArcPoint(CX, CY, rOut, v2)
  const p3 = getArcPoint(CX, CY, rIn, v2)
  const p4 = getArcPoint(CX, CY, rIn, v1)

  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${rOut} ${rOut} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} A ${rIn} ${rIn} 0 0 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)} Z`
}

const DESK_NAMES = [
  "Founder Deal Desk",
  "Mid-Market AE Bay",
  "Enterprise Strategic Desk",
  "Global Accounts Bay",
  "Strategic Partner Desk",
  "Sovereign & Consortium Desk",
]

const DESK_ICONS = ["🏛️", "💼", "🏢", "🌐", "🤝", "👑"]

interface MonetisationRoomProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

export const MonetisationRoom: React.FC<MonetisationRoomProps> = ({ state, dispatch }) => {
  const scaleRank = state.fleet?.monetisation?.scaleRank ?? 0
  const craftRank = state.fleet?.monetisation?.craftRank ?? 0
  const automateRank = state.fleet?.monetisation?.automateRank ?? 0
  const luckRank = state.fleet?.monetisation?.luckRank ?? 0
  const maxDesks = MONETISATION_DESK_LIMITS[scaleRank] || 1
  const craftMultiplier = MONETISATION_CRAFT_MULTIPLIERS[craftRank] || 1.0

  const [selectedDeskIndex, setSelectedDeskIndex] = useState(0)
  const activeDeskIdx = Math.min(selectedDeskIndex, maxDesks - 1)

  // Active desks array (1..6)
  const activeDesks = useMemo(() => {
    const existing = state.activeDealDesks || []
    const result = []
    for (let i = 0; i < maxDesks; i++) {
      if (existing[i]) {
        result.push(existing[i])
      } else {
        result.push({
          id: `desk-${i}`,
          deskIndex: i,
          activation: i === 0 ? (state.currentActivation ?? null) : null,
          postedPriceMonthlyCents: i === 0 ? state.postedPriceMonthlyCents : 4000,
          status: i === 0 && state.currentActivation ? ("negotiating" as const) : ("idle" as const),
        })
      }
    }
    return result
  }, [state.activeDealDesks, maxDesks, state.currentActivation, state.postedPriceMonthlyCents])

  const selectedDesk = activeDesks[activeDeskIdx] || activeDesks[0]
  const currentDeskActivation = selectedDesk?.activation ?? null
  const activeDealsCount = activeDesks.filter((d) => d.activation !== null).length
  const isPreviewMode = !currentDeskActivation && activeDealsCount === 0

  // Timing game state
  const [isOscillating, setIsOscillating] = useState(true)
  const [needlePos, setNeedlePos] = useState(0.5) // 0 to 1
  const [sweetSpotCenter, setSweetSpotCenter] = useState(0.64)
  const [sweetSpotWidth, setSweetSpotWidth] = useState(0.18)
  const [lastRating, setLastRating] = useState<"perfect" | "good" | "hazard" | null>(null)
  const [showShockwave, setShowShockwave] = useState(false)
  const [isShaking, setIsShaking] = useState(false)

  const animFrameRef = useRef<number | null>(null)
  const phaseRef = useRef<number>(0)
  const driftPhaseRef = useRef<number>(0)
  const needleRef = useRef<number>(0.5)
  const lastTimeRef = useRef<number>(performance.now())

  const [previewSegment, setPreviewSegment] = useState<CustomerSegment>("creator")

  const effectiveActivation = useMemo<ProductActivation>(() => {
    if (currentDeskActivation) return currentDeskActivation
    if (state.currentActivation) return state.currentActivation
    return {
      id: "preview-benchmark",
      title: `${previewSegment.toUpperCase()} Pricing Calibration`,
      targetSegment: previewSegment,
      speedFit: Math.max(0.2, state.systemCapabilities.speed),
      collabFit: Math.max(0.2, state.systemCapabilities.collaboration),
      controlFit: Math.max(0.2, state.systemCapabilities.control),
      overallFit: (Math.max(0.2, state.systemCapabilities.speed) + Math.max(0.2, state.systemCapabilities.collaboration) + Math.max(0.2, state.systemCapabilities.control)) / 3,
      defectExposure: 0.02,
      timestampTick: state.elapsedTicks,
    }
  }, [currentDeskActivation, state.currentActivation, previewSegment, state.systemCapabilities, state.elapsedTicks])

  const segment = effectiveActivation.targetSegment
  const profile = SEGMENT_PROFILES[segment]

  // Segment-dependent swing speed & sweet-spot challenge
  const swingSpeed = useMemo(() => {
    switch (segment) {
      case "enterprise":
        return 1.15 // fast pendulum, high tension
      case "team":
        return 0.90 // steady rhythm
      case "creator":
      default:
        return 0.72 // forgiving swing
    }
  }, [segment])

  const baseSweetWidth = useMemo(() => {
    let width = 0.22
    if (segment === "enterprise") width = 0.14
    else if (segment === "team") width = 0.18
    // Craft expands pricing tolerance & objection handling
    return Math.min(0.42, width + 0.03 * craftRank)
  }, [segment, craftRank])

  // Conversion physics based on current desk price
  const deskPostedPrice = selectedDesk?.postedPriceMonthlyCents ?? state.postedPriceMonthlyCents
  const conversion = useMemo(() => {
    return calculateCustomerConversion(
      segment,
      state.systemCapabilities,
      deskPostedPrice
    )
  }, [segment, state.systemCapabilities, deskPostedPrice])

  const targetWtpCents = conversion.effectiveWtpMonthlyCents

  // Dynamic live price calculation from needle position (decoupled from Redux 60Hz loop)
  const livePriceCents = useMemo(() => {
    const multiplier = 0.5 + needlePos * 1.3
    return Math.round(targetWtpCents * multiplier)
  }, [needlePos, targetWtpCents])

  const sweetMin = Math.max(0.04, sweetSpotCenter - sweetSpotWidth / 2)
  const sweetMax = Math.min(0.96, sweetSpotCenter + sweetSpotWidth / 2)

  // Fluid 60fps rAF loop: physical harmonic pendulum + market sweet spot drift
  useEffect(() => {
    if (!isOscillating || activeDealsCount === 0) return

    lastTimeRef.current = performance.now()

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000)
      lastTimeRef.current = now

      // 1. Physical Sinusoidal Pendulum Swing (natural acceleration through center, gentle ease at extremes)
      phaseRef.current += dt * swingSpeed * Math.PI
      const nextNeedle = 0.5 + 0.47 * Math.sin(phaseRef.current)
      needleRef.current = nextNeedle
      setNeedlePos(nextNeedle)

      // 2. Dynamic market willingness-to-pay drift
      driftPhaseRef.current += dt * 0.65
      const center = 0.60 + 0.16 * Math.sin(driftPhaseRef.current)
      const width = baseSweetWidth + 0.03 * Math.cos(driftPhaseRef.current * 1.2)
      setSweetSpotCenter(center)
      setSweetSpotWidth(width)

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isOscillating, activeDealsCount, swingSpeed, baseSweetWidth])

  // Strike & Lock In Action
  const handleStrike = useCallback(() => {
    if (activeDealsCount === 0) return

    if (isOscillating) {
      // Freeze needle with physical recoil
      setIsOscillating(false)
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 240)

      const hit = needleRef.current
      let rating: "perfect" | "good" | "hazard" = "hazard"

      // Rate hit quality against dynamic sweet spot
      if (hit >= sweetMin && hit <= sweetMax) {
        rating = "perfect"
        setLastRating("perfect")
        setShowShockwave(true)
        setTimeout(() => setShowShockwave(false), 700)
        sound.playCashTick()
      } else if (Math.abs(hit - sweetSpotCenter) <= sweetSpotWidth * 1.1) {
        rating = "good"
        setLastRating("good")
        sound.playSnap()
      } else {
        rating = "hazard"
        setLastRating("hazard")
        sound.playWarning()
      }

      // Sync frozen needle with reducer
      dispatch({ type: "monetisation.set_slider", normalizedCursor: hit })
    } else {
      // Confirm and book deal with recorded hit rating on active desk
      sound.playCashTick()
      dispatch({
        type: "monetisation.commit_desk",
        deskIndex: activeDeskIdx,
        rating: lastRating || "good",
        normalizedCursor: needleRef.current,
      })

      // Re-arm for next round
      setIsOscillating(true)
      setLastRating(null)
      setShowShockwave(false)
    }
  }, [isOscillating, activeDealsCount, sweetMin, sweetMax, sweetSpotCenter, sweetSpotWidth, lastRating, dispatch, activeDeskIdx])

  const handleReAim = useCallback(() => {
    setIsOscillating(true)
    setLastRating(null)
    setShowShockwave(false)
    sound.playClick()
  }, [])

  const handleBatchClose = useCallback(() => {
    if (activeDealsCount === 0) return
    sound.playCashTick()
    dispatch({ type: "monetisation.batch_close" })
  }, [activeDealsCount, dispatch])

  // Keyboard shortcut listener: Space triggers strike; Enter triggers batch close or strike
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return
      if (activeDealsCount === 0) return

      if (e.key === " ") {
        e.preventDefault()
        handleStrike()
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (!isOscillating) {
          handleStrike()
        } else if (activeDealsCount > 1) {
          handleBatchClose()
        } else {
          handleStrike()
        }
      } else if (e.key === "Escape" || e.key === "r" || e.key === "R") {
        if (!isOscillating) {
          e.preventDefault()
          handleReAim()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [state.paused, isOscillating, handleStrike, handleReAim, handleBatchClose, activeDealsCount])

  // Contract calculation values
  const basePriceDollars = isOscillating ? Math.round(livePriceCents / 100) : Math.round(state.postedPriceMonthlyCents / 100)
  const bonusMultiplier = lastRating === "perfect" ? 1.20 : 1.0
  const effectivePriceDollars = Math.round(basePriceDollars * bonusMultiplier * craftMultiplier)
  const effectiveArrDollars = effectivePriceDollars * 12
  const effectiveWtpDollars = Math.round((conversion.effectiveWtpMonthlyCents * craftMultiplier) / 100)

  // Calibrated tick marks across the 180° dial
  const ticks = []
  for (let i = 0; i <= 20; i++) {
    const v = i / 20
    const isMajor = i % 5 === 0
    const rIn = R_OUTER + 2
    const rOut = isMajor ? R_OUTER + 12 : R_OUTER + 6
    const pt1 = getArcPoint(CX, CY, rIn, v)
    const pt2 = getArcPoint(CX, CY, rOut, v)

    let label = ""
    if (i === 0) label = "0.5×"
    else if (i === 5) label = "0.8×"
    else if (i === 10) label = "1.15×"
    else if (i === 15) label = "1.5×"
    else if (i === 20) label = "1.8×"

    const labelPt = isMajor ? getArcPoint(CX, CY, R_OUTER + 24, v) : null

    ticks.push({
      key: `tick-${i}`,
      pt1,
      pt2,
      isMajor,
      label,
      labelPt,
    })
  }

  // Needle angle: (v - 0.5) * 180 deg
  const needleAngleDeg = (needlePos - 0.5) * 180

  // Bullseye icon position on arc
  const reticlePt = getArcPoint(CX, CY, (R_OUTER + R_INNER) / 2, sweetSpotCenter)

  return (
    <div className="room-stage-container" style={{ maxWidth: "680px", margin: "0 auto", width: "100%" }}>
      {/* Header & Unified Telemetry Bar */}
      <div className="room-header" style={{ marginBottom: "12px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <img
          src="/assets/2.5d/nav_monetise.png"
          alt="Monetisation"
          style={{ width: "42px", height: "42px", objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))", flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
          <div className="room-eyebrow" style={{ color: "var(--accent-monetisation)", marginBottom: "2px" }}>
            <span>03 / MONETISATION & DEAL PRICING FLOOR</span>
          </div>
          <h2 className="room-title" style={{ margin: "0 0 3px 0", fontSize: "18px" }}>
            Commercial Contract Negotiation Floor
          </h2>
          <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span>
              Scale: <strong>{maxDesks} Online Deal {maxDesks === 1 ? 'Desk' : 'Desks'}</strong> (Rank {scaleRank})
            </span>
            <span>·</span>
            <span>
              Craft Yield: <strong>{craftMultiplier}x Contract ARR</strong> (Rank {craftRank})
            </span>
            <span>·</span>
            <span style={{ color: automateRank > 0 ? "var(--color-positive)" : "var(--text-secondary)" }}>
              Automate: <strong>{automateRank > 0 ? `Rank ${automateRank} AI Deal Closer` : "Manual Closing"}</strong>
            </span>
            {luckRank > 0 && (
              <>
                <span>·</span>
                <span style={{ color: "#A855F7" }}>
                  Luck: <strong>+{luckRank * 10}% Whale Term Sheet</strong> (Rank {luckRank})
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* DEAL DESKS WORKSTATION FLOOR */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="font-mono" style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(245, 158, 11, 0.15)", color: "var(--accent-monetisation)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
              WORKSTATION FLOOR
            </span>
            <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-bright)" }}>
              Deal Desks ({activeDealsCount}/{maxDesks} Active)
            </span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handleBatchClose}
              disabled={activeDealsCount === 0}
              className={`cred-3d-button ${activeDealsCount > 0 ? "cred-3d-button-emerald" : "cred-3d-button-disabled"}`}
              style={{
                padding: "5px 12px",
                fontSize: "11px",
                gap: "6px",
              }}
              title="Close all active deals across all desks with [Enter]"
            >
              <span>⚡ BATCH CLOSE ALL ({activeDealsCount})</span>
              <kbd className="btn-kbd" style={{ background: "rgba(0,0,0,0.15)", color: "inherit", fontSize: "9px" }}>ENTER</kbd>
            </button>
          </div>
        </div>

        {/* 1 to 6 Desks Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "8px",
          }}
        >
          {activeDesks.map((desk, idx) => {
            const isSelected = activeDeskIdx === idx
            const hasActivation = !!desk.activation
            const deskSegment = desk.activation?.targetSegment ?? "creator"
            const deskWtp = desk.activation
              ? Math.round(calculateCustomerConversion(deskSegment, state.systemCapabilities, 0).effectiveWtpMonthlyCents / 100)
              : Math.round(desk.postedPriceMonthlyCents / 100)

            return (
              <div
                key={desk.id || `desk-${idx}`}
                onClick={() => {
                  setSelectedDeskIndex(idx)
                  sound.playSnap()
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  backgroundColor: isSelected ? "var(--surface-raised)" : "var(--surface-card)",
                  border: isSelected ? "2px solid var(--accent-monetisation)" : "1px solid var(--border-hairline)",
                  boxShadow: isSelected ? "0 0 14px rgba(245, 158, 11, 0.25)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 140ms ease",
                }}
              >
                {/* Top: Icon + Desk Title + Status */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "15px" }}>{DESK_ICONS[idx] || "💼"}</span>
                    <div>
                      <div style={{ fontSize: "10.5px", fontWeight: 800, color: isSelected ? "var(--accent-monetisation)" : "var(--text-ink)" }}>
                        DESK // 0{idx + 1}
                      </div>
                      <div style={{ fontSize: "9px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "110px" }}>
                        {DESK_NAMES[idx] || `Deal Desk ${idx + 1}`}
                      </div>
                    </div>
                  </div>

                  {hasActivation ? (
                    <span
                      style={{
                        fontSize: "8.5px",
                        fontWeight: 800,
                        color: isSelected ? "#D97706" : "#10B981",
                        backgroundColor: isSelected ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.12)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        border: isSelected ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      {isSelected ? "DIAL FOCUS" : "ACTIVE"}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "8.5px",
                        fontWeight: 800,
                        color: automateRank > 0 ? "#10B981" : "var(--text-muted)",
                        backgroundColor: automateRank > 0 ? "rgba(16, 185, 129, 0.10)" : "var(--surface-sunken)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {automateRank > 0 ? "AI CLOSER" : "STANDBY"}
                    </span>
                  )}
                </div>

                {/* Body: Deal details or Standby */}
                <div style={{ minHeight: "36px" }}>
                  {hasActivation ? (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                        <span
                          style={{
                            fontSize: "8px",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            padding: "1px 4px",
                            borderRadius: "3px",
                            backgroundColor: deskSegment === "enterprise" ? "rgba(168, 85, 247, 0.18)" : deskSegment === "team" ? "rgba(56, 189, 248, 0.18)" : "rgba(245, 158, 11, 0.18)",
                            color: deskSegment === "enterprise" ? "#A855F7" : deskSegment === "team" ? "#38BDF8" : "#D97706",
                          }}
                        >
                          {deskSegment}
                        </span>
                        <span className="font-mono" style={{ fontSize: "9.5px", color: "var(--color-positive)", fontWeight: 700 }}>
                          ~${deskWtp}/mo
                        </span>
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-bright)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {desk.activation!.title}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "9px", color: "var(--text-muted)", lineHeight: 1.3 }}>
                      {state.activationsQueue.length > 0
                        ? `+${state.activationsQueue.length} queued to feed next tick`
                        : automateRank > 0
                        ? "AI Closer monitoring incoming deals"
                        : "Awaiting signed packages from Product [2]"}
                    </div>
                  )}
                </div>

                {/* Quick Action */}
                {hasActivation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      sound.playCashTick()
                      dispatch({
                        type: "monetisation.commit_desk",
                        deskIndex: idx,
                        rating: "good",
                      })
                    }}
                    className="cred-3d-button cred-3d-button-emerald"
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      fontSize: "9.5px",
                      fontWeight: 800,
                    }}
                    title="Quick close this specific deal"
                  >
                    <span>Quick Close Deal →</span>
                  </button>
                )}
              </div>
            )
          })}

          {/* Consolidated Locked Desks Tile */}
          {maxDesks < 6 && (
            <div
              onClick={() => dispatch({ type: "attention.switch", functionId: "operations" })}
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.02)",
                border: "1.5px dashed var(--border-graphite)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                opacity: 0.7,
                cursor: "pointer",
                minHeight: "84px",
                gap: "4px",
              }}
              title="Upgrade Monetisation Scale in Skill Canvas [K] to unlock additional deal desks"
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px", opacity: "0.6" }}>🔒</span>
                  <div className="font-mono" style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)" }}>
                    +{6 - maxDesks} DESKS // 0{maxDesks + 1}–06 [LOCKED]
                  </div>
                </div>
                <span style={{ fontSize: "8px", fontWeight: 800, color: "var(--text-muted)", backgroundColor: "#F1F5F9", padding: "1px 5px", borderRadius: "3px" }}>
                  UPGRADE SCALE
                </span>
              </div>
              <div className="mobile-hide" style={{ fontSize: "9px", color: "var(--text-muted)", lineHeight: 1.2 }}>
                Upgrade Scale [K] to negotiate parallel contracts across multiple desks.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`room-card ${isShaking ? "screen-shake" : ""}`} style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
        {/* 0 LIVE DEALS OVERLAY */}
        {activeDealsCount === 0 && (
          <div
            className="animate-fade-in"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 30,
              backgroundColor: "rgba(255, 255, 255, 0.88)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "36px 28px",
              boxShadow: "inset 0 0 0 1px rgba(245, 158, 11, 0.25)",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "16px",
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                border: "1.5px solid rgba(245, 158, 11, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                marginBottom: "14px",
                boxShadow: "0 8px 24px -4px rgba(245, 158, 11, 0.25)",
              }}
            >
              💼
            </div>

            <div
              className="font-mono"
              style={{
                fontSize: "10.5px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--accent-monetisation)",
                backgroundColor: "rgba(245, 158, 11, 0.14)",
                padding: "3px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                marginBottom: "8px",
              }}
            >
              [ 0 LIVE DEALS · PRICING FLOOR STANDBY ]
            </div>

            <h3
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "var(--text-ink)",
                letterSpacing: "-0.02em",
                margin: "0 0 8px 0",
              }}
            >
              Commercial Deal Desks Standby
            </h3>

            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                maxWidth: "460px",
                lineHeight: 1.5,
                margin: "0 0 24px 0",
              }}
            >
              All deal desks are currently idle. Discover and triage inbound signals in <strong>Demand [1]</strong>, then compile and ship releases in <strong>Product Studio [2]</strong> to feed customer contracts into the negotiation floor.
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                onClick={() => {
                  sound.playClick()
                  dispatch({ type: "attention.switch", functionId: "product" })
                }}
                className="cred-3d-button cred-3d-button-cyan"
                style={{
                  padding: "10px 18px",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  gap: "8px",
                }}
              >
                <span>Ship Build in Product [2]</span>
                <span>→</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick()
                  dispatch({ type: "attention.switch", functionId: "demand" })
                }}
                className="cred-3d-button cred-3d-button-emerald"
                style={{
                  padding: "10px 18px",
                  fontSize: "12.5px",
                  fontWeight: 800,
                  gap: "8px",
                }}
              >
                <span>Triage Leads in Demand [1]</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
        {/* Deal Metadata Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="badge-tag"
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                color: "var(--accent-monetisation)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                fontSize: "10px",
                fontWeight: 800,
              }}
            >
              PROSPECT: {segment.toUpperCase()}
            </span>
            {state.activationsQueue.length > 0 && (
              <span
                className="badge-tag"
                style={{
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  color: "#6366F1",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  fontSize: "10px",
                }}
              >
                +{state.activationsQueue.length} queued
              </span>
            )}
          </div>

          <span className="font-mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Capability Fit: {Math.round(conversion.fit * 100)}%
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <span className="font-mono" style={{ fontSize: "11px", fontWeight: 800, color: "var(--accent-monetisation)" }}>
            DESK // 0{activeDeskIdx + 1}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            · {DESK_NAMES[activeDeskIdx] || "Deal Desk"}
          </span>
        </div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-bright)", margin: 0 }}>
          {effectiveActivation.title}
        </h3>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.4 }}>
          Customer benchmark WTP: <strong>${effectiveWtpDollars}/mo</strong> based on deployed system capabilities.
        </p>

        {/* =========================================================================
            CALIBRATED RADIAL ARC SWING METER (SVG INSTRUMENT)
            ========================================================================= */}
        <div
          style={{
            margin: "20px 0 16px 0",
            padding: "16px 20px 20px 20px",
            backgroundColor: "var(--surface-work)",
            borderRadius: "14px",
            border:
              lastRating === "perfect"
                ? "1.5px solid var(--color-positive)"
                : lastRating === "hazard"
                ? "1.5px solid var(--color-critical)"
                : "1px solid var(--border-hairline)",
            textAlign: "center",
            boxShadow:
              lastRating === "perfect"
                ? "0 0 28px rgba(16, 185, 129, 0.25)"
                : lastRating === "hazard"
                ? "0 0 24px rgba(239, 68, 68, 0.2)"
                : "none",
            transition: "all 180ms ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* SVG Radial Gauge */}
          <div style={{ position: "relative", width: "100%", maxWidth: "420px", margin: "0 auto" }}>
            <svg
              viewBox="0 0 400 220"
              style={{
                width: "100%",
                height: "auto",
                overflow: "visible",
                display: "block",
              }}
            >
              <defs>
                {/* Emerald Bullseye Gradient */}
                <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                {/* Crimson Hazard Gradient */}
                <linearGradient id="hazard-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#991B1B" />
                </linearGradient>

                {/* Needle Metallic Gradient */}
                <linearGradient id="needle-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E2E8F0" />
                  <stop offset="50%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#94A3B8" />
                </linearGradient>

                {/* Hub Metal Gradient */}
                <radialGradient id="hub-metal" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="70%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </radialGradient>

                {/* Emerald Glow Filter */}
                <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Tip Glow Filter */}
                <filter id="tip-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Outer Bezel Rim */}
              <path
                d={`M ${CX - R_BEZEL} ${CY} A ${R_BEZEL} ${R_BEZEL} 0 0 1 ${CX + R_BEZEL} ${CY}`}
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1.5"
              />

              {/* Background Gauge Track */}
              <path
                d={makeWedgePath(0, 1.0, R_OUTER, R_INNER)}
                fill="rgba(15, 23, 42, 0.75)"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
              />

              {/* 1. DISCOUNT ZONE (0 to sweetMin) */}
              <path
                d={makeWedgePath(0, sweetMin, R_OUTER, R_INNER)}
                fill="rgba(71, 85, 105, 0.35)"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="0.5"
              />

              {/* 2. DYNAMIC MOVING SWEET SPOT BULLSEYE ZONE (sweetMin to sweetMax) */}
              <path
                d={makeWedgePath(sweetMin, sweetMax, R_OUTER, R_INNER)}
                fill="url(#emerald-gradient)"
                filter="url(#emerald-glow)"
                stroke="#34D399"
                strokeWidth="1.5"
              />

              {/* 3. HAZARD REDLINE OVERPRICED ZONE (sweetMax to 1.0) */}
              <path
                d={makeWedgePath(sweetMax, 1.0, R_OUTER, R_INNER)}
                fill="url(#hazard-gradient)"
                opacity="0.45"
                stroke="#EF4444"
                strokeWidth="1"
              />

              {/* Target Reticle in Center of Moving Bullseye */}
              <text
                x={reticlePt.x}
                y={reticlePt.y + 4}
                textAnchor="middle"
                fontSize="14"
                fontWeight="900"
                fill="#FFFFFF"
                style={{ pointerEvents: "none", textShadow: "0 0 6px #000" }}
              >
                ◎
              </text>

              {/* Tick Marks & Multiplier Labels */}
              {ticks.map((t) => (
                <g key={t.key}>
                  <line
                    x1={t.pt1.x}
                    y1={t.pt1.y}
                    x2={t.pt2.x}
                    y2={t.pt2.y}
                    stroke={t.isMajor ? "#CBD5E1" : "rgba(148, 163, 184, 0.45)"}
                    strokeWidth={t.isMajor ? 1.8 : 1}
                  />
                  {t.labelPt && (
                    <text
                      x={t.labelPt.x}
                      y={t.labelPt.y + 3}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontFamily="var(--font-mono)"
                      fontWeight="700"
                      fill="#94A3B8"
                    >
                      {t.label}
                    </text>
                  )}
                </g>
              ))}

              {/* Shockwave Rings on Perfect Bullseye Hit */}
              {showShockwave && (
                <>
                  <circle cx={CX} cy={CY} r="20" fill="none" stroke="#10B981" className="shockwave-ring" />
                  <circle
                    cx={CX}
                    cy={CY}
                    r="20"
                    fill="none"
                    stroke="#34D399"
                    className="shockwave-ring"
                    style={{ animationDelay: "100ms" }}
                  />
                </>
              )}

              {/* Physical Needle with Harmonic Rotation */}
              <g transform={`rotate(${needleAngleDeg}, ${CX}, ${CY})`}>
                {/* Tapered Pointer Polygon */}
                <polygon
                  points={`${CX - 4},${CY + 14} ${CX + 4},${CY + 14} ${CX + 1.2},${CY - 134} ${CX},${CY - 140} ${CX - 1.2},${CY - 134}`}
                  fill="url(#needle-gradient)"
                  filter="drop-shadow(0 2px 5px rgba(0,0,0,0.6))"
                />
                {/* Luminous Center Spine */}
                <line
                  x1={CX}
                  y1={CY + 10}
                  x2={CX}
                  y2={CY - 138}
                  stroke="#FFFFFF"
                  strokeWidth="1.6"
                />
                {/* Calibrated Needle Tip */}
                <circle
                  cx={CX}
                  cy={CY - 138}
                  r="3.5"
                  fill={lastRating === "perfect" ? "#10B981" : isOscillating ? "#FFC857" : "#EF4444"}
                  filter="url(#tip-glow)"
                />
              </g>

              {/* Center Pivot Hub (Industrial 2.5D Rivet) */}
              <circle cx={CX} cy={CY} r="18" fill="url(#hub-metal)" stroke="#475569" strokeWidth="2" />
              <circle cx={CX} cy={CY} r="9" fill="#0F172A" />
              <circle
                cx={CX}
                cy={CY}
                r="4.5"
                fill={
                  lastRating === "perfect"
                    ? "#10B981"
                    : lastRating === "good"
                    ? "#38BDF8"
                    : lastRating === "hazard"
                    ? "#EF4444"
                    : "#FFC857"
                }
              />
            </svg>

            {/* Zone Monospace Labels Below Gauge */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0 10px",
                marginTop: "-8px",
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>◀ LOW MARGIN (0.5×)</span>
              <span style={{ color: "var(--color-positive)", textShadow: "0 0 10px rgba(16,185,129,0.5)" }}>
                🎯 MOVING BULLSEYE (1.0×–1.3×)
              </span>
              <span style={{ color: "var(--color-critical)" }}>OVERPRICED (1.8×) ▶</span>
            </div>
          </div>

          {/* Pricing Telemetry Box */}
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "10.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Calibrated Contract Price
            </div>
            <div
              className="font-display font-mono"
              style={{
                fontSize: "42px",
                fontWeight: 800,
                color:
                  lastRating === "perfect"
                    ? "var(--color-positive)"
                    : lastRating === "hazard"
                    ? "var(--color-critical)"
                    : "var(--text-bright)",
                marginTop: "2px",
                lineHeight: 1.1,
              }}
            >
              ${effectivePriceDollars.toLocaleString()}
              <span style={{ fontSize: "17px", fontWeight: 500, color: "var(--text-muted)" }}>/mo</span>
            </div>

            <div
              className="font-mono"
              style={{
                fontSize: "12.5px",
                color: lastRating === "perfect" ? "var(--color-positive)" : "var(--color-positive)",
                marginTop: "6px",
                fontWeight: 700,
              }}
            >
              +${effectiveArrDollars.toLocaleString()}/yr Contract ARR {isPreviewMode ? "(Sandbox Benchmark)" : "upon signing"}
              {lastRating === "perfect" && (
                <span
                  style={{
                    marginLeft: "8px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    border: "1px solid var(--color-positive)",
                    fontSize: "11px",
                  }}
                >
                  🎯 +20% BULLSEYE BONUS INCLUDED
                </span>
              )}
            </div>

            {craftMultiplier > 1 && (
              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    color: "#D97706",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  ⚡ CRAFT YIELD: {craftMultiplier}x ARR MULTIPLIER (RANK {craftRank})
                </span>
                {automateRank > 0 && (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      border: "1px solid rgba(16, 185, 129, 0.4)",
                      color: "#059669",
                      fontSize: "11px",
                      fontWeight: 800,
                    }}
                  >
                    🤖 AI DEAL CLOSER READY
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Feedback Rating Banner */}
          <div style={{ marginTop: "14px", minHeight: "28px" }}>
            {lastRating === "perfect" ? (
              <div
                className="animate-slide-up font-mono"
                style={{
                  fontSize: "12.5px",
                  fontWeight: 800,
                  color: "var(--color-positive)",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  display: "inline-block",
                }}
              >
                🎯 PERFECT STRIKE: 100% Contract Conversion Locked + 20% Expansion ARR Bonus
              </div>
            ) : lastRating === "good" ? (
              <div
                className="animate-slide-up font-mono"
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "var(--color-brand)",
                  backgroundColor: "rgba(255, 200, 87, 0.12)",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 200, 87, 0.3)",
                  display: "inline-block",
                }}
              >
                ⚡ SOLID STRIKE: High Conversion Margin Sealed
              </div>
            ) : lastRating === "hazard" ? (
              <div
                className="animate-slide-up font-mono"
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "var(--color-critical)",
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  display: "inline-block",
                }}
              >
                ⚠️ BUYER BALK RESISTANCE: Price exceeded comfort zone · Higher churn risk
              </div>
            ) : (
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                Watch the needle swing. Strike <kbd className="btn-kbd">SPACE</kbd> when it passes through the green
                target zone.
              </div>
            )}
          </div>
        </div>

        {/* Tactile Control Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
          {!isOscillating && (
            <button
              onClick={handleReAim}
              className="btn-secondary"
              style={{
                padding: "11px 18px",
                fontSize: "12.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                flex: 1,
                justifyContent: "center",
              }}
            >
              <span>↺ Re-Aim Swing</span>
              <kbd className="btn-kbd">R</kbd>
            </button>
          )}

          <button
            onClick={handleStrike}
            className={`cred-3d-button ${
              lastRating === "perfect"
                ? "cred-3d-button-emerald"
                : isOscillating
                ? "cred-3d-button-amber"
                : "cred-3d-button-cyan"
            }`}
            style={{
              flex: isOscillating ? 1 : 2,
              padding: "12px 22px",
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: 800,
            }}
          >
            {isOscillating ? (
              <>
                <span>⚡ STRIKE MOVING TARGET</span>
                <kbd className="btn-kbd">SPACE</kbd>
              </>
            ) : isPreviewMode ? (
              <>
                <span>↺ RESET PRACTICE SWING</span>
                <kbd className="btn-kbd">SPACE</kbd>
              </>
            ) : (
              <>
                <span>✔ EXECUTE & BIND DESK 0{activeDeskIdx + 1} CONTRACT</span>
                <kbd className="btn-kbd">ENTER</kbd>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
