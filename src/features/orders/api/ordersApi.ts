import { apiRequest } from '../../../shared/api/apiClient'
import type { Customer } from '../../customers/api/customersApi'
import type { Product } from '../../products/api/productsApi'
import type { Sale } from '../../sales/api/salesApi'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY' | 'DELIVERED' | 'CANCELLED'
export type OrderChannel = 'INTERNAL' | 'ECOMMERCE'

export type OrderItem = {
  id: string
  orderId: string
  productId: string
  product: Product
  quantity: number | string
  unitPrice: number | string
  subtotal: number | string
}

export type PaymentSummary = {
  id: string
  provider: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED'
  amount: number | string
  paidAt: string | null
}

export type Order = {
  id: string
  customerId: string | null
  customer: Customer | null
  channel: OrderChannel
  status: OrderStatus
  requestedDate: string | null
  subtotal: number | string
  discount: number | string
  totalAmount: number | string
  notes: string | null
  items: OrderItem[]
  payments: PaymentSummary[]
  sale: Sale | null
  createdAt: string
  updatedAt: string
}

export type OrderItemPayload = {
  productId: string
  quantity: number
  unitPrice?: number
}

export type CreateOrderPayload = {
  channel?: OrderChannel
  customerId?: string | null
  discount?: number
  items: OrderItemPayload[]
  notes?: string | null
  requestedDate?: string
}

export function listOrders() {
  return apiRequest<Order[]>('/orders')
}

export function createOrder(payload: CreateOrderPayload) {
  return apiRequest<Order>('/orders', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return apiRequest<Order>(`/orders/${id}/status`, {
    body: JSON.stringify({ status }),
    method: 'PATCH',
  })
}

export function convertOrderToSale(id: string) {
  return apiRequest<Sale>(`/orders/${id}/convert-to-sale`, {
    method: 'POST',
  })
}
