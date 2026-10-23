/**
 * GlucoTwin API Client
 * Axios configuration with JWT authorization header and error handling.
 */

import axios from 'axios';

// Base URL uses relative path so Vite proxy forwards to FastAPI (port 8001)
const API_BASE_URL = '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('glucotwin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 by clearing invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('glucotwin_token');
        localStorage.removeItem('glucotwin_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (name: string, email: string, password: string, role = 'doctor') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

// Patients & Digital Twin Endpoints
export const patientsAPI = {
  getAll: async () => {
    const res = await api.get('/patients');
    return res.data;
  },
  getById: async (id: number | string) => {
    const res = await api.get(`/patients/${id}`);
    return res.data;
  },
  getReadings: async (id: number | string, hours = 24) => {
    const res = await api.get(`/patients/${id}/readings?hours=${hours}`);
    return res.data;
  },
  predict: async (id: number | string) => {
    const res = await api.get(`/patients/${id}/predict`);
    return res.data;
  },
  whatIf: async (
    id: number | string,
    payload: {
      extra_steps?: number;
      carb_intake_g?: number;
      sleep_hours_delta?: number;
      medication_taken?: boolean;
    }
  ) => {
    const res = await api.post(`/patients/${id}/predict`, payload);
    return res.data;
  },
};

// Model Metrics Endpoints
export const modelAPI = {
  getMetrics: async () => {
    const res = await api.get('/model/metrics');
    return res.data;
  },
};

// Health Endpoint
export const systemAPI = {
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },
};

export default api;
