import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Product } from './types'

export type CartLine = {
  product: Product
  qty: number
}

type CartState = {
  lines: CartLine[]
  add: (p: Product, qty?: number) => void
  setQty: (productId: string, qty: number) => void
  remove: (productId: string) => void
  clear: () => void
  open: boolean
  setOpen: (v: boolean) => void
  count: number
  total: number
}

const CartCtx = createContext<CartState | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [open, setOpen] = useState(false)

  // Cap: when the shop shows a stock number, we never let a line exceed it.
  // A zeroed-out number means "made to order" — one at a time until confirmed.
  const capFor = (p: Product) => (p.show_stock ? Math.max(1, p.stock_qty) : Infinity)

  const add = useCallback((p: Product, qty = 1) => {
    setLines((prev) => {
      const cap = capFor(p)
      const existing = prev.find((l) => l.product.id === p.id)
      if (existing) {
        return prev.map((l) =>
          l.product.id === p.id ? { ...l, qty: Math.min(cap, l.qty + qty) } : l,
        )
      }
      const q = Math.min(cap, qty)
      if (q <= 0) return prev
      return [...prev, { product: p, qty: q }]
    })
  }, [])

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => {
          if (l.product.id !== productId) return l
          const cap = capFor(l.product)
          const clamped = Math.min(cap, qty)
          return { ...l, qty: Math.max(0, clamped) }
        })
        .filter((l) => l.qty > 0),
    )
  }, [])

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartState>(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0)
    const total = lines.reduce((s, l) => s + l.qty * Number(l.product.price), 0)
    return { lines, add, setQty, remove, clear, open, setOpen, count, total }
  }, [lines, add, setQty, remove, clear, open])

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export function useCart() {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
