import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Command,
  Wallet as WalletIcon,
  RefreshCw,
  LogOut,
  ChevronDown,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import type { StockQuote } from '../../types/auth'
import marketService from '../../services/marketService'

interface TopBarProps {
  stocks: StockQuote[]
  onSelectStock?: (stock: StockQuote) => void
  onOpenSetupCapital?: () => void
}

export const TopBar: React.FC<TopBarProps> = ({ stocks, onSelectStock, onOpenSetupCapital }) => {
  const { user, wallet, refreshWallet, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [apiSearchResults, setApiSearchResults] = useState<StockQuote[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Real-time clock for market session
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Live backend search with debounce
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q || q.length < 2) {
      setApiSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(() => {
      marketService
        .searchStocks(q)
        .then((res) => {
          setApiSearchResults(res)
        })
        .catch(() => {
          setApiSearchResults([])
        })
        .finally(() => {
          setIsSearching(false)
        })
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        setIsSearchOpen(true)
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshWallet()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Filter stocks matching query from local stocks + merge with API results
  const localMatches = searchQuery.trim()
    ? stocks.filter(
        (s) =>
          s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.sector && s.sector.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : []

  const combinedMap = new Map<string, StockQuote>()
  localMatches.forEach((s) => combinedMap.set(s.symbol.toUpperCase(), s))
  apiSearchResults.forEach((s) => {
    if (!combinedMap.has(s.symbol.toUpperCase())) {
      combinedMap.set(s.symbol.toUpperCase(), s)
    }
  })
  const searchResults = Array.from(combinedMap.values())

  const formattedBalance = wallet
    ? Number(wallet.balance).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00'

  return (
    <header className="h-13 shrink-0 border-b border-slate-200 dark:border-[#1c2638] bg-white/95 dark:bg-[#080c14]/95 backdrop-blur-md px-4 flex items-center justify-between gap-4 sticky top-0 z-30 select-none transition-colors">
      {/* 1. Global Stock Search & Command Bar */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsSearchOpen(true)
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search equities, symbols (e.g. AAPL, MSFT, NVDA)..."
            className="w-full pl-9 pr-14 py-1.5 bg-slate-100 dark:bg-[#0e1422] border border-slate-200 dark:border-[#1e2a3d] hover:border-slate-400 dark:hover:border-slate-600 focus:border-blue-500 rounded text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-colors"
          />
          {isSearching ? (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-mono text-blue-500 dark:text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              <span className="text-[9px]">Searching</span>
            </div>
          ) : (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-mono bg-white dark:bg-[#162033] px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 pointer-events-none">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1c2638] rounded-md shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-mono text-slate-500 bg-slate-50 dark:bg-[#080d18] border-b border-slate-200 dark:border-[#182235]">
              MATCHING SECURITIES ({searchResults.length})
            </div>
            <div className="divide-y divide-slate-100 dark:divide-[#182235]">
              {searchResults.map((stock) => {
                const isGain = (stock.changeAmount ?? stock.change ?? 0) >= 0
                const isUSD = stock.currency === 'USD' || stock.exchange === 'NASDAQ'
                const price = Number(stock.currentPrice || stock.price || 0)
                const sym = isUSD ? '$' : '₹'
                const formattedPrice = price > 0 ? `${sym}${price.toLocaleString(isUSD ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null
                return (
                  <button
                    key={stock.symbol}
                    onClick={() => {
                      onSelectStock?.(stock)
                      setIsSearchOpen(false)
                      setSearchQuery('')
                    }}
                    className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#121a2d] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {stock.symbol}
                      </span>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                        {stock.exchange}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                        {stock.name}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      {formattedPrice ? (
                        <>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {formattedPrice}
                          </div>
                          <div
                            className={`text-[10px] flex items-center justify-end gap-0.5 font-semibold ${
                              isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isGain ? '+' : ''}
                            {(stock.changePercent != null ? stock.changePercent : 0).toFixed(2)}%
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                          Market data unavailable
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Market Status Bar */}
      <div className="hidden lg:flex items-center gap-5 text-xs font-mono text-slate-500 dark:text-slate-400 border-x border-slate-200 dark:border-[#1c2638] px-4">
        {/* Exchange Status */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-800 dark:text-slate-300 font-semibold">US MARKET DATA</span>
          <span className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold">DELAYED / LATEST AVAILABLE</span>
        </div>

        {/* Simulated Engine Clock */}
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
          <span>IST:</span>
          <span className="text-slate-800 dark:text-white tabular-nums font-semibold">
            {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
          </span>
        </div>

        {/* Latency */}
        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          LATENCY: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">4ms</span>
        </div>
      </div>

      {/* 3. User / Account Quick Header & Theme Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#0e1422] dark:hover:bg-[#162035] border border-slate-200 dark:border-[#1e293b] transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700" />
          )}
        </button>

        {/* Top Navigation Capital Button */}
        <div className="flex items-center gap-1.5 p-0.5 pl-2.5 pr-1 rounded bg-emerald-50 dark:bg-[#0b1322] border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono">
          <button
            type="button"
            onClick={onOpenSetupCapital}
            className="flex items-center gap-1.5 font-semibold hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors cursor-pointer group"
            title="Adjust Virtual Trading Capital"
          >
            <WalletIcon className="h-3.5 w-3.5" />
            <span className="tabular-nums">₹{formattedBalance}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-medium group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/30 transition-colors">
              Adjust Capital
            </span>
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-300 cursor-pointer rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/10 transition-colors"
            title="Refresh cash balance"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>

        {/* User Account Pill with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded bg-slate-100 dark:bg-[#0e1422] border border-slate-200 dark:border-[#1e293b] hover:border-slate-400 dark:hover:border-slate-600 text-xs font-mono text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <span className="h-5 w-5 rounded-full bg-blue-600/20 text-blue-600 dark:bg-blue-600/30 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </span>
            <span className="font-medium max-w-[100px] truncate hidden sm:inline">
              {user?.name || 'Trader'}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {/* User Menu Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-[#1c2638] rounded-md shadow-2xl py-1 text-xs font-mono z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-[#182235]">
                <div className="font-semibold text-slate-900 dark:text-white truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Available Cash: ₹{formattedBalance}</div>
              </div>

              <Link
                to="/"
                onClick={() => setUserDropdownOpen(false)}
                className="w-full px-3 py-1.5 flex items-center justify-between text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#12192a] dark:hover:text-white transition-colors"
              >
                <span>Markets Terminal</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </Link>

              {onOpenSetupCapital && (
                <button
                  onClick={() => {
                    setUserDropdownOpen(false)
                    onOpenSetupCapital()
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer text-left"
                >
                  <span>Configure Virtual Capital</span>
                  <WalletIcon className="h-3 w-3" />
                </button>
              )}

              <button
                onClick={() => {
                  setUserDropdownOpen(false)
                  logout()
                }}
                className="w-full px-3 py-1.5 flex items-center justify-between text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <span>Sign Out</span>
                <LogOut className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopBar
