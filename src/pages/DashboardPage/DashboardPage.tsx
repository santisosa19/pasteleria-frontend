import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { dashboardModules } from '../../features/dashboard/model/dashboardModules'

const metricCards = [
  { label: 'Ventas de hoy', value: '$0', detail: 'Listo para conectar a reportes', trend: '+0%' },
  { label: 'Pedidos pendientes', value: '0', detail: 'Produccion y entregas', trend: '0' },
  { label: 'Stock bajo', value: '0', detail: 'Insumos bajo minimo', trend: 'Sin alertas' },
  { label: 'Ingresos del mes', value: '$0', detail: 'Resumen mensual', trend: '+0%' },
]

const alerts = [
  'Insumos bajo stock minimo',
  'Pedidos proximos a entregar',
  'Pagos pendientes de conciliacion',
  'Productos sin receta o costo estimado',
]

export function DashboardPage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  const visibleModules = dashboardModules.filter((module) =>
    user.permissions.includes(module.permission),
  )
  const quickAccessModules = visibleModules.slice(0, 6)
  const currentDate = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'full',
  }).format(new Date())

  return (
    <section className="dashboard-overview">
      <section className="overview-hero">
        <div>
          <span className="eyebrow">{currentDate}</span>
          <h1>Resumen del negocio</h1>
          <p>Hola, {user.firstName}. Este panel queda preparado para ver ventas, pedidos, stock y rentabilidad de Agui Pasteleria.</p>
        </div>
        <div className="hero-status-card">
          <span>Sesion activa</span>
          <strong>{user.role.name}</strong>
          <small>{visibleModules.length} modulos disponibles</small>
        </div>
      </section>

      <section className="metric-grid" aria-label="Metricas principales">
        {metricCards.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
            <small>{metric.trend}</small>
          </article>
        ))}
      </section>

      <section className="insight-grid">
        <article className="page-card chart-card chart-card-large">
          <div className="card-heading">
            <div>
              <span className="eyebrow">Tendencia</span>
              <h2>Ventas y pedidos</h2>
            </div>
            <small>Proximamente API</small>
          </div>
          <div className="chart-placeholder" aria-label="Grafico pendiente de conexion">
            <span style={{ height: '35%' }} />
            <span style={{ height: '58%' }} />
            <span style={{ height: '46%' }} />
            <span style={{ height: '74%' }} />
            <span style={{ height: '64%' }} />
            <span style={{ height: '82%' }} />
            <span style={{ height: '70%' }} />
          </div>
        </article>

        <article className="page-card alert-panel">
          <div className="card-heading">
            <div>
              <span className="eyebrow">Alertas</span>
              <h2>Atencion operativa</h2>
            </div>
          </div>
          <div className="alert-list">
            {alerts.map((alert) => (
              <div className="alert-item" key={alert}>
                <span />
                <p>{alert}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="quick-access-section">
        <div className="card-heading">
          <div>
            <span className="eyebrow">Accesos rapidos</span>
            <h2>Modulos principales</h2>
          </div>
        </div>
        <div className="module-grid compact-module-grid" aria-label="Modulos disponibles">
          {quickAccessModules.map((module) => (
            <Link className={`module-card module-card-${module.accent}`} key={module.title} to={module.path}>
              <span className="module-card-icon">{module.icon}</span>
              <small>{module.permission}</small>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </section>
  )
}
