import { apiRequest } from '../../../shared/api/apiClient'
import type { MeasurementUnit } from '../../measurement-units/api/measurementUnitsApi'
import type { RawMaterial } from '../../raw-materials/api/rawMaterialsApi'

export type RecipeSummary = {
  id: string
  name: string
  yieldQuantity: number | string
  yieldUnit: MeasurementUnit
  isActive: boolean
}

export type RecipeIngredient = {
  id: string
  rawMaterialId: string
  rawMaterial: RawMaterial
  quantity: number | string
  unitId: string
  unit: MeasurementUnit
}

export type Recipe = RecipeSummary & {
  description: string | null
  yieldUnitId: string
  instructions: string | null
  ingredients: RecipeIngredient[]
}

export type RecipeIngredientPayload = {
  rawMaterialId: string
  quantity: number
  unitId: string
}

export type RecipePayload = {
  name: string
  description?: string | null
  yieldQuantity: number
  yieldUnitId: string
  instructions?: string | null
  isActive?: boolean
  ingredients: RecipeIngredientPayload[]
}

export type RecipeCost = {
  recipeId: string
  recipeName: string
  yieldQuantity: number
  yieldUnitCode: string
  totalCost: number
  costPerYieldUnit: number
  ingredients: {
    rawMaterialId: string
    rawMaterialName: string
    quantity: number
    unitCode: string
    quantityBase: number
    baseUnitCode: string
    unitBaseCost: number
    totalCost: number
  }[]
}

export function listRecipes() {
  return apiRequest<Recipe[]>('/recipes')
}

export function createRecipe(payload: RecipePayload) {
  return apiRequest<Recipe>('/recipes', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateRecipe(id: string, payload: Partial<RecipePayload>) {
  return apiRequest<Recipe>(`/recipes/${id}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })
}

export function deleteRecipe(id: string) {
  return apiRequest<Recipe>(`/recipes/${id}`, {
    method: 'DELETE',
  })
}

export function getRecipeCost(id: string) {
  return apiRequest<RecipeCost>(`/recipes/${id}/cost`)
}
