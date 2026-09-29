import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User, Wallet } from '../types/auth'
import authService from '../services/authService'
import walletService from '../services/walletService'

interface AuthContextType {
  user: User | null
  wallet: Wallet | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshWallet: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser())
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [token, setToken] = useState<string | null>(() => authService.getToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchWallet = useCallback(async () => {
    try {
      const walletData = await walletService.getWallet()
      setWallet(walletData)
    } catch (err) {
      console.error('Failed to load wallet:', err)
    }
  }, [])

  const logout = useCallback(() => {
    authService.clearAuth()
    setUser(null)
    setWallet(null)
    setToken(null)
  }, [])

  // Initialize session on load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = authService.getToken()
      if (storedToken) {
        try {
          const currentUser = await authService.getMe()
          setUser(currentUser)
          setToken(storedToken)
          await fetchWallet()
        } catch {
          // Token is expired or invalid
          logout()
        }
      }
      setIsLoading(false)
    }

    initializeAuth()

    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [fetchWallet, logout])

  const login = async (email: string, password: string) => {
    const authData = await authService.login(email, password)
    authService.saveAuth(authData)
    setUser(authData.user)
    setToken(authData.token)
    await fetchWallet()
  }

  const register = async (name: string, email: string, password: string) => {
    const authData = await authService.register(name, email, password)
    authService.saveAuth(authData)
    setUser(authData.user)
    setToken(authData.token)
    await fetchWallet()
  }

  const refreshWallet = async () => {
    await fetchWallet()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        refreshWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
