import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOrders, useProducts } from '../../lib/hooks'
import { bumpStock, removeProduct, saveProduct } from '../../lib/data'
import type { Product } from '../../lib/types'
import { EmptyState, ProductImage, Spinner, StatusPill, Toast, fmtMoney } from '../../components/ui'

export default function Dashboard() {
  const { products, loading, reload } = useProducts()
  const { orders } = useOrders()
  const [toast, setToast] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  const updateShowStock = async (p: Product, value: boolean) => {
    setPending(p.id)
    try {
      await saveProduct({ ...p, show_stock: value, stock_qty: value ? p.stock_qty : 0 }, p.id)
      await reload()
    } catch (err) {
      flash(`Could not save: ${(err as Error).message}`)
    } finally {
      setPending(null)
    }
  }

  const updateStock = async (p: Product, delta: number) => {
    setPending(p.id)
    try {
      await bumpStock(p.id, delta)
      await reload()
    } catch (err) {
      flash(`Could not save: ${(err as Error).message}`)
    } finally {
      setPending(null)
    }
  }

  const del = async (p: Product) => {
    setPending(p.id)
    try {
      await removeProduct(p.id)
      flash(`${p.name} removed`)
      await reload()
    } catch (err) {
      flash(`Could not delete: ${(err as Error).message}`)
    } finally {
      setPending(null)
      setConfirming(null)
    }
  }

  const openOrders = orders.filter((o) => o.status === 'new' || o.status === 'in_progress')
  const freshOrders = openOrders.slice(0, 4)

  return (
    <>
      <div className="head-row" style={{ alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">The shelf</h1>
        </div>
        <Link
          to="/admin/products/new"
          className="btn btn-primary"
          style={{
            marginLeft: 'auto',
            textDecoration: 'none',
            fontSize: '15.5px',
            padding: '12px 24px',
            fontWeight: 700,
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(63, 93, 70, 0.25)',
            whiteSpace: 'nowrap',
          }}
        >
          Add Product (+)
        </Link>
      </div>

      {!loading && products.length === 0 && (
        <div className="section-gap">
          <EmptyState
            title="No products on the shelf yet"
            body="Add your first piece — a name, a price, a photo — and it shows up in the shop."
            action={
              <Link
                to="/admin/products/new"
                className="btn btn-primary"
                style={{ fontSize: '15px', padding: '11px 20px', fontWeight: 700, textDecoration: 'none' }}
              >
                Add Product (+)
              </Link>
            }
          />
        </div>
      )}

      {loading ? (
        <Spinner label="Loading products" />
      ) : (
        <div className="shelf-grid section-gap">
          {products.map((p) => (
            <article key={p.id} className="prod-card">
              <ProductImage product={p} className="prod-img" />
              <div className="prod-body">
                <div className="prod-name">{p.name}</div>
                <div className="prod-meta">
                  <span className="prod-price">{fmtMoney(p.price)}</span>
                  {p.category && <span className="badge" style={{ background: 'var(--paper-deep)' }}>{p.category}</span>}
                  {p.show_stock ? (
                    <span className="badge">Showing stock</span>
                  ) : (
                    <span className="badge muted">Hidden</span>
                  )}
                </div>
                <div className="card-actions">
                  <label className="switch" title="When on, the shop shows this product's stock count to customers">
                    <input
                      type="checkbox"
                      checked={p.show_stock}
                      disabled={pending === p.id}
                      onChange={(e) => updateShowStock(p, e.target.checked)}
                    />
                    <span className="switch-text small">Show stock</span>
                  </label>

                  {p.show_stock && (
                    <span
                      className="stepper"
                      title="Stock on the shelf right now"
                      style={{ opacity: pending === p.id ? 0.5 : 1 }}
                    >
                      <button onClick={() => updateStock(p, -1)} aria-label={`Remove one of ${p.name}`}>–</button>
                      <span className="qty">{p.stock_qty}</span>
                      <button onClick={() => updateStock(p, +1)} aria-label={`Add one of ${p.name}`}>+</button>
                    </span>
                  )}

                  <Link to={`/admin/products/${p.id}/edit`} className="btn btn-sm">Edit</Link>
                  {confirming === p.id ? (
                    <>
                      <button className="btn btn-sm btn-danger" onClick={() => del(p)} disabled={!!pending}>
                        Really delete?
                      </button>
                      <button className="btn btn-sm" onClick={() => setConfirming(null)}>Keep</button>
                    </>
                  ) : (
                    <button className="btn btn-sm btn-danger" onClick={() => setConfirming(p.id)}>Delete</button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="section-gap">
        <div className="head-row" style={{ marginBottom: 14 }}>
          <h2 className="section-title" style={{ fontSize: 22 }}>Fresh orders</h2>
          <Link to="/admin/orders" className="btn btn-sm">All orders</Link>
        </div>
        {freshOrders.length === 0 ? (
          <EmptyState title="Nothing waiting" body="New orders land here the moment a customer checks out." />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {freshOrders.map((o) => (
              <div key={o.id} className="panel order-card" style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <strong>{o.customer_name}</strong>
                  <span className="muted small">{o.customer_email}</span>
                  <span className="order-total" style={{ marginLeft: 'auto' }}>
                    {o.items.length} item{o.items.length === 1 ? '' : 's'}
                  </span>
                  <StatusPill status={o.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  )
}
