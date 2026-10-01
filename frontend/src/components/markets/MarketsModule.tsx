import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RefreshCw, TrendingUp, AlertCircle, Maximize2 } from 'lucide-react'
import marketService from '../../services/marketService'
import type { StockQuote } from '../../types/auth'
import MarketIndices from './MarketIndices'
import StockListTable from './StockListTable'
import StockDetailPage from './StockDetailPage'
import TradingTerminal from './TradingTerminal'

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
  const [error, setError] = useState<string | null>(null)
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null)
  const [selectedIndexFilter, setSelectedIndexFilter] = useState<string | null>(null)
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)

  // Fetch stocks from real MarketDataProvider backend endpoint
  const fetchMarketStocks = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await marketService.getStocks()
      setStocks(data)

      // If target symbol passed via URL param or prop
      const targetSymbol = (params.symbol || initialSymbol)?.toUpperCase()
      if (targetSymbol) {
        const match = data.find((s) => s.symbol.toUpperCase() === targetSymbol)
        if (match) {
          setSelectedStock(match)
        } else {
          // Fetch directly from quote endpoint
          marketService
            .getQuote(targetSymbol)
            .then((q) => setSelectedStock(q))
            .catch(() => {})
        }
      }
    } catch (err: any) {
      console.error('Failed to load market quotes from MarketDataProvider:', err)
      const msg = err.response?.data?.message || 'Failed to connect to market data provider.'
      setError(msg)
      setStocks([])
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
    if (target) {
      const match = stocks.find((s) => s.symbol.toUpperCase() === target)
      if (match) {
        setSelectedStock(match)
      } else {
        marketService
          .getQuote(target)
          .then((q) => setSelectedStock(q))
          .catch(() => {})
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

  if (isTerminalOpen) {
    const terminalStock = selectedStock || stocks[0] || {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      company: 'Apple Inc.',
      exchange: 'NASDAQ',
      market: 'NASDAQ',
      sector: 'Technology',
      currency: 'USD',
      currentPrice: 220,
      previousClose: 218,
      changeAmount: 2,
      changePercent: 0.92,
      volume: 45000000,
    }
    return <TradingTerminal stock={terminalStock} onBack={() => setIsTerminalOpen(false)} />
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTerminalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer text-xs font-bold shadow-xs"
                title="Open Dedicated Full-Screen Trading Terminal"
              >
                <Maximize2 className="h-3 w-3" />
                <span>Full Chart</span>
              </button>

              <button
                onClick={fetchMarketStocks}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1b2537] hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-blue-500 dark:text-blue-400' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Clean error banner without fake price substitution */}
          {error && (
            <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Market Provider Notice: {error}</span>
              </div>
              <button
                onClick={fetchMarketStocks}
                className="underline hover:text-amber-900 dark:hover:text-amber-200 cursor-pointer ml-3 font-semibold"
              >
                Retry
              </button>
            </div>
          )}

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
