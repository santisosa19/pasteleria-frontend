export type DashboardModule = {
  title: string
  description: string
  permissions: string[]
  path: string
  icon: string
  accent: 'pink' | 'blue' | 'yellow' | 'lilac'
}

export const dashboardModules: DashboardModule[] = [
  {
    title: 'Ventas',
    description: 'Caja, historial y anulaciones.',
    permissions: ['sales:create', 'sales:read', 'sales:cancel'],
    path: '/ventas',
    icon: '$',
    accent: 'pink',
  },
  {
    title: 'Pedidos',
    description: 'Produccion, entregas y estados.',
    permissions: ['orders:create', 'orders:read', 'orders:status:update', 'orders:convert-to-sale'],
    path: '/pedidos',
    icon: 'P',
    accent: 'blue',
  },
  {
    title: 'Clientes',
    description: 'Datos y contacto de clientes.',
    permissions: ['customers:create', 'customers:read', 'customers:update', 'customers:delete'],
    path: '/clientes',
    icon: 'C',
    accent: 'yellow',
  },
  {
    title: 'Pagos',
    description: 'Cobros y estados de pago.',
    permissions: ['payments:create', 'payments:read', 'payments:status:update'],
    path: '/pagos',
    icon: '%',
    accent: 'lilac',
  },
  {
    title: 'Unidades',
    description: 'Medidas base y conversiones.',
    permissions: ['measurement-units:create', 'measurement-units:update', 'measurement-units:delete'],
    path: '/unidades',
    icon: 'U',
    accent: 'blue',
  },
  {
    title: 'Productos',
    description: 'Precios, recetas y publicacion.',
    permissions: ['products:create', 'products:update', 'products:delete', 'products:profit:read'],
    path: '/productos',
    icon: 'Pr',
    accent: 'pink',
  },
  {
    title: 'Recetas',
    description: 'Ingredientes, costos y rendimiento.',
    permissions: ['recipes:create', 'recipes:update', 'recipes:delete', 'recipes:cost:read'],
    path: '/recetas',
    icon: 'R',
    accent: 'yellow',
  },
  {
    title: 'Materias primas',
    description: 'Insumos, costos y stock minimo.',
    permissions: ['raw-materials:create', 'raw-materials:update', 'raw-materials:delete'],
    path: '/materias-primas',
    icon: 'M',
    accent: 'blue',
  },
  {
    title: 'Inventario',
    description: 'Movimientos y ajustes de stock.',
    permissions: ['inventory:movements:read', 'inventory:low-stock:read', 'inventory:adjustments:create'],
    path: '/inventario',
    icon: 'I',
    accent: 'lilac',
  },
  {
    title: 'Compras',
    description: 'Ingreso de compras y costos.',
    permissions: ['purchases:create', 'purchases:read'],
    path: '/compras',
    icon: 'Co',
    accent: 'yellow',
  },
  {
    title: 'Proveedores',
    description: 'Datos comerciales y contacto.',
    permissions: ['suppliers:create', 'suppliers:update', 'suppliers:delete'],
    path: '/proveedores',
    icon: 'S',
    accent: 'blue',
  },
  {
    title: 'Reportes',
    description: 'Resumenes y rentabilidad.',
    permissions: ['reports:sales-summary:read', 'reports:product-margins:read', 'reports:purchases-by-supplier:read', 'reports:raw-material-consumption:read'],
    path: '/reportes',
    icon: 'G',
    accent: 'pink',
  },
  {
    title: 'Usuarios',
    description: 'Altas, roles y estado de cuentas.',
    permissions: ['users:create', 'users:read', 'users:update', 'users:disable'],
    path: '/usuarios',
    icon: 'Us',
    accent: 'lilac',
  },
]
