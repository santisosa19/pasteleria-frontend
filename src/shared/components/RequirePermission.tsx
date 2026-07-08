import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'

type RequirePermissionProps = {
  permission: string
}

export function RequirePermission({ permission }: RequirePermissionProps) {
  const { user } = useAuth()

  if (!user?.permissions.includes(permission)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
