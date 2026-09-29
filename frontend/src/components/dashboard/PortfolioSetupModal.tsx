import React, { useState } from 'react'
import {
  Wallet as WalletIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  ShieldCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface PortfolioSetupModalProps {
  isOpen: boolean
  onClose?: () => void
  isInitialOnboarding?: boolean
}

export const PortfolioSetupModal: React.FC<PortfolioSetupModalProps> = ({
  isOpen,
  onClose,
  isInitialOnboarding = false,
}) => {
  const { wallet, setupCapital } = useAuth()

  // Presets in INR
  const CAPITAL_PRESETS = [
    { label: '₹50,000', value: 50000, desc: 'Intraday & Micro Strategy' },
    { label: '₹2,00,000', value: 200000, desc: 'Active Swing Trader' },
    { label: '₹5,00,000', value: 500000, desc: 'Growth Portfolio' },
    { label: '₹10,00,000', value: 1000000, desc: 'High Net Worth Simulation' },
  ]

  const currentCapital = wallet?.balance ? Number(wallet.balance) : 500000
  const [selectedPreset, setSelectedPreset] = useState<number | null>(
    CAPITAL_PRESETS.some((p) => p.value === currentCapital) ? currentCapital : null
  )
  const [customAmount, setCustomAmount] = useState<string>(
    !CAPITAL_PRESETS.some((p) => p.value === currentCapital) && currentCapital > 0
      ? String(currentCapital)
      : ''
  )
  const [isCustom, setIsCustom] = useState<boolean>(
    !CAPITAL_PRESETS.some((p) => p.value === currentCapital) && currentCapital > 0
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const activeAmount = isCustom ? Number(customAmount) || 0 : selectedPreset || 0

  const handleSelectPreset = (value: number) => {
    setSelectedPreset(value)
    setIsCustom(false)
    setCustomAmount('')
    setError(null)
  }

  const handleCustomChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '')
    setCustomAmount(clean)
    setIsCustom(true)
    setSelectedPreset(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (activeAmount < 100) {
      setError('Please configure a starting virtual capital of at least ₹100.')
      return
    }
    if (activeAmount > 1000000000) {
      setError('Virtual capital cannot exceed ₹1,00,00,00,000.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await setupCapital(activeAmount)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        if (onClose) onClose()
      }, 700)
    } catch (err: unknown) {
      setError('Failed to update virtual capital. Please check connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-mono select-none">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-2xl p-6 sm:p-7 space-y-5 text-slate-900 dark:text-slate-100 relative">
        {/* Close button (only if not forced onboarding) */}
        {!isInitialOnboarding && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Virtual Capital Onboarding</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isInitialOnboarding ? 'Set Up Your Virtual Trading Capital' : 'Adjust Virtual Trading Capital'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
            Choose your desired paper-trading starting capital to simulate your personal investment strategy. You can reconfigure or reset this amount at any time.
          </p>
        </div>

        {/* Informational Callout */}
        <div className="p-3 rounded bg-slate-50 dark:bg-[#070b13] border border-slate-200 dark:border-[#182338] flex items-center gap-2.5 text-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-300">100% Virtual / Simulated Money:</span> Test execution, risk controls, and position sizing with zero real financial risk.
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Buttons Grid */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Popular Capital Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CAPITAL_PRESETS.map((p) => {
                const isSelected = !isCustom && selectedPreset === p.value
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleSelectPreset(p.value)}
                    className={`p-3 rounded border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-600/15 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'border-slate-200 dark:border-[#1e2a3f] bg-slate-50/50 dark:bg-[#080d17] hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{p.label}</span>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {p.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Capital Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Or Enter Custom Virtual Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="text"
                value={customAmount}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder="e.g. 350000"
                className={`w-full pl-8 pr-3 py-2.5 rounded border text-sm font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-[#070b13] focus:outline-none transition-colors ${
                  isCustom && customAmount
                    ? 'border-blue-600 focus:border-blue-500 shadow-xs'
                    : 'border-slate-200 dark:border-[#1e2a3f] focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Active Capital Summary Preview */}
          <div className="p-3 rounded bg-blue-50/40 dark:bg-[#0a1222] border border-blue-200/60 dark:border-blue-500/20 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase">
                Selected Starting Capital
              </span>
              <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                ₹{activeAmount > 0 ? activeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
              </span>
            </div>
            <div className="text-right text-[10px] text-slate-500 dark:text-slate-400">
              <span>Currency: INR (₹)</span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            {!isInitialOnboarding && onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-[#1c2638] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || activeAmount <= 0}
              className="px-5 py-2.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Configured!</span>
                </>
              ) : (
                <>
                  <WalletIcon className="h-3.5 w-3.5" />
                  <span>{isInitialOnboarding ? 'Initialize Portfolio Capital' : 'Save & Update Capital'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PortfolioSetupModal
