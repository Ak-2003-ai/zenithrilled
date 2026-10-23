import { useState } from 'react'
import { trackByEmail } from '../../lib/data'
import type { OrderWithItems } from '../../lib/types'
import { STATUS_LABELS } from '../../lib/types'
import { ProductImage, Spinner, fmtDate, fmtMoney } from '../../components/ui'

type Found =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'none' }
  | { kind: 'orders'; orders: OrderWithItems[] }

const STEPS = ['new', 'in_progress', 'shipped', 'delivered'] as const

function stepIndex(status: string) {
  // 'cancelled' is out of the rail; it's shown separately.
  return STEPS.indexOf(status as (typeof STEPS)[number])
}

export default function ShopTrack() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<Found>({ kind: 'idle' })

  const track = async () => {
    if (!email.trim()) return
    setState({ kind: 'loading' })
    const orders = await trackByEmail(email)
    setState(orders.length ? { kind: 'orders', orders } : { kind: 'none' })
  }

  return (
    <section style={{ padding: '48px 0 40px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32 }}>Track your order</h1>
      <p className="page-sub" style={{ marginTop: 8 }}>
        Put in the email you gave when you ordered and we'll show exactly where each order stands.
      </p>

      <div className="track-form" style={{ marginTop: 22 }}>
        <input
          className="input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && track()}
        />
        <button className="btn btn-primary" onClick={track} disabled={state.kind === 'loading' || !email.trim()}>
          Look it up
        </button>
      </div>

      <div style={{ marginTop: 28 }}>
        {state.kind === 'loading' ? (
          <Spinner label="Looking for your orders" />
        ) : state.kind === 'orders' ? (
          <div style={{ display: 'grid', gap: 18 }}>
            {state.orders.map((o) => (
              <OrderCard key={o.id} o={o} />
            ))}
          </div>
        ) : state.kind === 'none' ? (
          <div className="empty">
            <h3>Nothing under that email</h3>
            <p>If you just placed an order, double-check the address — it has to match exactly.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function OrderCard({ o }: { o: OrderWithItems }) {
  const idx = stepIndex(o.status)
  const cancelled = o.status === 'cancelled'

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <strong style={{ fontSize: 16 }}>{o.items.length} item{o.items.length === 1 ? '' : 's'}</strong>
          <span className="muted small" style={{ display: 'block' }}>Placed {fmtDate(o.created_at)}</span>
        </div>
        <span className={`badge st-${o.status}`}><span className="badge-dot" />{STATUS_LABELS[o.status]}</span>
      </div>

      {cancelled ? (
        <p className="order-note" style={{ marginTop: 12 }}>
          This order was cancelled. If that's unexpected, reach out and we'll sort it out.
        </p>
      ) : (
        <div className="rail">
          {STEPS.map((s, i) => (
            <div key={s} className={`rail-step ${i <= idx ? 'done' : ''} ${i === idx ? 'now' : ''}`}>
              {STATUS_LABELS[s]}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        {o.items.map((it) => (
          <div key={it.id} className="item-row" style={{ alignItems: 'center' }}>
            {it.product ? (
              <ProductImage product={it.product} className="item-thumb" />
            ) : (
              <span className="item-thumb-ph" aria-hidden="true" />
            )}
            <span style={{ flex: 1 }}>
              <strong>{it.product?.name ?? 'A piece that was retired'}</strong>
              <div className="muted small">{it.qty} × {fmtMoney(Number(it.unit_price))}</div>
            </span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--line-soft)', marginTop: 8, paddingTop: 8, fontWeight: 700 }}>
          Total {fmtMoney(o.items.reduce((s, i) => s + i.qty * Number(i.unit_price), 0))}
        </div>
      </div>
    </div>
  )
}
