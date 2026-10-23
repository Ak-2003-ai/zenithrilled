import { Link } from 'react-router-dom'
import { useProducts } from '../../lib/hooks'
import type { Product } from '../../lib/types'
import { EmptyState, ProductImage, Spinner, fmtMoney } from '../../components/ui'
import { useCart } from '../../lib/cart'

const SWATCHES = [
  { name: 'Prussian Blue', hex: '#0e2a3a' },
  { name: 'Mustard Gold', hex: '#e09f1f' },
  { name: 'Warm Cream', hex: '#eee8dc' },
]

export default function ShopHome() {
  const { products, loading } = useProducts()
  const cart = useCart()

  const addToCart = (p: Product) => {
    cart.add(p, 1)
    cart.setOpen(true)
  }

  return (
    <>
      <section className="hero">
        <div>
          <h1>
            Made one piece at a time, <em>with actual hands</em>.
          </h1>
          <p className="hero-sub">
            Zenithrilled is a one-person crochet studio. Everything you see here is crocheted to
            order — most pieces don't exist yet, and that's the point. Pick something, and it gets
            made for you.
          </p>
          <Link to="#shelf" className="btn btn-primary">See the shelf</Link>
        </div>

        <div className="swatch-stack" aria-hidden="true">
          {SWATCHES.map((s) => (
            <div className={`swatch stitched`} key={s.name}>
              <span className="swatch-ball" style={{ background: s.hex }} />
              <div>
                <div className="swatch-name">{s.name}</div>
                <div className="swatch-hex">{s.hex.toUpperCase()}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="shelf" className="shop-section">
        <div className="head-row">
          <h2 style={{ fontSize: 30 }}>The shelf</h2>
          <p className="page-sub">What's available right now.</p>
        </div>

        {loading ? (
          <Spinner label="Hanging the shelf" />
        ) : products.length === 0 ? (
          <div style={{ marginTop: 18 }}>
            <EmptyState
              title="The shelf is bare, for now"
              body="Pieces get added by hand, one at a time. Check back soon."
            />
          </div>
        ) : (
          <div className="shop-grid" style={{ marginTop: 18 }}>
            {products.map((p) => {
              const out = p.show_stock && p.stock_qty <= 0
              return (
                <div key={p.id} className="prod-card" style={{ height: '100%' }}>
                  <Link to={`/shop/product/${p.id}`} aria-label={p.name}>
                    <ProductImage product={p} className="prod-img" />
                  </Link>
                  <div className="prod-body">
                    <Link to={`/shop/product/${p.id}`} style={{ textDecoration: 'none' }}>
                      <div className="prod-name">{p.name}</div>
                    </Link>
                    <div className="prod-meta">
                      <span className="prod-price">{fmtMoney(p.price)}</span>
                      {p.category && <span className="badge" style={{ background: 'var(--paper-deep)' }}>{p.category}</span>}
                      {stockBadge(p)}
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => addToCart(p)}
                      >
                        {out ? 'Ask to make it' : 'Add to basket'}
                      </button>
                      <Link to={`/shop/product/${p.id}`} className="btn btn-sm">Details</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}

function stockBadge(p: Product) {
  if (!p.show_stock) return null
  if (p.stock_qty <= 0) return <span className="badge">Made to order</span>
  if (p.stock_qty <= 3) return <span className="badge"><span className="badge-dot" style={{ background: 'var(--ochre)' }} />{p.stock_qty} left</span>
  return <span className="badge"><span className="badge-dot" style={{ background: 'var(--moss)' }} />In stock</span>
}
