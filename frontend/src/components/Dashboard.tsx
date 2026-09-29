import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import type { StockQuote, ApiResponse } from '../types/auth'
import Sidebar, { type DashboardTab } from './dashboard/Sidebar'
import TopBar from './dashboard/TopBar'
import PortfolioMetrics from './dashboard/PortfolioMetrics'
import PerformanceChart from './dashboard/PerformanceChart'
import MarketOverview from './dashboard/MarketOverview'
import WatchlistSection from './dashboard/WatchlistSection'
import RecentTransactions from './dashboard/RecentTransactions'
import PortfolioHoldingsView from './dashboard/PortfolioHoldingsView'
import OrdersView from './dashboard/OrdersView'
import AnalysisView from './dashboard/AnalysisView'
import MarketsModule from './markets/MarketsModule'

export const Dashboard: React.FC = () => {
  const { wallet } = useAuth()
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [stocks, setStocks] = useState<StockQuote[]>([])
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null)

  // Fetch stocks from backend market API
  useEffect(() => {
    api
      .get<ApiResponse<StockQuote[]>>('/market/stocks')
      .then((res) => {
        if (res.data?.data) {
          setStocks(res.data.data)
          if (res.data.data.length > 0) {
            setSelectedStock(res.data.data[0])
          }
        }
      })
      .catch((err) => console.error('Failed to load market stocks in dashboard:', err))
  }, [])

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 font-sans antialiased overflow-x-hidden transition-colors">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. Main Terminal Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#080c14] transition-colors">
        {/* Top Bar: Stock Search, Market Status, User/Account */}
        <TopBar
          stocks={stocks}
          onSelectStock={(stock) => {
            setSelectedStock(stock)
            if (activeTab !== 'dashboard' && activeTab !== 'watchlist' && activeTab !== 'markets') {
              setActiveTab('watchlist')
            }
          }}
        />

        {/* Workstation Content Area */}
        <main className="flex-1 p-3.5 sm:p-4 space-y-4 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {/* TAB: DASHBOARD (Default high-density overview) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-fade-in">
              {/* Main Area: Portfolio Value, Available Cash, Today's P&L */}
              <PortfolioMetrics
                wallet={wallet}
                investedAmount={22850.0}
                holdingsValue={24325.0}
                todayChangeAmount={1475.0}
                todayChangePercent={1.21}
              />

              {/* Grid: Performance Chart (8 cols) + Market Overview (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
                <div className="lg:col-span-8">
                  <PerformanceChart />
                </div>
                <div className="lg:col-span-4 space-y-2.5">
                  <MarketOverview
                    stocks={stocks}
                    onSelectStock={(stock) => setSelectedStock(stock)}
                  />
                </div>
              </div>

              {/* Watchlist Section */}
              <WatchlistSection
                stocks={stocks}
                selectedStock={selectedStock}
                onSelectStock={(stock) => setSelectedStock(stock)}
              />

              {/* Recent Transactions Section */}
              <RecentTransactions />
            </div>
          )}

          {/* TAB: MARKETS */}
          {activeTab === 'markets' && (
            <div className="space-y-4 animate-fade-in">
              <MarketsModule
                initialSymbol={selectedStock?.symbol}
                onStockSelect={(stock) => setSelectedStock(stock)}
              />
            </div>
          )}

          {/* TAB: WATCHLIST */}
          {activeTab === 'watchlist' && (
            <div className="space-y-4 animate-fade-in">
              <WatchlistSection
                stocks={stocks}
                selectedStock={selectedStock}
                onSelectStock={(stock) => setSelectedStock(stock)}
              />
            </div>
          )}

          {/* TAB: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4 animate-fade-in">
              <PortfolioMetrics
                wallet={wallet}
                investedAmount={22850.0}
                holdingsValue={24325.0}
                todayChangeAmount={1475.0}
                todayChangePercent={1.21}
              />
              <PortfolioHoldingsView />
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-fade-in">
              <OrdersView />
            </div>
          )}

          {/* TAB: ANALYSIS */}
          {activeTab === 'analysis' && (
            <div className="space-y-4 animate-fade-in">
              <PerformanceChart />
              <AnalysisView />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard
