import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { createCustomer, deleteCustomer, listCustomers, updateCustomer, type Customer } from '../../features/customers/api/customersApi'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { Modal } from '../../shared/components/Modal'
import { Toast, type ToastState } from '../../shared/components/Toast'
import { getErrorMessage } from '../../shared/utils/errors'
import { emptyToNull } from '../../shared/utils/formatters'

type CustomerForm = {
  address: string
  email: string
  firstName: string
  lastName: string
  phone: string
}

type SortOption = 'name-asc' | 'name-desc' | 'orders-desc'

const initialForm: CustomerForm = { address: '', email: '', firstName: '', lastName: '', phone: '' }

export function CustomersPage() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState<CustomerForm>(initialForm)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('name-asc')

  const permissions = new Set(user?.permissions ?? [])
  const canCreateCustomer = permissions.has('customers:create')
  const canReadCustomers = permissions.has('customers:read')
  const canUpdateCustomer = permissions.has('customers:update')
  const canDeleteCustomer = permissions.has('customers:delete')
  const filteredCustomers = [...customers]
    .filter((customer) => {
      const normalizedSearch = search.trim().toLowerCase()
      const fullName = `${customer.firstName} ${customer.lastName ?? ''}`.trim()

      return !normalizedSearch || [fullName, customer.email, customer.phone, customer.address]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
    })
    .sort((first, second) => {
      const firstName = `${first.firstName} ${first.lastName ?? ''}`.trim()
      const secondName = `${second.firstName} ${second.lastName ?? ''}`.trim()

      if (sort === 'name-desc') return secondName.localeCompare(firstName)
      if (sort === 'orders-desc') return (second._count?.orders ?? 0) - (first._count?.orders ?? 0) || firstName.localeCompare(secondName)
      return firstName.localeCompare(secondName)
    })

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const data = canReadCustomers ? await listCustomers() : []
        if (isMounted) setCustomers(data)
      } catch (caughtError) {
        if (isMounted) setToast({ message: getErrorMessage(caughtError), tone: 'error' })
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => { isMounted = false }
  }, [canReadCustomers])

  async function refreshCustomers() {
    if (canReadCustomers) setCustomers(await listCustomers())
  }

  function openCreateModal() {
    setEditingCustomer(null)
    setForm(initialForm)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer)
    setForm({
      address: customer.address ?? '',
      email: customer.email ?? '',
      firstName: customer.firstName,
      lastName: customer.lastName ?? '',
      phone: customer.phone ?? '',
    })
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSaving) return
    setIsModalOpen(false)
    setEditingCustomer(null)
    setForm(initialForm)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const payload = {
        address: emptyToNull(form.address),
        email: emptyToNull(form.email),
        firstName: form.firstName,
        lastName: emptyToNull(form.lastName),
        phone: emptyToNull(form.phone),
      }

      if (editingCustomer) await updateCustomer(editingCustomer.id, payload)
      else await createCustomer(payload)

      await refreshCustomers()
      setToast({ message: editingCustomer ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.', tone: 'success' })
      closeModal()
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!customerToDelete) return
    setIsDeleting(true)

    try {
      await deleteCustomer(customerToDelete.id)
      await refreshCustomers()
      setToast({ message: 'Cliente eliminado correctamente.', tone: 'success' })
      setCustomerToDelete(null)
    } catch (caughtError) {
      setToast({ message: getErrorMessage(caughtError), tone: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="resource-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="page-heading resource-heading">
        <div>
          <span className="eyebrow">Comercial</span>
          <h1>Clientes</h1>
          <p>Datos de contacto para pedidos internos y futuro ecommerce.</p>
        </div>
        {canCreateCustomer ? <button className="primary-button resource-create-button" type="button" onClick={openCreateModal}>Nuevo cliente</button> : null}
      </div>

      {canReadCustomers ? (
        <>
          <div className="page-card resource-toolbar security-toolbar">
            <label><span>Buscar</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, email, telefono o direccion" /></label>
            <label><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="name-asc">Nombre A-Z</option><option value="name-desc">Nombre Z-A</option><option value="orders-desc">Mas pedidos</option></select></label>
            <button className="ghost-button" type="button" onClick={() => { setSearch(''); setSort('name-asc') }}>Limpiar</button>
          </div>

          <div className="page-card table-card">
            <div className="table-header"><h2>Listado</h2><span>{filteredCustomers.length} de {customers.length} clientes</span></div>
            {isLoading ? <p>Cargando clientes...</p> : <div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Email</th><th>Telefono</th><th>Direccion</th><th>Pedidos</th><th>Acciones</th></tr></thead><tbody>{filteredCustomers.map((customer) => <tr key={customer.id}><td>{customer.firstName} {customer.lastName ?? ''}</td><td>{customer.email ?? '-'}</td><td>{customer.phone ?? '-'}</td><td>{customer.address ?? '-'}</td><td>{customer._count?.orders ?? 0}</td><td className="row-actions">{canUpdateCustomer ? <button type="button" onClick={() => openEditModal(customer)}>Editar</button> : null}{canDeleteCustomer ? <button type="button" onClick={() => setCustomerToDelete(customer)}>Eliminar</button> : null}</td></tr>)}</tbody></table>{!filteredCustomers.length ? <p className="helper-text">No hay clientes para mostrar.</p> : null}</div>}
          </div>
        </>
      ) : <div className="page-card"><p>No tenes permiso para leer clientes.</p></div>}

      <Modal isOpen={isModalOpen} title={editingCustomer ? 'Editar cliente' : 'Nuevo cliente'} description="Estos datos quedan disponibles para crear pedidos y registrar cobros." onClose={closeModal}>
        <form className="resource-form modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>Nombre</span><input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required maxLength={120} /></label>
            <label><span>Apellido</span><input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} maxLength={120} /></label>
            <label><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength={255} /></label>
            <label><span>Telefono</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} maxLength={80} /></label>
            <label className="wide-field"><span>Direccion</span><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} maxLength={255} /></label>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <footer className="modal-actions"><button className="ghost-button" type="button" onClick={closeModal}>Cancelar</button><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? 'Guardando...' : 'Guardar'}</button></footer>
        </form>
      </Modal>

      <ConfirmDialog confirmLabel="Eliminar" description={`El cliente ${customerToDelete?.firstName ?? ''} ${customerToDelete?.lastName ?? ''} se eliminara solo si no tiene pedidos asociados.`} isConfirming={isDeleting} isOpen={Boolean(customerToDelete)} onCancel={() => setCustomerToDelete(null)} onConfirm={() => void handleDelete()} title="Eliminar cliente" tone="danger" />
    </section>
  )
}
