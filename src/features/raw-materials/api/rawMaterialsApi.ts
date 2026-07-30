import { apiRequest } from '../../../shared/api/apiClient'
import type { MeasurementUnit } from '../../measurement-units/api/measurementUnitsApi'

export type RawMaterial = {
  id: string
  name: string
  description: string | null
  baseUnitId: string
  baseUnit: MeasurementUnit
  currentStock: number | string
  minimumStock: number | string
  averageCost: number | string
  lastPurchaseCost: number | string | null
  isActive: boolean
}

export type RawMaterialPayload = {
  name: string
  description?: string | null
  baseUnitId: string
  currentStock?: number
  minimumStock?: number
  averageCost?: number
  lastPurchaseCost?: number
  isActive?: boolean
}

export function listRawMaterials() {
  return apiRequest<RawMaterial[]>('/raw-materials')
}

export function createRawMaterial(payload: RawMaterialPayload) {
  return apiRequest<RawMaterial>('/raw-materials', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateRawMaterial(id: string, payload: Partial<RawMaterialPayload>) {
  return apiRequest<RawMaterial>(`/raw-materials/${id}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })
}

export function deleteRawMaterial(id: string) {
  return apiRequest<RawMaterial>(`/raw-materials/${id}`, {
    method: 'DELETE',
  })
}
