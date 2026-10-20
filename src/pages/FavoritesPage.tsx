import { Link } from 'react-router'
import GameGrid from '../components/store/GameGrid'
import type { GameCardData } from '../types/game'
import styles from './FavoritesPage.module.css'

type FavoritesPageProps = {
  games: readonly GameCardData[]
  priceStatus: 'loading' | 'live' | 'unavailable'
  favoriteIds: readonly string[]
  onToggleFavorite: (gameId: string) => void
}

function FavoritesPage({ games, favoriteIds, onToggleFavorite }: FavoritesPageProps) {
  // Satu favorit = satu game. Jika tersedia di beberapa toko,
  // tampilkan hanya satu kartu representatif (data demo pertama).
  const uniqueGames = games.filter(
    (game, index, all) => all.findIndex((candidate) => candidate.id === game.id) === index,
  )
  const favoriteGames = uniqueGames.filter((game) => favoriteIds.includes(game.id))

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        
      <div className={styles.backRow}>
        <Link to="/" className={styles.backLink}>
          ← Kembali
        </Link>
      </div>
        <h1>Favorit Saya ({favoriteGames.length})</h1>
        <div className={styles.divider} aria-hidden="true" />
        {favoriteGames.length ? (
          <GameGrid
            className={styles.grid}
            games={favoriteGames}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
          />
        ) : (
          <div className={styles.empty} role="status">
            <p>Belum ada game favorit.</p>
            <p>Pilih ikon hati pada kartu game di Katalog untuk menyimpannya di sini.</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default FavoritesPage
