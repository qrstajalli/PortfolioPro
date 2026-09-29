import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  UserPlus,
  User as UserIcon,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Shield,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AxiosError } from 'axios'
import type { ApiResponse } from '../types/auth'

export const RegisterPage: React.FC = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Validation tracking
  const [touched, setTouched] = useState<{
    name?: boolean
    email?: boolean
    password?: boolean
    confirmPassword?: boolean
    agreeTerms?: boolean
  }>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Validation rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const nameError = !name.trim()
    ? 'Full name is required.'
    : name.trim().length < 2
    ? 'Name must be at least 2 characters.'
    : name.trim().length > 100
    ? 'Name must not exceed 100 characters.'
    : null

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

  const confirmPasswordError = !confirmPassword
    ? 'Please confirm your password.'
    : confirmPassword !== password
    ? 'Passwords do not match.'
    : null

  const termsError = !agreeTerms ? 'You must agree to the paper trading simulation terms.' : null

  const isFormValid = !nameError && !emailError && !passwordError && !confirmPasswordError && !termsError

  // Password strength calculation
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

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Mark all fields touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    })

    if (!isFormValid) {
      return
    }

    setLoading(true)
    try {
      await register(name.trim(), email.trim(), password)
      // On successful registration, redirect straight to dashboard!
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiResponse<unknown>>
      if (axiosErr.response?.data?.message) {
        setError(axiosErr.response.data.message)
      } else if (axiosErr.response?.data?.errors) {
        const errs = axiosErr.response.data.errors
        if (typeof errs === 'object') {
          const firstErr = Object.values(errs)[0] as string
          setError(firstErr || 'Validation error')
        } else {
          setError(String(errs))
        }
      } else if (axiosErr.response?.status === 409) {
        setError('An account with this email address already exists. Please sign in.')
      } else {
        setError('Registration could not be completed. Please check your connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto my-4 p-6 sm:p-7 rounded-lg border border-slate-200 dark:border-[#1c2638] bg-white dark:bg-[#0c1220] shadow-xl dark:shadow-2xl space-y-4 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex h-9 w-9 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 items-center justify-center border border-emerald-500/20 mb-1">
          <UserPlus className="h-4 w-4" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">Open Trading Account</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Professional paper trading terminal for risk-free market execution
        </p>
      </div>

      {/* Account Info Callout */}
      <div className="p-2.5 rounded bg-blue-50/60 dark:bg-[#070d18] border border-blue-200 dark:border-blue-500/20 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Shield className="h-3.5 w-3.5" />
        </div>
        <div className="text-xs">
          <span className="text-slate-800 dark:text-slate-300 font-mono font-medium">Simulated Trading Account</span>
          <span className="text-slate-500 text-[10px] block">Test execution strategies in real-time with zero capital risk</span>
        </div>
      </div>

      {/* Server error alert */}
      {error && (
        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
          <div className="leading-relaxed font-mono">{error}</div>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300 mb-1">
            Full Name
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              onBlur={() => handleBlur('name')}
              placeholder="e.g. Alex Morgan"
              className={`w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#070b13] border rounded text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-colors ${
                touched.name && nameError
                  ? 'border-rose-500/70 focus:border-rose-500'
                  : 'border-slate-300 dark:border-[#1e2a3f] focus:border-blue-500'
              }`}
              disabled={loading}
              autoComplete="name"
            />
          </div>
          {touched.name && nameError && (
            <p className="mt-1 text-[11px] font-mono text-rose-500 dark:text-rose-400 flex items-center gap-1">
              <span>✕</span> {nameError}
            </p>
          )}
        </div>

        {/* Email Address */}
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

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300">
              Password
            </label>
            {password && (
              <span className={`text-[10px] font-mono font-medium ${
                strength.score === 1 ? 'text-rose-500 dark:text-rose-400' : strength.score === 2 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                Strength: {strength.label}
              </span>
            )}
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
              placeholder="Min. 6 characters"
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
          {/* Password strength mini bar */}
          {password && (
            <div className="mt-1.5 flex gap-1 h-1">
              <div className={`flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-200 dark:bg-slate-800'}`} />
              <div className={`flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-200 dark:bg-slate-800'}`} />
              <div className={`flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-200 dark:bg-slate-800'}`} />
            </div>
          )}
          {touched.password && passwordError && (
            <p className="mt-1 text-[11px] font-mono text-rose-500 dark:text-rose-400 flex items-center gap-1">
              <span>✕</span> {passwordError}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300 mb-1">
            Confirm Password
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
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="Re-enter password"
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

        {/* Terms checkbox */}
        <div>
          <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 rounded bg-slate-100 dark:bg-[#070b13] border-slate-300 dark:border-[#1e2a3f] text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <span>
              I understand this is a simulated paper trading platform with ₹0.00 real money risk.
            </span>
          </label>
          {touched.agreeTerms && termsError && (
            <p className="mt-1 text-[11px] font-mono text-rose-500 dark:text-rose-400 flex items-center gap-1">
              <span>✕</span> {termsError}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs font-mono rounded shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Account & Start Trading</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="pt-3 border-t border-slate-200 dark:border-[#182235] text-center text-xs text-slate-600 dark:text-slate-400">
        Already registered?{' '}
        <Link
          to="/login"
          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold font-mono underline-offset-2 transition-colors"
        >
          Sign in to your terminal
        </Link>
      </div>
    </div>
  )
}

export default RegisterPage
