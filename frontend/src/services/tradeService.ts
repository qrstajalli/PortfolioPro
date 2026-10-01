import api from './api'
import type { ApiResponse, Order, Transaction } from '../types/auth'

export const tradeService = {
  async getOrders(): Promise<Order[]> {
    const response = await api.get<ApiResponse<Order[]>>('/trade/orders')
    return response.data.data
  },

  async getTransactions(): Promise<Transaction[]> {
    const response = await api.get<ApiResponse<Transaction[]>>('/trade/transactions')
    return response.data.data
  },

  async executeOrder(order: {
    symbol: string
    side: 'BUY' | 'SELL'
    quantity: number
    orderType?: string
    limitPrice?: number
  }): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>('/trade/order', order)
    return response.data.data
  },
}

export default tradeService
