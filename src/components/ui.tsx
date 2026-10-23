import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { OrderStatus, Product } from '../lib/types'
import { STATUS_LABELS } from '../lib/types'

export function Toast({ message, tone = 'ok', onClose }: {
  message: string
  tone?: 'ok' | 'error'
  onClose?: () => void
}) {
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), 3200)
    return () => clearTimeout(t)
  }, [onClose])
  return <div className={`toast ${tone === 'error' ? 'error' : ''}`} role="status">{message}</div>
}

export function StatusPill({ status, size = 'md' }: { status: OrderStatus; size?: 'md' | 'sm' }) {
  return (
    <span className={`badge st-${status} ${size === 'sm' ? 'badge-sm' : ''}`}>
      <span className="badge-dot" />
      {STATUS_LABELS[status]}
    </span>
  )
}

export function fmtMoney(n: number) {
  const num = Number(n) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num).replace(/\.00$/, '')
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Product photo with a quiet placeholder when no image is set. */
export function ProductImage({ product, alt, className }: {
  product: Pick<Product, 'image_url' | 'name'>
  alt?: string
  className?: string
}) {
  const [broken, setBroken] = useState(false)
  const src = product.image_url
  if (!src || broken) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--paper-deep)',
          color: 'var(--ink-soft)',
          fontSize: 13,
          fontWeight: 600,
          overflow: 'hidden',
        }}
      >
        {alt ?? product.name}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt ?? product.name}
      className={className}
      onError={() => setBroken(true)}
      loading="lazy"
    />
  )
}

/** Dashed "stitched" frame for a single hero element (used on the hero swatches). */
export function Stitched({ children }: { children: ReactNode }) {
  return <div className="stitched panel">{children}</div>
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{body}</p>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="loading-skel" role="status" aria-label={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="muted small">{label}…</span>
    </div>
  )
}

/** Orders-per-day bar chart, pure SVG. */
export function DayBars({ days }: { days: { date: string; orders: number; revenue: number }[] }) {
  const W = 560
  const H = 180
  const padX = 8
  const padB = 26
  const padT = 18
  const max = Math.max(1, ...days.map((d) => d.orders))
  const bw = (W - padX * 2) / days.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="barchart" role="img" aria-label="Orders in the last 14 days">
      {days.map((d, i) => {
        const h = (d.orders / max) * (H - padB - padT)
        const x = padX + i * bw + bw * 0.18
        const w = bw * 0.64
        const y = H - padB - h
        const dayLabel = new Date(d.date).getDate().toString()
        return (
          <g key={d.date}>
            {d.orders > 0 ? (
              <rect className="bar" x={x} y={y} width={w} height={h} rx={3} />
            ) : null}
            {d.orders > 0 && (
              <text className="val" x={x + w / 2} y={y - 5} textAnchor="middle">
                {d.orders}
              </text>
            )}
            <text className="axis" x={x + w / 2} y={H - padB + 16} textAnchor="middle">
              {i % 2 === 0 ? dayLabel : ''}
            </text>
          </g>
        )
      })}
      <line x1={padX} y1={H - padB} x2={W - padX} y2={H - padB} stroke="var(--line)" strokeWidth={1} />
    </svg>
  )
}

export function HBars({ rows }: { rows: { name: string; value: number; hint?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div>
      {rows.map((r, i) => (
        <div className="hbar-row" key={`${r.name}-${i}`}>
          <span className="hbar-name" title={r.name}>{r.name}</span>
          <span className="hbar-track">
            <span className="hbar-fill" style={{ width: `${(r.value / max) * 100}%`, display: 'block' }} />
          </span>
          <span className="hbar-num">{r.value}</span>
        </div>
      ))}
    </div>
  )
}
