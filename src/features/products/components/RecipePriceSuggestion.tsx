import { useEffect, useState } from 'react'
import { getRecipeCost, type RecipeCost } from '../../recipes/api/recipesApi'
import { formatNumber } from '../../../shared/utils/formatters'
import { getSuggestedPrice } from '../model/suggestedPrice'

type Props = {
  recipeId: string
  onApply: (price: string) => void
}

export function RecipePriceSuggestion({ recipeId, onApply }: Props) {
  const [cost, setCost] = useState<RecipeCost | null>(null)
  const [failed, setFailed] = useState(false)
  const [markup, setMarkup] = useState('')

  useEffect(() => {
    let active = true

    getRecipeCost(recipeId)
      .then((result) => { if (active) setCost(result) })
      .catch(() => { if (active) setFailed(true) })

    return () => { active = false }
  }, [recipeId])

  if (failed) return <p className="helper-text" role="status">No se pudo consultar el costo. Podes ingresar el precio manualmente.</p>
  if (!cost) return <p className="helper-text" role="status">Consultando el costo de la receta...</p>

  const missingCost = cost.ingredients.filter((ingredient) => ingredient.unitBaseCost <= 0)
  if (missingCost.length) {
    return <p className="helper-text" role="status">No hay precio sugerido: falta cargar un costo de compra para {missingCost.map((ingredient) => ingredient.rawMaterialName).join(', ')}.</p>
  }

  const price = getSuggestedPrice(cost.costPerYieldUnit, markup)

  return (
    <section className="purchase-items-panel" aria-label="Calcular precio sugerido">
      <div className="form-grid">
        <div className="purchase-item-total">
          <span>Costo estimado por {cost.yieldUnitCode}</span>
          <strong>${formatNumber(cost.costPerYieldUnit, 4)}</strong>
        </div>
        <label>
          <span>Recargo sobre el costo (%)</span>
          <input inputMode="decimal" value={markup} onChange={(event) => setMarkup(event.target.value)} placeholder="Ej.: 30" />
        </label>
      </div>
      <div className="purchase-summary">
        <div className="purchase-item-total" role="status">
          <span>Precio sugerido</span>
          <strong>{price === null ? '-' : `$${formatNumber(price)}`}</strong>
        </div>
        <button className="ghost-button" type="button" disabled={price === null} onClick={() => { if (price !== null) onApply(price) }}>
          Usar precio
        </button>
      </div>
      {markup.trim() && price === null ? <p className="helper-text">No se pudo calcular el precio. Revisa el costo e indica un recargo positivo o cero, con hasta dos decimales.</p> : null}
    </section>
  )
}
