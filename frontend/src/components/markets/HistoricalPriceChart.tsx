import React, { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle
} from 'lucide-react'
import type { StockQuote, StockHistory, HistoricalCandle } from '../../types/auth'
import marketService from '../../services/marketService'

export type ChartTimeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'
export type ChartStyle = 'area' | 'candlestick'

interface HistoricalPriceChartProps {
  stock: StockQuote
  onTimeframeChange?: (tf: ChartTimeframe) => void
}

interface PriceNode {
  timestamp: string
  label: string
  price: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  x: number
  y: number
}

export const HistoricalPriceChart: React.FC<HistoricalPriceChartProps> = ({ stock }) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('1M')
  const [chartStyle, setChartStyle] = useState<ChartStyle>('area')
  const [hoveredNode, setHoveredNode] = useState<PriceNode | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [history, setHistory] = useState<StockHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Standardize stock prices to INR
  const USD_TO_INR = 84
  const multiplier = stock.exchange === 'NASDAQ' ? USD_TO_INR : 1
  const currentPriceINR = Number(stock.currentPrice || stock.price || 0) * multiplier

  const formatINR = (val: number) => {
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Fetch real historical candles from backend MarketDataProvider
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    marketService
      .getHistory(stock.symbol)
      .then((data) => {
        if (isMounted) {
          setHistory(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          const msg =
            err.response?.data?.message ||
            'Historical market data temporarily unavailable from provider'
          setError(msg)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [stock.symbol])

  // Filter real candles based on chosen timeframe
  const chartData = useMemo(() => {
    if (!history?.candles || history.candles.length === 0) {
      return []
    }

    const allCandles = [...history.candles] // sorted chronologically (oldest to newest)

    let sliceCount = 30
    switch (timeframe) {
      case '1D':
        sliceCount = 2
        break
      case '1W':
        sliceCount = 7
        break
      case '1M':
        sliceCount = 30
        break
      case '3M':
        sliceCount = 65
        break
      case '1Y':
      case 'ALL':
        sliceCount = allCandles.length
        break
    }

    const targetCandles: HistoricalCandle[] = allCandles.slice(-Math.min(sliceCount, allCandles.length))

    return targetCandles.map((c) => {
      const open = Number(c.open) * multiplier
      const high = Number(c.high) * multiplier
      const low = Number(c.low) * multiplier
      const close = Number(c.close) * multiplier
      const volume = Number(c.volume || 0)

      // Format date label
      let label = c.date
      try {
        const d = new Date(c.date)
        label = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`
      } catch {
        label = c.date
      }

      return {
        open,
        high,
        low,
        close,
        volume,
        label,
        timestamp: c.date,
      }
    })
  }, [history, timeframe, multiplier])

  // Coordinate mapping for SVG view
  const viewW = 800
  const viewH = 240
  const padX = 20
  const padTop = 20
  const padBottom = 50 // space for volume histogram
  const usableW = viewW - padX * 2
  const usableH = viewH - padTop - padBottom

  const allLows = chartData.map((d) => d.low)
  const allHighs = chartData.map((d) => d.high)
  const minPrice = allLows.length > 0 ? Math.min(...allLows) * 0.998 : currentPriceINR * 0.95
  const maxPrice = allHighs.length > 0 ? Math.max(...allHighs) * 1.002 : currentPriceINR * 1.05
  const priceRange = maxPrice - minPrice || 1

  const maxVolume = chartData.length > 0 ? Math.max(...chartData.map((d) => d.volume)) || 1 : 1

  // Project points to coordinates
  const nodes: PriceNode[] = chartData.map((item, idx) => {
    const x = chartData.length > 1 ? padX + (idx / (chartData.length - 1)) * usableW : padX + usableW / 2
    const y = padTop + usableH - ((item.close - minPrice) / priceRange) * usableH
    return {
      ...item,
      price: item.close,
      x,
      y,
    }
  })

  // Calculate return stats for the current timeframe
  const startPrice = nodes[0]?.open || currentPriceINR
  const endPrice = nodes[nodes.length - 1]?.close || currentPriceINR
  const periodReturn = endPrice - startPrice
  const periodReturnPct = startPrice > 0 ? (periodReturn / startPrice) * 100 : 0
  const isPeriodGain = periodReturn >= 0

  // SVG Area & Line Path
  const lineD = nodes.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
  }, '')

  const lastNode = nodes[nodes.length - 1]
  const firstNode = nodes[0]
  const baselineY = padTop + usableH
  const areaD =
    nodes.length > 1
      ? `${lineD} L ${lastNode.x.toFixed(1)} ${baselineY} L ${firstNode.x.toFixed(1)} ${baselineY} Z`
      : ''

  // Handle mouse movement for crosshairs
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (nodes.length === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * viewW
    const mouseY = ((e.clientY - rect.top) / rect.height) * viewH

    let closest = nodes[0]
    let minDiff = Infinity
    nodes.forEach((n) => {
      const diff = Math.abs(n.x - mouseX)
      if (diff < minDiff) {
        minDiff = diff
        closest = n
      }
    })

    setHoveredNode(closest)
    setMousePos({ x: closest.x, y: mouseY })
  }

  const handleMouseLeave = () => {
    setHoveredNode(null)
    setMousePos(null)
  }

  const activeDisplayNode = hoveredNode || lastNode

  return (
    <div className="rounded-md border border-slate-200 dark:border-[#1b2537] bg-white dark:bg-[#0c1220] shadow-xs select-none font-mono">
      {/* 1. Chart Control & Summary Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-[#182235] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Current Price & Period Change Info */}
        <div className="flex items-baseline gap-3">
          <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {(activeDisplayNode ? activeDisplayNode.price : currentPriceINR) > 0
              ? formatINR(activeDisplayNode ? activeDisplayNode.price : currentPriceINR)
              : 'Market data unavailable'}
          </span>
          {nodes.length > 0 && startPrice > 0 && (
            <div
              className={`text-xs font-bold tabular-nums flex items-center gap-1 ${
                isPeriodGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPeriodGain ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>
                {isPeriodGain ? '+' : ''}
                {formatINR((activeDisplayNode?.price || endPrice) - startPrice)} ({isPeriodGain ? '+' : ''}
                {((((activeDisplayNode?.price || endPrice) - startPrice) / startPrice) * 100).toFixed(2)}%)
              </span>
              <span className="text-[10px] text-slate-500 font-normal">in {timeframe}</span>
            </div>
          )}
        </div>

        {/* Right: Chart Controls (Timeframe + Style Toggle) */}
        <div className="flex items-center gap-2">
          {/* Chart Style Toggle */}
          <div className="flex items-center p-0.5 rounded bg-slate-100 dark:bg-[#070b13] border border-slate-200 dark:border-[#1b2537]">
            <button
              onClick={() => setChartStyle('area')}
              className={`px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                chartStyle === 'area'
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Line / Area View"
            >
              Area
            </button>
            <button
              onClick={() => setChartStyle('candlestick')}
              className={`px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                chartStyle === 'candlestick'
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Candlestick View"
            >
              Candles
            </button>
          </div>

          {/* Timeframe Selectors */}
          <div className="flex items-center p-0.5 rounded bg-slate-100 dark:bg-[#070b13] border border-slate-200 dark:border-[#1b2537]">
            {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-white dark:bg-[#18233a] text-blue-600 dark:text-blue-400 font-bold border border-slate-200 dark:border-blue-500/30 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Interactive SVG Canvas or Status Banner */}
      <div className="relative p-2.5 bg-slate-50/50 dark:bg-[#090e1a] min-h-64 flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-2 text-slate-500 text-xs py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span>Loading daily historical series from Alpha Vantage...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 text-slate-500 text-xs py-16 px-4 text-center max-w-md">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Historical data unavailable</span>
            <span className="text-[11px] text-slate-500">{error}</span>
          </div>
        )}

        {!loading && !error && nodes.length === 0 && (
          <div className="text-slate-500 text-xs py-16 text-center">
            No historical price records returned by the data provider for {stock.symbol}.
          </div>
        )}

        {!loading && !error && nodes.length > 0 && (
          <>
            {/* Floating Crosshair HUD */}
            {hoveredNode && (
              <div className="absolute top-4 left-4 z-20 pointer-events-none bg-white/95 dark:bg-[#070b14]/90 backdrop-blur border border-slate-200 dark:border-[#1c2638] px-3 py-1.5 rounded shadow-lg text-[10px] space-x-3 text-slate-700 dark:text-slate-300">
                <span className="text-slate-900 dark:text-white font-bold">{hoveredNode.timestamp}</span>
                <span>O: <span className="text-slate-700 dark:text-slate-100">{formatINR(hoveredNode.open)}</span></span>
                <span>H: <span className="text-emerald-600 dark:text-emerald-400">{formatINR(hoveredNode.high)}</span></span>
                <span>L: <span className="text-rose-600 dark:text-rose-400">{formatINR(hoveredNode.low)}</span></span>
                <span>C: <span className="text-slate-900 dark:text-white font-bold">{formatINR(hoveredNode.close)}</span></span>
                <span>Vol: <span className="text-blue-600 dark:text-blue-400">{(hoveredNode.volume / 1000).toFixed(0)}k</span></span>
              </div>
            )}

            <svg
              viewBox={`0 0 ${viewW} ${viewH}`}
              className="w-full h-64 sm:h-72 cursor-crosshair overflow-visible"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <linearGradient id="chartGainGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="chartLossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0.2, 0.4, 0.6, 0.8].map((pct) => {
                const y = padTop + usableH * pct
                const p = maxPrice - pct * priceRange
                return (
                  <g key={pct}>
                    <line x1={padX} y1={y} x2={viewW - padX} y2={y} stroke="currentColor" className="text-slate-200 dark:text-[#141d2d]" strokeDasharray="3 3" />
                    <text x={viewW - padX - 4} y={y - 3} fill="currentColor" className="text-slate-400 dark:text-[#475569]" fontSize="8" textAnchor="end">
                      {formatINR(p)}
                    </text>
                  </g>
                )
              })}

              {/* Volume sub-chart background baseline */}
              <line
                x1={padX}
                y1={padTop + usableH}
                x2={viewW - padX}
                y2={padTop + usableH}
                stroke="currentColor"
                className="text-slate-300 dark:text-[#1c2638]"
                strokeWidth="1"
              />

              {/* Volume Histogram Bars */}
              {nodes.map((node, i) => {
                const barH = (node.volume / maxVolume) * 35
                const barY = viewH - 18 - barH
                const isUp = node.close >= node.open
                const barW = Math.max(2, usableW / nodes.length - 2)

                return (
                  <rect
                    key={`vol-${i}`}
                    x={node.x - barW / 2}
                    y={barY}
                    width={barW}
                    height={barH}
                    fill={isUp ? '#10b981' : '#f43f5e'}
                    opacity={hoveredNode?.x === node.x ? 0.9 : 0.35}
                    rx="0.5"
                  />
                )
              })}

              {/* AREA / LINE MODE */}
              {chartStyle === 'area' && (
                <>
                  <path
                    d={areaD}
                    fill={isPeriodGain ? 'url(#chartGainGradient)' : 'url(#chartLossGradient)'}
                  />
                  <path
                    d={lineD}
                    fill="none"
                    stroke={isPeriodGain ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* CANDLESTICK MODE */}
              {chartStyle === 'candlestick' &&
                nodes.map((node, i) => {
                  const isUp = node.close >= node.open
                  const highY = padTop + usableH - ((node.high - minPrice) / priceRange) * usableH
                  const lowY = padTop + usableH - ((node.low - minPrice) / priceRange) * usableH
                  const openY = padTop + usableH - ((node.open - minPrice) / priceRange) * usableH
                  const closeY = padTop + usableH - ((node.close - minPrice) / priceRange) * usableH

                  const bodyTop = Math.min(openY, closeY)
                  const bodyHeight = Math.max(2.5, Math.abs(closeY - openY))
                  const candleW = Math.max(3, Math.min(10, usableW / nodes.length - 3))

                  return (
                    <g key={`candle-${i}`}>
                      <line
                        x1={node.x}
                        y1={highY}
                        x2={node.x}
                        y2={lowY}
                        stroke={isUp ? '#10b981' : '#f43f5e'}
                        strokeWidth="1.2"
                      />
                      <rect
                        x={node.x - candleW / 2}
                        y={bodyTop}
                        width={candleW}
                        height={bodyHeight}
                        fill={isUp ? '#10b981' : '#f43f5e'}
                        rx="1"
                      />
                    </g>
                  )
                })}

              {/* Active Hover Crosshair Line */}
              {hoveredNode && mousePos && (
                <g>
                  <line
                    x1={hoveredNode.x}
                    y1={padTop}
                    x2={hoveredNode.x}
                    y2={viewH - 18}
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1={padX}
                    y1={hoveredNode.y}
                    x2={viewW - padX}
                    y2={hoveredNode.y}
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <circle cx={hoveredNode.x} cy={hoveredNode.y} r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                </g>
              )}

              {/* Time Labels on X-axis */}
              {nodes
                .filter((_, i) => i % Math.max(1, Math.ceil(nodes.length / 6)) === 0 || i === nodes.length - 1)
                .map((node, i) => (
                  <text
                    key={`label-${i}`}
                    x={node.x}
                    y={viewH - 4}
                    fill="currentColor"
                    className="text-slate-400 dark:text-[#64748b]"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {node.label}
                  </text>
                ))}
            </svg>
          </>
        )}
      </div>

      {/* 3. Range & Statistics Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-[#182235] bg-slate-50 dark:bg-[#070b14] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase">Period High</span>
          <div className="font-bold text-slate-900 dark:text-white mt-0.5">{formatINR(minPrice > 0 ? maxPrice : 0)}</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase">Period Low</span>
          <div className="font-bold text-slate-900 dark:text-white mt-0.5">{formatINR(minPrice > 0 ? minPrice : 0)}</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase">Period Return</span>
          <div className={`font-bold mt-0.5 ${isPeriodGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {nodes.length > 0 ? (
              <>
                {isPeriodGain ? '+' : ''}{formatINR(periodReturn)} ({isPeriodGain ? '+' : ''}{periodReturnPct.toFixed(2)}%)
              </>
            ) : (
              '--'
            )}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase">Candles Loaded</span>
          <div className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {chartData.length} Daily Sessions
          </div>
        </div>
      </div>
    </div>
  )
}

export default HistoricalPriceChart
