import React from 'react'
import './radar-scope.css'

/**
 * The Demand room's signature instrument — a live radar scope. A sweeping beam
 * rotates over range rings; one blip per active inbound signal sits at a stable
 * angle/radius derived from its id, so the scope reads as "the market being
 * scanned" rather than decoration. Purely presentational.
 */
export function RadarScope({
  signalIds,
  size = 46,
  accent = 'var(--accent-demand)',
}: {
  signalIds: string[]
  size?: number
  accent?: string
}) {
  const blips = signalIds.slice(0, 8).map((id, i) => {
    // stable pseudo-random placement from the id
    let h = 0
    for (let c = 0; c < id.length; c++) h = (h * 31 + id.charCodeAt(c)) >>> 0
    const angle = (h % 360) * (Math.PI / 180)
    const radius = 0.28 + ((h >> 9) % 100) / 100 * 0.55
    const cx = 50 + Math.cos(angle) * radius * 46
    const cy = 50 + Math.sin(angle) * radius * 46
    return { id, cx, cy, delay: (i % 4) * 0.4 }
  })

  return (
    <div className="radar-scope" style={{ width: size, height: size, ['--radar-accent' as string]: accent }}>
      <div className="radar-rings" />
      <div className="radar-cross" />
      <div className="radar-sweep" />
      {blips.map(b => (
        <span
          key={b.id}
          className="radar-blip"
          style={{ left: `${b.cx}%`, top: `${b.cy}%`, animationDelay: `${b.delay}s` }}
        />
      ))}
    </div>
  )
}
