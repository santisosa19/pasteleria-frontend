export function formatNumber(value: number | string | null | undefined, maximumFractionDigits = 2) {
  const numericValue = Number(value ?? 0)

  return new Intl.NumberFormat('es-AR', { maximumFractionDigits }).format(numericValue)
}

export function emptyToUndefined(value: string) {
  const trimmed = value.trim()

  return trimmed || undefined
}

export function emptyToNull(value: string) {
  const trimmed = value.trim()

  return trimmed || null
}
