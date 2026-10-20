import type { StoreId } from '../types/game'

type EpicDemoPrice = {
  originalPrice: number
  currentPrice: number
  currency: 'IDR'
}

// Nilai ilustrasi untuk kartu DATA DEMO; bukan harga Epic Store terverifikasi.
export const epicDemoPrices: Readonly<Record<string, EpicDemoPrice & { store: StoreId }>> = {
  'battlefield-6': { store: 'epic', originalPrice: 899000, currentPrice: 809100, currency: 'IDR' },
  'detroit-become-human': { store: 'epic', originalPrice: 399000, currentPrice: 159600, currency: 'IDR' },
  'sekiro-shadows-die-twice': { store: 'epic', originalPrice: 899000, currentPrice: 449500, currency: 'IDR' },
  'red-dead-redemption-2': { store: 'epic', originalPrice: 699000, currentPrice: 349500, currency: 'IDR' },
}
