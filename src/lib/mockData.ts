import type { OrderWithItems, Product } from './types'
import { BEAR_SVG, COASTER_SVG, PILLOW_SVG, FROG_SVG } from './crochetSvgs'

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Amigurumi Bear',
    description: 'A hand-crocheted teddy bear, about 15 cm tall. Filled with soft hypoallergenic wool. Washable and durable.',
    price: 24,
    image_url: BEAR_SVG,
    category: 'Amigurumi',
    is_active: true,
    show_stock: true,
    stock_qty: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Dahlia Coasters (set of 6)',
    description: 'Floral-inspired coasters in 6 muted pastels. Felt-backed so they grip the table and absorb moisture.',
    price: 18.5,
    image_url: COASTER_SVG,
    category: 'Coasters',
    is_active: true,
    show_stock: true,
    stock_qty: 12,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Chunky Toss Pillow',
    description: 'Oversized cushion cover, chunky cotton yarn with coconut shell button closure. Crocheted strictly to order in any custom colour.',
    price: 39,
    image_url: PILLOW_SVG,
    category: 'Home Decor',
    is_active: true,
    show_stock: false, // Made to order — stock is hidden from customer
    stock_qty: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Woodland Frog',
    description: 'Little posable frog that sits happily on bookshelves or desks. Hand-embroidered eyes and felt cheeks.',
    price: 22,
    image_url: FROG_SVG,
    category: 'Amigurumi',
    is_active: true,
    show_stock: true,
    stock_qty: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
]

export const INITIAL_ORDERS: OrderWithItems[] = [
  {
    id: 'ord-101',
    customer_name: 'Maya Lin',
    customer_email: 'maya@example.com',
    customer_note: 'Can you use sage green yarn for the frog if possible?',
    status: 'in_progress',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    items: [
      {
        id: 'item-1',
        order_id: 'ord-101',
        product_id: 'prod-4',
        qty: 1,
        unit_price: 22,
        product: INITIAL_PRODUCTS[3],
      },
      {
        id: 'item-2',
        order_id: 'ord-101',
        product_id: 'prod-2',
        qty: 1,
        unit_price: 18.5,
        product: INITIAL_PRODUCTS[1],
      },
    ],
  },
  {
    id: 'ord-102',
    customer_name: 'Lucas Thorne',
    customer_email: 'lucas@example.com',
    customer_note: 'Birthday gift for my sister on Friday!',
    status: 'new',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    items: [
      {
        id: 'item-3',
        order_id: 'ord-102',
        product_id: 'prod-1',
        qty: 2,
        unit_price: 24,
        product: INITIAL_PRODUCTS[0],
      },
    ],
  },
  {
    id: 'ord-103',
    customer_name: 'Elena Rostova',
    customer_email: 'elena@example.com',
    customer_note: 'Neutral cream pillow please.',
    status: 'shipped',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    items: [
      {
        id: 'item-4',
        order_id: 'ord-103',
        product_id: 'prod-3',
        qty: 1,
        unit_price: 39,
        product: INITIAL_PRODUCTS[2],
      },
    ],
  },
  {
    id: 'ord-104',
    customer_name: 'Priya Sharma',
    customer_email: 'priya@example.com',
    customer_note: '',
    status: 'delivered',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    items: [
      {
        id: 'item-5',
        order_id: 'ord-104',
        product_id: 'prod-2',
        qty: 2,
        unit_price: 18.5,
        product: INITIAL_PRODUCTS[1],
      },
    ],
  },
]

export function getDemoProducts(): Product[] {
  const raw = localStorage.getItem('zenithrilled_demo_products')
  if (!raw) {
    localStorage.setItem('zenithrilled_demo_products', JSON.stringify(INITIAL_PRODUCTS))
    return INITIAL_PRODUCTS
  }
  try {
    return JSON.parse(raw)
  } catch {
    return INITIAL_PRODUCTS
  }
}

export function saveDemoProducts(products: Product[]): void {
  localStorage.setItem('zenithrilled_demo_products', JSON.stringify(products))
}

export function getDemoOrders(): OrderWithItems[] {
  const raw = localStorage.getItem('zenithrilled_demo_orders')
  if (!raw) {
    localStorage.setItem('zenithrilled_demo_orders', JSON.stringify(INITIAL_ORDERS))
    return INITIAL_ORDERS
  }
  try {
    return JSON.parse(raw)
  } catch {
    return INITIAL_ORDERS
  }
}

export function saveDemoOrders(orders: OrderWithItems[]): void {
  localStorage.setItem('zenithrilled_demo_orders', JSON.stringify(orders))
}
