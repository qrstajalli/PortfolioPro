import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import type { StockQuote } from '../../types/auth'

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

  // Standardize stock prices to INR
  const USD_TO_INR = 84
  const multiplier = stock.exchange === 'NASDAQ' ? USD_TO_INR : 1
  const currentPriceINR = Number(stock.currentPrice) * multiplier
  const prevCloseINR = Number(stock.previousClose) * multiplier

  const formatINR = (val: number) => {
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Generate deterministic realistic historical price series based on timeframe, symbol, and price
  const chartData = useMemo(() => {
    const symbolSeed = stock.symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

    let nodeCount = 30
    let intervalDays = 1

    switch (timeframe) {
      case '1D':
        nodeCount = 26 // Intraday 15-min intervals from 09:15 to 15:30
        intervalDays = 0
        break
      case '1W':
        nodeCount = 28 // 7 days * 4 checks
        intervalDays = 7
        break
      case '1M':
        nodeCount = 30 // 30 days
        intervalDays = 30
        break
      case '3M':
        nodeCount = 36 // ~12 weeks
        intervalDays = 90
        break
      case '1Y':
        nodeCount = 52 // 52 weeks
        intervalDays = 365
        break
      case 'ALL':
        nodeCount = 60 // 5 years monthly
        intervalDays = 1825
        break
    }

    const basePrice = prevCloseINR
    const volatility = 0.018 + (symbolSeed % 10) * 0.002
    const trendFactor = stock.changeAmount >= 0 ? 0.003 : -0.003

    const prices: { open: number; high: number; low: number; close: number; volume: number; label: string; timestamp: string }[] = []

    let walk = basePrice * (1 - trendFactor * (nodeCount * 0.5))

    const now = new Date(2026, 8, 28, 15, 30) // Reference current date

    for (let i = 0; i < nodeCount; i++) {
      const progress = i / (nodeCount - 1)
      const wave = Math.sin((i / 4) + (symbolSeed % 7)) * (basePrice * volatility)
      const secondaryWave = Math.cos((i / 2.5) + (symbolSeed % 5)) * (basePrice * 0.008)

      // Drift towards final current price
      walk = basePrice + wave + secondaryWave + (currentPriceINR - basePrice) * progress

      if (i === nodeCount - 1) {
        walk = currentPriceINR
      }

      const spread = walk * 0.009
      const open = i === 0 ? basePrice : prices[i - 1].close
      const close = walk
      const high = Math.max(open, close) + spread * (0.5 + Math.abs(Math.sin(i * 1.7)))
      const low = Math.min(open, close) - spread * (0.5 + Math.abs(Math.cos(i * 1.3)))
      const volume = Math.floor(stock.volume / nodeCount * (0.7 + Math.abs(Math.sin(i + symbolSeed)) * 0.6))

      let label = ''
      let timestamp = ''

      if (timeframe === '1D') {
        const totalMinutes = 9 * 60 + 15 + Math.floor(progress * 375)
        const h = Math.floor(totalMinutes / 60)
        const m = totalMinutes % 60
        label = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        timestamp = `Today, ${label} IST`
      } else if (timeframe === '1W' || timeframe === '1M') {
        const dateObj = new Date(now.getTime() - (intervalDays - (progress * intervalDays)) * 86400000)
        label = `${dateObj.getDate()} ${dateObj.toLocaleString('en-US', { month: 'short' })}`
        timestamp = `${dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
      } else {
        const dateObj = new Date(now.getTime() - (intervalDays - (progress * intervalDays)) * 86400000)
        label = `${dateObj.toLocaleString('en-US', { month: 'short' })} '${dateObj.getFullYear().toString().slice(-2)}`
        timestamp = `${dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
      }

      prices.push({ open, high, low, close, volume, label, timestamp })
    }

    return prices
  }, [stock, timeframe, currentPriceINR, prevCloseINR])

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
  const minPrice = Math.min(...allLows) * 0.998
  const maxPrice = Math.max(...allHighs) * 1.002
  const priceRange = maxPrice - minPrice || 1

  const maxVolume = Math.max(...chartData.map((d) => d.volume)) || 1

  // Project points to coordinates
  const nodes: PriceNode[] = chartData.map((item, idx) => {
    const x = padX + (idx / (chartData.length - 1)) * usableW
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
  const periodReturnPct = (periodReturn / startPrice) * 100
  const isPeriodGain = periodReturn >= 0

  // SVG Area & Line Path
  const lineD = nodes.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
  }, '')

  const lastNode = nodes[nodes.length - 1]
  const firstNode = nodes[0]
  const baselineY = padTop + usableH
  const areaD = `${lineD} L ${lastNode.x.toFixed(1)} ${baselineY} L ${firstNode.x.toFixed(1)} ${baselineY} Z`

  // Handle mouse movement for crosshairs
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * viewW
    const mouseY = ((e.clientY - rect.top) / rect.height) * viewH

    // Find nearest node
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
        {/* Left: Live Price & Period Change Info */}
        <div className="flex items-baseline gap-3">
          <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatINR(activeDisplayNode.price)}
          </span>
          <div
            className={`text-xs font-bold tabular-nums flex items-center gap-1 ${
              isPeriodGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isPeriodGain ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>
              {isPeriodGain ? '+' : ''}
              {formatINR(activeDisplayNode.price - startPrice)} ({isPeriodGain ? '+' : ''}
              {(((activeDisplayNode.price - startPrice) / startPrice) * 100).toFixed(2)}%)
            </span>
            <span className="text-[10px] text-slate-500 font-normal">in {timeframe}</span>
          </div>
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

      {/* 2. Interactive SVG Canvas */}
      <div className="relative p-2.5 bg-slate-50/50 dark:bg-[#090e1a]">
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
                  {/* Wick */}
                  <line
                    x1={node.x}
                    y1={highY}
                    x2={node.x}
                    y2={lowY}
                    stroke={isUp ? '#10b981' : '#f43f5e'}
                    strokeWidth="1.2"
                  />
                  {/* Candle Body */}
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
              {/* Vertical crosshair */}
              <line
                x1={hoveredNode.x}
                y1={padTop}
                x2={hoveredNode.x}
                y2={viewH - 18}
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Horizontal crosshair */}
              <line
                x1={padX}
                y1={hoveredNode.y}
                x2={viewW - padX}
                y2={hoveredNode.y}
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Active point target */}
              <circle cx={hoveredNode.x} cy={hoveredNode.y} r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}

          {/* Time Labels on X-axis */}
          {nodes
            .filter((_, i) => i % Math.ceil(nodes.length / 6) === 0 || i === nodes.length - 1)
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
      </div>

      {/* 3. Range & Statistics Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-[#182235] bg-slate-50 dark:bg-[#070b14] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase">Period High</span>
          <div className="font-bold text-slate-900 dark:text-white mt-0.5">{formatINR(maxPrice)}</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase">Period Low</span>
          <div className="font-bold text-slate-900 dark:text-white mt-0.5">{formatINR(minPrice)}</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase">Period Return</span>
          <div className={`font-bold mt-0.5 ${isPeriodGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {isPeriodGain ? '+' : ''}{formatINR(periodReturn)} ({isPeriodGain ? '+' : ''}{periodReturnPct.toFixed(2)}%)
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase">Trading Volume</span>
          <div className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {(stock.volume / 1000000).toFixed(2)}M Shares
          </div>
        </div>
      </div>
    </div>
  )
}

export default HistoricalPriceChart
