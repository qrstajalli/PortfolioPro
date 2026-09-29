import React, { useState, useMemo, useRef } from 'react'
import { TrendingUp } from 'lucide-react'

type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'

interface DataPoint {
  label: string
  fullDate?: string
  value: number
  nifty: number
}

export const PerformanceChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M')
  const [showBenchmark, setShowBenchmark] = useState(true)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // High-fidelity, deterministic portfolio equity data with realistic market dynamics:
  // pullbacks, consolidation ranges, breakout legs, and recoveries.
  const dataMap: Record<Timeframe, DataPoint[]> = useMemo(
    () => ({
      // Intraday (09:15 - 15:30 IST)
      '1D': [
        { label: '09:15', fullDate: 'Today, 09:15 IST', value: 122850.0, nifty: 24730.8 },
        { label: '09:30', fullDate: 'Today, 09:30 IST', value: 123140.0, nifty: 24755.0 },
        { label: '09:45', fullDate: 'Today, 09:45 IST', value: 123480.0, nifty: 24792.0 },
        { label: '10:00', fullDate: 'Today, 10:00 IST', value: 123210.0, nifty: 24768.0 },
        { label: '10:15', fullDate: 'Today, 10:15 IST', value: 122960.0, nifty: 24745.0 },
        { label: '10:30', fullDate: 'Today, 10:30 IST', value: 123280.0, nifty: 24772.0 },
        { label: '10:45', fullDate: 'Today, 10:45 IST', value: 123610.0, nifty: 24805.0 },
        { label: '11:00', fullDate: 'Today, 11:00 IST', value: 123490.0, nifty: 24790.0 },
        { label: '11:15', fullDate: 'Today, 11:15 IST', value: 123320.0, nifty: 24775.0 },
        { label: '11:30', fullDate: 'Today, 11:30 IST', value: 123180.0, nifty: 24760.0 },
        { label: '11:45', fullDate: 'Today, 11:45 IST', value: 123390.0, nifty: 24782.0 },
        { label: '12:00', fullDate: 'Today, 12:00 IST', value: 123270.0, nifty: 24770.0 },
        { label: '12:15', fullDate: 'Today, 12:15 IST', value: 123210.0, nifty: 24765.0 },
        { label: '12:30', fullDate: 'Today, 12:30 IST', value: 123340.0, nifty: 24778.0 },
        { label: '12:45', fullDate: 'Today, 12:45 IST', value: 123510.0, nifty: 24795.0 },
        { label: '13:00', fullDate: 'Today, 13:00 IST', value: 123420.0, nifty: 24785.0 },
        { label: '13:15', fullDate: 'Today, 13:15 IST', value: 123680.0, nifty: 24810.0 },
        { label: '13:30', fullDate: 'Today, 13:30 IST', value: 123560.0, nifty: 24798.0 },
        { label: '13:45', fullDate: 'Today, 13:45 IST', value: 123840.0, nifty: 24822.0 },
        { label: '14:00', fullDate: 'Today, 14:00 IST', value: 123980.0, nifty: 24832.0 },
        { label: '14:15', fullDate: 'Today, 14:15 IST', value: 123760.0, nifty: 24815.0 },
        { label: '14:30', fullDate: 'Today, 14:30 IST', value: 123920.0, nifty: 24828.0 },
        { label: '14:45', fullDate: 'Today, 14:45 IST', value: 124140.0, nifty: 24840.0 },
        { label: '15:00', fullDate: 'Today, 15:00 IST', value: 124050.0, nifty: 24825.0 },
        { label: '15:15', fullDate: 'Today, 15:15 IST', value: 124270.0, nifty: 24832.0 },
        { label: '15:30', fullDate: 'Today, 15:30 IST', value: 124325.0, nifty: 24835.1 },
      ],

      // 1 Week (5 sessions with multi-session swing points)
      '1W': [
        { label: 'Mon 09:30', fullDate: '22 Sep, 09:30', value: 120800.0, nifty: 24610 },
        { label: 'Mon 13:00', fullDate: '22 Sep, 13:00', value: 121450.0, nifty: 24650 },
        { label: 'Mon 15:30', fullDate: '22 Sep, 15:30', value: 121280.0, nifty: 24635 },
        { label: 'Tue 09:30', fullDate: '23 Sep, 09:30', value: 121720.0, nifty: 24670 },
        { label: 'Tue 13:00', fullDate: '23 Sep, 13:00', value: 122300.0, nifty: 24715 },
        { label: 'Tue 15:30', fullDate: '23 Sep, 15:30', value: 121950.0, nifty: 24685 },
        { label: 'Wed 09:30', fullDate: '24 Sep, 09:30', value: 121400.0, nifty: 24640 },
        { label: 'Wed 13:00', fullDate: '24 Sep, 13:00', value: 121850.0, nifty: 24680 },
        { label: 'Wed 15:30', fullDate: '24 Sep, 15:30', value: 122150.0, nifty: 24705 },
        { label: 'Thu 09:30', fullDate: '25 Sep, 09:30', value: 122600.0, nifty: 24740 },
        { label: 'Thu 13:00', fullDate: '25 Sep, 13:00', value: 122280.0, nifty: 24710 },
        { label: 'Thu 15:30', fullDate: '25 Sep, 15:30', value: 122850.0, nifty: 24750 },
        { label: 'Fri 09:30', fullDate: '26 Sep, 09:30', value: 123400.0, nifty: 24795 },
        { label: 'Fri 13:00', fullDate: '26 Sep, 13:00', value: 123950.0, nifty: 24820 },
        { label: 'Fri 15:30', fullDate: '26 Sep, 15:30', value: 124325.0, nifty: 24835 },
      ],

      // 1 Month (Daily progression over 30 days)
      '1M': [
        { label: '1 Sep', fullDate: '1 Sep 2026', value: 115800.0, nifty: 24150 },
        { label: '3 Sep', fullDate: '3 Sep 2026', value: 116900.0, nifty: 24220 },
        { label: '5 Sep', fullDate: '5 Sep 2026', value: 117600.0, nifty: 24290 },
        { label: '7 Sep', fullDate: '7 Sep 2026', value: 118450.0, nifty: 24350 },
        { label: '9 Sep', fullDate: '9 Sep 2026', value: 117900.0, nifty: 24310 },
        { label: '11 Sep', fullDate: '11 Sep 2026', value: 117200.0, nifty: 24240 },
        { label: '13 Sep', fullDate: '13 Sep 2026', value: 118100.0, nifty: 24330 },
        { label: '15 Sep', fullDate: '15 Sep 2026', value: 119500.0, nifty: 24420 },
        { label: '17 Sep', fullDate: '17 Sep 2026', value: 120400.0, nifty: 24510 },
        { label: '19 Sep', fullDate: '19 Sep 2026', value: 119850.0, nifty: 24460 },
        { label: '21 Sep', fullDate: '21 Sep 2026', value: 120650.0, nifty: 24530 },
        { label: '23 Sep', fullDate: '23 Sep 2026', value: 121900.0, nifty: 24650 },
        { label: '25 Sep', fullDate: '25 Sep 2026', value: 122850.0, nifty: 24740 },
        { label: '27 Sep', fullDate: '27 Sep 2026', value: 123700.0, nifty: 24800 },
        { label: '28 Sep', fullDate: '28 Sep 2026', value: 124325.0, nifty: 24835 },
      ],

      // 3 Months (Multi-week progression over Jul, Aug, Sep)
      '3M': [
        { label: '1 Jul', fullDate: '1 Jul 2026', value: 111400.0, nifty: 23820 },
        { label: '8 Jul', fullDate: '8 Jul 2026', value: 113200.0, nifty: 23980 },
        { label: '15 Jul', fullDate: '15 Jul 2026', value: 115600.0, nifty: 24150 },
        { label: '22 Jul', fullDate: '22 Jul 2026', value: 116800.0, nifty: 24240 },
        { label: '29 Jul', fullDate: '29 Jul 2026', value: 115200.0, nifty: 24110 },
        { label: '5 Aug', fullDate: '5 Aug 2026', value: 114100.0, nifty: 24020 },
        { label: '12 Aug', fullDate: '12 Aug 2026', value: 116700.0, nifty: 24210 },
        { label: '19 Aug', fullDate: '19 Aug 2026', value: 118900.0, nifty: 24390 },
        { label: '26 Aug', fullDate: '26 Aug 2026', value: 118100.0, nifty: 24320 },
        { label: '2 Sep', fullDate: '2 Sep 2026', value: 119800.0, nifty: 24450 },
        { label: '9 Sep', fullDate: '9 Sep 2026', value: 118950.0, nifty: 24370 },
        { label: '16 Sep', fullDate: '16 Sep 2026', value: 121100.0, nifty: 24550 },
        { label: '23 Sep', fullDate: '23 Sep 2026', value: 122850.0, nifty: 24710 },
        { label: '28 Sep', fullDate: '28 Sep 2026', value: 124325.0, nifty: 24835 },
      ],

      // 1 Year (Bi-weekly progression over 12 months)
      '1Y': [
        { label: 'Oct \'25', fullDate: 'Oct 2025', value: 104200.0, nifty: 22400 },
        { label: 'Nov \'25', fullDate: 'Nov 2025', value: 106800.0, nifty: 22650 },
        { label: 'Dec \'25', fullDate: 'Dec 2025', value: 105400.0, nifty: 22520 },
        { label: 'Jan \'26', fullDate: 'Jan 2026', value: 108900.0, nifty: 22900 },
        { label: 'Feb \'26', fullDate: 'Feb 2026', value: 111500.0, nifty: 23150 },
        { label: 'Mar \'26', fullDate: 'Mar 2026', value: 109800.0, nifty: 23010 },
        { label: 'Apr \'26', fullDate: 'Apr 2026', value: 113400.0, nifty: 23420 },
        { label: 'May \'26', fullDate: 'May 2026', value: 116200.0, nifty: 23780 },
        { label: 'Jun \'26', fullDate: 'Jun 2026', value: 114800.0, nifty: 23610 },
        { label: 'Jul \'26', fullDate: 'Jul 2026', value: 117900.0, nifty: 24150 },
        { label: 'Aug \'26', fullDate: 'Aug 2026', value: 120500.0, nifty: 24390 },
        { label: 'Sep \'26', fullDate: 'Sep 2026', value: 124325.0, nifty: 24835 },
      ],

      // ALL (Inception to present)
      'ALL': [
        { label: '2024 Q2', fullDate: 'Apr 2024', value: 92000.0, nifty: 21800 },
        { label: '2024 Q3', fullDate: 'Jul 2024', value: 98500.0, nifty: 22400 },
        { label: '2024 Q4', fullDate: 'Oct 2024', value: 96200.0, nifty: 22150 },
        { label: '2025 Q1', fullDate: 'Jan 2025', value: 104500.0, nifty: 22900 },
        { label: '2025 Q2', fullDate: 'Apr 2025', value: 109200.0, nifty: 23400 },
        { label: '2025 Q3', fullDate: 'Jul 2025', value: 113800.0, nifty: 23900 },
        { label: '2025 Q4', fullDate: 'Oct 2025', value: 111900.0, nifty: 23650 },
        { label: '2026 Q1', fullDate: 'Jan 2026', value: 117400.0, nifty: 24200 },
        { label: '2026 Q2', fullDate: 'Apr 2026', value: 120800.0, nifty: 24500 },
        { label: '2026 Q3', fullDate: 'Sep 2026', value: 124325.0, nifty: 24835 },
      ],
    }),
    []
  )

  const currentData = dataMap[timeframe]

  // Chart layout dimensions (standard widescreen viewBox)
  const viewW = 860
  const viewH = 240
  const padLeft = 70
  const padRight = 24
  const padTop = 18
  const padBottom = 32
  const plotW = viewW - padLeft - padRight
  const plotH = viewH - padTop - padBottom

  // Domain scaling with 6% headroom so line never clips the edges
  const rawValues = currentData.map((d) => d.value)
  const rawMin = Math.min(...rawValues)
  const rawMax = Math.max(...rawValues)
  const rawSpan = rawMax - rawMin || 1
  const domainMin = rawMin - rawSpan * 0.06
  const domainMax = rawMax + rawSpan * 0.06
  const domainRange = domainMax - domainMin

  // Coordinate mapping for portfolio curve
  const plotCoords = useMemo(() => {
    const n = currentData.length
    return currentData.map((d, i) => {
      const x = padLeft + (i / (n - 1)) * plotW
      const y = padTop + plotH - ((d.value - domainMin) / domainRange) * plotH
      return { x, y, data: d }
    })
  }, [currentData, domainMin, domainRange, plotW, plotH, padLeft, padTop])

  // Coordinate mapping for benchmark (NIFTY 50 normalized to start at same relative height)
  const benchmarkCoords = useMemo(() => {
    const n = currentData.length
    const startNifty = currentData[0].nifty
    const startPortfolio = currentData[0].value

    return currentData.map((d, i) => {
      const x = padLeft + (i / (n - 1)) * plotW
      const niftyPct = (d.nifty - startNifty) / startNifty
      const simulatedNiftyValue = startPortfolio * (1 + niftyPct)
      const y = padTop + plotH - ((simulatedNiftyValue - domainMin) / domainRange) * plotH
      return { x, y }
    })
  }, [currentData, domainMin, domainRange, plotW, plotH, padLeft, padTop])

  // Smooth SVG path generation using restrained cubic bezier control points
  const { lineD, areaD } = useMemo(() => {
    if (plotCoords.length === 0) return { lineD: '', areaD: '' }

    let path = `M ${plotCoords[0].x.toFixed(1)} ${plotCoords[0].y.toFixed(1)}`

    for (let i = 0; i < plotCoords.length - 1; i++) {
      const p0 = i > 0 ? plotCoords[i - 1] : plotCoords[i]
      const p1 = plotCoords[i]
      const p2 = plotCoords[i + 1]
      const p3 = i !== plotCoords.length - 2 ? plotCoords[i + 2] : p2

      // Subtle tension (0.18) ensures natural curves without wild peaks or exaggerated loops
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

  // Benchmark smooth path
  const benchmarkD = useMemo(() => {
    if (benchmarkCoords.length === 0) return ''
    return benchmarkCoords
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
      .join(' ')
  }, [benchmarkCoords])

  // Y-axis gridline levels (4 clean reference steps)
  const yAxisLevels = useMemo(() => {
    const steps = [0.0, 0.33, 0.67, 1.0]
    return steps.map((pct) => {
      const val = domainMax - pct * domainRange
      const y = padTop + pct * plotH
      return { y, val }
    })
  }, [domainMax, domainRange, padTop, plotH])

  // X-axis evenly spaced time labels (5-6 points max to avoid crowding)
  const xAxisLabels = useMemo(() => {
    const total = currentData.length
    if (total <= 6) {
      return plotCoords.map((pt, i) => ({
        x: pt.x,
        label: pt.data.label,
        align: i === 0 ? 'start' : i === total - 1 ? 'end' : 'middle',
      }))
    }
    const count = 5
    const step = (total - 1) / (count - 1)
    const indices = Array.from({ length: count }, (_, i) => Math.round(i * step))
    return indices.map((idx, i) => ({
      x: plotCoords[idx].x,
      label: plotCoords[idx].data.label,
      align: i === 0 ? 'start' : i === count - 1 ? 'end' : 'middle',
    }))
  }, [currentData, plotCoords])

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

  const handleMouseLeave = () => {
    setHoverIndex(null)
  }

  // Active highlighted point
  const activeIdx = hoverIndex !== null ? hoverIndex : currentData.length - 1
  const activeNode = plotCoords[activeIdx]
  const baseValue = currentData[0].value
  const netGain = activeNode.data.value - baseValue
  const netGainPct = baseValue > 0 ? (netGain / baseValue) * 100 : 0

  return (
    <div className="p-4 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs flex flex-col justify-between select-none transition-colors">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#182235]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Portfolio Equity Curve
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 font-semibold">
            {netGainPct >= 0 ? '+' : ''}
            {netGainPct.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Benchmark toggle */}
          <button
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded cursor-pointer transition-colors ${
              showBenchmark
                ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-600/15 dark:text-blue-400 dark:border-blue-500/30 font-medium'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span>NIFTY 50 Overlay</span>
          </button>

          {/* Timeframe Chips */}
          <div className="flex items-center p-0.5 rounded bg-slate-100 dark:bg-[#070b13] border border-slate-200 dark:border-[#1a253a]">
            {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf)
                  setHoverIndex(null)
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Live Value Readout Header */}
      <div className="flex items-baseline justify-between pt-3 pb-1 text-xs font-mono">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            ₹{activeNode.data.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span
            className={`text-xs font-semibold tabular-nums ${
              netGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {netGain >= 0 ? '+' : ''}₹
            {netGain.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (
            {netGain >= 0 ? '+' : ''}
            {netGainPct.toFixed(2)}%)
          </span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          Ref: <span className="text-slate-700 dark:text-slate-300 font-semibold">{activeNode.data.fullDate || activeNode.data.label}</span>
        </span>
      </div>

      {/* 3. Main Chart Canvas with clean Y-axis and X-axis */}
      <div className="relative w-full mt-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewW} ${viewH}`}
          className="w-full h-48 sm:h-56 lg:h-64 cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Subtle, restrained gradient fill */}
            <linearGradient id="proEquityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis ₹ Value Labels */}
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
                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono tabular-nums"
              >
                ₹{Math.round(lvl.val).toLocaleString('en-IN')}
              </text>
            </g>
          ))}

          {/* Bottom baseline line */}
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={viewW - padRight}
            y2={padTop + plotH}
            stroke="currentColor"
            className="text-slate-200 dark:text-[#1c273c]"
            strokeWidth="1"
          />

          {/* Area Fill */}
          <path d={areaD} fill="url(#proEquityGradient)" />

          {/* Benchmark line (NIFTY 50 subtle dashed overlay) */}
          {showBenchmark && (
            <path
              d={benchmarkD}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.3"
              strokeDasharray="3 3"
              opacity="0.65"
            />
          )}

          {/* Main Portfolio Equity Curve */}
          <path
            d={lineD}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active Hover Crosshair Line and Minimal Dot */}
          {hoverIndex !== null && activeNode && (
            <g>
              {/* Vertical Crosshair Guideline */}
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
              {/* Subtle tracking node (minimal, non-exaggerated) */}
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

          {/* Minimal live dot on the latest point when not hovering */}
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

          {/* X-Axis Timestamps */}
          {xAxisLabels.map((lbl, idx) => (
            <text
              key={idx}
              x={lbl.x}
              y={viewH - 12}
              textAnchor={lbl.align as 'start' | 'middle' | 'end'}
              className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
            >
              {lbl.label}
            </text>
          ))}
        </svg>
      </div>

      {/* 4. Terminal Metric Footer Strip */}
      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-[#182235] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <div>
          <span>PROFIT FACTOR:</span>{' '}
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">3.42</span>
        </div>
        <div>
          <span>MAX DRAWDOWN:</span>{' '}
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">-1.24%</span>
        </div>
        <div>
          <span>SHARPE RATIO:</span>{' '}
          <span className="text-slate-800 dark:text-slate-300 font-semibold">2.18</span>
        </div>
        <div>
          <span>WIN RATE:</span>{' '}
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">75.0% (3/4)</span>
        </div>
      </div>
    </div>
  )
}

export default PerformanceChart
