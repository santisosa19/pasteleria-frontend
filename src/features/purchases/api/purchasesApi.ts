import { apiRequest } from '../../../shared/api/apiClient'
import type { MeasurementUnit } from '../../measurement-units/api/measurementUnitsApi'
import type { RawMaterial } from '../../raw-materials/api/rawMaterialsApi'
import type { Supplier } from '../../suppliers/api/suppliersApi'

export type PurchaseItem = {
  id: string
  rawMaterialId: string
  rawMaterial: RawMaterial
  quantity: number | string
  unitId: string
  unit: MeasurementUnit
  unitCost: number | string
  subtotal: number | string
}

export type Purchase = {
  id: string
  supplierId: string | null
  supplier: Supplier | null
  invoiceNo: string | null
  purchasedAt: string
  totalAmount: number | string
  notes: string | null
  createdBy: {
    id: string
    username: string
    firstName: string
    lastName: string
  }
  items: PurchaseItem[]
}

export type PurchasePayload = {
  supplierId?: string | null
  invoiceNo?: string | null
  purchasedAt?: string
  notes?: string | null
  items: Array<{
    rawMaterialId: string
    quantity: number
    unitId: string
    unitCost: number
  }>
}

export function listPurchases() {
  return apiRequest<Purchase[]>('/purchases')
}

export function createPurchase(payload: PurchasePayload) {
  return apiRequest<Purchase>('/purchases', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}
