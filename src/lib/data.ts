/**
 * Data layer: every read/write in the app goes through here.
 * With Supabase configured, it talks to the real database; without it,
 * it persists to localStorage (demo mode) so the whole app can be
 * reviewed before setup is done.
 */
import { getSupabase, uploadProductImage } from './supabase'
import {
  getDemoOrders,
  getDemoProducts,
  saveDemoOrders,
  saveDemoProducts,
} from './mockData'
import type { OrderStatus, OrderWithItems, Product } from './types'

export type ProductInput = {
  name: string
  description: string
  price: number
  image_url: string
  category?: string
  is_active?: boolean
  show_stock: boolean
  stock_qty: number
}

const DEFAULT_CATEGORIES = [
  'Amigurumi',
  'Coasters',
  'Home Decor',
  'Pillows',
  'Wearables',
  'Accessories',
]

export async function getCategories(): Promise<string[]> {
  const localRaw = localStorage.getItem('zenithrilled_categories')
  const localList: string[] = localRaw ? JSON.parse(localRaw) : DEFAULT_CATEGORIES
  const sb = getSupabase()
  if (sb) {
    try {
      const { data } = await sb.from('categories').select('name').order('name')
      if (data && data.length > 0) {
        const set = new Set([...localList, ...data.map((r: { name: string }) => r.name)])
        return Array.from(set)
      }
    } catch {
      // Table may not exist yet
    }
  }
  return localList
}

export async function addCategory(name: string): Promise<string[]> {
  const trimmed = name.trim()
  if (!trimmed) return getCategories()
  const current = await getCategories()
  if (!current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    const next = [...current, trimmed]
    localStorage.setItem('zenithrilled_categories', JSON.stringify(next))
    const sb = getSupabase()
    if (sb) {
      try {
        await sb.from('categories').insert({ name: trimmed })
      } catch {
        // Ignored if table not created yet
      }
    }
    return next
  }
  return current
}

export async function deleteCategory(name: string): Promise<string[]> {
  const trimmed = name.trim()
  const current = await getCategories()
  const next = current.filter((c) => c.toLowerCase() !== trimmed.toLowerCase())
  localStorage.setItem('zenithrilled_categories', JSON.stringify(next))
  const sb = getSupabase()
  if (sb) {
    try {
      await sb.from('categories').delete().ilike('name', trimmed)
    } catch {
      // Ignored if table not created yet
    }
  }
  return next
}

export function saveProduct(input: ProductInput, id?: string): Promise<void> {
  const sb = getSupabase()
  if (sb) {
    return (async () => {
      const q = id
        ? sb.from('products').update(input).eq('id', id)
        : sb.from('products').insert(input)
      const { error } = await q
      if (error) {
        if (error.message?.includes('violates row-level security policy')) {
          throw new Error('Supabase blocked write (Row-Level Security). Run the SQL fix in your Supabase SQL Editor.')
        }
        if (error.message?.includes('is_active')) {
          throw new Error("Missing 'is_active' column in Supabase. Run: ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;")
        }
        throw error
      }
    })()
  }
  let next = getDemoProducts()
  if (id) {
    next = next.map((p) => (p.id === id ? { ...p, ...input } : p))
  } else {
    next = [
      {
        id: `prod-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...input,
      },
      ...next,
    ]
  }
  saveDemoProducts(next)
  return Promise.resolve()
}

export function removeProduct(id: string): Promise<void> {
  const sb = getSupabase()
  if (sb) {
    return (async () => {
      const { error } = await sb.from('products').delete().eq('id', id)
      if (error) throw error
    })()
  }
  saveDemoProducts(getDemoProducts().filter((p) => p.id !== id))
  return Promise.resolve()
}

export function bumpStock(productId: string, delta: number): Promise<void> {
  const sb = getSupabase()
  if (sb) {
    return (async () => {
      const { data: current } = await sb
        .from('products')
        .select('stock_qty')
        .eq('id', productId)
        .maybeSingle()
      const next = Math.max(0, ((current as { stock_qty?: number } | null)?.stock_qty ?? 0) + delta)
      const { error } = await sb.from('products').update({ stock_qty: next }).eq('id', productId)
      if (error) throw error
    })()
  }
  const next = getDemoProducts().map((p) =>
    p.id === productId ? { ...p, stock_qty: Math.max(0, p.stock_qty + delta) } : p,
  )
  saveDemoProducts(next)
  return Promise.resolve()
}

export type OrderInput = {
  customer_name: string
  customer_email: string
  customer_note: string
}

export type OrderItemInput = {
  product_id: string
  qty: number
  unit_price: number
}

export function placeOrder(
  input: OrderInput,
  items: OrderItemInput[],
): Promise<{ id: string }> {
  const sb = getSupabase()
  if (sb) {
    return (async () => {
      const { data: order, error: oe } = await sb
        .from('orders')
        .insert({ ...input, status: 'new' satisfies OrderStatus })
        .select('id')
        .single()
      if (oe) throw oe
      const oid = (order as { id: string }).id
      if (items.length) {
        const { error: ie } = await sb
          .from('order_items')
          .insert(items.map((i) => ({ order_id: oid, ...i })))
        if (ie) throw ie
      }
      return { id: oid }
    })()
  }
  const id = `ord-${Date.now()}`
  const order: OrderWithItems = {
    id,
    customer_name: input.customer_name,
    customer_email: input.customer_email,
    customer_note: input.customer_note,
    status: 'new',
    created_at: new Date().toISOString(),
    items: items.map((i, n) => ({
      id: `item-${id}-${n}`,
      order_id: id,
      product_id: i.product_id,
      qty: i.qty,
      unit_price: i.unit_price,
      product: getDemoProducts().find((p) => p.id === i.product_id),
    })),
  }
  saveDemoOrders([order, ...getDemoOrders()])
  return Promise.resolve({ id })
}

export function trackByEmail(email: string): Promise<OrderWithItems[]> {
  const q = email.trim().toLowerCase()
  const sb = getSupabase()
  if (sb) {
    return (async () => {
      const { data } = await sb
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('customer_email', q)
        .order('created_at', { ascending: false })
      const rows = (data ?? []) as unknown as OrderWithItems[]
      const pids = [...new Set(rows.flatMap((o) => o.items.map((i) => i.product_id)))]
      if (pids.length) {
        const { data: prods } = await sb.from('products').select('*').in('id', pids)
        const map = new Map((prods ?? []).map((p) => [p.id, p]))
        for (const o of rows) {
          for (const it of o.items) {
            const p = map.get(it.product_id)
            if (p) it.product = p
          }
        }
      }
      return rows
    })()
  }
  return Promise.resolve(
    getDemoOrders().filter((o) => o.customer_email.toLowerCase() === q),
  )
}

/** Choose a product photo: uploads to Supabase Storage, or falls back to inline data URL if bucket is not ready. */
export async function pickProductImage(file: File): Promise<string> {
  const sb = getSupabase()
  if (sb) {
    try {
      return await uploadProductImage(file)
    } catch (err) {
      console.warn('Supabase storage upload failed, falling back to data URL:', err)
    }
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the file'))
    reader.readAsDataURL(file)
  })
  return dataUrl
}

export function productDetail(id: string): Promise<Product | null> {
  const sb = getSupabase()
  if (sb) {
    return (async () => {
      const { data } = await sb.from('products').select('*').eq('id', id).maybeSingle()
      return (data as Product | null) ?? null
    })()
  }
  return Promise.resolve(getDemoProducts().find((p) => p.id === id) ?? null)
}

export function productForEdit(id: string): Promise<Product | null> {
  return productDetail(id)
}

export function setOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const sb = getSupabase()
  if (sb) {
    return (async () => {
      const { error } = await sb.from('orders').update({ status }).eq('id', orderId)
      if (error) throw error
    })()
  }
  saveDemoOrders(
    getDemoOrders().map((o) => (o.id === orderId ? { ...o, status } : o)),
  )
  return Promise.resolve()
}

export function allOrders(): Promise<OrderWithItems[]> {
  const sb = getSupabase()
  if (sb) {
    return (async () => {
      const { data } = await sb
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false })
      const rows = (data ?? []) as unknown as OrderWithItems[]
      const pids = [...new Set(rows.flatMap((o) => o.items.map((i) => i.product_id)))]
      if (pids.length) {
        const { data: prods } = await sb.from('products').select('*').in('id', pids)
        const map = new Map((prods ?? []).map((p) => [p.id, p]))
        for (const o of rows) {
          for (const it of o.items) {
            const p = map.get(it.product_id)
            if (p) it.product = p
          }
        }
      }
      return rows
    })()
  }
  return Promise.resolve(getDemoOrders())
}

export function allProducts(): Promise<Product[]> {
  const sb = getSupabase()
  if (sb) {
    return (async () => {
      const { data } = await sb
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      return (data ?? []) as Product[]
    })()
  }
  return Promise.resolve(getDemoProducts())
}
