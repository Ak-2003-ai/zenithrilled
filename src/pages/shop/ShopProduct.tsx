import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { productDetail } from '../../lib/data'
import type { Product } from '../../lib/types'
import { useCart } from '../../lib/cart'
import { ProductImage, Spinner, fmtMoney } from '../../components/ui'

export default function ShopProduct() {
  const { id } = useParams()
  const cart = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    let live = true
    ;(async () => {
      const p = await productDetail(id!)
      if (!live) return
      setProduct(p ?? null)
      setLoading(false)
    })()
    return () => {
      live = false
    }
  }, [id])

  if (loading) return <Spinner label="Pulling it off the shelf" />

  if (!product) {
    return (
      <div style={{ padding: '60px 0' }}>
        <h1 style={{ fontSize: 28, marginBottom: 10 }}>That piece is gone</h1>
        <p className="muted">It may have been retired or removed from the shop.</p>
        <Link to="/shop" className="btn" style={{ marginTop: 18 }}>Back to the shelf</Link>
      </div>
    )
  }

  const isInactive = product.is_active === false
  const out = product.show_stock && product.stock_qty <= 0
  const cap = product.show_stock ? Math.max(1, product.stock_qty) : Infinity
  const clamped = Math.min(qty, cap)

  const addIt = () => {
    if (isInactive) return
    cart.add(product, clamped)
    cart.setOpen(true)
  }

  return (
    <article className="pdp" style={isInactive ? { opacity: 0.78 } : undefined}>
      <ProductImage product={product} className={`pdp-img ${product.image_url ? '' : 'fallback'}`} />
      <div>
        <p className="muted small">
          <Link to="/shop" style={{ fontWeight: 700 }}>The shelf</Link>
          {product.category && <> / <span>{product.category}</span></>} / {product.name}
        </p>
        <h1>{product.name}</h1>
        <div className="pdp-price">{fmtMoney(product.price)}</div>

        <div style={{ marginBottom: 14 }}>
          {isInactive ? (
            <span className="badge" style={{ color: 'var(--brick)', borderColor: '#eccbc6', background: '#fdf2f0' }}>
              <span className="badge-dot" style={{ background: 'var(--brick)' }} />
              Out of stock
            </span>
          ) : product.show_stock ? (
            out ? (
              <span className="badge"><span className="badge-dot" style={{ background: 'var(--ochre)' }} />Made to order — let's talk</span>
            ) : product.stock_qty <= 3 ? (
              <span className="badge"><span className="badge-dot" style={{ background: 'var(--ochre)' }} />{product.stock_qty} left on the shelf</span>
            ) : (
              <span className="badge"><span className="badge-dot" style={{ background: 'var(--moss)' }} />In stock</span>
            )
          ) : null}
        </div>

        <p className="pdp-desc">{product.description || 'No description yet — this one is worth asking about.'}</p>

        <div className="pdp-actions">
          {isInactive ? (
            <button className="btn" disabled style={{ opacity: 0.65, cursor: 'not-allowed' }}>
              Out of stock
            </button>
          ) : out ? (
            <button className="btn btn-primary" onClick={() => { cart.add(product, 1); cart.setOpen(true) }}>
              Ask to make it
            </button>
          ) : (
            <>
              <span className="qty-pick">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="One less">–</button>
                <span className="n">{clamped}</span>
                <button
                  onClick={() => setQty((q) => (cap === Infinity ? q + 1 : Math.min(cap, q + 1)))}
                  aria-label="One more"
                  disabled={cap !== Infinity && clamped >= cap}
                >
                  +
                </button>
              </span>
              <button className="btn btn-primary" onClick={addIt}>Add to basket</button>
            </>
          )}
        </div>

        {isInactive ? (
          <p className="muted small" style={{ marginTop: 14, maxWidth: '44ch' }}>
            This piece is currently out of stock. Check back later or contact us to see when it's back.
          </p>
        ) : out ? (
          <p className="muted small" style={{ marginTop: 14, maxWidth: '44ch' }}>
            This one is made when you ask for it. Add it to the basket and we'll confirm lead time with you.
          </p>
        ) : null}
      </div>
    </article>
  )
}
