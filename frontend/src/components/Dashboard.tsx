import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import portfolioService from '../services/portfolioService'
import watchlistService from '../services/watchlistService'
import tradeService from '../services/tradeService'
import type { StockQuote, ApiResponse, Portfolio, WatchlistItem, Order, Transaction } from '../types/auth'
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
import PortfolioSetupModal from './dashboard/PortfolioSetupModal'

export const Dashboard: React.FC = () => {
  const { wallet, refreshWallet } = useAuth()
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [stocks, setStocks] = useState<StockQuote[]>([])
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null)
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)

  // Real user data states
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [equityHistory, setEquityHistory] = useState<any[]>([])

  // Auto-prompt initial onboarding if wallet is unconfigured and has 0 balance
  useEffect(() => {
    if (wallet && wallet.isConfigured === false && Number(wallet.balance) === 0) {
      setIsSetupModalOpen(true)
    }
  }, [wallet])

  // Load real authenticated user portfolio, watchlist, orders & transactions
  const loadUserData = useCallback(async () => {
    try {
      const [portData, wlData, ordData, txnData, historyData] = await Promise.allSettled([
        portfolioService.getPortfolio(),
        watchlistService.getWatchlist(),
        tradeService.getOrders(),
        tradeService.getTransactions(),
        portfolioService.getPortfolioHistory(),
      ])

      if (portData.status === 'fulfilled') {
        setPortfolio(portData.value)
      }
      if (wlData.status === 'fulfilled') {
        setWatchlistItems(wlData.value)
      }
      if (ordData.status === 'fulfilled') {
        setOrders(ordData.value)
      }
      if (txnData.status === 'fulfilled') {
        setTransactions(txnData.value)
      }
      if (historyData.status === 'fulfilled') {
        setEquityHistory(historyData.value || [])
      }
    } catch (err) {
      console.error('Failed to load user dashboard data:', err)
    }
  }, [])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  // Fetch stocks from backend market API for TopBar search and Markets
  useEffect(() => {
    api
      .get<ApiResponse<StockQuote[]>>('/market/stocks')
      .then((res) => {
        if (res.data?.data) {
          setStocks(res.data.data)
          if (res.data.data.length > 0 && !selectedStock) {
            setSelectedStock(res.data.data[0])
          }
        }
      })
      .catch((err) => console.error('Failed to load market stocks in dashboard:', err))
  }, [])

  const handleSelectSymbol = (symbol: string) => {
    const matched = stocks.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase())
    if (matched) {
      setSelectedStock(matched)
    } else {
      setSelectedStock({
        symbol,
        name: symbol,
        exchange: 'NASDAQ',
        sector: 'Equities',
        currentPrice: 0,
        previousClose: 0,
        changeAmount: 0,
        changePercent: 0,
        volume: 0,
      })
    }
    setActiveTab('markets')
  }

  // Calculated values backed strictly by authenticated user's database records
  const cashBalance = wallet ? Number(wallet.balance || 0) : Number(portfolio?.cashBalance || 0)
  const holdings = portfolio?.holdings || []
  const investedValue = Number(portfolio?.investedValue || 0)
  const totalNetWorth = cashBalance + investedValue
  const unrealizedPnL = Number(portfolio?.unrealizedPnL || 0)
  const unrealizedPnLPercent = Number(portfolio?.unrealizedPnLPercent || 0)
  const activePositions = portfolio?.activePositions ?? holdings.length
  const userCurrency = portfolio?.currency || wallet?.currency || 'INR'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors">
      {/* 1. Left Sidebar (Fixed / Full Height) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. Main Terminal Canvas (Fixed Height, Main Content Scrolls) */}
      <div className="flex-1 flex flex-col h-screen min-w-0 bg-slate-50 dark:bg-[#080c14] overflow-hidden transition-colors">
        {/* Top Bar: Stock Search, Market Status, User/Account */}
        <TopBar
          stocks={stocks}
          onSelectStock={(stock) => {
            setSelectedStock(stock)
            if (activeTab !== 'dashboard' && activeTab !== 'watchlist' && activeTab !== 'markets') {
              setActiveTab('markets')
            }
          }}
          onOpenSetupCapital={() => setIsSetupModalOpen(true)}
        />

        {/* Workstation Content Area (Scrolls independently) */}
        <main className="flex-1 p-3.5 sm:p-4 space-y-4 max-w-[1600px] w-full mx-auto overflow-y-auto">
          {/* TAB: DASHBOARD (Default high-density overview) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-fade-in">
              {/* Main Area: Real Portfolio Value, Available Cash, P&L */}
              <PortfolioMetrics
                wallet={wallet}
                portfolio={portfolio}
                holdingsValue={investedValue}
                activePositions={activePositions}
                unrealizedPnL={unrealizedPnL}
                unrealizedPnLPercent={unrealizedPnLPercent}
                currency={userCurrency}
                onOpenSetupCapital={() => setIsSetupModalOpen(true)}
              />

              {/* Grid: Real Performance Chart (8 cols) + Top Market Watchlist & Holdings Widgets (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
                <div className="lg:col-span-8">
                  <PerformanceChart
                    history={equityHistory}
                    netWorth={totalNetWorth}
                    unrealizedPnL={unrealizedPnL}
                    unrealizedPnLPercent={unrealizedPnLPercent}
                    currency={userCurrency}
                  />
                </div>
                <div className="lg:col-span-4 space-y-2.5">
                  <MarketOverview
                    holdings={holdings}
                    watchlistItems={watchlistItems}
                    currency={userCurrency}
                    onSelectSymbol={handleSelectSymbol}
                    onNavigateToMarkets={() => setActiveTab('markets')}
                  />
                </div>
              </div>

              {/* Recent Transactions Section */}
              <RecentTransactions
                orders={orders}
                transactions={transactions}
                currency={userCurrency}
              />
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
                watchlistItems={watchlistItems}
                selectedStock={selectedStock}
                onSelectSymbol={handleSelectSymbol}
                onRefreshWatchlist={loadUserData}
                currency={userCurrency}
              />
            </div>
          )}

          {/* TAB: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4 animate-fade-in">
              <PortfolioMetrics
                wallet={wallet}
                portfolio={portfolio}
                holdingsValue={investedValue}
                activePositions={activePositions}
                unrealizedPnL={unrealizedPnL}
                unrealizedPnLPercent={unrealizedPnLPercent}
                currency={userCurrency}
                onOpenSetupCapital={() => setIsSetupModalOpen(true)}
              />
              <PortfolioHoldingsView holdings={holdings} currency={userCurrency} />
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-fade-in">
              <OrdersView orders={orders} transactions={transactions} currency={userCurrency} />
            </div>
          )}

          {/* TAB: ANALYSIS */}
          {activeTab === 'analysis' && (
            <div className="space-y-4 animate-fade-in">
              <PerformanceChart
                history={equityHistory}
                netWorth={totalNetWorth}
                unrealizedPnL={unrealizedPnL}
                unrealizedPnLPercent={unrealizedPnLPercent}
                currency={userCurrency}
              />
              <AnalysisView holdings={holdings} orders={orders} currency={userCurrency} />
            </div>
          )}
        </main>
      </div>

      {/* Portfolio Setup & Capital Adjustment Modal */}
      <PortfolioSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => {
          setIsSetupModalOpen(false)
          refreshWallet()
          loadUserData()
        }}
        isInitialOnboarding={wallet?.isConfigured === false && Number(wallet?.balance) === 0}
      />
    </div>
  )
}

export default Dashboard
