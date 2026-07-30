import { apiRequest } from '../../../shared/api/apiClient'
import type { RawMaterial } from '../../raw-materials/api/rawMaterialsApi'

export type StockMovementType = 'PURCHASE_IN' | 'SALE_OUT' | 'PRODUCTION_OUT' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT'
export type StockMovementSourceType = 'PURCHASE' | 'SALE' | 'ORDER' | 'MANUAL_ADJUSTMENT'

export type StockMovement = {
  id: string
  rawMaterialId: string
  rawMaterial: RawMaterial
  type: StockMovementType
  quantityBase: number | string
  unitCostSnapshot: number | string | null
  sourceType: StockMovementSourceType
  sourceId: string | null
  note: string | null
  createdBy: {
    id: string
    username: string
    firstName: string
    lastName: string
  }
  createdAt: string
}

export type StockMovementQuery = {
  from?: string
  rawMaterialId?: string
  sourceType?: StockMovementSourceType
  take?: number
  to?: string
  type?: StockMovementType
}

export type StockAdjustmentPayload = {
  note: string
  quantity: number
  rawMaterialId: string
  type: Extract<StockMovementType, 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT'>
  unitId: string
}

export function listStockMovements(query: StockMovementQuery = {}) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  })

  const queryString = params.toString()
  return apiRequest<StockMovement[]>(`/inventory/movements${queryString ? `?${queryString}` : ''}`)
}

export function listLowStock() {
  return apiRequest<RawMaterial[]>('/inventory/low-stock')
}

export function createStockAdjustment(payload: StockAdjustmentPayload) {
  return apiRequest<StockMovement>('/inventory/adjustments', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}
