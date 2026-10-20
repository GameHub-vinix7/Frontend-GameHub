import { useEffect, useState } from 'react'
import type { PriceHistoryPoint } from '../../hooks/usePriceHistory'
import { formatPrice } from '../../lib/prices'
import { historyDiscount, sortHistoryNewest, summarizeHistory } from '../../lib/historyMetrics'
import { fiveDayWindow, observedDayCount, observedWithin, type FiveDayWindow } from '../../lib/historyWindow'
import type { StoreId } from '../../types/game'
import styles from './PriceHistoryPanel.module.css'

type Props = {
  store: StoreId
  source: string | null
  status: 'loading' | 'empty' | 'available' | 'unavailable'
  points: readonly PriceHistoryPoint[]
}

const zone = 'Asia/Jakarta'

// Captured outside React rendering; subsequent updates happen in an effect.
const initialReferenceSeconds = Math.floor(Date.now() / 1000)

function observedDate(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString('id-ID', {
    timeZone: zone, day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }) + ' WIB'
}

function axisDate(seconds: number, includeTime: boolean): string {
  const date = new Date(seconds * 1000)
  return includeTime
    ? date.toLocaleString('id-ID', { timeZone: zone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('id-ID', { timeZone: zone, day: 'numeric', month: 'short' })
}

function axisPrice(value: number): string {
  if (value >= 1_000_000) return 'Rp' + (value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' jt'
  if (value >= 1_000) return 'Rp' + (value / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' rb'
  return formatPrice(value)
}

function PriceChart({ points, source, window }: {
  points: readonly PriceHistoryPoint[]; source: string; window: FiveDayWindow | null
}) {
  const ordered = [...points].sort((a, b) => a.observedAt - b.observedAt)
  const width = 960
  const height = 305
  const left = 112
  const right = 28
  const top = 28
  const bottom = 58
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const minTime = window?.startAt ?? ordered[0].observedAt
  const maxTime = window?.endAt ?? ordered[ordered.length - 1].observedAt
  const ceiling = Math.max(1, ...ordered.flatMap((p) => [p.originalPrice, p.currentPrice]))
  const x = (point: PriceHistoryPoint) => minTime === maxTime
    ? left + plotWidth / 2
    : left + (point.observedAt - minTime) / (maxTime - minTime) * plotWidth
  const y = (value: number) => top + plotHeight * (1 - value / ceiling)
  // Break lines after a missed 12-hour interval: never imply a measured price during a gap.
  const segments: PriceHistoryPoint[][] = []
  for (const point of ordered) {
    const last = segments[segments.length - 1]
    if (!last || point.observedAt - last[last.length - 1].observedAt > 12 * 3600) {
      segments.push([point])
    } else {
      last.push(point)
    }
  }
  const sameDay = axisDate(minTime, false) === axisDate(maxTime, false)
  const axisTimes = window?.ticks ?? (minTime === maxTime ? [minTime] : [minTime, (minTime + maxTime) / 2, maxTime])

  return (
    <div className={styles.chartFrame}>
      <div className={styles.chartTitle}>
        <strong>Grafik harga teramati</strong>
        <span>{source} · IDR · WIB</span>
      </div>
      <svg className={styles.chartSvg} viewBox={`0 0 ${width} ${height}`} role="img"
        aria-label={`Grafik ${ordered.length} observasi harga dari ${source}; dari ${observedDate(minTime)} hingga ${observedDate(maxTime)}.`}>
        {[0, .5, 1].map((ratio) => {
          const value = ceiling * ratio
          return (
            <g key={ratio}>
              <line x1={left} x2={width - right} y1={y(value)} y2={y(value)} className={styles.gridLine} />
              <text x={left - 16} y={y(value) + 5} textAnchor="end" className={styles.axisLabel}>{axisPrice(value)}</text>
            </g>
          )
        })}
        {axisTimes.map((time, index) => (
          <text key={index} x={minTime === maxTime ? left + plotWidth / 2 : left + ((time - minTime) / (maxTime - minTime)) * plotWidth}
            y={height - 19} className={styles.axisLabel}
            textAnchor={window || minTime === maxTime ? 'middle' : index === 0 ? 'start' : index === 2 ? 'end' : 'middle'}>
            {axisDate(time, window ? false : sameDay)}
          </text>
        ))}
        {segments.map((segment, index) => segment.length > 1 && (
          <g key={index}>
            <polyline points={segment.map((point) => `${x(point)},${y(point.originalPrice)}`).join(' ')}
              fill="none" className={styles.normalLine} />
            <polyline points={segment.map((point) => `${x(point)},${y(point.currentPrice)}`).join(' ')}
              fill="none" className={styles.priceLine} />
          </g>
        ))}
        {ordered.map((point) => (
          <g key={point.observedAt}>
            <circle cx={x(point)} cy={y(point.originalPrice)} r={ordered.length === 1 ? 5 : 3}
              className={styles.normalPoint}>
              <title>{observedDate(point.observedAt)} · Harga normal: {formatPrice(point.originalPrice)}</title>
            </circle>
            <circle cx={x(point)} cy={y(point.currentPrice)} r={ordered.length === 1 ? 7 : 4}
              className={historyDiscount(point) > 0 ? styles.discountPoint : styles.currentPoint}>
              <title>{observedDate(point.observedAt)} · Harga: {formatPrice(point.currentPrice)} · Diskon: {historyDiscount(point)}%</title>
            </circle>
          </g>
        ))}
      </svg>
      <div className={styles.legend} aria-hidden="true">
        <span><i className={styles.legendCurrent} />Harga tercatat</span>
        <span><i className={styles.legendNormal} />Harga normal</span>
        <span><i className={styles.legendDiscount} />Dalam diskon</span>
      </div>
      {ordered.length === 1 && (
        <p className={styles.onePoint}>Baru ada 1 observasi. Garis tren belum dapat dibentuk tanpa pengamatan berikutnya.</p>
      )}
    </div>
  )
}

type HistoryPeriod = 'fiveDays' | 'recorded'

function PeriodSelector({ period, onChange }: {
  period: HistoryPeriod
  onChange: (next: HistoryPeriod) => void
}) {
  return (
    <div className={styles.periodControls} role="group" aria-label="Rentang riwayat harga">
      <button type="button" className={period === 'fiveDays' ? styles.periodActive : undefined}
        aria-pressed={period === 'fiveDays'} onClick={() => onChange('fiveDays')}>5 hari terakhir</button>
      <button type="button" className={period === 'recorded' ? styles.periodActive : undefined}
        aria-pressed={period === 'recorded'} onClick={() => onChange('recorded')}>Hingga 90 observasi</button>
    </div>
  )
}

function EmptyHistory({ store, status }: Pick<Props, 'store' | 'status'>) {
  const retailer = store === 'steam' ? 'Steam' : store === 'epic' ? 'Epic Games' : 'GOG'
  return (
    <div className={styles.empty} role="status">
      <strong>
        {status === 'loading' ? 'Memuat riwayat harga…'
          : status === 'unavailable' ? 'Riwayat harga tidak dapat dimuat'
            : `Belum ada riwayat ${retailer} yang tercatat`}
      </strong>
      <p>
        {status === 'unavailable'
          ? 'Periksa koneksi backend dan muat ulang halaman. Kami tidak menampilkan data perkiraan.'
          : status === 'loading'
            ? 'Mengambil observasi harga dari database.'
            : store === 'steam'
              ? 'Pencatatan Steam belum menghasilkan observasi untuk game ini. Data akan muncul setelah berhasil direkam.'
              : store === 'gog'
                ? 'Belum ada observasi harga GOG yang tercatat. Data akan muncul setelah sinkronisasi GOG berhasil.'
                : 'Belum tersedia sumber harga regional Indonesia yang terverifikasi untuk Epic Games.'}
      </p>
    </div>
  )
}

export default function PriceHistoryPanel({ store, source, status, points }: Props) {
  const [period, setPeriod] = useState<HistoryPeriod>('fiveDays')
  const [referenceSeconds, setReferenceSeconds] = useState(initialReferenceSeconds)

  useEffect(() => {
    // Keep the five-calendar-day view current while the page remains open.
    const interval = setInterval(() => {
      setReferenceSeconds(Math.floor(Date.now() / 1000))
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const window = fiveDayWindow(referenceSeconds)
  const visible = period === 'fiveDays' ? observedWithin(points, window) : [...points]

  if (status !== 'available' || points.length === 0) return <EmptyHistory store={store} status={status} />
  if (!source) return <EmptyHistory store={store} status="unavailable" />

  const summary = summarizeHistory(visible)
  if (!summary) {
    return (
      <div className={styles.panel}>
        <PeriodSelector period={period} onChange={setPeriod} />
        <div className={styles.empty} role="status">
          <strong>Belum ada observasi dalam 5 hari kalender terakhir</strong>
          <p>Tidak ada harga lama yang dibuat atau disalin dari harga hari ini. Pilih "Hingga 90 observasi" untuk melihat data yang lebih lama.</p>
        </div>
      </div>
    )
  }

  const newest = sortHistoryNewest(visible)
  return (
    <div className={styles.panel}>
      <PeriodSelector period={period} onChange={setPeriod} />
      {period === 'fiveDays' && (
        <p className={styles.coverage}>Cakupan 5 hari terakhir: {observedDayCount(visible)} dari 5 tanggal memiliki observasi.
          Tanggal tanpa catatan bukan berarti harga Rp0 atau tidak ada diskon.</p>
      )}
      <p className={styles.provenance}>
        Sumber: {source} · Wilayah Indonesia (ID) · Mata uang IDR ·
        Terakhir direkam: <time dateTime={new Date(summary.lastObservedAt * 1000).toISOString()}>{observedDate(summary.lastObservedAt)}</time>
      </p>
      <div className={styles.stats}>
        <div className={styles.stat}><span>Harga terakhir tercatat</span>
          <strong>{formatPrice(summary.latest.currentPrice)}</strong>
          <small>{observedDate(summary.lastObservedAt)}</small></div>
        <div className={styles.stat}><span>Harga terendah teramati</span>
          <strong>{formatPrice(summary.lowest.currentPrice)}</strong>
          <small>{observedDate(summary.lowest.observedAt)}</small></div>
        <div className={styles.stat}><span>Diskon terbesar teramati</span>
          <strong>{summary.largestDiscount}%</strong>
          <small>Hanya dari histori yang tersedia</small></div>
        <div className={styles.stat}><span>Observasi dalam diskon</span>
          <strong>{summary.discountedObservations} / {summary.observations}</strong>
          <small>Bukan jumlah hari diskon</small></div>
      </div>
      <PriceChart points={visible} source={source} window={period === 'fiveDays' ? window : null} />
      <div className={styles.tableHeading}>
        <h3>Catatan harga</h3>
        <span>{summary.observations} observasi dalam rentang terpilih (maks. 90 tersedia)</span>
      </div>
      <div className={styles.tableScroll} tabIndex={0} aria-label="Tabel riwayat harga, dapat digulir">
        <table className={styles.table}>
          <thead><tr><th scope="col">Waktu pengamatan (WIB)</th><th scope="col">Harga</th>
            <th scope="col">Harga normal</th><th scope="col">Diskon</th><th scope="col">Perubahan harga</th></tr></thead>
          <tbody>{newest.map((point, index) => {
            const older = newest[index + 1]
            const change = older ? point.currentPrice - older.currentPrice : null
            return <tr key={point.observedAt}>
              <td><time dateTime={new Date(point.observedAt * 1000).toISOString()}>{observedDate(point.observedAt)}</time></td>
              <td className={styles.money}>{formatPrice(point.currentPrice)}</td>
              <td>{formatPrice(point.originalPrice)}</td>
              <td>{historyDiscount(point)}%</td>
              <td className={change === null ? '' : change < 0 ? styles.down : change > 0 ? styles.up : ''}>
                {change === null ? '—' : change < 0 ? '▼ ' + formatPrice(Math.abs(change))
                  : change > 0 ? '▲ ' + formatPrice(change) : 'Tetap'}
              </td>
            </tr>
          })}</tbody>
        </table>
      </div>
      <p className={styles.note}>
        Semua angka berasal dari pengamatan yang berhasil disimpan di D1, bukan data simulasi.
        Garis hanya menghubungkan pengamatan berjarak maksimal 12 jam; periode tanpa catatan tidak direka ulang.
        Harga terakhir tercatat bisa berbeda dari harga yang sedang berlaku di toko.
      </p>
    </div>
  )
}
