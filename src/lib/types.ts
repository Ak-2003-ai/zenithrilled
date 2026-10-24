export type Product = {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category?: string
  is_active?: boolean
  show_stock: boolean
  stock_qty: number
  created_at: string
}

export type OrderStatus = 'new' | 'in_progress' | 'shipped' | 'delivered' | 'cancelled'

export type Order = {
  id: string
  customer_name: string
  customer_email: string
  customer_note: string
  status: OrderStatus
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  qty: number
  unit_price: number
  product?: Product
}

export type OrderWithItems = Order & { items: OrderItem[] }

export const ORDER_STATUSES: { value: OrderStatus; label: string; blurb: string }[] = [
  { value: 'new', label: 'New', blurb: 'Just came in, not started yet' },
  { value: 'in_progress', label: 'In progress', blurb: 'Hooks are out, being made' },
  { value: 'shipped', label: 'Shipped', blurb: 'On its way to you' },
  { value: 'delivered', label: 'Delivered', blurb: 'Arrived safely' },
  { value: 'cancelled', label: 'Cancelled', blurb: 'Order was called off' },
]

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
