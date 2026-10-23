import { useMemo, useState } from 'react'
import { useOrders } from '../../lib/hooks'
import type { OrderStatus } from '../../lib/types'
import { ORDER_STATUSES } from '../../lib/types'
import { EmptyState, StatusPill, Toast, fmtDateTime, fmtMoney } from '../../components/ui'

type Filter = 'all' | OrderStatus

export default function Orders() {
  const { orders, loading, setStatus } = useOrders()
  const [filter, setFilter] = useState<Filter>('all')
  const [toast, setToast] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  const shown = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  )

  const totalOf = (o: (typeof orders)[number]) =>
    o.items.reduce((s, i) => s + i.qty * Number(i.unit_price), 0)

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    setSaving(orderId)
    try {
      await setStatus(orderId, status)
      flash(`Order marked as ${ORDER_STATUSES.find((s) => s.value === status)?.label.toLowerCase()}`)
    } catch (err) {
      flash(`Could not update: ${(err as Error).message}`)
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <div className="head-row">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-sub">
            Every order that has come in. Change a status and the customer sees the same progress on the shop's "Track your order" page.
          </p>
        </div>
      </div>

      <div className="filter-row">
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All ({orders.length})
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s.value}
            className={`chip ${filter === s.value ? 'active' : ''}`}
            onClick={() => setFilter(s.value)}
            title={s.blurb}
          >
            {s.label} ({orders.filter((o) => o.status === s.value).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center' }}><span className="muted">Loading orders…</span></div>
      ) : shown.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'No orders yet' : `No ${ORDER_STATUSES.find((s) => s.value === filter)?.label.toLowerCase()} orders`}
          body={filter === 'all' ? 'When a customer checks out, their order lands here.' : 'Try another status, or "All".'}
        />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {shown.map((o) => (
            <div key={o.id} className={`panel order-card st-${o.status}`}>
              <div className="order-head">
                <StatusPill status={o.status} size="sm" />
                <span className="order-cust">{o.customer_name}</span>
                <span className="order-mail">{o.customer_email}</span>
                <span className="order-total">{fmtMoney(totalOf(o))}</span>
              </div>
              <div className="muted small" style={{ marginTop: 6 }}>{fmtDateTime(o.created_at)}</div>

              <details className="order-items" open>
                <summary>
                  {o.items.length} item{o.items.length === 1 ? '' : 's'}
                </summary>
                {o.items.map((i) => (
                  <div key={i.id} className="item-row">
                    <span className="qty">{i.qty}×</span>
                    <span>{i.product?.name ?? 'A product that was removed'}</span>
                    <span className="muted small" style={{ marginLeft: 'auto' }}>{fmtMoney(Number(i.unit_price) * i.qty)}</span>
                  </div>
                ))}
              </details>

              {o.customer_note && (
                <p className="order-note">{o.customer_note}</p>
              )}

              <div className="card-actions">
                <span className="muted small">Move to</span>
                {ORDER_STATUSES.filter((s) => s.value !== o.status).map((s) => (
                  <button
                    key={s.value}
                    className="btn btn-sm"
                    disabled={saving === o.id}
                    onClick={() => changeStatus(o.id, s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  )
}
