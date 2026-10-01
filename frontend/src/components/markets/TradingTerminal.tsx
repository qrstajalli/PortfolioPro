import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  CrosshairMode,
  ColorType,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type LineData,
  type AreaData,
  type BarData,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts'
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Minus,
  MoveVertical,
  Square,
  Type,
  Ruler,
  BarChart2,
  LineChart,
  Sliders,
  Search,
  X,
  ChevronDown,
  Check,
  Clock,
  Activity,
  Layers,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Info,
} from 'lucide-react'
import type { StockQuote, StockHistory, Holding } from '../../types/auth'
import marketService from '../../services/marketService'
import tradeService from '../../services/tradeService'
import portfolioService from '../../services/portfolioService'
import { useAuth } from '../../context/AuthContext'

export type TerminalTimeframe = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'ALL'
export type ChartType = 'candles' | 'bars' | 'line' | 'area'
export type DrawingTool = 'crosshair' | 'trendline' | 'horizontal' | 'vertical' | 'rectangle' | 'text' | 'measure'

interface TradingTerminalProps {
  stock: StockQuote
  onBack: () => void
}

interface HoveredCandleHUD {
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

// Preset watchlists matching specifications
const WATCHLIST_SECTIONS = {
  INDEXES: [
    { symbol: 'SPY', name: 'S&P 500 ETF' },
    { symbol: 'QQQ', name: 'NASDAQ 100 ETF' },
    { symbol: 'DIA', name: 'Dow Jones ETF' },
    { symbol: 'IWM', name: 'Russell 2000 ETF' },
  ],
  STOCKS: [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
  ],
  FOREX: [
    { symbol: 'EUR/USD', name: 'Euro / US Dollar' },
    { symbol: 'GBP/USD', name: 'British Pound / USD' },
    { symbol: 'USD/JPY', name: 'USD / Japanese Yen' },
    { symbol: 'USD/INR', name: 'USD / Indian Rupee' },
  ],
}

export const TradingTerminal: React.FC<TradingTerminalProps> = ({ stock: initialStock, onBack }) => {
  const { wallet, refreshWallet } = useAuth()

  // 1. Current active symbol & quote
  const [activeStock, setActiveStock] = useState<StockQuote>(initialStock)
  const [activeTimeframe, setActiveTimeframe] = useState<TerminalTimeframe>('1M')
  const [chartType, setChartType] = useState<ChartType>('candles')
  const [activeTool, setActiveTool] = useState<DrawingTool>('crosshair')
  const [toolFeedback, setToolFeedback] = useState<string | null>(null)

  // Indicators toggle
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false)
  const [indicators, setIndicators] = useState({
    sma20: false,
    ema50: false,
    volMa: true,
  })

  // Compare dropdown
  const [showCompareMenu, setShowCompareMenu] = useState(false)

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Right panel toggle: 'watchlist' or 'trade'
  const [rightPanelTab, setRightPanelTab] = useState<'watchlist' | 'trade'>('watchlist')
  const [isTradeTicketOpen, setIsTradeTicketOpen] = useState(false)

  // Chart data state
  const [chartLoading, setChartLoading] = useState(false)
  const [chartError, setChartError] = useState<string | null>(null)
  const [history, setHistory] = useState<StockHistory | null>(null)
  const [hoveredData, setHoveredData] = useState<HoveredCandleHUD | null>(null)
  const [latestCandle, setLatestCandle] = useState<HoveredCandleHUD | null>(null)

  // Watchlist state & cache
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, StockQuote>>({})
  const [watchlistFilter, setWatchlistFilter] = useState('')

  // Paper Trading state
  const [userHoldings, setUserHoldings] = useState<Holding[]>([])
  const [tradeSide, setTradeSide] = useState<'BUY' | 'SELL'>('BUY')
  const [tradeQuantity, setTradeQuantity] = useState<number>(1)
  const [tradeOrderType, setTradeOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET')
  const [tradeLimitPrice, setTradeLimitPrice] = useState<string>('')
  const [tradeSubmitting, setTradeSubmitting] = useState(false)
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // DOM Refs for Lightweight Charts
  const terminalRootRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<IChartApi | null>(null)
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  // Currency & formatting helpers
  const isUSD = activeStock.currency === 'USD' || activeStock.exchange === 'NASDAQ' || activeStock.exchange === 'NYSE' || activeStock.symbol.includes('/')
  const currentPrice = Number(activeStock.currentPrice || activeStock.price || 0)
  const changeAmount = Number(activeStock.changeAmount || activeStock.change || 0)
  const changePercent = Number(activeStock.changePercent || 0)
  const isPositive = (activeStock.changeAmount ?? activeStock.change ?? 0) >= 0

  const formatPrice = useCallback(
    (val: number) => {
      const sym = isUSD ? '$' : '₹'
      const digits = activeStock.symbol.includes('/') ? 4 : 2
      return `${sym}${Number(val).toLocaleString(isUSD ? 'en-US' : 'en-IN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })}`
    },
    [isUSD, activeStock.symbol]
  )

  const formatVolume = (val: number) => {
    if (!val || val <= 0) return '0'
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`
    return val.toLocaleString()
  }

  // Load User Portfolio Holdings for paper trading validation
  const fetchHoldings = useCallback(async () => {
    try {
      const p = await portfolioService.getPortfolio()
      if (p && p.holdings) {
        setUserHoldings(p.holdings)
      }
    } catch (err) {
      console.warn('Could not load portfolio holdings:', err)
    }
  }, [])

  useEffect(() => {
    fetchHoldings()
  }, [fetchHoldings])

  // Get owned shares for current symbol
  const currentHolding = useMemo(() => {
    return userHoldings.find((h) => h.symbol.toUpperCase() === activeStock.symbol.toUpperCase())
  }, [userHoldings, activeStock.symbol])

  const ownedQuantity = currentHolding ? currentHolding.quantity : 0

  // 2. Fetch real active quote when symbol changes
  useEffect(() => {
    let isMounted = true
    marketService
      .getQuote(activeStock.symbol)
      .then((fresh) => {
        if (isMounted && fresh && fresh.currentPrice) {
          setActiveStock(fresh)
        }
      })
      .catch((err) => {
        console.warn('Failed to refresh quote for', activeStock.symbol, err)
      })

    return () => {
      isMounted = false
    }
  }, [activeStock.symbol])

  // 3. Batch load watchlist real quotes
  useEffect(() => {
    let isMounted = true
    const allSymbols = [
      ...WATCHLIST_SECTIONS.INDEXES.map((i) => i.symbol),
      ...WATCHLIST_SECTIONS.STOCKS.map((s) => s.symbol),
      ...WATCHLIST_SECTIONS.FOREX.map((f) => f.symbol),
    ]

    // Fetch in parallel chunks
    allSymbols.forEach((sym) => {
      marketService
        .getQuote(sym)
        .then((q) => {
          if (isMounted && q && q.currentPrice) {
            setWatchlistQuotes((prev) => ({ ...prev, [sym]: q }))
          }
        })
        .catch(() => {
          // Keep as unavailable
        })
    })

    return () => {
      isMounted = false
    }
  }, [])

  // 4. Fetch Real Twelve Data Historical Candles for active symbol and timeframe
  useEffect(() => {
    let isMounted = true
    setChartLoading(true)
    setChartError(null)

    marketService
      .getHistory(activeStock.symbol, activeTimeframe)
      .then((data) => {
        if (!isMounted) return
        if (!data || !data.candles || data.candles.length === 0) {
          setChartError(`No historical market data available for ${activeStock.symbol} (${activeTimeframe})`)
          setHistory(null)
        } else {
          setHistory(data)
          setChartError(null)
        }
        setChartLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setChartError(err.message || 'Unable to retrieve historical market data')
        setHistory(null)
        setChartLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [activeStock.symbol, activeTimeframe])

  // 5. Build and render Lightweight Charts instance
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Clean up previous instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove()
      chartInstanceRef.current = null
      mainSeriesRef.current = null
      volumeSeriesRef.current = null
      sma20SeriesRef.current = null
      ema50SeriesRef.current = null
    }

    const container = chartContainerRef.current
    const width = container.clientWidth || 800
    const height = container.clientHeight || 550

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#0b0e14' },
        textColor: '#787b86',
        fontSize: 11,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
      },
      grid: {
        vertLines: { color: '#171b26', style: LineStyle.Solid },
        horzLines: { color: '#171b26', style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#5d606b',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e222d',
        },
        horzLine: {
          color: '#5d606b',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e222d',
        },
      },
      rightPriceScale: {
        borderColor: '#1e222d',
        scaleMargins: { top: 0.1, bottom: 0.2 },
        autoScale: true,
      },
      timeScale: {
        borderColor: '#1e222d',
        timeVisible: activeTimeframe === '1D' || activeTimeframe === '5D',
        secondsVisible: false,
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
    })

    chartInstanceRef.current = chart

    // Add main price series based on chartType
    let mainSeries: ISeriesApi<any>
    if (chartType === 'line') {
      mainSeries = chart.addSeries(LineSeries, {
        color: '#2962ff',
        lineWidth: 2,
        priceFormat: { type: 'price', precision: activeStock.symbol.includes('/') ? 4 : 2, minMove: 0.01 },
      })
    } else if (chartType === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(41, 98, 255, 0.4)',
        bottomColor: 'rgba(41, 98, 255, 0.0)',
        lineColor: '#2962ff',
        lineWidth: 2,
        priceFormat: { type: 'price', precision: activeStock.symbol.includes('/') ? 4 : 2, minMove: 0.01 },
      })
    } else if (chartType === 'bars') {
      mainSeries = chart.addSeries(BarSeries, {
        upColor: '#089981',
        downColor: '#f23645',
        priceFormat: { type: 'price', precision: activeStock.symbol.includes('/') ? 4 : 2, minMove: 0.01 },
      })
    } else {
      // Default: Candlesticks
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#089981',
        downColor: '#f23645',
        borderVisible: false,
        wickUpColor: '#089981',
        wickDownColor: '#f23645',
        priceFormat: { type: 'price', precision: activeStock.symbol.includes('/') ? 4 : 2, minMove: 0.01 },
      })
    }
    mainSeriesRef.current = mainSeries

    // Add Volume Series overlay
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    })
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })
    volumeSeriesRef.current = volumeSeries

    // Optional SMA 20
    if (indicators.sma20) {
      const sma = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 1,
        title: 'SMA 20',
      })
      sma20SeriesRef.current = sma
    }

    // Optional EMA 50
    if (indicators.ema50) {
      const ema = chart.addSeries(LineSeries, {
        color: '#a855f7',
        lineWidth: 1,
        title: 'EMA 50',
      })
      ema50SeriesRef.current = ema
    }

    // Populate data if history is present
    if (history && history.candles && history.candles.length > 0) {
      const candleDataList: CandlestickData<Time>[] = []
      const volumeDataList: HistogramData<Time>[] = []
      const lineDataList: LineData<Time>[] = []
      const areaDataList: AreaData<Time>[] = []
      const barDataList: BarData<Time>[] = []

      // Deduplicate by time key
      const seenTimes = new Set<string>()

      for (const c of history.candles) {
        let timeKey: Time
        if (c.timestamp && (activeTimeframe === '1D' || activeTimeframe === '5D')) {
          timeKey = c.timestamp as UTCTimestamp
        } else {
          timeKey = c.date.substring(0, 10)
        }

        const stringKey = String(timeKey)
        if (seenTimes.has(stringKey)) continue
        seenTimes.add(stringKey)

        const open = Number(c.open)
        const high = Number(c.high)
        const low = Number(c.low)
        const close = Number(c.close)
        const volume = Number(c.volume || 0)
        const isUp = close >= open

        candleDataList.push({ time: timeKey, open, high, low, close })
        lineDataList.push({ time: timeKey, value: close })
        areaDataList.push({ time: timeKey, value: close })
        barDataList.push({ time: timeKey, open, high, low, close })

        volumeDataList.push({
          time: timeKey,
          value: volume,
          color: isUp ? 'rgba(8, 153, 129, 0.35)' : 'rgba(242, 54, 69, 0.35)',
        })
      }

      // Sort chronological
      candleDataList.sort((a, b) => String(a.time).localeCompare(String(b.time)))
      volumeDataList.sort((a, b) => String(a.time).localeCompare(String(b.time)))
      lineDataList.sort((a, b) => String(a.time).localeCompare(String(b.time)))
      areaDataList.sort((a, b) => String(a.time).localeCompare(String(b.time)))
      barDataList.sort((a, b) => String(a.time).localeCompare(String(b.time)))

      if (chartType === 'line') {
        mainSeries.setData(lineDataList)
      } else if (chartType === 'area') {
        mainSeries.setData(areaDataList)
      } else if (chartType === 'bars') {
        mainSeries.setData(barDataList)
      } else {
        mainSeries.setData(candleDataList)
      }

      volumeSeries.setData(volumeDataList)

      // Calculate SMA 20 if enabled
      if (indicators.sma20 && sma20SeriesRef.current) {
        const smaData: LineData<Time>[] = []
        for (let i = 19; i < lineDataList.length; i++) {
          const slice = lineDataList.slice(i - 19, i + 1)
          const avg = slice.reduce((sum, item) => sum + item.value, 0) / 20
          smaData.push({ time: lineDataList[i].time, value: avg })
        }
        sma20SeriesRef.current.setData(smaData)
      }

      // Calculate EMA 50 if enabled
      if (indicators.ema50 && ema50SeriesRef.current) {
        const emaData: LineData<Time>[] = []
        const k = 2 / (50 + 1)
        let prevEma = 0
        if (lineDataList.length >= 50) {
          // initial SMA
          prevEma = lineDataList.slice(0, 50).reduce((sum, item) => sum + item.value, 0) / 50
          emaData.push({ time: lineDataList[49].time, value: prevEma })
          for (let i = 50; i < lineDataList.length; i++) {
            const val = lineDataList[i].value * k + prevEma * (1 - k)
            emaData.push({ time: lineDataList[i].time, value: val })
            prevEma = val
          }
          ema50SeriesRef.current.setData(emaData)
        }
      }

      chart.timeScale().fitContent()

      // Set initial HUD values
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

    // Subscribe to crosshair movement
    chart.subscribeCrosshairMove((param) => {
      if (
        !param.point ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > container.clientHeight
      ) {
        setHoveredData(null)
        return
      }

      const candle = param.seriesData.get(mainSeries) as CandlestickData<Time> | LineData<Time> | AreaData<Time> | BarData<Time>
      const volume = param.seriesData.get(volumeSeries) as HistogramData<Time>

      if (candle) {
        let open = 0
        let high = 0
        let low = 0
        let close = 0

        if ('open' in candle) {
          open = candle.open
          high = candle.high
          low = candle.low
          close = candle.close
        } else if ('value' in candle) {
          open = candle.value
          high = candle.value
          low = candle.value
          close = candle.value
        }

        const volVal = volume?.value || 0
        const chg = close - open
        const chgPct = open > 0 ? (chg / open) * 100 : 0

        setHoveredData({
          time: String(param.time),
          open,
          high,
          low,
          close,
          volume: volVal,
          change: chg,
          changePercent: chgPct,
          isGain: chg >= 0,
        })
      }
    })

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return
      const { width: newW, height: newH } = entries[0].contentRect
      if (newW > 0 && newH > 0 && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({ width: newW, height: newH })
      }
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove()
        chartInstanceRef.current = null
      }
    }
  }, [history, chartType, indicators, activeTimeframe, activeStock.symbol])

  // Chart Zoom controls
  const handleZoomIn = () => {
    if (chartInstanceRef.current) {
      const range = chartInstanceRef.current.timeScale().getVisibleLogicalRange()
      if (range) {
        const delta = (range.to - range.from) * 0.2
        chartInstanceRef.current.timeScale().setVisibleLogicalRange({
          from: range.from + delta,
          to: range.to - delta,
        })
      }
    }
  }

  const handleZoomOut = () => {
    if (chartInstanceRef.current) {
      const range = chartInstanceRef.current.timeScale().getVisibleLogicalRange()
      if (range) {
        const delta = (range.to - range.from) * 0.25
        chartInstanceRef.current.timeScale().setVisibleLogicalRange({
          from: range.from - delta,
          to: range.to + delta,
        })
      }
    }
  }

  const handleFitContent = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.timeScale().fitContent()
    }
  }

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      terminalRootRef.current?.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  // Tool selection handler
  const handleToolSelect = (tool: DrawingTool, label: string) => {
    setActiveTool(tool)
    if (tool !== 'crosshair') {
      setToolFeedback(`${label} selected. (Interactive chart drawing preview)`)
      setTimeout(() => setToolFeedback(null), 3000)
    } else {
      setToolFeedback(null)
    }
  }

  // Switch active symbol from watchlist
  const handleSelectSymbol = (symbol: string) => {
    if (symbol === activeStock.symbol) return
    const cached = watchlistQuotes[symbol]
    if (cached) {
      setActiveStock(cached)
    } else {
      setActiveStock({
        symbol,
        name: symbol,
        company: symbol,
        exchange: symbol.includes('/') ? 'FOREX' : 'NASDAQ',
        market: symbol.includes('/') ? 'FOREX' : 'NASDAQ',
        sector: 'Equities',
        currentPrice: 0,
        previousClose: 0,
        changeAmount: 0,
        changePercent: 0,
        volume: 0,
        currency: symbol.includes('/') ? 'USD' : 'USD',
      })
    }
    setTradeMessage(null)
  }

  // Handle Paper Trade Execution
  const handleExecuteTrade = async () => {
    if (tradeQuantity <= 0) {
      setTradeMessage({ type: 'error', text: 'Please enter a valid quantity greater than 0' })
      return
    }

    if (!currentPrice || currentPrice <= 0) {
      setTradeMessage({ type: 'error', text: 'Real market price is currently unavailable for this asset' })
      return
    }

    const totalEstimate = tradeQuantity * currentPrice
    const cashAvailable = Number(wallet?.balance || 0)

    if (tradeSide === 'BUY' && totalEstimate > cashAvailable) {
      setTradeMessage({
        type: 'error',
        text: `Insufficient virtual cash. Required: ${formatPrice(totalEstimate)}, Available: ${formatPrice(cashAvailable)}`,
      })
      return
    }

    if (tradeSide === 'SELL' && ownedQuantity < tradeQuantity) {
      setTradeMessage({
        type: 'error',
        text: `Insufficient shares owned. You own ${ownedQuantity} shares, but tried to sell ${tradeQuantity}`,
      })
      return
    }

    setTradeSubmitting(true)
    setTradeMessage(null)

    try {
      const order = await tradeService.executeOrder({
        symbol: activeStock.symbol,
        side: tradeSide,
        quantity: tradeQuantity,
        orderType: tradeOrderType,
        limitPrice: tradeOrderType === 'LIMIT' && tradeLimitPrice ? parseFloat(tradeLimitPrice) : undefined,
      })

      // Refresh wallet & portfolio immediately
      await Promise.all([refreshWallet(), fetchHoldings()])

      setTradeMessage({
        type: 'success',
        text: `Successfully ${tradeSide === 'BUY' ? 'bought' : 'sold'} ${tradeQuantity} ${activeStock.symbol} at ${formatPrice(order.executionPrice || currentPrice)}! Order #${order.orderNumber}`,
      })

      // Reset quantity
      setTradeQuantity(1)
    } catch (err: any) {
      setTradeMessage({
        type: 'error',
        text: err?.response?.data?.message || err.message || 'Trade execution failed',
      })
    } finally {
      setTradeSubmitting(false)
    }
  }

  const activeHud = hoveredData || latestCandle
  const availableCash = Number(wallet?.balance || 0)
  const estimatedOrderValue = tradeQuantity * currentPrice

  return (
    <div
      ref={terminalRootRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#0b0e14] text-slate-200 select-none overflow-hidden font-sans"
    >
      {/* =========================================================================
          1. TOP BAR: Symbol | Timeframe | Controls | Indicators | Price | Trade
         ========================================================================= */}
      <header className="h-12 bg-[#131722] border-b border-[#2a2e39] flex items-center justify-between px-3 gap-2 shrink-0 z-30">
        {/* Left Section: Back button, Symbol, Timeframe, Chart Type */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Exit / Back to Stock Details */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e222d] hover:bg-[#2a2e39] text-slate-300 hover:text-white border border-[#2a2e39] text-xs font-semibold cursor-pointer transition-colors"
            title="Exit Fullscreen Terminal and return to details"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exit Terminal</span>
          </button>

          {/* Symbol & Exchange Badge */}
          <div className="flex items-center gap-1.5 bg-[#1e222d] px-2.5 py-1 rounded border border-[#2a2e39]">
            <span className="font-bold text-white text-xs tracking-wide">{activeStock.symbol}</span>
            <span className="text-[10px] text-blue-400 font-medium px-1 rounded bg-blue-500/10">
              {activeStock.exchange || 'NASDAQ'}
            </span>
          </div>

          <div className="h-4 w-px bg-[#2a2e39]" />

          {/* Timeframe Selector */}
          <div className="flex items-center bg-[#1e222d] rounded border border-[#2a2e39] p-0.5">
            {(['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  activeTimeframe === tf
                    ? 'bg-[#2962ff] text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#2a2e39]'
                }`}
                title={`Switch to ${tf} historical timeframe`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[#2a2e39]" />

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-[#1e222d] rounded border border-[#2a2e39] p-0.5">
            <button
              onClick={() => setChartType('candles')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                chartType === 'candles' ? 'bg-[#2a2e39] text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setChartType('bars')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                chartType === 'bars' ? 'bg-[#2a2e39] text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Bar Chart"
            >
              <Activity className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                chartType === 'line' ? 'bg-[#2a2e39] text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Line Chart"
            >
              <LineChart className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                chartType === 'area' ? 'bg-[#2a2e39] text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Area Chart"
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Indicators Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e222d] hover:bg-[#2a2e39] text-slate-300 hover:text-white border border-[#2a2e39] text-xs font-medium cursor-pointer transition-colors"
            >
              <Sliders className="h-3 w-3 text-blue-400" />
              <span>Indicators</span>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>

            {showIndicatorsMenu && (
              <div className="absolute left-0 mt-1 w-48 bg-[#1e222d] border border-[#2a2e39] rounded shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => setIndicators((prev) => ({ ...prev, sma20: !prev.sma20 }))}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#2a2e39] text-left text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    SMA 20
                  </span>
                  {indicators.sma20 && <Check className="h-3.5 w-3.5 text-blue-400" />}
                </button>
                <button
                  onClick={() => setIndicators((prev) => ({ ...prev, ema50: !prev.ema50 }))}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#2a2e39] text-left text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-400" />
                    EMA 50
                  </span>
                  {indicators.ema50 && <Check className="h-3.5 w-3.5 text-blue-400" />}
                </button>
                <button
                  onClick={() => setIndicators((prev) => ({ ...prev, volMa: !prev.volMa }))}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#2a2e39] text-left text-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Volume Overlay
                  </span>
                  {indicators.volMa && <Check className="h-3.5 w-3.5 text-blue-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Compare Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowCompareMenu(!showCompareMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e222d] hover:bg-[#2a2e39] text-slate-300 hover:text-white border border-[#2a2e39] text-xs font-medium cursor-pointer transition-colors"
            >
              <span>Compare</span>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>

            {showCompareMenu && (
              <div className="absolute left-0 mt-1 w-44 bg-[#1e222d] border border-[#2a2e39] rounded shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    handleSelectSymbol('SPY')
                    setShowCompareMenu(false)
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#2a2e39] text-left text-slate-200"
                >
                  <span>S&P 500 (SPY)</span>
                </button>
                <button
                  onClick={() => {
                    handleSelectSymbol('QQQ')
                    setShowCompareMenu(false)
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#2a2e39] text-left text-slate-200"
                >
                  <span>NASDAQ 100 (QQQ)</span>
                </button>
                <button
                  onClick={() => {
                    handleSelectSymbol('DIA')
                    setShowCompareMenu(false)
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#2a2e39] text-left text-slate-200"
                >
                  <span>Dow Jones (DIA)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Real Live Price, Change, Trade Button, Fullscreen */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Current Real Price & Percentage */}
          {currentPrice > 0 ? (
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-white tabular-nums tracking-tight">
                {formatPrice(currentPrice)}
              </span>
              <span
                className={`text-xs font-semibold tabular-nums flex items-center gap-0.5 ${
                  isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {isPositive ? '+' : ''}
                {formatPrice(changeAmount)} ({isPositive ? '+' : ''}
                {changePercent.toFixed(2)}%)
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">Price unavailable</span>
          )}

          {/* Trade Order Ticket Trigger */}
          <button
            onClick={() => {
              setIsTradeTicketOpen(!isTradeTicketOpen)
              setRightPanelTab('trade')
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer shadow-sm ${
              isTradeTicketOpen
                ? 'bg-blue-600 text-white ring-2 ring-blue-500/50'
                : 'bg-[#089981] hover:bg-[#067a67] text-white'
            }`}
            title="Open Paper Trading Buy/Sell Order Ticket"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Trade</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded bg-[#1e222d] hover:bg-[#2a2e39] text-slate-300 hover:text-white border border-[#2a2e39] text-xs cursor-pointer transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. MAIN BODY: [Left Vertical Toolbar] | [Large Chart] | [Right Panel]
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Tool feedback notification banner */}
        {toolFeedback && (
          <div className="absolute top-3 left-16 z-40 bg-[#1e222d] border border-blue-500/40 text-blue-300 px-3 py-1.5 rounded shadow-lg text-xs flex items-center gap-2 animate-fade-in">
            <Info className="h-3.5 w-3.5 text-blue-400" />
            <span>{toolFeedback}</span>
          </div>
        )}

        {/* -------------------------------------------------------------
            LEFT VERTICAL TOOLBAR: TradingView-style Compact Tools
           ------------------------------------------------------------- */}
        <aside className="w-11 bg-[#131722] border-r border-[#2a2e39] flex flex-col items-center py-2 gap-1 shrink-0 z-20">
          <button
            onClick={() => handleToolSelect('crosshair', 'Crosshair')}
            className={`p-2 rounded text-slate-400 hover:text-white transition-colors cursor-pointer ${
              activeTool === 'crosshair' ? 'bg-[#2a2e39] text-blue-400 font-bold' : 'hover:bg-[#1e222d]'
            }`}
            title="Crosshair (Pointer)"
          >
            <Crosshair className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleToolSelect('trendline', 'Trend Line')}
            className={`p-2 rounded text-slate-400 hover:text-white transition-colors cursor-pointer ${
              activeTool === 'trendline' ? 'bg-[#2a2e39] text-blue-400' : 'hover:bg-[#1e222d]'
            }`}
            title="Trend Line"
          >
            <Minus className="h-4 w-4 rotate-45" />
          </button>

          <button
            onClick={() => handleToolSelect('horizontal', 'Horizontal Line')}
            className={`p-2 rounded text-slate-400 hover:text-white transition-colors cursor-pointer ${
              activeTool === 'horizontal' ? 'bg-[#2a2e39] text-blue-400' : 'hover:bg-[#1e222d]'
            }`}
            title="Horizontal Line"
          >
            <Minus className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleToolSelect('vertical', 'Vertical Line')}
            className={`p-2 rounded text-slate-400 hover:text-white transition-colors cursor-pointer ${
              activeTool === 'vertical' ? 'bg-[#2a2e39] text-blue-400' : 'hover:bg-[#1e222d]'
            }`}
            title="Vertical Line"
          >
            <MoveVertical className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleToolSelect('rectangle', 'Rectangle')}
            className={`p-2 rounded text-slate-400 hover:text-white transition-colors cursor-pointer ${
              activeTool === 'rectangle' ? 'bg-[#2a2e39] text-blue-400' : 'hover:bg-[#1e222d]'
            }`}
            title="Rectangle"
          >
            <Square className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleToolSelect('text', 'Text Tool')}
            className={`p-2 rounded text-slate-400 hover:text-white transition-colors cursor-pointer ${
              activeTool === 'text' ? 'bg-[#2a2e39] text-blue-400' : 'hover:bg-[#1e222d]'
            }`}
            title="Text Note"
          >
            <Type className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleToolSelect('measure', 'Measure Tool')}
            className={`p-2 rounded text-slate-400 hover:text-white transition-colors cursor-pointer ${
              activeTool === 'measure' ? 'bg-[#2a2e39] text-blue-400' : 'hover:bg-[#1e222d]'
            }`}
            title="Measure (Ruler)"
          >
            <Ruler className="h-4 w-4" />
          </button>

          <div className="w-6 h-px bg-[#2a2e39] my-2" />

          {/* Quick Zoom Actions */}
          <button
            onClick={handleZoomIn}
            className="p-2 rounded text-slate-400 hover:text-white hover:bg-[#1e222d] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            onClick={handleZoomOut}
            className="p-2 rounded text-slate-400 hover:text-white hover:bg-[#1e222d] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            onClick={handleFitContent}
            className="p-2 rounded text-slate-400 hover:text-white hover:bg-[#1e222d] transition-colors cursor-pointer"
            title="Fit to Screen (Reset Zoom)"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </aside>

        {/* -------------------------------------------------------------
            CENTER: LARGE CHART WORKSPACE (Maximum Available Area)
           ------------------------------------------------------------- */}
        <main className="flex-1 flex flex-col bg-[#0b0e14] min-w-0 h-full relative overflow-hidden">
          {/* Chart Header HUD: OHLCV metrics on cursor hover */}
          <div className="h-7 bg-[#131722]/80 border-b border-[#1e222d] flex items-center px-3 gap-4 text-xs font-mono text-slate-400 shrink-0 z-10 overflow-x-auto no-scrollbar">
            <span className="font-bold text-white text-[11px]">{activeStock.symbol}</span>
            <span className="text-[11px] text-slate-500">{activeTimeframe}</span>

            {activeHud ? (
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-slate-300 font-sans">{activeHud.time}</span>
                <span>
                  O <strong className="text-white font-mono">{formatPrice(activeHud.open)}</strong>
                </span>
                <span>
                  H <strong className="text-[#089981] font-mono">{formatPrice(activeHud.high)}</strong>
                </span>
                <span>
                  L <strong className="text-[#f23645] font-mono">{formatPrice(activeHud.low)}</strong>
                </span>
                <span>
                  C <strong className="text-white font-mono">{formatPrice(activeHud.close)}</strong>
                </span>
                <span
                  className={`font-bold font-mono ${activeHud.isGain ? 'text-[#089981]' : 'text-[#f23645]'}`}
                >
                  {activeHud.isGain ? '+' : ''}
                  {formatPrice(activeHud.change)} ({activeHud.isGain ? '+' : ''}
                  {activeHud.changePercent.toFixed(2)}%)
                </span>
                {indicators.volMa && (
                  <span>
                    Vol <strong className="text-blue-400 font-mono">{formatVolume(activeHud.volume)}</strong>
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-slate-600 italic">Twelve Data Real Market OHLCV Feed</span>
            )}
          </div>

          {/* Canvas Mount Container */}
          <div className="flex-1 w-full h-full min-h-0 relative">
            {chartLoading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#0b0e14]/70 backdrop-blur-xs">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-xs text-slate-400 font-medium">
                  Loading real Twelve Data historical candles...
                </span>
              </div>
            )}

            {!chartLoading && chartError && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 p-6 text-center">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-200">Historical market data unavailable</h4>
                <p className="text-xs text-slate-400 max-w-sm">{chartError}</p>
                <button
                  onClick={() => setActiveTimeframe('1M')}
                  className="mt-2 px-3 py-1 rounded bg-[#1e222d] hover:bg-[#2a2e39] text-xs text-blue-400 border border-[#2a2e39] cursor-pointer"
                >
                  Switch to 1M Timeframe
                </button>
              </div>
            )}

            {/* TradingView Lightweight Charts DOM Canvas */}
            <div ref={chartContainerRef} className="w-full h-full" />
          </div>
        </main>

        {/* -------------------------------------------------------------
            RIGHT PANEL: WATCHLIST & BUY/SELL ORDER TICKET
           ------------------------------------------------------------- */}
        <aside className="w-72 sm:w-80 bg-[#131722] border-l border-[#2a2e39] flex flex-col shrink-0 h-full z-20">
          {/* Panel Header Tabs */}
          <div className="h-9 bg-[#171b26] border-b border-[#2a2e39] flex items-center justify-between px-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setRightPanelTab('watchlist')
                  setIsTradeTicketOpen(false)
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                  rightPanelTab === 'watchlist' && !isTradeTicketOpen
                    ? 'bg-[#1e222d] text-white border border-[#2a2e39]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Watchlist
              </button>
              <button
                onClick={() => {
                  setRightPanelTab('trade')
                  setIsTradeTicketOpen(true)
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  isTradeTicketOpen
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Order Ticket</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </button>
            </div>

            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              PortfolioPro
            </span>
          </div>

          {/* =========================================================
              TAB A: MARKET WATCHLIST PANEL (Indexes, Stocks, Forex)
             ========================================================= */}
          {!isTradeTicketOpen && (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
              {/* Search Filter in Watchlist */}
              <div className="p-2 border-b border-[#1e222d]">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={watchlistFilter}
                    onChange={(e) => setWatchlistFilter(e.target.value)}
                    placeholder="Search Watchlist..."
                    className="w-full bg-[#1e222d] text-xs text-white pl-7 pr-2 py-1 rounded border border-[#2a2e39] focus:outline-none focus:border-blue-500"
                  />
                  {watchlistFilter && (
                    <button
                      onClick={() => setWatchlistFilter('')}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Section 1: INDEXES */}
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-[#0f131c]">
                  Indexes & ETFs
                </div>
                {WATCHLIST_SECTIONS.INDEXES.filter(
                  (item) =>
                    !watchlistFilter ||
                    item.symbol.toLowerCase().includes(watchlistFilter.toLowerCase()) ||
                    item.name.toLowerCase().includes(watchlistFilter.toLowerCase())
                ).map((item) => {
                  const quote = watchlistQuotes[item.symbol]
                  const qPrice = quote?.currentPrice || quote?.price
                  const qChange = quote?.changePercent
                  const isUp = (quote?.changeAmount ?? 0) >= 0
                  const isSelected = activeStock.symbol === item.symbol

                  return (
                    <div
                      key={item.symbol}
                      onClick={() => handleSelectSymbol(item.symbol)}
                      className={`flex items-center justify-between px-3 py-2 border-b border-[#171b26] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#1e222d] border-l-2 border-l-blue-500' : 'hover:bg-[#1a1e29]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{item.symbol}</span>
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[110px]">{item.name}</div>
                      </div>

                      <div className="text-right">
                        {qPrice && qPrice > 0 ? (
                          <>
                            <div className="text-xs font-mono font-bold text-white tabular-nums">
                              {formatPrice(qPrice)}
                            </div>
                            <div
                              className={`text-[10px] font-mono tabular-nums font-semibold ${
                                isUp ? 'text-[#089981]' : 'text-[#f23645]'
                              }`}
                            >
                              {isUp ? '+' : ''}
                              {qChange != null ? qChange.toFixed(2) : '0.00'}%
                            </div>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Unavailable</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Section 2: STOCKS */}
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-[#0f131c]">
                  Active Equities
                </div>
                {WATCHLIST_SECTIONS.STOCKS.filter(
                  (item) =>
                    !watchlistFilter ||
                    item.symbol.toLowerCase().includes(watchlistFilter.toLowerCase()) ||
                    item.name.toLowerCase().includes(watchlistFilter.toLowerCase())
                ).map((item) => {
                  const quote = watchlistQuotes[item.symbol]
                  const qPrice = quote?.currentPrice || quote?.price
                  const qChange = quote?.changePercent
                  const isUp = (quote?.changeAmount ?? 0) >= 0
                  const isSelected = activeStock.symbol === item.symbol

                  return (
                    <div
                      key={item.symbol}
                      onClick={() => handleSelectSymbol(item.symbol)}
                      className={`flex items-center justify-between px-3 py-2 border-b border-[#171b26] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#1e222d] border-l-2 border-l-blue-500' : 'hover:bg-[#1a1e29]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{item.symbol}</span>
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[110px]">{item.name}</div>
                      </div>

                      <div className="text-right">
                        {qPrice && qPrice > 0 ? (
                          <>
                            <div className="text-xs font-mono font-bold text-white tabular-nums">
                              {formatPrice(qPrice)}
                            </div>
                            <div
                              className={`text-[10px] font-mono tabular-nums font-semibold ${
                                isUp ? 'text-[#089981]' : 'text-[#f23645]'
                              }`}
                            >
                              {isUp ? '+' : ''}
                              {qChange != null ? qChange.toFixed(2) : '0.00'}%
                            </div>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Unavailable</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Section 3: FOREX */}
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-[#0f131c]">
                  Forex Currencies
                </div>
                {WATCHLIST_SECTIONS.FOREX.filter(
                  (item) =>
                    !watchlistFilter ||
                    item.symbol.toLowerCase().includes(watchlistFilter.toLowerCase()) ||
                    item.name.toLowerCase().includes(watchlistFilter.toLowerCase())
                ).map((item) => {
                  const quote = watchlistQuotes[item.symbol]
                  const qPrice = quote?.currentPrice || quote?.price
                  const qChange = quote?.changePercent
                  const isUp = (quote?.changeAmount ?? 0) >= 0
                  const isSelected = activeStock.symbol === item.symbol

                  return (
                    <div
                      key={item.symbol}
                      onClick={() => handleSelectSymbol(item.symbol)}
                      className={`flex items-center justify-between px-3 py-2 border-b border-[#171b26] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#1e222d] border-l-2 border-l-blue-500' : 'hover:bg-[#1a1e29]'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{item.symbol}</span>
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[110px]">{item.name}</div>
                      </div>

                      <div className="text-right">
                        {qPrice && qPrice > 0 ? (
                          <>
                            <div className="text-xs font-mono font-bold text-white tabular-nums">
                              {Number(qPrice).toFixed(4)}
                            </div>
                            <div
                              className={`text-[10px] font-mono tabular-nums font-semibold ${
                                isUp ? 'text-[#089981]' : 'text-[#f23645]'
                              }`}
                            >
                              {isUp ? '+' : ''}
                              {qChange != null ? qChange.toFixed(2) : '0.00'}%
                            </div>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Unavailable</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB B: BUY / SELL TRADING ORDER TICKET
             ========================================================= */}
          {isTradeTicketOpen && (
            <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto no-scrollbar">
              {/* Asset Header in Order Ticket */}
              <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39]">
                <div>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <span>{activeStock.symbol}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                      {activeStock.exchange}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 truncate max-w-[160px]">
                    {activeStock.company || activeStock.name}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-white">{formatPrice(currentPrice)}</div>
                  <div
                    className={`text-[11px] font-mono font-semibold ${
                      isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Side Selector: [ BUY ] [ SELL ] */}
              <div className="grid grid-cols-2 gap-2 bg-[#1e222d] p-1 rounded border border-[#2a2e39]">
                <button
                  onClick={() => setTradeSide('BUY')}
                  className={`py-1.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                    tradeSide === 'BUY'
                      ? 'bg-[#089981] text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BUY
                </button>
                <button
                  onClick={() => setTradeSide('SELL')}
                  className={`py-1.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                    tradeSide === 'SELL'
                      ? 'bg-[#f23645] text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SELL
                </button>
              </div>

              {/* Owned Shares Badge */}
              <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-[#1e222d] border border-[#2a2e39]">
                <span className="text-slate-400">Position Owned:</span>
                <span className="font-bold text-white font-mono">
                  {ownedQuantity} {ownedQuantity === 1 ? 'Share' : 'Shares'}
                </span>
              </div>

              {/* Order Type Selector */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 uppercase font-semibold">Order Type</label>
                <select
                  value={tradeOrderType}
                  onChange={(e) => setTradeOrderType(e.target.value as 'MARKET' | 'LIMIT')}
                  className="w-full bg-[#1e222d] text-xs text-white px-2.5 py-1.5 rounded border border-[#2a2e39] focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="MARKET">Market Order</option>
                  <option value="LIMIT">Limit Order</option>
                </select>
              </div>

              {/* Limit Price Input if LIMIT */}
              {tradeOrderType === 'LIMIT' && (
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 uppercase font-semibold">Limit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tradeLimitPrice}
                    onChange={(e) => setTradeLimitPrice(e.target.value)}
                    placeholder={currentPrice.toString()}
                    className="w-full bg-[#1e222d] text-xs text-white px-2.5 py-1.5 rounded border border-[#2a2e39] font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Quantity Input with Multipliers */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="text-slate-400 uppercase font-semibold">Quantity</label>
                  {tradeSide === 'SELL' && ownedQuantity > 0 && (
                    <button
                      onClick={() => setTradeQuantity(ownedQuantity)}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Max ({ownedQuantity})
                    </button>
                  )}
                </div>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#1e222d] text-sm text-white px-3 py-1.5 rounded border border-[#2a2e39] font-mono font-bold focus:outline-none focus:border-blue-500"
                />

                {/* Quick Add Buttons */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[1, 5, 10, 50].map((add) => (
                    <button
                      key={add}
                      onClick={() => setTradeQuantity((prev) => prev + add)}
                      className="py-1 rounded bg-[#1e222d] hover:bg-[#2a2e39] text-[11px] font-mono text-slate-300 border border-[#2a2e39] cursor-pointer"
                    >
                      +{add}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Calculations Summary */}
              <div className="p-3 rounded bg-[#171b26] border border-[#2a2e39] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Estimated Value</span>
                  <span className="font-bold text-white font-mono">{formatPrice(estimatedOrderValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Available Virtual Cash</span>
                  <span className="font-bold text-emerald-400 font-mono">{formatPrice(availableCash)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#2a2e39]">
                  <span className="text-slate-500">Trading Mode</span>
                  <span className="text-blue-400 font-semibold">PortfolioPro Paper Trading</span>
                </div>
              </div>

              {/* Feedback messages */}
              {tradeMessage && (
                <div
                  className={`p-2.5 rounded text-xs flex items-start gap-2 ${
                    tradeMessage.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {tradeMessage.type === 'success' ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span>{tradeMessage.text}</span>
                </div>
              )}

              {/* Order Submit Action Button */}
              <button
                onClick={handleExecuteTrade}
                disabled={
                  tradeSubmitting ||
                  tradeQuantity <= 0 ||
                  (tradeSide === 'SELL' && ownedQuantity <= 0) ||
                  (tradeSide === 'BUY' && estimatedOrderValue > availableCash)
                }
                className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                  tradeSide === 'BUY'
                    ? 'bg-[#089981] hover:bg-[#067a67] text-white disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed'
                    : 'bg-[#f23645] hover:bg-[#c92533] text-white disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed'
                }`}
              >
                {tradeSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Executing Trade...</span>
                  </>
                ) : (
                  <span>
                    {tradeSide} {tradeQuantity} {activeStock.symbol}
                  </span>
                )}
              </button>

              {/* Switch back to Watchlist */}
              <button
                onClick={() => setIsTradeTicketOpen(false)}
                className="w-full py-1 text-center text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Return to Watchlist
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* =========================================================================
          3. BOTTOM BAR: Timeframe | Status | Exchange | Currency | Zoom Shortcuts
         ========================================================================= */}
      <footer className="h-7 bg-[#131722] border-t border-[#2a2e39] flex items-center justify-between px-3 text-[11px] text-slate-400 shrink-0 z-30">
        {/* Left: Terminal status indicators */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
          <span className="font-semibold text-slate-200">{activeStock.exchange || 'NASDAQ'}</span>
          <span>•</span>
          <span>{isUSD ? 'USD ($)' : 'INR (₹)'}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            {activeStock.isDelayed !== false ? (
              <>
                <Clock className="h-3 w-3 text-amber-500" />
                <span className="text-amber-400">DELAYED / LATEST AVAILABLE</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 font-bold">LIVE MARKET DATA</span>
              </>
            )}
          </span>
          <span>•</span>
          <span className="hidden md:inline">
            Updated {activeStock.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Right: Quick Zoom controls & Range info */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-500">
            {history?.candles?.length || 0} Candles ({activeTimeframe})
          </span>

          <div className="flex items-center gap-1 border-l border-[#2a2e39] pl-2">
            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-[#2a2e39] text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-[#2a2e39] text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <button
              onClick={handleFitContent}
              className="px-1.5 py-0.5 rounded hover:bg-[#2a2e39] text-slate-400 hover:text-white text-[10px] font-bold"
              title="Fit to Screen"
            >
              Fit
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TradingTerminal
