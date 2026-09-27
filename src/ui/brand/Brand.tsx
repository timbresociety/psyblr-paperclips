import React from 'react'

/**
 * STRUCTURE + SPARK — the SoloUnicorn brand marks, rebuilt as inline SVG so
 * they tint per-tier, scale crisply, and animate. Structure is the hexagonal
 * cube monogram with the Spark carved in its negative-space core; Spark is the
 * standalone four-point concave star used as reward-salience punctuation.
 * Reference: public/references/structure-monogram-primary.png + spark family.
 */

/** Four-point concave star (the Spark). Fills with currentColor. */
export function Spark({
  size = 16,
  className,
  style,
  title,
}: {
  size?: number
  className?: string
  style?: React.CSSProperties
  title?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Sharp points N/E/S/W, sides curving inward toward center. */}
      <path
        d="M50 2 C 54 40 60 46 98 50 C 60 54 54 60 50 98 C 46 60 40 54 2 50 C 40 46 46 40 50 2 Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Hexagonal cube monogram with the Spark cut from its core (the Structure mark). */
export function StructureMark({
  size = 28,
  className,
  style,
  title = 'SoloUnicorn',
}: {
  size?: number
  className?: string
  style?: React.CSSProperties
  title?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      role="img"
      aria-label={title}
    >
      <defs>
        <clipPath id="structure-hex">
          <path d="M50 3 L92 27 L92 73 L50 97 L8 73 L8 27 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#structure-hex)">
        {/* Hex body */}
        <path d="M50 3 L92 27 L92 73 L50 97 L8 73 L8 27 Z" fill="currentColor" />
        {/* Cube facet lines — concave curves reading as a 3D box, cut in the ground color */}
        <g fill="none" stroke="var(--brand-cut, #0B0E12)" strokeWidth="6.5" strokeLinecap="round">
          {/* upper three seams meeting at the core */}
          <path d="M50 3 Q 50 34 50 46" />
          <path d="M8 27 Q 38 40 46 48" />
          <path d="M92 27 Q 62 40 54 48" />
          {/* lower three seams from the core */}
          <path d="M50 54 Q 50 76 50 97" />
          <path d="M46 52 Q 30 64 8 73" />
          <path d="M54 52 Q 70 64 92 73" />
        </g>
        {/* Spark core, cut out so the ground shows through its center */}
        <path
          d="M50 30 C 52 46 54 48 70 50 C 54 52 52 54 50 70 C 48 54 46 52 30 50 C 46 48 48 46 50 30 Z"
          fill="var(--brand-cut, #0B0E12)"
        />
      </g>
    </svg>
  )
}

/** Full lockup: Structure mark + chrome wordmark + tier line. */
export function BrandLockup({
  tier,
  quarter,
}: {
  tier: string
  quarter: number
}) {
  return (
    <div className="brand-lockup">
      <StructureMark size={30} className="brand-structure" />
      <div className="brand-words">
        <span className="brand-wordmark">SOLO<span className="brand-wordmark-spark">UNICORN</span></span>
        <span className="brand-tier font-mono">
          {tier} · Q{quarter}
        </span>
      </div>
    </div>
  )
}
