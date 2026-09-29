import React from 'react'
import { TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react'
import type { StockQuote } from '../../types/auth'

export interface IndexData {
  id: string
  name: string
  exchange: string
  region: string
  val: string
  chg: string
  pct: string
  up: boolean
  low: string
  high: string
  sparkline: number[]
}

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
  const indices: IndexData[] = [
    {
      id: 'NIFTY50',
      name: 'NIFTY 50',
      exchange: 'NSE',
      region: 'India',
      val: '24,835.10',
      chg: '+104.25',
      pct: '+0.42%',
      up: true,
      low: '24,710.40',
      high: '24,860.80',
      sparkline: [24710, 24735, 24720, 24780, 24765, 24820, 24835],
    },
    {
      id: 'SENSEX',
      name: 'SENSEX',
      exchange: 'BSE',
      region: 'India',
      val: '81,340.50',
      chg: '+308.10',
      pct: '+0.38%',
      up: true,
      low: '81,020.15',
      high: '81,420.00',
      sparkline: [81020, 81110, 81080, 81220, 81290, 81310, 81340],
    },
    {
      id: 'BANKNIFTY',
      name: 'BANK NIFTY',
      exchange: 'NSE',
      region: 'India',
      val: '51,920.30',
      chg: '-78.40',
      pct: '-0.15%',
      up: false,
      low: '51,840.10',
      high: '52,110.50',
      sparkline: [52050, 52110, 52010, 51950, 51880, 51900, 51920],
    },
    {
      id: 'NIFTYIT',
      name: 'NIFTY IT',
      exchange: 'NSE',
      region: 'India',
      val: '41,850.60',
      chg: '+245.80',
      pct: '+0.59%',
      up: true,
      low: '41,610.20',
      high: '41,920.00',
      sparkline: [41610, 41670, 41650, 41740, 41780, 41820, 41850],
    },
    {
      id: 'NASDAQ100',
      name: 'NASDAQ 100',
      exchange: 'NASDAQ',
      region: 'Global Tech',
      val: '18,240.20',
      chg: '+117.80',
      pct: '+0.65%',
      up: true,
      low: '18,120.00',
      high: '18,290.40',
      sparkline: [18120, 18150, 18190, 18180, 18210, 18230, 18240],
    },
    {
      id: 'SP500',
      name: 'S&P 500',
      exchange: 'CBOE',
      region: 'US Broad',
      val: '5,718.55',
      chg: '+16.20',
      pct: '+0.28%',
      up: true,
      low: '5,702.10',
      high: '5,730.00',
      sparkline: [5702, 5708, 5712, 5710, 5715, 5717, 5718],
    },
  ]

  const gainers = stocks.filter((s) => s.changeAmount >= 0)
  const losers = stocks.filter((s) => s.changeAmount < 0)

  // Generate SVG path for sparkline (fixed 60x22 box)
  const renderSparkline = (points: number[], up: boolean) => {
    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max - min || 1
    const w = 60
    const h = 20
    const step = w / (points.length - 1)

    const pathD = points
      .map((p, i) => {
        const x = i * step
        const y = h - ((p - min) / range) * (h - 4) - 2
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')

    const strokeColor = up ? '#10b981' : '#f43f5e'

    return (
      <svg className="w-15 h-5 overflow-visible" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <div className="space-y-3 select-none font-mono">
      {/* 1. Market Status Header Bar */}
      <div className="p-3 rounded-md border border-slate-200 dark:border-[#1b2537] bg-white dark:bg-[#090e1a] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-bold text-slate-900 dark:text-white tracking-wide">MARKETS LIVE</span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>

          <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
            <Clock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
            <span>Regular Session (09:15 - 15:30 IST)</span>
          </div>

          <span className="text-slate-300 dark:text-slate-600 hidden md:inline">•</span>

          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
            NSE / BSE Simulated Feeds
          </span>
        </div>

        {/* Market Breadth Pill */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-500 flex items-center gap-1">
            <Activity className="h-3 w-3 text-blue-500 dark:text-blue-400" /> Breadth:
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
            ▲ {gainers.length} Advancing
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
            ▼ {losers.length} Declining
          </span>
        </div>
      </div>

      {/* 2. Responsive Indices Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {indices.map((idx) => {
          const isSelected = selectedIndexId === idx.id
          return (
            <div
              key={idx.id}
              onClick={() => onSelectIndex?.(isSelected ? null : idx.id)}
              className={`p-3 rounded-md border transition-all cursor-pointer bg-white dark:bg-[#0c1220] flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 shadow-xs ${
                isSelected ? 'border-blue-500 shadow-md shadow-blue-500/10 bg-blue-50/40 dark:bg-[#0f172a]' : 'border-slate-200 dark:border-[#1b2537]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-xs truncate">{idx.name}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                    {idx.exchange}
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{idx.region}</div>
              </div>

              <div className="my-2 flex items-baseline justify-between gap-1">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {idx.val}
                  </div>
                  <div
                    className={`text-[10px] flex items-center gap-0.5 font-bold tabular-nums ${
                      idx.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {idx.up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    <span>{idx.pct}</span>
                  </div>
                </div>

                {/* Sparkline mini-graph */}
                <div>{renderSparkline(idx.sparkline, idx.up)}</div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 dark:border-[#172033] flex justify-between text-[8px] text-slate-500 dark:text-slate-400 tabular-nums">
                <span>L: {idx.low}</span>
                <span>H: {idx.high}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MarketIndices
