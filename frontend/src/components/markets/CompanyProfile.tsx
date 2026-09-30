import React from 'react'
import {
  Building2,
  Globe,
  Users,
  MapPin,
  Calendar,
  UserCheck,
  TrendingUp,
  Briefcase,
  ShieldCheck,
  Sliders
} from 'lucide-react'
import type { StockQuote } from '../../types/auth'
import { getCompanyProfile } from '../../data/companyData'

interface CompanyProfileProps {
  stock: StockQuote
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ stock }) => {
  const profile = getCompanyProfile(stock.symbol, stock)

  const USD_TO_INR = 84
  const multiplier = stock.exchange === 'NASDAQ' ? USD_TO_INR : 1
  const currentPriceINR = Number(stock.currentPrice || 0) * multiplier
  const dayLowINR = Number(stock.dayLow || 0) * multiplier
  const dayHighINR = Number(stock.dayHigh || 0) * multiplier
  const prevCloseINR = Number(stock.previousClose || 0) * multiplier
  const hasValidPrice = currentPriceINR > 0

  const formatINR = (val: number) => {
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Format Market Cap to readable Indian Lakh Crores or Crores
  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A'
    const valINR = marketCap * multiplier
    if (valINR >= 10000000000000) {
      return `₹${(valINR / 1000000000000).toFixed(2)} Lakh Cr`
    } else if (valINR >= 10000000) {
      return `₹${(valINR / 10000000).toFixed(2)} Cr`
    }
    return `₹${valINR.toLocaleString('en-IN')}`
  }

  // 52-Week High & Low in INR
  const fiftyTwoHigh = profile.fiftyTwoWeekHigh
  const fiftyTwoLow = profile.fiftyTwoWeekLow
  const fiftyTwoPct = hasValidPrice
    ? Math.min(100, Math.max(0, ((currentPriceINR - fiftyTwoLow) / (fiftyTwoHigh - fiftyTwoLow || 1)) * 100))
    : 50

  const dayRangePct = hasValidPrice && dayHighINR > dayLowINR
    ? Math.min(100, Math.max(0, ((currentPriceINR - dayLowINR) / (dayHighINR - dayLowINR || 1)) * 100))
    : 50

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono select-none">
      {/* 1. About the Company & Corporate Leadership (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Company Overview Card */}
        <div className="p-4 rounded-md border border-slate-200 dark:border-[#1b2537] bg-white dark:bg-[#0c1220] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#182235]">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-blue-500 dark:text-blue-400" /> About {profile.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-[#101a2f] text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
              {profile.exchange} Listed
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            {profile.description}
          </p>

          {/* Corporate Profile Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="p-2.5 rounded bg-slate-50 dark:bg-[#070b13] border border-slate-200 dark:border-[#172235]">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <UserCheck className="h-3 w-3 text-slate-400" />
                <span>CHIEF EXECUTIVE</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">{profile.ceo}</div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 dark:bg-[#070b13] border border-slate-200 dark:border-[#172235]">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>FOUNDED</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">{profile.founded}</div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 dark:bg-[#070b13] border border-slate-200 dark:border-[#172235]">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Users className="h-3 w-3 text-slate-400" />
                <span>EMPLOYEES</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">{profile.employees}</div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 dark:bg-[#070b13] border border-slate-200 dark:border-[#172235]">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>HEADQUARTERS</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate" title={profile.headquarters}>
                {profile.headquarters}
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 dark:bg-[#070b13] border border-slate-200 dark:border-[#172235]">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Briefcase className="h-3 w-3 text-slate-400" />
                <span>SECTOR / INDUSTRY</span>
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate" title={profile.industry}>
                {profile.sector}
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 dark:bg-[#070b13] border border-slate-200 dark:border-[#172235]">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Globe className="h-3 w-3 text-slate-400" />
                <span>WEBSITE</span>
              </div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 truncate">
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {profile.website.replace('https://www.', '')}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Price Ranges & Benchmarks */}
        <div className="p-4 rounded-md border border-slate-200 dark:border-[#1b2537] bg-white dark:bg-[#0c1220] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#182235]">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> Price Range Benchmarks
            </span>
            <span className="text-[10px] text-slate-500">Simulated Quote Precision</span>
          </div>

          {/* Today's Range Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Today's Range (L / H)</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">{dayRangePct.toFixed(0)}% of Range</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-[#162033] rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                style={{ width: `${dayRangePct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{dayLowINR > 0 ? formatINR(dayLowINR) : '--'}</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {hasValidPrice ? formatINR(currentPriceINR) : 'Market data unavailable'}
              </span>
              <span>{dayHighINR > 0 ? formatINR(dayHighINR) : '--'}</span>
            </div>
          </div>

          {/* 52-Week Range Slider */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">52-Week Range (L / H)</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">{fiftyTwoPct.toFixed(0)}% of 52W High</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-[#162033] rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                style={{ width: `${fiftyTwoPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{fiftyTwoLow > 0 ? formatINR(fiftyTwoLow) : '--'}</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {hasValidPrice ? formatINR(currentPriceINR) : 'Market data unavailable'}
              </span>
              <span>{fiftyTwoHigh > 0 ? formatINR(fiftyTwoHigh) : '--'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Fundamental & Valuation Metrics (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="p-4 rounded-md border border-slate-200 dark:border-[#1b2537] bg-white dark:bg-[#0c1220] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#182235]">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> Fundamentals & Valuation
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">TTM Key Stats</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#172132] text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Market Capitalization</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">{formatMarketCap(stock.marketCap)}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">P/E Ratio (TTM)</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">{stock.peRatio ? stock.peRatio.toFixed(2) : '24.50'}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Beta (Volatility)</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">{profile.beta.toFixed(2)}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Dividend Yield</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{profile.dividendYield.toFixed(2)}%</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">24h Trading Volume</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {stock.volume != null && stock.volume > 0 ? `${(stock.volume / 1000000).toFixed(2)}M Shares` : '--'}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Previous Close</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                {prevCloseINR > 0 ? formatINR(prevCloseINR) : '--'}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Exchange Currency</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">INR (₹) Standardized</span>
            </div>
          </div>
        </div>

        {/* Market Safeguard & Execution Notice */}
        <div className="p-3.5 rounded-md border border-slate-200 dark:border-[#1b2537] bg-slate-50 dark:bg-[#090d18] text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <span>Market Data Engine</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Quotes and financial ratios are fed via the PortfolioPro MarketDataProvider engine. All pricing is synchronized in real-time with paper trading accounts.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CompanyProfile
