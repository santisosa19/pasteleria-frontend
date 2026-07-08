type ModulePlaceholderPageProps = {
  title: string
  description: string
}

export function ModulePlaceholderPage({ title, description }: ModulePlaceholderPageProps) {
  return (
    <section className="page-card empty-state">
      <span className="eyebrow">Modulo preparado</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <p>La ruta, permisos y layout ya estan listos para conectar la pantalla funcional.</p>
    </section>
  )
}
