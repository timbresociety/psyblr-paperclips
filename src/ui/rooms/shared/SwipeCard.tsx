import React, { useCallback, useEffect, useRef, useState } from 'react'

export interface SwipeCardProps {
  children: React.ReactNode
  /** Committed left (reject). */
  onLeft: () => void
  /** Committed right (qualify / accept). */
  onRight: () => void
  /** Optional committed up (hyper / boosted accept). */
  onUp?: () => void
  /** Right/up commits blocked (e.g. unaffordable) — still calls the handler so it can explain, but without the flyout. */
  rightBlocked?: boolean
  upBlocked?: boolean
  disabled?: boolean
  leftLabel?: string
  rightLabel?: string
  upLabel?: string
  accent?: string
}

const COMMIT_PX = 112
const MAX_PULL = 220

/**
 * Resisted-swipe interaction (docs/context/INTERACTIONS.md — Demand verb):
 * physical intention → resistance → commitment threshold → trajectory.
 * Pointer-captured, cancel/resize-safe; drags starting on buttons are ignored
 * so the accessible controls beneath keep working. Input acceptance never
 * waits on ornament: past threshold, release commits immediately.
 */
export const SwipeCard: React.FC<SwipeCardProps> = ({
  children,
  onLeft,
  onRight,
  onUp,
  rightBlocked,
  upBlocked,
  disabled,
  leftLabel = 'PASS',
  rightLabel = 'QUALIFY',
  upLabel = 'HYPER 2×',
  accent = 'var(--accent-demand)',
}) => {
  const [drag, setDrag] = useState<{ dx: number; dy: number; active: boolean }>({ dx: 0, dy: 0, active: false })
  const [flyout, setFlyout] = useState<'left' | 'right' | 'up' | null>(null)
  const start = useRef<{ x: number; y: number; id: number } | null>(null)
  const elRef = useRef<HTMLDivElement>(null)
  const flyoutTimer = useRef<number | null>(null)
  // Live offset, updated synchronously in pointermove — pointerup reads this,
  // not the React state (which can lag a frame on a fast release and drop the commit).
  const liveDrag = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })

  const reset = useCallback(() => {
    start.current = null
    liveDrag.current = { dx: 0, dy: 0 }
    setDrag({ dx: 0, dy: 0, active: false })
  }, [])

  useEffect(() => {
    const onResize = () => reset()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (flyoutTimer.current !== null) window.clearTimeout(flyoutTimer.current)
    }
  }, [reset])

  const resist = (v: number) => {
    const sign = Math.sign(v)
    const a = Math.abs(v)
    const soft = a <= COMMIT_PX ? a : COMMIT_PX + (a - COMMIT_PX) * 0.45
    return sign * Math.min(soft, MAX_PULL)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || flyout) return
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
    elRef.current?.setPointerCapture(e.pointerId)
    setDrag({ dx: 0, dy: 0, active: true })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!start.current || e.pointerId !== start.current.id) return
    const dx = resist(e.clientX - start.current.x)
    const dy = resist(e.clientY - start.current.y)
    liveDrag.current = { dx, dy }
    setDrag({ dx, dy, active: true })
  }

  const commit = (dir: 'left' | 'right' | 'up') => {
    if (dir === 'right' && rightBlocked) { reset(); onRight(); return }
    if (dir === 'up' && upBlocked) { reset(); onUp?.(); return }
    // Dispatch synchronously at the commitment threshold — the flyout is pure
    // ornament. A deferred dispatch fires stale closures after unmount, races
    // SDR automation, and animates commits the engine's cooldown rejects (#4).
    if (dir === 'left') onLeft()
    else if (dir === 'right') onRight()
    else onUp?.()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reset()
      return
    }
    setFlyout(dir)
    flyoutTimer.current = window.setTimeout(() => {
      flyoutTimer.current = null
      setFlyout(null)
      reset()
    }, 240)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!start.current || e.pointerId !== start.current.id) return
    const { dx, dy } = liveDrag.current
    start.current = null
    if (onUp && dy < -COMMIT_PX && Math.abs(dy) > Math.abs(dx)) commit('up')
    else if (dx > COMMIT_PX) commit('right')
    else if (dx < -COMMIT_PX) commit('left')
    else reset()
  }

  const handlePointerCancel = () => reset()

  const { dx, dy } = drag
  const upIntent = onUp && dy < 0 && Math.abs(dy) > Math.abs(dx)
  const rightP = Math.max(0, Math.min(1, dx / COMMIT_PX))
  const leftP = Math.max(0, Math.min(1, -dx / COMMIT_PX))
  const upP = upIntent ? Math.max(0, Math.min(1, -dy / COMMIT_PX)) : 0
  const rot = (dx / MAX_PULL) * 9

  const flyTransform =
    flyout === 'right' ? 'translateX(640px) rotate(18deg)'
    : flyout === 'left' ? 'translateX(-640px) rotate(-18deg)'
    : flyout === 'up' ? 'translateY(-520px) scale(1.04)'
    : undefined

  return (
    <div
      ref={elRef}
      data-testid="swipe-card"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handlePointerCancel}
      style={{
        position: 'relative',
        touchAction: 'none',
        cursor: drag.active ? 'grabbing' : 'grab',
        transform: flyTransform ?? (drag.active ? `translate(${dx}px, ${upIntent ? dy : 0}px) rotate(${rot}deg)` : undefined),
        transition: drag.active ? 'none' : 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease',
        opacity: flyout ? 0 : 1,
        willChange: 'transform',
        height: '100%',
      }}
    >
      {children}

      {/* Intent labels — stake made visible before commitment */}
      {drag.active && (
        <>
          <div
            style={{
              position: 'absolute', top: 16, left: 14, zIndex: 20, pointerEvents: 'none',
              padding: '5px 12px', borderRadius: 7, transform: 'rotate(-10deg)',
              border: `2.5px solid var(--color-negative)`, color: 'var(--color-negative)',
              fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 15, letterSpacing: '0.1em',
              opacity: leftP, backgroundColor: 'rgba(9, 11, 14, 0.75)',
              boxShadow: leftP >= 1 ? '0 0 22px rgba(255, 107, 114, 0.5)' : 'none',
            }}
          >
            {leftLabel}
          </div>
          <div
            style={{
              position: 'absolute', top: 16, right: 14, zIndex: 20, pointerEvents: 'none',
              padding: '5px 12px', borderRadius: 7, transform: 'rotate(10deg)',
              border: `2.5px solid ${rightBlocked ? 'var(--text-muted)' : 'var(--color-positive)'}`,
              color: rightBlocked ? 'var(--text-muted)' : 'var(--color-positive)',
              fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 15, letterSpacing: '0.1em',
              opacity: rightP, backgroundColor: 'rgba(9, 11, 14, 0.75)',
              boxShadow: rightP >= 1 && !rightBlocked ? '0 0 22px rgba(116, 232, 154, 0.5)' : 'none',
            }}
          >
            {rightBlocked ? 'CANNOT AFFORD' : rightLabel}
          </div>
          {onUp && (
            <div
              style={{
                position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none',
                padding: '5px 12px', borderRadius: 7,
                border: `2.5px solid ${upBlocked ? 'var(--text-muted)' : accent}`,
                color: upBlocked ? 'var(--text-muted)' : accent,
                fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 13, letterSpacing: '0.1em',
                opacity: upP, backgroundColor: 'rgba(9, 11, 14, 0.75)',
                boxShadow: upP >= 1 && !upBlocked ? `0 0 22px ${accent}` : 'none',
              }}
            >
              {upBlocked ? 'CANNOT AFFORD' : upLabel}
            </div>
          )}
        </>
      )}
    </div>
  )
}
