import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { dashboardModules } from '../../features/dashboard/model/dashboardModules'

const sidebarStorageKey = 'pasteleria:sidebarCollapsed'

export function PrivateLayout() {
  const { logout, user } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    localStorage.getItem(sidebarStorageKey) === 'true',
  )
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const visibleModules = dashboardModules.filter((module) =>
    module.permissions.some((permission) => user?.permissions.includes(permission)),
  )
  const userInitials = `${user?.firstName.charAt(0) ?? ''}${user?.lastName.charAt(0) ?? ''}`

  useEffect(() => {
    localStorage.setItem(sidebarStorageKey, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  const shellClassName = [
    'dashboard-shell',
    isSidebarCollapsed ? 'sidebar-is-collapsed' : '',
    isMobileMenuOpen ? 'mobile-menu-is-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main className={shellClassName}>
      <div className="mobile-backdrop" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />

      <div className="private-layout">
        <aside className="module-sidebar" aria-label="Modulos">
          <div className="sidebar-brand">
            <NavLink className="dashboard-brand" to="/" aria-label="Ir al dashboard" onClick={() => setIsMobileMenuOpen(false)}>
              <img src="/logo.jpeg" alt="Agui Pasteleria" />
              <span>
                <strong>Agui Pasteleria</strong>
                <small>Gestion interna</small>
              </span>
            </NavLink>
            <button className="sidebar-collapse-button" type="button" onClick={() => setIsSidebarCollapsed((current) => !current)} aria-label={isSidebarCollapsed ? 'Mostrar menu' : 'Esconder menu'}>
              {isSidebarCollapsed ? '>' : '<'}
            </button>
          </div>

          <nav className="sidebar-nav">
            <NavLink className="sidebar-link" end to="/" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="sidebar-icon">In</span>
              <span className="sidebar-label">Inicio</span>
            </NavLink>
            {visibleModules.map((module) => (
              <NavLink className="sidebar-link" key={module.path} to={module.path} onClick={() => setIsMobileMenuOpen(false)}>
                <span className="sidebar-icon">{module.icon}</span>
                <span className="sidebar-label">{module.title}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <span className="sidebar-avatar">{user?.firstName.charAt(0)}{user?.lastName.charAt(0)}</span>
            <span className="sidebar-user-data">
              <strong>{user?.firstName} {user?.lastName}</strong>
              <small>{user?.role.name}</small>
            </span>
          </div>
        </aside>

        <section className="workspace-panel">
          <header className="dashboard-header">
            <button className="mobile-menu-button" type="button" onClick={() => setIsMobileMenuOpen(true)} aria-label="Abrir menu">
              <span />
              <span />
              <span />
            </button>

            <NavLink className="topbar-brand" to="/" aria-label="Ir al dashboard">
              <img src="/logo.jpeg" alt="Agui Pasteleria" />
              <strong>Agui Pasteleria</strong>
            </NavLink>

            <div className="topbar-title">
              <span>Panel de gestion</span>
              <strong>Resumen operativo</strong>
            </div>

            <div className="topbar-actions">
              <div className="user-menu">
                <button className="user-menu-button" type="button" onClick={() => setIsUserMenuOpen((current) => !current)} aria-expanded={isUserMenuOpen} aria-label="Abrir menu de usuario">
                  <span>{userInitials}</span>
                </button>

                {isUserMenuOpen ? (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-data">
                      <strong>{user?.firstName} {user?.lastName}</strong>
                      <small>{user?.role.name}</small>
                    </div>
                    <button type="button" onClick={() => { setIsUserMenuOpen(false); void logout() }}>
                      Cerrar sesion
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <section className="private-content">
            <Outlet />
          </section>
        </section>
      </div>
    </main>
  )
}
