import React from 'react'
import { Briefcase } from 'lucide-react'
import type { Holding } from '../../types/auth'

interface PortfolioHoldingsViewProps {
  holdings?: Holding[]
  currency?: string
}

export const PortfolioHoldingsView: React.FC<PortfolioHoldingsViewProps> = ({
  holdings = [],
  currency = 'INR',
}) => {
  const isUSD = currency === 'USD'
  const sym = isUSD ? '$' : '₹'
  const locale = isUSD ? 'en-US' : 'en-IN'

  const formatCurrency = (val: number | undefined | null) => {
    return `${sym}${Number(val || 0).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const totalInvested = holdings.reduce((acc, h) => acc + (Number(h.totalInvested) || 0), 0)
  const totalCurrent = holdings.reduce((acc, h) => acc + (Number(h.currentValue) || 0), 0)
  const totalPnL = totalCurrent - totalInvested
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

  return (
    <div className="space-y-4 select-none font-mono">
      {/* Holdings Header Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Total Holdings Value</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatCurrency(totalCurrent)}
          </div>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Total Cost Basis</span>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-300 mt-1 tabular-nums">
            {formatCurrency(totalInvested)}
          </div>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Unrealized P&L</span>
          <div
            className={`text-xl font-bold mt-1 tabular-nums ${
              totalPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)} ({totalPnL >= 0 ? '+' : ''}
            {totalPnLPct.toFixed(2)}%)
          </div>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Position Count</span>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {holdings.length} {holdings.length === 1 ? 'Security' : 'Securities'}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] overflow-hidden shadow-xs transition-colors">
        <div className="p-3 border-b border-slate-100 dark:border-[#182235] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Active Positions
          </span>
          <span className="text-[10px] text-slate-500">Live Real Data</span>
        </div>

        {holdings.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-slate-100 dark:bg-[#131d2e] text-slate-400 dark:text-slate-500 mb-3">
              <Briefcase className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">No Positions Found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No holdings yet — your positions will appear here after your first trade.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#080d17] border-b border-slate-200 dark:border-[#1c2638] text-[10px] text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2 px-3 font-semibold">SECURITY</th>
                  <th className="py-2 px-3 font-semibold text-right">QTY</th>
                  <th className="py-2 px-3 font-semibold text-right">AVG BUY (WAP)</th>
                  <th className="py-2 px-3 font-semibold text-right">LTP</th>
                  <th className="py-2 px-3 font-semibold text-right">CURR VALUE</th>
                  <th className="py-2 px-3 font-semibold text-right">P&L</th>
                  <th className="py-2 px-3 font-semibold text-right">NET RETURN</th>
                  <th className="py-2 px-3 font-semibold text-center w-28">WEIGHT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#172033]">
                {holdings.map((h) => {
                  const isGain = Number(h.pnl || 0) >= 0
                  const hCurrency = h.currency || currency
                  const hIsUSD = hCurrency === 'USD'
                  const hSym = hIsUSD ? '$' : '₹'
                  const hLocale = hIsUSD ? 'en-US' : 'en-IN'

                  const fmt = (val: number | undefined | null) =>
                    `${hSym}${Number(val || 0).toLocaleString(hLocale, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`

                  return (
                    <tr key={h.symbol} className="hover:bg-slate-50 dark:hover:bg-[#11192e] transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">{h.symbol}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                            {h.exchange}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[130px]">{h.name}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                        {h.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400">
                        {fmt(h.averageBuyPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {fmt(h.currentPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                        {fmt(h.currentValue)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isGain ? '+' : ''}{fmt(h.pnl)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isGain
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-transparent'
                              : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-transparent'
                          }`}
                        >
                          {isGain ? '+' : ''}{Number(h.pnlPercent || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-full">
                          <div className="h-1.5 bg-slate-100 dark:bg-[#182236] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, Number(h.allocation || 0)))}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-500 mt-0.5 block">
                            {Number(h.allocation || 0).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default PortfolioHoldingsView
