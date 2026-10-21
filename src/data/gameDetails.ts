import rdr2Hero from '../assets/detail/rdr2-hero.webp'
import rdr2Preview1 from '../assets/detail/rdr2-preview-1.webp'
import rdr2Preview2 from '../assets/detail/rdr2-preview-2.webp'
import rdr2Preview3 from '../assets/detail/rdr2-preview-3.webp'
import rdr2Gameplay from '../assets/detail/rdr2-gameplay.mp4'

import battlefieldHero from '../assets/detail/battlefield-6-hero.webp'
import battlefieldVideoThumb from '../assets/detail/battlefield-6-video-thumb.webp'
import battlefieldPreview1 from '../assets/detail/battlefield-6-preview-1.webp'
import battlefieldPreview2 from '../assets/detail/battlefield-6-preview-2.webp'
import battlefieldGameplay from '../assets/detail/battlefield-6-gameplay.mp4'

import detroitHero from '../assets/detail/detroit-become-human-hero.webp'
import detroitVideoThumb from '../assets/detail/detroit-become-human-video-thumb.webp'
import detroitPreview1 from '../assets/detail/detroit-become-human-preview-1.webp'
import detroitPreview2 from '../assets/detail/detroit-become-human-preview-2.webp'
import detroitGameplay from '../assets/detail/detroit-become-human-gameplay.mp4'

import sekiroHero from '../assets/detail/sekiro-shadows-die-twice-hero.webp'
import sekiroVideoThumb from '../assets/detail/sekiro-shadows-die-twice-video-thumb.webp'
import sekiroPreview1 from '../assets/detail/sekiro-shadows-die-twice-preview-1.webp'
import sekiroPreview2 from '../assets/detail/sekiro-shadows-die-twice-preview-2.webp'
import sekiroGameplay from '../assets/detail/sekiro-shadows-die-twice-gameplay.mp4'

export type SystemSpec = { label: string; value: string }
export type GameMedia =
  | { id: string; kind: 'image'; src: string; alt: string }
  | { id: string; kind: 'video'; poster: string; src?: string; alt: string; posterHasPlayIcon?: boolean }

export type DetailContent = {
  hero: string
  gallery: readonly GameMedia[]
  description: readonly string[]
  minimum: readonly SystemSpec[]
  recommended: readonly SystemSpec[]
}

const rdr2: DetailContent = {
  hero: rdr2Hero,
  gallery: [
    {
      id: 'rdr2-video',
      kind: 'video',
      poster: rdr2Preview1,
      posterHasPlayIcon: true, // Ikon play sudah ada di gambar poster dari Figma.
      alt: 'Pratinjau video Red Dead Redemption 2',
      src: rdr2Gameplay,
    },
    { id: 'rdr2-image-1', kind: 'image', src: rdr2Preview2, alt: 'Arthur Morgan saat beraksi' },
    { id: 'rdr2-image-2', kind: 'image', src: rdr2Preview3, alt: 'Arthur Morgan menunggang kuda di sebuah permukiman' },
  ],
  description: [
    'Amerika, tahun 1899. Arthur Morgan dan Van der Linde Gang adalah pelanggar hukum yang kabur. Diikuti agen federal dan pemburu hadiah terbaik di negaranya, mereka harus merampok, mencuri, dan bertarung di sepanjang jalan daratan liar Amerika guna bertahan hidup. Seiring perpecahan internal makin mengancam kelangsungan geng, Arthur harus memilih antara idealismenya dengan kesetiaannya terhadap geng yang membesarkannya.',
    'Pemenang lebih dari 175 Game of the Year Award dan penerima lebih dari 250 skor sempurna, Red Dead Redemption 2 adalah kisah epik tentang kehormatan dan kesetiaan di awal masa modern.',
    'Red Dead Redemption 2 juga mencakup Red Dead Online — pengalaman multiplayer yang mengambil tempat di semesta Red Dead Redemption 2 — bermain sendiri atau bentuk kelompok; jalankan bar; kalahkan penegak hukum, geng pelanggar hukum, hewan liar yang buas, dan masih banyak lagi seiring menempuh jalan pribadi di perbatasan Amerika.',
  ],
  minimum: [
    { label: 'Arsitektur', value: 'Prosesor 64-bit dan OS diperlukan' },
    { label: 'OS', value: 'Windows 10 - 64-bit' },
    { label: 'Prosesor', value: 'Intel® Core™ i5-2500K / AMD FX-6300' },
    { label: 'Memori', value: '8 GB RAM' },
    { label: 'Grafis', value: 'Nvidia GeForce GTX 770 2GB / AMD Radeon R9 280 3GB' },
    { label: 'Jaringan', value: 'Koneksi Internet Broadband' },
    { label: 'Penyimpanan', value: '150 GB ruang tersedia' },
    { label: 'Kartu suara', value: 'Direct X Compatible' },
  ],
  recommended: [
    { label: 'Arsitektur', value: 'Prosesor 64-bit dan OS diperlukan' },
    { label: 'OS', value: 'Windows 10 - 64-bit' },
    { label: 'Prosesor', value: 'Intel® Core™ i7-4770K / AMD Ryzen 5 1500X' },
    { label: 'Memori', value: '12 GB RAM' },
    { label: 'Grafis', value: 'Nvidia GeForce GTX 1060 6GB / AMD Radeon RX 480 4GB' },
    { label: 'Jaringan', value: 'Koneksi Internet Broadband' },
    { label: 'Penyimpanan', value: '150 GB ruang tersedia' },
    { label: 'Kartu suara', value: 'Direct X Compatible' },
  ],
}

const gameMediaDetails: Readonly<Record<string, DetailContent>> = {
  'battlefield-6': {
    hero: battlefieldHero,
    gallery: [
      { id: 'battlefield-6-video', kind: 'video', poster: battlefieldVideoThumb, src: battlefieldGameplay,
        alt: 'Cuplikan video Battlefield 6' },
      { id: 'battlefield-6-image-1', kind: 'image', src: battlefieldPreview1,
        alt: 'Pertempuran di area terbuka Battlefield 6' },
      { id: 'battlefield-6-image-2', kind: 'image', src: battlefieldPreview2,
        alt: 'Cuplikan aksi pertempuran Battlefield 6' },
    ],
    description: [], minimum: [], recommended: [],
  },
  'detroit-become-human': {
    hero: detroitHero,
    gallery: [
      { id: 'detroit-video', kind: 'video', poster: detroitVideoThumb, src: detroitGameplay,
        alt: 'Cuplikan video Detroit: Become Human' },
      { id: 'detroit-image-1', kind: 'image', src: detroitPreview1,
        alt: 'Suasana Jimmy’s Bar di Detroit: Become Human' },
      { id: 'detroit-image-2', kind: 'image', src: detroitPreview2,
        alt: 'Karakter android dalam Detroit: Become Human' },
    ],
    description: [], minimum: [], recommended: [],
  },
  'sekiro-shadows-die-twice': {
    hero: sekiroHero,
    gallery: [
      { id: 'sekiro-video', kind: 'video', poster: sekiroVideoThumb, src: sekiroGameplay,
        alt: 'Cuplikan video Sekiro: Shadows Die Twice' },
      { id: 'sekiro-image-1', kind: 'image', src: sekiroPreview1,
        alt: 'Sekiro memegang benda bercahaya dalam ruangan' },
      { id: 'sekiro-image-2', kind: 'image', src: sekiroPreview2,
        alt: 'Aksi pertarungan Sekiro: Shadows Die Twice' },
    ],
    description: [], minimum: [], recommended: [],
  },
}

export function getGameDetailContent(gameId: string, title: string): DetailContent | null {
  // Data demo punya ID game bersama lintas toko; jaga ID itu saat integrasi API.
  if (gameId === 'red-dead-redemption-2' || title.toLowerCase().includes('red dead redemption 2')) {
    return rdr2
  }
  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return gameMediaDetails[gameId] ?? gameMediaDetails[normalizedTitle] ?? null
}
