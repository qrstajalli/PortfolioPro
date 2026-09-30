import React from 'react'
import { TrendingUp, TrendingDown, Clock, Activity, AlertCircle } from 'lucide-react'
import type { StockQuote } from '../../types/auth'

interface MarketIndicesProps {
  stocks?: StockQuote[]
  selectedIndexId?: string | null
  onSelectIndex?: (id: string | null) => void
}

export const MarketIndices: React.FC<MarketIndicesProps> = ({
  stocks = [],
  selectedIndexId,
  onSelectIndex,
}) => {
  const gainers = stocks.filter((s) => (s.changeAmount ?? s.change ?? 0) >= 0)
  const losers = stocks.filter((s) => (s.changeAmount ?? s.change ?? 0) < 0)

  const formatINR = (val: number | undefined | null) => {
    if (val == null) return '--'
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div className="space-y-3 select-none font-mono">
      {/* 1. Market Status Header Bar */}
      <div className="p-3 rounded-md border border-slate-200 dark:border-[#1b2537] bg-white dark:bg-[#090e1a] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <span className="font-bold text-slate-900 dark:text-white tracking-wide">
              MARKETS FEED
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              DELAYED / LATEST AVAILABLE
            </span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>

          <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
            <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
            <span>Alpha Vantage Daily Series</span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 hidden md:inline">•</span>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
            BSE / NSE Indian & Global Equities
          </span>
        </div>

        {/* Real Market Breadth Pill */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-500 flex items-center gap-1">
            <Activity className="h-3 w-3 text-blue-500 dark:text-blue-400" /> Breadth:
          </span>
          {stocks.length > 0 ? (
            <>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                ▲ {gainers.length} Advancing
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                ▼ {losers.length} Declining
              </span>
            </>
          ) : (
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
              Loading feeds...
            </span>
          )}
        </div>
      </div>

      {/* 2. Real Market Cards (Active Tracked Equities) */}
      {stocks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {stocks.map((stock) => {
            const isSelected = selectedIndexId === stock.symbol
            const price = stock.currentPrice ?? stock.price ?? 0
            const change = stock.changeAmount ?? stock.change ?? 0
            const pct = stock.changePercent ?? 0
            const isUp = change >= 0

            return (
              <div
                key={stock.symbol}
                onClick={() => onSelectIndex?.(isSelected ? null : stock.symbol)}
                className={`p-3 rounded-md border transition-all cursor-pointer bg-white dark:bg-[#0c1220] flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 shadow-xs ${
                  isSelected
                    ? 'border-blue-500 shadow-md shadow-blue-500/10 bg-blue-50/40 dark:bg-[#0f172a]'
                    : 'border-slate-200 dark:border-[#1b2537]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                      {stock.symbol}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                      {stock.exchange || 'BSE'}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {stock.company || stock.name}
                  </div>
                </div>

                <div className="my-2 flex items-baseline justify-between gap-1">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {formatINR(price)}
                    </div>
                    <div
                      className={`text-[10px] flex items-center gap-0.5 font-bold tabular-nums ${
                        isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      <span>
                        {isUp ? '+' : ''}
                        {pct.toFixed(2)}% ({isUp ? '+' : ''}
                        {formatINR(change)})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 dark:border-[#172033] flex justify-between text-[8px] text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>L: {stock.dayLow ? formatINR(stock.dayLow) : '--'}</span>
                  <span>H: {stock.dayHigh ? formatINR(stock.dayHigh) : '--'}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-4 rounded-md border border-slate-200 dark:border-[#1b2537] bg-white dark:bg-[#0c1220] text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4 text-slate-400" />
          <span>Active equity feed loading from backend MarketDataProvider...</span>
        </div>
      )}
    </div>
  )
}

export default MarketIndices
