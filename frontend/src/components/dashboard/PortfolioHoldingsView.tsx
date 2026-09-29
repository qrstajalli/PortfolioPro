import React from 'react'
import { Briefcase } from 'lucide-react'

export interface HoldingItem {
  symbol: string
  name: string
  exchange: string
  quantity: number
  avgPrice: number
  currentPrice: number
  investedValue: number
  currentValue: number
  pnl: number
  pnlPercent: number
  allocation: number
}

export const PortfolioHoldingsView: React.FC = () => {
  const holdings: HoldingItem[] = [
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd',
      exchange: 'NSE',
      quantity: 5,
      avgPrice: 2910.0,
      currentPrice: 2980.5,
      investedValue: 14550.0,
      currentValue: 14902.5,
      pnl: 352.5,
      pnlPercent: 2.42,
      allocation: 33.2,
    },
    {
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      exchange: 'NSE',
      quantity: 2,
      avgPrice: 4150.0,
      currentPrice: 4210.75,
      investedValue: 8300.0,
      currentValue: 8421.5,
      pnl: 121.5,
      pnlPercent: 1.46,
      allocation: 18.8,
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      exchange: 'NASDAQ',
      quantity: 2,
      avgPrice: 10248.0,
      currentPrice: 10785.6,
      investedValue: 20496.0,
      currentValue: 21571.2,
      pnl: 1075.2,
      pnlPercent: 5.25,
      allocation: 48.0,
    },
  ]

  const totalInvested = holdings.reduce((acc, h) => acc + h.investedValue, 0)
  const totalCurrent = holdings.reduce((acc, h) => acc + h.currentValue, 0)
  const totalPnL = totalCurrent - totalInvested
  const totalPnLPct = (totalPnL / totalInvested) * 100

  return (
    <div className="space-y-4 select-none font-mono">
      {/* Holdings Header Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Total Holdings Value</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">₹{totalCurrent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Total Cost Basis</span>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-300 mt-1 tabular-nums">₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Unrealized P&L</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            +₹{totalPnL.toFixed(2)} (+{totalPnLPct.toFixed(2)}%)
          </div>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Position Count</span>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{holdings.length} Securities</div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] overflow-hidden shadow-xs transition-colors">
        <div className="p-3 border-b border-slate-100 dark:border-[#182235] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Active Simulated Positions
          </span>
          <span className="text-[10px] text-slate-500">WAP Precision Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#080d17] border-b border-slate-200 dark:border-[#1c2638] text-[10px] text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2 px-3 font-semibold">SECURITY</th>
                <th className="py-2 px-3 font-semibold text-right">QTY</th>
                <th className="py-2 px-3 font-semibold text-right">AVG BUY (WAP)</th>
                <th className="py-2 px-3 font-semibold text-right">LTP</th>
                <th className="py-2 px-3 font-semibold text-right">CURR VALUE</th>
                <th className="py-2 px-3 font-semibold text-right">P&L (INR)</th>
                <th className="py-2 px-3 font-semibold text-right">NET RETURN</th>
                <th className="py-2 px-3 font-semibold text-center w-28">WEIGHT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#172033]">
              {holdings.map((h) => {
                const isGain = h.pnl >= 0
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
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">{h.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400">₹{h.avgPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">₹{h.currentPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">₹{h.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isGain ? '+' : ''}₹{h.pnl.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isGain ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-transparent' : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-transparent'}`}>
                        {isGain ? '+' : ''}{h.pnlPercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="w-full">
                        <div className="h-1.5 bg-slate-100 dark:bg-[#182236] rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${h.allocation}%` }} />
                        </div>
                        <span className="text-[9px] text-slate-500 mt-0.5 block">{h.allocation}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PortfolioHoldingsView
