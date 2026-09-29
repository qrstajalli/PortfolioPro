import api from './api'
import type { ApiResponse, Wallet } from '../types/auth'

export const walletService = {
  async getWallet(): Promise<Wallet> {
    const response = await api.get<ApiResponse<Wallet>>('/wallet')
    return response.data.data
  },
}

export default walletService
