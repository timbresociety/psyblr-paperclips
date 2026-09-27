import React, { useState } from 'react'
import type { GameState, FunctionId } from '../../engine/types'
import { getActiveEvolutionTier } from '../../engine/formulas'
import { gridToScreen, depthOf } from './iso'
import { tierIndexOf } from './tierIndex'
import { NonFinalAsset } from '../juice/NonFinalAsset'
import { computeQueueBadges } from './queueMetrics'
import { sound } from '../../audio/soundEngine'
import './hq.css'

interface HQSceneProps {
  state: GameState
  onEnterRoom: (fn: FunctionId) => void
}

interface DeskDef {
  id: FunctionId
  name: string
  icon: string
  accent: string
  col: number
  row: number
}

const DESKS: DeskDef[] = [
  { id: 'product', name: 'Product', icon: '/assets/2.5d/nav_product.png', accent: '#58D9FF', col: 2, row: 0 },
  { id: 'demand', name: 'Demand', icon: '/assets/2.5d/nav_demand.png', accent: '#FF5C9A', col: 0.7, row: 0.7 },
  { id: 'monetisation', name: 'Monetisation', icon: '/assets/2.5d/nav_monetise.png', accent: '#FFC857', col: 3.3, row: 0.7 },
  { id: 'finance', name: 'Finance', icon: '/assets/2.5d/nav_finance.png', accent: '#38BDF8', col: 2, row: 1.55 },
  { id: 'retention', name: 'Retention', icon: '/assets/2.5d/nav_retention.png', accent: '#6F8CFF', col: 0.7, row: 2.4 },
  { id: 'expansion', name: 'Expansion', icon: '/assets/2.5d/nav_expansion.png', accent: '#A778FF', col: 3.3, row: 2.4 },
  { id: 'operations', name: 'Operations', icon: '/assets/2.5d/nav_operations.png', accent: '#B5F35A', col: 2, row: 3.1 },
]

// Depth order is static — sort once at module scope.
const SORTED_DESKS = [...DESKS].sort((a, b) => depthOf(a.col, a.row) - depthOf(b.col, b.row))

/** Image with a procedural fallback so a missing render never shows broken. */
function SpriteImg({
  src,
  className,
  alt,
  fallback,
  style,
}: {
  src: string
  className: string
  alt: string
  fallback?: React.ReactNode
  style?: React.CSSProperties
}) {
  const [failed, setFailed] = useState(false)
  if (failed) return <>{fallback ?? null}</>
  return <img src={src} className={className} style={style} alt={alt} draggable={false} onError={() => setFailed(true)} />
}

export const HQScene: React.FC<HQSceneProps> = ({ state, onEnterRoom }) => {
  const tierInfo = getActiveEvolutionTier(state)
  const tierN = tierIndexOf(tierInfo.tier) + 1
  // state identity changes every tick, so memoization would never hit — compute directly.
  const badges = computeQueueBadges(state)

  const deskBaseSrc = `/assets/hq/desk_base_t${tierN}.png`
  const backdropSrc = `/assets/tiers/backdrop_${tierInfo.tier}.png`

  const active = DESKS.find(d => d.id === state.activeFunction) ?? DESKS[0]
  const founderPos = gridToScreen(active.col, active.row)

  return (
    <div className="hq-scene" data-testid="hq-scene">
      <div className="hq-backdrop" style={{ backgroundImage: `url(${backdropSrc}), var(--bg-canvas)` }} />

      <div className="hq-floor">
        <div className="hq-stage">
          {SORTED_DESKS.map(desk => {
            const p = gridToScreen(desk.col, desk.row)
            const fleet = state.fleet[desk.id as keyof typeof state.fleet]
            const isAutomated = Boolean(fleet && fleet.automateRank > 0 && desk.id !== 'finance')
            const agentCount = isAutomated ? Math.min(3, Math.max(1, fleet.onlineUnits)) : 0
            const badge = desk.id !== 'finance' ? badges[desk.id as Exclude<FunctionId, 'finance'>] : undefined
            const isActive = state.activeFunction === desk.id
            const locked = !(state.unlockedFunctions || []).includes(desk.id) && desk.id !== 'finance'

            return (
              <div
                key={desk.id}
                className="hq-desk"
                data-testid={`hq-desk-${desk.id}`}
                style={{
                  left: p.x,
                  top: p.y,
                  zIndex: Math.round(depthOf(desk.col, desk.row) * 10),
                  ['--hq-accent' as string]: desk.accent,
                  opacity: locked ? 0.45 : 1,
                }}
                onClick={() => {
                  sound.playClick()
                  onEnterRoom(desk.id)
                }}
                title={`${desk.name} — enter desk`}
              >
                <SpriteImg
                  src={deskBaseSrc}
                  className="hq-desk-base"
                  alt=""
                  fallback={<div className="hq-desk-platform" />}
                />
                <SpriteImg
                  src={desk.icon}
                  className="hq-desk-icon"
                  alt={desk.name}
                  fallback={<NonFinalAsset label={desk.name} size={72} accent={desk.accent} />}
                />

                {agentCount > 0 &&
                  Array.from({ length: agentCount }).map((_, i) => (
                    <SpriteImg
                      key={i}
                      src="/assets/hq/agent_drone.png"
                      className="hq-agent"
                      alt=""
                      fallback={null}
                    />
                  ))}

                <div className="hq-desk-label" style={{ borderColor: isActive ? desk.accent : undefined }}>
                  <span className="hq-desk-name" style={{ color: isActive ? desk.accent : undefined }}>
                    {desk.name}
                  </span>
                  <span className="hq-desk-status">
                    {isAutomated ? `${fleet.onlineUnits} agents` : desk.id === 'finance' ? 'ledger' : 'manual'}
                  </span>
                  {badge && badge.count > 0 && <span className="hq-badge">{badge.count}</span>}
                </div>
              </div>
            )
          })}

          {/* The founder works exactly one desk at a time (attention model) */}
          <SpriteImg
            src="/assets/hq/founder_figure.png"
            className="hq-founder"
            style={{ left: founderPos.x, top: founderPos.y, zIndex: Math.round(depthOf(active.col, active.row) * 10) + 5 }}
            alt="Founder"
            fallback={null}
          />
        </div>
      </div>

      <div className="hq-tier-plate">
        <span className="hq-tier-name">{tierInfo.name}</span>
        <span className="hq-tier-sub">{tierInfo.subtitle}</span>
      </div>

      <div className="hq-hint">CLICK A DESK TO WORK IT · THE COMPANY KEEPS RUNNING</div>
    </div>
  )
}
