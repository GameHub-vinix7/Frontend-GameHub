import { Link, useSearchParams } from 'react-router'

import CatalogFilters from '../components/catalog/CatalogFilters'
import Pagination from '../components/catalog/Pagination'
import SortDropdown from '../components/catalog/SortDropdown'
import GameGrid from '../components/store/GameGrid'
import type { GameCardData } from '../types/game'
import { filterCatalogGames, sortCatalogGames } from '../lib/catalogLogic'
import { readCatalogUrlState, updateCatalogUrlState, type CatalogUrlPatch } from '../lib/catalogUrlState'
import type { GenreFilter, ShopFilter } from '../data/catalogOptions'
import type { StoreId } from '../types/game'
import styles from './CatalogPage.module.css'
import searchStyles from './CatalogSearch.module.css'

const PAGE_SIZE = 6

const STORE_DETAILS: Record<StoreId, { title: string; description: string }> = {
  steam: {
    title: 'Steam',
    description: 'Temukan berbagai game Steam dan lihat harga serta promo yang tersedia.',
  },
  epic: {
    title: 'Epic Games Store',
    description: 'Temukan berbagai game Epic Games Store dan lihat harga serta promo yang tersedia.',
  },
  gog: {
    title: 'GOG',
    description: 'Informasi harga game dari GOG.',
  },
}

type CatalogPageProps = {
  games: readonly GameCardData[]
  priceStatus: 'loading' | 'live' | 'unavailable'
  favoriteIds: readonly string[]
  onToggleFavorite: (gameId: string) => void
  fixedStore?: StoreId
}

function CatalogPage({ games, priceStatus, favoriteIds, onToggleFavorite, fixedStore }: CatalogPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = (searchParams.get('q') ?? '').trim()
  const isSearching = query.length > 0

  // URL menjadi sumber state agar filter/sort/page bertahan saat navigasi dan refresh.
  const { shops, genres, sort, page } = readCatalogUrlState(searchParams)
  const updateUrl = (patch: CatalogUrlPatch) => {
    setSearchParams(updateCatalogUrlState(searchParams, patch), { preventScrollReset: true })
  }

  const filtered = filterCatalogGames(games, { shops, genres, query, fixedStore })
  const sorted = sortCatalogGames(filtered, sort)

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const safePage = Math.max(1, Math.min(page, totalPages || 1))
  const visibleGames = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const toggleShop = (shop: ShopFilter) => {
    const nextShops = shops.includes(shop)
      ? shops.filter((item) => item !== shop)
      : [...shops, shop]
    updateUrl({ shops: nextShops, page: 1 })
  }

  const toggleGenre = (genre: GenreFilter) => {
    const nextGenres = genres.includes(genre)
      ? genres.filter((item) => item !== genre)
      : [...genres, genre]
    updateUrl({ genres: nextGenres, page: 1 })
  }

  const heading = fixedStore
    ? {
        ...STORE_DETAILS[fixedStore],
        ...(fixedStore === 'epic' && games.some((game) => game.isDemo)
          ? { description: 'Backend belum menyediakan data Epic; kartu di halaman ini adalah contoh demo.' }
          : {}),
      }
    : {
        title: 'Katalog Game',
        description: 'Temukan berbagai game dan bandingkan harga dari beberapa platform',
      }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {fixedStore && (
          <Link className={styles.backLink} to="/">
            <span aria-hidden="true">←</span> Kembali
          </Link>
        )}

        <div className={styles.heading}>
          <div>
            <h1>{heading.title}</h1>
            <p>{heading.description}</p>
          </div>
          <SortDropdown
            value={sort}
            onChange={(next) => updateUrl({ sort: next, page: 1 })}
          />
        </div>

        <div className={styles.divider} aria-hidden="true" />

        {isSearching && (
          <div className={searchStyles.searchContext}>
            <span>Hasil pencarian untuk <strong>“{query}”</strong></span>
          </div>
        )}

        <p role="status" style={{ color: '#9cb0c6', padding: '0 16px' }}>
          {priceStatus === 'loading' ? 'Memuat informasi harga aktual…' :
            priceStatus === 'unavailable' ? 'Katalog backend tidak tersedia. Periksa koneksi API.' :
              games.some((game) => game.isDemo)
                ? 'Katalog Steam berasal dari backend. Data Epic pada kartu bertanda DATA DEMO dan tidak memiliki harga live.'
                : 'Data katalog dan penawaran berasal dari backend GameHub.'}
        </p>
        <div className={styles.layout}>
          <CatalogFilters
            showShops={!fixedStore}
            selectedShops={shops}
            selectedGenres={genres}
            onShopToggle={toggleShop}
            onGenreToggle={toggleGenre}
          />
          <section className={styles.results} aria-label={`Hasil ${heading.title}`}>
            <p className={styles.resultCount} role="status">
              {filtered.length} hasil ditemukan
            </p>
            {visibleGames.length ? (
              <GameGrid
                className={styles.grid}
                games={visibleGames}
                favoriteIds={favoriteIds}
                onToggleFavorite={onToggleFavorite}
              />
            ) : (
              <div className={styles.empty}>
                <h2 className={searchStyles.emptyTitle}>Tidak ada game yang cocok</h2>
                <p className={searchStyles.emptyText}>
                  {!fixedStore && shops.length === 1 && shops[0] === 'gog'
                    ? 'Belum ada game yang cocok dengan filter GOG saat ini. Coba pilih toko lain atau ubah filter.'
                    : isSearching
                      ? 'Coba kata kunci lain atau ubah pilihan Shops dan Genre.'
                      : 'Coba ubah pilihan Shops dan Genre untuk melihat game lainnya.'}
                </p>
                <div className={searchStyles.emptyActions}>
                  <button
                    className={searchStyles.resetButton}
                    type="button"
                    onClick={() => updateUrl({ shops: [], genres: [], page: 1 })}
                  >
                    Reset filter
                  </button>
                </div>
              </div>
            )}
            <Pagination page={safePage} totalPages={totalPages} onPageChange={(next) => updateUrl({ page: next })} />
          </section>
        </div>
      </div>
    </main>
  )
}

export default CatalogPage