import { apiRequest } from '../../../shared/api/apiClient'

export type UserSummary = {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  role: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

export type UserPayload = {
  email: string
  firstName: string
  lastName: string
  password?: string
  roleId: string
  username: string
  isActive?: boolean
}

export function listUsers() {
  return apiRequest<UserSummary[]>('/users')
}

export function createUser(payload: UserPayload) {
  return apiRequest<UserSummary>('/users', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateUser(id: string, payload: Partial<UserPayload>) {
  return apiRequest<UserSummary>(`/users/${id}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })
}

export function disableUser(id: string) {
  return apiRequest<UserSummary>(`/users/${id}/disable`, {
    method: 'PATCH',
  })
}
