import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { getToken, removeToken } from './auth'
import type {
  User,
  Score,
  Subscription,
  Charity,
  Draw,
  DrawResult,
  Winner,
  AdminReport,
  Plan,
  TokenResponse,
  UserDrawResult,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach auth token
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    email: string
    password: string
    full_name: string
    charity_id?: string
    charity_percentage?: number
  }): Promise<AxiosResponse<TokenResponse>> =>
    api.post('/auth/register', data),

  login: (email: string, password: string): Promise<AxiosResponse<TokenResponse>> =>
    api.post('/auth/login', { email, password }),

  logout: (): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/auth/logout'),

  me: (): Promise<AxiosResponse<User>> =>
    api.get('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
}

// ─── Scores ────────────────────────────────────────────────────────────────────

export const scoresApi = {
  getScores: (): Promise<AxiosResponse<{ scores: Score[]; total: number }>> =>
    api.get('/scores'),

  addScore: (score: number, datePlayed: string): Promise<AxiosResponse<Score>> =>
    api.post('/scores', { score, date_played: datePlayed }),

  updateScore: (id: string, score?: number, datePlayed?: string): Promise<AxiosResponse<Score>> =>
    api.put(`/scores/${id}`, {
      ...(score !== undefined && { score }),
      ...(datePlayed && { date_played: datePlayed }),
    }),

  deleteScore: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/scores/${id}`),
}

// ─── Subscriptions ─────────────────────────────────────────────────────────────

export const subscriptionApi = {
  getPlans: (): Promise<AxiosResponse<Plan[]>> =>
    api.get('/subscription/plans'),

  getSubscription: (): Promise<AxiosResponse<Subscription | null>> =>
    api.get('/subscription'),

  createCheckout: (planType: 'monthly' | 'yearly'): Promise<AxiosResponse<{ checkout_url: string; session_id: string }>> =>
    api.post('/subscription/checkout', { plan_type: planType }),

  cancelSubscription: (): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/subscription/cancel'),
}

// ─── Charities ─────────────────────────────────────────────────────────────────

export const charitiesApi = {
  listCharities: (search?: string, featured?: boolean): Promise<AxiosResponse<Charity[]>> =>
    api.get('/charities', {
      params: {
        ...(search && { search }),
        ...(featured !== undefined && { featured }),
      },
    }),

  getCharity: (id: string): Promise<AxiosResponse<Charity>> =>
    api.get(`/charities/${id}`),

  donate: (charityId: string, amount: number): Promise<AxiosResponse<{ client_secret: string; payment_intent_id: string; amount: number; charity_name: string }>> =>
    api.post('/charities/donate', { charity_id: charityId, amount }),

  updateMyCharity: (charityId: string, charityPercentage: number): Promise<AxiosResponse<User>> =>
    api.put('/users/me/charity', { charity_id: charityId, charity_percentage: charityPercentage }),
}

// ─── Draws ─────────────────────────────────────────────────────────────────────

export const drawsApi = {
  listDraws: (): Promise<AxiosResponse<Draw[]>> =>
    api.get('/draws'),

  getDraw: (id: string): Promise<AxiosResponse<DrawResult>> =>
    api.get(`/draws/${id}`),

  myResults: (): Promise<AxiosResponse<UserDrawResult[]>> =>
    api.get('/draws/my-results'),
}

// ─── Winners ───────────────────────────────────────────────────────────────────

export const winnersApi = {
  myWinnings: (): Promise<AxiosResponse<Winner[]>> =>
    api.get('/winners/me'),

  getWinner: (id: string): Promise<AxiosResponse<Winner>> =>
    api.get(`/winners/${id}`),

  uploadProof: (winnerId: string, file: File): Promise<AxiosResponse<{ proof_url: string; message: string }>> => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/winners/${winnerId}/upload-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ─── Admin ─────────────────────────────────────────────────────────────────────

export const adminApi = {
  // Users
  listUsers: (params?: { search?: string; subscription_status?: string; role?: string; skip?: number; limit?: number }): Promise<AxiosResponse<User[]>> =>
    api.get('/admin/users', { params }),

  getUser: (id: string): Promise<AxiosResponse<User>> =>
    api.get(`/admin/users/${id}`),

  updateUser: (id: string, data: Partial<User>): Promise<AxiosResponse<User>> =>
    api.put(`/admin/users/${id}`, data),

  updateUserScores: (userId: string, scores: { score: number; date_played: string }[]): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/admin/users/${userId}/scores`, scores),

  // Subscriptions
  listSubscriptions: (params?: { status?: string }): Promise<AxiosResponse<Subscription[]>> =>
    api.get('/admin/subscriptions', { params }),

  // Draws
  listAdminDraws: (params?: { status?: string }): Promise<AxiosResponse<Draw[]>> =>
    api.get('/admin/draws', { params }),

  createDraw: (month: string, drawType: 'random' | 'algorithmic'): Promise<AxiosResponse<Draw>> =>
    api.post('/admin/draws', { month, draw_type: drawType }),

  simulateDraw: (drawId: string): Promise<AxiosResponse<{ drawn_numbers: number[]; winners: object; prize_breakdown: object }>> =>
    api.post(`/admin/draws/${drawId}/simulate`),

  publishDraw: (drawId: string): Promise<AxiosResponse<{ message: string; drawn_numbers: number[] }>> =>
    api.post(`/admin/draws/${drawId}/publish`),

  // Charities
  createCharity: (data: Partial<Charity>): Promise<AxiosResponse<Charity>> =>
    api.post('/admin/charities', data),

  updateCharity: (id: string, data: Partial<Charity>): Promise<AxiosResponse<Charity>> =>
    api.put(`/admin/charities/${id}`, data),

  deleteCharity: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/admin/charities/${id}`),

  // Winners
  listWinners: (params?: { verification_status?: string; payment_status?: string }): Promise<AxiosResponse<Winner[]>> =>
    api.get('/admin/winners', { params }),

  verifyWinner: (id: string, status: 'approved' | 'rejected', notes?: string): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/admin/winners/${id}/verify`, { status, admin_notes: notes }),

  markPayout: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/admin/winners/${id}/payout`),

  // Reports
  getReports: (): Promise<AxiosResponse<AdminReport>> =>
    api.get('/admin/reports'),
}

export default api
