import axios from 'axios';
import { auth, getAuthToken } from './firebase';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor to add the Firebase ID Token
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const streamerApi = {
  getMe: () => api.get('/me').then(res => res.data),
  getByUsername: (username: string) => api.get(`/streamers/${username}`).then(res => res.data),
  setup: (data: any) => api.post('/me', data).then(res => res.data),
  update: (data: any) => api.patch('/me', data).then(res => res.data),
  delete: () => api.delete('/me').then(res => res.data),
};

export const widgetApi = {
  list: () => api.get('/widgets').then(res => res.data),
  create: (data: any) => api.post('/widgets', data).then(res => res.data),
  update: (id: string, config: any) => api.patch(`/widgets/${id}`, { config }).then(res => res.data),
};

export const donationApi = {
  list: () => api.get('/donations').then(res => res.data),
  createOrder: (data: any) => api.post('/payment/razorpay/order', data).then(res => res.data),
  recordSuccess: (data: any) => api.post('/payment/success', data).then(res => res.data),
};

export const adminApi = {
  listStreamers: () => api.get('/admin/streamers').then(res => res.data),
  getSettings: () => api.get('/admin/settings').then(res => res.data),
  updateSettings: (data: any) => api.patch('/admin/settings', { value: data }).then(res => res.data),
  getPlans: () => api.get('/admin/plans').then(res => res.data),
  createPlan: (data: any) => api.post('/admin/plans', data).then(res => res.data),
  updatePlan: (id: string, data: any) => api.patch(`/admin/plans/${id}`, data).then(res => res.data),
  deletePlan: (id: string) => api.delete(`/admin/plans/${id}`).then(res => res.data),
};

export default api;
