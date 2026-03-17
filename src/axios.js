import axios from 'axios';

const baseURL =
    process.env.VUE_APP_API_URL ||
    'http://localhost:8000/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response && [401, 403].includes(err.response.status)) {
            sessionStorage.removeItem('auth_token');
            window.location.href = '/';
        }
        return Promise.reject(err);
    }
);

export default api;
