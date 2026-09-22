import api from '../config/api';

export const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
};

export const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
};

export const getCurrentUser = async () => {
    const { data } = await api.get('/users/me');
    return data;
};

export const logout = async () => {
    await api.post('/auth/logout');
};
