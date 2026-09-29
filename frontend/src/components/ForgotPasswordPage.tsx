import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import authService from '../services/authService'
import { AxiosError } from 'axios'
import type { ApiResponse } from '../types/auth'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailError = !email.trim()
    ? 'Email address is required.'
    : !emailRegex.test(email.trim())
    ? 'Please enter a valid email address.'
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    setError(null)

    if (emailError) {
      return
    }

    setLoading(true)
    try {
      await authService.forgotPassword(email.trim())
      setSubmitted(true)
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiResponse<unknown>>
      setError(
        axiosErr.response?.data?.message ||
          'Unable to process password reset request. Please check your connection and try again.'
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
          <KeyRound className="h-4 w-4" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
          Forgot Password
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Enter your registered email address to receive password reset instructions
        </p>
      </div>

      {/* Server error alert */}
      {error && (
        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
          <div className="leading-relaxed font-mono">{error}</div>
        </div>
      )}

      {submitted ? (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold font-mono text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Reset Instructions Sent</span>
            </div>
            <p className="font-mono leading-relaxed text-slate-600 dark:text-slate-300 text-[11px]">
              If an account with <span className="font-bold text-slate-900 dark:text-white">{email}</span> exists in our system, a secure password reset link has been dispatched.
            </p>
            <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
              Please check your spam or junk folder if the message does not appear in your inbox within a few minutes.
            </p>
          </div>

          <Link
            to="/login"
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-[#12192a] dark:hover:bg-[#182238] text-slate-800 dark:text-slate-200 font-semibold text-xs font-mono rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                onBlur={() => setTouched(true)}
                placeholder="you@example.com"
                className={`w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#070b13] border rounded text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-colors ${
                  touched && emailError
                    ? 'border-rose-500/70 focus:border-rose-500'
                    : 'border-slate-300 dark:border-[#1e2a3f] focus:border-blue-500'
                }`}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            {touched && emailError && (
              <p className="mt-1 text-[11px] font-mono text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <span>✕</span> {emailError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs font-mono rounded shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating reset link...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>

          <div className="pt-3 border-t border-slate-200 dark:border-[#182235] text-center">
            <Link
              to="/login"
              className="text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}

export default ForgotPasswordPage
