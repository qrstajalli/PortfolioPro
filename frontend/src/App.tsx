import React from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import BrandLogo from './components/BrandLogo'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import Dashboard from './components/Dashboard'
import LandingView from './components/LandingView'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import MarketsModule from './components/markets/MarketsModule'

export const AppContent: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboardRoute = location.pathname.startsWith('/dashboard')

  const handleSearchClick = () => {
    const searchEl = (document.getElementById('landing-stock-search') ||
      document.querySelector('input[placeholder*="Search stocks"]')) as HTMLInputElement
    if (searchEl) {
      searchEl.focus()
      searchEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // When inside the trading dashboard terminal, render full-bleed workstation
  if (isDashboardRoute) {
    return (
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    )
  }

  // Public & Auth views with the existing PortfolioPro layout
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#080c14] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      <Navbar onSearchClick={handleSearchClick} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Routes>
          <Route
            path="/"
            element={
              <LandingView
                onOpenLogin={() => navigate('/login')}
                onOpenRegister={() => navigate('/register')}
              />
            }
          />
          <Route path="/markets" element={<MarketsModule />} />
          <Route path="/markets/:symbol" element={<MarketsModule />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#070b14] pt-12 pb-8 transition-colors duration-200 font-sans">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 space-y-10">
          {/* Main Footer Grid: 4 clean columns */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
            {/* Col 1: Brand & Tagline (Span 2 on medium+ screens) */}
            <div className="col-span-2 space-y-3.5">
              <Link to="/" className="inline-flex items-center gap-2 group">
                <BrandLogo size="md" />
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  Portfolio<span className="text-blue-600 dark:text-blue-500">Pro</span>
                </span>
              </Link>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                Advanced paper trading terminal and real-time market data analytics for Indian and global equity markets.
              </p>

              <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>NSE / BSE Feeds Synchronized • 99.9% Uptime</span>
              </div>
            </div>

            {/* Col 2: Markets */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                Markets
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                <li>
                  <Link to="/markets" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    NIFTY 50
                  </Link>
                </li>
                <li>
                  <Link to="/markets" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    SENSEX
                  </Link>
                </li>
                <li>
                  <Link to="/markets" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    BANK NIFTY
                  </Link>
                </li>
                <li>
                  <Link to="/markets" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    NASDAQ 100
                  </Link>
                </li>
                <li>
                  <Link to="/markets" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    All Equities
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Terminal */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                Terminal
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                <li>
                  <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Trading Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Live Watchlist
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Portfolio Holdings
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Order Ledger
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Risk Analysis
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Platform */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                <li>
                  <a href="/#stocks-section" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Popular Stocks
                  </a>
                </li>
                <li>
                  <a href="/#features-section" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Platform Features
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                    Terminal Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                    Open Paper Account
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Navigation */}
          <div className="pt-6 border-t border-slate-200 dark:border-[#162033] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <div>
              © {new Date().getFullYear()} PortfolioPro Technologies. All rights reserved.
            </div>

            <div className="flex items-center gap-4 sm:gap-5 text-[11px]">
              <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer">
                Privacy Policy
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer">
                Terms of Service
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer">
                Security
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer">
                System Status
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
