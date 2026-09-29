import api from './api'
import type { ApiResponse, AuthResponse, User } from '../types/auth'

export const authService = {
  async register(name: string, email: string, password: string, initialCapital?: number): Promise<AuthResponse> {
    const payload: { name: string; email: string; password: string; initialCapital?: number } = {
      name,
      email,
      password,
    }
    if (initialCapital !== undefined && initialCapital > 0) {
      payload.initialCapital = initialCapital
    }
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', payload)
    return response.data.data
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    })
    return response.data.data
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me')
    return response.data.data
  },

  async forgotPassword(email: string): Promise<string> {
    const response = await api.post<ApiResponse<void>>('/auth/forgot-password', { email })
    return response.data.message || 'If an account with that email exists, password reset instructions have been sent.'
  },

  async resetPassword(token: string, newPassword: string): Promise<string> {
    const response = await api.post<ApiResponse<void>>('/auth/reset-password', {
      token,
      newPassword,
    })
    return response.data.message || 'Password has been successfully reset.'
  },

  saveAuth(authResponse: AuthResponse): void {
    localStorage.setItem('portfoliopro_token', authResponse.token)
    localStorage.setItem('portfoliopro_user', JSON.stringify(authResponse.user))
  },

  clearAuth(): void {
    localStorage.removeItem('portfoliopro_token')
    localStorage.removeItem('portfoliopro_user')
  },

  getToken(): string | null {
    return localStorage.getItem('portfoliopro_token')
  },

  getStoredUser(): User | null {
    const stored = localStorage.getItem('portfoliopro_user')
    if (!stored) return null
    try {
      return JSON.parse(stored) as User
    } catch {
      return null
    }
  },
}

export default authService
