import React, { useState, useEffect, useCallback, useMemo } from "react"
import type { GameState, CustomerAccount, MergeItem, ExpansionOrder } from "../../../engine/types"
import type { GameAction } from "../../../engine/actions"
import {
  EXPANSION_MATURITY_TICKS,
  EXPANSION_MIN_HEALTH,
  MAX_ADDON_SLOTS,
  ADDON_PRICE_FRACTION,
  EXPANSION_BAY_LIMITS,
  CRAFT_MULTIPLIERS,
  EXPANSION_GRID_SIZES,
  EXPANSION_GRID_DIMS,
  EXTENDED_TIER_NAMES,
} from "../../../engine/constants"
import { sound } from "../../../audio/soundEngine"

interface ExpansionRoomProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

// Chain and Tier Visual Taxonomy
interface ChainDetail {
  name: string
  color: string
  glow: string
  bg: string
  border: string
  tierNames: string[]
  assetPath: string
}

const CHAIN_META: Record<string, ChainDetail> = {
  intelligence: {
    name: "Intelligence",
    color: "#A855F7",
    glow: "rgba(168, 85, 247, 0.4)",
    bg: "rgba(168, 85, 247, 0.12)",
    border: "rgba(168, 85, 247, 0.45)",
    assetPath: "/assets/2.5d/expansion_intelligence.png",
    tierNames: EXTENDED_TIER_NAMES.intelligence,
  },
  infrastructure: {
    name: "Infrastructure",
    color: "#38BDF8",
    glow: "rgba(56, 189, 248, 0.4)",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.45)",
    assetPath: "/assets/2.5d/expansion_infrastructure.png",
    tierNames: EXTENDED_TIER_NAMES.infrastructure,
  },
  security: {
    name: "Security",
    color: "#F59E0B",
    glow: "rgba(245, 158, 11, 0.4)",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.45)",
    assetPath: "/assets/2.5d/expansion_security.png",
    tierNames: EXTENDED_TIER_NAMES.security,
  },
}

export const ExpansionRoom: React.FC<ExpansionRoomProps> = ({ state, dispatch }) => {
  const scaleRank = state.fleet?.expansion?.scaleRank ?? 0
  const craftRank = state.fleet?.expansion?.craftRank ?? 0
  const automateRank = state.fleet?.expansion?.automateRank ?? 0
  const luckRank = state.fleet?.expansion?.luckRank ?? 0
  const maxOrderBays = EXPANSION_BAY_LIMITS[scaleRank] || 1
  const gridDim = EXPANSION_GRID_DIMS[scaleRank] || 4
  const targetGridSize = EXPANSION_GRID_SIZES[scaleRank] || 16
  const craftYieldMultiplier = 1 + 0.20 * ((CRAFT_MULTIPLIERS[craftRank] || 1) - 1)

  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(null)
  const [draggedCellIndex, setDraggedCellIndex] = useState<number | null>(null)
  const [spawnChain, setSpawnChain] = useState<"random" | "intelligence" | "infrastructure" | "security">("random")
  const [justMergedIndex, setJustMergedIndex] = useState<number | null>(null)

  const accounts = state.accounts || []

  const grid = useMemo(() => {
    return state.mergeGrid || Array(targetGridSize).fill(null)
  }, [state.mergeGrid, targetGridSize])

  const orders = useMemo(() => {
    return state.expansionOrders || []
  }, [state.expansionOrders])

  const activeOrders = useMemo(() => {
    return (state.expansionOrders || []).slice(0, maxOrderBays)
  }, [state.expansionOrders, maxOrderBays])

  const emptySlotsCount = useMemo(() => {
    return grid.filter((c) => c === null).length
  }, [grid])

  const canSpawn = emptySlotsCount > 0 && state.cashCents >= 1500

  // Check if any order is currently fulfillable
  const fulfillableOrderIds = useMemo(() => {
    const ready = new Set<string>()
    for (const order of orders) {
      const hasItem = grid.some(
        (item) => item && item.chain === order.chain && item.tier >= order.targetTier
      )
      if (hasItem) {
        ready.add(order.id)
      }
    }
    return ready
  }, [grid, orders])

  // SPAWN ITEM (Synthesizer)
  const handleSpawn = useCallback(() => {
    if (!canSpawn) {
      sound.playWarning()
      return
    }
    sound.playClick()
    dispatch({
      type: "expansion.spawn_item",
      chain: spawnChain === "random" ? undefined : spawnChain,
    })
  }, [canSpawn, spawnChain, dispatch])

  // CELL CLICK / MERGE
  const handleCellClick = useCallback(
    (index: number) => {
      const item = grid[index]

      // Nothing selected yet
      if (selectedCellIndex === null) {
        if (item) {
          sound.playSnap()
          setSelectedCellIndex(index)
        }
        return
      }

      // Re-clicked same cell: deselect
      if (selectedCellIndex === index) {
        setSelectedCellIndex(null)
        return
      }

      const source = grid[selectedCellIndex]
      if (!source) {
        setSelectedCellIndex(item ? index : null)
        return
      }

      // Target is occupied: check merge condition
      if (item) {
        if (source.chain === item.chain && source.tier === item.tier && source.tier < 5) {
          // Valid merge!
          sound.playMerge(source.tier + 1)
          setJustMergedIndex(index)
          setTimeout(() => setJustMergedIndex(null), 600)
          dispatch({
            type: "expansion.merge_grid",
            fromIndex: selectedCellIndex,
            toIndex: index,
          })
          setSelectedCellIndex(null)
          return
        } else {
          // Different tier/chain: switch selection to target
          sound.playSnap()
          setSelectedCellIndex(index)
          return
        }
      } else {
        // Target is empty: move selected item to empty slot!
        sound.playSnap()
        dispatch({
          type: "expansion.merge_grid",
          fromIndex: selectedCellIndex,
          toIndex: index,
        })
        setSelectedCellIndex(null)
        return
      }

      setSelectedCellIndex(null)
    },
    [grid, selectedCellIndex, dispatch]
  )

  // DISCARD ITEM
  const handleDiscard = useCallback(
    (index: number) => {
      if (grid[index]) {
        sound.playWarning()
        dispatch({
          type: "expansion.discard_item",
          index,
        })
        if (selectedCellIndex === index) {
          setSelectedCellIndex(null)
        }
      }
    },
    [grid, selectedCellIndex, dispatch]
  )

  // FULFILL CUSTOMER SUPPLY ORDER
  const handleFulfillOrder = useCallback(
    (orderId: string) => {
      sound.playCashTick()
      dispatch({
        type: "expansion.fulfill_order",
        orderId,
      })
      setSelectedCellIndex(null)
    },
    [dispatch]
  )

  // DRAG AND DROP HANDLING
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!grid[index]) return
    setDraggedCellIndex(index)
    e.dataTransfer.setData("text/plain", String(index))
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const sourceIndex = draggedCellIndex
    setDraggedCellIndex(null)

    if (sourceIndex === null || sourceIndex === targetIndex) return
    const source = grid[sourceIndex]
    const target = grid[targetIndex]

    if (source && target && source.chain === target.chain && source.tier === target.tier && source.tier < 5) {
      sound.playMerge(source.tier + 1)
      setJustMergedIndex(targetIndex)
      setTimeout(() => setJustMergedIndex(null), 600)
      dispatch({
        type: "expansion.merge_grid",
        fromIndex: sourceIndex,
        toIndex: targetIndex,
      })
    } else if (source && !target) {
      // Dragged onto empty slot: move!
      sound.playSnap()
      dispatch({
        type: "expansion.merge_grid",
        fromIndex: sourceIndex,
        toIndex: targetIndex,
      })
    }
  }

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return

      if (e.code === "Space") {
        e.preventDefault()
        handleSpawn()
      } else if (e.key === "Escape") {
        setSelectedCellIndex(null)
      } else if ((e.key === "Backspace" || e.key === "Delete") && selectedCellIndex !== null) {
        e.preventDefault()
        handleDiscard(selectedCellIndex)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSpawn, handleDiscard, selectedCellIndex])

  if (accounts.length === 0) {
    return (
      <div className="room-stage-container" style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div className="room-header" style={{ marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <img
            src="/assets/2.5d/nav_expansion.png"
            alt="Expansion"
            style={{ width: "42px", height: "42px", objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))", flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div className="room-eyebrow" style={{ color: "var(--accent-expansion)" }}>
              <span>05 / ACCOUNT EXPANSION & SYNTHESIS STUDIO</span>
            </div>
            <h2 className="room-title">Expansion Studio Standby</h2>
            <p className="room-subtitle">
              No active customer accounts yet. Expansion requires live customer contracts to upsell modular feature tiers.
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
            src="/assets/2.5d/nav_expansion.png"
            alt="Expansion Synthesis"
            style={{ width: "56px", height: "56px", objectFit: "contain", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.15))" }}
          />

          <div style={{ maxWidth: "460px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-bright)", margin: "0 0 8px 0" }}>
              Awaiting Live Customer Fleet
            </h3>
            <p className="mobile-hide" style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
              Expansion operates on existing contractual ARR. Once customer contracts are signed in Monetisation, maturing accounts will generate inbound feature supply demands and become eligible for enterprise add-on packages.
            </p>
          </div>

          <button
            onClick={() => {
              sound.playClick()
              dispatch({ type: "attention.switch", functionId: "demand" })
            }}
            className="cred-3d-button cred-3d-button-amber"
            style={{
              padding: "10px 20px",
              fontSize: "13px",
              marginTop: "8px",
            }}
          >
            <span>Acquire First Customer in Demand →</span>
            <kbd className="btn-kbd" style={{ background: "rgba(0,0,0,0.15)", color: "#000" }}>1</kbd>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="room-stage-container" style={{ maxWidth: "880px", margin: "0 auto", paddingBottom: "12px" }}>
      {/* Header */}
      <div className="room-header" style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          className="liquid-chrome-icon-box"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <img
            src="/assets/2.5d/nav_expansion.png"
            alt="Expansion"
            style={{ width: "28px", height: "28px", objectFit: "contain" }}
          />
        </div>
        <div>
          <div className="room-eyebrow" style={{ color: "var(--accent-expansion)", marginBottom: "2px" }}>
            <span>05 / ACCOUNT EXPANSION & SYNTHESIS STUDIO</span>
          </div>
          <h2 className="room-title" style={{ fontSize: "18px", margin: "0 0 2px 0" }}>Merge & Supply: Feature Upsell Engine</h2>
          <p className="room-subtitle" style={{ fontSize: "11px", margin: "0 0 3px 0" }}>
            Synthesize modular feature tiers (T1 → T7) on the {gridDim}×{gridDim} matrix and fulfill customer supply demands across {maxOrderBays} dispatch bays to expand contractual ARR.
          </p>
          <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span>
              Scale: <strong>{maxOrderBays} Dispatch {maxOrderBays === 1 ? 'Bay' : 'Bays'} · {gridDim}×{gridDim} Matrix</strong> (Rank {scaleRank})
            </span>
            <span>·</span>
            <span>
              Craft Yield: <strong>{craftYieldMultiplier.toFixed(1)}x Fulfillment ARR</strong> (Rank {craftRank})
            </span>
            <span>·</span>
            <span style={{ color: automateRank > 0 ? "var(--color-positive)" : "var(--text-secondary)" }}>
              Automate: <strong>{automateRank > 0 ? `Rank ${automateRank} Auto-Synthesizer` : "Manual Synthesis"}</strong>
            </span>
            {luckRank > 0 && (
              <>
                <span>·</span>
                <span style={{ color: "#A855F7" }}>
                  Luck: <strong>+{luckRank * 10}% Quantum Double Yield</strong> (Rank {luckRank})
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* CUSTOMER SUPPLY ORDERS RIBBON */}
          <div
            className="room-card"
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--surface-raised)",
              border: "1px solid var(--border-hairline)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(167, 120, 255, 0.15)",
                    color: "var(--accent-expansion)",
                    border: "1px solid rgba(167, 120, 255, 0.3)",
                  }}
                >
                  ORDERS
                </span>
                <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-bright)" }}>
                  Live Customer Supply Demands ({orders.length})
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Deliver synthesized features to lock in high-margin recurring ARR
              </span>
            </div>

            {orders.length === 0 ? (
              <div
                style={{
                  padding: "24px 20px",
                  textAlign: "center",
                  borderRadius: "8px",
                  backgroundColor: "var(--surface-work)",
                  border: "1px dashed var(--border-subtle)",
                }}
              >
                {state.accounts.length === 0 ? (
                  <>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-bright)", marginBottom: "4px" }}>
                      No Live Customer Accounts Yet (0 Active Deals)
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.5 }}>
                      Expansion RFPs and add-on module demands come from active customer accounts. Qualify prospects in <strong>[01 Demand]</strong>, verify code in <strong>[02 Product]</strong>, and sign pilots in <strong>[03 Monetisation]</strong> to unlock high-margin recurring expansion orders here!
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--accent-expansion)", fontWeight: 600, marginTop: "8px" }}>
                      Tip: You can pre-synthesize and merge modules on the 4x4 matrix below so high-tier features are ready immediately when orders arrive.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-bright)", marginBottom: "4px" }}>
                      All Customer Supply Demands Satisfied ({state.accounts.length} Active {state.accounts.length === 1 ? "Account" : "Accounts"})
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.5 }}>
                      Your live customer accounts are currently running standard contracts. New expansion RFPs will arrive as accounts mature with SLA health ≥ 50%. Keep synthesizing and merging high-tier features below to fulfill upcoming demands for instant cash and recurring ARR!
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                {activeOrders.map((order, idx) => {
                  const chainInfo = CHAIN_META[order.chain] || CHAIN_META.intelligence
                  const isReady = fulfillableOrderIds.has(order.id)
                  const tierName = chainInfo.tierNames[order.targetTier - 1] || `Tier ${order.targetTier}`

                  return (
                    <div
                      key={order.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: isReady
                          ? `2px solid ${chainInfo.color}`
                          : "1px solid var(--border-hairline)",
                        backgroundColor: isReady
                          ? "var(--surface-card)"
                          : "var(--surface-work)",
                        boxShadow: isReady
                          ? `0 0 16px ${chainInfo.glow}`
                          : "none",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                        transition: "all 140ms ease",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className="font-mono" style={{ fontSize: "8.5px", fontWeight: 800, color: "var(--text-muted)" }}>
                              BAY // 0{idx + 1}
                            </span>
                            <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--text-bright)" }}>
                              {order.accountName}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            {((state.expansionEvent?.active && (order.id === state.expansionEvent.orderId || order.accountName === state.expansionEvent.accountName)) || order.id.includes("rfp")) && (
                              <span
                                className="font-mono"
                                style={{
                                  fontSize: "8px",
                                  fontWeight: 800,
                                  letterSpacing: "0.05em",
                                  padding: "1px 4px",
                                  borderRadius: "3px",
                                  backgroundColor: "rgba(245, 158, 11, 0.2)",
                                  color: "#D97706",
                                  border: "1px solid rgba(245, 158, 11, 0.4)",
                                }}
                              >
                                RFP
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: "8.5px",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                padding: "1px 5px",
                                borderRadius: "4px",
                                backgroundColor: chainInfo.bg,
                                color: chainInfo.color,
                                border: `1px solid ${chainInfo.border}`,
                              }}
                            >
                              {order.chain}
                            </span>
                          </div>
                        </div>

                        {/* Required Item Badge */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            backgroundColor: "var(--surface-sunken)",
                            border: "1px solid var(--border-subtle)",
                            marginBottom: "6px",
                          }}
                        >
                          <div style={{ position: "relative", width: "24px", height: "24px", flexShrink: 0 }}>
                            <img
                              src={chainInfo.assetPath}
                              alt={order.chain}
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "4px",
                                objectFit: "contain",
                                filter: `drop-shadow(0 2px 4px ${chainInfo.glow})`,
                              }}
                            />
                            <span
                              className="font-mono"
                              style={{
                                position: "absolute",
                                bottom: "-2px",
                                right: "-2px",
                                fontSize: "7.5px",
                                fontWeight: 900,
                                padding: "0 2px",
                                borderRadius: "2px",
                                backgroundColor: chainInfo.color,
                                color: "#000",
                              }}
                            >
                              T{order.targetTier}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-bright)" }}>
                              {tierName}
                            </div>
                            <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                              Requires Tier {order.targetTier}+
                            </div>
                          </div>
                        </div>

                        {/* Reward Metric */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10.5px", marginBottom: "8px" }}>
                          <span style={{ color: "var(--text-secondary)", fontSize: "10px" }}>ARR Yield:</span>
                          <div style={{ textAlign: "right" }}>
                            <div>
                              <span className="font-mono" style={{ color: "var(--color-positive)", fontWeight: 800, marginRight: (order.rewardCashCents ?? 0) > 0 ? "4px" : "0" }}>
                                +${Math.round((order.rewardArrCents * craftYieldMultiplier) / 100).toLocaleString()}/yr
                              </span>
                              {(order.rewardCashCents ?? 0) > 0 && (
                                <span className="font-mono" style={{ color: "var(--accent-monetisation)", fontWeight: 700 }}>
                                  +${Math.round(order.rewardCashCents / 100)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Supply Action Button */}
                      <button
                        onClick={() => handleFulfillOrder(order.id)}
                        disabled={!isReady}
                        className={`cred-3d-button ${isReady ? "cred-3d-button-emerald" : "cred-3d-button-disabled"}`}
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          fontSize: "11px",
                          gap: "4px",
                        }}
                      >
                        {isReady ? (
                          <span>SUPPLY & EXPAND →</span>
                        ) : (
                          <span>Needs T{order.targetTier} {order.chain}</span>
                        )}
                      </button>
                    </div>
                  )
                })}

                {/* Locked Order Dispatch Bays Indicator */}
                {maxOrderBays < 6 && (
                  <div
                    key="locked-bays-indicator"
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1.5px dashed var(--border-hairline)",
                      backgroundColor: "rgba(15, 23, 42, 0.02)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      gap: "4px",
                      minHeight: "100px",
                    }}
                  >
                    <div style={{ fontSize: "18px", opacity: 0.6 }}>📦🔒</div>
                    <div className="font-mono" style={{ fontSize: "9.5px", fontWeight: 800, color: "var(--text-muted)" }}>
                      {6 - maxOrderBays} MORE DISPATCH {6 - maxOrderBays === 1 ? 'BAY' : 'BAYS'} LOCKED
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--text-secondary)", maxWidth: "180px", lineHeight: 1.3 }}>
                      Upgrade Scale in Architecture Tree [K] to unlock parallel supply bays.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MAIN MODULAR MERGE BOARD STAGE */}
          <div className="expansion-merge-stage" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px", alignItems: "start" }}>
            {/* DYNAMIC GRID */}
            <div
              className="room-card"
              style={{
                padding: gridDim >= 5 ? "12px 14px" : "18px 20px",
                backgroundColor: "var(--surface-work)",
                border: "1px solid var(--border-hairline)",
                borderRadius: "12px",
                boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: gridDim >= 5 ? "8px" : "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-expansion)" }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-ink)" }}>
                    {gridDim}×{gridDim} Modular Synthesis Matrix
                  </span>
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                  {emptySlotsCount} / {grid.length} Slots Open
                </div>
              </div>

              {/* Dynamic Cells Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${gridDim}, 1fr)`,
                  gap: gridDim >= 6 ? "5px" : gridDim === 5 ? "7px" : "9px",
                  justifyContent: "center",
                }}
              >
                {grid.map((cell, idx) => {
                  const isSelected = selectedCellIndex === idx
                  const isJustMerged = justMergedIndex === idx
                  const chainMeta = cell ? (CHAIN_META[cell.chain] || CHAIN_META.intelligence) : null
                  const tierName = (cell && chainMeta) ? chainMeta.tierNames[cell.tier - 1] : ""

                  return (
                    <div
                      key={cell ? cell.id : `empty-${idx}`}
                      onClick={() => handleCellClick(idx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx)}
                      draggable={!!cell}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      className={isJustMerged ? "animate-merge-pop" : ""}
                      style={{
                        aspectRatio: "1 / 1",
                        maxHeight: gridDim >= 6 ? "54px" : gridDim === 5 ? "66px" : "80px",
                        maxWidth: gridDim >= 6 ? "54px" : gridDim === 5 ? "66px" : "80px",
                        borderRadius: gridDim >= 6 ? "6px" : "8px",
                        backgroundColor: cell
                          ? chainMeta?.bg || "rgba(255,255,255,0.05)"
                          : "rgba(255, 255, 255, 0.65)",
                        border: isSelected
                          ? "2px solid #F59E0B"
                          : cell
                          ? `1.5px solid ${chainMeta?.border || "var(--border-hairline)"}`
                          : "1.5px dashed rgba(148, 163, 184, 0.4)",
                        boxShadow: isSelected
                          ? "0 0 16px rgba(245, 158, 11, 0.4)"
                          : cell
                          ? `inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 1px 4px rgba(15, 23, 42, 0.05)`
                          : "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: gridDim >= 6 ? "3px 2px" : gridDim === 5 ? "4px 3px" : "6px 5px",
                        cursor: cell ? "grab" : "default",
                        userSelect: "none",
                        position: "relative",
                        transition: "transform 140ms ease, box-shadow 140ms ease, border 140ms ease",
                        transform: isSelected ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      {cell ? (
                        <>
                          {/* Top: Tier badge & optional Star dots */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                            <span
                              style={{
                                fontSize: gridDim >= 6 ? "7.5px" : "8.5px",
                                fontWeight: 800,
                                padding: "1px 3px",
                                borderRadius: "3px",
                                backgroundColor: chainMeta?.color,
                                color: "#000",
                                lineHeight: 1,
                              }}
                            >
                              T{cell.tier}
                            </span>
                            {/* Dots for Tier (only show on 4x4 or 5x5) */}
                            {gridDim < 6 && (
                              <div style={{ display: "flex", gap: "2px" }}>
                                {[...Array(cell.tier)].map((_, dotIdx) => (
                                  <div
                                    key={dotIdx}
                                    style={{
                                      width: "3px",
                                      height: "3px",
                                      borderRadius: "50%",
                                      backgroundColor: chainMeta?.color,
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Center Tactile 2.5D Asset Thumbnail with Tier Overlay */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "1px 0",
                              position: "relative",
                            }}
                          >
                            <img
                              src={chainMeta?.assetPath}
                              alt={tierName}
                              style={{
                                width: gridDim >= 6 ? "22px" : gridDim === 5 ? "28px" : "36px",
                                height: gridDim >= 6 ? "22px" : gridDim === 5 ? "28px" : "36px",
                                borderRadius: "4px",
                                objectFit: "contain",
                                filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.4))`,
                                transition: "transform 140ms ease",
                              }}
                            />
                            <div
                              className="font-mono"
                              style={{
                                position: "absolute",
                                bottom: "-2px",
                                right: "-2px",
                                padding: "0 2px",
                                borderRadius: "2px",
                                backgroundColor: chainMeta?.color,
                                color: "#000",
                                fontSize: gridDim >= 6 ? "7px" : "8px",
                                fontWeight: 900,
                                lineHeight: 1,
                              }}
                            >
                              T{cell.tier}
                            </div>
                          </div>

                          {/* Bottom Name */}
                          <div
                            style={{
                              fontSize: gridDim >= 6 ? "7.5px" : gridDim === 5 ? "8.5px" : "9.5px",
                              fontWeight: 700,
                              color: "var(--text-bright)",
                              textAlign: "center",
                              lineHeight: 1.1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              width: "100%",
                            }}
                          >
                            {tierName}
                          </div>
                        </>
                      ) : (
                        <div
                          style={{
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-muted)",
                            fontSize: gridDim >= 6 ? "8.5px" : "10px",
                            fontFamily: "monospace",
                            opacity: 0.5,
                          }}
                        >
                          +{idx + 1}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* SYNTHESIZER CONTROLS & INSPECTOR */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* SPAWNER CARD */}
              <div
                className="room-card"
                style={{
                  padding: "12px 14px",
                  backgroundColor: "var(--surface-raised)",
                  border: "1px solid var(--border-hairline)",
                }}
              >
                <div style={{ fontSize: "11.5px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-bright)", marginBottom: "8px" }}>
                  Synthesize Tier 1 Feature
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: 1.4 }}>
                  Costs <span className="font-mono" style={{ color: "var(--color-positive)", fontWeight: 700 }}>$15</span> compute. Merge two identical features to upgrade tier.
                </div>

                {/* Chain Selector Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
                  {(["random", "intelligence", "infrastructure", "security"] as const).map((chain) => {
                    const isPicked = spawnChain === chain
                    return (
                      <button
                        key={chain}
                        onClick={() => setSpawnChain(chain)}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "6px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          textTransform: "capitalize",
                          border: isPicked
                            ? "1.5px solid var(--accent-expansion)"
                            : "1px solid var(--border-hairline)",
                          backgroundColor: isPicked
                            ? "rgba(217, 119, 6, 0.15)"
                            : "var(--surface-work)",
                          color: isPicked ? "var(--accent-expansion)" : "var(--text-muted)",
                          cursor: "pointer",
                        }}
                      >
                        {chain}
                      </button>
                    )
                  })}
                </div>

                {/* Spawn Button */}
                <button
                  onClick={handleSpawn}
                  disabled={!canSpawn}
                  className={`cred-3d-button ${canSpawn ? "cred-3d-button-amber" : "cred-3d-button-disabled"}`}
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "12px",
                    gap: "8px",
                  }}
                >
                  <span>Synthesize Feature ($15)</span>
                  <kbd className="btn-kbd" style={{ background: "rgba(255,255,255,0.25)", color: "#000" }}>Space</kbd>
                </button>
              </div>

              {/* INSPECTOR & RECYCLE CARD */}
              <div
                className="room-card"
                style={{
                  padding: "16px",
                  backgroundColor: "var(--surface-raised)",
                  border: "1px solid var(--border-hairline)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Selected Module Slot
                </div>

                {selectedCellIndex !== null && grid[selectedCellIndex] ? (
                  (() => {
                    const item = grid[selectedCellIndex]!
                    const meta = CHAIN_META[item.chain] || CHAIN_META.intelligence
                    const name = meta.tierNames[item.tier - 1]
                    return (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: meta.color,
                              color: "#000",
                            }}
                          >
                            T{item.tier}
                          </span>
                          <span style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--text-bright)" }}>
                            {name}
                          </span>
                        </div>

                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                          Chain: <span style={{ color: meta.color, fontWeight: 700, textTransform: "capitalize" }}>{item.chain}</span> · Slot #{selectedCellIndex + 1}
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleDiscard(selectedCellIndex)}
                            className="cred-3d-button cred-3d-button-danger"
                            style={{
                              flex: 1,
                              padding: "8px 10px",
                              fontSize: "11px",
                              gap: "6px",
                            }}
                          >
                            <span>Discard (Del)</span>
                          </button>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "10px 0" }}>
                    Click an item on the board to inspect, merge, or discard.
                  </div>
                )}
              </div>

              {/* FLEET ADD-ON SLOTS CARD (Integrated into Right Drawer) */}
              {accounts.length > 0 && (
                <div
                  className="room-card"
                  style={{
                    padding: "10px 12px",
                    backgroundColor: "var(--surface-raised)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: "10px",
                    maxHeight: "140px",
                    overflowY: "auto",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-bright)" }}>
                      Account Add-on Capacity ({accounts.length})
                    </span>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                      Max {MAX_ADDON_SLOTS} slots/acc
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {accounts.map((acc) => {
                      const slotsUsed = acc.addonSlotsUsed ?? 0
                      const slotsAvailable = MAX_ADDON_SLOTS - slotsUsed
                      const currentArr = Math.round(((acc.baseMrrCents + acc.addonMrrCents) * 12) / 100)

                      return (
                        <div
                          key={acc.id}
                          style={{
                            padding: "6px 8px",
                            borderRadius: "6px",
                            backgroundColor: "var(--surface-work)",
                            border: "1px solid var(--border-hairline)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-bright)" }}>
                              {acc.name}
                            </div>
                            <div style={{ fontSize: "9.5px", color: "var(--text-muted)" }}>
                              ${currentArr.toLocaleString()}/yr · {Math.round(acc.health)}% HP
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            {[...Array(MAX_ADDON_SLOTS)].map((_, i) => (
                              <div
                                key={i}
                                style={{
                                  width: "12px",
                                  height: "5px",
                                  borderRadius: "2px",
                                  backgroundColor: i < slotsUsed ? "var(--accent-expansion)" : "rgba(0,0,0,0.12)",
                                  border: i < slotsUsed ? "none" : "1px solid var(--border-subtle)",
                                }}
                                title={`Slot ${i + 1}: ${i < slotsUsed ? "Active" : "Available"}`}
                              />
                            ))}
                            <span
                              style={{
                                fontSize: "8.5px",
                                fontWeight: 800,
                                marginLeft: "4px",
                                color: slotsAvailable > 0 ? "var(--color-positive)" : "var(--text-muted)",
                              }}
                            >
                              {slotsAvailable > 0 ? `${slotsAvailable} Open` : "Full"}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  )
}
