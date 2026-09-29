/**
 * 2:1 isometric projection helpers for the Company HQ scene.
 * Grid space: fractional (col, row) tiles. Screen space: px offsets from the
 * scene's origin (top-center of the floor diamond).
 */
export const TILE_W = 220
export const TILE_H = 110

export interface IsoPoint {
  x: number
  y: number
}

/** Project grid coords to screen px (origin at grid 0,0; +x right, +y down). */
export function gridToScreen(col: number, row: number): IsoPoint {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  }
}

/** Inverse projection (screen px back to fractional grid coords). */
export function screenToGrid(x: number, y: number): { col: number; row: number } {
  return {
    col: (x / (TILE_W / 2) + y / (TILE_H / 2)) / 2,
    row: (y / (TILE_H / 2) - x / (TILE_W / 2)) / 2,
  }
}

/** Depth sort key: larger = closer to viewer (drawn later / on top). */
export function depthOf(col: number, row: number): number {
  return col + row
}
