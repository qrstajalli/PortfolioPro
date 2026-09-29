import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = '/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('portfoliopro_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Intercept 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // If token expired or unauthorized, clear storage
      const token = localStorage.getItem('portfoliopro_token')
      if (token && !error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('portfoliopro_token')
        localStorage.removeItem('portfoliopro_user')
        window.dispatchEvent(new Event('auth:unauthorized'))
      }
    }
    return Promise.reject(error)
  }
)

export default api
