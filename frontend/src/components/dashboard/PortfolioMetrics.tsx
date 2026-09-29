import React from 'react'
import {
  Wallet as WalletIcon,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import type { Wallet } from '../../types/auth'

interface PortfolioMetricsProps {
  wallet: Wallet | null
  investedAmount?: number
  holdingsValue?: number
  todayChangeAmount?: number
  todayChangePercent?: number
}

export const PortfolioMetrics: React.FC<PortfolioMetricsProps> = ({
  wallet,
  investedAmount = 22850.0,
  holdingsValue = 24325.0,
  todayChangeAmount = 1475.0,
  todayChangePercent = 1.21,
}) => {
  const cashBalance = wallet ? Number(wallet.balance) : 0.0
  const totalNetWorth = cashBalance + holdingsValue
  const overallPnL = holdingsValue - investedAmount
  const overallPnLPercent = investedAmount > 0 ? (overallPnL / investedAmount) * 100 : 0
  const isTodayPositive = todayChangeAmount >= 0
  const isOverallPositive = overallPnL >= 0

  const formatINR = (val: number) => {
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      {/* 1. Total Portfolio Net Worth */}
      <div className="p-3.5 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span className="uppercase tracking-wider">Total Net Worth</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 font-semibold">
            CASH + EQUITIES
          </span>
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatINR(totalNetWorth)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-slate-400 dark:text-slate-500">Unrealized:</span>
            <span
              className={`font-semibold flex items-center gap-0.5 ${
                isOverallPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isOverallPositive ? '+' : ''}
              {formatINR(overallPnL)} ({isOverallPositive ? '+' : ''}
              {overallPnLPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Available Cash / Buying Power */}
      <div className="p-3.5 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span className="uppercase tracking-wider flex items-center gap-1.5">
            <WalletIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Available Cash
          </span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 font-mono font-semibold">
            FREE MARGIN
          </span>
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
            {formatINR(cashBalance)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500">
            <span>Currency: {wallet?.currency || 'INR'}</span>
            <span>Version: v{wallet?.version ?? 0}</span>
          </div>
        </div>
      </div>

      {/* 3. Today's P&L */}
      <div className="p-3.5 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span className="uppercase tracking-wider">Today's P&L</span>
          <span
            className={`text-[10px] px-1 py-0.2 rounded font-mono font-semibold flex items-center gap-0.5 ${
              isTodayPositive
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25'
                : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
            }`}
          >
            {isTodayPositive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
            {isTodayPositive ? '+' : ''}
            {todayChangePercent.toFixed(2)}%
          </span>
        </div>
        <div className="mt-2">
          <div
            className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${
              isTodayPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isTodayPositive ? '+' : ''}
            {formatINR(todayChangeAmount)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500">
            <span>Intraday change</span>
            <span className="text-slate-500 dark:text-slate-400">Live MTM</span>
          </div>
        </div>
      </div>

      {/* 4. Active Invested Holdings */}
      <div className="p-3.5 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] flex flex-col justify-between shadow-xs transition-colors">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span className="uppercase tracking-wider flex items-center gap-1.5">
            <PieChart className="h-3 w-3 text-blue-600 dark:text-blue-400" /> Invested Value
          </span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50 font-mono">
            3 ACTIVE POS
          </span>
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatINR(investedAmount)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500">
            <span>Market Val: {formatINR(holdingsValue)}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{overallPnLPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioMetrics
