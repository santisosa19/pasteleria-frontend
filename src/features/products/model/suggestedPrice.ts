const priceFormatter = new Intl.NumberFormat('en-US', {
  useGrouping: false,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function getSuggestedPrice(unitCost: number, markup: string): string | null {
  const value = markup.trim()
  if (!Number.isFinite(unitCost) || unitCost <= 0 || !/^\d+([.,]\d{1,2})?$/.test(value)) return null

  const percent = Number(value.replace(',', '.'))
  const price = unitCost * ((100 + percent) / 100)
  if (price * 100 > Number.MAX_SAFE_INTEGER || !Number.isFinite(price) || price < 0.005) return null

  return priceFormatter.format(price)
}
