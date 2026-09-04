import React, { useEffect, useState } from 'react';

export interface Particle {
  id: string;
  text: string;
  x: number;
  y: number;
  color?: string;
}

let particleListener: ((p: Particle) => void) | null = null;

export function emitFloatingParticle(text: string, x: number, y: number, color?: string) {
  if (particleListener) {
    particleListener({
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text,
      x,
      y,
      color: color || '#64d2ff'
    });
  }
}

export const FloatingParticlesContainer: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    particleListener = (newParticle) => {
      setParticles((prev) => [...prev.slice(-25), newParticle]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
      }, 1100);
    };

    return () => {
      particleListener = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute font-mono text-xs font-bold tracking-tight select-none animate-float-up pointer-events-none drop-shadow-md"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            color: p.color
          }}
        >
          {p.text}
        </div>
      ))}
    </div>
  );
};
