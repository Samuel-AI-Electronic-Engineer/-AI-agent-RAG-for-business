import axios from 'axios';
import useAuthStore, { clearStoredSession } from '../store/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

let refreshPromise = null;

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('pf_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login')
            || originalRequest?.url?.includes('/auth/register')
            || originalRequest?.url?.includes('/auth/refresh')
            || originalRequest?.url?.includes('/auth/logout');

        if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
            originalRequest._retry = true;
            refreshPromise ||= axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
            try {
                const { data } = await refreshPromise;
                useAuthStore.getState().setToken(data.access_token);
                originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                clearStoredSession();
                window.dispatchEvent(new Event('pf-auth-expired'));
                return Promise.reject(refreshError);
            } finally {
                refreshPromise = null;
            }
        }

        if (error.response?.status === 401 && !isAuthEndpoint) {
            clearStoredSession();
            window.dispatchEvent(new Event('pf-auth-expired'));
        }
        return Promise.reject(error);
    },
);

export default api;
