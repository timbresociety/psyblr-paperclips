/**
 * Canvas Viewport & Coordinate Projection System
 * Product Truth: company_sim_v1/product_final.md Section 28.3
 * Implementation Contract: company_sim_v1/AGENTS.md Section 29.2, 29.3
 *
 * All simulation coordinates are logical (0..1000 x 0..1000).
 * Resize, zoom, orientation, or DPR changes must NEVER alter simulation coordinates.
 */

export interface RoomViewport {
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  logicalWidth: number;
  logicalHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const LOGICAL_ROOM_SIZE = 1000;

export function calcRoomViewport(
  cssWidth: number,
  cssHeight: number,
  dprCap: number = 2
): RoomViewport {
  const dpr = typeof window !== 'undefined'
    ? Math.min(window.devicePixelRatio || 1, dprCap)
    : 1;

  const logicalWidth = LOGICAL_ROOM_SIZE;
  const logicalHeight = LOGICAL_ROOM_SIZE;

  // Fit logical square with aspect ratio preservation
  const scale = Math.min(cssWidth / logicalWidth, cssHeight / logicalHeight);
  const offsetX = (cssWidth - logicalWidth * scale) / 2;
  const offsetY = (cssHeight - logicalHeight * scale) / 2;

  return {
    cssWidth,
    cssHeight,
    dpr,
    logicalWidth,
    logicalHeight,
    scale: scale > 0 ? scale : 1,
    offsetX,
    offsetY,
  };
}

export function clientToLogical(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  viewport: RoomViewport
): { x: number; y: number; isInside: boolean } {
  const containerX = clientX - rect.left;
  const containerY = clientY - rect.top;

  const rawX = (containerX - viewport.offsetX) / viewport.scale;
  const rawY = (containerY - viewport.offsetY) / viewport.scale;

  const isInside =
    rawX >= 0 &&
    rawX <= viewport.logicalWidth &&
    rawY >= 0 &&
    rawY <= viewport.logicalHeight;

  return {
    x: Math.max(0, Math.min(viewport.logicalWidth, rawX)),
    y: Math.max(0, Math.min(viewport.logicalHeight, rawY)),
    isInside,
  };
}

export function setupCanvasBackingStore(
  canvas: HTMLCanvasElement,
  viewport: RoomViewport
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const targetWidth = Math.round(viewport.cssWidth * viewport.dpr);
  const targetHeight = Math.round(viewport.cssHeight * viewport.dpr);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  // 1. Reset transform to identity and clear the ENTIRE physical canvas buffer
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 2. Scale to device pixel ratio
  ctx.scale(viewport.dpr, viewport.dpr);

  // 3. Fill canvas background with sleek matte obsidian so letterbox is seamless
  ctx.fillStyle = '#111113';
  ctx.fillRect(0, 0, viewport.cssWidth, viewport.cssHeight);

  // 4. Apply logical-to-CSS projection
  ctx.translate(viewport.offsetX, viewport.offsetY);
  ctx.scale(viewport.scale, viewport.scale);

  // 5. Save context and clip strictly to logical room boundary (0..1000)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, LOGICAL_ROOM_SIZE, LOGICAL_ROOM_SIZE);
  ctx.clip();

  return ctx;
}
