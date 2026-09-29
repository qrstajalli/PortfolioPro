import api from './api'
import type { ApiResponse, Wallet } from '../types/auth'

export const walletService = {
  async getWallet(): Promise<Wallet> {
    const response = await api.get<ApiResponse<Wallet>>('/wallet')
    return response.data.data
  },

  async setupCapital(initialCapital: number): Promise<Wallet> {
    const response = await api.post<ApiResponse<Wallet>>('/wallet/setup', {
      initialCapital,
    })
    return response.data.data
  },

  async updateCapital(initialCapital: number): Promise<Wallet> {
    const response = await api.put<ApiResponse<Wallet>>('/wallet/capital', {
      initialCapital,
    })
    return response.data.data
  },
}

export default walletService
