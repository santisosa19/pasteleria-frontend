import { FormEvent, useEffect, useState } from 'react'
import { listMeasurementUnits, type MeasurementUnit } from '../../features/measurement-units/api/measurementUnitsApi'
import { createPurchase, listPurchases, type Purchase } from '../../features/purchases/api/purchasesApi'
import { listRawMaterials, type RawMaterial } from '../../features/raw-materials/api/rawMaterialsApi'
import { listSuppliers, type Supplier } from '../../features/suppliers/api/suppliersApi'
import { Modal } from '../../shared/components/Modal'
import { Toast, type ToastState } from '../../shared/components/Toast'
import { getErrorMessage } from '../../shared/utils/errors'
import { emptyToNull, formatNumber } from '../../shared/utils/formatters'

type PurchaseFormItem = {
  rawMaterialId: string
  quantity: string
  unitId: string
  lineTotal: string
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

const initialItem: PurchaseFormItem = { lineTotal: '0', quantity: '1', rawMaterialId: '', unitId: '' }
const initialForm = {
  invoiceNo: '',
  items: [initialItem],
  notes: '',
  purchasedAt: new Date().toISOString().slice(0, 10),
  supplierId: '',
}

export function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [units, setUnits] = useState<MeasurementUnit[]>([])
  const [form, setForm] = useState(initialForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [search, setSearch] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [sort, setSort] = useState<SortOption>('date-desc')

  const activeSuppliers = suppliers.filter((supplier) => supplier.isActive)
  const activeRawMaterials = rawMaterials.filter((material) => material.isActive)
  const formTotal = form.items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [purchasesData, suppliersData, rawMaterialsData, unitsData] = await Promise.all([
          listPurchases(),
          listSuppliers(),
          listRawMaterials(),
          listMeasurementUnits(),
        ])
        if (isMounted) {
          setPurchases(purchasesData)
          setSuppliers(suppliersData)
          setRawMaterials(rawMaterialsData)
          setUnits(unitsData)
        }
      } catch (caughtError) {
        if (isMounted) setToast({ message: getErrorMessage(caughtError), tone: 'error' })
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => { isMounted = false }
  }, [])

  const filteredPurchases = [...purchases]
    .filter((purchase) => {
      const normalizedSearch = search.trim().toLowerCase()
      const matchesSearch = !normalizedSearch || [
        purchase.invoiceNo,
        purchase.supplier?.name,
        purchase.items.map((item) => item.rawMaterial.name).join(' '),
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
      const matchesSupplier = supplierFilter === 'all' || purchase.supplierId === supplierFilter

      return matchesSearch && matchesSupplier
    })
    .sort((first, second) => {
      if (sort === 'date-asc') return new Date(first.purchasedAt).getTime() - new Date(second.purchasedAt).getTime()
      if (sort === 'amount-desc') return Number(second.totalAmount) - Number(first.totalAmount)
      if (sort === 'amount-asc') return Number(first.totalAmount) - Number(second.totalAmount)
      return new Date(second.purchasedAt).getTime() - new Date(first.purchasedAt).getTime()
    })

  async function refreshPurchases() {
    setPurchases(await listPurchases())
  }

  function openCreateModal() {
    setForm({ ...initialForm, items: [{ ...initialItem }], purchasedAt: new Date().toISOString().slice(0, 10) })
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSaving) return
    setIsModalOpen(false)
    setForm({ ...initialForm, items: [{ ...initialItem }] })
    setError('')
  }

  function updateItem(index: number, patch: Partial<PurchaseFormItem>) {
    setForm((currentForm) => ({
      ...currentForm,
      items: currentForm.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }))
  }

  function handleRawMaterialChange(index: number, rawMaterialId: string) {
    const material = rawMaterials.find((rawMaterial) => rawMaterial.id === rawMaterialId)
    updateItem(index, { rawMaterialId, unitId: material?.baseUnitId ?? '' })
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
      await createPurchase({
        invoiceNo: emptyToNull(form.invoiceNo),
        items: form.items.map((item) => ({
          quantity: Number(item.quantity),
          rawMaterialId: item.rawMaterialId,
          unitCost: Number(item.lineTotal) / Number(item.quantity),
          unitId: item.unitId,
        })),
        notes: emptyToNull(form.notes),
        purchasedAt: form.purchasedAt ? new Date(`${form.purchasedAt}T12:00:00`).toISOString() : undefined,
        supplierId: emptyToNull(form.supplierId),
      })

      await Promise.all([refreshPurchases(), refreshRawMaterials()])
      setToast({ message: 'Compra registrada correctamente. El stock y los costos fueron actualizados.', tone: 'success' })
      setIsModalOpen(false)
      setForm({ ...initialForm, items: [{ ...initialItem }] })
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  async function refreshRawMaterials() {
    setRawMaterials(await listRawMaterials())
  }

  function getUnitsForItem(item: PurchaseFormItem) {
    const material = rawMaterials.find((rawMaterial) => rawMaterial.id === item.rawMaterialId)

    if (!material) return units

    return units.filter((unit) => unit.kind === material.baseUnit.kind)
  }

  return (
    <section className="resource-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="page-heading resource-heading">
        <div>
          <span className="eyebrow">Operacion</span>
          <h1>Compras</h1>
          <p>Registra ingresos de insumos. Cada compra actualiza stock, costo promedio, ultimo costo y movimientos de inventario.</p>
        </div>
        <button className="primary-button resource-create-button" type="button" onClick={openCreateModal}>Nueva compra</button>
      </div>

      <div className="page-card resource-toolbar">
        <label><span>Buscar</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Factura, proveedor o insumo" /></label>
        <label><span>Proveedor</span><select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}><option value="all">Todos</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
        <label><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="date-desc">Mas recientes</option><option value="date-asc">Mas antiguas</option><option value="amount-desc">Mayor importe</option><option value="amount-asc">Menor importe</option></select></label>
        <button className="ghost-button" type="button" onClick={() => { setSearch(''); setSupplierFilter('all'); setSort('date-desc') }}>Limpiar</button>
      </div>

      <div className="page-card table-card">
        <div className="table-header"><h2>Historial</h2><span>{filteredPurchases.length} de {purchases.length} compras</span></div>
        {isLoading ? <p>Cargando compras...</p> : <div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Proveedor</th><th>Factura</th><th>Items</th><th>Total</th><th>Cargada por</th></tr></thead><tbody>{filteredPurchases.map((purchase) => <tr key={purchase.id}><td>{formatDate(purchase.purchasedAt)}</td><td>{purchase.supplier?.name ?? 'Sin proveedor'}</td><td>{purchase.invoiceNo ?? '-'}</td><td>{purchase.items.length} item{purchase.items.length === 1 ? '' : 's'}<small className="table-detail">{purchase.items.slice(0, 2).map((item) => item.rawMaterial.name).join(', ')}{purchase.items.length > 2 ? '...' : ''}</small></td><td>${formatNumber(purchase.totalAmount)}</td><td>{purchase.createdBy.firstName} {purchase.createdBy.lastName}</td></tr>)}</tbody></table></div>}
      </div>

      <Modal className="purchase-modal-card" isOpen={isModalOpen} title="Nueva compra" description="Carga los items tal como vienen en la factura. El sistema normaliza cantidades a la unidad base del insumo." onClose={closeModal}>
        <form className="resource-form modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>Proveedor</span><select value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}><option value="">Sin proveedor</option>{activeSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
            <label><span>Fecha</span><input type="date" value={form.purchasedAt} onChange={(event) => setForm({ ...form, purchasedAt: event.target.value })} /></label>
            <label><span>Factura / comprobante</span><input value={form.invoiceNo} onChange={(event) => setForm({ ...form, invoiceNo: event.target.value })} maxLength={100} /></label>
            <label className="wide-field"><span>Notas</span><textarea rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
          </div>

          <section className="purchase-items-panel">
            <div className="table-header"><h2>Items</h2><button className="ghost-button" type="button" onClick={addItem}>Agregar item</button></div>
            <div className="purchase-item-list">
              {form.items.map((item, index) => {
                const availableUnits = getUnitsForItem(item)

                return (
                  <div className="purchase-item-row" key={index}>
                    <label><span>Materia prima</span><select value={item.rawMaterialId} onChange={(event) => handleRawMaterialChange(index, event.target.value)} required><option value="">Seleccionar</option>{activeRawMaterials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}</select></label>
                    <label><span>Cantidad</span><input min="0.0001" step="0.0001" type="number" value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} required /></label>
                    <label><span>Unidad</span><select value={item.unitId} onChange={(event) => updateItem(index, { unitId: event.target.value })} required><option value="">Seleccionar</option>{availableUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.code}</option>)}</select></label>
                    <label><span>Costo total</span><input min="0.01" step="0.01" type="number" value={item.lineTotal} onChange={(event) => updateItem(index, { lineTotal: event.target.value })} required /></label>
                    <div className="purchase-item-total"><span>Costo unit.</span><strong>${formatNumber(Number(item.lineTotal || 0) / Number(item.quantity || 1), 4)}</strong></div>
                    <button className="ghost-button" disabled={form.items.length === 1} type="button" onClick={() => removeItem(index)}>Quitar</button>
                  </div>
                )
              })}
            </div>
            <div className="purchase-summary"><span>Total estimado</span><strong>${formatNumber(formTotal)}</strong></div>
          </section>

          {error ? <p className="form-error">{error}</p> : null}
          <footer className="modal-actions"><button className="ghost-button" type="button" onClick={closeModal}>Cancelar</button><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? 'Registrando...' : 'Registrar compra'}</button></footer>
        </form>
      </Modal>
    </section>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short' }).format(new Date(value))
}
