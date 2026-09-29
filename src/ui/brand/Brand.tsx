import React from 'react'

/**
 * STRUCTURE + SPARK — the SoloUnicorn brand marks.
 *
 * These render the OWNER'S actual monogram art (public/references/
 * structure-monogram-primary.png and the cropped spark-mark.png) as CSS masks.
 * The shape is never redrawn — only color and texture are themeable, applied
 * via the mask's background. Do not replace these with hand-drawn geometry.
 */

const MONO_URL = '/references/structure-monogram-primary.png'
const SPARK_URL = '/references/spark-mark.png'

/** Four-point Spark (secondary mark). Tints with the given color/gradient. */
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
    <span
      className={`spark-mark ${className ?? ''}`}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        WebkitMaskImage: `url(${SPARK_URL})`,
        maskImage: `url(${SPARK_URL})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        ...style,
      }}
    />
  )
}

/** The Structure monogram (primary mark). Shape from the owner's art; tintable. */
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
    <span
      className={`structure-mark ${className ?? ''}`}
      role="img"
      aria-label={title}
      style={{
        display: 'inline-block',
        width: size,
        height: size * (451 / 400), // preserve the monogram's aspect ratio
        WebkitMaskImage: `url(${MONO_URL})`,
        maskImage: `url(${MONO_URL})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        ...style,
      }}
    />
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
      <StructureMark size={28} className="brand-structure" />
      <div className="brand-words">
        <span className="brand-wordmark">SOLO<span className="brand-wordmark-spark">UNICORN</span></span>
        <span className="brand-tier font-mono">
          {tier} · Q{quarter}
        </span>
      </div>
    </div>
  )
}
