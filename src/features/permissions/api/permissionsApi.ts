import { apiRequest } from '../../../shared/api/apiClient'

export type Permission = {
  id: string
  code: string
  description: string | null
}

export function listPermissions() {
  return apiRequest<Permission[]>('/permissions')
}
