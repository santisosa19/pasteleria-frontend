import { apiRequest } from '../../../shared/api/apiClient'

export type MeasurementKind = 'MASS' | 'VOLUME' | 'UNIT'

export type MeasurementUnit = {
  id: string
  code: string
  name: string
  kind: MeasurementKind
  conversionRateToBase: number | string
  isBase: boolean
}

export type MeasurementUnitPayload = {
  code: string
  name: string
  kind: MeasurementKind
  conversionRateToBase: number
  isBase?: boolean
}

export function listMeasurementUnits() {
  return apiRequest<MeasurementUnit[]>('/measurement-units')
}

export function createMeasurementUnit(payload: MeasurementUnitPayload) {
  return apiRequest<MeasurementUnit>('/measurement-units', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateMeasurementUnit(id: string, payload: Partial<MeasurementUnitPayload>) {
  return apiRequest<MeasurementUnit>(`/measurement-units/${id}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })
}

export function deleteMeasurementUnit(id: string) {
  return apiRequest<{ success: boolean }>(`/measurement-units/${id}`, {
    method: 'DELETE',
  })
}
