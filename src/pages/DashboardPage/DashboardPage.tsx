import './DashboardPage.css'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { dashboardModules } from '../../features/dashboard/model/dashboardModules'

const shortcuts = [
  {
    path: '/pedidos',
    description: 'Encargos, estados y entregas.',
    iconPath: 'M8 5H5v16h14V5h-3M8 3h8v4H8zM8 11h8M8 15h6',
  },
  {
    path: '/ventas',
    description: 'Registro e historial de ventas.',
    iconPath: 'M5 3h14v18l-3.5-2L12 21l-3.5-2L5 21V3zM9 8h6m-6 4h6',
  },
  {
    path: '/productos',
    description: 'Precios y productos publicados.',
    iconPath: 'M3 7V3h7l10 10-7 7L3 10V7zM7 7h.01',
  },
  {
    path: '/recetas',
    description: 'Ingredientes y rendimiento.',
    iconPath: 'M12 6c-2-2-5-2-9-2v15c4 0 7 0 9 2 2-2 5-2 9-2V4c-4 0-7 0-9 2zm0 0v15',
  },
  {
    path: '/compras',
    description: 'Compras de insumos y sus costos.',
    iconPath: 'M4 8h16l1 13H3L4 8zm4 2V6a4 4 0 0 1 8 0v4',
  },
]

export function DashboardPage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  const visibleModules = dashboardModules.filter((module) =>
    module.permissions.some((permission) => user.permissions.includes(permission)),
  )

  const quickAccessModules = shortcuts.flatMap((shortcut) => {
    const module = visibleModules.find((module) => module.path === shortcut.path)
    return module ? [{ ...shortcut, title: module.title, accent: module.accent }] : []
  })

  return (
    <section className="operations-home">
      <header className="operations-home-intro">
        <h1>Inicio</h1>
        <p>Hola, {user.firstName}.</p>
      </header>

      <h2 id="operations-shortcuts-title">Accesos r&aacute;pidos</h2>
      {quickAccessModules.length > 0 ? (
        <nav aria-labelledby="operations-shortcuts-title">
          <ul className="operations-home-grid">
            {quickAccessModules.map(({ path, title, accent, description, iconPath }) => (
              <li key={path}>
                <Link className="operations-shortcut" data-accent={accent} to={path}>
                  <span className="operations-shortcut-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d={iconPath} />
                    </svg>
                  </span>
                  <span className="operations-shortcut-copy">
                    <strong>{title}</strong>
                    <span>{description}</span>
                  </span>
                  <svg className="operations-shortcut-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M5 12h14m-5-5 5 5-5 5" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : (
        <div className="operations-home-empty">
          <strong>No hay accesos r&aacute;pidos para tu cuenta.</strong>
          <p>
            {visibleModules.length > 0
              ? <>Pod&eacute;s abrir los m&oacute;dulos disponibles desde el men&uacute;.</>
              : <>Si necesit&aacute;s acceso, ped&iacute;selo a quien administra tu cuenta.</>}
          </p>
        </div>
      )}
    </section>
  )
}
