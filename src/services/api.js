import axios from 'axios';

const api = axios.create({
    baseURL: process.env.VUE_APP_API_URL?.replace(/\/+$/, ''),
});

api.interceptors.request.use((config) => {
    const t = localStorage.getItem('auth_token');
    if (t) config.headers.Authorization = `Bearer ${t}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const st = err?.response?.status;
        if (st === 401 || st === 419) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_name');
            // redireciona pro login
            if (window.location.pathname !== '/') window.location.assign('/');
        }
        return Promise.reject(err);
    }
);

export default api;
