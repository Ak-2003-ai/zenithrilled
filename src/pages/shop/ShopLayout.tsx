import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { CartProvider, useCart } from '../../lib/cart'
import { placeOrder } from '../../lib/data'
import { Toast, fmtMoney } from '../../components/ui'

export default function ShopLayout() {
  return (
    <CartProvider>
      <ShopChrome />
    </CartProvider>
  )
}

function ShopChrome() {
  const cart = useCart()
  const [placing, setPlacing] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [toast, setToast] = useState<{ msg: string; tone?: 'error' } | null>(null)

  const flash = (msg: string, tone?: 'error') => {
    setToast({ msg, tone })
    setTimeout(() => setToast(null), 4200)
  }

  const placeOrderNow = async () => {
    if (!name.trim() || !email.trim()) {
      flash('Add your name and email so the order can be matched to you.', 'error')
      return
    }
    setPlacing(true)
    try {
      await placeOrder(
        {
          customer_name: name.trim(),
          customer_email: email.trim().toLowerCase(),
          customer_note: note.trim(),
        },
        cart.lines.map((l) => ({
          product_id: l.product.id,
          qty: l.qty,
          unit_price: Number(l.product.price),
        })),
      )
      cart.clear()
      cart.setOpen(false)
      setName('')
      setEmail('')
      setNote('')
      flash(`Order placed. You can watch it on the Track an order page.`)
    } catch (err) {
      flash(`Something went wrong placing the order: ${(err as Error).message}`, 'error')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <>
      <header className="shop-header">
        <div className="container shop-header-inner">
          <Link to="/shop" className="wordmark">
            <img src="/logo.png" alt="Zenithrilled logo" width="34" height="34" style={{ borderRadius: '50%', objectFit: 'cover' }} />
            Zenithrilled
          </Link>
          <nav className="shop-nav">
            <NavLink to="/shop" end>Shop</NavLink>
            <NavLink to="/shop/track">Track an order</NavLink>
          </nav>
          <button className="btn cart-btn" onClick={() => cart.setOpen(true)}>
            Basket
            {cart.count > 0 && <span className="cart-count">{cart.count}</span>}
          </button>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>

      <footer className="shop-footer">
        <div className="container" style={{ width: '100%' }}>
          <span>Zenithrilled — handmade crochet, made to order.</span>
          <span>
            Have an order? <Link to="/shop/track">Track it</Link>
          </span>
        </div>
      </footer>

      {cart.open && (
        <CartDrawer
          onPlace={placeOrderNow}
          placing={placing}
          name={name}
          email={email}
          note={note}
          setName={setName}
          setEmail={setEmail}
          setNote={setNote}
        />
      )}

      {toast && <Toast message={toast.msg} tone={toast.tone === 'error' ? 'error' : 'ok'} onClose={() => setToast(null)} />}
    </>
  )
}

function CartDrawer(props: {
  onPlace: () => void
  placing: boolean
  name: string
  email: string
  note: string
  setName: (v: string) => void
  setEmail: (v: string) => void
  setNote: (v: string) => void
}) {
  const cart = useCart()
  const { lines, total, setQty, remove } = cart

  return (
    <>
      <div className="drawer-backdrop" onClick={() => cart.setOpen(false)} />
      <aside className="drawer" aria-label="Your basket">
        <div className="drawer-head">
          <h2>Your basket</h2>
          <button className="btn btn-sm" onClick={() => cart.setOpen(false)}>Close</button>
        </div>

        <div className="drawer-body">
          {lines.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '40px 0' }}>
              The basket is empty.<br />Everything on the shelf is made by hand, so adding something here makes it real.
            </div>
          ) : (
            lines.map((l) => (
              <div className="cart-line" key={l.product.id}>
                <div>
                  <div className="cart-line-name">{l.product.name}</div>
                  <div className="cart-line-price">{fmtMoney(Number(l.product.price) * l.qty)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {l.product.show_stock && (
                    <span className="qty-pick">
                      <button onClick={() => setQty(l.product.id, l.qty - 1)} aria-label="One less">–</button>
                      <span className="n">{l.qty}</span>
                      <button onClick={() => setQty(l.product.id, l.qty + 1)} aria-label="One more">+</button>
                    </span>
                  )}
                  <button className="btn btn-sm" onClick={() => remove(l.product.id)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-foot">
          <div className="cart-subtotal">
            <span>Subtotal</span>
            <span>{fmtMoney(total)}</span>
          </div>

          <div className="field" style={{ marginBottom: 10 }}>
            <label htmlFor="c-name">Your name</label>
            <input id="c-name" className="input" value={props.name} onChange={(e) => props.setName(e.target.value)} placeholder="Where should the finished piece be sent?" />
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label htmlFor="c-email">Email</label>
            <input id="c-email" className="input" type="email" value={props.email} onChange={(e) => props.setEmail(e.target.value)} placeholder="So you can track the order" />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label htmlFor="c-note">A note (optional)</label>
            <input id="c-note" className="input" value={props.note} onChange={(e) => props.setNote(e.target.value)} placeholder="Colours, sizes, anything special" />
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} disabled={props.placing || lines.length === 0} onClick={props.onPlace}>
            {props.placing ? 'Placing your order…' : 'Place the order'}
          </button>
          <p className="muted small" style={{ marginTop: 10, marginBottom: 0 }}>
            No payment here yet — you'll be contacted for payment once your order is confirmed.
          </p>
        </div>
      </aside>
    </>
  )
}
