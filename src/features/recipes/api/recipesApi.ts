import { apiRequest } from '../../../shared/api/apiClient'
import type { MeasurementUnit } from '../../measurement-units/api/measurementUnitsApi'

export type RecipeSummary = {
  id: string
  name: string
  yieldQuantity: number | string
  yieldUnit: MeasurementUnit
  isActive: boolean
}

export function listRecipes() {
  return apiRequest<RecipeSummary[]>('/recipes')
}
