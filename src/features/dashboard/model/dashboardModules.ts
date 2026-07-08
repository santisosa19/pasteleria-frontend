export type DashboardModule = {
  title: string
  description: string
  permission: string
  path: string
  icon: string
  accent: 'pink' | 'blue' | 'yellow' | 'lilac'
}

export const dashboardModules: DashboardModule[] = [
  {
    title: 'Ventas',
    description: 'Caja, historial y anulaciones.',
    permission: 'sales:manage',
    path: '/ventas',
    icon: '$',
    accent: 'pink',
  },
  {
    title: 'Pedidos',
    description: 'Produccion, entregas y estados.',
    permission: 'orders:manage',
    path: '/pedidos',
    icon: 'P',
    accent: 'blue',
  },
  {
    title: 'Clientes',
    description: 'Datos y contacto de clientes.',
    permission: 'customers:manage',
    path: '/clientes',
    icon: 'C',
    accent: 'yellow',
  },
  {
    title: 'Pagos',
    description: 'Cobros y estados de pago.',
    permission: 'payments:manage',
    path: '/pagos',
    icon: '%',
    accent: 'lilac',
  },
  {
    title: 'Unidades',
    description: 'Medidas base y conversiones.',
    permission: 'measurement-units:manage',
    path: '/unidades',
    icon: 'U',
    accent: 'blue',
  },
  {
    title: 'Productos',
    description: 'Precios, recetas y publicacion.',
    permission: 'products:manage',
    path: '/productos',
    icon: 'Pr',
    accent: 'pink',
  },
  {
    title: 'Recetas',
    description: 'Ingredientes, costos y rendimiento.',
    permission: 'recipes:manage',
    path: '/recetas',
    icon: 'R',
    accent: 'yellow',
  },
  {
    title: 'Materias primas',
    description: 'Insumos, costos y stock minimo.',
    permission: 'raw-materials:manage',
    path: '/materias-primas',
    icon: 'M',
    accent: 'blue',
  },
  {
    title: 'Inventario',
    description: 'Movimientos y ajustes de stock.',
    permission: 'inventory:manage',
    path: '/inventario',
    icon: 'I',
    accent: 'lilac',
  },
  {
    title: 'Compras',
    description: 'Ingreso de compras y costos.',
    permission: 'purchases:manage',
    path: '/compras',
    icon: 'Co',
    accent: 'yellow',
  },
  {
    title: 'Proveedores',
    description: 'Datos comerciales y contacto.',
    permission: 'suppliers:manage',
    path: '/proveedores',
    icon: 'S',
    accent: 'blue',
  },
  {
    title: 'Reportes',
    description: 'Resumenes y rentabilidad.',
    permission: 'reports:read',
    path: '/reportes',
    icon: 'G',
    accent: 'pink',
  },
  {
    title: 'Usuarios',
    description: 'Altas, roles y estado de cuentas.',
    permission: 'users:read',
    path: '/usuarios',
    icon: 'Us',
    accent: 'lilac',
  },
]
