import api from './api'
import type { ApiResponse, WatchlistItem } from '../types/auth'

export const watchlistService = {
  async getWatchlist(): Promise<WatchlistItem[]> {
    const response = await api.get<ApiResponse<WatchlistItem[]>>('/watchlist')
    return response.data.data
  },

  async addToWatchlist(symbol: string): Promise<void> {
    await api.post<ApiResponse<void>>(`/watchlist/${symbol}`)
  },

  async removeFromWatchlist(symbol: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/watchlist/${symbol}`)
  },
}

export default watchlistService
