import React from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Bookmark,
  Briefcase,
  FileText,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import BrandLogo from '../BrandLogo'
import { useAuth } from '../../context/AuthContext'

export type DashboardTab = 'dashboard' | 'markets' | 'watchlist' | 'portfolio' | 'orders' | 'analysis'

interface SidebarProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse
}) => {
  const { user, logout } = useAuth()

  const navItems: { id: DashboardTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
    { id: 'markets', label: 'Markets', icon: <TrendingUp className="h-4 w-4 shrink-0" />, badge: 'LIVE' },
    { id: 'watchlist', label: 'Watchlist', icon: <Bookmark className="h-4 w-4 shrink-0" />, badge: '8' },
    { id: 'portfolio', label: 'Portfolio', icon: <Briefcase className="h-4 w-4 shrink-0" />, badge: '3 Pos' },
    { id: 'orders', label: 'Orders', icon: <FileText className="h-4 w-4 shrink-0" />, badge: '5' },
    { id: 'analysis', label: 'Analysis', icon: <BarChart3 className="h-4 w-4 shrink-0" /> },
  ]

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col justify-between border-r border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#090d16] z-40 transition-all duration-200 select-none ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Top Header / Brand */}
      <div>
        <div className="h-13 border-b border-slate-200 dark:border-[#1c2638] flex items-center justify-between px-3.5">
          <Link to="/" className="flex items-center gap-2 overflow-hidden" title="PortfolioPro Home">
            <BrandLogo size="md" />
            {!isCollapsed && (
              <div className="flex items-baseline gap-1 truncate">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  Portfolio<span className="text-blue-600 dark:text-blue-500">Pro</span>
                </span>
                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 font-semibold">
                  PRO
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="p-2 space-y-1">
          {!isCollapsed && (
            <div className="px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
              Terminal Workspaces
            </div>
          )}

          {navItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-mono transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#121929] border border-transparent'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}>{item.icon}</span>
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1 truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          item.badge === 'LIVE'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom Area: Engine status & User profile */}
      <div className="p-2 border-t border-slate-200 dark:border-[#1c2638] space-y-2">
        {/* Sim Engine Status */}
        <div
          className={`flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-[#060a12] border border-slate-200 dark:border-[#141d2f] text-[10px] font-mono text-slate-600 dark:text-slate-400 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {!isCollapsed && (
            <div className="truncate">
              <span className="text-slate-800 dark:text-slate-300 font-semibold">ENGINE ACTIVE</span>
              <span className="text-slate-500 block text-[9px]">US MARKET DATA</span>
            </div>
          )}
        </div>

        {/* User Pill & Logout */}
        <div
          className={`flex items-center justify-between p-1.5 rounded bg-slate-100 dark:bg-[#0d1322] border border-slate-200 dark:border-[#1a253a] ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-6 w-6 rounded bg-blue-600/20 text-blue-600 dark:bg-blue-600/30 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="truncate text-xs font-mono">
                <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[100px] leading-tight">
                  {user?.name || 'Trader'}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[100px]">
                  {user?.email || 'Active Session'}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={logout}
              className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
              title="Sign out of Terminal"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
