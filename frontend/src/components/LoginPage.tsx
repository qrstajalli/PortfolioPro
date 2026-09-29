import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AxiosError } from 'axios'
import type { ApiResponse } from '../types/auth'

interface LocationState {
  from?: {
    pathname: string
  }
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LocationState | null
  const redirectTarget = locationState?.from?.pathname || '/dashboard'

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Validation states
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Validation logic
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailError = !email.trim()
    ? 'Email address is required.'
    : !emailRegex.test(email.trim())
    ? 'Please enter a valid email address.'
    : null

  const passwordError = !password
    ? 'Password is required.'
    : password.length < 6
    ? 'Password must be at least 6 characters.'
    : null

  const isFormValid = !emailError && !passwordError

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Mark all fields as touched to display validation errors
    setTouched({ email: true, password: true })

    if (!isFormValid) {
      return
    }

    setLoading(true)
    try {
      await login(email.trim(), password)
      // Redirect to dashboard (or attempted protected route)
      navigate(redirectTarget, { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiResponse<unknown>>
      if (axiosErr.response?.data?.message) {
        setError(axiosErr.response.data.message)
      } else if (axiosErr.response?.status === 401) {
        setError('Invalid email or password. Please verify credentials.')
      } else {
        setError('Authentication service unreachable. Please ensure the backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto my-4 p-6 sm:p-7 rounded-lg border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xl dark:shadow-2xl space-y-5 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex h-9 w-9 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 items-center justify-center border border-blue-500/20 mb-1">
          <LogIn className="h-4 w-4" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">Sign In to Terminal</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Enter credentials to access your simulated portfolio and virtual wallet
        </p>
      </div>

      {/* Server error alert */}
      {error && (
        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
          <div className="leading-relaxed font-mono">{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email field */}
        <div>
          <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              onBlur={() => handleBlur('email')}
              placeholder="you@example.com"
              className={`w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#070b13] border rounded text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-colors ${
                touched.email && emailError
                  ? 'border-rose-500/70 focus:border-rose-500'
                  : 'border-slate-300 dark:border-[#1e2a3f] focus:border-blue-500'
              }`}
              disabled={loading}
              autoComplete="email"
            />
          </div>
          {touched.email && emailError && (
            <p className="mt-1 text-[11px] font-mono text-rose-500 dark:text-rose-400 flex items-center gap-1">
              <span>✕</span> {emailError}
            </p>
          )}
        </div>

        {/* Password field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300">
              Password
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
              onBlur={() => handleBlur('password')}
              placeholder="••••••••"
              className={`w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-[#070b13] border rounded text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-colors ${
                touched.password && passwordError
                  ? 'border-rose-500/70 focus:border-rose-500'
                  : 'border-slate-300 dark:border-[#1e2a3f] focus:border-blue-500'
              }`}
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {touched.password && passwordError && (
            <p className="mt-1 text-[11px] font-mono text-rose-500 dark:text-rose-400 flex items-center gap-1">
              <span>✕</span> {passwordError}
            </p>
          )}
        </div>

        {/* Remember me & Security info */}
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 text-[11px] font-mono">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded bg-slate-100 dark:bg-[#070b13] border-slate-300 dark:border-[#1e2a3f] text-blue-600 focus:ring-0 cursor-pointer"
            />
            <span>Remember session</span>
          </label>
          <span className="text-[10px] font-mono text-slate-500">JWT Stateless</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs font-mono rounded shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In to Terminal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="pt-3.5 border-t border-slate-200 dark:border-[#182235]">
        <div className="text-center text-xs text-slate-600 dark:text-slate-400">
          Need an account?{' '}
          <Link
            to="/register"
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold font-mono underline-offset-2 transition-colors"
          >
            Open paper trading account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
