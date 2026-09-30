import React, { useState, useEffect } from 'react'
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
  const { login, loginWithToken } = useAuth()
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

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const oauthToken = params.get('oauth_token')
    const oauthError = params.get('oauth_error')

    if (oauthToken) {
      setLoading(true)
      loginWithToken(oauthToken)
        .then(() => {
          navigate(redirectTarget, { replace: true })
        })
        .catch((err) => {
          console.error('Failed to process OAuth login:', err)
          setError('Failed to authenticate with Google. Please try again.')
          setLoading(false)
        })
    } else if (oauthError) {
      setError(decodeURIComponent(oauthError))
    }
  }, [location.search, loginWithToken, navigate, redirectTarget])

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

      {/* Google OAuth Login */}
      <button
        type="button"
        id="google-login-button"
        onClick={() => {
          window.location.href = 'http://localhost:8080/oauth2/authorization/google'
        }}
        disabled={loading}
        className="w-full py-2.5 px-4 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-[#1a2336] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-[#222f46] font-medium text-xs font-mono rounded shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-1">
        <div className="border-t border-slate-200 dark:border-[#1e2a3f] w-full" />
        <span className="bg-white dark:bg-[#0c1220] px-2.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider relative">
          or sign in with email
        </span>
      </div>

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

        {/* Remember me & Forgot Password */}
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
          <Link
            to="/forgot-password"
            className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline transition-colors"
          >
            Forgot password?
          </Link>
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
