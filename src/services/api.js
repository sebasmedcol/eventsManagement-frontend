import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

const PLAN_BLOCK_CODES = ['TRIAL_EXPIRED', 'SUBSCRIPTION_EXPIRED'];

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    if (status === 403 && data && PLAN_BLOCK_CODES.includes(data.code)) {
      try {
        window.dispatchEvent(new CustomEvent('plan:blocked', {
          detail: { motivo: data.code, mensaje: data.message || 'Tu plan ha finalizado. Renueva tu suscripcion para continuar.' },
        }));
      } catch { /* ignore */ }
    }
    return Promise.reject(error);
  }
);

export default api;