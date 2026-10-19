import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'

import epicLogo from '../assets/epic-games.svg'
import GameMediaGallery from '../components/detail/GameMediaGallery'
import PriceHistoryPanel from '../components/detail/PriceHistoryPanel'
import type { GameCardData } from '../types/game'
import { discountPercent, formatPrice } from '../lib/prices'
import { usePriceHistory } from '../hooks/usePriceHistory'
import { getGameDetailContent, type SystemSpec } from '../data/gameDetails'
import { apiRequest, mapSystemRequirements, type BackendGame } from '../lib/backendApi'
import { verifiedStoreUrl } from '../data/verifiedStoreLinks'
import styles from './GameDetailPage.module.css'

type PriceHistoryStore = 'steam' | 'epic' | 'gog'

function formatUpdatedAt(value: string | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }) + ' WIB'
}


function SteamMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" fill="none">
      <circle cx="24" cy="24" r="22" fill="white" />
      <circle cx="30" cy="18" r="11" fill="#0a3453" />
      <circle cx="30" cy="18" r="7" stroke="white" strokeWidth="2.5" />
      <path d="M9 26 20 31 26 25" stroke="#0a3453" strokeWidth="5" strokeLinecap="round" />
      <circle cx="15" cy="32" r="7" fill="#0a3453" stroke="white" strokeWidth="2" />
    </svg>
  )
}

function SpecificationList({ title, specs }: { title: string; specs: readonly SystemSpec[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul>
        {specs.map(({ label, value }) => (
          <li key={label}>{label}: {value}</li>
        ))}
      </ul>
    </div>
  )
}

type GameDetailPageProps = {
  games: readonly GameCardData[]
  priceStatus: 'loading' | 'live' | 'unavailable'
}

function GameDetailPage({ games, priceStatus }: GameDetailPageProps) {
  const { gameId } = useParams<'gameId'>()
  const location = useLocation()
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [requirementsOpen, setRequirementsOpen] = useState(false)
  const [historyStore, setHistoryStore] = useState<PriceHistoryStore>('steam')
  const [backendDetail, setBackendDetail] = useState<BackendGame | null>(null)

  useEffect(() => {
    if (!gameId) return
    const controller = new AbortController()
    void apiRequest<{ data?: BackendGame } | BackendGame>(`/games/${encodeURIComponent(gameId)}`, { signal: controller.signal })
      .then((response) => {
        const data = 'data' in response && response.data ? response.data : response as BackendGame
        if (!controller.signal.aborted) setBackendDetail(data)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.warn('GameHub game detail:', error)
      })
    return () => controller.abort()
  }, [gameId])

  // ID merepresentasikan GAME, bukan listing tokonya.
  const history = usePriceHistory(gameId, historyStore)
  const offers = games.filter((item) => item.id === gameId)
  const game = offers[0]

  if (!game) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <h1>Game tidak ditemukan</h1>
          <p>Game yang kamu cari belum tersedia dalam katalog.</p>
          <Link className={styles.backLink} to="/catalog">← Kembali ke Katalog</Link>
        </div>
      </main>
    )
  }

  const detail = getGameDetailContent(game.id, game.title)
  const description = backendDetail?.description?.trim()
    ? [backendDetail.description.trim()]
    : detail?.description.length ? detail.description : game.description ? [game.description] : []
  const apiMinimum = mapSystemRequirements(backendDetail?.system_requirements, 'minimum')
  const apiRecommended = mapSystemRequirements(backendDetail?.system_requirements, 'recommended')
  const state: unknown = location.state
  let backTo = '/catalog'
  if (state && typeof state === 'object' && 'from' in state) {
    const from = (state as { from: unknown }).from
    if (typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.includes('\\')) {
      backTo = from
    }
  }

  const orderedOffers = [...offers].sort((a, b) => (
    a.store === 'steam' ? -1 : b.store === 'steam' ? 1 : 0
  ))

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link className={styles.backLink} to={backTo}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="m12 4-8 8 8 8M4 12h17" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kembali
        </Link>

        <h1 className={styles.gameTitle}>{game.title}</h1>

        <div className={styles.overview}>
          <div className={styles.mediaColumn}>
            <GameMediaGallery
              key={game.id}
              title={game.title}
              heroSrc={detail?.hero ?? game.coverSrc}
              hasWideHero={Boolean(detail)}
              gallery={detail?.gallery ?? []}
            />
          </div>

          <aside className={styles.offers} aria-label="Perbandingan harga toko">
            {orderedOffers.map((offer, index) => {
              const discount = discountPercent(offer.originalPrice, offer.currentPrice)
              const apiStoreUrl = offer.dealUrl && /^https?:\/\//i.test(offer.dealUrl) ? offer.dealUrl : null
              const storeUrl = apiStoreUrl ?? verifiedStoreUrl(offer.id, offer.store)
              const updatedAt = offer.currentPrice !== null ? formatUpdatedAt(offer.priceUpdatedAt) : null
              return (
                <div key={`${offer.store}:${offer.id}`}>
                  {index > 0 && <div className={styles.offerDivider} aria-hidden="true" />}
                  <div className={`${styles.offerCard} ${offer.currentPrice === null ? styles.offerCardUnavailable : ''}`}>
                    <div className={styles.offerBrand}>
                      {offer.store === 'steam' ? <SteamMark /> : offer.store === 'epic' ? <img src={epicLogo} alt="" /> : null}
                      <strong>{offer.store === 'steam' ? 'Steam' : offer.store === 'epic' ? 'Epic' : 'GOG'}</strong>
                    </div>
                    <div className={styles.offerPrices}>
                      {discount > 0 && offer.originalPrice !== null && (
                        <del>{formatPrice(offer.originalPrice)}</del>
                      )}
                      <strong>{formatPrice(offer.currentPrice)}</strong>
                    </div>
                    {discount > 0 && <span className={styles.discount}>{discount}%</span>}
                  </div>
                  <div className={styles.offerMeta}>
                    {offer.currentPrice !== null && offer.currency === 'IDR' ? (
                      <>
                        <span>Sumber: {offer.store === 'steam' ? 'Steam Store' : offer.store === 'epic' ? 'Epic Games Store' : 'GOG'} · IDR</span>
                        {updatedAt && <span>Harga diambil: <time dateTime={offer.priceUpdatedAt}>{updatedAt}</time></span>}
                      </>
                    ) : (
                      <span>Harga {offer.store === 'steam' ? 'Steam' : offer.store === 'epic' ? 'Epic Games Store' : 'GOG'} belum tersedia dari API.</span>
                    )}
                    {storeUrl && <a className={styles.storeLink} href={storeUrl} target="_blank" rel="noopener noreferrer">
                      Lihat di {offer.store === 'steam' ? 'Steam' : offer.store === 'epic' ? 'Epic Games Store' : 'GOG'} ↗
                      <span className={styles.visuallyHidden}>(buka tab baru)</span>
                    </a>}
                  </div>
                </div>
              )
            })}
            <p className={styles.demoNote}>{priceStatus === 'live' ? 'Harga dan diskon mengikuti data backend GameHub. Toko tanpa data harga ditandai “belum tersedia”.' : 'Harga aktual sedang dimuat atau belum tersedia dari API.'}</p>
          </aside>
        </div>

        <section className={styles.about} aria-labelledby="about-title">
          <h2 id="about-title">Tentang Game ini</h2>
          {description.length ? (
            <>
              <div id="game-description" className={styles.description}>
                {descriptionOpen ? (
                  description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                ) : (
                  <p className={styles.clampedDescription}>{description[0]}</p>
                )}
              </div>
              <button
                className={styles.readMore}
                type="button"
                aria-expanded={descriptionOpen}
                aria-controls="game-description"
                onClick={() => setDescriptionOpen((open) => !open)}
              >
                {descriptionOpen ? 'Tampilkan lebih sedikit' : 'Baca selengkapnya'}
                <svg className={descriptionOpen ? styles.upChevron : undefined} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m5 9 7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          ) : (
            <p className={styles.unavailable}>Deskripsi lengkap untuk game ini belum tersedia.</p>
          )}
        </section>

        <section className={styles.requirements} aria-labelledby="requirements-title">
          <h2 id="requirements-title">
            <button
              className={styles.requirementsToggle}
              type="button"
              aria-expanded={requirementsOpen}
              aria-controls="game-requirements"
              onClick={() => setRequirementsOpen((open) => !open)}
            >
              Persyaratan Sistem
              <svg className={requirementsOpen ? styles.upChevron : undefined} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m5 9 7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </h2>
          <div id="game-requirements" className={styles.requirementsContent} hidden={!requirementsOpen}>
            {apiMinimum.length || apiRecommended.length ? (
              <div className={styles.specGrid}>
                {apiMinimum.length > 0 && <SpecificationList title="Minimum:" specs={apiMinimum} />}
                {apiRecommended.length > 0 && <SpecificationList title="Direkomendasikan:" specs={apiRecommended} />}
              </div>
            ) : detail && (detail.minimum.length > 0 || detail.recommended.length > 0) ? (
              <div className={styles.specGrid}>
                {detail.minimum.length > 0 && <SpecificationList title="Minimum:" specs={detail.minimum} />}
                {detail.recommended.length > 0 && <SpecificationList title="Direkomendasikan:" specs={detail.recommended} />}
              </div>
            ) : (
              <p className={styles.unavailable}>Persyaratan sistem game ini belum tersedia.</p>
            )}
          </div>
        </section>

        <section className={styles.history} aria-labelledby="history-title">
          <div className={styles.historyHeading}>
            <h2 id="history-title">Riwayat harga &amp; diskon</h2>
            <label className={styles.historySelector}>
              <span className={styles.visuallyHidden}>Pilih platform riwayat harga</span>
              <select value={historyStore} onChange={(event) => setHistoryStore(event.target.value as PriceHistoryStore)}>
                <option value="steam">Steam</option>
                <option value="epic">Epic</option>
                <option value="gog">GOG</option>
              </select>
            </label>
          </div>
          <PriceHistoryPanel store={historyStore} source={history.source} status={history.status} points={history.points} />
        </section>
      </div>
    </main>
  )
}

export default GameDetailPage