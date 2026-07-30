import { apiRequest } from '../../../shared/api/apiClient'
import type { Permission } from '../../permissions/api/permissionsApi'

export type RolePermission = {
  id: string
  permissionId: string
  permission: Permission
}

export type Role = {
  id: string
  name: string
  permissions: RolePermission[]
  _count?: {
    users: number
  }
}

export type RolePayload = {
  name: string
  permissionIds?: string[]
}

export function listRoles() {
  return apiRequest<Role[]>('/roles')
}

export function createRole(payload: RolePayload) {
  return apiRequest<Role>('/roles', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function updateRole(id: string, payload: Partial<RolePayload>) {
  return apiRequest<Role>(`/roles/${id}`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })
}

export function updateRolePermissions(id: string, permissionIds: string[]) {
  return apiRequest<Role>(`/roles/${id}/permissions`, {
    body: JSON.stringify({ permissionIds }),
    method: 'PATCH',
  })
}

export function deleteRole(id: string) {
  return apiRequest<{ success: boolean }>(`/roles/${id}`, {
    method: 'DELETE',
  })
}
