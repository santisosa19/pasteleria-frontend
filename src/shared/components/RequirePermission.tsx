import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'

type RequirePermissionProps = {
  mode?: 'all' | 'any'
  permission?: string
  permissions?: string[]
}

export function RequirePermission({ mode = 'all', permission, permissions = [] }: RequirePermissionProps) {
  const { user } = useAuth()
  const requiredPermissions = permission ? [permission, ...permissions] : permissions
  const hasAccess = mode === 'any'
    ? requiredPermissions.some((requiredPermission) => user?.permissions.includes(requiredPermission))
    : requiredPermissions.every((requiredPermission) => user?.permissions.includes(requiredPermission))

  if (!requiredPermissions.length || !hasAccess) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
