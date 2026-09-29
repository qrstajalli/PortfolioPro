import React, { useState } from 'react'
import {
  FileText,
  CheckCircle2,
  XCircle
} from 'lucide-react'

export interface Transaction {
  id: string
  symbol: string
  name: string
  exchange: string
  side: 'BUY' | 'SELL'
  orderType: 'MARKET' | 'LIMIT'
  product: 'CNC' | 'MIS'
  quantity: number
  price: number
  totalValue: number
  status: 'EXECUTED' | 'CANCELLED' | 'PENDING'
  timestamp: string
}

export const RecentTransactions: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL')

  const transactions: Transaction[] = [
    {
      id: 'ORD-9824',
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd',
      exchange: 'NSE',
      side: 'BUY',
      orderType: 'MARKET',
      product: 'CNC',
      quantity: 5,
      price: 2910.0,
      totalValue: 14550.0,
      status: 'EXECUTED',
      timestamp: 'Today, 14:15:22 IST',
    },
    {
      id: 'ORD-9823',
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      exchange: 'NSE',
      side: 'BUY',
      orderType: 'LIMIT',
      product: 'CNC',
      quantity: 2,
      price: 4150.0,
      totalValue: 8300.0,
      status: 'EXECUTED',
      timestamp: 'Today, 11:32:04 IST',
    },
    {
      id: 'ORD-9822',
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      exchange: 'NASDAQ',
      side: 'BUY',
      orderType: 'MARKET',
      product: 'CNC',
      quantity: 15,
      price: 10248.0,
      totalValue: 153720.0,
      status: 'EXECUTED',
      timestamp: 'Yesterday, 20:45:10 IST',
    },
    {
      id: 'ORD-9821',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      side: 'SELL',
      orderType: 'LIMIT',
      product: 'CNC',
      quantity: 10,
      price: 19362.0,
      totalValue: 193620.0,
      status: 'EXECUTED',
      timestamp: '25 Sep, 21:10:00 IST',
    },
    {
      id: 'ORD-9820',
      symbol: 'INFY',
      name: 'Infosys Ltd',
      exchange: 'NSE',
      side: 'BUY',
      orderType: 'LIMIT',
      product: 'MIS',
      quantity: 20,
      price: 1850.0,
      totalValue: 37000.0,
      status: 'CANCELLED',
      timestamp: '24 Sep, 14:02:15 IST',
    },
  ]

  const filtered = transactions.filter((t) => {
    if (filter === 'BUY') return t.side === 'BUY'
    if (filter === 'SELL') return t.side === 'SELL'
    return true
  })

  return (
    <div className="rounded border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xs select-none transition-colors">
      {/* Header */}
      <div className="p-3 border-b border-slate-100 dark:border-[#182235] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Recent Transactions Ledger
          </span>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            ({filtered.length} entries)
          </span>
        </div>

        {/* Filter chips */}
        <div className="flex items-center p-0.5 rounded bg-slate-100 dark:bg-[#070b13] border border-slate-200 dark:border-[#1e2a3f]">
          {(['ALL', 'BUY', 'SELL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                filter === f
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Dense Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50 dark:bg-[#080d17] border-b border-slate-200 dark:border-[#1c2638] text-[10px] text-slate-500 dark:text-slate-400">
            <tr>
              <th className="py-2 px-3 font-semibold">ORDER ID</th>
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
                    {txn.quantity} @ ₹{txn.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Total Value */}
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                    ₹{txn.totalValue.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 text-center">
                    {isExecuted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-1.5 py-0.5 rounded font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> EXECUTED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 border border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 px-1.5 py-0.5 rounded font-semibold">
                        <XCircle className="h-3 w-3 text-rose-500" /> CANCELLED
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecentTransactions
