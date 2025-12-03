import axios from 'axios';

// Use environment variable for API URL, fallback to relative path for dev
const API_BASE = import.meta.env.VITE_API_URL || '';
const API_URL = API_BASE ? `${API_BASE}/api` : '/api';

console.log('[AXIOS] API_URL configured as:', API_URL);

const api = axios.create({
    baseURL: API_URL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const auth = {
    login: (credentials) => api.post('/auth/login', credentials),
    loginCustomer: (credentials) => api.post('/auth/login-customer', credentials),
    loginSupplier: (credentials) => api.post('/auth/login-supplier', credentials),
    register: (userData) => api.post('/auth/register', userData),
    verifyOTP: (data) => api.post('/auth/verify-otp', data),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    resendOTP: (email) => api.post('/auth/resend-otp', { email })
};

export const users = {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (userData) => api.put('/users/profile', userData)
};

export default api;
