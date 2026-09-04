import React, { useRef, useEffect, useState, useCallback } from 'react';
import { calcRoomViewport, setupCanvasBackingStore, clientToLogical, LOGICAL_ROOM_SIZE, type RoomViewport } from './viewport';

interface CanvasContainerProps {
  onRender: (ctx: CanvasRenderingContext2D, viewport: RoomViewport, timestamp: number) => void;
  onPointerDown?: (coords: { x: number; y: number }, e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove?: (coords: { x: number; y: number }, e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp?: (coords: { x: number; y: number }, e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerCancel?: (coords: { x: number; y: number }, e: React.PointerEvent<HTMLCanvasElement>) => void;
  className?: string;
  children?: React.ReactNode;
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({
  onRender,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  className = '',
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<RoomViewport>({
    cssWidth: 400,
    cssHeight: 400,
    dpr: 1,
    logicalWidth: LOGICAL_ROOM_SIZE,
    logicalHeight: LOGICAL_ROOM_SIZE,
    scale: 0.4,
    offsetX: 0,
    offsetY: 0,
  });

  // Measured container measurement via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const newVp = calcRoomViewport(width, height);
          setViewport(newVp);
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // requestAnimationFrame continuous render loop
  useEffect(() => {
    let animId: number;

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (canvas && viewport.cssWidth > 0 && viewport.cssHeight > 0) {
        const ctx = setupCanvasBackingStore(canvas, viewport);
        if (ctx) {
          // Clear logical room area
          ctx.clearRect(0, 0, LOGICAL_ROOM_SIZE, LOGICAL_ROOM_SIZE);
          onRender(ctx, viewport, time);
          ctx.restore();
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [onRender, viewport]);

  const getLogicalCoords = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, isInside: false };
      const rect = canvas.getBoundingClientRect();
      return clientToLogical(e.clientX, e.clientY, rect, viewport);
    },
    [viewport]
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden touch-none select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${viewport.cssWidth}px`,
          height: `${viewport.cssHeight}px`,
          touchAction: 'none',
        }}
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
          onPointerDown?.(getLogicalCoords(e), e);
        }}
        onPointerMove={(e) => onPointerMove?.(getLogicalCoords(e), e)}
        onPointerUp={(e) => {
          try {
            e.currentTarget.releasePointerCapture(e.pointerId);
          } catch {}
          onPointerUp?.(getLogicalCoords(e), e);
        }}
        onPointerCancel={(e) => {
          try {
            e.currentTarget.releasePointerCapture(e.pointerId);
          } catch {}
          onPointerCancel?.(getLogicalCoords(e), e);
        }}
        className="block cursor-crosshair active:cursor-grabbing"
      />
      {children}
    </div>
  );
};
