import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/utils/api'
export const useAuthStore = create(persist((set, get) => ({
  token: null, user: null, isAuthenticated: false,
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
    set({ token: data.access_token, user: data.user, isAuthenticated: true })
    return data
  },
  register: async (email, username, password) => {
    const { data } = await api.post('/auth/register', { email, username, password })
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`
    set({ token: data.access_token, user: data.user, isAuthenticated: true })
    return data
  },
  logout: () => { delete api.defaults.headers.common['Authorization']; set({ token:null, user:null, isAuthenticated:false }) },
  initAuth: () => { const { token } = get(); if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}` }
}), { name: 'anomaly-auth' }))
