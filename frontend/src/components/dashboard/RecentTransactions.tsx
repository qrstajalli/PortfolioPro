import React, { useState } from 'react'
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'
import type { Transaction, Order } from '../../types/auth'

interface RecentTransactionsProps {
  transactions?: Transaction[]
  orders?: Order[]
  currency?: string
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions = [],
  orders = [],
  currency = 'INR',
}) => {
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL')

  const isUSD = currency === 'USD'
  const sym = isUSD ? '$' : '₹'
  const locale = isUSD ? 'en-US' : 'en-IN'

  const formatCurrency = (val: number | undefined | null) => {
    return `${sym}${Number(val || 0).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // Combine or prefer transactions/orders list
  const displayItems = transactions.length > 0
    ? transactions.map((t) => ({
        id: t.transactionReference || `TXN-${t.id}`,
        symbol: t.symbol,
        name: t.name || t.symbol,
        exchange: t.exchange || 'NASDAQ',
        side: (t.type === 'SELL' ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
        orderType: 'MARKET',
        product: 'CNC',
        quantity: t.quantity || 1,
        price: t.price || 0,
        totalValue: t.amount || 0,
        status: 'EXECUTED',
        timestamp: t.transactionTime ? new Date(t.transactionTime).toLocaleString() : '--',
      }))
    : orders.map((o) => ({
        id: o.orderNumber || `ORD-${o.id}`,
        symbol: o.symbol,
        name: o.name || o.symbol,
        exchange: o.exchange || 'NASDAQ',
        side: (o.side === 'SELL' ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
        orderType: o.orderType || 'MARKET',
        product: 'CNC',
        quantity: o.quantity || 0,
        price: o.executionPrice || 0,
        totalValue: o.totalAmount || 0,
        status: o.orderStatus || 'PENDING',
        timestamp: o.createdAt ? new Date(o.createdAt).toLocaleString() : '--',
      }))

  const filtered = displayItems.filter((t) => {
    if (filter === 'BUY') return t.side === 'BUY'
    if (filter === 'SELL') return t.side === 'SELL'
    return true
  })

  return (
    <div className="rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs select-none transition-colors font-mono">
      {/* Header */}
      <div className="p-3 border-b border-slate-100 dark:border-[#182235] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Recent Transactions Ledger
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            ({displayItems.length} {displayItems.length === 1 ? 'entry' : 'entries'})
          </span>
        </div>

        {/* Filter chips */}
        {displayItems.length > 0 && (
          <div className="flex items-center p-0.5 rounded bg-slate-100 dark:bg-[#070b13] border border-slate-200 dark:border-[#1e2a3f]">
            {(['ALL', 'BUY', 'SELL'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                  filter === f
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {displayItems.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="inline-flex p-3 rounded-full bg-slate-100 dark:bg-[#131d2e] text-slate-400 dark:text-slate-500 mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">No Transactions Yet</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No transactions recorded yet — your trading activity and order history will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#080d17] border-b border-slate-200 dark:border-[#1c2638] text-[10px] text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2 px-3 font-semibold">REFERENCE ID</th>
                <th className="py-2 px-3 font-semibold">TIMESTAMP</th>
                <th className="py-2 px-3 font-semibold">SECURITY</th>
                <th className="py-2 px-3 font-semibold text-center">SIDE</th>
                <th className="py-2 px-3 font-semibold">TYPE</th>
                <th className="py-2 px-3 font-semibold text-right">QTY & PRICE</th>
                <th className="py-2 px-3 font-semibold text-right">TOTAL AMOUNT</th>
                <th className="py-2 px-3 font-semibold text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#172033]">
              {filtered.map((txn) => {
                const isBuy = txn.side === 'BUY'
                const isExecuted = txn.status === 'EXECUTED'
                const isCancelled = txn.status === 'CANCELLED'

                return (
                  <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-[#11192e] transition-colors">
                    {/* Order ID */}
                    <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                      {txn.id}
                    </td>

                    {/* Timestamp */}
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {txn.timestamp}
                    </td>

                    {/* Security */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">{txn.symbol}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                          {txn.exchange}
                        </span>
                      </div>
                    </td>

                    {/* Side */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isBuy
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25'
                            : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
                        }`}
                      >
                        {txn.side}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      {txn.orderType} • {txn.product}
                    </td>

                    {/* Qty & Price */}
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                      {txn.quantity} @ {formatCurrency(txn.price)}
                    </td>

                    {/* Total Value */}
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(txn.totalValue)}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center">
                      {isExecuted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> EXECUTED
                        </span>
                      ) : isCancelled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 border border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 px-1.5 py-0.5 rounded font-semibold">
                          <XCircle className="h-3 w-3 text-rose-500" /> CANCELLED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 px-1.5 py-0.5 rounded font-semibold">
                          <Clock className="h-3 w-3" /> {txn.status}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RecentTransactions
