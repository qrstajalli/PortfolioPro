import React, { useState, useMemo } from 'react'
import {
  Search,
  ArrowUpDown,
  ChevronRight,
  Filter,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react'
import type { StockQuote } from '../../types/auth'

export type SortField = 'symbol' | 'price' | 'change' | 'volume' | 'marketCap' | 'pe'
export type SortOrder = 'asc' | 'desc'
export type ViewMode = 'table' | 'cards'

interface StockListTableProps {
  stocks: StockQuote[]
  onSelectStock: (stock: StockQuote) => void
  selectedStockSymbol?: string
}

export const StockListTable: React.FC<StockListTableProps> = ({
  stocks,
  onSelectStock,
  selectedStockSymbol,
}) => {
  const [search, setSearch] = useState('')
  const [exchangeFilter, setExchangeFilter] = useState<'ALL' | 'NSE' | 'NASDAQ'>('ALL')
  const [sectorFilter, setSectorFilter] = useState<string>('ALL')
  const [sortField, setSortField] = useState<SortField>('marketCap')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  // Extract all unique sectors for filter pills
  const availableSectors = useMemo(() => {
    const set = new Set<string>()
    stocks.forEach((s) => {
      if (s.sector) set.add(s.sector)
    })
    return Array.from(set)
  }, [stocks])

  // Filter and sort stocks
  const filteredAndSortedStocks = useMemo(() => {
    return stocks
      .filter((stock) => {
        // Search query
        const q = search.trim().toLowerCase()
        const matchesSearch =
          !q ||
          stock.symbol.toLowerCase().includes(q) ||
          stock.name.toLowerCase().includes(q) ||
          stock.sector.toLowerCase().includes(q)

        if (!matchesSearch) return false

        // Exchange filter
        if (exchangeFilter !== 'ALL' && stock.exchange !== exchangeFilter) {
          return false
        }

        // Sector filter
        if (sectorFilter !== 'ALL' && stock.sector !== sectorFilter) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        let valA = 0
        let valB = 0

        switch (sortField) {
          case 'symbol':
            return sortOrder === 'asc'
              ? a.symbol.localeCompare(b.symbol)
              : b.symbol.localeCompare(a.symbol)
          case 'price':
            valA = Number(a.currentPrice || 0)
            valB = Number(b.currentPrice || 0)
            break
          case 'change':
            valA = Number(a.changePercent || 0)
            valB = Number(b.changePercent || 0)
            break
          case 'volume':
            valA = Number(a.volume || 0)
            valB = Number(b.volume || 0)
            break
          case 'marketCap':
            valA = Number(a.marketCap || 0)
            valB = Number(b.marketCap || 0)
            break
          case 'pe':
            valA = Number(a.peRatio || 0)
            valB = Number(b.peRatio || 0)
            break
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA
      })
  }, [stocks, search, exchangeFilter, sectorFilter, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const formatPrice = (val: number | undefined | null, currency?: string) => {
    if (val == null || val <= 0) return '--'
    const isUSD = currency === 'USD' || !currency
    const sym = isUSD ? '$' : '₹'
    const locale = isUSD ? 'en-US' : 'en-IN'
    return `${sym}${Number(val).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const formatMarketCap = (marketCap?: number, currency?: string) => {
    if (!marketCap || marketCap <= 0) return 'N/A'
    if (currency === 'INR') {
      if (marketCap >= 10000000000000) return `₹${(marketCap / 1000000000000).toFixed(1)}L Cr`
      if (marketCap >= 10000000) return `₹${(marketCap / 10000000).toFixed(0)} Cr`
      return `₹${marketCap.toLocaleString('en-IN')}`
    }
    if (marketCap >= 1000000000000) return `$${(marketCap / 1000000000000).toFixed(2)}T`
    if (marketCap >= 1000000000) return `$${(marketCap / 1000000000).toFixed(2)}B`
    if (marketCap >= 1000000) return `$${(marketCap / 1000000).toFixed(1)}M`
    return `$${marketCap.toLocaleString('en-US')}`
  }

  // Mini sparkline generator for each stock row
  const renderSparkline = (symbol: string, up: boolean) => {
    const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const points = [
      12 + Math.sin(seed) * 5,
      10 + Math.cos(seed + 1) * 6,
      14 + Math.sin(seed + 2) * 5,
      8 + Math.cos(seed + 3) * 6,
      13 + Math.sin(seed + 4) * 5,
      up ? 4 : 18,
    ]
    const w = 50
    const h = 20
    const step = w / (points.length - 1)
    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${p.toFixed(1)}`)
      .join(' ')

    return (
      <svg className="w-12 h-5 overflow-visible" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <path
          d={pathD}
          fill="none"
          stroke={up ? '#10b981' : '#f43f5e'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <div className="rounded-md border border-slate-200 dark:border-[#1b2537] bg-white dark:bg-[#0c1220] shadow-xs select-none font-mono">
      {/* 1. Header Toolbar: Search, Filters & View Toggle */}
      <div className="p-3.5 border-b border-slate-200 dark:border-[#182235] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stocks by symbol, name, sector..."
              className="w-full bg-slate-50 dark:bg-[#080d17] border border-slate-200 dark:border-[#1e2a3f] rounded-md pl-9 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Toolbar: View mode & Count */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Showing <span className="text-slate-900 dark:text-white font-bold">{filteredAndSortedStocks.length}</span> of {stocks.length} equities
            </span>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded bg-slate-100 dark:bg-[#070b13] border border-slate-200 dark:border-[#1e2a3f]">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white dark:bg-[#18233a] text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
                title="Table View"
              >
                <ListIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white dark:bg-[#18233a] text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase flex items-center gap-1 shrink-0 pr-1">
            <Filter className="h-3 w-3" /> Filter:
          </span>

          {/* Exchange Filter Pills */}
          {(['ALL', 'NSE', 'NASDAQ'] as const).map((ex) => (
            <button
              key={ex}
              onClick={() => setExchangeFilter(ex)}
              className={`px-2.5 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                exchangeFilter === ex
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#080d17] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1c2638]'
              }`}
            >
              {ex === 'ALL' ? 'All Exchanges' : ex === 'NASDAQ' ? 'NASDAQ (USD)' : ex}
            </button>
          ))}

          <span className="text-slate-300 dark:text-slate-600 px-1">|</span>

          {/* Sector Filter Pills */}
          <button
            onClick={() => setSectorFilter('ALL')}
            className={`px-2.5 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
              sectorFilter === 'ALL'
                ? 'bg-blue-50 dark:bg-[#18233a] text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-500/40'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#080d17] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1c2638]'
            }`}
          >
            All Sectors
          </button>
          {availableSectors.map((sector) => (
            <button
              key={sector}
              onClick={() => setSectorFilter(sector)}
              className={`px-2.5 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                sectorFilter === sector
                  ? 'bg-blue-50 dark:bg-[#18233a] text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-500/40'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#080d17] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1c2638]'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Content: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#080d17] border-b border-slate-200 dark:border-[#1b2537] text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <tr>
                <th
                  onClick={() => handleSort('symbol')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>SECURITY</span>
                    <ArrowUpDown className="h-2.5 w-2.5" />
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold">SECTOR</th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>LAST PRICE</span>
                    <ArrowUpDown className="h-2.5 w-2.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('change')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>CHG (%)</span>
                    <ArrowUpDown className="h-2.5 w-2.5" />
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold text-center w-28">DAY RANGE</th>
                <th
                  onClick={() => handleSort('volume')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>VOLUME</span>
                    <ArrowUpDown className="h-2.5 w-2.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('marketCap')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>MKT CAP</span>
                    <ArrowUpDown className="h-2.5 w-2.5" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('pe')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>P/E</span>
                    <ArrowUpDown className="h-2.5 w-2.5" />
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold text-center">TREND</th>
                <th className="py-2.5 px-3 font-semibold text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#162033]">
              {filteredAndSortedStocks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No matching stocks found for "{search}"
                  </td>
                </tr>
              ) : (
                filteredAndSortedStocks.map((stock) => {
                  const currentPrice = Number(stock.currentPrice || 0)
                  const changeAmount = Number(stock.changeAmount || 0)
                  const dayLow = Number(stock.dayLow || 0)
                  const dayHigh = Number(stock.dayHigh || 0)
                  const isPositive = stock.changeAmount >= 0
                  const isSelected = selectedStockSymbol === stock.symbol

                  const dayRangePct = Math.min(
                    100,
                    Math.max(
                      10,
                      ((currentPrice - dayLow) / (dayHigh - dayLow || 1)) * 100
                    )
                  )

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => onSelectStock(stock)}
                      className={`hover:bg-slate-50 dark:hover:bg-[#11192e] transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/50 dark:bg-[#0f182e] border-l-2 border-blue-500' : ''
                      }`}
                    >
                      {/* Security */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{stock.symbol}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                            {stock.exchange}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[170px]">
                          {stock.name}
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        {stock.sector}
                      </td>

                      {/* LTP */}
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                        {currentPrice > 0 ? (
                          formatPrice(currentPrice, stock.currency)
                        ) : (
                          <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 italic">
                            Market data unavailable
                          </span>
                        )}
                      </td>

                      {/* Change */}
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {currentPrice > 0 ? (
                          <>
                            <span
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isPositive
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {isPositive ? '+' : ''}
                              {(stock.changePercent || 0).toFixed(2)}%
                            </span>
                            <div className={`text-[9px] ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} mt-0.5`}>
                              {isPositive ? '+' : ''}{formatPrice(changeAmount, stock.currency)}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">--</span>
                        )}
                      </td>

                      {/* Day Range Bar */}
                      <td className="py-2.5 px-3 text-center">
                        {currentPrice > 0 && dayHigh > 0 ? (
                          <div className="w-full max-w-[110px] mx-auto">
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-[#182236] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-400 dark:bg-slate-400 rounded-full"
                                style={{ width: `${dayRangePct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                              <span>{formatPrice(dayLow, stock.currency)}</span>
                              <span>{formatPrice(dayHigh, stock.currency)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[10px]">--</span>
                        )}
                      </td>

                      {/* Volume */}
                      <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">
                        {(stock.volume / 1000000).toFixed(2)}M
                      </td>

                      {/* Market Cap */}
                      <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">
                        {formatMarketCap(stock.marketCap, stock.currency)}
                      </td>

                      {/* P/E Ratio */}
                      <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">
                        {stock.peRatio ? stock.peRatio.toFixed(1) : '24.5'}
                      </td>

                      {/* Sparkline */}
                      <td className="py-2.5 px-3 text-center">
                        {renderSparkline(stock.symbol, isPositive)}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectStock(stock)
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-600 dark:bg-[#101b31] text-blue-600 hover:text-white dark:text-blue-400 border border-slate-200 dark:border-blue-500/30 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-0.5 mx-auto"
                        >
                          <span>Details</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Content: CARDS VIEW */}
      {viewMode === 'cards' && (
        filteredAndSortedStocks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs">
            No matching securities found for "{search}"
          </div>
        ) : (
          <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredAndSortedStocks.map((stock) => {
            const currentPrice = Number(stock.currentPrice || 0)
            const changeAmount = Number(stock.changeAmount || 0)
            const dayLow = Number(stock.dayLow || 0)
            const dayHigh = Number(stock.dayHigh || 0)
            const isPositive = (stock.changeAmount || 0) >= 0
            const hasValidPrice = currentPrice > 0

            return (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock(stock)}
                className="p-3.5 rounded-md border border-slate-200 dark:border-[#1b2537] bg-white dark:bg-[#090e1a] hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-[#0c1424] shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {stock.symbol}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                        {stock.exchange}
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${
                        !hasValidPrice
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : isPositive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {hasValidPrice && stock.changePercent != null
                        ? `${isPositive ? '+' : ''}${stock.changePercent.toFixed(2)}%`
                        : '--'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 truncate mt-1">
                    {stock.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {stock.sector}
                  </div>
                </div>

                {/* Price & Sparkline */}
                <div className="flex items-end justify-between pt-2 border-t border-slate-100 dark:border-[#162033]">
                  <div>
                    <div
                      className={`tabular-nums ${
                        hasValidPrice
                          ? 'text-base font-bold text-slate-900 dark:text-white'
                          : 'text-xs font-normal text-slate-400 dark:text-slate-500 italic'
                      }`}
                    >
                      {hasValidPrice ? formatPrice(currentPrice, stock.currency) : 'Market data unavailable'}
                    </div>
                    <div
                      className={`text-[10px] tabular-nums ${
                        !hasValidPrice
                          ? 'text-slate-400'
                          : isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {hasValidPrice && stock.changeAmount != null
                        ? `${isPositive ? '+' : ''}${formatPrice(changeAmount, stock.currency)}`
                        : '--'}
                    </div>
                  </div>
                  <div>{renderSparkline(stock.symbol, isPositive)}</div>
                </div>

                {/* Low / High Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-[#162033] flex justify-between text-[9px] text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>L: {hasValidPrice && dayLow > 0 ? formatPrice(dayLow, stock.currency) : '--'}</span>
                  <span>H: {hasValidPrice && dayHigh > 0 ? formatPrice(dayHigh, stock.currency) : '--'}</span>
                  <span>Vol: {stock.volume != null && stock.volume > 0 ? `${(stock.volume / 1000000).toFixed(1)}M` : '--'}</span>
                </div>
              </div>
            )
          })}
          </div>
        )
      )}
    </div>
  )
}

export default StockListTable
