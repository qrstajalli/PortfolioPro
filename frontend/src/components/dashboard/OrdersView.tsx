import React from 'react'
import { RecentTransactions } from './RecentTransactions'
import type { Order, Transaction } from '../../types/auth'

interface OrdersViewProps {
  orders?: Order[]
  transactions?: Transaction[]
  currency?: string
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders = [],
  transactions = [],
  currency = 'INR',
}) => {
  const totalCount = orders.length > 0 ? orders.length : transactions.length
  const executedCount = orders.length > 0
    ? orders.filter((o) => o.orderStatus === 'EXECUTED').length
    : transactions.length
  const cancelledCount = orders.filter((o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'REJECTED').length

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Total Orders Placed</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {totalCount} {totalCount === 1 ? 'Trade' : 'Trades'}
          </div>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Executed Orders</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {executedCount} Executed
          </div>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Cancelled / Expired</span>
          <div className="text-xl font-bold text-slate-600 dark:text-slate-400 mt-1">
            {cancelledCount} Cancelled
          </div>
        </div>
        <div className="p-3 rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs transition-colors">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Avg Fill Latency</span>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {totalCount > 0 ? '< 50ms' : '--'}
          </div>
        </div>
      </div>

      {/* Orders Ledger */}
      <RecentTransactions orders={orders} transactions={transactions} currency={currency} />
    </div>
  )
}

export default OrdersView
