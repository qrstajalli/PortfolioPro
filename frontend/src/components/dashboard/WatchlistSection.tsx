import React, { useState, useMemo } from 'react'
import {
  Star,
  Search
} from 'lucide-react'
import type { StockQuote } from '../../types/auth'

interface WatchlistSectionProps {
  stocks: StockQuote[]
  selectedStock?: StockQuote | null
  onSelectStock?: (stock: StockQuote) => void
}

export const WatchlistSection: React.FC<WatchlistSectionProps> = ({
  stocks,
  selectedStock,
  onSelectStock,
}) => {
  const [search, setSearch] = useState('')
  const [filterExchange, setFilterExchange] = useState<'ALL' | 'NSE' | 'NASDAQ'>('ALL')
  const [starredSymbols, setStarredSymbols] = useState<Set<string>>(
    new Set(['RELIANCE', 'TCS', 'NVDA', 'HDFCBANK'])
  )

  const toggleStar = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setStarredSymbols((prev) => {
      const next = new Set(prev)
      if (next.has(symbol)) next.delete(symbol)
      else next.add(symbol)
      return next
    })
  }

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const matchesSearch =
        search.trim() === '' ||
        stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
        stock.name.toLowerCase().includes(search.toLowerCase()) ||
        stock.sector.toLowerCase().includes(search.toLowerCase())

      if (!matchesSearch) return false
      if (filterExchange === 'NSE') return stock.exchange === 'NSE'
      if (filterExchange === 'NASDAQ') return stock.exchange === 'NASDAQ'
      return true
    })
  }, [stocks, search, filterExchange])

  const USD_TO_INR = 84

  const formatCurrency = (val: number) => {
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div className="rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs select-none transition-colors">
      {/* Watchlist Header */}
      <div className="p-3 border-b border-slate-100 dark:border-[#182235] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Watchlist & Equities Feed
          </span>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            ({filteredStocks.length} securities)
          </span>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          {/* Exchange toggle */}
          <div className="flex items-center p-0.5 rounded bg-slate-100 dark:bg-[#070b13] border border-slate-200 dark:border-[#1e2a3f]">
            {(['ALL', 'NSE', 'NASDAQ'] as const).map((ex) => (
              <button
                key={ex}
                onClick={() => setFilterExchange(ex)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                  filterExchange === ex
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Quick search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter watchlist..."
              className="pl-7 pr-2.5 py-1 bg-slate-50 dark:bg-[#070b13] border border-slate-200 dark:border-[#1e2a3f] rounded text-[11px] font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-44 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Dense High-Precision Securities Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50 dark:bg-[#080d17] border-b border-slate-200 dark:border-[#1c2638] text-[10px] text-slate-500 dark:text-slate-400">
            <tr>
              <th className="py-2 px-3 w-8 text-center">★</th>
              <th className="py-2 px-3 font-semibold">SYMBOL</th>
              <th className="py-2 px-3 font-semibold">COMPANY</th>
              <th className="py-2 px-3 font-semibold">SECTOR</th>
              <th className="py-2 px-3 font-semibold text-right">LTP</th>
              <th className="py-2 px-3 font-semibold text-right">CHANGE</th>
              <th className="py-2 px-3 font-semibold text-right">CHG %</th>
              <th className="py-2 px-3 font-semibold text-center w-36">DAY RANGE</th>
              <th className="py-2 px-3 font-semibold text-right">VOLUME</th>
              <th className="py-2 px-3 font-semibold text-right">P/E</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#172033]">
            {filteredStocks.map((stock) => {
              const isPositive = (stock.changeAmount || 0) >= 0
              const isStarred = starredSymbols.has(stock.symbol)
              const isSelected = selectedStock?.symbol === stock.symbol
              const mult = stock.exchange === 'NASDAQ' ? USD_TO_INR : 1
              const currentPriceINR = Number(stock.currentPrice || 0) * mult
              const changeAmountINR = Number(stock.changeAmount || 0) * mult
              const dayLowINR = Number(stock.dayLow || 0) * mult
              const dayHighINR = Number(stock.dayHigh || 0) * mult
              const hasValidPrice = currentPriceINR > 0

              return (
                <tr
                  key={stock.symbol}
                  onClick={() => onSelectStock?.(stock)}
                  className={`hover:bg-slate-50 dark:hover:bg-[#11192e] transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/60 dark:bg-[#101a31]' : ''
                  }`}
                >
                  {/* Star toggle */}
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => toggleStar(stock.symbol, e)}
                      className="text-slate-400 dark:text-slate-600 hover:text-amber-500 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`h-3 w-3 ${
                          isStarred ? 'text-amber-500 fill-amber-500' : ''
                        }`}
                      />
                    </button>
                  </td>

                  {/* Symbol */}
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{stock.symbol}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                      {stock.exchange}
                    </span>
                  </td>

                  {/* Company */}
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                    {stock.name}
                  </td>

                  {/* Sector */}
                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                    {stock.sector}
                  </td>

                  {/* LTP */}
                  <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                    {hasValidPrice ? (
                      formatCurrency(currentPriceINR)
                    ) : (
                      <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 italic">
                        Market data unavailable
                      </span>
                    )}
                  </td>

                  {/* Change pts */}
                  <td
                    className={`py-2 px-3 text-right tabular-nums font-semibold ${
                      !hasValidPrice
                        ? 'text-slate-400'
                        : isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {hasValidPrice && stock.changeAmount != null
                      ? `${isPositive ? '+' : ''}${changeAmountINR.toFixed(2)}`
                      : '--'}
                  </td>

                  {/* Change % */}
                  <td className="py-2 px-3 text-right tabular-nums">
                    {hasValidPrice && stock.changePercent != null ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">--</span>
                    )}
                  </td>

                  {/* Day range bar */}
                  <td className="py-2 px-3 text-center">
                    <div className="w-full max-w-[110px] mx-auto">
                      <div className="h-1 w-full bg-slate-100 dark:bg-[#182236] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-400 rounded-full"
                          style={{
                            width: `${
                              hasValidPrice && dayHighINR > dayLowINR
                                ? Math.min(
                                    100,
                                    Math.max(
                                      10,
                                      ((currentPriceINR - dayLowINR) /
                                        (dayHighINR - dayLowINR || 1)) *
                                        100
                                    )
                                  )
                                : 50
                            }%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        <span>{hasValidPrice && dayLowINR > 0 ? `₹${dayLowINR.toFixed(0)}` : '--'}</span>
                        <span>{hasValidPrice && dayHighINR > 0 ? `₹${dayHighINR.toFixed(0)}` : '--'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Volume */}
                  <td className="py-2 px-3 text-right text-slate-500 dark:text-slate-400 text-[11px] tabular-nums">
                    {stock.volume != null && stock.volume > 0
                      ? `${(stock.volume / 1000000).toFixed(2)}M`
                      : '--'}
                  </td>

                  {/* P/E Ratio */}
                  <td className="py-2 px-3 text-right text-slate-500 dark:text-slate-400 text-[11px] tabular-nums">
                    {stock.peRatio ? stock.peRatio.toFixed(1) : '22.4'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WatchlistSection
