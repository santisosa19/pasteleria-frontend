import { apiRequest } from '../../../shared/api/apiClient'

export type Supplier = {
  id: string
  name: string
  taxId: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  isActive: boolean
}

export type SupplierPayload = {
  name: string
  taxId?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  isActive?: boolean
}

export function listSuppliers() {
  return apiRequest<Supplier[]>('/suppliers')
}

export function createSupplier(payload: SupplierPayload) {
  return apiRequest<Supplier>('/suppliers', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateSupplier(id: string, payload: Partial<SupplierPayload>) {
  return apiRequest<Supplier>(`/suppliers/${id}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })
}

export function deleteSupplier(id: string) {
  return apiRequest<Supplier>(`/suppliers/${id}`, {
    method: 'DELETE',
  })
}
