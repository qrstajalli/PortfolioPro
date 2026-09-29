import React from 'react'
import { RecentTransactions } from './RecentTransactions'

export const OrdersView: React.FC = () => {
  return (
    <div className="space-y-4 font-mono select-none">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Total Orders Placed</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">5 Trades</div>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Executed Orders</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">4 Executed</div>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Cancelled / Expired</span>
          <div className="text-xl font-bold text-slate-600 dark:text-slate-400 mt-1">1 Cancelled</div>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Avg Fill Latency</span>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">8.4ms (Sim)</div>
        </div>
      </div>

      {/* Orders Ledger */}
      <RecentTransactions />
    </div>
  )
}

export default OrdersView
