export interface User {
  id: number
  name: string
  email: string
  role: string
  enabled: boolean
  createdAt: string
}

export interface Wallet {
  id: number
  userId: number
  balance: number
  initialBalance?: number
  isConfigured?: boolean
  currency: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  token: string
  tokenType: string
  expiresInMs: number
  user: User
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  errors?: Record<string, string> | string
  timestamp: string
}

export interface StockQuote {
  symbol: string
  name: string
  company?: string
  exchange: string
  market?: string
  sector: string
  currentPrice: number
  price?: number
  previousClose: number
  changeAmount: number
  change?: number
  changePercent: number
  dayHigh?: number
  dayLow?: number
  volume: number
  marketCap?: number
  peRatio?: number
  timestamp?: string
  isDelayed?: boolean
  currency?: string
}

export interface HistoricalCandle {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface StockHistory {
  symbol: string
  exchange?: string
  currency?: string
  lastRefreshed?: string
  timeZone?: string
  candles: HistoricalCandle[]
}
