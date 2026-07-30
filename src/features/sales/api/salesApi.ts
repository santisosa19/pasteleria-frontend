import { apiRequest } from '../../../shared/api/apiClient'
import type { Product } from '../../products/api/productsApi'

export type SaleStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

export type SaleItem = {
  id: string
  saleId: string
  productId: string
  product: Product
  quantity: number | string
  unitPrice: number | string
  unitCostEstimate: number | string
  subtotal: number | string
  profitEstimate: number | string
}

export type Sale = {
  id: string
  status: SaleStatus
  soldAt: string
  subtotal: number | string
  discount: number | string
  totalAmount: number | string
  grossProfit: number | string
  orderId: string | null
  createdBy: {
    id: string
    username: string
    firstName: string
    lastName: string
  }
  items: SaleItem[]
  createdAt: string
  updatedAt: string
}

export type SaleItemPayload = {
  productId: string
  quantity: number
  unitPrice?: number
}

export type CreateSalePayload = {
  discount?: number
  items: SaleItemPayload[]
  soldAt?: string
}

export function listSales() {
  return apiRequest<Sale[]>('/sales')
}

export function createSale(payload: CreateSalePayload) {
  return apiRequest<Sale>('/sales', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function cancelSale(id: string, reason?: string) {
  return apiRequest<Sale>(`/sales/${id}/cancel`, {
    body: JSON.stringify({ reason }),
    method: 'POST',
  })
}
