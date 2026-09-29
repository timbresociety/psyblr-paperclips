import { describe, it, expect } from 'vitest'
import { gridToScreen, screenToGrid, depthOf, TILE_W, TILE_H } from '../ui/hq/iso'

describe('iso projection', () => {
  it('projects the origin to 0,0', () => {
    expect(gridToScreen(0, 0)).toEqual({ x: 0, y: 0 })
  })

  it('projects one column right to a half-tile east-down step', () => {
    expect(gridToScreen(1, 0)).toEqual({ x: TILE_W / 2, y: TILE_H / 2 })
  })

  it('projects one row down to a half-tile west-down step', () => {
    expect(gridToScreen(0, 1)).toEqual({ x: -TILE_W / 2, y: TILE_H / 2 })
  })

  it('round-trips fractional grid coordinates', () => {
    const cases = [
      [0, 0], [1, 2], [3.5, 0.25], [2, 3.2], [0.8, 0.8],
    ] as const
    for (const [col, row] of cases) {
      const p = gridToScreen(col, row)
      const g = screenToGrid(p.x, p.y)
      expect(g.col).toBeCloseTo(col, 10)
      expect(g.row).toBeCloseTo(row, 10)
    }
  })

  it('orders depth front-to-back by col+row', () => {
    expect(depthOf(2, 3)).toBeGreaterThan(depthOf(2, 0))
    expect(depthOf(0, 0)).toBeLessThan(depthOf(0.5, 0.5))
  })
})
