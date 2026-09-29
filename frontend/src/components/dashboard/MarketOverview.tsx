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
  const indices = [
    { name: 'NIFTY 50', val: '24,835.10', chg: '+104.25', pct: '+0.42%', up: true, low: '24,710', high: '24,860' },
    { name: 'SENSEX', val: '81,340.50', chg: '+308.10', pct: '+0.38%', up: true, low: '81,020', high: '81,420' },
    { name: 'BANK NIFTY', val: '51,920.30', chg: '-78.40', pct: '-0.15%', up: false, low: '51,840', high: '52,110' },
    { name: 'NASDAQ 100', val: '18,240.20', chg: '+117.80', pct: '+0.65%', up: true, low: '18,120', high: '18,290' },
  ]

  const gainers = stocks.filter((s) => s.changeAmount >= 0).sort((a, b) => b.changePercent - a.changePercent)
  const losers = stocks.filter((s) => s.changeAmount < 0).sort((a, b) => a.changePercent - b.changePercent)

  return (
    <div className="space-y-2.5 select-none">
      {/* 1. Indices Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {indices.map((idx) => (
          <div
            key={idx.name}
            className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 shadow-xs transition-colors"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-300">{idx.name}</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-semibold flex items-center gap-0.5 ${
                  idx.up
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20'
                    : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/20'
                }`}
              >
                {idx.up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {idx.pct}
              </span>
            </div>

            <div className="mt-2">
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                {idx.val}
              </div>
              <div
                className={`text-[10px] font-mono tabular-nums font-semibold ${
                  idx.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {idx.chg} pts
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-[#172033] flex justify-between text-[9px] font-mono text-slate-400 dark:text-slate-500">
              <span>L: {idx.low}</span>
              <span>H: {idx.high}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Market Breadth & Top Movers Bar */}
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

        {/* Quick Top Gainers & Losers */}
        <div className="flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
          <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-semibold">Top Movers:</span>
          {gainers.slice(0, 2).map((s) => (
            <button
              key={s.symbol}
              onClick={() => onSelectStock?.(s)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#070b13] border border-slate-200 dark:border-[#1e2a3f] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="font-bold">{s.symbol}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{s.changePercent.toFixed(1)}%</span>
            </button>
          ))}
          {losers.slice(0, 2).map((s) => (
            <button
              key={s.symbol}
              onClick={() => onSelectStock?.(s)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#070b13] border border-slate-200 dark:border-[#1e2a3f] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="font-bold">{s.symbol}</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">{s.changePercent.toFixed(1)}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MarketOverview
