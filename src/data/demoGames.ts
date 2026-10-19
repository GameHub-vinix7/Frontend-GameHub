
import battlefieldCover from '../assets/battlefield-6.png'
import detroitCover from '../assets/detroit-become-human.webp'
import sekiroCover from '../assets/sekiro-shadows-die-twice.webp'
import redDeadCover from '../assets/red-dead-redemption-2.webp'

import type { GameCardData } from '../types/game'
import { epicDemoPrices } from './epicDemoPrices'

export const steamPreviewGames: readonly GameCardData[] = [
  {
    id: 'battlefield-6',
    title: 'Battlefield 6',
    coverSrc: battlefieldCover,
    store: 'steam',
    originalPrice: null,
    currentPrice: null,
    rating: 6.8,
    genres: ['FPS', 'Action'],
  },
  {
    id: 'detroit-become-human',
    title: 'Detroit: Become Human',
    coverSrc: detroitCover,
    store: 'steam',
    originalPrice: null,
    currentPrice: null,
    rating: 8.7,
    genres: ['Adventure', 'Interactive'],
  },
  {
    id: 'sekiro-shadows-die-twice',
    title: 'Sekiro: Shadows Die Twice',
    coverSrc: sekiroCover,
    store: 'steam',
    originalPrice: null,
    currentPrice: null,
    rating: 8.9,
    genres: ['Action', 'Open World'],
  },
  {
    id: 'red-dead-redemption-2',
    title: 'Red Dead Redemption 2',
    coverSrc: redDeadCover,
    store: 'steam',
    originalPrice: null,
    currentPrice: null,
    rating: 9.0,
    genres: ['Action', 'Open World'],
  },
]

export const epicPreviewGames: readonly GameCardData[] = steamPreviewGames.map((game) => ({
  ...game,
  ...epicDemoPrices[game.id],
  store: 'epic',
}))
