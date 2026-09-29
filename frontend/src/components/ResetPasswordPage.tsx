import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import authService from '../services/authService'
import { AxiosError } from 'axios'
import type { ApiResponse } from '../types/auth'

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [touched, setTouched] = useState<{ password?: boolean; confirmPassword?: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordError = !password
    ? 'Password is required.'
    : password.length < 6
    ? 'Password must be at least 6 characters.'
    : null

  const confirmPasswordError = !confirmPassword
    ? 'Please confirm your new password.'
    : confirmPassword !== password
    ? 'Passwords do not match.'
    : null

  const isFormValid = !passwordError && !confirmPasswordError && !!token

  const getPasswordStrength = (pass: string): { label: string; score: number; color: string } => {
    if (!pass) return { label: 'None', score: 0, color: 'bg-slate-700' }
    let score = 0
    if (pass.length >= 6) score += 1
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1

    if (score <= 2) return { label: 'Weak', score: 1, color: 'bg-rose-500' }
    if (score <= 4) return { label: 'Good', score: 2, color: 'bg-amber-500' }
    return { label: 'Strong', score: 3, color: 'bg-emerald-500' }
  }

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ password: true, confirmPassword: true })
    setError(null)

    if (!isFormValid) {
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiResponse<unknown>>
      setError(
        axiosErr.response?.data?.message ||
          'Failed to reset password. The link may have expired or is invalid.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto my-4 p-6 sm:p-7 rounded-lg border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xl dark:shadow-2xl space-y-5 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex h-9 w-9 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 items-center justify-center border border-blue-500/20 mb-1">
          <Lock className="h-4 w-4" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
          Set New Password
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Create a new password for your PortfolioPro trading account
        </p>
      </div>

      {/* Missing token alert */}
      {!token && (
        <div className="p-3.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="font-mono">Invalid or missing reset token</div>
          </div>
          <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
            Please use the complete reset link provided in your email, or request a new reset link.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            Request new reset link &rarr;
          </Link>
        </div>
      )}

      {/* Server error alert */}
      {error && (
        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
          <div className="leading-relaxed font-mono">{error}</div>
        </div>
      )}

      {success ? (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold font-mono text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Password Reset Complete</span>
            </div>
            <p className="font-mono leading-relaxed text-slate-600 dark:text-slate-300 text-[11px]">
              Your password has been successfully updated. Your portfolio, trading balance, and account data remain completely intact.
            </p>
          </div>

          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs font-mono rounded shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        token && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <span className="text-[10px] font-mono text-slate-500">Min 6 characters</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError(null)
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-[#070b13] border rounded text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-colors ${
                    touched.password && passwordError
                      ? 'border-rose-500/70 focus:border-rose-500'
                      : 'border-slate-300 dark:border-[#1e2a3f] focus:border-blue-500'
                  }`}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Strength: {strength.label}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full flex-1 transition-all ${strength.score >= 1 ? strength.color : 'opacity-20'}`} />
                    <div className={`h-full flex-1 transition-all ${strength.score >= 2 ? strength.color : 'opacity-20'}`} />
                    <div className={`h-full flex-1 transition-all ${strength.score >= 3 ? strength.color : 'opacity-20'}`} />
                  </div>
                </div>
              )}

              {touched.password && passwordError && (
                <p className="mt-1 text-[11px] font-mono text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <span>✕</span> {passwordError}
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (error) setError(null)
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-[#070b13] border rounded text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-colors ${
                    touched.confirmPassword && confirmPasswordError
                      ? 'border-rose-500/70 focus:border-rose-500'
                      : 'border-slate-300 dark:border-[#1e2a3f] focus:border-blue-500'
                  }`}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {touched.confirmPassword && confirmPasswordError && (
                <p className="mt-1 text-[11px] font-mono text-rose-500 dark:text-rose-400 flex items-center gap-1">
                  <span>✕</span> {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs font-mono rounded shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        )
      )}
    </div>
  )
}

export default ResetPasswordPage
