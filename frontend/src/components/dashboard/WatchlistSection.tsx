import React, { useState, useMemo } from 'react'
import {
  Star,
  Search
} from 'lucide-react'
import type { WatchlistItem, StockQuote } from '../../types/auth'
import watchlistService from '../../services/watchlistService'

interface WatchlistSectionProps {
  watchlistItems: WatchlistItem[]
  selectedStock?: StockQuote | null
  onSelectStock?: (stock: StockQuote) => void
  onSelectSymbol?: (symbol: string) => void
  onRefreshWatchlist?: () => void
  currency?: string
}

export const WatchlistSection: React.FC<WatchlistSectionProps> = ({
  watchlistItems,
  selectedStock,
  onSelectStock: _onSelectStock,
  onSelectSymbol,
  onRefreshWatchlist,
  currency = 'INR',
}) => {
  const [search, setSearch] = useState('')
  const [filterExchange, setFilterExchange] = useState<'ALL' | 'NSE' | 'NASDAQ'>('ALL')
  const [loadingSymbols, setLoadingSymbols] = useState<Set<string>>(new Set())

  const handleToggleStar = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (loadingSymbols.has(symbol)) return

    setLoadingSymbols((prev) => new Set(prev).add(symbol))
    try {
      await watchlistService.removeFromWatchlist(symbol)
      onRefreshWatchlist?.()
    } catch (err) {
      console.error('Failed to remove from watchlist:', err)
    } finally {
      setLoadingSymbols((prev) => {
        const next = new Set(prev)
        next.delete(symbol)
        return next
      })
    }
  }

  const filteredItems = useMemo(() => {
    return watchlistItems.filter((item) => {
      const matchesSearch =
        search.trim() === '' ||
        item.symbol.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.sector && item.sector.toLowerCase().includes(search.toLowerCase()))

      if (!matchesSearch) return false
      if (filterExchange === 'NSE') return item.exchange === 'NSE'
      if (filterExchange === 'NASDAQ') return item.exchange === 'NASDAQ'
      return true
    })
  }, [watchlistItems, search, filterExchange])

  const formatPrice = (val: number | undefined | null, curr = currency) => {
    if (val == null || val <= 0) return '--'
    const isUSD = curr === 'USD'
    const sym = isUSD ? '$' : '₹'
    const locale = isUSD ? 'en-US' : 'en-IN'
    return `${sym}${Number(val).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div className="rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs select-none transition-colors font-mono">
      {/* Watchlist Header */}
      <div className="p-3 border-b border-slate-100 dark:border-[#182235] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Market Watchlist
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            ({watchlistItems.length} saved)
          </span>
        </div>

        {/* Filter controls */}
        {watchlistItems.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Exchange toggle */}
            <div className="flex items-center p-0.5 rounded bg-slate-100 dark:bg-[#070b13] border border-slate-200 dark:border-[#1e2a3f]">
              {(['ALL', 'NSE', 'NASDAQ'] as const).map((ex) => (
                <button
                  key={ex}
                  onClick={() => setFilterExchange(ex)}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
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
                className="pl-7 pr-2.5 py-1 bg-slate-50 dark:bg-[#070b13] border border-slate-200 dark:border-[#1e2a3f] rounded text-[11px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-44 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {watchlistItems.length === 0 ? (
        <div className="py-14 px-4 text-center">
          <div className="inline-flex p-3 rounded-full bg-slate-100 dark:bg-[#131d2e] text-slate-400 dark:text-slate-500 mb-3">
            <Star className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Your watchlist is empty</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Your watchlist is empty — add stocks from Markets.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
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
              {filteredItems.map((item) => {
                const currentPrice = Number(item.currentPrice || 0)
                const changeAmount = Number(item.changeAmount || 0)
                const changePercent = Number(item.changePercent || 0)
                const isPositive = changeAmount >= 0
                const dayLow = Number(item.dayLow || 0)
                const dayHigh = Number(item.dayHigh || 0)
                const hasValidPrice = currentPrice > 0
                const isSelected = selectedStock?.symbol === item.symbol

                return (
                  <tr
                    key={item.symbol}
                    onClick={() => {
                      onSelectSymbol?.(item.symbol)
                    }}
                    className={`hover:bg-slate-50 dark:hover:bg-[#11192e] transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/60 dark:bg-[#101a31]' : ''
                    }`}
                  >
                    {/* Star toggle */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(item.symbol, e)}
                        title="Remove from watchlist"
                        className="text-amber-500 hover:text-slate-400 transition-colors cursor-pointer"
                      >
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      </button>
                    </td>

                    {/* Symbol */}
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{item.symbol}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                        {item.exchange}
                      </span>
                    </td>

                    {/* Company */}
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                      {item.name}
                    </td>

                    {/* Sector */}
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      {item.sector || 'Equities'}
                    </td>

                    {/* LTP */}
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                      {hasValidPrice ? (
                        formatPrice(currentPrice, item.currency)
                      ) : (
                        <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 italic">
                          Unavailable
                        </span>
                      )}
                    </td>

                    {/* Change Amount */}
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums font-semibold ${
                        !hasValidPrice
                          ? 'text-slate-400'
                          : isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {hasValidPrice && item.changeAmount != null
                        ? `${isPositive ? '+' : ''}${formatPrice(changeAmount, item.currency)}`
                        : '--'}
                    </td>

                    {/* Change % */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {hasValidPrice && item.changePercent != null ? (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                              : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {changePercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">--</span>
                      )}
                    </td>

                    {/* Day range bar */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="w-full max-w-[110px] mx-auto">
                        <div className="h-1 w-full bg-slate-100 dark:bg-[#182236] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-400 rounded-full"
                            style={{
                              width: `${
                                hasValidPrice && dayHigh > dayLow
                                  ? Math.min(
                                      100,
                                      Math.max(
                                        10,
                                        ((currentPrice - dayLow) /
                                          (dayHigh - dayLow || 1)) *
                                          100
                                      )
                                    )
                                  : 50
                              }%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{hasValidPrice && dayLow > 0 ? formatPrice(dayLow, item.currency) : '--'}</span>
                          <span>{hasValidPrice && dayHigh > 0 ? formatPrice(dayHigh, item.currency) : '--'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Volume */}
                    <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400 text-[11px] tabular-nums">
                      {item.volume != null && item.volume > 0
                        ? `${(item.volume / 1000000).toFixed(2)}M`
                        : '--'}
                    </td>

                    {/* P/E Ratio */}
                    <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400 text-[11px] tabular-nums">
                      {item.peRatio ? Number(item.peRatio).toFixed(1) : '--'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default WatchlistSection
