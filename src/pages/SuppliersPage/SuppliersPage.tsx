import { FormEvent, useState, useEffect } from 'react'
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier, type Supplier } from '../../features/suppliers/api/suppliersApi'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { Modal } from '../../shared/components/Modal'
import { Toast, type ToastState } from '../../shared/components/Toast'
import { getErrorMessage } from '../../shared/utils/errors'
import { emptyToNull } from '../../shared/utils/formatters'

const initialForm = { name: '', taxId: '', email: '', phone: '', address: '', notes: '', isActive: true }

type StatusFilter = 'all' | 'active' | 'inactive'
type SortOption = 'name-asc' | 'name-desc' | 'status'

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form, setForm] = useState(initialForm)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortOption>('name-asc')

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const data = await listSuppliers()
        if (isMounted) setSuppliers(data)
      } catch (caughtError) {
        if (isMounted) setToast({ message: getErrorMessage(caughtError), tone: 'error' })
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => { isMounted = false }
  }, [])

  const filteredSuppliers = [...suppliers]
    .filter((supplier) => {
      const normalizedSearch = search.trim().toLowerCase()
      const matchesSearch = !normalizedSearch || [supplier.name, supplier.email, supplier.phone, supplier.taxId]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? supplier.isActive : !supplier.isActive)

      return matchesSearch && matchesStatus
    })
    .sort((first, second) => {
      if (sort === 'name-desc') return second.name.localeCompare(first.name)
      if (sort === 'status') return Number(second.isActive) - Number(first.isActive) || first.name.localeCompare(second.name)
      return first.name.localeCompare(second.name)
    })

  async function refreshSuppliers() {
    setSuppliers(await listSuppliers())
  }

  function openCreateModal() {
    setForm(initialForm)
    setEditingSupplier(null)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(supplier: Supplier) {
    setEditingSupplier(supplier)
    setForm({
      address: supplier.address ?? '',
      email: supplier.email ?? '',
      isActive: supplier.isActive,
      name: supplier.name,
      notes: supplier.notes ?? '',
      phone: supplier.phone ?? '',
      taxId: supplier.taxId ?? '',
    })
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSaving) return
    setIsModalOpen(false)
    setEditingSupplier(null)
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
        isActive: form.isActive,
        name: form.name,
        notes: emptyToNull(form.notes),
        phone: emptyToNull(form.phone),
        taxId: emptyToNull(form.taxId),
      }

      if (editingSupplier) await updateSupplier(editingSupplier.id, payload)
      else await createSupplier(payload)

      await refreshSuppliers()
      setToast({ message: editingSupplier ? 'Proveedor actualizado correctamente.' : 'Proveedor creado correctamente.', tone: 'success' })
      setIsModalOpen(false)
      setEditingSupplier(null)
      setForm(initialForm)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!supplierToDelete) return
    setIsDeleting(true)

    try {
      await deleteSupplier(supplierToDelete.id)
      await refreshSuppliers()
      setToast({ message: 'Proveedor desactivado correctamente.', tone: 'success' })
      setSupplierToDelete(null)
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
          <span className="eyebrow">Maestros</span>
          <h1>Proveedores</h1>
          <p>Datos comerciales y contacto para registrar compras de insumos.</p>
        </div>
        <button className="primary-button resource-create-button" type="button" onClick={openCreateModal}>Nuevo proveedor</button>
      </div>

      <div className="page-card resource-toolbar">
        <label>
          <span>Buscar</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, email, telefono o CUIT" />
        </label>
        <label>
          <span>Estado</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </label>
        <label>
          <span>Ordenar</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
            <option value="name-asc">Nombre A-Z</option>
            <option value="name-desc">Nombre Z-A</option>
            <option value="status">Estado</option>
          </select>
        </label>
        <button className="ghost-button" type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setSort('name-asc') }}>Limpiar</button>
      </div>

      <div className="page-card table-card">
        <div className="table-header"><h2>Listado</h2><span>{filteredSuppliers.length} de {suppliers.length} proveedores</span></div>
        {isLoading ? <p>Cargando proveedores...</p> : <div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Email</th><th>Telefono</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filteredSuppliers.map((supplier) => <tr key={supplier.id}><td>{supplier.name}</td><td>{supplier.email ?? '-'}</td><td>{supplier.phone ?? '-'}</td><td>{supplier.isActive ? 'Activo' : 'Inactivo'}</td><td className="row-actions"><button type="button" onClick={() => openEditModal(supplier)}>Editar</button><button type="button" onClick={() => setSupplierToDelete(supplier)}>Desactivar</button></td></tr>)}</tbody></table></div>}
      </div>

      <Modal isOpen={isModalOpen} title={editingSupplier ? 'Editar proveedor' : 'Nuevo proveedor'} description="Completá los datos y guardá para volver al listado." onClose={closeModal}>
        <form className="resource-form modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>Nombre</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={180} /></label>
            <label><span>CUIT / ID fiscal</span><input value={form.taxId} onChange={(event) => setForm({ ...form, taxId: event.target.value })} maxLength={80} /></label>
            <label><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength={255} /></label>
            <label><span>Telefono</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} maxLength={80} /></label>
            <label className="wide-field"><span>Direccion</span><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} maxLength={255} /></label>
            <label className="wide-field"><span>Notas</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} /></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /><span>Activo</span></label>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <footer className="modal-actions"><button className="ghost-button" type="button" onClick={closeModal}>Cancelar</button><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? 'Guardando...' : 'Guardar'}</button></footer>
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel="Desactivar"
        description={`El proveedor ${supplierToDelete?.name ?? ''} quedara inactivo, pero sus datos se conservaran para el historial.`}
        isConfirming={isDeleting}
        isOpen={Boolean(supplierToDelete)}
        onCancel={() => setSupplierToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Desactivar proveedor"
        tone="warning"
      />
    </section>
  )
}
