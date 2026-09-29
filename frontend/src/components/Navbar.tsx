import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Wallet as WalletIcon,
  LogOut,
  LogIn,
  UserPlus,
  Search,
  Command,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  Sun,
  Moon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import BrandLogo from './BrandLogo'

interface NavbarProps {
  onSearchClick?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchClick }) => {
  const { user, wallet, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [apiOnline, setApiOnline] = useState<boolean>(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => setApiOnline(res.ok))
      .catch(() => setApiOnline(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearchAction = () => {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        onSearchClick?.()
      }, 100)
    } else {
      onSearchClick?.()
    }
  }

  const handleScrollTo = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-[#1c2638] bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md relative select-none transition-colors duration-200">
      {/* Signature Brand Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400" />

      {/* 1. Main Trading Platform Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
        {/* Brand logo & tagline */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <BrandLogo size="md" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                Portfolio<span className="text-blue-600 dark:text-blue-500">Pro</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 font-semibold">
                Trading
              </span>
            </div>
          </Link>

          {/* Navigation Links: Markets, Stocks, Features */}
          <nav className="hidden md:flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-[#1c2638] text-xs font-mono">
            <Link
              to="/markets"
              className={`px-3 py-1.5 rounded transition-colors ${
                location.pathname.startsWith('/markets')
                  ? 'text-blue-600 dark:text-white bg-slate-100 dark:bg-[#141d2f] font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Markets
            </Link>
            <button
              type="button"
              onClick={() => handleScrollTo('stocks-section')}
              className="px-3 py-1.5 rounded text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Stocks
            </button>
            <button
              type="button"
              onClick={() => handleScrollTo('features-section')}
              className="px-3 py-1.5 rounded text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'text-blue-600 dark:text-white bg-slate-100 dark:bg-[#141d2f] font-semibold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-3 w-3 text-blue-500" />
                <span>Dashboard</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Middle: quick search launcher */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
          <button
            type="button"
            onClick={handleSearchAction}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200/70 dark:bg-[#0e1422] dark:hover:bg-[#131b2e] border border-slate-200 dark:border-[#1e2a3d] text-slate-500 dark:text-slate-400 text-xs transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <span>Search stocks (RELIANCE, TCS)...</span>
            </span>
            <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] font-mono bg-white dark:bg-[#162033] px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Right side: Auth, Actions & Theme Toggle */}
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

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              {/* Wallet balance chip */}
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 dark:bg-[#0e1726] border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-medium hover:bg-emerald-100 dark:hover:bg-[#122035] transition-colors"
                title="View wallet & trading dashboard"
              >
                <WalletIcon className="h-3.5 w-3.5" />
                <span>
                  {wallet
                    ? `₹${Number(wallet.balance).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : '₹0.00'}
                </span>
              </Link>

              {/* User display */}
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#121a2d] border border-slate-200 dark:border-[#1e293b] text-xs text-slate-700 dark:text-slate-200 hover:border-slate-400 transition-colors"
              >
                <span className="h-4 w-4 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[9px]">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium max-w-[100px] truncate">{user.name}</span>
              </Link>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-300 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-all cursor-pointer font-mono"
                title="Sign out of PortfolioPro"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#0e1422] dark:hover:bg-[#151f33] border border-slate-200 dark:border-[#1e293b] transition-all cursor-pointer font-mono"
              >
                <LogIn className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 border border-blue-600 shadow-sm transition-all cursor-pointer font-mono"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 2. Market Ticker Bar Directly Below Navbar */}
      <div className="border-t border-slate-200 dark:border-[#141c2c] bg-slate-50 dark:bg-[#060910] text-[11px] font-mono text-slate-700 dark:text-slate-300 px-4 py-1.5 flex items-center justify-between overflow-x-auto whitespace-nowrap scrollbar-none transition-colors duration-200">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-6 px-0 sm:px-2">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-300">NIFTY 50</span>
              <span className="text-slate-900 dark:text-white tabular-nums font-semibold">24,835.10</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 tabular-nums font-semibold">
                <TrendingUp className="h-3 w-3 inline" /> +104.25 (+0.42%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-300">SENSEX</span>
              <span className="text-slate-900 dark:text-white tabular-nums font-semibold">81,340.50</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 tabular-nums font-semibold">
                <TrendingUp className="h-3 w-3 inline" /> +308.10 (+0.38%)
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-300">BANK NIFTY</span>
              <span className="text-slate-900 dark:text-white tabular-nums font-semibold">51,920.30</span>
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5 tabular-nums font-semibold">
                <TrendingDown className="h-3 w-3 inline" /> -78.40 (-0.15%)
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-300">NASDAQ</span>
              <span className="text-slate-900 dark:text-white tabular-nums font-semibold">18,240.20</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 tabular-nums font-semibold">
                <TrendingUp className="h-3 w-3 inline" /> +117.80 (+0.65%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pl-4 text-[10px]">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  apiOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-rose-500'
                }`}
              />
              {apiOnline ? 'LIVE MARKET FEED' : 'OFFLINE'}
            </span>
            <span className="text-slate-300 dark:text-slate-600 hidden lg:inline">|</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono hidden lg:inline">SESSION: 09:15 - 15:30 IST</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
