import { FormEvent, useEffect, useState } from 'react'
import { listMeasurementUnits, type MeasurementUnit } from '../../features/measurement-units/api/measurementUnitsApi'
import { listRawMaterials, type RawMaterial } from '../../features/raw-materials/api/rawMaterialsApi'
import { createRecipe, deleteRecipe, getRecipeCost, listRecipes, updateRecipe, type Recipe, type RecipeCost } from '../../features/recipes/api/recipesApi'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { Modal } from '../../shared/components/Modal'
import { Toast, type ToastState } from '../../shared/components/Toast'
import { getErrorMessage } from '../../shared/utils/errors'
import { emptyToNull, formatNumber } from '../../shared/utils/formatters'

type IngredientForm = { rawMaterialId: string; quantity: string; unitId: string }
type StatusFilter = 'all' | 'active' | 'inactive'
type SortOption = 'name-asc' | 'name-desc' | 'ingredients-desc'

const emptyIngredient: IngredientForm = { rawMaterialId: '', quantity: '1', unitId: '' }
const initialForm = {
  description: '',
  ingredients: [emptyIngredient] as IngredientForm[],
  instructions: '',
  isActive: true,
  name: '',
  yieldQuantity: '1',
  yieldUnitId: '',
}

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [units, setUnits] = useState<MeasurementUnit[]>([])
  const [form, setForm] = useState(initialForm)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
  const [costRecipe, setCostRecipe] = useState<Recipe | null>(null)
  const [recipeCost, setRecipeCost] = useState<RecipeCost | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCostModalOpen, setIsCostModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingCost, setIsLoadingCost] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortOption>('name-asc')

  const activeMaterials = materials.filter((material) => material.isActive)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [recipesData, materialsData, unitsData] = await Promise.all([listRecipes(), listRawMaterials(), listMeasurementUnits()])

        if (isMounted) {
          setRecipes(recipesData)
          setMaterials(materialsData)
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

  const filteredRecipes = [...recipes]
    .filter((recipe) => {
      const normalizedSearch = search.trim().toLowerCase()
      const matchesSearch = !normalizedSearch || [recipe.name, recipe.description, recipe.yieldUnit.code]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? recipe.isActive : !recipe.isActive)

      return matchesSearch && matchesStatus
    })
    .sort((first, second) => {
      if (sort === 'name-desc') return second.name.localeCompare(first.name)
      if (sort === 'ingredients-desc') return second.ingredients.length - first.ingredients.length || first.name.localeCompare(second.name)
      return first.name.localeCompare(second.name)
    })

  async function refreshRecipes() {
    setRecipes(await listRecipes())
  }

  function openCreateModal() {
    setForm(initialForm)
    setEditingRecipe(null)
    setError('')
    setIsModalOpen(true)
  }

  function openEditModal(recipe: Recipe) {
    setEditingRecipe(recipe)
    setForm({
      description: recipe.description ?? '',
      ingredients: recipe.ingredients.map((ingredient) => ({
        quantity: String(ingredient.quantity),
        rawMaterialId: ingredient.rawMaterialId,
        unitId: ingredient.unitId,
      })),
      instructions: recipe.instructions ?? '',
      isActive: recipe.isActive,
      name: recipe.name,
      yieldQuantity: String(recipe.yieldQuantity),
      yieldUnitId: recipe.yieldUnitId,
    })
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSaving) return
    setIsModalOpen(false)
    setEditingRecipe(null)
    setForm(initialForm)
    setError('')
  }

  function updateIngredient(index: number, nextIngredient: IngredientForm) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) => ingredientIndex === index ? nextIngredient : ingredient),
    }))
  }

  function handleMaterialChange(index: number, rawMaterialId: string) {
    const material = materials.find((currentMaterial) => currentMaterial.id === rawMaterialId)
    const currentIngredient = form.ingredients[index]

    updateIngredient(index, {
      ...currentIngredient,
      rawMaterialId,
      unitId: material?.baseUnitId ?? '',
    })
  }

  function addIngredient() {
    setForm((current) => ({ ...current, ingredients: [...current.ingredients, emptyIngredient] }))
  }

  function removeIngredient(index: number) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.length === 1 ? current.ingredients : current.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
    }))
  }

  function getCompatibleUnits(rawMaterialId: string) {
    const material = materials.find((currentMaterial) => currentMaterial.id === rawMaterialId)

    return material ? units.filter((unit) => unit.kind === material.baseUnit.kind) : units
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const payload = {
        description: emptyToNull(form.description),
        ingredients: form.ingredients.map((ingredient) => ({
          quantity: Number(ingredient.quantity),
          rawMaterialId: ingredient.rawMaterialId,
          unitId: ingredient.unitId,
        })),
        instructions: emptyToNull(form.instructions),
        isActive: form.isActive,
        name: form.name,
        yieldQuantity: Number(form.yieldQuantity),
        yieldUnitId: form.yieldUnitId,
      }

      if (editingRecipe) await updateRecipe(editingRecipe.id, payload)
      else await createRecipe(payload)

      await refreshRecipes()
      setToast({ message: editingRecipe ? 'Receta actualizada correctamente.' : 'Receta creada correctamente.', tone: 'success' })
      setIsModalOpen(false)
      setEditingRecipe(null)
      setForm(initialForm)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!recipeToDelete) return
    setIsDeleting(true)

    try {
      await deleteRecipe(recipeToDelete.id)
      await refreshRecipes()
      setToast({ message: 'Receta desactivada correctamente.', tone: 'success' })
      setRecipeToDelete(null)
    } catch (caughtError) {
      setToast({ message: getErrorMessage(caughtError), tone: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  async function openCostModal(recipe: Recipe) {
    setCostRecipe(recipe)
    setRecipeCost(null)
    setIsCostModalOpen(true)
    setIsLoadingCost(true)

    try {
      setRecipeCost(await getRecipeCost(recipe.id))
    } catch (caughtError) {
      setToast({ message: getErrorMessage(caughtError), tone: 'error' })
      setIsCostModalOpen(false)
    } finally {
      setIsLoadingCost(false)
    }
  }

  return (
    <section className="resource-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="page-heading resource-heading">
        <div>
          <span className="eyebrow">Costos</span>
          <h1>Recetas</h1>
          <p>Define ingredientes, rendimiento y costo estimado para conectar productos, ventas y stock.</p>
        </div>
        <button className="primary-button resource-create-button" type="button" onClick={openCreateModal}>Nueva receta</button>
      </div>

      <div className="page-card resource-toolbar">
        <label><span>Buscar</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, descripcion o unidad" /></label>
        <label><span>Estado</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">Todas</option><option value="active">Activas</option><option value="inactive">Inactivas</option></select></label>
        <label><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="name-asc">Nombre A-Z</option><option value="name-desc">Nombre Z-A</option><option value="ingredients-desc">Mas ingredientes</option></select></label>
        <button className="ghost-button" type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setSort('name-asc') }}>Limpiar</button>
      </div>

      <div className="page-card table-card">
        <div className="table-header"><h2>Listado</h2><span>{filteredRecipes.length} de {recipes.length} recetas</span></div>
        {isLoading ? <p>Cargando recetas...</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>Rendimiento</th><th>Ingredientes</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>{filteredRecipes.map((recipe) => <tr key={recipe.id}><td>{recipe.name}</td><td>{formatNumber(recipe.yieldQuantity, 4)} {recipe.yieldUnit.code}</td><td>{recipe.ingredients.length}</td><td>{recipe.isActive ? 'Activa' : 'Inactiva'}</td><td className="row-actions"><button type="button" onClick={() => void openCostModal(recipe)}>Costo</button><button type="button" onClick={() => openEditModal(recipe)}>Editar</button><button type="button" onClick={() => setRecipeToDelete(recipe)}>Desactivar</button></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} title={editingRecipe ? 'Editar receta' : 'Nueva receta'} description="Carga rendimiento e ingredientes. Los costos se calculan con el costo promedio de cada materia prima." onClose={closeModal}>
        <form className="resource-form modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>Nombre</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={160} /></label>
            <label><span>Rendimiento</span><input min="0.0001" step="0.0001" type="number" value={form.yieldQuantity} onChange={(event) => setForm({ ...form, yieldQuantity: event.target.value })} required /></label>
            <label><span>Unidad de rendimiento</span><select value={form.yieldUnitId} onChange={(event) => setForm({ ...form, yieldUnitId: event.target.value })} required><option value="">Seleccionar</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>)}</select></label>
            <label className="wide-field"><span>Descripcion</span><textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label className="wide-field"><span>Instrucciones</span><textarea rows={3} value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} /></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /><span>Activa</span></label>
          </div>

          <div className="recipe-ingredients-panel">
            <div className="table-header"><h2>Ingredientes</h2><button className="ghost-button" type="button" onClick={addIngredient}>Agregar ingrediente</button></div>
            <div className="recipe-ingredient-list">
              {form.ingredients.map((ingredient, index) => (
                <div className="recipe-ingredient-row" key={`${index}-${ingredient.rawMaterialId}`}>
                  <label><span>Materia prima</span><select value={ingredient.rawMaterialId} onChange={(event) => handleMaterialChange(index, event.target.value)} required><option value="">Seleccionar</option>{activeMaterials.map((material) => <option key={material.id} value={material.id}>{material.name} ({material.baseUnit.code})</option>)}</select></label>
                  <label><span>Cantidad</span><input min="0.0001" step="0.0001" type="number" value={ingredient.quantity} onChange={(event) => updateIngredient(index, { ...ingredient, quantity: event.target.value })} required /></label>
                  <label><span>Unidad</span><select value={ingredient.unitId} onChange={(event) => updateIngredient(index, { ...ingredient, unitId: event.target.value })} required><option value="">Seleccionar</option>{getCompatibleUnits(ingredient.rawMaterialId).map((unit) => <option key={unit.id} value={unit.id}>{unit.code}</option>)}</select></label>
                  <button className="ghost-button" disabled={form.ingredients.length === 1} type="button" onClick={() => removeIngredient(index)}>Quitar</button>
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="form-error">{error}</p> : null}
          <footer className="modal-actions"><button className="ghost-button" type="button" onClick={closeModal}>Cancelar</button><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? 'Guardando...' : 'Guardar'}</button></footer>
        </form>
      </Modal>

      <Modal isOpen={isCostModalOpen} title={`Costo de ${costRecipe?.name ?? 'receta'}`} description="Estimacion basada en costo promedio actual de materias primas." onClose={() => setIsCostModalOpen(false)}>
        <div className="modal-form recipe-cost-detail">
          {isLoadingCost ? <p>Cargando costo...</p> : null}
          {recipeCost ? (
            <>
              <div className="recipe-cost-summary">
                <article><span>Total receta</span><strong>${formatNumber(recipeCost.totalCost, 2)}</strong></article>
                <article><span>Costo por {recipeCost.yieldUnitCode}</span><strong>${formatNumber(recipeCost.costPerYieldUnit, 2)}</strong></article>
                <article><span>Rendimiento</span><strong>{formatNumber(recipeCost.yieldQuantity, 4)} {recipeCost.yieldUnitCode}</strong></article>
              </div>
              <div className="table-wrap"><table><thead><tr><th>Ingrediente</th><th>Cantidad</th><th>Base</th><th>Costo unit.</th><th>Total</th></tr></thead><tbody>{recipeCost.ingredients.map((ingredient) => <tr key={ingredient.rawMaterialId}><td>{ingredient.rawMaterialName}</td><td>{formatNumber(ingredient.quantity, 4)} {ingredient.unitCode}</td><td>{formatNumber(ingredient.quantityBase, 4)} {ingredient.baseUnitCode}</td><td>${formatNumber(ingredient.unitBaseCost, 4)}</td><td>${formatNumber(ingredient.totalCost, 2)}</td></tr>)}</tbody></table></div>
            </>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        confirmLabel="Desactivar"
        description={`La receta ${recipeToDelete?.name ?? ''} quedara inactiva y no podra usarse para nuevas operaciones.`}
        isConfirming={isDeleting}
        isOpen={Boolean(recipeToDelete)}
        onCancel={() => setRecipeToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Desactivar receta"
        tone="warning"
      />
    </section>
  )
}
