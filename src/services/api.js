import axios from 'axios';

const baseURL =
    process.env.VUE_APP_API_URL ||
    process.env.VITE_API_URL ||
    'http://localhost:8000/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
