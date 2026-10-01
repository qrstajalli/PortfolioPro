import React from 'react'
import { Briefcase, Star, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import type { Holding, WatchlistItem } from '../../types/auth'

interface MarketOverviewProps {
  holdings: Holding[]
  watchlistItems: WatchlistItem[]
  currency?: string
  onSelectSymbol?: (symbol: string) => void
  onNavigateToMarkets?: () => void
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  holdings,
  watchlistItems,
  currency = 'INR',
  onSelectSymbol,
  onNavigateToMarkets,
}) => {
  const formatVal = (val: number | undefined | null, curr = currency) => {
    if (val == null) return '--'
    const isUSD = curr === 'USD'
    const sym = isUSD ? '$' : '₹'
    const locale = isUSD ? 'en-US' : 'en-IN'
    return `${sym}${Number(val).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div className="space-y-3.5 select-none font-mono">
      {/* 1. PORTFOLIO HOLDINGS */}
      <div className="rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs overflow-hidden transition-colors">
        <div className="p-3 border-b border-slate-100 dark:border-[#182235] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Portfolio Holdings
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#151f32] text-slate-600 dark:text-slate-400 font-semibold">
              {holdings.length} {holdings.length === 1 ? 'Position' : 'Positions'}
            </span>
          </div>
          {holdings.length > 0 && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Live P&L</span>
          )}
        </div>

        <div className="p-2 sm:p-2.5">
          {holdings.length === 0 ? (
            <div className="py-6 px-4 text-center">
              <div className="inline-flex p-2.5 rounded-full bg-slate-100 dark:bg-[#131d2e] text-slate-400 dark:text-slate-500 mb-2">
                <Briefcase className="h-5 w-5" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                No holdings yet — your positions will appear here after your first trade.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {holdings.map((h) => {
                const isGain = (h.pnl ?? 0) >= 0
                return (
                  <div
                    key={h.symbol}
                    onClick={() => onSelectSymbol?.(h.symbol)}
                    className="p-2 rounded bg-slate-50 dark:bg-[#090e18] hover:bg-slate-100 dark:hover:bg-[#10192b] border border-slate-100 dark:border-[#162033] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{h.symbol}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-[#1a2538] text-slate-600 dark:text-slate-400">
                            {h.exchange}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {h.quantity} shares @ {formatVal(h.averageBuyPrice, h.currency)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatVal(h.currentValue, h.currency)}
                      </div>
                      <div
                        className={`text-[10px] font-semibold tabular-nums flex items-center justify-end gap-0.5 ${
                          isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isGain ? '+' : ''}{formatVal(h.pnl, h.currency)} ({isGain ? '+' : ''}{Number(h.pnlPercent || 0).toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. MARKET WATCHLIST */}
      <div className="rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs overflow-hidden transition-colors">
        <div className="p-3 border-b border-slate-100 dark:border-[#182235] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Market Watchlist
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#151f32] text-slate-600 dark:text-slate-400 font-semibold">
              {watchlistItems.length} {watchlistItems.length === 1 ? 'Stock' : 'Stocks'}
            </span>
          </div>
          {onNavigateToMarkets && (
            <button
              onClick={onNavigateToMarkets}
              className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Markets <ArrowRight className="h-2.5 w-2.5" />
            </button>
          )}
        </div>

        <div className="p-2 sm:p-2.5">
          {watchlistItems.length === 0 ? (
            <div className="py-6 px-4 text-center">
              <div className="inline-flex p-2.5 rounded-full bg-slate-100 dark:bg-[#131d2e] text-slate-400 dark:text-slate-500 mb-2">
                <Star className="h-5 w-5" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Your watchlist is empty — add stocks from Markets.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {watchlistItems.map((item) => {
                const price = Number(item.currentPrice || 0)
                const change = Number(item.changeAmount || 0)
                const pct = Number(item.changePercent || 0)
                const isUp = change >= 0

                return (
                  <div
                    key={item.symbol}
                    onClick={() => onSelectSymbol?.(item.symbol)}
                    className="p-2 rounded bg-slate-50 dark:bg-[#090e18] hover:bg-slate-100 dark:hover:bg-[#10192b] border border-slate-100 dark:border-[#162033] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{item.symbol}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-[#1a2538] text-slate-600 dark:text-slate-400">
                          {item.exchange}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                        {item.name}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                        {price > 0 ? formatVal(price, item.currency) : '--'}
                      </div>
                      {price > 0 ? (
                        <div
                          className={`text-[10px] font-semibold tabular-nums flex items-center justify-end gap-0.5 ${
                            isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                          {isUp ? '+' : ''}{pct.toFixed(2)}%
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-400 italic">No price data</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MarketOverview
