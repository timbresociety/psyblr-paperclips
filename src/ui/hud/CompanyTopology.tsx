import React, { useState } from 'react'
import type { GameState } from '../../engine/types'
import type { GameAction } from '../../engine/actions'
import { sound } from '../../audio/soundEngine'

interface CompanyTopologyProps {
  state: GameState
  dispatch?: React.Dispatch<GameAction>
}

interface NodeCoord {
  id: 'demand' | 'product' | 'monetisation' | 'expansion' | 'operations' | 'retention'
  code: string
  label: string
  x: number
  y: number
  color: string
}

const NODES: NodeCoord[] = [
  { id: 'demand', code: 'DEM', label: 'Demand', x: 44, y: 34, color: '#38BDF8' },
  { id: 'product', code: 'PRD', label: 'Product', x: 130, y: 18, color: '#10B981' },
  { id: 'monetisation', code: 'MON', label: 'Monetise', x: 216, y: 34, color: '#F59E0B' },
  { id: 'expansion', code: 'EXP', label: 'Expansion', x: 216, y: 104, color: '#A855F7' },
  { id: 'operations', code: 'OPS', label: 'Operations', x: 130, y: 118, color: '#64748B' },
  { id: 'retention', code: 'RET', label: 'Retention', x: 44, y: 104, color: '#EC4899' },
]

const CENTER = { x: 130, y: 68 }

export const CompanyTopology: React.FC<CompanyTopologyProps> = ({ state, dispatch }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const handleNodeClick = (fnId: NodeCoord['id']) => {
    sound.playClick()
    if (dispatch) {
      dispatch({ type: 'attention.switch', functionId: fnId })
    }
  }

  // Calculate overall swarm automation percentage
  const automatedCount = Object.values(state.fleet).filter(f => f.automateRank > 0).length
  const totalUnits = Object.values(state.fleet).reduce((acc, f) => acc + f.onlineUnits, 0)

  return (
    <div
      className="company-rail-topology"
      style={{
        width: '100%',
        padding: '6px 0 10px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '148px',
          position: 'relative',
          borderRadius: '12px',
          background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.85) 100%)',
          border: '1px solid var(--border-hairline)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.02), 0 2px 8px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox="0 0 260 140"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            {/* Soft Radial Ambient Glow */}
            <radialGradient id="topologyGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#0EA5E9" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
            </radialGradient>

            {/* Pulsing Core Gradient */}
            <radialGradient id="founderCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </radialGradient>

            {/* Glowing filter */}
            <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Ambient center spotlight */}
          <ellipse cx={CENTER.x} cy={CENTER.y} rx="90" ry="50" fill="url(#topologyGlow)" />

          {/* Isometric Perspective Grid Planes */}
          <ellipse
            cx={CENTER.x}
            cy={CENTER.y}
            rx="86"
            ry="46"
            fill="none"
            stroke="rgba(148, 163, 184, 0.22)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <ellipse
            cx={CENTER.x}
            cy={CENTER.y}
            rx="54"
            ry="28"
            fill="none"
            stroke="rgba(148, 163, 184, 0.28)"
            strokeWidth="0.8"
          />

          {/* Perimeter Constellation Links (DEM -> PRD -> MON -> EXP -> OPS -> RET -> DEM) */}
          <polygon
            points={NODES.map(n => `${n.x},${n.y}`).join(' ')}
            fill="rgba(56, 189, 248, 0.02)"
            stroke="rgba(14, 165, 233, 0.25)"
            strokeWidth="1.2"
          />

          {/* Center-to-Node Spokes */}
          {NODES.map(node => {
            const isActiveRoom = state.activeFunction === node.id
            return (
              <line
                key={`spoke-${node.id}`}
                x1={CENTER.x}
                y1={CENTER.y}
                x2={node.x}
                y2={node.y}
                stroke={isActiveRoom ? 'rgba(14, 165, 233, 0.65)' : 'rgba(148, 163, 184, 0.35)'}
                strokeWidth={isActiveRoom ? '1.5' : '1'}
                strokeDasharray={isActiveRoom ? undefined : '2 2'}
              />
            )
          })}

          {/* Animated data flow pulses on perimeter */}
          <circle r="2" fill="#0EA5E9" opacity="0.8">
            <animateMotion
              path={`M ${NODES[0].x} ${NODES[0].y} L ${NODES[1].x} ${NODES[1].y} L ${NODES[2].x} ${NODES[2].y} L ${NODES[3].x} ${NODES[3].y} L ${NODES[4].x} ${NODES[4].y} L ${NODES[5].x} ${NODES[5].y} Z`}
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="1.8" fill="#10B981" opacity="0.7">
            <animateMotion
              path={`M ${NODES[3].x} ${NODES[3].y} L ${NODES[4].x} ${NODES[4].y} L ${NODES[5].x} ${NODES[5].y} L ${NODES[0].x} ${NODES[0].y} L ${NODES[1].x} ${NODES[1].y} L ${NODES[2].x} ${NODES[2].y} Z`}
              dur="8s"
              repeatCount="indefinite"
            />
          </circle>

          {/* 6 Peripheral Department Nodes */}
          {NODES.map(node => {
            const isActiveRoom = state.activeFunction === node.id
            const isHovered = hoveredNode === node.id
            const fleet = state.fleet[node.id]
            const isAutomated = fleet.automateRank > 0

            return (
              <g
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node Active Aura */}
                {isActiveRoom && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="15"
                    fill="rgba(14, 165, 233, 0.12)"
                    stroke="rgba(14, 165, 233, 0.4)"
                    strokeWidth="1"
                  >
                    <animate
                      attributeName="r"
                      values="13;17;13"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.4;0.9;0.4"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Node Outer Disc */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? '11' : '9.5'}
                  fill="#FFFFFF"
                  stroke={isActiveRoom ? '#0284C7' : isHovered ? '#64748B' : 'rgba(203, 213, 225, 0.9)'}
                  strokeWidth={isActiveRoom ? '2' : '1.5'}
                  filter="url(#nodeShadow)"
                  style={{ transition: 'all 120ms ease' }}
                />

                {/* Inner Automation Status Dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="3.5"
                  fill={isAutomated ? '#10B981' : isActiveRoom ? '#0284C7' : '#94A3B8'}
                />

                {/* Department Code Label */}
                <text
                  x={node.x}
                  y={node.y > CENTER.y ? node.y + 16 : node.y - 12}
                  textAnchor="middle"
                  fill={isActiveRoom ? 'var(--text-ink)' : 'var(--text-secondary)'}
                  fontSize="8.5px"
                  fontFamily="var(--font-mono)"
                  fontWeight={isActiveRoom ? '800' : '700'}
                  letterSpacing="0.06em"
                >
                  {node.code}
                </text>
              </g>
            )
          })}

          {/* Central Founder Hub Node */}
          <g style={{ cursor: 'default' }}>
            {/* Outer Ring */}
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="18"
              fill="#FFFFFF"
              stroke="rgba(14, 165, 233, 0.4)"
              strokeWidth="1.5"
              filter="url(#nodeShadow)"
            />
            {/* Glowing Core */}
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="11"
              fill="url(#founderCore)"
            />
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="4"
              fill="#FFFFFF"
              opacity="0.9"
            />
            {/* Founder Label Badge */}
            <rect
              x={CENTER.x - 32}
              y={CENTER.y + 14}
              width="64"
              height="14"
              rx="7"
              fill="#0F172A"
            />
            <text
              x={CENTER.x}
              y={CENTER.y + 24}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="7.5px"
              fontFamily="var(--font-mono)"
              fontWeight="800"
              letterSpacing="0.08em"
            >
              1 FOUNDER
            </text>
          </g>
        </svg>

        {/* Quick status telemetry pill at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '8px',
            right: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        >
          <span>SWARM: {totalUnits} UNITS</span>
          <span style={{ color: automatedCount > 0 ? '#10B981' : 'var(--text-muted)' }}>
            {automatedCount}/6 AUTO
          </span>
        </div>
      </div>
    </div>
  )
}
