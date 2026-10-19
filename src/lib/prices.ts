export function discountPercent(original: number | null, current: number | null): number {
  if (original === null || current === null || original <= 0 || current >= original) return 0
  return Math.round((1 - current / original) * 100)
}

export function formatPrice(value: number | null): string {
  if (value === null) return 'Harga belum tersedia'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value)
}
