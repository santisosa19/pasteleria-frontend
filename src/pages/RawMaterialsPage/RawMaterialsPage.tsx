import { FormEvent, useEffect, useState } from 'react'
import { listMeasurementUnits, type MeasurementUnit } from '../../features/measurement-units/api/measurementUnitsApi'
import { createRawMaterial, deleteRawMaterial, listRawMaterials, updateRawMaterial, type RawMaterial } from '../../features/raw-materials/api/rawMaterialsApi'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { Modal } from '../../shared/components/Modal'
import { Toast, type ToastState } from '../../shared/components/Toast'
import { getErrorMessage } from '../../shared/utils/errors'
import { emptyToUndefined, formatNumber } from '../../shared/utils/formatters'

const initialForm = { averageCost: '0', baseUnitId: '', currentStock: '0', description: '', isActive: true, lastPurchaseCost: '', minimumStock: '0', name: '' }

type StatusFilter = 'all' | 'active' | 'inactive'
type StockFilter = 'all' | 'low' | 'ok'
type SortOption = 'name-asc' | 'name-desc' | 'stock-asc' | 'stock-desc'

export function RawMaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [units, setUnits] = useState<MeasurementUnit[]>([])
  const [form, setForm] = useState(initialForm)
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null)
  const [materialToDelete, setMaterialToDelete] = useState<RawMaterial | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [unitFilter, setUnitFilter] = useState('all')
  const [sort, setSort] = useState<SortOption>('name-asc')

  const baseUnits = units.filter((unit) => unit.isBase)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [materialsData, unitsData] = await Promise.all([listRawMaterials(), listMeasurementUnits()])
        if (isMounted) { setMaterials(materialsData); setUnits(unitsData) }
      } catch (caughtError) {
        if (isMounted) setToast({ message: getErrorMessage(caughtError), tone: 'error' })
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => { isMounted = false }
  }, [])

  const filteredMaterials = [...materials]
    .filter((material) => {
      const normalizedSearch = search.trim().toLowerCase()
      const stock = Number(material.currentStock)
      const minimumStock = Number(material.minimumStock)
      const matchesSearch = !normalizedSearch || material.name.toLowerCase().includes(normalizedSearch) || material.baseUnit.code.toLowerCase().includes(normalizedSearch)
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? material.isActive : !material.isActive)
      const matchesStock = stockFilter === 'all' || (stockFilter === 'low' ? stock <= minimumStock : stock > minimumStock)
      const matchesUnit = unitFilter === 'all' || material.baseUnitId === unitFilter

      return matchesSearch && matchesStatus && matchesStock && matchesUnit
    })
    .sort((first, second) => {
      if (sort === 'name-desc') return second.name.localeCompare(first.name)
      if (sort === 'stock-asc') return Number(first.currentStock) - Number(second.currentStock)
      if (sort === 'stock-desc') return Number(second.currentStock) - Number(first.currentStock)
      return first.name.localeCompare(second.name)
    })

  async function refreshMaterials() { setMaterials(await listRawMaterials()) }

  function openCreateModal() { setForm(initialForm); setEditingMaterial(null); setError(''); setIsModalOpen(true) }

  function openEditModal(material: RawMaterial) {
    setEditingMaterial(material)
    setForm({ averageCost: String(material.averageCost), baseUnitId: material.baseUnitId, currentStock: String(material.currentStock), description: material.description ?? '', isActive: material.isActive, lastPurchaseCost: material.lastPurchaseCost ? String(material.lastPurchaseCost) : '', minimumStock: String(material.minimumStock), name: material.name })
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSaving) return
    setIsModalOpen(false)
    setEditingMaterial(null)
    setForm(initialForm)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const payload = { averageCost: Number(form.averageCost), baseUnitId: form.baseUnitId, currentStock: Number(form.currentStock), description: emptyToUndefined(form.description), isActive: form.isActive, lastPurchaseCost: form.lastPurchaseCost ? Number(form.lastPurchaseCost) : undefined, minimumStock: Number(form.minimumStock), name: form.name }
      if (editingMaterial) await updateRawMaterial(editingMaterial.id, payload)
      else await createRawMaterial(payload)

      await refreshMaterials()
      setToast({ message: editingMaterial ? 'Materia prima actualizada correctamente.' : 'Materia prima creada correctamente.', tone: 'success' })
      setIsModalOpen(false)
      setEditingMaterial(null)
      setForm(initialForm)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!materialToDelete) return
    setIsDeleting(true)

    try {
      await deleteRawMaterial(materialToDelete.id)
      await refreshMaterials()
      setToast({ message: 'Materia prima desactivada correctamente.', tone: 'success' })
      setMaterialToDelete(null)
    } catch (caughtError) {
      setToast({ message: getErrorMessage(caughtError), tone: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="resource-page">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="page-heading resource-heading"><div><span className="eyebrow">Maestros</span><h1>Materias primas</h1><p>Insumos, stock minimo y costos usados por recetas, compras e inventario.</p></div><button className="primary-button resource-create-button" type="button" onClick={openCreateModal}>Nueva materia prima</button></div>

      <div className="page-card resource-toolbar">
        <label><span>Buscar</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o unidad" /></label>
        <label><span>Estado</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">Todas</option><option value="active">Activas</option><option value="inactive">Inactivas</option></select></label>
        <label><span>Stock</span><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as StockFilter)}><option value="all">Todo</option><option value="low">Bajo minimo</option><option value="ok">Disponible</option></select></label>
        <label><span>Unidad</span><select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)}><option value="all">Todas</option>{baseUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.code}</option>)}</select></label>
        <label><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="name-asc">Nombre A-Z</option><option value="name-desc">Nombre Z-A</option><option value="stock-asc">Stock menor</option><option value="stock-desc">Stock mayor</option></select></label>
        <button className="ghost-button" type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setStockFilter('all'); setUnitFilter('all'); setSort('name-asc') }}>Limpiar</button>
      </div>

      <div className="page-card table-card"><div className="table-header"><h2>Listado</h2><span>{filteredMaterials.length} de {materials.length} insumos</span></div>{isLoading ? <p>Cargando materias primas...</p> : <div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Unidad</th><th>Stock</th><th>Minimo</th><th>Costo prom.</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filteredMaterials.map((material) => <tr key={material.id}><td>{material.name}</td><td>{material.baseUnit.code}</td><td>{formatNumber(material.currentStock, 4)}</td><td>{formatNumber(material.minimumStock, 4)}</td><td>{formatNumber(material.averageCost, 4)}</td><td>{material.isActive ? 'Activa' : 'Inactiva'}</td><td className="row-actions"><button type="button" onClick={() => openEditModal(material)}>Editar</button><button type="button" onClick={() => setMaterialToDelete(material)}>Desactivar</button></td></tr>)}</tbody></table></div>}</div>

      <Modal isOpen={isModalOpen} title={editingMaterial ? 'Editar materia prima' : 'Nueva materia prima'} description="Carga el insumo, unidad base, stock y costos iniciales." onClose={closeModal}>
        <form className="resource-form modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>Nombre</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={160} /></label>
            <label><span>Unidad base</span><select value={form.baseUnitId} onChange={(event) => setForm({ ...form, baseUnitId: event.target.value })} required><option value="">Seleccionar</option>{baseUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>)}</select></label>
            <label><span>Stock actual</span><input min="0" step="0.0001" type="number" value={form.currentStock} onChange={(event) => setForm({ ...form, currentStock: event.target.value })} /></label>
            <label><span>Stock minimo</span><input min="0" step="0.0001" type="number" value={form.minimumStock} onChange={(event) => setForm({ ...form, minimumStock: event.target.value })} /></label>
            <label><span>Costo promedio</span><input min="0" step="0.0001" type="number" value={form.averageCost} onChange={(event) => setForm({ ...form, averageCost: event.target.value })} /></label>
            <label><span>Ultimo costo</span><input min="0" step="0.0001" type="number" value={form.lastPurchaseCost} onChange={(event) => setForm({ ...form, lastPurchaseCost: event.target.value })} /></label>
            <label className="wide-field"><span>Descripcion</span><textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /><span>Activa</span></label>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <footer className="modal-actions"><button className="ghost-button" type="button" onClick={closeModal}>Cancelar</button><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? 'Guardando...' : 'Guardar'}</button></footer>
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel="Desactivar"
        description={`La materia prima ${materialToDelete?.name ?? ''} quedara inactiva, pero se conservara para historial de compras, recetas e inventario.`}
        isConfirming={isDeleting}
        isOpen={Boolean(materialToDelete)}
        onCancel={() => setMaterialToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Desactivar materia prima"
        tone="warning"
      />
    </section>
  )
}
