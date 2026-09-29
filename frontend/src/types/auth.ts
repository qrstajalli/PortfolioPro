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
  exchange: string
  sector: string
  currentPrice: number
  previousClose: number
  changeAmount: number
  changePercent: number
  dayHigh: number
  dayLow: number
  volume: number
  marketCap: number
  peRatio: number
}
