import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  ArrowRight,
  ChevronRight,
  BarChart2,
  PieChart,
  Shield,
  Layers,
  LayoutGrid,
  List,
  RefreshCw
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { StockQuote, ApiResponse } from '../types/auth'

interface LandingViewProps {
  onOpenLogin?: () => void
  onOpenRegister?: () => void
}

type MarketFilter = 'ALL' | 'NSE' | 'NASDAQ' | 'TECH' | 'FINANCE'

interface MajorIndex {
  id: string
  name: string
  subTicker: string
  badgeText: string
  badgeBg: string
  value: string
  change: string
  changePct: string
  isUp: boolean
  intradayBase: number
  seed: number
}

export const LandingView: React.FC<LandingViewProps> = ({ onOpenRegister }) => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [stocks, setStocks] = useState<StockQuote[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<MarketFilter>('ALL')
  const [chartTimeframe, setChartTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1D')
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Major Indices (matches the composition of the TradingView reference)
  const majorIndices: MajorIndex[] = [
    {
      id: 'NIFTY50',
      name: 'Nifty 50',
      subTicker: 'NIFTY',
      badgeText: '50',
      badgeBg: 'bg-[#1b2559]',
      value: '24,835.10',
      change: '+104.25',
      changePct: '+0.42%',
      isUp: true,
      intradayBase: 24730.85,
      seed: 50,
    },
    {
      id: 'SENSEX',
      name: 'Sensex',
      subTicker: 'SENSEX',
      badgeText: 'BSE',
      badgeBg: 'bg-[#0052cc]',
      value: '81,340.50',
      change: '+308.10',
      changePct: '+0.38%',
      isUp: true,
      intradayBase: 81032.4,
      seed: 81,
    },
    {
      id: 'BANKNIFTY',
      name: 'Bank Nifty',
      subTicker: 'BANKNIFTY',
      badgeText: 'BN',
      badgeBg: 'bg-[#4338ca]',
      value: '51,920.30',
      change: '-78.40',
      changePct: '-0.15%',
      isUp: false,
      intradayBase: 51998.7,
      seed: 33,
    },
    {
      id: 'NASDAQ100',
      name: 'Nasdaq 100',
      subTicker: 'NDX',
      badgeText: '100',
      badgeBg: 'bg-[#0891b2]',
      value: '18,240.20',
      change: '+117.80',
      changePct: '+0.65%',
      isUp: true,
      intradayBase: 18122.4,
      seed: 100,
    },
    {
      id: 'SP500',
      name: 'S&P 500',
      subTicker: 'SPX',
      badgeText: '500',
      badgeBg: 'bg-[#dc2626]',
      value: '5,718.55',
      change: '+16.20',
      changePct: '+0.28%',
      isUp: true,
      intradayBase: 5702.35,
      seed: 500,
    },
    {
      id: 'FTSE100',
      name: 'FTSE 100',
      subTicker: 'UKX',
      badgeText: 'UK',
      badgeBg: 'bg-[#2563eb]',
      value: '8,260.40',
      change: '+10.15',
      changePct: '+0.12%',
      isUp: true,
      intradayBase: 8250.25,
      seed: 77,
    },
  ]

  const [activeIndex, setActiveIndex] = useState<MajorIndex>(majorIndices[0])

  // Fetch live stocks from backend MarketDataProvider
  const fetchStocks = () => {
    setLoading(true)
    api
      .get<ApiResponse<StockQuote[]>>('/market/stocks')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setStocks(res.data.data)
        }
      })
      .catch((err) => {
        console.error('Failed to load market stocks:', err)
        // Fallback baseline quotes
        const fallback: StockQuote[] = [
          {
            symbol: 'RELIANCE',
            name: 'Reliance Industries Ltd',
            exchange: 'NSE',
            sector: 'Energy',
            currentPrice: 2980.5,
            previousClose: 2945.0,
            changeAmount: 35.5,
            changePercent: 1.21,
            dayHigh: 3010.0,
            dayLow: 2930.0,
            volume: 14500000,
            marketCap: 20150000000000,
            peRatio: 28.4,
          },
          {
            symbol: 'TCS',
            name: 'Tata Consultancy Services',
            exchange: 'NSE',
            sector: 'Information Technology',
            currentPrice: 4210.75,
            previousClose: 4180.0,
            changeAmount: 30.75,
            changePercent: 0.74,
            dayHigh: 4245.0,
            dayLow: 4160.0,
            volume: 8200000,
            marketCap: 15200000000000,
            peRatio: 32.1,
          },
          {
            symbol: 'HDFCBANK',
            name: 'HDFC Bank Ltd',
            exchange: 'NSE',
            sector: 'Financial Services',
            currentPrice: 1650.2,
            previousClose: 1665.0,
            changeAmount: -14.8,
            changePercent: -0.89,
            dayHigh: 1670.0,
            dayLow: 1640.0,
            volume: 18900000,
            marketCap: 12500000000000,
            peRatio: 19.5,
          },
          {
            symbol: 'INFY',
            name: 'Infosys Ltd',
            exchange: 'NSE',
            sector: 'Information Technology',
            currentPrice: 1890.3,
            previousClose: 1860.5,
            changeAmount: 29.8,
            changePercent: 1.6,
            dayHigh: 1905.0,
            dayLow: 1850.0,
            volume: 12400000,
            marketCap: 7800000000000,
            peRatio: 27.3,
          },
          {
            symbol: 'ICICIBANK',
            name: 'ICICI Bank Ltd',
            exchange: 'NSE',
            sector: 'Financial Services',
            currentPrice: 1220.8,
            previousClose: 1205.0,
            changeAmount: 15.8,
            changePercent: 1.31,
            dayHigh: 1230.0,
            dayLow: 1198.0,
            volume: 11200000,
            marketCap: 8600000000000,
            peRatio: 18.2,
          },
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            exchange: 'NASDAQ',
            sector: 'Technology',
            currentPrice: 230.5,
            previousClose: 228.0,
            changeAmount: 2.5,
            changePercent: 1.1,
            dayHigh: 232.0,
            dayLow: 227.5,
            volume: 45000000,
            marketCap: 3500000000000,
            peRatio: 34.2,
          },
          {
            symbol: 'MSFT',
            name: 'Microsoft Corporation',
            exchange: 'NASDAQ',
            sector: 'Technology',
            currentPrice: 445.2,
            previousClose: 448.0,
            changeAmount: -2.8,
            changePercent: -0.63,
            dayHigh: 450.0,
            dayLow: 442.1,
            volume: 22000000,
            marketCap: 3300000000000,
            peRatio: 36.8,
          },
          {
            symbol: 'NVDA',
            name: 'NVIDIA Corporation',
            exchange: 'NASDAQ',
            sector: 'Semiconductors',
            currentPrice: 128.4,
            previousClose: 124.5,
            changeAmount: 3.9,
            changePercent: 3.13,
            dayHigh: 130.0,
            dayLow: 123.8,
            volume: 89000000,
            marketCap: 3150000000000,
            peRatio: 55.4,
          },
        ]
        setStocks(fallback)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStocks()
  }, [])

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        document.getElementById('stocks-section')?.scrollIntoView({ behavior: 'smooth' })
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
        document.getElementById('stocks-section')?.scrollIntoView({ behavior: 'smooth' })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filter stocks by query, exchange, and sector
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const q = searchQuery.trim().toLowerCase()
      const matchesQuery =
        !q ||
        stock.symbol.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q) ||
        stock.sector.toLowerCase().includes(q)

      if (!matchesQuery) return false

      if (activeFilter === 'NSE') return stock.exchange === 'NSE'
      if (activeFilter === 'NASDAQ') return stock.exchange === 'NASDAQ'
      if (activeFilter === 'TECH') return stock.sector.toLowerCase().includes('tech') || stock.sector.toLowerCase().includes('semiconductor')
      if (activeFilter === 'FINANCE') return stock.sector.toLowerCase().includes('financial')

      return true
    })
  }, [stocks, searchQuery, activeFilter])

  // Realistic market chart points inspired by the attached TradingView reference image
  // Features authentic intraday fluctuations and clean timestamps
  const chartPoints = useMemo(() => {
    const numNodes = chartTimeframe === '1D' ? 48 : chartTimeframe === '1W' ? 36 : chartTimeframe === '1M' ? 42 : 52
    const seed = activeIndex.seed

    const viewW = 740
    const viewH = 260
    const padX = 24
    const padTop = 20
    const padBottom = 32
    const usableW = viewW - padX * 2
    const usableH = viewH - padTop - padBottom

    const rawPrices: number[] = []
    const base = activeIndex.intradayBase
    const target = parseFloat(activeIndex.value.replace(/,/g, ''))
    const diff = target - base

    // Generate realistic market wave series
    for (let i = 0; i < numNodes; i++) {
      const p = i / (numNodes - 1)
      const trend = base + diff * p
      // Natural oscillating market noise
      const harmonic1 = Math.sin((i / 3.2) + (seed % 7)) * (base * 0.0035)
      const harmonic2 = Math.cos((i / 1.7) + (seed % 5)) * (base * 0.0022)
      const harmonic3 = Math.sin((i / 5.5) + (seed % 3)) * (base * 0.004)
      const jitter = (Math.sin(i * 12.3 + seed) * 0.5) * (base * 0.0008)

      let price = trend + harmonic1 + harmonic2 + harmonic3 + jitter
      if (i === 0) price = base
      if (i === numNodes - 1) price = target

      rawPrices.push(price)
    }

    const minP = Math.min(...rawPrices) * 0.9985
    const maxP = Math.max(...rawPrices) * 1.0015
    const rangeP = maxP - minP || 1

    const timestamps = ['09:15', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']

    return rawPrices.map((price, i) => {
      const x = padX + (i / (numNodes - 1)) * usableW
      const y = padTop + usableH - ((price - minP) / rangeP) * usableH

      const timeIndex = Math.min(
        timestamps.length - 1,
        Math.floor((i / (numNodes - 1)) * timestamps.length)
      )
      const time = timestamps[timeIndex]

      return { x, y, price, time }
    })
  }, [activeIndex, chartTimeframe])

  const pathD = useMemo(() => {
    return chartPoints.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
    }, '')
  }, [chartPoints])

  const areaD = useMemo(() => {
    if (chartPoints.length === 0) return ''
    const first = chartPoints[0]
    const last = chartPoints[chartPoints.length - 1]
    const baseline = 260 - 32
    return `${pathD} L ${last.x.toFixed(1)} ${baseline} L ${first.x.toFixed(1)} ${baseline} Z`
  }, [chartPoints, pathD])

  // Mini sparklines for stock cards (each stock has its own unique shape)
  const renderSparkline = (symbol: string, isUp: boolean) => {
    const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const points = [
      12 + Math.sin(seed) * 5,
      9 + Math.cos(seed + 1) * 6,
      15 + Math.sin(seed + 2) * 5,
      8 + Math.cos(seed + 3) * 6,
      13 + Math.sin(seed + 4) * 5,
      isUp ? 4 : 18,
    ]
    const w = 60
    const h = 22
    const step = w / (points.length - 1)
    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${p.toFixed(1)}`)
      .join(' ')

    return (
      <svg className="w-16 h-5.5 overflow-visible" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <path
          d={d}
          fill="none"
          stroke={isUp ? '#10b981' : '#ef4444'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // Currency helper: shows ₹ for Indian stocks and $ for NASDAQ stocks
  const formatStockPrice = (stock: StockQuote) => {
    const isUSD = stock.exchange === 'NASDAQ'
    const symbol = isUSD ? '$' : '₹'
    const val = Number(stock.currentPrice).toLocaleString(isUSD ? 'en-US' : 'en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return `${symbol}${val}`
  }

  const formatStockRange = (stock: StockQuote) => {
    const isUSD = stock.exchange === 'NASDAQ'
    const symbol = isUSD ? '$' : '₹'
    return {
      low: `${symbol}${Number(stock.dayLow).toFixed(0)}`,
      high: `${symbol}${Number(stock.dayHigh).toFixed(0)}`,
    }
  }

  // Handle CTA action
  const handlePrimaryCTA = () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else if (onOpenRegister) {
      onOpenRegister()
    } else {
      navigate('/register')
    }
  }

  return (
    <div className="space-y-12 select-none">
      {/* =========================================================================
          HERO BANNER: Clean, Spacious, Trading-Focused Headline
         ========================================================================= */}
      <section className="pt-2 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] font-sans">
            Trade Smarter. Build Your Portfolio.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
            Real-time simulated equity trading across Indian and global markets. Track market depth, analyze interactive charts, and test execution strategies.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 font-mono">
          <button
            onClick={handlePrimaryCTA}
            className="px-6 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
          >
            <span>Start Trading</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <Link
            to="/markets"
            className="px-5 py-2.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-[#0e1526] dark:hover:bg-[#16223b] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#1e2c47] font-semibold text-sm transition-colors"
          >
            Explore Markets
          </Link>
        </div>
      </section>

      {/* =========================================================================
          HERO / MARKET OVERVIEW (Primary Visual Reference: TradingView composition)
         ========================================================================= */}
      <section className="space-y-3">
        {/* Section title matches "Market summary >" from TradingView reference */}
        <div className="flex items-center gap-1.5">
          <Link
            to="/markets"
            className="group inline-flex items-center gap-1 text-lg sm:text-xl font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <span>Market summary</span>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Two-panel Grid Layout (matches TradingView composition) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* LEFT PANEL: Large Interactive Market Chart (~66% width) */}
          <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] p-5 shadow-sm transition-colors duration-200 flex flex-col justify-between">
            {/* Chart Header Bar: Circle Icon, Symbol, Pill, Price, Change, Timeframe Filter */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-[#162033]">
              <div className="flex items-center gap-3">
                {/* Circular Badge (e.g. "50", "BSE", "100") */}
                <div
                  className={`h-11 w-11 rounded-full ${activeIndex.badgeBg} text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0`}
                >
                  {activeIndex.badgeText}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {activeIndex.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                      {activeIndex.subTicker}
                    </span>
                  </div>

                  {/* Price & Change indicator */}
                  <div className="flex items-baseline gap-2 mt-0.5 font-mono">
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {activeIndex.value}
                    </span>
                    <span className="text-xs text-slate-500 uppercase">POINT</span>
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        activeIndex.isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'
                      }`}
                    >
                      {activeIndex.changePct}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeframe Filter Buttons (1D, 1W, 1M, 1Y) */}
              <div className="flex items-center p-0.5 rounded bg-slate-100 dark:bg-[#080d18] border border-slate-200 dark:border-[#1c273c] font-mono">
                {(['1D', '1W', '1M', '1Y'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                      chartTimeframe === tf
                        ? 'bg-white dark:bg-[#1a253d] text-blue-600 dark:text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Interactive Chart Canvas */}
            <div className="relative pt-4 flex-1 min-h-[220px]">
              {/* Floating Crosshair Price Badge */}
              {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
                <div className="absolute top-2 left-6 z-10 bg-white/95 dark:bg-[#080d18]/95 border border-slate-200 dark:border-[#1c273c] px-2.5 py-1 rounded text-[11px] font-mono text-slate-700 dark:text-slate-300 pointer-events-none shadow-sm">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {chartPoints[hoveredPointIndex].time}:{' '}
                  </span>
                  <span
                    className={
                      activeIndex.isUp
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'text-rose-600 dark:text-rose-500 font-bold'
                    }
                  >
                    {chartPoints[hoveredPointIndex].price.toFixed(2)}
                  </span>
                </div>
              )}

              <svg
                viewBox="0 0 740 260"
                className="w-full h-56 sm:h-64 cursor-crosshair overflow-visible select-none"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const mouseX = ((e.clientX - rect.left) / rect.width) * 740
                  let nearest = 0
                  let minDiff = Infinity
                  chartPoints.forEach((pt, i) => {
                    const diff = Math.abs(pt.x - mouseX)
                    if (diff < minDiff) {
                      minDiff = diff
                      nearest = i
                    }
                  })
                  setHoveredPointIndex(nearest)
                }}
                onMouseLeave={() => setHoveredPointIndex(null)}
              >
                <defs>
                  {/* Green Area Gradient */}
                  <linearGradient id="tvChartGainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  {/* Red Area Gradient */}
                  <linearGradient id="tvChartLossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle Horizontal Reference Grid Lines */}
                <line x1="24" y1="65" x2="716" y2="65" stroke="currentColor" className="text-slate-100 dark:text-[#141d2f]" strokeDasharray="3 3" />
                <line x1="24" y1="125" x2="716" y2="125" stroke="currentColor" className="text-slate-100 dark:text-[#141d2f]" strokeDasharray="3 3" />
                <line x1="24" y1="185" x2="716" y2="185" stroke="currentColor" className="text-slate-100 dark:text-[#141d2f]" strokeDasharray="3 3" />

                {/* Area Gradient Fill */}
                <path
                  d={areaD}
                  fill={activeIndex.isUp ? 'url(#tvChartGainGrad)' : 'url(#tvChartLossGrad)'}
                />

                {/* Main Curve Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={activeIndex.isUp ? '#10b981' : '#ef4444'}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Active Hover Crosshair Line */}
                {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
                  <g>
                    <line
                      x1={chartPoints[hoveredPointIndex].x}
                      y1="20"
                      x2={chartPoints[hoveredPointIndex].x}
                      y2="228"
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={chartPoints[hoveredPointIndex].x}
                      cy={chartPoints[hoveredPointIndex].y}
                      r="4"
                      fill={activeIndex.isUp ? '#10b981' : '#ef4444'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                )}

                {/* X-Axis Timestamps (09:15, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00) */}
                {['09:15', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'].map((time, idx, arr) => {
                  const xPos = 24 + (idx / (arr.length - 1)) * (740 - 48)
                  return (
                    <text
                      key={time}
                      x={xPos}
                      y="250"
                      textAnchor={idx === 0 ? 'start' : idx === arr.length - 1 ? 'end' : 'middle'}
                      className="fill-slate-400 dark:fill-slate-500 font-mono text-[10px]"
                    >
                      {time}
                    </text>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* RIGHT PANEL: Major Indices Summary Panel (~34% width) */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] p-5 shadow-sm transition-colors duration-200 flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Major indices
              </h2>

              {/* Vertical list of Major Indices (matches TradingView screenshot) */}
              <div className="divide-y divide-slate-100 dark:divide-[#162033] mt-2">
                {majorIndices.map((idx) => {
                  const isSelected = activeIndex.id === idx.id
                  return (
                    <div
                      key={idx.id}
                      onClick={() => setActiveIndex(idx)}
                      className={`py-2.5 px-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-[#152037]'
                          : 'hover:bg-slate-50 dark:hover:bg-[#101728]'
                      }`}
                    >
                      {/* Left: Badge & Symbol Info */}
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8 w-8 rounded-full ${idx.badgeBg} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs`}
                        >
                          {idx.badgeText}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {idx.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                            {idx.subTicker}
                          </div>
                        </div>
                      </div>

                      {/* Right: Value & % Change */}
                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                          {idx.value} <span className="text-[9px] text-slate-400 font-normal">POINT</span>
                        </div>
                        <div
                          className={`text-[11px] font-bold tabular-nums ${
                            idx.isUp
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-500'
                          }`}
                        >
                          {idx.changePct}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom link: "See all major indices >" */}
            <div className="pt-2 border-t border-slate-100 dark:border-[#162033]">
              <Link
                to="/markets"
                className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>See all major indices</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: POPULAR STOCKS SECTION (`#stocks-section`)
         ========================================================================= */}
      <section id="stocks-section" className="space-y-5 pt-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Popular stocks
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Top Indian and global equities with live quotes and technical mini-charts.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center p-0.5 rounded bg-slate-100 dark:bg-[#0c1220] border border-slate-200 dark:border-[#1c2638]">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-[#1a253d] text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#1a253d] text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={fetchStocks}
              disabled={loading}
              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#0c1220] dark:hover:bg-[#162035] border border-slate-200 dark:border-[#1c2638] text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              title="Refresh Quotes"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search & Filter Pills Toolbar */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              id="landing-stock-search"
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stocks (RELIANCE, TCS, AAPL)..."
              className="w-full bg-slate-50 dark:bg-[#080d18] border border-slate-200 dark:border-[#1c273c] rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono scrollbar-none">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'NSE', label: 'NSE (India)' },
              { id: 'NASDAQ', label: 'NASDAQ (US)' },
              { id: 'TECH', label: 'Technology' },
              { id: 'FINANCE', label: 'Financials' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setActiveFilter(pill.id as MarketFilter)}
                className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  activeFilter === pill.id
                    ? 'bg-blue-600 text-white font-medium shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#080d18] text-slate-600 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-[#1c2638]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Cards View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {filteredStocks.map((stock) => {
              const isUp = stock.changeAmount >= 0
              const formattedPrice = formatStockPrice(stock)
              const range = formatStockRange(stock)
              const rangePct = Math.min(
                100,
                Math.max(
                  10,
                  ((Number(stock.currentPrice) - Number(stock.dayLow)) /
                    (Number(stock.dayHigh) - Number(stock.dayLow) || 1)) *
                    100
                )
              )

              return (
                <div
                  key={stock.symbol}
                  onClick={() => navigate(`/markets/${stock.symbol}`)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] hover:border-blue-400 dark:hover:border-slate-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    {/* Symbol & Exchange */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {stock.symbol}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                          {stock.exchange}
                        </span>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                          isUp
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-300 truncate mt-1 font-sans">
                      {stock.name}
                    </div>
                  </div>

                  {/* Price & Sparkline */}
                  <div className="my-2 pt-2 border-t border-slate-100 dark:border-[#162033] flex items-baseline justify-between">
                    <div>
                      <div className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {formattedPrice}
                      </div>
                      <div
                        className={`text-[10px] font-semibold tabular-nums ${
                          isUp
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {stock.changeAmount.toFixed(2)}
                      </div>
                    </div>

                    <div>{renderSparkline(stock.symbol, isUp)}</div>
                  </div>

                  {/* Day Range Progress Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-[#141d2c] space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-[#182336] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 dark:bg-slate-400 rounded-full"
                        style={{ width: `${rangePct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-400 tabular-nums">
                      <span>L: {range.low}</span>
                      <span>H: {range.high}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Stock Table View */}
        {viewMode === 'table' && (
          <div className="rounded-xl border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] overflow-x-auto font-mono shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#080d18] border-b border-slate-200 dark:border-[#1c2638] text-[10px] text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">SECURITY</th>
                  <th className="py-2.5 px-4 font-semibold">SECTOR</th>
                  <th className="py-2.5 px-4 font-semibold text-right">LTP</th>
                  <th className="py-2.5 px-4 font-semibold text-right">CHANGE</th>
                  <th className="py-2.5 px-4 font-semibold text-center w-28">DAY RANGE</th>
                  <th className="py-2.5 px-4 font-semibold text-right">VOLUME</th>
                  <th className="py-2.5 px-4 font-semibold text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#162033]">
                {filteredStocks.map((stock) => {
                  const isUp = stock.changeAmount >= 0
                  const formattedPrice = formatStockPrice(stock)
                  const range = formatStockRange(stock)

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => navigate(`/markets/${stock.symbol}`)}
                      className="hover:bg-slate-50 dark:hover:bg-[#11192e] transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {stock.symbol}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {stock.exchange}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans truncate max-w-[180px]">
                          {stock.name}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {stock.sector}
                      </td>

                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                        {formattedPrice}
                      </td>

                      <td className="py-2.5 px-4 text-right tabular-nums">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isUp
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                          }`}
                        >
                          {isUp ? '+' : ''}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <div className="w-full max-w-[100px] mx-auto text-[8px] text-slate-500">
                          <div className="flex justify-between mb-0.5">
                            <span>{range.low}</span>
                            <span>{range.high}</span>
                          </div>
                          <div className="h-1 w-full bg-slate-100 dark:bg-[#182336] rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: '50%' }} />
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                        {(stock.volume / 1000000).toFixed(2)}M
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <Link
                          to={`/markets/${stock.symbol}`}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white dark:bg-[#101b31] dark:hover:bg-blue-600 dark:text-blue-400 dark:hover:text-white border border-slate-200 dark:border-blue-500/30 text-[10px] font-bold transition-colors inline-block"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 5: FEATURES (Minimal: 3-4 clean user cards only, NOT technical)
         ========================================================================= */}
      <section id="features-section" className="space-y-6 pt-6 border-t border-slate-200 dark:border-[#162033]">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            Built for modern traders
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans">
            A focused paper trading workstation designed for disciplined market execution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
          {/* Card 1: Paper Trading */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs hover:border-blue-400 dark:hover:border-slate-500 transition-colors space-y-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Paper Trading</h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">
                Simulated order execution with real-time matching. Test strategies with virtual capital and zero risk.
              </p>
            </div>
          </div>

          {/* Card 2: Portfolio Tracking */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs hover:border-blue-400 dark:hover:border-slate-500 transition-colors space-y-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
              <PieChart className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Portfolio Tracking</h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">
                Real-time P&L mark-to-market, weighted average price accounting, and asset allocation breakdown.
              </p>
            </div>
          </div>

          {/* Card 3: Market Analysis */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs hover:border-blue-400 dark:hover:border-slate-500 transition-colors space-y-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20">
              <BarChart2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Market Analysis</h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">
                Multi-timeframe charting, technical candlestick patterns, volume indicators, and index breadth.
              </p>
            </div>
          </div>

          {/* Card 4: Risk Management */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs hover:border-blue-400 dark:hover:border-slate-500 transition-colors space-y-3">
            <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-500/20">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Risk Management</h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">
                Practice disciplined position sizing and drawdown controls without risking actual capital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FINAL CTA (Simple, non-excessive)
         ========================================================================= */}
      <section className="p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-[#1f2d47] bg-slate-50 dark:bg-gradient-to-b dark:from-[#0c1426] dark:to-[#070b14] text-center space-y-4">
        <div className="max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
            Ready to start trading?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
            Join traders analyzing live Indian and global equities, backtesting positions, and managing diversified portfolios.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 font-mono">
          <button
            onClick={handlePrimaryCTA}
            className="w-full sm:w-auto px-7 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start Trading</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <Link
            to="/markets"
            className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-white hover:bg-slate-100 dark:bg-[#0d1424] dark:hover:bg-[#152037] text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-[#1d2b45] font-semibold text-sm transition-colors text-center shadow-xs"
          >
            Explore Markets
          </Link>
        </div>
      </section>
    </div>
  )
}

export default LandingView
