import React, { useState, useEffect, useCallback, useMemo } from "react"
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
    (ticketIndex: number, podIndex: number, pod: ScratchPod) => {
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
        podIndex,
      })
    },
    [activeTickets, dispatch]
  )

  // Claim single ticket station
  const handleClaimTicket = useCallback(
    (ticketIndex: number) => {
      const ticket = activeTickets[ticketIndex]
      if (!ticket) return
      if ((ticket.bankedCashCents ?? 0) > 0 || (ticket.bankedStrainRelief ?? 0) > 0) {
        sound.playCashTick()
      } else {
        sound.playSnap()
      }
      dispatch({
        type: "operations.claim_ticket",
        ticketIndex,
      })
    },
    [activeTickets, dispatch]
  )

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return

      if ((e.key === "h" || e.key === "H") && incidentsBacklog > 0) {
        e.preventDefault()
        handleResolveIncident()
      } else if (e.key === " ") {
        e.preventDefault()
        handleBatchScratchAll()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleBatchScratchAll, incidentsBacklog, handleResolveIncident])

  const isOverCapacity = coordinationLoad > opsCapacity
  const rotColor = contextRot > 0.4 ? "var(--color-critical)" : contextRot > 0.15 ? "var(--color-warning)" : "var(--color-positive)"

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
              Diagnostic scratch tickets stream live node telemetry. Probe compute, memory, and cluster health sectors to drain strain and purge rot.
            </p>
            <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span>
                Scale: <strong>{maxRacks} Diagnostic {maxRacks === 1 ? "Station" : "Stations"}</strong> (Rank {scaleRank})
              </span>
              <span>·</span>
              <span>
                Craft Yield: <strong>+{Math.round((craftRecoveryMultiplier - 1) * 100)}% Telemetry Yield</strong> (Rank {craftRank})
              </span>
              <span>·</span>
              <span style={{ color: automateRank > 0 ? "var(--color-positive)" : "var(--text-secondary)" }}>
                Automate: <strong>{automateRank > 0 ? `Rank ${automateRank} Autonomous Diagnostic Daemons` : "Manual Probe"}</strong>
              </span>
              {luckRank > 0 && (
                <>
                  <span>·</span>
                  <span style={{ color: "#A855F7" }}>
                    Luck: <strong>+{luckRank * 15}% Supercore Odds</strong> (Rank {luckRank})
                  </span>
                </>
              )}
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
          title="Batch scratch all active tickets and claim safe recovery telemetry in parallel"
        >
          <span>Batch Resolve All</span>
          <kbd className="btn-kbd" style={{ background: "rgba(255,255,255,0.25)", color: "#fff", fontSize: "9px" }}>Space</kbd>
        </button>
      </div>

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
          const bankedCash = ticket.bankedCashCents ?? 0
          const bankedStrain = ticket.bankedStrainRelief ?? 0
          const bankedRot = ticket.bankedRotRelief ?? 0
          const hasBanked = bankedCash > 0 || bankedStrain > 0 || bankedRot > 0
          const unscratchedCount = ticket.pods.filter(p => !p.isScratched).length

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
                        : unscratchedCount === 0
                        ? "rgba(16, 185, 129, 0.15)"
                        : "rgba(0, 0, 0, 0.06)",
                      color: isBusted
                        ? "var(--color-critical)"
                        : isGolden
                        ? "#D97706"
                        : unscratchedCount === 0
                        ? "var(--color-positive)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {isBusted
                      ? "FAULT OVERLOAD"
                      : isGolden
                      ? "TPU SUPERCORE"
                      : unscratchedCount === 0
                      ? "READY TO CLAIM"
                      : `${3 - unscratchedCount}/3 PROBED`}
                  </span>
                </div>

                <div style={{ fontSize: "9.5px", color: "var(--text-muted)", marginBottom: "8px", lineHeight: 1.2 }}>
                  {ticket.subtitle || "Live Diagnostic & Recovery Telemetry"}
                </div>

                {/* Banked Metrics Pill */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    backgroundColor: "var(--surface-work)",
                    border: "1px solid var(--border-hairline)",
                    fontSize: "9px",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--text-muted)", textTransform: "uppercase" }}>Rebate: </span>
                    <strong className="font-mono" style={{ color: "#D97706" }}>+${Math.round(bankedCash / 100)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)", textTransform: "uppercase" }}>Strain: </span>
                    <strong className="font-mono" style={{ color: "var(--color-positive)" }}>-{bankedStrain}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)", textTransform: "uppercase" }}>Rot: </span>
                    <strong className="font-mono" style={{ color: "#7C3AED" }}>-{Math.round(bankedRot * 100)}%</strong>
                  </div>
                </div>
              </div>

              {/* 3 Sectors Scratch Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                {ticket.pods.map((pod, pIdx) => {
                  const podKey = `${tIdx}-${pIdx}`
                  const isHovered = hoveredPodKey === podKey
                  const isScratched = pod.isScratched
                  const isRotten = pod.isNegative
                  const isPodGolden = pod.symbol === "golden_apple"

                  return (
                    <div
                      key={pod.id}
                      onClick={() => handleScratchSector(tIdx, pIdx, pod)}
                      onMouseEnter={() => setHoveredPodKey(podKey)}
                      onMouseLeave={() => setHoveredPodKey(null)}
                      style={{
                        padding: "8px 4px",
                        borderRadius: "8px",
                        textAlign: "center",
                        cursor: isScratched || isBusted ? "default" : "pointer",
                        userSelect: "none",
                        backgroundColor: isScratched
                          ? isRotten
                            ? "rgba(239, 68, 68, 0.1)"
                            : isPodGolden
                            ? "rgba(245, 158, 11, 0.12)"
                            : "rgba(16, 185, 129, 0.08)"
                          : isHovered
                          ? "var(--surface-raised)"
                          : "var(--surface-work)",
                        border: isScratched
                          ? isRotten
                            ? "1.5px solid rgba(239, 68, 68, 0.4)"
                            : isPodGolden
                            ? "1.5px solid rgba(245, 158, 11, 0.4)"
                            : "1.5px solid rgba(16, 185, 129, 0.35)"
                          : isHovered
                          ? "1.5px solid var(--accent-operations)"
                          : "1px solid var(--border-hairline)",
                        transition: "all 120ms ease",
                        minHeight: "78px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "2px",
                      }}
                    >
                      {isScratched ? (
                        <>
                          <div style={{ fontSize: "16px" }}>
                            {isRotten ? "💥" : isPodGolden ? "🌟" : pIdx === 0 ? "🪙" : pIdx === 1 ? "🧹" : "🛡️"}
                          </div>
                          <div
                            className="font-mono"
                            style={{
                              fontSize: "8.5px",
                              fontWeight: 800,
                              color: isRotten
                                ? "var(--color-critical)"
                                : isPodGolden
                                ? "#D97706"
                                : "var(--color-positive)",
                              lineHeight: 1.1,
                            }}
                          >
                            {pod.label.split(":")[0]}
                          </div>
                          <div style={{ fontSize: "7.5px", color: "var(--text-secondary)", lineHeight: 1 }}>
                            {pod.label.split(":")[1] || ""}
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className="font-mono"
                            style={{
                              fontSize: "9px",
                              fontWeight: 800,
                              color: isHovered ? "var(--accent-operations)" : "var(--text-muted)",
                            }}
                          >
                            S-0{pIdx + 1}
                          </div>
                          <div style={{ fontSize: "8.5px", fontWeight: 700, color: "var(--text-ink)" }}>
                            {pIdx === 0 ? "Compute" : pIdx === 1 ? "Memory" : "Sentry"}
                          </div>
                          <div
                            style={{
                              fontSize: "7.5px",
                              color: isHovered ? "#166534" : "var(--text-secondary)",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              marginTop: "2px",
                            }}
                          >
                            {isHovered ? "Click Probe" : "Unscratched"}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Station Action Footer */}
              <div>
                {isBusted ? (
                  <button
                    onClick={() => handleClaimTicket(tIdx)}
                    className="cred-3d-button cred-3d-button-danger"
                    style={{ width: "100%", padding: "5px 8px", fontSize: "10px" }}
                  >
                    <span>Clear Fault · Draw Next Ticket</span>
                  </button>
                ) : hasBanked || unscratchedCount === 0 ? (
                  <button
                    onClick={() => handleClaimTicket(tIdx)}
                    className="cred-3d-button cred-3d-button-emerald"
                    style={{ width: "100%", padding: "5px 8px", fontSize: "10px" }}
                  >
                    <span>Commit Recovery (+${Math.round(bankedCash / 100)})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const nextUnscratched = ticket.pods.findIndex(p => !p.isScratched)
                      if (nextUnscratched !== -1) {
                        handleScratchSector(tIdx, nextUnscratched, ticket.pods[nextUnscratched])
                      }
                    }}
                    className="cred-3d-button cred-3d-button-light"
                    style={{ width: "100%", padding: "5px 8px", fontSize: "10px" }}
                  >
                    <span>Probe Next Sector</span>
                  </button>
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
            backgroundColor: "rgba(16, 185, 129, 0.06)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px" }}>🤖</span>
            <div>
              <strong style={{ color: "var(--color-positive)" }}>
                Autonomous Diagnostic Daemons Active (Rank {automateRank})
              </strong>
              <div style={{ fontSize: "9.5px", color: "var(--text-secondary)" }}>
                Daemons continuously probe open ticket queues, safely isolate hardware anomalies, and bank cluster telemetry.
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
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              color: "#047857",
            }}
          >
            ACTIVE DAEMON
          </span>
        </div>
      )}
    </div>
  )
}
