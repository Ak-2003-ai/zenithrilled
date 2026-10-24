import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOrders, useProducts } from '../../lib/hooks'
import { bumpStock, getCategories, removeProduct, saveProduct } from '../../lib/data'
import type { Product } from '../../lib/types'
import { EmptyState, ProductImage, Spinner, StatusPill, Toast, fmtMoney } from '../../components/ui'

export default function Dashboard() {
  const { products, loading, reload } = useProducts()
  const { orders } = useOrders()
  const [categories, setCategories] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  // Search, filter, and sorting state
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all') // 'all' | 'in_store' | 'hidden'
  const [stockFilter, setStockFilter] = useState('all') // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  // Combined list of categories from DB + any existing in loaded products
  const allCategories = useMemo(() => {
    const set = new Set(categories)
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [categories, products])

  const updateActive = async (p: Product, value: boolean) => {
    setPending(p.id)
    try {
      await saveProduct({ ...p, is_active: value }, p.id)
      flash(`${p.name} is now ${value ? 'showing in store' : 'marked out of stock'}`)
      await reload()
    } catch (err) {
      flash(`Could not update: ${(err as Error).message}`)
    } finally {
      setPending(null)
    }
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

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products
      .filter((p) => {
        if (q) {
          const matchName = p.name.toLowerCase().includes(q)
          const matchDesc = (p.description || '').toLowerCase().includes(q)
          const matchCat = (p.category || '').toLowerCase().includes(q)
          if (!matchName && !matchDesc && !matchCat) return false
        }
        if (categoryFilter !== 'all') {
          if ((p.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false
        }
        const isActive = p.is_active !== false
        if (visibilityFilter === 'in_store' && !isActive) return false
        if (visibilityFilter === 'hidden' && isActive) return false

        if (stockFilter === 'in_stock') {
          if (!isActive || (p.show_stock && p.stock_qty <= 0)) return false
        } else if (stockFilter === 'low_stock') {
          if (!p.show_stock || p.stock_qty <= 0 || p.stock_qty > 3) return false
        } else if (stockFilter === 'out_of_stock') {
          const isOut = !isActive || (p.show_stock && p.stock_qty <= 0)
          if (!isOut) return false
        }
        return true
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          case 'name_asc':
            return a.name.localeCompare(b.name)
          case 'name_desc':
            return b.name.localeCompare(a.name)
          case 'price_asc':
            return a.price - b.price
          case 'price_desc':
            return b.price - a.price
          case 'stock_desc':
            return (b.show_stock ? b.stock_qty : 0) - (a.show_stock ? a.stock_qty : 0)
          case 'stock_asc':
            return (a.show_stock ? a.stock_qty : 0) - (b.show_stock ? b.stock_qty : 0)
          case 'newest':
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
      })
  }, [products, search, categoryFilter, visibilityFilter, stockFilter, sortBy])

  const hasFiltersApplied =
    search.trim() !== '' ||
    categoryFilter !== 'all' ||
    visibilityFilter !== 'all' ||
    stockFilter !== 'all' ||
    sortBy !== 'newest'

  const resetFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setVisibilityFilter('all')
    setStockFilter('all')
    setSortBy('newest')
  }

  const openOrders = orders.filter((o) => o.status === 'new' || o.status === 'in_progress')
  const freshOrders = openOrders.slice(0, 4)

  return (
    <>
      <div className="head-row" style={{ alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">The shelf</h1>
        </div>
        <Link
          to="/admin/products/new"
          className="btn btn-primary"
          style={{
            marginLeft: 'auto',
            textDecoration: 'none',
            fontSize: '15px',
            padding: '11px 22px',
            fontWeight: 700,
            borderRadius: '9px',
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

      {products.length > 0 && (
        <div className="toolbar-panel">
          <div className="toolbar-row">
            {/* Search Bar */}
            <div className="toolbar-search">
              <span className="toolbar-search-icon" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className="input"
                placeholder="Search products by name, description, category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="toolbar-search-clear"
                  onClick={() => setSearch('')}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter by Category */}
            <select
              className="toolbar-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Filter by Visibility / Store status */}
            <select
              className="toolbar-select"
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              aria-label="Filter by store visibility"
            >
              <option value="all">All Store Status</option>
              <option value="in_store">In Store (Active)</option>
              <option value="hidden">Hidden / Out of stock</option>
            </select>

            {/* Filter by Stock availability */}
            <select
              className="toolbar-select"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              aria-label="Filter by stock"
            >
              <option value="all">All Stock Levels</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock (≤ 3)</option>
              <option value="out_of_stock">Out of Stock / Custom</option>
            </select>

            {/* Sort Options */}
            <select
              className="toolbar-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
              style={{ marginLeft: 'auto' }}
            >
              <option value="newest">Sort: Newest first</option>
              <option value="oldest">Sort: Oldest first</option>
              <option value="name_asc">Sort: Name (A – Z)</option>
              <option value="name_desc">Sort: Name (Z – A)</option>
              <option value="price_asc">Sort: Price (Low → High)</option>
              <option value="price_desc">Sort: Price (High → Low)</option>
              <option value="stock_desc">Sort: Stock (High → Low)</option>
              <option value="stock_asc">Sort: Stock (Low → High)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-soft)', flexWrap: 'wrap', gap: 8 }}>
            <span>
              Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> product{products.length === 1 ? '' : 's'}
              {categoryFilter !== 'all' && ` in "${categoryFilter}"`}
              {search && ` matching "${search}"`}
            </span>
            {hasFiltersApplied && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--prussian)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <Spinner label="Loading products" />
      ) : products.length > 0 && filteredProducts.length === 0 ? (
        <div className="section-gap">
          <EmptyState
            title="No matching products found"
            body="No items match your search or active filter combination."
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="shelf-grid section-gap">
          {filteredProducts.map((p) => {
            const isActive = p.is_active !== false
            return (
              <article key={p.id} className={`prod-card ${!isActive ? 'is-inactive' : ''}`}>
                <ProductImage product={p} className="prod-img" />
                <div className="prod-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div className="prod-name">{p.name}</div>
                    {!isActive ? (
                      <span
                        className="badge"
                        style={{
                          color: 'var(--brick)',
                          borderColor: '#eccbc6',
                          background: '#fdf2f0',
                          flexShrink: 0,
                        }}
                      >
                        <span className="badge-dot" style={{ background: 'var(--brick)' }} />
                        Out of stock
                      </span>
                    ) : p.show_stock ? (
                      p.stock_qty <= 0 ? (
                        <span className="badge" style={{ flexShrink: 0 }}>Made to order</span>
                      ) : p.stock_qty <= 3 ? (
                        <span className="badge" style={{ flexShrink: 0 }}>
                          <span className="badge-dot" style={{ background: 'var(--ochre)' }} />
                          {p.stock_qty} left
                        </span>
                      ) : (
                        <span className="badge" style={{ flexShrink: 0 }}>
                          <span className="badge-dot" style={{ background: 'var(--moss)' }} />
                          In stock
                        </span>
                      )
                    ) : (
                      <span className="badge muted" style={{ flexShrink: 0 }}>Stock hidden</span>
                    )}
                  </div>

                  <div className="prod-meta">
                    <span className="prod-price">{fmtMoney(p.price)}</span>
                    {p.category && (
                      <span className="badge" style={{ background: 'var(--paper-deep)' }}>
                        {p.category}
                      </span>
                    )}
                  </div>

                  <div className="card-actions">
                    {/* Show in Store Toggle */}
                    <label
                      className="switch"
                      title={isActive ? 'Product is live in store. Turn off to mark out of stock.' : 'Product is hidden. Turn on to make active.'}
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        disabled={pending === p.id}
                        onChange={(e) => updateActive(p, e.target.checked)}
                      />
                      <span className="switch-text small">
                        {isActive ? 'In store' : 'Out of stock'}
                      </span>
                    </label>

                    {/* Show stock to customer toggle */}
                    <label
                      className="switch"
                      title="When on, shows exact stock count to customers in the store"
                    >
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
                        title="Stock ready on shelf"
                        style={{ opacity: pending === p.id ? 0.5 : 1 }}
                      >
                        <button onClick={() => updateStock(p, -1)} aria-label={`Remove one of ${p.name}`}>–</button>
                        <span className="qty" style={{ minWidth: 26, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
                          {p.stock_qty}
                        </span>
                        <button onClick={() => updateStock(p, +1)} aria-label={`Add one of ${p.name}`}>+</button>
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                      <Link to={`/admin/products/${p.id}/edit`} className="btn btn-sm">Edit</Link>
                      {confirming === p.id ? (
                        <>
                          <button className="btn btn-sm btn-danger" onClick={() => del(p)} disabled={!!pending}>
                            Confirm?
                          </button>
                          <button className="btn btn-sm" onClick={() => setConfirming(null)}>Keep</button>
                        </>
                      ) : (
                        <button className="btn btn-sm btn-danger" onClick={() => setConfirming(p.id)}>Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
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
