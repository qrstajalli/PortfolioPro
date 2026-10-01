import api from './api'
import type { ApiResponse, Portfolio } from '../types/auth'

export const portfolioService = {
  async getPortfolio(): Promise<Portfolio> {
    const response = await api.get<ApiResponse<Portfolio>>('/portfolio')
    return response.data.data
  },

  async getPortfolioHistory(): Promise<any[]> {
    const response = await api.get<ApiResponse<any[]>>('/portfolio/history')
    return response.data.data
  },
}

export default portfolioService
