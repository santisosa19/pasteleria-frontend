import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { dashboardModules } from '../../features/dashboard/model/dashboardModules'

const sidebarStorageKey = 'pasteleria:sidebarCollapsed'

export function PrivateLayout() {
  const { logout, user } = useAuth()
  const { pathname } = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    localStorage.getItem(sidebarStorageKey) === 'true',
  )
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const workspace = useRef<HTMLElement>(null)
  const visibleModules = dashboardModules.filter((module) =>
    module.permissions.some((permission) => user?.permissions.includes(permission)),
  )
  const userInitials = `${user?.firstName.charAt(0) ?? ''}${user?.lastName.charAt(0) ?? ''}`
  const currentTitle = dashboardModules.find((module) => module.path === pathname)?.title ?? 'Inicio'

  useEffect(() => {
    localStorage.setItem(sidebarStorageKey, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMobileMenuOpen) return

    const mobileViewport = window.matchMedia('(max-width: 860px)')
    const trigger = menuButton.current
    const content = workspace.current

    function closeOnDesktop() {
      if (!mobileViewport.matches) setIsMobileMenuOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) setIsMobileMenuOpen(false)
    }

    document.documentElement.classList.add('mobile-navigation-open')
    if (content) content.inert = true
    closeButton.current?.focus({ preventScroll: true })
    document.addEventListener('keydown', closeOnEscape)
    mobileViewport.addEventListener('change', closeOnDesktop)

    return () => {
      document.documentElement.classList.remove('mobile-navigation-open')
      if (content) content.inert = false
      document.removeEventListener('keydown', closeOnEscape)
      mobileViewport.removeEventListener('change', closeOnDesktop)
      if (mobileViewport.matches) trigger?.focus({ preventScroll: true })
    }
  }, [isMobileMenuOpen])

  const shellClassName = [
    'dashboard-shell',
    isSidebarCollapsed ? 'sidebar-is-collapsed' : '',
    isMobileMenuOpen ? 'mobile-menu-is-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main className={shellClassName}>
      <div className="private-layout">
        <div className="mobile-backdrop" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />
        <aside className="module-sidebar" id="module-sidebar" aria-label="Modulos">
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
            <button className="sidebar-collapse-button mobile-menu-close" ref={closeButton} type="button" onClick={() => setIsMobileMenuOpen(false)} aria-label="Cerrar menu">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
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

        <section className="workspace-panel" ref={workspace}>
          <header className="dashboard-header">
            <button className="mobile-menu-button" ref={menuButton} type="button" onClick={() => setIsMobileMenuOpen(true)} aria-label="Abrir menu" aria-controls="module-sidebar" aria-expanded={isMobileMenuOpen}>
              <span />
              <span />
              <span />
            </button>

            <NavLink className="topbar-brand" to="/" aria-label="Ir al dashboard">
              <img src="/logo.jpeg" alt="Agui Pasteleria" />
              <strong>Agui Pasteleria</strong>
            </NavLink>

            <div className="topbar-title">
              <strong>{currentTitle}</strong>
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
