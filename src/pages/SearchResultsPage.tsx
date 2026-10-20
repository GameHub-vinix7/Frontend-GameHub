import { Link, useLocation, useSearchParams } from 'react-router'

import GameGrid from '../components/store/GameGrid'
import type { GameCardData } from '../types/game'
import { filterCatalogGames } from '../lib/catalogLogic'
import styles from './SearchResultsPage.module.css'

type SearchResultsPageProps = {
  games: readonly GameCardData[]
  priceStatus: 'loading' | 'live' | 'unavailable'
  favoriteIds: readonly string[]
  onToggleFavorite: (gameId: string) => void
}

function SearchResultsPage({
  games,
  priceStatus,
  favoriteIds,
  onToggleFavorite,
}: SearchResultsPageProps) {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const query = (searchParams.get('q') ?? '').trim()

  // Sama seperti halaman detail: kembali ke halaman asal bila ada, jika tidak ke beranda.
  const state: unknown = location.state
  let backTo = '/'
  if (state && typeof state === 'object' && 'from' in state) {
    const from = (state as { from: unknown }).from
    if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.includes('\\')) {
      backTo = from
    }
  }

  // Halaman ini hanya menampilkan pencocokan kata kunci, tanpa filter toko/genre.
  const results = filterCatalogGames(games, { shops: [], genres: [], query })

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link className={styles.backLink} to={backTo}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="m12 4-8 8 8 8M4 12h17" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kembali
        </Link>

        <header className={styles.heading}>
          <h1>Hasil Pencarian</h1>
          <p role="status">
            {query
              ? `Ditemukan ${results.length} hasil untuk “${query}”`
              : 'Masukkan kata kunci pada kolom pencarian untuk mulai mencari game.'}
          </p>
        </header>

        <div className={styles.divider} aria-hidden="true" />

        {results.length ? (
          <GameGrid
            className={styles.grid}
            games={results}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
          />
        ) : (
          <div className={styles.empty} role="status">
            <h2 className={styles.emptyTitle}>
              {priceStatus === 'loading' ? 'Sedang memuat katalog…' : 'Tidak ada game yang cocok'}
            </h2>
            <p className={styles.emptyText}>
              {priceStatus === 'unavailable'
                ? 'Katalog backend tidak tersedia. Periksa koneksi API lalu coba lagi.'
                : query
                  ? `Tidak ada game yang cocok dengan “${query}”. Coba kata kunci lain atau lihat katalog lengkap.`
                  : 'Lihat katalog lengkap untuk menelusuri semua game yang tersedia.'}
            </p>
            <div className={styles.emptyActions}>
              <Link className={styles.primaryAction} to="/catalog">
                Buka katalog
              </Link>
              <Link className={styles.secondaryAction} to="/">
                Kembali ke beranda
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default SearchResultsPage
