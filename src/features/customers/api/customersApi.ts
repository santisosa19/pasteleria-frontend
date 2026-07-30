import { apiRequest } from '../../../shared/api/apiClient'

export type Customer = {
  id: string
  firstName: string
  lastName: string | null
  email: string | null
  phone: string | null
  address: string | null
  _count?: {
    orders: number
  }
  createdAt: string
  updatedAt: string
}

export type CustomerPayload = {
  address?: string | null
  email?: string | null
  firstName: string
  lastName?: string | null
  phone?: string | null
}

export function listCustomers() {
  return apiRequest<Customer[]>('/customers')
}

export function createCustomer(payload: CustomerPayload) {
  return apiRequest<Customer>('/customers', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateCustomer(id: string, payload: Partial<CustomerPayload>) {
  return apiRequest<Customer>(`/customers/${id}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })
}

export function deleteCustomer(id: string) {
  return apiRequest<{ success: boolean }>(`/customers/${id}`, {
    method: 'DELETE',
  })
}
