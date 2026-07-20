import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../features/auth/model/AuthProvider'
import { useAuth } from '../features/auth/hooks/useAuth'
import { DashboardPage } from '../pages/DashboardPage/DashboardPage'
import { LoginPage } from '../pages/LoginPage/LoginPage'
import { MeasurementUnitsPage } from '../pages/MeasurementUnitsPage/MeasurementUnitsPage'
import { ModulePlaceholderPage } from '../pages/ModulePlaceholderPage/ModulePlaceholderPage'
import { ProductsPage } from '../pages/ProductsPage/ProductsPage'
import { PurchasesPage } from '../pages/PurchasesPage/PurchasesPage'
import { RawMaterialsPage } from '../pages/RawMaterialsPage/RawMaterialsPage'
import { SuppliersPage } from '../pages/SuppliersPage/SuppliersPage'
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

          <Route element={<RequirePermission permission="sales:manage" />}>
            <Route path="ventas" element={<ModulePlaceholderPage title="Ventas" description="Caja, historial y anulaciones." />} />
          </Route>
          <Route element={<RequirePermission permission="orders:manage" />}>
            <Route path="pedidos" element={<ModulePlaceholderPage title="Pedidos" description="Produccion, entregas y estados." />} />
          </Route>
          <Route element={<RequirePermission permission="customers:manage" />}>
            <Route path="clientes" element={<ModulePlaceholderPage title="Clientes" description="Datos y contacto de clientes." />} />
          </Route>
          <Route element={<RequirePermission permission="payments:manage" />}>
            <Route path="pagos" element={<ModulePlaceholderPage title="Pagos" description="Cobros y estados de pago." />} />
          </Route>
          <Route element={<RequirePermission permission="measurement-units:manage" />}>
            <Route path="unidades" element={<MeasurementUnitsPage />} />
          </Route>
          <Route element={<RequirePermission permission="products:manage" />}>
            <Route path="productos" element={<ProductsPage />} />
          </Route>
          <Route element={<RequirePermission permission="recipes:manage" />}>
            <Route path="recetas" element={<ModulePlaceholderPage title="Recetas" description="Ingredientes, costos y rendimiento." />} />
          </Route>
          <Route element={<RequirePermission permission="raw-materials:manage" />}>
            <Route path="materias-primas" element={<RawMaterialsPage />} />
          </Route>
          <Route element={<RequirePermission permission="inventory:manage" />}>
            <Route path="inventario" element={<ModulePlaceholderPage title="Inventario" description="Movimientos y ajustes de stock." />} />
          </Route>
          <Route element={<RequirePermission permission="purchases:manage" />}>
            <Route path="compras" element={<PurchasesPage />} />
          </Route>
          <Route element={<RequirePermission permission="suppliers:manage" />}>
            <Route path="proveedores" element={<SuppliersPage />} />
          </Route>
          <Route element={<RequirePermission permission="reports:read" />}>
            <Route path="reportes" element={<ModulePlaceholderPage title="Reportes" description="Resumenes y rentabilidad." />} />
          </Route>
          <Route element={<RequirePermission permission="users:read" />}>
            <Route path="usuarios" element={<ModulePlaceholderPage title="Usuarios" description="Altas, roles y estado de cuentas." />} />
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
