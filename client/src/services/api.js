import axios from 'axios';

const API_URL = '/api';

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
