import React from 'react'
import {
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react'
import type { StockQuote } from '../../types/auth'

interface MarketOverviewProps {
  stocks: StockQuote[]
  onSelectStock?: (stock: StockQuote) => void
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({ stocks, onSelectStock }) => {
  const gainers = stocks
    .filter((s) => (s.changeAmount ?? s.change ?? 0) >= 0)
    .sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
  const losers = stocks
    .filter((s) => (s.changeAmount ?? s.change ?? 0) < 0)
    .sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))

  const formatINR = (val: number | undefined | null) => {
    if (val == null) return '--'
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Display top tracked market instruments
  const displayStocks = stocks.slice(0, 4)

  return (
    <div className="space-y-2.5 select-none">
      {/* 1. Real Market Cards */}
      {displayStocks.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {displayStocks.map((stock) => {
            const price = stock.currentPrice ?? stock.price ?? 0
            const change = stock.changeAmount ?? stock.change ?? 0
            const pct = stock.changePercent ?? 0
            const isUp = change >= 0

            return (
              <div
                key={stock.symbol}
                onClick={() => onSelectStock?.(stock)}
                className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 shadow-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-300">{stock.symbol}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-semibold flex items-center gap-0.5 ${
                      isUp
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20'
                        : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20'
                    }`}
                  >
                    {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {isUp ? '+' : ''}{pct.toFixed(2)}%
                  </span>
                </div>

                <div className="mt-2">
                  {price > 0 ? (
                    <>
                      <div className="text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {formatINR(price)}
                      </div>
                      <div
                        className={`text-[10px] font-mono tabular-nums font-semibold ${
                          isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isUp ? '+' : ''}{formatINR(change)}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs font-medium font-mono text-slate-400 dark:text-slate-500 italic py-1">
                      Market data unavailable
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-[#172033] flex justify-between text-[9px] font-mono text-slate-400 dark:text-slate-500">
                  <span>L: {stock.dayLow ? formatINR(stock.dayLow) : '--'}</span>
                  <span>H: {stock.dayHigh ? formatINR(stock.dayHigh) : '--'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 2. Real Market Breadth & Top Movers Bar */}
      <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-xs transition-colors">
        {/* Breadth */}
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-blue-600 dark:text-blue-400" /> Market Breadth:
          </span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 font-semibold">
              ▲ {gainers.length} Advancing
            </span>
            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 font-semibold">
              ▼ {losers.length} Declining
            </span>
          </div>
        </div>

        {/* Real Top Gainers & Losers from active stocks */}
        {stocks.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-semibold">Movers:</span>
            {gainers.slice(0, 2).map((s) => (
              <button
                key={s.symbol}
                onClick={() => onSelectStock?.(s)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#070b13] border border-slate-200 dark:border-[#1e2a3f] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="font-bold">{s.symbol}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  +{s.changePercent?.toFixed(2) || '0.00'}%
                </span>
              </button>
            ))}
            {losers.slice(0, 2).map((s) => (
              <button
                key={s.symbol}
                onClick={() => onSelectStock?.(s)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#070b13] border border-slate-200 dark:border-[#1e2a3f] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="font-bold">{s.symbol}</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  {s.changePercent?.toFixed(2) || '0.00'}%
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MarketOverview
