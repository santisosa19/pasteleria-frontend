import { FormEvent, useEffect, useState } from 'react'
import { createStockAdjustment, listLowStock, listStockMovements, type StockAdjustmentPayload, type StockMovement, type StockMovementSourceType, type StockMovementType } from '../../features/inventory/api/inventoryApi'
import { listMeasurementUnits, type MeasurementUnit } from '../../features/measurement-units/api/measurementUnitsApi'
import { listRawMaterials, type RawMaterial } from '../../features/raw-materials/api/rawMaterialsApi'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { Toast, type ToastState } from '../../shared/components/Toast'
import { getErrorMessage } from '../../shared/utils/errors'
import { emptyToUndefined, formatNumber } from '../../shared/utils/formatters'

type MovementFilters = {
  rawMaterialId: string
  sourceType: '' | StockMovementSourceType
  take: string
  type: '' | StockMovementType
}

const movementTypes: StockMovementType[] = ['PURCHASE_IN', 'SALE_OUT', 'PRODUCTION_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT']
const sourceTypes: StockMovementSourceType[] = ['PURCHASE', 'SALE', 'ORDER', 'MANUAL_ADJUSTMENT']
const initialFilters: MovementFilters = { rawMaterialId: '', sourceType: '', take: '100', type: '' }
const initialAdjustmentForm: {
  note: string
  quantity: string
  rawMaterialId: string
  type: StockAdjustmentPayload['type']
  unitId: string
} = { note: '', quantity: '1', rawMaterialId: '', type: 'ADJUSTMENT_IN', unitId: '' }

export function InventoryPage() {
  const { user } = useAuth()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [lowStock, setLowStock] = useState<RawMaterial[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [units, setUnits] = useState<MeasurementUnit[]>([])
  const [filters, setFilters] = useState<MovementFilters>(initialFilters)
  const [adjustmentForm, setAdjustmentForm] = useState(initialAdjustmentForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isFiltering, setIsFiltering] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)

  const canReadMovements = hasPermission(user?.permissions, 'inventory:movements:read')
  const canReadLowStock = hasPermission(user?.permissions, 'inventory:low-stock:read')
  const canCreateAdjustment = hasPermission(user?.permissions, 'inventory:adjustments:create')
  const selectedRawMaterial = rawMaterials.find((material) => material.id === adjustmentForm.rawMaterialId)
  const activeRawMaterials = rawMaterials.filter((material) => material.isActive)
  const availableUnits = selectedRawMaterial
    ? units.filter((unit) => unit.kind === selectedRawMaterial.baseUnit.kind)
    : units

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [movementsData, lowStockData, materialsData, unitsData] = await Promise.all([
          canReadMovements ? listStockMovements({ take: Number(initialFilters.take) }) : Promise.resolve([]),
          canReadLowStock ? listLowStock() : Promise.resolve([]),
          canCreateAdjustment || canReadMovements ? listRawMaterials() : Promise.resolve([]),
          canCreateAdjustment ? listMeasurementUnits() : Promise.resolve([]),
        ])

        if (isMounted) {
          setMovements(movementsData)
          setLowStock(lowStockData)
          setRawMaterials(materialsData)
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
  }, [canCreateAdjustment, canReadLowStock, canReadMovements])

  async function refreshInventory() {
    const tasks = [
      canReadMovements ? listStockMovements(buildMovementQuery(filters)) : Promise.resolve(movements),
      canReadLowStock ? listLowStock() : Promise.resolve(lowStock),
      canCreateAdjustment || canReadMovements ? listRawMaterials() : Promise.resolve(rawMaterials),
    ] as const
    const [movementsData, lowStockData, rawMaterialsData] = await Promise.all(tasks)
    setMovements(movementsData)
    setLowStock(lowStockData)
    setRawMaterials(rawMaterialsData)
  }

  async function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsFiltering(true)

    try {
      setMovements(await listStockMovements(buildMovementQuery(filters)))
    } catch (caughtError) {
      setToast({ message: getErrorMessage(caughtError), tone: 'error' })
    } finally {
      setIsFiltering(false)
    }
  }

  function clearFilters() {
    setFilters(initialFilters)
    if (canReadMovements) void listStockMovements({ take: Number(initialFilters.take) }).then(setMovements)
  }

  function handleRawMaterialChange(rawMaterialId: string) {
    const material = rawMaterials.find((rawMaterial) => rawMaterial.id === rawMaterialId)
    setAdjustmentForm((currentForm) => ({
      ...currentForm,
      rawMaterialId,
      unitId: material?.baseUnitId ?? '',
    }))
  }

  async function handleAdjustmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setFormError('')

    try {
      const payload: StockAdjustmentPayload = {
        note: adjustmentForm.note.trim(),
        quantity: Number(adjustmentForm.quantity),
        rawMaterialId: adjustmentForm.rawMaterialId,
        type: adjustmentForm.type,
        unitId: adjustmentForm.unitId,
      }

      await createStockAdjustment(payload)
      await refreshInventory()
      setAdjustmentForm(initialAdjustmentForm)
      setToast({ message: 'Ajuste de inventario registrado correctamente.', tone: 'success' })
    } catch (caughtError) {
      setFormError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="resource-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="page-heading resource-heading">
        <div>
          <span className="eyebrow">Operacion</span>
          <h1>Inventario</h1>
          <p>Movimientos trazables, alertas de bajo stock y correcciones manuales controladas por permisos.</p>
        </div>
      </div>

      <div className="dashboard-grid metrics-grid">
        <article className="metric-card"><span>Movimientos visibles</span><strong>{movements.length}</strong><small>Segun filtros actuales</small></article>
        <article className="metric-card"><span>Stock bajo</span><strong>{lowStock.length}</strong><small>Insumos activos bajo minimo</small></article>
        <article className="metric-card"><span>Insumos activos</span><strong>{activeRawMaterials.length}</strong><small>Disponibles para ajustes</small></article>
      </div>

      {!canReadMovements && !canReadLowStock && !canCreateAdjustment ? (
        <div className="page-card"><p>No tenes permisos habilitados para operar inventario.</p></div>
      ) : null}

      {canCreateAdjustment ? (
        <div className="page-card">
          <div className="table-header"><h2>Ajuste manual</h2><span>Requiere motivo obligatorio</span></div>
          <form className="resource-form" onSubmit={handleAdjustmentSubmit}>
            <div className="form-grid">
              <label><span>Materia prima</span><select value={adjustmentForm.rawMaterialId} onChange={(event) => handleRawMaterialChange(event.target.value)} required><option value="">Seleccionar</option>{activeRawMaterials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}</select></label>
              <label><span>Tipo</span><select value={adjustmentForm.type} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, type: event.target.value as StockAdjustmentPayload['type'] })}><option value="ADJUSTMENT_IN">Entrada manual</option><option value="ADJUSTMENT_OUT">Salida manual</option></select></label>
              <label><span>Cantidad</span><input min="0.0001" step="0.0001" type="number" value={adjustmentForm.quantity} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, quantity: event.target.value })} required /></label>
              <label><span>Unidad</span><select value={adjustmentForm.unitId} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, unitId: event.target.value })} required><option value="">Seleccionar</option>{availableUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>)}</select></label>
              <label className="wide-field"><span>Motivo</span><textarea maxLength={255} rows={3} value={adjustmentForm.note} onChange={(event) => setAdjustmentForm({ ...adjustmentForm, note: event.target.value })} required /></label>
            </div>
            <p className="helper-text">Las salidas manuales no pueden dejar stock negativo. Cada ajuste queda auditado.</p>
            {formError ? <p className="form-error">{formError}</p> : null}
            <footer className="modal-actions"><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? 'Registrando...' : 'Registrar ajuste'}</button></footer>
          </form>
        </div>
      ) : null}

      {canReadLowStock ? (
        <div className="page-card table-card">
          <div className="table-header"><h2>Stock bajo</h2><span>{lowStock.length} alertas</span></div>
          {isLoading ? <p>Cargando alertas...</p> : <div className="table-wrap"><table><thead><tr><th>Materia prima</th><th>Stock actual</th><th>Minimo</th><th>Unidad</th><th>Costo prom.</th></tr></thead><tbody>{lowStock.map((material) => <tr key={material.id}><td>{material.name}</td><td>{formatNumber(material.currentStock, 4)}</td><td>{formatNumber(material.minimumStock, 4)}</td><td>{material.baseUnit.code}</td><td>${formatNumber(material.averageCost, 4)}</td></tr>)}</tbody></table>{!lowStock.length ? <p className="helper-text">No hay materias primas bajo minimo.</p> : null}</div>}
        </div>
      ) : null}

      {canReadMovements ? (
        <div className="page-card table-card">
          <div className="table-header"><h2>Movimientos</h2><span>{movements.length} registros</span></div>
          <form className="resource-toolbar" onSubmit={handleFilterSubmit}>
            <label><span>Materia prima</span><select value={filters.rawMaterialId} onChange={(event) => setFilters({ ...filters, rawMaterialId: event.target.value })}><option value="">Todas</option>{rawMaterials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}</select></label>
            <label><span>Tipo</span><select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value as MovementFilters['type'] })}><option value="">Todos</option>{movementTypes.map((type) => <option key={type} value={type}>{movementTypeLabel(type)}</option>)}</select></label>
            <label><span>Origen</span><select value={filters.sourceType} onChange={(event) => setFilters({ ...filters, sourceType: event.target.value as MovementFilters['sourceType'] })}><option value="">Todos</option>{sourceTypes.map((type) => <option key={type} value={type}>{sourceTypeLabel(type)}</option>)}</select></label>
            <label><span>Cantidad</span><input min="1" max="500" type="number" value={filters.take} onChange={(event) => setFilters({ ...filters, take: event.target.value })} /></label>
            <button className="primary-button" disabled={isFiltering} type="submit">{isFiltering ? 'Filtrando...' : 'Aplicar'}</button>
            <button className="ghost-button" type="button" onClick={clearFilters}>Limpiar</button>
          </form>
          {isLoading ? <p>Cargando movimientos...</p> : <div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Materia prima</th><th>Tipo</th><th>Cantidad base</th><th>Origen</th><th>Costo</th><th>Usuario</th><th>Nota</th></tr></thead><tbody>{movements.map((movement) => <tr key={movement.id}><td>{formatDate(movement.createdAt)}</td><td>{movement.rawMaterial.name}</td><td>{movementTypeLabel(movement.type)}</td><td>{formatSignedQuantity(movement)} {movement.rawMaterial.baseUnit.code}</td><td>{sourceTypeLabel(movement.sourceType)}</td><td>{movement.unitCostSnapshot == null ? '-' : `$${formatNumber(movement.unitCostSnapshot, 4)}`}</td><td>{movement.createdBy.firstName} {movement.createdBy.lastName}</td><td>{movement.note ?? '-'}</td></tr>)}</tbody></table>{!movements.length ? <p className="helper-text">No hay movimientos para los filtros seleccionados.</p> : null}</div>}
        </div>
      ) : null}
    </section>
  )
}

function hasPermission(permissions: string[] | undefined, permission: string) {
  return Boolean(permissions?.includes(permission))
}

function buildMovementQuery(filters: MovementFilters) {
  return {
    rawMaterialId: emptyToUndefined(filters.rawMaterialId),
    sourceType: emptyToUndefined(filters.sourceType) as StockMovementSourceType | undefined,
    take: Number(filters.take || initialFilters.take),
    type: emptyToUndefined(filters.type) as StockMovementType | undefined,
  }
}

function movementTypeLabel(type: StockMovementType) {
  const labels: Record<StockMovementType, string> = {
    ADJUSTMENT_IN: 'Ajuste entrada',
    ADJUSTMENT_OUT: 'Ajuste salida',
    PRODUCTION_OUT: 'Produccion',
    PURCHASE_IN: 'Compra',
    SALE_OUT: 'Venta',
  }

  return labels[type]
}

function sourceTypeLabel(type: StockMovementSourceType) {
  const labels: Record<StockMovementSourceType, string> = {
    MANUAL_ADJUSTMENT: 'Ajuste manual',
    ORDER: 'Pedido',
    PURCHASE: 'Compra',
    SALE: 'Venta',
  }

  return labels[type]
}

function formatSignedQuantity(movement: StockMovement) {
  const sign = ['SALE_OUT', 'PRODUCTION_OUT', 'ADJUSTMENT_OUT'].includes(movement.type) ? '-' : '+'
  return `${sign}${formatNumber(movement.quantityBase, 4)}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}
