import axios from 'axios';

// 🔥 PAKAI ENVIRONMENT VARIABLE UNTUK PRODUCTION
// Kalo di lokal pake localhost:1000, kalo di Render pake URL dari env
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: tambahkan token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
