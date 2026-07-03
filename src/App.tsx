import './App.css'

function App() {
  const modules = [
    'Materias primas',
    'Recetas',
    'Productos',
    'Compras',
    'Stock',
    'Ventas',
    'Reportes',
    'Ecommerce futuro',
  ]

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="eyebrow">Sistema integral para pasteleria</div>
        <h1>Gestion operativa, costos, stock y ventas en un solo lugar.</h1>
        <p>
          Plataforma modular pensada para reemplazar planillas por procesos
          trazables, datos consistentes y una base lista para ecommerce.
        </p>
        <div className="actions">
          <a href="http://localhost:3000/docs" target="_blank" rel="noreferrer">
            Ver API Swagger
          </a>
          <span>Backend: http://localhost:3000/api/v1/health</span>
        </div>
      </section>

      <section className="panel" aria-label="Modulos iniciales">
        <div>
          <span className="panel-kicker">Fase 1</span>
          <h2>Base funcional</h2>
        </div>
        <div className="module-grid">
          {modules.map((module) => (
            <article className="module-card" key={module}>
              {module}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
