import api from './api'
import type { ApiResponse, AuthResponse, User } from '../types/auth'

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      name,
      email,
      password,
    })
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
