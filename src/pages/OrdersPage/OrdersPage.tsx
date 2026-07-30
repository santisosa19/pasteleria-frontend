import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { listCustomers, type Customer } from '../../features/customers/api/customersApi'
import { convertOrderToSale, createOrder, listOrders, updateOrderStatus, type Order, type OrderChannel, type OrderItemPayload, type OrderStatus } from '../../features/orders/api/ordersApi'
import { listProducts, type Product } from '../../features/products/api/productsApi'
import { Modal } from '../../shared/components/Modal'
import { Toast, type ToastState } from '../../shared/components/Toast'
import { getErrorMessage } from '../../shared/utils/errors'
import { emptyToNull, formatNumber } from '../../shared/utils/formatters'

type OrderFormItem = {
  productId: string
  quantity: string
  unitPrice: string
}

type OrderForm = {
  channel: OrderChannel
  customerId: string
  discount: string
  items: OrderFormItem[]
  notes: string
  requestedDate: string
}

type StatusFilter = 'all' | OrderStatus
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'requested-asc'

const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'CANCELLED']
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  CANCELLED: [],
  CONFIRMED: ['IN_PRODUCTION', 'READY', 'CANCELLED'],
  DELIVERED: [],
  IN_PRODUCTION: ['READY', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  READY: ['DELIVERED', 'CANCELLED'],
}
const initialItem: OrderFormItem = { productId: '', quantity: '1', unitPrice: '' }
const initialForm: OrderForm = { channel: 'INTERNAL', customerId: '', discount: '0', items: [{ ...initialItem }], notes: '', requestedDate: '' }

export function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<OrderForm>(initialForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortOption>('date-desc')

  const permissions = new Set(user?.permissions ?? [])
  const canCreateOrder = permissions.has('orders:create')
  const canReadOrders = permissions.has('orders:read')
  const canUpdateStatus = permissions.has('orders:status:update')
  const canConvertToSale = permissions.has('orders:convert-to-sale')
  const canReadCustomers = permissions.has('customers:read')
  const canReadProducts = permissions.has('products:read')
  const activeProducts = products.filter((product) => product.isActive)
  const formSubtotal = form.items.reduce((sum, item) => {
    const product = products.find((currentProduct) => currentProduct.id === item.productId)
    const unitPrice = Number(item.unitPrice || product?.salePrice || 0)
    return sum + unitPrice * Number(item.quantity || 0)
  }, 0)
  const formDiscount = Number(form.discount || 0)
  const formTotal = Math.max(formSubtotal - formDiscount, 0)
  const filteredOrders = [...orders]
    .filter((order) => {
      const normalizedSearch = search.trim().toLowerCase()
      const customerName = order.customer ? `${order.customer.firstName} ${order.customer.lastName ?? ''}`.trim() : 'sin cliente'
      const matchesSearch = !normalizedSearch || [customerName, order.notes, order.items.map((item) => item.product.name).join(' ')]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((first, second) => {
      if (sort === 'date-asc') return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
      if (sort === 'amount-desc') return Number(second.totalAmount) - Number(first.totalAmount)
      if (sort === 'amount-asc') return Number(first.totalAmount) - Number(second.totalAmount)
      if (sort === 'requested-asc') return getTime(first.requestedDate) - getTime(second.requestedDate)
      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    })

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [ordersData, customersData, productsData] = await Promise.all([
          canReadOrders ? listOrders() : Promise.resolve([]),
          canCreateOrder && canReadCustomers ? listCustomers() : Promise.resolve([]),
          canCreateOrder && canReadProducts ? listProducts() : Promise.resolve([]),
        ])

        if (isMounted) {
          setOrders(ordersData)
          setCustomers(customersData)
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
  }, [canCreateOrder, canReadCustomers, canReadOrders, canReadProducts])

  async function refreshOrders() {
    if (canReadOrders) setOrders(await listOrders())
  }

  function openCreateModal() {
    setForm({ ...initialForm, items: [{ ...initialItem }] })
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSaving) return
    setIsModalOpen(false)
    setForm({ ...initialForm, items: [{ ...initialItem }] })
    setError('')
  }

  function updateItem(index: number, patch: Partial<OrderFormItem>) {
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
      const items: OrderItemPayload[] = form.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }))

      await createOrder({
        channel: form.channel,
        customerId: emptyToNull(form.customerId),
        discount: Number(form.discount || 0),
        items,
        notes: emptyToNull(form.notes),
        requestedDate: form.requestedDate ? new Date(`${form.requestedDate}T12:00:00`).toISOString() : undefined,
      })

      await refreshOrders()
      setToast({ message: 'Pedido creado correctamente.', tone: 'success' })
      closeModal()
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setUpdatingOrderId(orderId)

    try {
      await updateOrderStatus(orderId, status)
      await refreshOrders()
      setToast({ message: 'Estado del pedido actualizado correctamente.', tone: 'success' })
    } catch (caughtError) {
      setToast({ message: getErrorMessage(caughtError), tone: 'error' })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  async function handleConvert(orderId: string) {
    setUpdatingOrderId(orderId)

    try {
      await convertOrderToSale(orderId)
      await refreshOrders()
      setToast({ message: 'Pedido convertido a venta correctamente. El stock fue descontado.', tone: 'success' })
    } catch (caughtError) {
      setToast({ message: getErrorMessage(caughtError), tone: 'error' })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <section className="resource-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="page-heading resource-heading">
        <div>
          <span className="eyebrow">Operacion</span>
          <h1>Pedidos</h1>
          <p>Gestiona encargos, estados de produccion y conversion a venta con descuento de stock.</p>
        </div>
        {canCreateOrder ? <button className="primary-button resource-create-button" disabled={!canReadProducts || !canReadCustomers} type="button" onClick={openCreateModal}>Nuevo pedido</button> : null}
      </div>

      {canCreateOrder && (!canReadProducts || !canReadCustomers) ? (
        <div className="page-card"><p>Para crear pedidos necesitas tambien <strong>products:read</strong> y <strong>customers:read</strong>.</p></div>
      ) : null}

      <div className="dashboard-grid metrics-grid">
        <article className="metric-card"><span>Pedidos visibles</span><strong>{orders.length}</strong><small>Segun permisos</small></article>
        <article className="metric-card"><span>Pendientes</span><strong>{orders.filter((order) => order.status === 'PENDING').length}</strong><small>Esperando confirmacion</small></article>
        <article className="metric-card"><span>En produccion/listos</span><strong>{orders.filter((order) => ['CONFIRMED', 'IN_PRODUCTION', 'READY'].includes(order.status)).length}</strong><small>Activos</small></article>
      </div>

      {canReadOrders ? (
        <div className="page-card table-card">
          <div className="table-header"><h2>Listado</h2><span>{filteredOrders.length} de {orders.length} pedidos</span></div>
          <div className="page-card resource-toolbar">
            <label><span>Buscar</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cliente, producto o nota" /></label>
            <label><span>Estado</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">Todos</option>{statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label>
            <label><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="date-desc">Mas recientes</option><option value="date-asc">Mas antiguos</option><option value="requested-asc">Entrega proxima</option><option value="amount-desc">Mayor importe</option><option value="amount-asc">Menor importe</option></select></label>
            <button className="ghost-button" type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setSort('date-desc') }}>Limpiar</button>
          </div>
          {isLoading ? <p>Cargando pedidos...</p> : <div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Entrega</th><th>Items</th><th>Total</th><th>Estado</th><th>Pagos</th><th>Acciones</th></tr></thead><tbody>{filteredOrders.map((order) => <tr key={order.id}><td>{formatDate(order.createdAt)}</td><td>{order.customer ? `${order.customer.firstName} ${order.customer.lastName ?? ''}` : 'Sin cliente'}</td><td>{order.requestedDate ? formatDate(order.requestedDate) : '-'}</td><td>{order.items.length} item{order.items.length === 1 ? '' : 's'}<small className="table-detail">{order.items.slice(0, 2).map((item) => `${item.product.name} x ${formatNumber(item.quantity, 4)}`).join(', ')}{order.items.length > 2 ? '...' : ''}</small></td><td>${formatNumber(order.totalAmount)}</td><td>{statusLabel(order.status)}</td><td>{approvedPayments(order)} / ${formatNumber(order.totalAmount)}</td><td className="row-actions">{canUpdateStatus ? allowedTransitions[order.status].map((status) => <button disabled={updatingOrderId === order.id} key={status} type="button" onClick={() => void handleStatusChange(order.id, status)}>{statusLabel(status)}</button>) : null}{canConvertToSale && canConvert(order) ? <button disabled={updatingOrderId === order.id} type="button" onClick={() => void handleConvert(order.id)}>Convertir a venta</button> : null}</td></tr>)}</tbody></table>{!filteredOrders.length ? <p className="helper-text">No hay pedidos para mostrar.</p> : null}</div>}
        </div>
      ) : null}

      <Modal className="purchase-modal-card" isOpen={isModalOpen} title="Nuevo pedido" description="El pedido no descuenta stock hasta convertirse en venta." onClose={closeModal}>
        <form className="resource-form modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>Cliente</span><select value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}><option value="">Sin cliente</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName ?? ''}</option>)}</select></label>
            <label><span>Canal</span><select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value as OrderChannel })}><option value="INTERNAL">Interno</option><option value="ECOMMERCE">Ecommerce</option></select></label>
            <label><span>Fecha solicitada</span><input type="date" value={form.requestedDate} onChange={(event) => setForm({ ...form, requestedDate: event.target.value })} /></label>
            <label><span>Descuento</span><input min="0" step="0.01" type="number" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} /></label>
            <label className="wide-field"><span>Notas</span><textarea rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
          </div>
          <section className="purchase-items-panel">
            <div className="table-header"><h2>Items</h2><button className="ghost-button" type="button" onClick={addItem}>Agregar item</button></div>
            <div className="sale-item-list">
              {form.items.map((item, index) => (
                <div className="sale-item-row" key={index}>
                  <label><span>Producto</span><select value={item.productId} onChange={(event) => handleProductChange(index, event.target.value)} required><option value="">Seleccionar</option>{activeProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
                  <label><span>Cantidad</span><input min="0.0001" step="0.0001" type="number" value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} required /></label>
                  <label><span>Precio unit.</span><input min="0" step="0.01" type="number" value={item.unitPrice} onChange={(event) => updateItem(index, { unitPrice: event.target.value })} required /></label>
                  <div className="purchase-item-total"><span>Subtotal</span><strong>${formatNumber(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</strong></div>
                  <button className="ghost-button" disabled={form.items.length === 1} type="button" onClick={() => removeItem(index)}>Quitar</button>
                </div>
              ))}
            </div>
            <div className="purchase-summary"><span>Subtotal</span><strong>${formatNumber(formSubtotal)}</strong><span>Descuento</span><strong>${formatNumber(formDiscount)}</strong><span>Total</span><strong>${formatNumber(formTotal)}</strong></div>
          </section>
          {error ? <p className="form-error">{error}</p> : null}
          <footer className="modal-actions"><button className="ghost-button" type="button" onClick={closeModal}>Cancelar</button><button className="primary-button" disabled={isSaving || !activeProducts.length} type="submit">{isSaving ? 'Guardando...' : 'Crear pedido'}</button></footer>
        </form>
      </Modal>
    </section>
  )
}

function statusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    CANCELLED: 'Cancelado',
    CONFIRMED: 'Confirmado',
    DELIVERED: 'Entregado',
    IN_PRODUCTION: 'En produccion',
    PENDING: 'Pendiente',
    READY: 'Listo',
  }

  return labels[status]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short' }).format(new Date(value))
}

function getTime(value: string | null) {
  return value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER
}

function approvedPayments(order: Order) {
  const amount = order.payments.filter((payment) => payment.status === 'APPROVED').reduce((sum, payment) => sum + Number(payment.amount), 0)
  return `$${formatNumber(amount)}`
}

function canConvert(order: Order) {
  return !order.sale && !['PENDING', 'CANCELLED', 'DELIVERED'].includes(order.status)
}
