export interface User {
  id: number
  name: string
  email: string
  role: string
  enabled: boolean
  createdAt: string
  authProvider?: string
  imageUrl?: string
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
  timestamp?: number
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

export interface Holding {
  id: number
  symbol: string
  name: string
  exchange: string
  quantity: number
  averageBuyPrice: number
  totalInvested: number
  currentPrice: number
  currentValue: number
  pnl: number
  pnlPercent: number
  allocation: number
  currency: string
}

export interface Portfolio {
  id: number
  userId: number
  cashBalance: number
  investedValue: number
  totalCostBasis?: number
  totalNetWorth: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  activePositions: number
  currency: string
  holdings: Holding[]
}

export interface WatchlistItem {
  id: number
  symbol: string
  name: string
  exchange: string
  sector?: string
  currentPrice?: number
  changeAmount?: number
  changePercent?: number
  dayLow?: number
  dayHigh?: number
  volume?: number
  peRatio?: number
  currency?: string
  addedAt?: string
}

export interface Order {
  id: number
  orderNumber: string
  symbol: string
  name: string
  exchange: string
  side: 'BUY' | 'SELL'
  orderType: string
  orderStatus: string
  quantity: number
  executionPrice: number
  totalAmount: number
  notes?: string
  createdAt: string
  executedAt?: string
}

export interface Transaction {
  id: number
  transactionReference: string
  symbol: string
  name: string
  exchange: string
  type: string
  quantity?: number
  price?: number
  amount: number
  balanceAfter?: number
  description?: string
  transactionTime: string
}
