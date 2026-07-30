import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { listProducts, type Product } from '../../features/products/api/productsApi'
import { cancelSale, createSale, listSales, type Sale, type SaleItemPayload, type SaleStatus } from '../../features/sales/api/salesApi'
import { Modal } from '../../shared/components/Modal'
import { Toast, type ToastState } from '../../shared/components/Toast'
import { getErrorMessage } from '../../shared/utils/errors'
import { emptyToUndefined, formatNumber } from '../../shared/utils/formatters'

type SaleFormItem = {
  productId: string
  quantity: string
  unitPrice: string
}

type SaleForm = {
  discount: string
  items: SaleFormItem[]
  soldAt: string
}

type StatusFilter = 'all' | SaleStatus
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

const initialItem: SaleFormItem = { productId: '', quantity: '1', unitPrice: '' }
const initialForm: SaleForm = { discount: '0', items: [{ ...initialItem }], soldAt: new Date().toISOString().slice(0, 10) }

export function SalesPage() {
  const { user } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<SaleForm>(initialForm)
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortOption>('date-desc')

  const permissions = new Set(user?.permissions ?? [])
  const canCreateSale = permissions.has('sales:create')
  const canReadSales = permissions.has('sales:read')
  const canCancelSale = permissions.has('sales:cancel')
  const canReadProducts = permissions.has('products:read')
  const sellableProducts = products.filter((product) => product.isActive && product.recipeId)
  const formSubtotal = form.items.reduce((sum, item) => {
    const product = products.find((currentProduct) => currentProduct.id === item.productId)
    const unitPrice = Number(item.unitPrice || product?.salePrice || 0)
    return sum + unitPrice * Number(item.quantity || 0)
  }, 0)
  const formDiscount = Number(form.discount || 0)
  const formTotal = Math.max(formSubtotal - formDiscount, 0)
  const filteredSales = [...sales]
    .filter((sale) => {
      const normalizedSearch = search.trim().toLowerCase()
      const matchesSearch = !normalizedSearch || [sale.createdBy.username, sale.createdBy.firstName, sale.createdBy.lastName, sale.items.map((item) => item.product.name).join(' ')]
        .some((value) => value.toLowerCase().includes(normalizedSearch))
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((first, second) => {
      if (sort === 'date-asc') return new Date(first.soldAt).getTime() - new Date(second.soldAt).getTime()
      if (sort === 'amount-desc') return Number(second.totalAmount) - Number(first.totalAmount)
      if (sort === 'amount-asc') return Number(first.totalAmount) - Number(second.totalAmount)
      return new Date(second.soldAt).getTime() - new Date(first.soldAt).getTime()
    })

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [salesData, productsData] = await Promise.all([
          canReadSales ? listSales() : Promise.resolve([]),
          canCreateSale && canReadProducts ? listProducts() : Promise.resolve([]),
        ])

        if (isMounted) {
          setSales(salesData)
          setProducts(productsData)
        }
      } catch (caughtError) {
        if (isMounted) setToast({ message: getErrorMessage(caughtError), tone: 'error' })
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => { isMounted = false }
  }, [canCreateSale, canReadProducts, canReadSales])

  async function refreshSales() {
    if (canReadSales) setSales(await listSales())
  }

  function openCreateModal() {
    setForm({ ...initialForm, items: [{ ...initialItem }], soldAt: new Date().toISOString().slice(0, 10) })
    setError('')
    setIsSaleModalOpen(true)
  }

  function closeCreateModal() {
    if (isSaving) return
    setIsSaleModalOpen(false)
    setForm({ ...initialForm, items: [{ ...initialItem }] })
    setError('')
  }

  function updateItem(index: number, patch: Partial<SaleFormItem>) {
    setForm((currentForm) => ({
      ...currentForm,
      items: currentForm.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }))
  }

  function handleProductChange(index: number, productId: string) {
    const product = products.find((currentProduct) => currentProduct.id === productId)
    updateItem(index, { productId, unitPrice: product ? String(product.salePrice) : '' })
  }

  function addItem() {
    setForm((currentForm) => ({ ...currentForm, items: [...currentForm.items, { ...initialItem }] }))
  }

  function removeItem(index: number) {
    setForm((currentForm) => ({ ...currentForm, items: currentForm.items.filter((_, itemIndex) => itemIndex !== index) }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const items: SaleItemPayload[] = form.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }))

      await createSale({
        discount: Number(form.discount || 0),
        items,
        soldAt: form.soldAt ? new Date(`${form.soldAt}T12:00:00`).toISOString() : undefined,
      })

      await refreshSales()
      setToast({ message: 'Venta registrada correctamente. El stock fue descontado automaticamente.', tone: 'success' })
      closeCreateModal()
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  function openCancelModal(sale: Sale) {
    setSaleToCancel(sale)
    setCancelReason('')
    setCancelError('')
    setIsCancelModalOpen(true)
  }

  function closeCancelModal() {
    if (isCancelling) return
    setIsCancelModalOpen(false)
    setSaleToCancel(null)
    setCancelReason('')
    setCancelError('')
  }

  async function handleCancelSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!saleToCancel) return
    setIsCancelling(true)
    setCancelError('')

    try {
      await cancelSale(saleToCancel.id, emptyToUndefined(cancelReason))
      await refreshSales()
      setToast({ message: 'Venta cancelada correctamente. El stock fue revertido.', tone: 'success' })
      closeCancelModal()
    } catch (caughtError) {
      setCancelError(getErrorMessage(caughtError))
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <section className="resource-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="page-heading resource-heading">
        <div>
          <span className="eyebrow">Operacion</span>
          <h1>Ventas</h1>
          <p>Registra ventas internas, descuenta insumos por receta y conserva la rentabilidad historica.</p>
        </div>
        {canCreateSale ? <button className="primary-button resource-create-button" disabled={!canReadProducts} type="button" onClick={openCreateModal}>Nueva venta</button> : null}
      </div>

      {canCreateSale && !canReadProducts ? (
        <div className="page-card"><p>Para registrar ventas tambien necesitas el permiso <strong>products:read</strong>, porque la venta se arma desde productos activos.</p></div>
      ) : null}

      <div className="dashboard-grid metrics-grid">
        <article className="metric-card"><span>Ventas visibles</span><strong>{sales.length}</strong><small>Segun permisos y filtros</small></article>
        <article className="metric-card"><span>Ingresos</span><strong>${formatNumber(sumSales(sales, 'totalAmount'))}</strong><small>Ventas no canceladas</small></article>
        <article className="metric-card"><span>Ganancia bruta</span><strong>${formatNumber(sumSales(sales, 'grossProfit'))}</strong><small>Estimacion congelada</small></article>
      </div>

      {canReadSales ? (
        <div className="page-card table-card">
          <div className="table-header"><h2>Historial</h2><span>{filteredSales.length} de {sales.length} ventas</span></div>
          <div className="page-card resource-toolbar">
            <label><span>Buscar</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Producto, usuario o vendedor" /></label>
            <label><span>Estado</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">Todos</option><option value="CONFIRMED">Confirmadas</option><option value="CANCELLED">Canceladas</option><option value="DRAFT">Borrador</option></select></label>
            <label><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="date-desc">Mas recientes</option><option value="date-asc">Mas antiguas</option><option value="amount-desc">Mayor importe</option><option value="amount-asc">Menor importe</option></select></label>
            <button className="ghost-button" type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setSort('date-desc') }}>Limpiar</button>
          </div>
          {isLoading ? <p>Cargando ventas...</p> : <div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Productos</th><th>Subtotal</th><th>Descuento</th><th>Total</th><th>Ganancia</th><th>Estado</th><th>Usuario</th><th>Acciones</th></tr></thead><tbody>{filteredSales.map((sale) => <tr key={sale.id}><td>{formatDate(sale.soldAt)}</td><td>{sale.items.length} item{sale.items.length === 1 ? '' : 's'}<small className="table-detail">{sale.items.slice(0, 2).map((item) => `${item.product.name} x ${formatNumber(item.quantity, 4)}`).join(', ')}{sale.items.length > 2 ? '...' : ''}</small></td><td>${formatNumber(sale.subtotal)}</td><td>${formatNumber(sale.discount)}</td><td>${formatNumber(sale.totalAmount)}</td><td>${formatNumber(sale.grossProfit)}</td><td>{saleStatusLabel(sale.status)}</td><td>{sale.createdBy.firstName} {sale.createdBy.lastName}</td><td className="row-actions">{canCancelSale && sale.status !== 'CANCELLED' ? <button type="button" onClick={() => openCancelModal(sale)}>Cancelar</button> : null}</td></tr>)}</tbody></table>{!filteredSales.length ? <p className="helper-text">No hay ventas para mostrar.</p> : null}</div>}
        </div>
      ) : null}

      <Modal className="purchase-modal-card" isOpen={isSaleModalOpen} title="Nueva venta" description="El sistema calcula costos, valida stock y descuenta materias primas al confirmar." onClose={closeCreateModal}>
        <form className="resource-form modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>Fecha</span><input type="date" value={form.soldAt} onChange={(event) => setForm({ ...form, soldAt: event.target.value })} /></label>
            <label><span>Descuento</span><input min="0" step="0.01" type="number" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} /></label>
          </div>
          <section className="purchase-items-panel">
            <div className="table-header"><h2>Items</h2><button className="ghost-button" type="button" onClick={addItem}>Agregar item</button></div>
            <div className="sale-item-list">
              {form.items.map((item, index) => (
                <div className="sale-item-row" key={index}>
                  <label><span>Producto</span><select value={item.productId} onChange={(event) => handleProductChange(index, event.target.value)} required><option value="">Seleccionar</option>{sellableProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
                  <label><span>Cantidad</span><input min="0.0001" step="0.0001" type="number" value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} required /></label>
                  <label><span>Precio unit.</span><input min="0" step="0.01" type="number" value={item.unitPrice} onChange={(event) => updateItem(index, { unitPrice: event.target.value })} required /></label>
                  <div className="purchase-item-total"><span>Subtotal</span><strong>${formatNumber(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</strong></div>
                  <button className="ghost-button" disabled={form.items.length === 1} type="button" onClick={() => removeItem(index)}>Quitar</button>
                </div>
              ))}
            </div>
            <div className="purchase-summary"><span>Subtotal</span><strong>${formatNumber(formSubtotal)}</strong><span>Descuento</span><strong>${formatNumber(formDiscount)}</strong><span>Total</span><strong>${formatNumber(formTotal)}</strong></div>
          </section>
          <p className="helper-text">Solo aparecen productos activos con receta asignada. Si falta stock, el backend bloquea la venta y devuelve el insumo faltante.</p>
          {error ? <p className="form-error">{error}</p> : null}
          <footer className="modal-actions"><button className="ghost-button" type="button" onClick={closeCreateModal}>Cancelar</button><button className="primary-button" disabled={isSaving || !sellableProducts.length} type="submit">{isSaving ? 'Registrando...' : 'Registrar venta'}</button></footer>
        </form>
      </Modal>

      <Modal isOpen={isCancelModalOpen} title="Cancelar venta" description="La venta queda historica como cancelada y se revierte el stock consumido." onClose={closeCancelModal}>
        <form className="resource-form modal-form" onSubmit={handleCancelSubmit}>
          <label><span>Motivo</span><textarea maxLength={255} rows={4} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Error de carga, devolucion, etc." /></label>
          {cancelError ? <p className="form-error">{cancelError}</p> : null}
          <footer className="modal-actions"><button className="ghost-button" type="button" onClick={closeCancelModal}>Volver</button><button className="primary-button" disabled={isCancelling} type="submit">{isCancelling ? 'Cancelando...' : 'Confirmar cancelacion'}</button></footer>
        </form>
      </Modal>
    </section>
  )
}

function sumSales(sales: Sale[], field: 'grossProfit' | 'totalAmount') {
  return sales.filter((sale) => sale.status !== 'CANCELLED').reduce((sum, sale) => sum + Number(sale[field]), 0)
}

function saleStatusLabel(status: SaleStatus) {
  const labels: Record<SaleStatus, string> = {
    CANCELLED: 'Cancelada',
    CONFIRMED: 'Confirmada',
    DRAFT: 'Borrador',
  }

  return labels[status]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
