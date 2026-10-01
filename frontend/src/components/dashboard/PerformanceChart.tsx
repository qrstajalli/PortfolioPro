import React, { useState, useMemo, useRef } from 'react'
import { TrendingUp, BarChart2 } from 'lucide-react'

export interface EquityDataPoint {
  label: string
  fullDate?: string
  value: number
}

interface PerformanceChartProps {
  history?: EquityDataPoint[]
  netWorth?: number
  unrealizedPnL?: number
  unrealizedPnLPercent?: number
  profitFactor?: number | null
  maxDrawdown?: number | null
  sharpeRatio?: number | null
  winRate?: number | null
  currency?: string
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  history = [],
  netWorth = 0,
  unrealizedPnL = 0,
  unrealizedPnLPercent = 0,
  profitFactor = null,
  maxDrawdown = null,
  sharpeRatio = null,
  winRate = null,
  currency = 'INR',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const isUSD = currency === 'USD'
  const sym = isUSD ? '$' : '₹'
  const locale = isUSD ? 'en-US' : 'en-IN'

  const formatCurrency = (val: number) => {
    return `${sym}${Number(val).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const hasChartData = history.length >= 2

  // Chart layout dimensions
  const viewW = 860
  const viewH = 240
  const padLeft = 70
  const padRight = 24
  const padTop = 18
  const padBottom = 32
  const plotW = viewW - padLeft - padRight
  const plotH = viewH - padTop - padBottom

  // Domain scaling with headroom
  const rawValues = hasChartData ? history.map((d) => d.value) : [netWorth, netWorth]
  const rawMin = Math.min(...rawValues)
  const rawMax = Math.max(...rawValues)
  const rawSpan = rawMax - rawMin || 1
  const domainMin = rawMin - rawSpan * 0.08
  const domainMax = rawMax + rawSpan * 0.08
  const domainRange = domainMax - domainMin

  // Coordinate mapping
  const plotCoords = useMemo(() => {
    if (!hasChartData) return []
    const n = history.length
    return history.map((d, i) => {
      const x = padLeft + (i / (n - 1)) * plotW
      const y = padTop + plotH - ((d.value - domainMin) / domainRange) * plotH
      return { x, y, data: d }
    })
  }, [history, hasChartData, domainMin, domainRange, plotW, plotH, padLeft, padTop])

  // Smooth SVG path generation
  const { lineD, areaD } = useMemo(() => {
    if (plotCoords.length < 2) return { lineD: '', areaD: '' }

    let path = `M ${plotCoords[0].x.toFixed(1)} ${plotCoords[0].y.toFixed(1)}`

    for (let i = 0; i < plotCoords.length - 1; i++) {
      const p0 = i > 0 ? plotCoords[i - 1] : plotCoords[i]
      const p1 = plotCoords[i]
      const p2 = plotCoords[i + 1]
      const p3 = i !== plotCoords.length - 2 ? plotCoords[i + 2] : p2

      const tension = 0.18
      const cp1x = p1.x + (p2.x - p0.x) * tension
      const cp1y = p1.y + (p2.y - p0.y) * tension
      const cp2x = p2.x - (p3.x - p1.x) * tension
      const cp2y = p2.y - (p3.y - p1.y) * tension

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    }

    const baselineY = padTop + plotH
    const area = `${path} L ${plotCoords[plotCoords.length - 1].x.toFixed(1)} ${baselineY.toFixed(1)} L ${plotCoords[0].x.toFixed(1)} ${baselineY.toFixed(1)} Z`

    return { lineD: path, areaD: area }
  }, [plotCoords, padTop, plotH])

  // Y-axis gridline levels
  const yAxisLevels = useMemo(() => {
    const steps = [0.0, 0.33, 0.67, 1.0]
    return steps.map((pct) => {
      const val = domainMax - pct * domainRange
      const y = padTop + pct * plotH
      return { y, val }
    })
  }, [domainMax, domainRange, padTop, plotH])

  // Hover position handling
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || plotCoords.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * viewW

    let closestIndex = 0
    let minDiff = Infinity
    plotCoords.forEach((pt, i) => {
      const diff = Math.abs(pt.x - relX)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    })
    setHoverIndex(closestIndex)
  }

  const activeIdx = hoverIndex !== null ? hoverIndex : (plotCoords.length > 0 ? plotCoords.length - 1 : 0)
  const activeNode = plotCoords[activeIdx]
  const displayValue = activeNode ? activeNode.data.value : netWorth

  return (
    <div className="p-4 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs flex flex-col justify-between select-none transition-colors font-mono">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#182235]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Portfolio Equity Curve
          </span>
          {hasChartData ? (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                unrealizedPnLPercent >= 0
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
              }`}
            >
              {unrealizedPnLPercent >= 0 ? '+' : ''}
              {unrealizedPnLPercent.toFixed(2)}%
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Live Equity
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          {hasChartData ? `${history.length} snapshot intervals` : 'Real-time equity tracking'}
        </div>
      </div>

      {/* 2. Value Readout Header */}
      <div className="flex items-baseline justify-between pt-3 pb-1 text-xs">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatCurrency(displayValue)}
          </span>
          {hasChartData && (
            <span
              className={`text-xs font-semibold tabular-nums ${
                unrealizedPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {unrealizedPnL >= 0 ? '+' : ''}
              {formatCurrency(unrealizedPnL)} ({unrealizedPnL >= 0 ? '+' : ''}
              {unrealizedPnLPercent.toFixed(2)}%)
            </span>
          )}
        </div>
        {activeNode && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Ref: <span className="text-slate-700 dark:text-slate-300 font-semibold">{activeNode.data.fullDate || activeNode.data.label}</span>
          </span>
        )}
      </div>

      {/* 3. Main Chart Canvas or Clean Empty State */}
      {!hasChartData ? (
        <div className="w-full h-48 sm:h-56 lg:h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-[#1a2538] rounded my-2 bg-slate-50/50 dark:bg-[#070b13]/50">
          <div className="p-3 rounded-full bg-slate-100 dark:bg-[#131d2e] text-slate-400 dark:text-slate-500 mb-2">
            <BarChart2 className="h-6 w-6" />
          </div>
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
            No Trading Activity Recorded
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm text-center">
            Your equity curve will track your balance and performance once you begin trading.
          </p>
        </div>
      ) : (
        <div className="relative w-full mt-2">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${viewW} ${viewH}`}
            className="w-full h-48 sm:h-56 lg:h-64 cursor-crosshair select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="proEquityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {yAxisLevels.map((lvl, idx) => (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={lvl.y}
                  x2={viewW - padRight}
                  y2={lvl.y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-[#162235]"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={lvl.y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] tabular-nums"
                >
                  {formatCurrency(lvl.val)}
                </text>
              </g>
            ))}

            <line
              x1={padLeft}
              y1={padTop + plotH}
              x2={viewW - padRight}
              y2={padTop + plotH}
              stroke="currentColor"
              className="text-slate-200 dark:text-[#1c273c]"
              strokeWidth="1"
            />

            <path d={areaD} fill="url(#proEquityGradient)" />

            <path
              d={lineD}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {hoverIndex !== null && activeNode && (
              <g>
                <line
                  x1={activeNode.x}
                  y1={padTop}
                  x2={activeNode.x}
                  y2={padTop + plotH}
                  stroke="currentColor"
                  className="text-slate-400 dark:text-slate-500"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={activeNode.x}
                  cy={activeNode.y}
                  r="3.5"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            )}

            {hoverIndex === null && plotCoords.length > 0 && (
              <circle
                cx={plotCoords[plotCoords.length - 1].x}
                cy={plotCoords[plotCoords.length - 1].y}
                r="3"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1"
              />
            )}

            {plotCoords.map((pt, idx) => {
              if (idx % Math.ceil(plotCoords.length / 5) !== 0 && idx !== plotCoords.length - 1) return null
              return (
                <text
                  key={idx}
                  x={pt.x}
                  y={viewH - 12}
                  textAnchor={idx === 0 ? 'start' : idx === plotCoords.length - 1 ? 'end' : 'middle'}
                  className="fill-slate-400 dark:fill-slate-500 text-[10px]"
                >
                  {pt.data.label}
                </text>
              )
            })}
          </svg>
        </div>
      )}

      {/* 4. Terminal Metric Footer Strip: Backed strictly by real user metrics or '--' */}
      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-[#182235] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div>
          <span>PROFIT FACTOR:</span>{' '}
          <span className="text-slate-800 dark:text-slate-300 font-semibold">
            {profitFactor != null ? profitFactor.toFixed(2) : '--'}
          </span>
        </div>
        <div>
          <span>MAX DRAWDOWN:</span>{' '}
          <span className="text-slate-800 dark:text-slate-300 font-semibold">
            {maxDrawdown != null ? `${maxDrawdown.toFixed(2)}%` : '--'}
          </span>
        </div>
        <div>
          <span>SHARPE RATIO:</span>{' '}
          <span className="text-slate-800 dark:text-slate-300 font-semibold">
            {sharpeRatio != null ? sharpeRatio.toFixed(2) : '--'}
          </span>
        </div>
        <div>
          <span>WIN RATE:</span>{' '}
          <span className="text-slate-800 dark:text-slate-300 font-semibold">
            {winRate != null ? `${(winRate * 100).toFixed(1)}%` : '--'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PerformanceChart
