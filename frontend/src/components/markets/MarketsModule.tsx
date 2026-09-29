import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RefreshCw, TrendingUp } from 'lucide-react'
import api from '../../services/api'
import type { StockQuote, ApiResponse } from '../../types/auth'
import MarketIndices from './MarketIndices'
import StockListTable from './StockListTable'
import StockDetailPage from './StockDetailPage'

interface MarketsModuleProps {
  initialSymbol?: string
  onStockSelect?: (stock: StockQuote) => void
}

export const MarketsModule: React.FC<MarketsModuleProps> = ({
  initialSymbol,
  onStockSelect,
}) => {
  const params = useParams<{ symbol?: string }>()
  const navigate = useNavigate()

  const [stocks, setStocks] = useState<StockQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null)
  const [selectedIndexFilter, setSelectedIndexFilter] = useState<string | null>(null)

  // Fetch stocks from existing MarketDataProvider backend endpoint
  const fetchMarketStocks = async () => {
    setLoading(true)
    try {
      const res = await api.get<ApiResponse<StockQuote[]>>('/market/stocks')
      if (res.data?.data && res.data.data.length > 0) {
        setStocks(res.data.data)

        // If target symbol passed via URL param or prop
        const targetSymbol = (params.symbol || initialSymbol)?.toUpperCase()
        if (targetSymbol) {
          const match = res.data.data.find((s) => s.symbol.toUpperCase() === targetSymbol)
          if (match) {
            setSelectedStock(match)
          }
        }
      }
    } catch (err) {
      console.error('Failed to load market quotes from MarketDataProvider:', err)
      // Fallback baseline quotes if backend is rebooting
      const fallbackStocks: StockQuote[] = [
        {
          symbol: 'RELIANCE',
          name: 'Reliance Industries Ltd',
          exchange: 'NSE',
          sector: 'Energy',
          currentPrice: 2980.5,
          previousClose: 2945.0,
          changeAmount: 35.5,
          changePercent: 1.21,
          dayHigh: 3010.0,
          dayLow: 2930.0,
          volume: 14500000,
          marketCap: 20150000000000,
          peRatio: 28.4,
        },
        {
          symbol: 'TCS',
          name: 'Tata Consultancy Services',
          exchange: 'NSE',
          sector: 'Information Technology',
          currentPrice: 4210.75,
          previousClose: 4180.0,
          changeAmount: 30.75,
          changePercent: 0.74,
          dayHigh: 4245.0,
          dayLow: 4160.0,
          volume: 8200000,
          marketCap: 15200000000000,
          peRatio: 32.1,
        },
        {
          symbol: 'HDFCBANK',
          name: 'HDFC Bank Ltd',
          exchange: 'NSE',
          sector: 'Financial Services',
          currentPrice: 1650.2,
          previousClose: 1665.0,
          changeAmount: -14.8,
          changePercent: -0.89,
          dayHigh: 1670.0,
          dayLow: 1640.0,
          volume: 18900000,
          marketCap: 12500000000000,
          peRatio: 19.5,
        },
        {
          symbol: 'INFY',
          name: 'Infosys Ltd',
          exchange: 'NSE',
          sector: 'Information Technology',
          currentPrice: 1890.3,
          previousClose: 1860.5,
          changeAmount: 29.8,
          changePercent: 1.6,
          dayHigh: 1905.0,
          dayLow: 1850.0,
          volume: 12400000,
          marketCap: 7800000000000,
          peRatio: 27.3,
        },
        {
          symbol: 'ICICIBANK',
          name: 'ICICI Bank Ltd',
          exchange: 'NSE',
          sector: 'Financial Services',
          currentPrice: 1220.8,
          previousClose: 1205.0,
          changeAmount: 15.8,
          changePercent: 1.31,
          dayHigh: 1230.0,
          dayLow: 1198.0,
          volume: 11200000,
          marketCap: 8600000000000,
          peRatio: 18.2,
        },
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          exchange: 'NASDAQ',
          sector: 'Technology',
          currentPrice: 230.5,
          previousClose: 228.0,
          changeAmount: 2.5,
          changePercent: 1.1,
          dayHigh: 232.0,
          dayLow: 227.5,
          volume: 45000000,
          marketCap: 3500000000000,
          peRatio: 34.2,
        },
        {
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          exchange: 'NASDAQ',
          sector: 'Technology',
          currentPrice: 445.2,
          previousClose: 448.0,
          changeAmount: -2.8,
          changePercent: -0.63,
          dayHigh: 450.0,
          dayLow: 442.1,
          volume: 22000000,
          marketCap: 3300000000000,
          peRatio: 36.8,
        },
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corporation',
          exchange: 'NASDAQ',
          sector: 'Semiconductors',
          currentPrice: 128.4,
          previousClose: 124.5,
          changeAmount: 3.9,
          changePercent: 3.13,
          dayHigh: 130.0,
          dayLow: 123.8,
          volume: 89000000,
          marketCap: 3150000000000,
          peRatio: 55.4,
        },
      ]
      setStocks(fallbackStocks)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketStocks()
  }, [])

  // Sync if params.symbol or initialSymbol changes
  useEffect(() => {
    const target = (params.symbol || initialSymbol)?.toUpperCase()
    if (target && stocks.length > 0) {
      const match = stocks.find((s) => s.symbol.toUpperCase() === target)
      if (match) {
        setSelectedStock(match)
      }
    }
  }, [params.symbol, initialSymbol, stocks])

  const handleSelectStock = (stock: StockQuote) => {
    setSelectedStock(stock)
    onStockSelect?.(stock)
  }

  const handleBackToList = () => {
    setSelectedStock(null)
    if (params.symbol) {
      navigate('/markets')
    }
  }

  return (
    <div className="space-y-4">
      {/* If a stock is selected, render the Stock Detail Page */}
      {selectedStock ? (
        <StockDetailPage stock={selectedStock} onBack={handleBackToList} />
      ) : (
        /* Otherwise, render the complete Markets Overview & Stock List */
        <div className="space-y-4 animate-fade-in">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400" /> Markets & Equities Hub
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                • Real-time MarketDataProvider Stream
              </span>
            </div>

            <button
              onClick={fetchMarketStocks}
              disabled={loading}
              className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1b2537] hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-blue-500 dark:text-blue-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* 1. Market Indices & Breadth */}
          <MarketIndices
            stocks={stocks}
            selectedIndexId={selectedIndexFilter}
            onSelectIndex={setSelectedIndexFilter}
          />

          {/* 2. Stock Search, Filters & List Table */}
          <StockListTable
            stocks={stocks}
            onSelectStock={handleSelectStock}
            selectedStockSymbol={selectedStock ? (selectedStock as StockQuote).symbol : undefined}
          />
        </div>
      )}
    </div>
  )
}

export default MarketsModule
