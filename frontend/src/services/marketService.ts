import api from './api'
import type { ApiResponse, StockQuote, StockHistory } from '../types/auth'

function normalizeQuote(raw: any): StockQuote {
  if (!raw) return raw
  const price = typeof raw.currentPrice === 'number' ? raw.currentPrice : (typeof raw.price === 'number' ? raw.price : 0)
  const change = typeof raw.changeAmount === 'number' ? raw.changeAmount : (typeof raw.change === 'number' ? raw.change : 0)
  return {
    ...raw,
    symbol: raw.symbol || '',
    name: raw.name || raw.company || raw.symbol || '',
    company: raw.company || raw.name || raw.symbol || '',
    exchange: raw.exchange || raw.market || 'BSE',
    market: raw.market || raw.exchange || 'BSE',
    sector: raw.sector || 'Equities',
    currentPrice: price,
    price: price,
    previousClose: typeof raw.previousClose === 'number' ? raw.previousClose : (price - change),
    changeAmount: change,
    change: change,
    changePercent: typeof raw.changePercent === 'number' ? raw.changePercent : 0,
    volume: typeof raw.volume === 'number' ? raw.volume : 0,
    isDelayed: raw.isDelayed !== undefined ? raw.isDelayed : true,
    currency: raw.currency || 'INR',
  }
}

export const marketService = {
  /**
   * Get all active stock quotes from the backend MarketDataProvider
   */
  async getStocks(sector?: string): Promise<StockQuote[]> {
    const params = sector ? { sector } : {}
    const res = await api.get<ApiResponse<StockQuote[]>>('/market/stocks', { params })
    const list = res.data?.data || []
    return list.map(normalizeQuote)
  },

  /**
   * Get a specific stock quote by symbol
   */
  async getQuote(symbol: string): Promise<StockQuote> {
    const res = await api.get<ApiResponse<StockQuote>>(`/market/quote/${encodeURIComponent(symbol)}`)
    return normalizeQuote(res.data.data)
  },

  /**
   * Search stocks by query keyword using real MarketDataProvider
   */
  async searchStocks(query: string): Promise<StockQuote[]> {
    if (!query || !query.trim()) {
      return []
    }
    const res = await api.get<ApiResponse<StockQuote[]>>('/market/search', {
      params: { query: query.trim() },
    })
    const list = res.data?.data || []
    return list.map(normalizeQuote)
  },

  /**
   * Get historical OHLCV daily data points for a symbol
   */
  async getHistory(symbol: string): Promise<StockHistory> {
    const res = await api.get<ApiResponse<StockHistory>>(`/market/history/${encodeURIComponent(symbol)}`)
    return res.data.data
  },
}

export default marketService
