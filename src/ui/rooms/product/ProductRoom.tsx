import React, { useEffect, useCallback, useMemo } from "react"
import type { GameState, CodingPod, AIPrimitiveType, CustomerSegment } from "../../../engine/types"
import type { GameAction } from "../../../engine/actions"
import { SCALE_POD_LIMITS, CRAFT_MULTIPLIERS } from "../../../engine/constants"
import { syncProductPods } from "../../../engine/formulas"
import { sound } from "../../../audio/soundEngine"

interface ProductRoomProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

interface PrimitiveMeta {
  type: AIPrimitiveType
  label: string
  hotkey: string
  desc: string
  img: string
  color: string
  glow: string
  border: string
}

const PRIMITIVES: Record<AIPrimitiveType, PrimitiveMeta> = {
  prompt: {
    type: "prompt",
    label: "PROMPT",
    hotkey: "P",
    desc: "Prompt Spec",
    img: "/assets/primitives/primitive_prompt.png",
    color: "#38BDF8",
    glow: "rgba(56, 189, 248, 0.35)",
    border: "rgba(56, 189, 248, 0.5)",
  },
  diff: {
    type: "diff",
    label: "DIFF",
    hotkey: "D",
    desc: "AST Synthesizer",
    img: "/assets/primitives/primitive_diff.png",
    color: "#C084FC",
    glow: "rgba(192, 132, 252, 0.35)",
    border: "rgba(192, 132, 252, 0.5)",
  },
  test: {
    type: "test",
    label: "TEST",
    hotkey: "T",
    desc: "Automated CI/CD",
    img: "/assets/primitives/primitive_test.png",
    color: "#FBBF24",
    glow: "rgba(251, 191, 36, 0.35)",
    border: "rgba(251, 191, 36, 0.5)",
  },
  deploy: {
    type: "deploy",
    label: "DEPLOY",
    hotkey: "S",
    desc: "Production Rollout",
    img: "/assets/primitives/primitive_deploy.png",
    color: "#10B981",
    glow: "rgba(16, 185, 129, 0.35)",
    border: "rgba(16, 185, 129, 0.5)",
  },
}

export const ProductRoom: React.FC<ProductRoomProps> = ({ state, dispatch }) => {
  const scaleRank = state.fleet.product.scaleRank || 0
  const craftRank = state.fleet.product.craftRank || 0
  const automateRank = state.fleet.product.automateRank || 0
  const maxPods = SCALE_POD_LIMITS[scaleRank] || 1

  // Ensure pods are synced
  const activePods = useMemo(() => {
    return syncProductPods(state.productPods, state.qualifiedOpportunities, scaleRank, craftRank)
  }, [state.productPods, state.qualifiedOpportunities, scaleRank, craftRank])

  const dealsReadyCount = (state.currentActivation ? 1 : 0) + state.activationsQueue.length
  const leadsReadyCount = state.qualifiedOpportunities.length

  // Auto-fill primitive across pods
  const handleAutoFillPrimitive = useCallback(
    (primitive: AIPrimitiveType) => {
      sound.playSnap()
      dispatch({ type: "product.auto_fill_primitive", primitive })
    },
    [dispatch]
  )

  // Direct socket fill
  const handleFillSocket = useCallback(
    (podId: string, socketIndex: number, primitive: AIPrimitiveType) => {
      sound.playSnap()
      dispatch({
        type: "product.fill_socket",
        podId,
        socketIndex,
        primitive,
      })
    },
    [dispatch]
  )

  // Ship single pod
  const handleShipPod = useCallback(
    (podId: string) => {
      sound.playCashTick()
      dispatch({ type: "product.ship_pod", podId })
    },
    [dispatch]
  )

  // Keyboard navigation & hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return

      const k = e.key.toUpperCase()
      if (k === "P") {
        e.preventDefault()
        handleAutoFillPrimitive("prompt")
      } else if (k === "D") {
        e.preventDefault()
        handleAutoFillPrimitive("diff")
      } else if (k === "T") {
        e.preventDefault()
        handleAutoFillPrimitive("test")
      } else if (k === "S") {
        e.preventDefault()
        handleAutoFillPrimitive("deploy")
      } else if (e.key === "Enter") {
        // Find first ready pod and ship it
        const readyPod = activePods.find((p) => p.isReadyToShip)
        if (readyPod) {
          e.preventDefault()
          handleShipPod(readyPod.id)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleAutoFillPrimitive, handleShipPod, activePods, dealsReadyCount, dispatch])

  // Segment colors
  const getSegmentColor = (segment: CustomerSegment) => {
    switch (segment) {
      case "creator":
        return "#38BDF8"
      case "team":
        return "#C084FC"
      case "enterprise":
        return "#10B981"
    }
  }

  const hasActiveOpps = leadsReadyCount > 0 || activePods.some(p => Boolean(p.opportunityId))

  if (!hasActiveOpps) {
    return (
      <div className="room-stage-container" style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div className="room-header" style={{ marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <img
            src="/assets/2.5d/nav_product.png"
            alt="Product"
            style={{ width: "42px", height: "42px", objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))", flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div className="room-eyebrow" style={{ color: "var(--accent-product)", marginBottom: "2px" }}>
              <span>02 / PRODUCT & VIBE CODING PODS</span>
            </div>
            <h2 className="room-title">Product Engineering Standby</h2>
            <p className="room-subtitle">
              No qualified market leads in hopper. Triage inbound signals in Demand to route feature specs to autonomous pods.
            </p>
          </div>
        </div>

        <div
          className="room-card"
          style={{
            padding: "48px 32px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            background: "var(--surface-work)",
            border: "1px dashed var(--border-hairline)",
            borderRadius: "16px",
          }}
        >
          <img
            src="/assets/2.5d/nav_product.png"
            alt="Autonomous Pods"
            style={{ width: "56px", height: "56px", objectFit: "contain", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.15))" }}
          />

          <div style={{ maxWidth: "460px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-bright)", margin: "0 0 8px 0" }}>
              Awaiting Qualified Market Leads
            </h3>
            <p className="mobile-hide" style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
              Autonomous coding pods require customer problem specs from Demand before they can synthesize diffs and verify automated CI/CD builds. Qualify inbound market signals to route them here.
            </p>
          </div>

          <button
            onClick={() => {
              sound.playClick()
              dispatch({ type: "attention.switch", functionId: "demand" })
            }}
            className="cred-3d-button cred-3d-button-cyan"
            style={{
              padding: "10px 20px",
              fontSize: "13px",
              marginTop: "8px",
            }}
          >
            <span>Triage Inbound Signals in Demand →</span>
            <kbd className="btn-kbd" style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>1</kbd>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="room-stage-container" style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "12px", width: "100%" }}>
      {/* HEADER & DEMAND HOPPER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <img
            src="/assets/2.5d/nav_product.png"
            alt="Product"
            style={{ width: "42px", height: "42px", objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))", flexShrink: 0 }}
          />
          <div>
            <div className="room-eyebrow" style={{ color: "var(--accent-product)", marginBottom: "2px" }}>
              <span>02 / PRODUCT & VIBE CODING PODS</span>
            </div>
            <h2 className="room-title" style={{ margin: "0 0 3px 0", fontSize: "18px" }}>
              Autonomous Vibe Coding Pods
            </h2>
            <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", display: "flex", gap: "10px" }}>
            <span>
              Scale: <strong>{maxPods} Online Pods</strong> (Rank {scaleRank})
            </span>
            <span>·</span>
            <span>
              Craft Yield: <strong>{CRAFT_MULTIPLIERS[craftRank]}x Output</strong> (Rank {craftRank})
            </span>
            {automateRank > 0 && (
              <>
                <span>·</span>
                <span style={{ color: "var(--color-positive)" }}>
                  Automate: <strong>Rank {automateRank} Active Swarm</strong>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

        {/* DEMAND HOPPER BADGE */}
        <div
          onClick={() => dispatch({ type: "attention.switch", functionId: "demand" })}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            transition: "all 140ms ease",
          }}
          title="Click to view Demand Hopper signals"
        >
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#10B981",
              boxShadow: "0 0 6px #10B981",
            }}
          />
          <div>
            <div style={{ fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.06em", color: "#10B981" }}>
              DEMAND HOPPER: {leadsReadyCount} LEADS READY
            </div>
            <div style={{ display: "flex", gap: "3px", marginTop: "2px" }}>
              {state.qualifiedOpportunities.slice(0, 4).map((lead, idx) => (
                <span
                  key={lead.id || idx}
                  style={{
                    fontSize: "8.5px",
                    fontWeight: 700,
                    padding: "1px 4px",
                    borderRadius: "3px",
                    backgroundColor: "#F1F5F9",
                    border: "1px solid var(--border-hairline)",
                    color: "var(--text-secondary)",
                  }}
                >
                  LEAD #{idx + 1}
                </span>
              ))}
              {leadsReadyCount > 4 && (
                <span style={{ fontSize: "8.5px", color: "var(--text-muted)" }}>
                  +{leadsReadyCount - 4}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ZERO DEMAND PIPELINE NUDGE BANNER */}
      {leadsReadyCount === 0 && (
        <div
          onClick={() => {
            sound.playClick()
            dispatch({ type: "attention.switch", functionId: "demand" })
          }}
          style={{
            padding: "8px 14px",
            borderRadius: "10px",
            backgroundColor: "rgba(2, 132, 199, 0.08)",
            border: "1px solid rgba(2, 132, 199, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
            cursor: "pointer",
            transition: "all 140ms ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                backgroundColor: "rgba(2, 132, 199, 0.15)",
                border: "1px solid rgba(2, 132, 199, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "11px",
                color: "#0284C7",
                fontFamily: "var(--font-mono)",
                flexShrink: 0,
              }}
            >
              01
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-ink)" }}>
                Pipeline Idle: 0 Qualified Leads in Product
              </div>
              <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "1px" }}>
                {state.demandSignals.length > 0
                  ? `${state.demandSignals.length} market signals waiting in Demand.`
                  : "No market signals in hopper. Demand will replenish shortly."}
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              sound.playClick()
              dispatch({ type: "attention.switch", functionId: "demand" })
            }}
            className="cred-3d-button cred-3d-button-cyan"
            style={{
              padding: "4px 10px",
              fontSize: "10.5px",
              fontWeight: 700,
              borderRadius: "6px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
            }}
          >
            <span>Qualify Leads →</span>
            <kbd style={{ background: "rgba(255,255,255,0.25)", color: "#fff", fontSize: "9px", padding: "1px 4px", borderRadius: "3px" }}>1</kbd>
          </button>
        </div>
      )}

      {/* RESPONSIVE PODS GRID */}
      <div
        className="product-pods-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        {activePods.map((pod, idx) => {
          const segColor = getSegmentColor(pod.leadSegment)
          const allFilled = pod.sockets.every((s) => s.filled)
          const unfilledCount = pod.sockets.filter((s) => !s.filled).length

          return (
            <div
              key={pod.id || idx}
              style={{
                borderRadius: "12px",
                backgroundColor: "var(--surface-card)",
                border: pod.isReadyToShip
                  ? "1.5px solid var(--color-positive)"
                  : "1px solid var(--border-hairline)",
                boxShadow: pod.isReadyToShip
                  ? "0 4px 16px rgba(16, 185, 129, 0.15)"
                  : "var(--shadow-card)",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transition: "all 140ms ease",
              }}
            >
              {/* Pod Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div
                    style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    POD // 0{idx + 1} · {pod.categoryTag}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-ink)", marginTop: "1px" }}>
                    {pod.moduleName}
                  </div>
                </div>

                {/* Lines Delta */}
                <div className="font-mono" style={{ fontSize: "9.5px", fontWeight: 700 }}>
                  <span style={{ color: "#059669" }}>+{pod.linesAdded}</span>
                  <span style={{ color: "var(--text-secondary)", margin: "0 2px" }}>/</span>
                  <span style={{ color: "#E11D48" }}>-{pod.linesRemoved}</span>
                </div>
              </div>

              {/* Lead Prospect Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "8.5px",
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: "4px",
                    backgroundColor: `${segColor}15`,
                    color: segColor,
                    border: `1px solid ${segColor}35`,
                  }}
                >
                  {pod.leadSegment.toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "180px",
                  }}
                  title={pod.leadTitle}
                >
                  {pod.leadTitle}
                </span>
              </div>

              {/* Monospace Code Preview */}
              <div
                style={{
                  padding: "6px 9px",
                  borderRadius: "6px",
                  backgroundColor: "var(--surface-sunken)",
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "9.5px",
                  color: "var(--text-ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {pod.codeSnippet}
              </div>

              {/* 2.5D Tactile Sockets Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "6px 8px",
                  backgroundColor: "var(--surface-work)",
                  borderRadius: "8px",
                  border: "1px dashed var(--border-hairline)",
                }}
              >
                {pod.sockets.map((sock, sIdx) => {
                  const meta = PRIMITIVES[sock.type]

                  return (
                    <div
                      key={sIdx}
                      onClick={() => !sock.filled && handleFillSocket(pod.id, sIdx, sock.type)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px",
                        cursor: sock.filled ? "default" : "pointer",
                      }}
                      title={sock.filled ? `${meta.label} Verified` : `Click to slot ${meta.label} [${meta.hotkey}]`}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "8px",
                          position: "relative",
                          overflow: "hidden",
                          border: sock.filled
                            ? `1.5px solid ${meta.color}`
                            : `1px dashed var(--border-hairline)`,
                          backgroundColor: sock.filled ? "var(--surface-card)" : "var(--surface-sunken)",
                          boxShadow: sock.filled ? `0 2px 8px ${meta.glow}` : "none",
                          transition: "all 120ms ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={meta.img}
                          alt={meta.label}
                          style={{
                            width: "75%",
                            height: "75%",
                            objectFit: "contain",
                            opacity: sock.filled ? 1 : 0.4,
                            filter: sock.filled ? "none" : "grayscale(80%)",
                            transition: "all 140ms ease",
                          }}
                        />

                        {sock.filled && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: "1px",
                              right: "1px",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: "#10B981",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span style={{ color: "#fff", fontSize: "8px", fontWeight: 900, lineHeight: 1 }}>✓</span>
                          </div>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: "8px",
                          fontWeight: 800,
                          letterSpacing: "0.02em",
                          color: sock.filled ? meta.color : "var(--text-muted)",
                        }}
                      >
                        {meta.label} {sock.filled ? "✓" : `[${meta.hotkey}]`}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Action Button: Ready to Ship or Incomplete */}
              <div style={{ marginTop: "auto", paddingTop: "2px" }}>
                {pod.isReadyToShip ? (
                  <button
                    onClick={() => handleShipPod(pod.id)}
                    className="cred-3d-button cred-3d-button-emerald"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor: "pointer",
                    }}
                  >
                    <span>SHIP TO PRODUCTION</span>
                    <kbd
                      style={{
                        fontSize: "9px",
                        padding: "1px 5px",
                        borderRadius: "3px",
                        background: "rgba(255, 255, 255, 0.25)",
                        fontWeight: 900,
                      }}
                    >
                      ↵
                    </kbd>
                  </button>
                ) : (
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      backgroundColor: "#F8FAFC",
                      border: "1px solid var(--border-hairline)",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Awaiting Spec ({unfilledCount} left)</span>
                    <span style={{ fontWeight: 700, color: "#0284C7" }}>Press [P,D,T,S]</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* LOCKED POD SLOTS */}
        {maxPods < 6 && (
          <div
            onClick={() => dispatch({ type: "attention.switch", functionId: "operations" })}
            style={{
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              border: "1.5px dashed var(--border-graphite)",
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: "6px",
              cursor: "pointer",
              minHeight: "180px",
            }}
            title="Upgrade Scale in Radial Skill Canvas [K]"
          >
            <div
              style={{
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "var(--text-muted)",
                padding: "2px 7px",
                borderRadius: "4px",
                backgroundColor: "#F1F5F9",
                border: "1px solid var(--border-hairline)",
              }}
            >
              [SLOT LOCKED]
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-ink)" }}>
              POD // 0{maxPods + 1} Locked
            </div>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: 0, maxWidth: "160px", lineHeight: 1.35 }}>
              Upgrade <strong>Scale</strong> in Skill Canvas [K] to unlock more pods.
            </p>
          </div>
        )}
      </div>

      {/* PIPELINE BRIDGE BANNER: DEALS READY */}
      {dealsReadyCount > 0 && (
        <div
          onClick={() => dispatch({ type: "attention.switch", functionId: "monetisation" })}
          style={{
            padding: "8px 14px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
            border: "1px solid #A7F3D0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
            cursor: "pointer",
            transition: "all 140ms ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                backgroundColor: "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "12px",
                color: "#FFFFFF",
                fontFamily: "var(--font-mono)",
              }}
            >
              $
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#065F46" }}>
                {dealsReadyCount} {dealsReadyCount === 1 ? "Deal" : "Deals"} Ready! Open Pricing
              </div>
              <div style={{ fontSize: "10.5px", color: "#047857" }}>
                Shipped activations are waiting for pricing in Monetisation.
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              sound.playClick()
              dispatch({ type: "attention.switch", functionId: "monetisation" })
            }}
            className="cred-3d-button cred-3d-button-emerald"
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "10.5px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <span>Monetise Deals →</span>
            <kbd style={{ padding: "1px 4px", borderRadius: "3px", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: "9px" }}>
              3
            </kbd>
          </button>
        </div>
      )}

      {/* SPECIFICATION ARSENAL // AI PRIMITIVES (BOTTOM TRAY) */}
      <div
        className="room-card"
        style={{
          padding: "10px 14px",
          backgroundColor: "var(--surface-card)",
          border: "1px solid var(--border-hairline)",
          borderRadius: "12px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", color: "var(--text-ink)" }}>
              SPECIFICATION ARSENAL // AI PRIMITIVES
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
              [Click or hotkey: <strong>P, D, T, S</strong>]
            </span>
          </div>

          <div style={{ fontSize: "9px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            2.5D SPEC PRIMITIVES
          </div>
        </div>

        {/* 4 Tactile Primitive Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {(["prompt", "diff", "test", "deploy"] as AIPrimitiveType[]).map((type) => {
            const meta = PRIMITIVES[type]

            return (
              <div
                key={type}
                onClick={() => handleAutoFillPrimitive(type)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  backgroundColor: "var(--surface-work)",
                  border: "1px solid var(--border-hairline)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 120ms ease",
                  height: "44px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF"
                  e.currentTarget.style.borderColor = meta.color
                  e.currentTarget.style.transform = "translateY(-1px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--surface-work)"
                  e.currentTarget.style.borderColor = "var(--border-hairline)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                {/* 2.5D Thumbnail */}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={meta.img}
                    alt={meta.label}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      filter: `drop-shadow(0 1px 4px ${meta.glow})`,
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10.5px", fontWeight: 800, color: meta.color }}>
                      {meta.label}
                    </span>
                    <kbd
                      style={{
                        fontSize: "8.5px",
                        fontWeight: 800,
                        padding: "1px 4px",
                        borderRadius: "3px",
                        backgroundColor: "rgba(18, 22, 26, 0.06)",
                        color: "var(--text-ink)",
                        border: "1px solid var(--border-hairline)",
                      }}
                    >
                      {meta.hotkey}
                    </kbd>
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {meta.desc}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
