import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  CrosshairMode,
  ColorType,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts'
import {
  Loader2,
  AlertCircle,
  Maximize2,
  Layers,
} from 'lucide-react'
import type { StockQuote, StockHistory } from '../../types/auth'
import marketService from '../../services/marketService'

export type ChartTimeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL'

interface HistoricalPriceChartProps {
  stock: StockQuote
  onTimeframeChange?: (tf: ChartTimeframe) => void
  onOpenFullChart?: () => void
}

interface HoveredCandleData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  changePercent: number
  isGain: boolean
}

export const HistoricalPriceChart: React.FC<HistoricalPriceChartProps> = ({ stock, onOpenFullChart }) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('1M')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<StockHistory | null>(null)
  const [hoveredCandle, setHoveredCandle] = useState<HoveredCandleData | null>(null)
  const [latestCandle, setLatestCandle] = useState<HoveredCandleData | null>(null)

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const isUSD = stock.currency === 'USD' || stock.exchange === 'NASDAQ'
  const currentPrice = Number(stock.currentPrice || stock.price || 0)

  const formatCurrency = useCallback(
    (val: number) => {
      const sym = isUSD ? '$' : '₹'
      const locale = isUSD ? 'en-US' : 'en-IN'
      return `${sym}${Number(val).toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    },
    [isUSD]
  )

  const formatVolume = (val: number) => {
    if (!val || val <= 0) return '0'
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`
    return val.toLocaleString()
  }

  // 1. Fetch real historical candles from backend for selected timeframe
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    marketService
      .getHistory(stock.symbol, timeframe)
      .then((data) => {
        if (!isMounted) return
        if (!data || !data.candles || data.candles.length === 0) {
          setError(`No historical market data available for ${stock.symbol} (${timeframe})`)
          setHistory(null)
        } else {
          setHistory(data)
          setError(null)
        }
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        const msg =
          err.response?.data?.message ||
          'Historical market data temporarily unavailable from provider'
        setError(msg)
        setHistory(null)
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [stock.symbol, timeframe])

  // 2. Initialize Lightweight Chart instance
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Detect dark mode
    const isDark = document.documentElement.classList.contains('dark')

    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#94a3b8' : '#64748b',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
      },
      grid: {
        vertLines: { color: isDark ? '#151e30' : '#f1f5f9', style: LineStyle.SparseDotted },
        horzLines: { color: isDark ? '#151e30' : '#f1f5f9', style: LineStyle.SparseDotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#3b82f6',
          width: 1 as const,
          style: LineStyle.Dashed,
          labelBackgroundColor: isDark ? '#1e293b' : '#334155',
        },
        horzLine: {
          color: '#3b82f6',
          width: 1 as const,
          style: LineStyle.Dashed,
          labelBackgroundColor: isDark ? '#1e293b' : '#334155',
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.22, // Reserve lower 22% for volume bars
        },
        alignLabels: true,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: timeframe === '1D' || timeframe === '1W',
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
        minBarSpacing: 2,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    }

    const chart = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: 420,
    })

    // Candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    })

    // Volume histogram series (overlay on bottom margin)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Set as overlay
    })

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // volume bars occupy bottom 20%
        bottom: 0,
      },
    })

    chartRef.current = chart
    candleSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    // Crosshair movement subscription for live HUD stats
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData || !candlestickSeries) {
        setHoveredCandle(null)
        return
      }

      const candleData = param.seriesData.get(candlestickSeries) as
        | { open: number; high: number; low: number; close: number }
        | undefined

      const volData = param.seriesData.get(volumeSeries) as { value: number } | undefined

      if (candleData && typeof candleData.open === 'number') {
        const o = candleData.open
        const h = candleData.high
        const l = candleData.low
        const c = candleData.close
        const v = volData?.value || 0
        const chg = c - o
        const chgPct = o > 0 ? (chg / o) * 100 : 0

        let timeStr = String(param.time)
        if (typeof param.time === 'number') {
          const d = new Date(param.time * 1000)
          timeStr = d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: timeframe === '1D' || timeframe === '1W' ? '2-digit' : undefined,
            minute: timeframe === '1D' || timeframe === '1W' ? '2-digit' : undefined,
          })
        }

        setHoveredCandle({
          time: timeStr,
          open: o,
          high: h,
          low: l,
          close: c,
          volume: v,
          change: chg,
          changePercent: chgPct,
          isGain: chg >= 0,
        })
      } else {
        setHoveredCandle(null)
      }
    })

    // ResizeObserver for responsive chart auto-fitting
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !chartRef.current) return
      const { width } = entries[0].contentRect
      if (width > 0) {
        chartRef.current.applyOptions({ width })
      }
    })

    resizeObserver.observe(chartContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
    }
  }, [timeframe])

  // 3. Populate chart with real OHLCV candles
  useEffect(() => {
    if (!history?.candles || history.candles.length === 0) return
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !chartRef.current) return

    // Sort chronologically and deduplicate timestamps
    const rawCandles = [...history.candles].sort((a, b) => {
      const aTime = a.timestamp || new Date(a.date.replace(' ', 'T')).getTime() / 1000
      const bTime = b.timestamp || new Date(b.date.replace(' ', 'T')).getTime() / 1000
      return aTime - bTime
    })

    const seenTimes = new Set<string>()
    const candleDataList: CandlestickData<Time>[] = []
    const volumeDataList: HistogramData<Time>[] = []

    for (const c of rawCandles) {
      const open = Number(c.open)
      const high = Number(c.high)
      const low = Number(c.low)
      const close = Number(c.close)
      const volume = Number(c.volume || 0)

      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close) || open <= 0) {
        continue
      }

      // If intraday (has space in date string or timeframe 1D/1W), use epoch seconds; else use 'YYYY-MM-DD'
      let timeKey: Time
      if (c.date.includes(' ') || timeframe === '1D' || timeframe === '1W') {
        const epochSec = c.timestamp
          ? c.timestamp
          : Math.floor(new Date(c.date.replace(' ', 'T') + 'Z').getTime() / 1000)
        timeKey = epochSec as UTCTimestamp
      } else {
        timeKey = c.date.slice(0, 10)
      }

      const dedupeKey = String(timeKey)
      if (seenTimes.has(dedupeKey)) continue
      seenTimes.add(dedupeKey)

      const isUp = close >= open

      candleDataList.push({
        time: timeKey,
        open,
        high,
        low,
        close,
      })

      volumeDataList.push({
        time: timeKey,
        value: volume,
        color: isUp ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.45)',
      })
    }

    if (candleDataList.length > 0) {
      candleSeriesRef.current.setData(candleDataList)
      volumeSeriesRef.current.setData(volumeDataList)
      chartRef.current.timeScale().fitContent()

      // Set default latest candle HUD
      const last = candleDataList[candleDataList.length - 1]
      const lastVol = volumeDataList[volumeDataList.length - 1]?.value || 0
      const chg = last.close - last.open
      const chgPct = last.open > 0 ? (chg / last.open) * 100 : 0

      setLatestCandle({
        time: String(last.time),
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close,
        volume: lastVol,
        change: chg,
        changePercent: chgPct,
        isGain: chg >= 0,
      })
    }
  }, [history, timeframe])

  // Fit content helper
  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }

  const activeHud = hoveredCandle || latestCandle

  return (
    <div className="rounded-lg border border-slate-200 dark:border-[#182338] bg-white dark:bg-[#0c1220] shadow-sm select-none font-mono overflow-hidden">
      {/* 1. Header Toolbar: Real Timeframe Selector & Chart Actions */}
      <div className="p-3 border-b border-slate-200 dark:border-[#162033] flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#0a0f1d]">
        {/* Left: Timeframe Buttons */}
        <div className="flex items-center gap-1">
          <div className="flex items-center p-0.5 rounded-md bg-slate-200/70 dark:bg-[#121a2c] border border-slate-300/50 dark:border-[#1e2a42]">
            {(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-[11px] rounded transition-all cursor-pointer font-bold ${
                  timeframe === tf
                    ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title={`View ${tf} historical timeframe`}
              >
                {tf}
              </button>
            ))}
          </div>

          <span className="hidden sm:inline-block text-[11px] text-slate-500 dark:text-slate-400 pl-2">
            Twelve Data Real OHLCV Feed
          </span>
        </div>

        {/* Right: Chart Controls, Full Chart & Fit Button */}
        <div className="flex items-center gap-2">
          {onOpenFullChart && (
            <button
              onClick={onOpenFullChart}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer transition-colors"
              title="Open Dedicated Full-Screen Trading Terminal"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Full Chart</span>
            </button>
          )}

          <button
            onClick={handleResetZoom}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded bg-white dark:bg-[#141d30] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e2c45] shadow-xs cursor-pointer transition-colors"
            title="Fit / Reset Zoom to all available historical candles"
          >
            <Maximize2 className="h-3 w-3 text-blue-500" />
            <span>Fit Content</span>
          </button>

          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-[#121a2c] border border-slate-200 dark:border-[#1e2a42] text-[10px] text-slate-500 dark:text-slate-400">
            <Layers className="h-3 w-3 text-emerald-500" />
            <span>Candles + Vol</span>
          </div>
        </div>
      </div>

      {/* 2. Professional Candle OHLC HUD Bar */}
      <div className="px-3.5 py-2 border-b border-slate-100 dark:border-[#141d2f] bg-slate-50/40 dark:bg-[#0b101e] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Selected / Latest Candle Metrics */}
        {activeHud ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="text-slate-900 dark:text-white font-bold">{activeHud.time}</span>
            <span>
              O: <strong className="text-slate-800 dark:text-slate-100 font-semibold">{formatCurrency(activeHud.open)}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(activeHud.high)}</strong>
            </span>
            <span>
              L: <strong className="text-rose-600 dark:text-rose-400 font-semibold">{formatCurrency(activeHud.low)}</strong>
            </span>
            <span>
              C: <strong className="text-slate-900 dark:text-white font-bold">{formatCurrency(activeHud.close)}</strong>
            </span>
            <span
              className={`font-bold flex items-center gap-0.5 ${
                activeHud.isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {activeHud.isGain ? '+' : ''}
              {formatCurrency(activeHud.change)} ({activeHud.isGain ? '+' : ''}
              {activeHud.changePercent.toFixed(2)}%)
            </span>
            <span>
              Vol: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{formatVolume(activeHud.volume)}</strong>
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 italic">
            Hover over chart candles to inspect historical OHLCV data
          </div>
        )}

        {/* Currency & Interaction Guidance */}
        <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-500">
          <span>Currency: <strong className="text-slate-700 dark:text-slate-300">{isUSD ? 'USD ($)' : 'INR (₹)'}</strong></span>
          <span>•</span>
          <span>Mouse Wheel: Zoom</span>
          <span>•</span>
          <span>Drag: Pan</span>
        </div>
      </div>

      {/* 3. Main Chart Canvas Area */}
      <div className="relative min-h-[420px] bg-white dark:bg-[#0c1220] flex items-center justify-center">
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-white/70 dark:bg-[#0c1220]/80 backdrop-blur-xs text-xs text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Loading {timeframe} real historical data from Twelve Data...
            </span>
          </div>
        )}

        {/* Error Overlay */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-2 text-slate-500 text-xs py-20 px-4 text-center max-w-md">
            <AlertCircle className="h-7 w-7 text-amber-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Historical market data unavailable
            </span>
            <span className="text-[11px] text-slate-500">{error}</span>
          </div>
        )}

        {/* TradingView Lightweight Charts DOM Canvas Mount */}
        <div
          ref={chartContainerRef}
          className={`w-full h-[420px] ${!error ? 'block' : 'hidden'}`}
        />
      </div>

      {/* 4. Chart Footer Summary Statistics */}
      <div className="p-3 border-t border-slate-200 dark:border-[#162033] bg-slate-50 dark:bg-[#0a0f1d] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Timeframe Range</span>
          <div className="font-bold text-slate-900 dark:text-white mt-0.5">
            {timeframe} ({history?.candles?.length || 0} Candles)
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Exchange & Timezone</span>
          <div className="font-bold text-slate-900 dark:text-white mt-0.5">
            {history?.exchange || stock.exchange} ({history?.timeZone || 'America/New_York'})
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Latest Session Close</span>
          <div className="font-bold text-slate-900 dark:text-white mt-0.5">
            {latestCandle ? formatCurrency(latestCandle.close) : formatCurrency(currentPrice)}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Provider Status</span>
          <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Twelve Data Authenticated
          </div>
        </div>
      </div>
    </div>
  )
}

export default HistoricalPriceChart
