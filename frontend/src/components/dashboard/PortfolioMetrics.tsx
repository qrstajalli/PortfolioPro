import React from 'react'
import {
  Wallet as WalletIcon,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import type { Wallet, Portfolio } from '../../types/auth'

interface PortfolioMetricsProps {
  wallet?: Wallet | null
  portfolio?: Portfolio | null
  investedAmount?: number
  holdingsValue?: number
  activePositions?: number
  unrealizedPnL?: number
  unrealizedPnLPercent?: number
  todayChangeAmount?: number
  todayChangePercent?: number
  currency?: string
  onOpenSetupCapital?: () => void
}

export const PortfolioMetrics: React.FC<PortfolioMetricsProps> = ({
  wallet,
  portfolio,
  investedAmount,
  holdingsValue,
  activePositions,
  unrealizedPnL,
  unrealizedPnLPercent,
  todayChangeAmount,
  todayChangePercent,
  currency,
  onOpenSetupCapital,
}) => {
  // Real calculations backed strictly by database portfolio & wallet data
  const curr = currency || portfolio?.currency || wallet?.currency || 'INR'
  const isUSD = curr === 'USD'
  const sym = isUSD ? '$' : '₹'
  const locale = isUSD ? 'en-US' : 'en-IN'

  const cashBalance = wallet != null
    ? Number(wallet.balance || 0)
    : (portfolio != null ? Number(portfolio.cashBalance || 0) : 0)

  // Invested value = actual holdings market value
  const actualInvestedValue = holdingsValue ?? (portfolio != null ? Number(portfolio.investedValue || 0) : (investedAmount ?? 0))
  const actualPositions = activePositions ?? (portfolio != null ? (portfolio.activePositions ?? portfolio.holdings?.length ?? 0) : 0)

  // Net Worth = actual cash + actual holdings market value
  const totalNetWorth = cashBalance + actualInvestedValue

  // P&L = actual holdings/trading data
  const pnl = unrealizedPnL ?? (portfolio != null ? Number(portfolio.unrealizedPnL || 0) : 0)
  const pnlPct = unrealizedPnLPercent ?? (portfolio != null ? Number(portfolio.unrealizedPnLPercent || 0) : 0)

  // Today's P&L: if user has no positions or has never traded, 0
  const todayAmount = actualPositions > 0 ? (todayChangeAmount ?? 0) : 0
  const todayPct = actualPositions > 0 ? (todayChangePercent ?? 0) : 0
  const isTodayPositive = todayAmount >= 0
  const isOverallPositive = pnl >= 0

  const formatCurrency = (val: number) => {
    return `${sym}${Number(val).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono select-none">
      {/* 1. Total Portfolio Net Worth */}
      <div className="p-3.5 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="uppercase tracking-wider">Total Net Worth</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 font-semibold">
            CASH + EQUITIES
          </span>
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatCurrency(totalNetWorth)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 dark:text-slate-500">Unrealized:</span>
            {actualPositions > 0 ? (
              <span
                className={`font-semibold flex items-center gap-0.5 ${
                  isOverallPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isOverallPositive ? '+' : ''}
                {formatCurrency(pnl)} ({isOverallPositive ? '+' : ''}
                {pnlPct.toFixed(2)}%)
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                {formatCurrency(0)} (0.00%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Available Cash / Buying Power */}
      <div className="p-3.5 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="uppercase tracking-wider flex items-center gap-1.5">
            <WalletIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Available Cash
          </span>
          {onOpenSetupCapital && (
            <button
              onClick={onOpenSetupCapital}
              className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 dark:border-blue-500/20 font-medium transition-colors cursor-pointer"
            >
              Adjust Capital
            </button>
          )}
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
            {formatCurrency(cashBalance)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Starting: {formatCurrency(wallet?.initialBalance ?? cashBalance)}</span>
            <span>{curr}</span>
          </div>
        </div>
      </div>

      {/* 3. Today's P&L */}
      <div className="p-3.5 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="uppercase tracking-wider">Today's P&L</span>
          {actualPositions > 0 ? (
            <span
              className={`text-[10px] px-1 py-0.2 rounded font-semibold flex items-center gap-0.5 ${
                isTodayPositive
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25'
                  : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
              }`}
            >
              {isTodayPositive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
              {isTodayPositive ? '+' : ''}
              {todayPct.toFixed(2)}%
            </span>
          ) : (
            <span className="text-[10px] px-1 py-0.2 rounded font-semibold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
              0.00%
            </span>
          )}
        </div>
        <div className="mt-2">
          <div
            className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${
              actualPositions === 0
                ? 'text-slate-900 dark:text-white'
                : isTodayPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {actualPositions > 0 && isTodayPositive ? '+' : ''}
            {formatCurrency(todayAmount)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Intraday change</span>
            <span className="text-slate-500 dark:text-slate-400">{actualPositions > 0 ? 'Live MTM' : 'No positions'}</span>
          </div>
        </div>
      </div>

      {/* 4. Active Invested Holdings */}
      <div className="p-3.5 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="uppercase tracking-wider flex items-center gap-1.5">
            <PieChart className="h-3 w-3 text-blue-600 dark:text-blue-400" /> Invested Value
          </span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50">
            {actualPositions} {actualPositions === 1 ? 'ACTIVE POS' : 'ACTIVE POS'}
          </span>
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatCurrency(actualInvestedValue)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Market Val: {formatCurrency(actualInvestedValue)}</span>
            {actualPositions > 0 ? (
              <span className={`font-semibold ${isOverallPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isOverallPositive ? '+' : ''}{pnlPct.toFixed(1)}%
              </span>
            ) : (
              <span className="text-slate-400">0.0%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioMetrics
