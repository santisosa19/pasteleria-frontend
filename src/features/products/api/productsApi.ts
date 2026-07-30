import { apiRequest } from '../../../shared/api/apiClient'
import type { RecipeSummary } from '../../recipes/api/recipesApi'

export type Product = {
  id: string
  name: string
  description: string | null
  sku: string | null
  recipeId: string | null
  recipe: RecipeSummary | null
  salePrice: number | string
  isPublished: boolean
  isActive: boolean
}

export type ProductPayload = {
  name: string
  description?: string | null
  sku?: string | null
  recipeId?: string | null
  salePrice: number
  isPublished?: boolean
  isActive?: boolean
}

export function listProducts() {
  return apiRequest<Product[]>('/products')
}

export function createProduct(payload: ProductPayload) {
  return apiRequest<Product>('/products', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateProduct(id: string, payload: Partial<ProductPayload>) {
  return apiRequest<Product>(`/products/${id}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })
}

export function deleteProduct(id: string) {
  return apiRequest<Product>(`/products/${id}`, {
    method: 'DELETE',
  })
}
