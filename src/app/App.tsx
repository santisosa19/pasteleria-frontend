import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../features/auth/model/AuthProvider'
import { useAuth } from '../features/auth/hooks/useAuth'
import { DashboardPage } from '../pages/DashboardPage/DashboardPage'
import { InventoryPage } from '../pages/InventoryPage/InventoryPage'
import { LoginPage } from '../pages/LoginPage/LoginPage'
import { MeasurementUnitsPage } from '../pages/MeasurementUnitsPage/MeasurementUnitsPage'
import { ModulePlaceholderPage } from '../pages/ModulePlaceholderPage/ModulePlaceholderPage'
import { ProductsPage } from '../pages/ProductsPage/ProductsPage'
import { PurchasesPage } from '../pages/PurchasesPage/PurchasesPage'
import { RawMaterialsPage } from '../pages/RawMaterialsPage/RawMaterialsPage'
import { RecipesPage } from '../pages/RecipesPage/RecipesPage'
import { SuppliersPage } from '../pages/SuppliersPage/SuppliersPage'
import { UsersPage } from '../pages/UsersPage/UsersPage'
import { LoadingScreen } from '../shared/components/LoadingScreen'
import { PrivateLayout } from '../shared/components/PrivateLayout'
import { RequirePermission } from '../shared/components/RequirePermission'
import './App.css'

function AppContent() {
  const { isInitializing, user } = useAuth()

  if (isInitializing) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoutes />}>
        <Route element={<PrivateLayout />}>
          <Route index element={<DashboardPage />} />

          <Route element={<RequirePermission mode="any" permissions={['sales:create', 'sales:read', 'sales:cancel']} />}>
            <Route path="ventas" element={<ModulePlaceholderPage title="Ventas" description="Caja, historial y anulaciones." />} />
          </Route>
          <Route element={<RequirePermission mode="any" permissions={['orders:create', 'orders:read', 'orders:status:update', 'orders:convert-to-sale']} />}>
            <Route path="pedidos" element={<ModulePlaceholderPage title="Pedidos" description="Produccion, entregas y estados." />} />
          </Route>
          <Route element={<RequirePermission mode="any" permissions={['customers:create', 'customers:read', 'customers:update', 'customers:delete']} />}>
            <Route path="clientes" element={<ModulePlaceholderPage title="Clientes" description="Datos y contacto de clientes." />} />
          </Route>
          <Route element={<RequirePermission mode="any" permissions={['payments:create', 'payments:read', 'payments:status:update']} />}>
            <Route path="pagos" element={<ModulePlaceholderPage title="Pagos" description="Cobros y estados de pago." />} />
          </Route>
          <Route element={<RequirePermission mode="any" permissions={['measurement-units:create', 'measurement-units:read', 'measurement-units:update', 'measurement-units:delete']} />}>
            <Route path="unidades" element={<MeasurementUnitsPage />} />
          </Route>
          <Route element={<RequirePermission mode="any" permissions={['products:create', 'products:update', 'products:delete', 'products:profit:read']} />}>
            <Route path="productos" element={<ProductsPage />} />
          </Route>
          <Route element={<RequirePermission mode="any" permissions={['recipes:create', 'recipes:update', 'recipes:delete', 'recipes:cost:read']} />}>
            <Route path="recetas" element={<RecipesPage />} />
          </Route>
          <Route element={<RequirePermission mode="any" permissions={['raw-materials:create', 'raw-materials:update', 'raw-materials:delete']} />}>
            <Route path="materias-primas" element={<RawMaterialsPage />} />
          </Route>
          <Route element={<RequirePermission mode="any" permissions={['inventory:movements:read', 'inventory:low-stock:read', 'inventory:adjustments:create']} />}>
            <Route path="inventario" element={<InventoryPage />} />
          </Route>
          <Route element={<RequirePermission mode="any" permissions={['purchases:create', 'purchases:read']} />}>
            <Route path="compras" element={<PurchasesPage />} />
          </Route>
          <Route element={<RequirePermission mode="any" permissions={['suppliers:create', 'suppliers:update', 'suppliers:delete']} />}>
            <Route path="proveedores" element={<SuppliersPage />} />
          </Route>
          <Route element={<RequirePermission mode="any" permissions={['reports:sales-summary:read', 'reports:product-margins:read', 'reports:purchases-by-supplier:read', 'reports:raw-material-consumption:read']} />}>
            <Route path="reportes" element={<ModulePlaceholderPage title="Reportes" description="Resumenes y rentabilidad." />} />
          </Route>
          <Route element={<RequirePermission mode="any" permissions={['users:create', 'users:read', 'users:update', 'users:disable', 'roles:create', 'roles:read', 'roles:update', 'roles:delete', 'roles:permissions:update', 'permissions:read']} />}>
            <Route path="usuarios" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}

function ProtectedRoutes() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
