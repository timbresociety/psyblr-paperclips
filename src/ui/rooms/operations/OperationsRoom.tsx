import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import type { GameState, ScratchPod, ScratchCard } from "../../../engine/types"
import type { GameAction } from "../../../engine/actions"
import { calculateOperationsMetrics } from "../../../engine/formulas"
import { sound } from "../../../audio/soundEngine"
import { OPERATIONS_RACK_LIMITS } from "../../../engine/constants"
import { createDiagnosticTicket } from "../../../engine/state"

interface OperationsRoomProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

export const OperationsRoom: React.FC<OperationsRoomProps> = ({ state, dispatch }) => {
  const scaleRank = state.fleet?.operations?.scaleRank ?? 0
  const craftRank = state.fleet?.operations?.craftRank ?? 0
  const automateRank = state.fleet?.operations?.automateRank ?? 0
  const luckRank = state.fleet?.operations?.luckRank ?? 0
  const maxRacks = OPERATIONS_RACK_LIMITS[scaleRank] || 1
  const craftRecoveryMultiplier = 1 + 0.25 * craftRank

  const {
    opsCapacity,
    coordinationLoad,
    strainBacklog,
    contextRot,
    incidentsBacklog,
  } = state.operations

  const activeTickets: ScratchCard[] = useMemo(() => {
    let tickets = state.activeTickets ? [...state.activeTickets] : [createDiagnosticTicket(0, luckRank)]
    while (tickets.length < maxRacks) {
      tickets.push(createDiagnosticTicket(tickets.length, luckRank))
    }
    return tickets.slice(0, maxRacks)
  }, [state.activeTickets, maxRacks, luckRank])

  const [hoveredPodKey, setHoveredPodKey] = useState<string | null>(null)
  const [scratchProgress, setScratchProgress] = useState<Record<string, number>>({})
  const [isScratchingKey, setIsScratchingKey] = useState<string | null>(null)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([])
  const activeDragRef = useRef<{ podKey: string; lastX: number; lastY: number; accumDist: number } | null>(null)
  const poppedPodsRef = useRef<Set<string>>(new Set())

  const spawnParticle = (x: number, y: number, text: string, color: string) => {
    const pId = Date.now() + Math.random()
    setParticles(prev => [...prev.slice(-12), { id: pId, x, y, text, color }])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== pId))
    }, 550)
  }

  // Calculate causal metrics
  const opsMetrics = useMemo(() => {
    const hasSelfHealing = (state.activeRelics || []).some(r => r.id === "relic-circuit-breaker")
    return calculateOperationsMetrics(
      state.fleet,
      strainBacklog,
      contextRot,
      hasSelfHealing
    )
  }, [state.fleet, strainBacklog, contextRot, state.activeRelics])

  const isCleanCluster = strainBacklog <= 0.1 && contextRot < 0.05
  const speedPercentage = Math.round(opsMetrics.speedFactor * 100)

  // Scratch single sector on a specific ticket station
  const handleScratchSector = useCallback(
    (ticketIndex: number, pod: ScratchPod) => {
      if (pod.isScratched) return
      const ticket = activeTickets[ticketIndex]
      if (!ticket || ticket.isBusted || ticket.claimed) return

      if (pod.isNegative) {
        sound.playRottenBuzzer()
      } else {
        sound.playScratch()
        setTimeout(() => sound.playApplePop(), 70)
      }

      dispatch({
        type: "operations.scratch_ticket",
        ticketIndex,
        podIndex: 0,
      })
    },
    [activeTickets, dispatch]
  )

  // Discard / Reject single ticket station harmlessly before full redemption
  const handleRejectTicket = useCallback(
    (ticketIndex: number) => {
      const ticket = activeTickets[ticketIndex]
      if (!ticket) return
      sound.playSnap()
      setScratchProgress(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(k => {
          if (k.startsWith(`${ticket.id}-`) || k.startsWith(`rack-${ticketIndex}-`)) {
            delete next[k]
          }
        })
        return next
      })
      poppedPodsRef.current.clear()
      dispatch({
        type: "operations.reject_ticket",
        ticketIndex,
      })
    },
    [activeTickets, dispatch]
  )

  // Claim or redeem single ticket station
  const handleClaimTicket = useCallback(
    (ticketIndex: number) => {
      const ticket = activeTickets[ticketIndex]
      if (!ticket) return
      const pod = ticket.pods[0] || ticket.outcome
      if (ticket.isBusted) {
        sound.playSnap()
      } else if (pod?.isNegative && (!ticket.bankedCashCents && !ticket.bankedStrainRelief)) {
        sound.playRottenBuzzer()
      } else {
        sound.playCashTick()
      }
      setScratchProgress(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(k => {
          if (k.startsWith(`${ticket.id}-`) || k.startsWith(`rack-${ticketIndex}-`)) {
            delete next[k]
          }
        })
        return next
      })
      poppedPodsRef.current.clear()
      dispatch({
        type: "operations.claim_ticket",
        ticketIndex,
      })
    },
    [activeTickets, dispatch]
  )

  // Gentle peek: reveals 30% so user can inspect outcome without triggering full redemption
  const handlePeekTicket = useCallback(
    (ticketIndex: number) => {
      const ticket = activeTickets[ticketIndex]
      if (!ticket || ticket.isBusted) return
      const podKey = `${ticket.id || ticketIndex}-0`
      setScratchProgress(prev => ({
        ...prev,
        [podKey]: Math.max(prev[podKey] || 0, 32),
      }))
      sound.playScratch()
    },
    [activeTickets]
  )

  // Interactive Scratch-to-Open Pointer Drag Handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, tIdx: number, pod: ScratchPod, podKey: string) => {
      const ticket = activeTickets[tIdx]
      if (pod.isScratched || ticket?.isBusted || ticket?.claimed || poppedPodsRef.current.has(podKey)) return

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }

      activeDragRef.current = { podKey, lastX: e.clientX, lastY: e.clientY, accumDist: 0 }
      setIsScratchingKey(podKey)
      sound.playScratch()
    },
    [activeTickets]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent, tIdx: number, pod: ScratchPod, podKey: string) => {
      if (!activeDragRef.current || activeDragRef.current.podKey !== podKey) return
      if (pod.isScratched || poppedPodsRef.current.has(podKey)) return

      const dx = e.clientX - activeDragRef.current.lastX
      const dy = e.clientY - activeDragRef.current.lastY
      const dist = Math.hypot(dx, dy)
      if (dist < 3) return

      activeDragRef.current.lastX = e.clientX
      activeDragRef.current.lastY = e.clientY
      activeDragRef.current.accumDist += dist

      if (Math.random() < 0.35) {
        sound.playScratch()
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      spawnParticle(
        e.clientX - rect.left,
        e.clientY - rect.top,
        pod.isNegative ? "⚡" : "✦",
        pod.isNegative ? "#EF4444" : "#10B981"
      )

      setScratchProgress(prev => {
        const cur = prev[podKey] || 0
        const added = Math.min(18, Math.max(3, Math.round(dist * 0.45)))
        const next = Math.min(100, cur + added)

        // Threshold trigger: 70% opens and commits the single outcome
        if (next >= 70 && !poppedPodsRef.current.has(podKey)) {
          poppedPodsRef.current.add(podKey)
          handleScratchSector(tIdx, pod)
        }
        return { ...prev, [podKey]: next }
      })
    },
    [handleScratchSector]
  )

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture?.(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      }
    } catch {
      // ignore
    }
    activeDragRef.current = null
    setIsScratchingKey(null)
  }, [])

  // Batch scratch & claim all stations
  const handleBatchScratchAll = useCallback(() => {
    sound.playScratch()
    setTimeout(() => sound.playCashTick(), 100)
    dispatch({ type: "operations.batch_scratch_all" })
  }, [dispatch])

  const handleResolveIncident = useCallback(() => {
    if (incidentsBacklog <= 0) return
    sound.playSnap()
    dispatch({ type: "operations.resolve_incident" })
  }, [incidentsBacklog, dispatch])

  const handleExecuteFailover = useCallback(() => {
    sound.playPowerUp()
    dispatch({ type: "event.resolve_operations" })
  }, [dispatch])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return

      if ((e.key === "h" || e.key === "H") && incidentsBacklog > 0) {
        e.preventDefault()
        handleResolveIncident()
      } else if (e.key === "x" || e.key === "X") {
        e.preventDefault()
        handleRejectTicket(0)
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault()
        handleClaimTicket(0)
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault()
        handlePeekTicket(0)
      } else if (e.key === " ") {
        e.preventDefault()
        handleBatchScratchAll()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleBatchScratchAll, incidentsBacklog, handleResolveIncident, handleRejectTicket, handleClaimTicket, handlePeekTicket])

  const isOverCapacity = coordinationLoad > opsCapacity
  const rotColor = contextRot > 0.4 ? "var(--color-critical)" : contextRot > 0.15 ? "var(--color-warning)" : "var(--color-positive)"
  const estimatedHazardRate = Math.max(5, Math.round((0.38 - 0.07 * luckRank) * 100))

  return (
    <div className="room-stage-container" style={{ maxWidth: "860px", width: "100%", paddingBottom: "16px" }}>
      {/* Homogenous Room Top Header */}
      <div className="room-top-header" style={{ marginBottom: "12px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", maxWidth: "620px" }}>
          <img
            src="/assets/2.5d/nav_operations.png"
            alt="Operations"
            style={{ width: "42px", height: "42px", objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))", flexShrink: 0 }}
          />
          <div className="header-text-group">
            <div className="room-eyebrow" style={{ color: "var(--accent-operations)", fontSize: "10px", letterSpacing: "0.14em", marginBottom: "2px", fontWeight: 700 }}>
              <span>06 / OPERATIONS • CLUSTER INFRASTRUCTURE & RECOVERY</span>
            </div>
            <h2 className="room-title" style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-ink)", margin: "0 0 2px 0", lineHeight: 1.2 }}>
              Autonomous Cluster Telemetry Racks
            </h2>
            <p className="room-subtitle" style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4, margin: "0 0 4px 0" }}>
              Diagnostic scratch tickets stream live node telemetry. Scratch to peek: reject hazard tickets before redemption to avoid faults, while daemons blindly redeem all.
            </p>
            <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span>
                Scale: <strong>{maxRacks} Diagnostic {maxRacks === 1 ? "Station" : "Stations"}</strong> (Rank {scaleRank})
              </span>
              <span>·</span>
              <span>
                Craft Yield: <strong>+{Math.round((craftRecoveryMultiplier - 1) * 100)}% Yield</strong> (Rank {craftRank})
              </span>
              <span>·</span>
              <span style={{ color: automateRank > 0 ? "var(--color-positive)" : "var(--text-secondary)" }}>
                Automate: <strong>{automateRank > 0 ? `Rank ${automateRank} Daemons (Blind Open)` : "Manual Probe"}</strong>
              </span>
              <span>·</span>
              <span style={{ color: luckRank > 0 ? "#A855F7" : "var(--text-secondary)" }}>
                Luck: <strong>{luckRank > 0 ? `+${luckRank * 15}% Supercore Odds · ${estimatedHazardRate}% Hazard Rate` : "Rank 0 (38% Hazard Rate)"}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Global Action Header Button */}
        <button
          onClick={handleBatchScratchAll}
          className="cred-3d-button cred-3d-button-emerald"
          style={{
            padding: "8px 14px",
            fontSize: "11px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          title="Batch open and redeem all active station tickets simultaneously"
        >
          <span>Batch Resolve All</span>
          <kbd className="btn-kbd" style={{ background: "rgba(255,255,255,0.25)", color: "#fff", fontSize: "9px" }}>Space</kbd>
        </button>
      </div>

      {/* EMERGENCY CRISIS ADVISORY BANNER (WHEN CLUSTER EVENT OR INCIDENT IS ACTIVE) */}
      {state.operationsEvent?.active && (
        <div
          className="animate-slide-up"
          style={{
            marginBottom: "12px",
            padding: "12px 14px",
            borderRadius: "10px",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1.5px solid rgba(239, 68, 68, 0.45)",
            boxShadow: "0 4px 14px rgba(239, 68, 68, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>🚨</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <strong style={{ fontSize: "12px", color: "var(--color-critical)" }}>
                  {state.operationsEvent.title || "OPERATIONAL CRISIS ADVISORY"}
                </strong>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "8.5px",
                    fontWeight: 800,
                    padding: "1px 5px",
                    borderRadius: "3px",
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    color: "var(--color-critical)",
                    textTransform: "uppercase",
                  }}
                >
                  HIGH IMPACT
                </span>
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px", lineHeight: 1.3 }}>
                Cluster is throttled. Execute emergency cluster failover to purge 75% strain, defrag context rot, and restore nominal pipeline speed.
              </div>
            </div>
          </div>

          <button
            onClick={handleExecuteFailover}
            className="cred-3d-button cred-3d-button-danger"
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span>Execute Failover</span>
          </button>
        </div>
      )}

      {/* 4 OPERATIONAL HEALTH TELEMETRY METRIC CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "8px",
          width: "100%",
          marginBottom: "12px",
        }}
      >
        {/* Metric 1: Coordination Load */}
        <div className="room-card" style={{ padding: "8px 12px" }}>
          <div style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>
            Coordination Load
          </div>
          <div className="font-mono" style={{ fontSize: "15px", fontWeight: 800, color: isOverCapacity ? "var(--color-critical)" : "var(--text-ink)", marginTop: "2px" }}>
            {coordinationLoad.toFixed(1)} <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)" }}>/ {opsCapacity.toFixed(0)}</span>
          </div>
          <div style={{ fontSize: "10px", color: isOverCapacity ? "var(--color-critical)" : "var(--color-positive)", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                backgroundColor: isOverCapacity ? "var(--color-critical)" : "var(--color-positive)",
                display: "inline-block",
              }}
            />
            <span>{isOverCapacity ? "Over capacity" : "Nominal headroom"}</span>
          </div>
        </div>

        {/* Metric 2: Pipeline Speed */}
        <div className="room-card" style={{ padding: "8px 12px" }}>
          <div style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>
            Pipeline Speed
          </div>
          <div className="font-mono" style={{ fontSize: "15px", fontWeight: 800, color: isCleanCluster ? "var(--color-positive)" : speedPercentage < 95 ? "var(--color-warning)" : "var(--text-ink)", marginTop: "2px" }}>
            {isCleanCluster ? "130%" : `${speedPercentage}%`}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
            {isCleanCluster ? "+30% boost active" : `Throttled ${strainBacklog.toFixed(1)} pts`}
          </div>
        </div>

        {/* Metric 3: Context Rot */}
        <div className="room-card" style={{ padding: "8px 12px" }}>
          <div style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>
            Context Rot
          </div>
          <div className="font-mono" style={{ fontSize: "15px", fontWeight: 800, color: rotColor, marginTop: "2px" }}>
            {Math.round(contextRot * 100)}%
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
            {(opsMetrics.technicalErrorRate * 100).toFixed(1)}% error rate
          </div>
        </div>

        {/* Metric 4: Active Incidents */}
        <div
          className="room-card"
          style={{
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: incidentsBacklog > 0 ? "1.5px solid rgba(239, 68, 68, 0.45)" : "1px solid var(--border-hairline)",
            backgroundColor: incidentsBacklog > 0 ? "rgba(239, 68, 68, 0.03)" : undefined,
          }}
        >
          <div>
            <div style={{ fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>
              Active Incidents
            </div>
            <div className="font-mono" style={{ fontSize: "15px", fontWeight: 800, color: incidentsBacklog > 0 ? "var(--color-critical)" : "var(--color-positive)", marginTop: "2px" }}>
              {incidentsBacklog > 0 ? `${incidentsBacklog} Active` : "Nominal"}
            </div>
          </div>
          {incidentsBacklog > 0 && (
            <button
              onClick={handleResolveIncident}
              className="cred-3d-button cred-3d-button-danger"
              style={{
                marginTop: "4px",
                padding: "3px 8px",
                fontSize: "10px",
              }}
            >
              <span>Hotfix (H)</span>
            </button>
          )}
        </div>
      </div>

      {/* MULTI-STATION RACK TICKETS FLOOR (1 TO 6 PARALLEL STATIONS) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: maxRacks === 1
            ? "1fr"
            : maxRacks === 2
            ? "repeat(2, 1fr)"
            : "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        {activeTickets.map((ticket, tIdx) => {
          const isBusted = ticket.isBusted
          const isGolden = ticket.severity === "golden"
          const pod = ticket.pods[0] || ticket.outcome || {
            id: 0,
            symbol: "coin",
            rewardType: "cash",
            rewardValue: 20000,
            label: "Compute Credit: +$200 Rebate",
            isScratched: false,
            isNegative: false,
          }
          const isHazard = pod.isNegative
          const isScratched = pod.isScratched
          const podKey = `${ticket.id || tIdx}-0`
          const progress = scratchProgress[podKey] || (isScratched ? 100 : 0)
          const isPeeking = progress >= 25 && !isScratched
          const isHovered = hoveredPodKey === podKey

          return (
            <div
              key={ticket.id || `rack-${tIdx}`}
              className="room-card"
              style={{
                padding: "12px",
                borderRadius: "12px",
                backgroundColor: isBusted
                  ? "rgba(239, 68, 68, 0.04)"
                  : isGolden
                  ? "rgba(245, 158, 11, 0.04)"
                  : "var(--surface-card)",
                border: isBusted
                  ? "1.5px solid rgba(239, 68, 68, 0.45)"
                  : isGolden
                  ? "1.5px solid rgba(245, 158, 11, 0.45)"
                  : "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "10px",
                position: "relative",
              }}
            >
              {/* Station Header */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "14px" }}>{isGolden ? "⭐" : isBusted ? "⚠️" : "🖥️"}</span>
                    <span className="font-mono" style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-ink)" }}>
                      RACK // 0{tIdx + 1}
                    </span>
                  </div>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "8.5px",
                      fontWeight: 800,
                      padding: "1px 5px",
                      borderRadius: "4px",
                      backgroundColor: isBusted
                        ? "rgba(239, 68, 68, 0.15)"
                        : isGolden
                        ? "rgba(245, 158, 11, 0.15)"
                        : isScratched
                        ? "rgba(16, 185, 129, 0.15)"
                        : isPeeking
                        ? isHazard
                          ? "rgba(239, 68, 68, 0.15)"
                          : "rgba(16, 185, 129, 0.15)"
                        : "rgba(0, 0, 0, 0.06)",
                      color: isBusted
                        ? "var(--color-critical)"
                        : isGolden
                        ? "#D97706"
                        : isScratched
                        ? "var(--color-positive)"
                        : isPeeking
                        ? isHazard
                          ? "var(--color-critical)"
                          : "var(--color-positive)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {isBusted
                      ? "FAULT OVERLOAD"
                      : isGolden
                      ? "TPU SUPERCORE"
                      : isScratched
                      ? "COMMITTED"
                      : isPeeking
                      ? isHazard
                        ? "HAZARD DETECTED"
                        : "PEEKED: REWARD"
                      : "UNPROBED TICKET"}
                  </span>
                </div>

                <div style={{ fontSize: "9.5px", color: "var(--text-muted)", marginBottom: "4px", lineHeight: 1.2 }}>
                  {ticket.subtitle || "Live Single-Outcome Diagnostic Telemetry"}
                </div>
              </div>

              {/* SINGLE OUTCOME TICKET SCRATCH CANVAS / FOIL AREA */}
              <div
                onMouseEnter={() => setHoveredPodKey(podKey)}
                onMouseLeave={() => setHoveredPodKey(null)}
                onPointerDown={e => handlePointerDown(e, tIdx, pod, podKey)}
                onPointerMove={e => handlePointerMove(e, tIdx, pod, podKey)}
                onPointerUp={e => handlePointerUp(e)}
                onPointerCancel={e => handlePointerUp(e)}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  padding: "14px 10px",
                  borderRadius: "10px",
                  textAlign: "center",
                  cursor: isScratched || isBusted ? "default" : "grab",
                  userSelect: "none",
                  touchAction: "none",
                  minHeight: "100px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: isScratched
                    ? isHazard
                      ? "rgba(239, 68, 68, 0.08)"
                      : isGolden
                      ? "rgba(245, 158, 11, 0.1)"
                      : "rgba(16, 185, 129, 0.08)"
                    : isPeeking
                    ? isHazard
                      ? "rgba(239, 68, 68, 0.12)"
                      : "rgba(16, 185, 129, 0.1)"
                    : isHovered
                    ? "var(--surface-raised)"
                    : "var(--surface-work)",
                  border: isScratched
                    ? isHazard
                      ? "1.5px solid rgba(239, 68, 68, 0.5)"
                      : isGolden
                      ? "1.5px solid rgba(245, 158, 11, 0.5)"
                      : "1.5px solid rgba(16, 185, 129, 0.4)"
                    : isPeeking
                    ? isHazard
                      ? "1.5px dashed #EF4444"
                      : "1.5px dashed #10B981"
                    : isHovered
                    ? "1.5px solid var(--accent-operations)"
                    : "1px solid var(--border-hairline)",
                  transition: isScratchingKey === podKey ? "none" : "all 120ms ease",
                }}
              >
                {/* 1. Underlying Revealed/Peeking Content */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", width: "100%" }}>
                  <div style={{ fontSize: "22px" }}>
                    {pod.symbol === "rotten"
                      ? "🔥"
                      : pod.symbol === "skull"
                      ? "💀"
                      : pod.symbol === "panic"
                      ? "🚨"
                      : pod.symbol === "golden_apple"
                      ? "🌟"
                      : pod.symbol === "coin"
                      ? "🪙"
                      : pod.symbol === "shield"
                      ? "🛡️"
                      : "🧹"}
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: isHazard
                        ? "var(--color-critical)"
                        : isGolden
                        ? "#D97706"
                        : "var(--color-positive)",
                      lineHeight: 1.2,
                    }}
                  >
                    {pod.label.split(":")[0]}
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--text-secondary)", lineHeight: 1.1, maxWidth: "220px" }}>
                    {pod.label.split(":")[1] ? pod.label.split(":")[1].trim() : pod.label}
                  </div>

                  {/* Peeking Advisory Badge */}
                  {isPeeking && !isScratched && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "8px",
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                        backgroundColor: isHazard ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                        color: isHazard ? "#EF4444" : "#059669",
                        border: `1px solid ${isHazard ? "#EF4444" : "#10B981"}`,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {isHazard ? "⚠️ HAZARD DETECTED · REJECT [X] TO AVOID!" : `✨ REWARD READY · COMMIT OR DRAG (${Math.round(progress)}%)`}
                    </div>
                  )}
                </div>

                {/* 2. Protective Metallic Foil Overlay (Peels away as player scratches) */}
                {!isScratched && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      opacity: Math.max(0, 1 - progress / 70),
                      background: "linear-gradient(135deg, #1E293B 0%, #334155 50%, #0F172A 100%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: "6px",
                      transition: isScratchingKey === podKey ? "none" : "opacity 120ms ease",
                    }}
                  >
                    <div
                      className="font-mono"
                      style={{
                        fontSize: "9.5px",
                        fontWeight: 800,
                        color: "#94A3B8",
                        letterSpacing: "0.06em",
                      }}
                    >
                      TELEMETRY FOIL // S-01
                    </div>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: "#F8FAFC", marginTop: "2px" }}>
                      {isGolden ? "★ TPU Supercore Encrypted" : "Live Diagnostic Outcome"}
                    </div>
                    <div
                      style={{
                        fontSize: "7.5px",
                        color: "#38BDF8",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        marginTop: "4px",
                      }}
                    >
                      {progress > 0 ? `Uncovering ${Math.round(progress)}%...` : "🖐️ Drag to Scratch · Peek [P]"}
                    </div>
                    {/* Mini Progress Gauge */}
                    {progress > 0 && (
                      <div
                        style={{
                          width: "70%",
                          height: "3px",
                          backgroundColor: "rgba(255,255,255,0.2)",
                          borderRadius: "2px",
                          marginTop: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, (progress / 70) * 100)}%`,
                            height: "100%",
                            backgroundColor: isHazard ? "#EF4444" : "#10B981",
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Station Action Footer: Reject vs Redeem Affordances */}
              <div>
                {isBusted ? (
                  <button
                    onClick={() => handleClaimTicket(tIdx)}
                    className="cred-3d-button cred-3d-button-danger"
                    style={{ width: "100%", padding: "6px 8px", fontSize: "10.5px" }}
                  >
                    <span>Clear Fault · Draw Next Ticket</span>
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "6px" }}>
                    {/* Manual Reject Button: Discard negative tickets before redemption */}
                    <button
                      onClick={() => handleRejectTicket(tIdx)}
                      className="cred-3d-button cred-3d-button-amber"
                      style={{
                        flex: 1,
                        padding: "5px 6px",
                        fontSize: "9.5px",
                        fontWeight: 700,
                      }}
                      title="Safely discard this ticket without penalty and draw a fresh ticket"
                    >
                      <span>Reject Ticket [X]</span>
                    </button>

                    {/* Manual Commit / Peek Button */}
                    {isPeeking || isScratched ? (
                      <button
                        onClick={() => handleClaimTicket(tIdx)}
                        className={`cred-3d-button ${isHazard ? "cred-3d-button-danger" : "cred-3d-button-emerald"}`}
                        style={{
                          flex: 1.3,
                          padding: "5px 8px",
                          fontSize: "9.5px",
                          fontWeight: 700,
                        }}
                      >
                        <span>{isHazard ? "Commit Hazard" : "Redeem Telemetry [R]"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePeekTicket(tIdx)}
                        className="cred-3d-button cred-3d-button-light"
                        style={{
                          flex: 1.3,
                          padding: "5px 8px",
                          fontSize: "9.5px",
                          fontWeight: 700,
                        }}
                        title="Peek the underlying outcome without committing"
                      >
                        <span>Peek Ticket [P]</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Consolidated Locked Rack Stations */}
        {maxRacks < 6 && (
          <div
            onClick={() => dispatch({ type: "attention.switch", functionId: "operations" })}
            style={{
              padding: "14px 12px",
              borderRadius: "12px",
              border: "1.5px dashed var(--border-graphite)",
              backgroundColor: "rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: "6px",
              minHeight: "130px",
              cursor: "pointer",
            }}
            title="Upgrade Operations Scale in Skill Canvas [K] to unlock parallel cluster racks"
          >
            <div style={{ fontSize: "18px", opacity: 0.6 }}>🖥️🔒</div>
            <div className="font-mono" style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)" }}>
              +{6 - maxRacks} CLUSTER {6 - maxRacks === 1 ? "RACK" : "RACKS"} LOCKED
            </div>
            <div className="mobile-hide" style={{ fontSize: "9.5px", color: "var(--text-secondary)", maxWidth: "160px", lineHeight: 1.3 }}>
              Upgrade Scale in Skill Canvas <kbd className="btn-kbd" style={{ fontSize: "8px" }}>K</kbd> to unlock parallel cluster racks.
            </div>
          </div>
        )}
      </div>

      {/* AUTOMATION DAEMONS STATUS BANNER */}
      {automateRank > 0 && (
        <div
          className="animate-slide-up"
          style={{
            padding: "8px 14px",
            borderRadius: "10px",
            backgroundColor: luckRank === 0 ? "rgba(239, 68, 68, 0.06)" : "rgba(16, 185, 129, 0.06)",
            border: `1px solid ${luckRank === 0 ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.25)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px" }}>{luckRank === 0 ? "⚠️" : "🤖"}</span>
            <div>
              <strong style={{ color: luckRank === 0 ? "var(--color-critical)" : "var(--color-positive)" }}>
                Autonomous Diagnostic Daemons Active (Rank {automateRank})
              </strong>
              <div style={{ fontSize: "9.5px", color: "var(--text-secondary)" }}>
                {luckRank === 0
                  ? "Daemons blindly open all incoming tickets without inspecting. At Luck 0, hazard rate is 38%! Upgrade Luck to purge hazard tickets from queue."
                  : `Daemons blindly open all incoming tickets. Luck Rank ${luckRank} suppresses hazard rate to ${estimatedHazardRate}% with +${luckRank * 15}% Supercore odds.`}
              </div>
            </div>
          </div>
          <span
            className="font-mono"
            style={{
              fontSize: "9px",
              fontWeight: 800,
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: luckRank === 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.2)",
              color: luckRank === 0 ? "#DC2626" : "#047857",
            }}
          >
            {luckRank === 0 ? "HIGH HAZARD RISK" : "LUCK SHIELDED"}
          </span>
        </div>
      )}

      {/* FLOATING SCRATCH PARTICLES */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            pointerEvents: "none",
            fontSize: "13px",
            fontWeight: 800,
            color: p.color,
            zIndex: 9999,
            transform: "translate(-50%, -50%)",
            animation: "float-fade-up 550ms ease-out forwards",
          }}
        >
          {p.text}
        </div>
      ))}
    </div>
  )
}
