import React from 'react'
import {
  PieChart,
  CheckCircle2
} from 'lucide-react'

export const AnalysisView: React.FC = () => {
  const riskMetrics = [
    { label: 'Sharpe Ratio', val: '2.18', status: 'Excellent', desc: 'Risk-adjusted return vs 10Y G-Sec' },
    { label: 'Portfolio Beta', val: '0.88', status: 'Low Volatility', desc: 'Relative sensitivity to NIFTY 50' },
    { label: 'Max Drawdown', val: '-1.24%', status: 'Guarded', desc: 'Peak-to-trough simulated drawdown' },
    { label: 'Win/Loss Ratio', val: '3.0x', status: 'Profitable', desc: '3 winning trades vs 1 cancelled' },
  ]

  const sectorAllocation = [
    { sector: 'Energy & Industrials', pct: 61.2, val: '₹14,902.50', color: 'bg-emerald-500' },
    { sector: 'Information Technology', pct: 34.6, val: '₹8,421.50', color: 'bg-blue-500' },
    { sector: 'Semiconductors (US)', pct: 4.2, val: '₹1,926.00', color: 'bg-indigo-500' },
  ]

  return (
    <div className="space-y-4 font-mono select-none">
      {/* 1. Quantitative Risk Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {riskMetrics.map((m) => (
          <div key={m.label} className="p-3.5 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span className="uppercase">{m.label}</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                {m.status}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{m.val}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{m.desc}</div>
          </div>
        ))}
      </div>

      {/* 2. Sector Allocation Breakdown */}
      <div className="p-4 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#182235]">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <PieChart className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" /> Sector Diversification & Capital Weighting
          </span>
          <span className="text-[10px] text-slate-500">3 Sectors Active</span>
        </div>

        {/* Stacked allocation bar */}
        <div className="mt-4">
          <div className="h-3 w-full bg-slate-200 dark:bg-[#182236] rounded-full overflow-hidden flex">
            {sectorAllocation.map((s) => (
              <div
                key={s.sector}
                className={`h-full ${s.color}`}
                style={{ width: `${s.pct}%` }}
                title={`${s.sector}: ${s.pct}%`}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {sectorAllocation.map((s) => (
              <div key={s.sector} className="p-2.5 rounded bg-slate-50 dark:bg-[#070b13] border border-slate-200 dark:border-[#1e2a3f]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{s.sector}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{s.pct}%</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Mathematical Engine Integrity */}
      <div className="p-3.5 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-sm dark:shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          <div>
            <div className="font-bold text-slate-900 dark:text-white">BigDecimal Strict Precision Math</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Zero IEEE-754 floating point drift on all buy/sell weighted averages.</div>
          </div>
        </div>
        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-[#080d18] border border-slate-200 dark:border-[#1c2638] text-[10px] text-blue-600 dark:text-blue-400">
          RoundingMode.HALF_UP
        </span>
      </div>
    </div>
  )
}

export default AnalysisView
