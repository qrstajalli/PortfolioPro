import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react'
import type { StockQuote } from '../../types/auth'
import marketService from '../../services/marketService'
import HistoricalPriceChart from './HistoricalPriceChart'
import CompanyProfile from './CompanyProfile'

interface StockDetailPageProps {
  stock: StockQuote
  onBack: () => void
}

export const StockDetailPage: React.FC<StockDetailPageProps> = ({ stock: initialStock, onBack }) => {
  const [stock, setStock] = useState<StockQuote>(initialStock)

  // Fetch latest quote on detail page mount
  useEffect(() => {
    let isMounted = true
    marketService
      .getQuote(initialStock.symbol)
      .then((fresh) => {
        if (isMounted && fresh) {
          setStock(fresh)
        }
      })
      .catch((err) => {
        console.warn('Could not refresh live quote for detail page:', err.message)
      })

    return () => {
      isMounted = false
    }
  }, [initialStock.symbol])

  const USD_TO_INR = 84
  const multiplier = stock.exchange === 'NASDAQ' ? USD_TO_INR : 1
  const currentPriceINR = Number(stock.currentPrice || stock.price || 0) * multiplier
  const changeAmountINR = Number(stock.changeAmount || stock.change || 0) * multiplier
  const dayLowINR = Number(stock.dayLow || stock.currentPrice || 0) * multiplier
  const dayHighINR = Number(stock.dayHigh || stock.currentPrice || 0) * multiplier
  const isPositive = (stock.changeAmount ?? stock.change ?? 0) >= 0

  const formatINR = (val: number) => {
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div className="space-y-4 font-mono select-none animate-fade-in">
      {/* 1. Navigation & Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-[#1b2537]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white dark:bg-[#0e1526] hover:bg-slate-50 dark:hover:bg-[#16213a] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e2c47] shadow-xs transition-colors cursor-pointer text-xs font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Markets</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Markets</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-500 dark:text-slate-400">{stock.exchange}</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-900 dark:text-white font-bold">{stock.symbol}</span>
          </div>
        </div>

        {/* Status indicator: clearly label as delayed/latest available */}
        <div className="flex items-center gap-2 text-xs">
          {stock.isDelayed !== false ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold">
              <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <span>DELAYED / LATEST AVAILABLE {stock.timestamp ? `(${stock.timestamp})` : ''}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              LIVE MARKET DATA
            </span>
          )}
        </div>
      </div>

      {/* 2. Stock Banner Header */}
      <div className="p-4 rounded-md border border-slate-200 dark:border-[#1b2537] bg-white dark:bg-[#0c1220] shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Symbol, Company Name & Badges */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stock.symbol}
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 dark:bg-[#142036] text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              {stock.exchange}
            </span>
            {stock.sector && (
              <span className="px-2 py-0.5 rounded text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                {stock.sector}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 font-sans">
            {stock.company || stock.name} • Active Equity
          </div>
        </div>

        {/* Right: Price and Daily Change */}
        <div className="text-right space-y-1">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
            {formatINR(currentPriceINR)}
          </div>
          <div
            className={`text-xs font-bold tabular-nums flex items-center justify-end gap-1 ${
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>
              {isPositive ? '+' : ''}
              {formatINR(changeAmountINR)} ({isPositive ? '+' : ''}
              {stock.changePercent != null ? stock.changePercent.toFixed(2) : '0.00'}%)
            </span>
            <span className="text-slate-500 text-[10px] font-normal">
              {stock.timestamp ? stock.timestamp : 'Session'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Quick Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded bg-white dark:bg-[#090e1a] border border-slate-200 dark:border-[#182338] shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase">Day Range (L - H)</span>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-200 mt-1">
            {formatINR(dayLowINR)} - {formatINR(dayHighINR)}
          </div>
        </div>
        <div className="p-3 rounded bg-white dark:bg-[#090e1a] border border-slate-200 dark:border-[#182338] shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase">Trading Volume</span>
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stock.volume ? `${(stock.volume / 1000).toFixed(0)}k Shares` : 'N/A'}
          </div>
        </div>
        <div className="p-3 rounded bg-white dark:bg-[#090e1a] border border-slate-200 dark:border-[#182338] shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase">P/E Ratio</span>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-200 mt-1">
            {stock.peRatio ? stock.peRatio.toFixed(2) : '--'}
          </div>
        </div>
        <div className="p-3 rounded bg-white dark:bg-[#090e1a] border border-slate-200 dark:border-[#182338] shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase">Currency</span>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stock.currency || 'INR'}
          </div>
        </div>
      </div>

      {/* 4. Interactive Historical Price Chart (real OHLCV candles) */}
      <HistoricalPriceChart stock={stock} />

      {/* 5. Basic Company Information & Fundamentals */}
      <CompanyProfile stock={stock} />
    </div>
  )
}

export default StockDetailPage
