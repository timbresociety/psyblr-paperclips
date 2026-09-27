import React from 'react'

/**
 * Visibly-non-final asset treatment.
 *
 * Wraps any semantic-asset slot whose catalog entry has no installed generated
 * final yet. Per docs/ASSET_CATALOG.md and docs/context/TASTE_AND_GAME_SENSE.md,
 * a missing final must never be silently papered over with emoji or stock
 * icons — it renders as an honest dev fixture until the pipeline installs it.
 */
export function NonFinalAsset({
  label,
  size = 48,
  accent = 'var(--text-muted)',
}: {
  label: string
  size?: number
  accent?: string
}) {
  return (
    <div
      aria-label={`${label} (asset pending)`}
      title={`${label} — final asset pending generation`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1.5px dashed ${accent}`,
        borderRadius: 8,
        color: accent,
        fontSize: Math.max(8, Math.round(size * 0.16)),
        fontFamily: 'var(--font-mono, monospace)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        textAlign: 'center',
        lineHeight: 1.15,
        padding: 2,
        opacity: 0.7,
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  )
}
