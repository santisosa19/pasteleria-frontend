import { FormEvent, useEffect, useState } from 'react'
import {
  createMeasurementUnit,
  deleteMeasurementUnit,
  listMeasurementUnits,
  updateMeasurementUnit,
  type MeasurementKind,
  type MeasurementUnit,
} from '../../features/measurement-units/api/measurementUnitsApi'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { Modal } from '../../shared/components/Modal'
import { Toast, type ToastState } from '../../shared/components/Toast'
import { getErrorMessage } from '../../shared/utils/errors'
import { formatNumber } from '../../shared/utils/formatters'

const initialForm = { code: '', name: '', kind: 'MASS' as MeasurementKind, conversionRateToBase: '1', isBase: false }

const kindLabels: Record<MeasurementKind, string> = { MASS: 'Masa', UNIT: 'Unidad', VOLUME: 'Volumen' }
type KindFilter = 'all' | MeasurementKind
type BaseFilter = 'all' | 'base' | 'derived'
type SortOption = 'code-asc' | 'code-desc' | 'name-asc' | 'kind'

export function MeasurementUnitsPage() {
  const [units, setUnits] = useState<MeasurementUnit[]>([])
  const [form, setForm] = useState(initialForm)
  const [editingUnit, setEditingUnit] = useState<MeasurementUnit | null>(null)
  const [unitToDelete, setUnitToDelete] = useState<MeasurementUnit | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [baseFilter, setBaseFilter] = useState<BaseFilter>('all')
  const [sort, setSort] = useState<SortOption>('code-asc')

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const data = await listMeasurementUnits()
        if (isMounted) setUnits(data)
      } catch (caughtError) {
        if (isMounted) setToast({ message: getErrorMessage(caughtError), tone: 'error' })
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => { isMounted = false }
  }, [])

  const filteredUnits = [...units]
    .filter((unit) => {
      const normalizedSearch = search.trim().toLowerCase()
      const matchesSearch = !normalizedSearch || unit.code.toLowerCase().includes(normalizedSearch) || unit.name.toLowerCase().includes(normalizedSearch)
      const matchesKind = kindFilter === 'all' || unit.kind === kindFilter
      const matchesBase = baseFilter === 'all' || (baseFilter === 'base' ? unit.isBase : !unit.isBase)

      return matchesSearch && matchesKind && matchesBase
    })
    .sort((first, second) => {
      if (sort === 'code-desc') return second.code.localeCompare(first.code)
      if (sort === 'name-asc') return first.name.localeCompare(second.name)
      if (sort === 'kind') return first.kind.localeCompare(second.kind) || first.code.localeCompare(second.code)
      return first.code.localeCompare(second.code)
    })

  async function refreshUnits() {
    setUnits(await listMeasurementUnits())
  }

  function openCreateModal() {
    setForm(initialForm)
    setEditingUnit(null)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(unit: MeasurementUnit) {
    setEditingUnit(unit)
    setForm({ code: unit.code, conversionRateToBase: String(unit.conversionRateToBase), isBase: unit.isBase, kind: unit.kind, name: unit.name })
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSaving) return
    setIsModalOpen(false)
    setEditingUnit(null)
    setForm(initialForm)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const payload = { code: form.code, conversionRateToBase: Number(form.conversionRateToBase), isBase: form.isBase, kind: form.kind, name: form.name }

      if (editingUnit) await updateMeasurementUnit(editingUnit.id, payload)
      else await createMeasurementUnit(payload)

      await refreshUnits()
      setToast({ message: editingUnit ? 'Unidad actualizada correctamente.' : 'Unidad creada correctamente.', tone: 'success' })
      setIsModalOpen(false)
      setEditingUnit(null)
      setForm(initialForm)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!unitToDelete) return
    setIsDeleting(true)

    try {
      await deleteMeasurementUnit(unitToDelete.id)
      await refreshUnits()
      setToast({ message: 'Unidad eliminada correctamente.', tone: 'success' })
      setUnitToDelete(null)
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
        <div><span className="eyebrow">Maestros</span><h1>Unidades de medida</h1><p>Administra las unidades base y conversiones usadas por insumos, recetas e inventario.</p></div>
        <button className="primary-button resource-create-button" type="button" onClick={openCreateModal}>Nueva unidad</button>
      </div>

      <div className="page-card resource-toolbar">
        <label><span>Buscar</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Codigo o nombre" /></label>
        <label><span>Tipo</span><select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as KindFilter)}><option value="all">Todos</option><option value="MASS">Masa</option><option value="VOLUME">Volumen</option><option value="UNIT">Unidad</option></select></label>
        <label><span>Base</span><select value={baseFilter} onChange={(event) => setBaseFilter(event.target.value as BaseFilter)}><option value="all">Todas</option><option value="base">Base</option><option value="derived">Derivadas</option></select></label>
        <label><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="code-asc">Codigo A-Z</option><option value="code-desc">Codigo Z-A</option><option value="name-asc">Nombre</option><option value="kind">Tipo</option></select></label>
        <button className="ghost-button" type="button" onClick={() => { setSearch(''); setKindFilter('all'); setBaseFilter('all'); setSort('code-asc') }}>Limpiar</button>
      </div>

      <div className="page-card table-card">
        <div className="table-header"><h2>Listado</h2><span>{filteredUnits.length} de {units.length} unidades</span></div>
        {isLoading ? <p>Cargando unidades...</p> : <div className="table-wrap"><table><thead><tr><th>Codigo</th><th>Nombre</th><th>Tipo</th><th>Conversion</th><th>Base</th><th>Acciones</th></tr></thead><tbody>{filteredUnits.map((unit) => <tr key={unit.id}><td>{unit.code}</td><td>{unit.name}</td><td>{kindLabels[unit.kind]}</td><td>{formatNumber(unit.conversionRateToBase, 6)}</td><td>{unit.isBase ? 'Si' : 'No'}</td><td className="row-actions"><button type="button" onClick={() => openEditModal(unit)}>Editar</button><button type="button" onClick={() => setUnitToDelete(unit)}>Eliminar</button></td></tr>)}</tbody></table></div>}
      </div>

      <Modal isOpen={isModalOpen} title={editingUnit ? 'Editar unidad' : 'Nueva unidad'} description="Definí el tipo y la conversion respecto de la unidad base." onClose={closeModal}>
        <form className="resource-form modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>Codigo</span><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required maxLength={20} /></label>
            <label><span>Nombre</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={80} /></label>
            <label><span>Tipo</span><select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as MeasurementKind })}><option value="MASS">Masa</option><option value="VOLUME">Volumen</option><option value="UNIT">Unidad</option></select></label>
            <label><span>Conversion a base</span><input min="0.000001" step="0.000001" type="number" value={form.conversionRateToBase} onChange={(event) => setForm({ ...form, conversionRateToBase: event.target.value })} required /></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.isBase} onChange={(event) => setForm({ ...form, isBase: event.target.checked, conversionRateToBase: event.target.checked ? '1' : form.conversionRateToBase })} /><span>Es unidad base</span></label>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <footer className="modal-actions"><button className="ghost-button" type="button" onClick={closeModal}>Cancelar</button><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? 'Guardando...' : 'Guardar'}</button></footer>
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel="Eliminar"
        description={`La unidad ${unitToDelete?.code ?? ''} se eliminara definitivamente. Si esta en uso, el backend rechazara la operacion y mostrara el motivo.`}
        isConfirming={isDeleting}
        isOpen={Boolean(unitToDelete)}
        onCancel={() => setUnitToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Eliminar unidad de medida"
        tone="danger"
      />
    </section>
  )
}
