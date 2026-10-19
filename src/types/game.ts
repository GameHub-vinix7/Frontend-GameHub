export type StoreId = 'steam' | 'epic' | 'gog'

export type GameCardData = {
  id: string
  title: string
  coverSrc: string
  store: StoreId
  originalPrice: number | null
  currentPrice: number | null
  currency?: 'IDR'
  priceUpdatedAt?: string
  dealUrl?: string
  rating: number | null
  genres: readonly string[]
  description?: string | null
}
