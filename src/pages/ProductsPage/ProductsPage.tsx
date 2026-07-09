import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { createProduct, deleteProduct, listProducts, updateProduct, type Product } from '../../features/products/api/productsApi'
import { listRecipes, type RecipeSummary } from '../../features/recipes/api/recipesApi'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { Modal } from '../../shared/components/Modal'
import { Toast, type ToastState } from '../../shared/components/Toast'
import { getErrorMessage } from '../../shared/utils/errors'
import { emptyToUndefined, formatNumber } from '../../shared/utils/formatters'

const initialForm = { description: '', isActive: true, isPublished: false, name: '', recipeId: '', salePrice: '0', sku: '' }

type StatusFilter = 'all' | 'active' | 'inactive'
type PublishedFilter = 'all' | 'published' | 'hidden'
type RecipeFilter = 'all' | 'with-recipe' | 'without-recipe'
type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

export function ProductsPage() {
  const { user } = useAuth()
  const canReadRecipes = Boolean(user?.permissions.includes('recipes:manage'))
  const [products, setProducts] = useState<Product[]>([])
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [form, setForm] = useState(initialForm)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>('all')
  const [recipeFilter, setRecipeFilter] = useState<RecipeFilter>('all')
  const [sort, setSort] = useState<SortOption>('name-asc')

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [productsData, recipesData] = await Promise.all([listProducts(), canReadRecipes ? listRecipes() : Promise.resolve([])])
        if (isMounted) { setProducts(productsData); setRecipes(recipesData) }
      } catch (caughtError) {
        if (isMounted) setToast({ message: getErrorMessage(caughtError), tone: 'error' })
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => { isMounted = false }
  }, [canReadRecipes])

  const filteredProducts = [...products]
    .filter((product) => {
      const normalizedSearch = search.trim().toLowerCase()
      const matchesSearch = !normalizedSearch || [product.name, product.sku, product.recipe?.name]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch))
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? product.isActive : !product.isActive)
      const matchesPublished = publishedFilter === 'all' || (publishedFilter === 'published' ? product.isPublished : !product.isPublished)
      const matchesRecipe = recipeFilter === 'all' || (recipeFilter === 'with-recipe' ? Boolean(product.recipeId) : !product.recipeId)

      return matchesSearch && matchesStatus && matchesPublished && matchesRecipe
    })
    .sort((first, second) => {
      if (sort === 'name-desc') return second.name.localeCompare(first.name)
      if (sort === 'price-asc') return Number(first.salePrice) - Number(second.salePrice)
      if (sort === 'price-desc') return Number(second.salePrice) - Number(first.salePrice)
      return first.name.localeCompare(second.name)
    })

  async function refreshProducts() { setProducts(await listProducts()) }

  function openCreateModal() { setForm(initialForm); setEditingProduct(null); setError(''); setIsModalOpen(true) }

  function openEditModal(product: Product) {
    setEditingProduct(product)
    setForm({ description: product.description ?? '', isActive: product.isActive, isPublished: product.isPublished, name: product.name, recipeId: product.recipeId ?? '', salePrice: String(product.salePrice), sku: product.sku ?? '' })
    setError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    if (isSaving) return
    setIsModalOpen(false)
    setEditingProduct(null)
    setForm(initialForm)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const payload = { description: emptyToUndefined(form.description), isActive: form.isActive, isPublished: form.isPublished, name: form.name, recipeId: emptyToUndefined(form.recipeId), salePrice: Number(form.salePrice), sku: emptyToUndefined(form.sku) }
      if (editingProduct) await updateProduct(editingProduct.id, payload)
      else await createProduct(payload)

      await refreshProducts()
      setToast({ message: editingProduct ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.', tone: 'success' })
      setIsModalOpen(false)
      setEditingProduct(null)
      setForm(initialForm)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!productToDelete) return
    setIsDeleting(true)

    try {
      await deleteProduct(productToDelete.id)
      await refreshProducts()
      setToast({ message: 'Producto desactivado correctamente.', tone: 'success' })
      setProductToDelete(null)
    } catch (caughtError) {
      setToast({ message: getErrorMessage(caughtError), tone: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="resource-page">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="page-heading resource-heading"><div><span className="eyebrow">Maestros</span><h1>Productos</h1><p>Productos vendibles, precios, publicacion y asociacion opcional a recetas.</p></div><button className="primary-button resource-create-button" type="button" onClick={openCreateModal}>Nuevo producto</button></div>

      <div className="page-card resource-toolbar">
        <label><span>Buscar</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, SKU o receta" /></label>
        <label><span>Estado</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></label>
        <label><span>Publicacion</span><select value={publishedFilter} onChange={(event) => setPublishedFilter(event.target.value as PublishedFilter)}><option value="all">Todos</option><option value="published">Publicados</option><option value="hidden">Ocultos</option></select></label>
        <label><span>Receta</span><select value={recipeFilter} onChange={(event) => setRecipeFilter(event.target.value as RecipeFilter)}><option value="all">Todos</option><option value="with-recipe">Con receta</option><option value="without-recipe">Sin receta</option></select></label>
        <label><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="name-asc">Nombre A-Z</option><option value="name-desc">Nombre Z-A</option><option value="price-asc">Precio menor</option><option value="price-desc">Precio mayor</option></select></label>
        <button className="ghost-button" type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setPublishedFilter('all'); setRecipeFilter('all'); setSort('name-asc') }}>Limpiar</button>
      </div>

      <div className="page-card table-card"><div className="table-header"><h2>Listado</h2><span>{filteredProducts.length} de {products.length} productos</span></div>{isLoading ? <p>Cargando productos...</p> : <div className="table-wrap"><table><thead><tr><th>Nombre</th><th>SKU</th><th>Receta</th><th>Precio</th><th>Publicado</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filteredProducts.map((product) => <tr key={product.id}><td>{product.name}</td><td>{product.sku ?? '-'}</td><td>{product.recipe?.name ?? '-'}</td><td>${formatNumber(product.salePrice)}</td><td>{product.isPublished ? 'Si' : 'No'}</td><td>{product.isActive ? 'Activo' : 'Inactivo'}</td><td className="row-actions"><button type="button" onClick={() => openEditModal(product)}>Editar</button><button type="button" onClick={() => setProductToDelete(product)}>Desactivar</button></td></tr>)}</tbody></table></div>}</div>

      <Modal isOpen={isModalOpen} title={editingProduct ? 'Editar producto' : 'Nuevo producto'} description="Carga precio, publicacion y receta asociada si corresponde." onClose={closeModal}>
        <form className="resource-form modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>Nombre</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={160} /></label>
            <label><span>SKU</span><input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} maxLength={80} /></label>
            <label><span>Precio de venta</span><input min="0" step="0.01" type="number" value={form.salePrice} onChange={(event) => setForm({ ...form, salePrice: event.target.value })} required /></label>
            <label><span>Receta</span><select disabled={!canReadRecipes} value={form.recipeId} onChange={(event) => setForm({ ...form, recipeId: event.target.value })}><option value="">Sin receta</option>{recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}</select></label>
            <label className="wide-field"><span>Descripcion</span><textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} /><span>Publicado</span></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /><span>Activo</span></label>
          </div>
          {!canReadRecipes ? <p className="helper-text">No tenes permiso para leer recetas, por eso el selector queda deshabilitado.</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <footer className="modal-actions"><button className="ghost-button" type="button" onClick={closeModal}>Cancelar</button><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? 'Guardando...' : 'Guardar'}</button></footer>
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel="Desactivar"
        description={`El producto ${productToDelete?.name ?? ''} quedara inactivo y dejara de estar disponible para nuevas operaciones.`}
        isConfirming={isDeleting}
        isOpen={Boolean(productToDelete)}
        onCancel={() => setProductToDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Desactivar producto"
        tone="warning"
      />
    </section>
  )
}
