import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from './supabase'
import { getDemoOrders, getDemoProducts, saveDemoOrders } from './mockData'
import { getStoredAdminSession, setStoredAdminSession } from './auth'
import type { Order, OrderStatus, OrderWithItems, Product } from './types'

export type AdminSession = { id: string; email: string | null; username?: string }

/**
 * Auth + admin check for the admin side.
 * In demo mode, authenticates against local stored session (default: admin / admin123).
 * When Supabase is configured, verifies with Supabase Auth and admin_users table.
 */
export function useAdmin() {
  const [session, setSession] = useState<AdminSession | null>(() => {
    const stored = getStoredAdminSession()
    return stored ? { id: stored.id, email: stored.email } : null
  })
  const [displayName, setDisplayName] = useState<string | null>(() => {
    return getStoredAdminSession()?.displayName ?? null
  })
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(() => {
    return Boolean(getStoredAdminSession())
  })

  useEffect(() => {
    let live = true
    let unsub: (() => void) | undefined

    const syncSession = () => {
      if (!live) return
      const stored = getStoredAdminSession()
      if (stored) {
        setSession({ id: stored.id, email: stored.email })
        setDisplayName(stored.displayName)
        setIsAdmin(true)
      } else {
        setSession(null)
        setDisplayName(null)
        setIsAdmin(false)
      }
    }

    window.addEventListener('zenithrilled-auth-change', syncSession)

    const sb = getSupabase()
    if (sb) {
      const applyUser = async (u: User) => {
        if (!live) return
        const { data: adminRow } = await sb
          .from('admin_users')
          .select('display_name')
          .eq('auth_uid', u.id)
          .maybeSingle()
        if (!live) return
        const name = (adminRow as { display_name?: string } | null)?.display_name || u.email || 'Admin'
        setSession({ id: u.id, email: u.email ?? null })
        setIsAdmin(true)
        setDisplayName(name)
        setStoredAdminSession({
          id: u.id,
          email: u.email ?? 'admin@zenithrilled.com',
          displayName: name,
          loggedInAt: new Date().toISOString(),
        })
      }

      ;(async () => {
        try {
          const { data: { session: sbSession } } = await sb.auth.getSession()
          if (!live) return
          if (sbSession?.user) {
            await applyUser(sbSession.user)
          } else {
            syncSession()
          }
        } catch {
          syncSession()
        }

        const sub = sb.auth.onAuthStateChange((_ev, s) => {
          if (!live) return
          if (s?.user) {
            applyUser(s.user)
          } else {
            syncSession()
          }
        })
        unsub = () => sub.data.subscription.unsubscribe()
        if (live) setLoading(false)
      })()
    } else {
      syncSession()
      setLoading(false)
    }

    return () => {
      live = false
      unsub?.()
      window.removeEventListener('zenithrilled-auth-change', syncSession)
    }
  }, [])

  const signOut = useCallback(async () => {
    const sb = getSupabase()
    if (sb) {
      try {
        await sb.auth.signOut()
      } catch {
        // ignore
      }
    }
    setStoredAdminSession(null)
    setSession(null)
    setIsAdmin(false)
    setDisplayName(null)
  }, [])

  return { session, displayName, loading, isAdmin, signOut, demo: !isSupabaseConfigured }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) {
      setProducts(getDemoProducts())
      setLoading(false)
      return
    }
    const { data } = await sb
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts((data ?? []) as Product[])
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { products, loading, reload }
}

export function useOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) {
      setOrders(getDemoOrders())
      setLoading(false)
      return
    }
    const { data } = await sb
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false })
    const rows = (data ?? []) as unknown as OrderWithItems[]
    const pids = [...new Set(rows.flatMap((o) => o.items.map((i) => i.product_id)))]
    if (pids.length) {
      const { data: prods } = await sb.from('products').select('*').in('id', pids)
      const prodMap = new Map((prods ?? []).map((p) => [p.id, p]))
      for (const o of rows) {
        for (const item of o.items) {
          const p = prodMap.get(item.product_id)
          if (p) item.product = p
        }
      }
    }
    setOrders(rows)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    const sb = getSupabase()
    if (!sb) {
      const next = getDemoOrders().map((o) =>
        o.id === orderId ? { ...o, status } : o,
      )
      saveDemoOrders(next)
      setOrders(next)
      return
    }
    const { error } = await sb.from('orders').update({ status }).eq('id', orderId)
    if (error) throw error
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
  }, [])

  return { orders, loading, setStatus, reload: load }
}

export type Analytics = {
  totalOrders: number
  totalItems: number
  revenue: number
  byStatus: Record<OrderStatus, number>
  topProducts: { name: string; sold: number }[]
  last14Days: { date: string; orders: number; revenue: number }[]
}

type AnalyticsItem = { order_id: string; product_id: string; qty: number; unit_price: number }

export function useAnalytics() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    ;(async () => {
      const sb = getSupabase()

      let all: Order[]
      let items: AnalyticsItem[]

      if (!sb) {
        // Demo: derive from the localStorage orders + their items.
        all = getDemoOrders().map(({ items: _items, ...o }) => o)
        items = getDemoOrders().flatMap((o) =>
          o.items.map((i) => ({
            order_id: o.id,
            product_id: i.product_id,
            qty: i.qty,
            unit_price: Number(i.unit_price),
          })),
        )
        const nameOf = new Map(getDemoProducts().map((p) => [p.id, p.name]))
        buildAndSet(all, items, nameOf, (d) => {
          if (live) setData(d)
          setLoading(false)
        })
        return
      }

      const [ordersRes, itemsRes] = await Promise.all([
        sb.from('orders').select('*').order('created_at'),
        sb.from('order_items').select('order_id, product_id, qty, unit_price'),
      ])
      all = (ordersRes.data ?? []) as Order[]
      items = (itemsRes.data ?? []) as AnalyticsItem[]

      const pids = [...new Set(items.map((i) => i.product_id))]
      const { data: prods } = pids.length
        ? await sb.from('products').select('id, name').in('id', pids)
        : { data: [] }
      const nameOf = new Map<string, string>(
        ((prods ?? []) as Product[]).map((p) => [p.id, p.name]),
      )

      buildAndSet(all, items, nameOf, (d) => {
        if (live) setData(d)
        setLoading(false)
      })
    })()
    return () => {
      live = false
    }
  }, [])

  return { data, loading }
}

function buildAndSet(
  all: Order[],
  items: AnalyticsItem[],
  nameOf: Map<string, string>,
  done: (d: Analytics) => void,
) {
  const notCancelled = new Set(
    all.filter((o) => o.status !== 'cancelled').map((o) => o.id),
  )
  const revenue = items
    .filter((i) => notCancelled.has(i.order_id))
    .reduce((s, i) => s + i.qty * Number(i.unit_price), 0)

  const byProduct = new Map<string, number>()
  for (const row of items) {
    byProduct.set(row.product_id, (byProduct.get(row.product_id) ?? 0) + row.qty)
  }

  const days: Analytics['last14Days'] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const dayOrders = all.filter((o) => o.created_at.slice(0, 10) === key)
    const dayOrderIds = new Set(dayOrders.map((o) => o.id))
    const dayRevenue = items
      .filter((i2) => notCancelled.has(i2.order_id) && dayOrderIds.has(i2.order_id))
      .reduce((s, i2) => s + i2.qty * Number(i2.unit_price), 0)
    days.push({ date: key, orders: dayOrders.length, revenue: dayRevenue })
  }

  const byStatus: Analytics['byStatus'] = {
    new: 0,
    in_progress: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }
  for (const o of all) byStatus[o.status as OrderStatus]++

  done({
    totalOrders: all.length,
    totalItems: [...byProduct.values()].reduce((a, b) => a + b, 0),
    revenue,
    byStatus,
    topProducts: [...byProduct.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pid, sold]) => ({ name: nameOf.get(pid) ?? 'Deleted product', sold })),
    last14Days: days,
  })
}
