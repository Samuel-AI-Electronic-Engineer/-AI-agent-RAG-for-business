import { create } from 'zustand';

const readStoredUser = () => {
    try {
        const storedUser = localStorage.getItem('pf_user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch {
        localStorage.removeItem('pf_user');
        return null;
    }
};

const useAuthStore = create((set) => ({
    user: readStoredUser(),
    token: localStorage.getItem('pf_token') || null,

    login: (user, token) => {
        if (!user || !token) return;
        localStorage.setItem('pf_token', token);
        localStorage.setItem('pf_user', JSON.stringify(user));
        set({ user, token });
    },

    setUser: (user) => {
        localStorage.setItem('pf_user', JSON.stringify(user));
        set({ user });
    },

    setToken: (token) => {
        if (!token) return;
        localStorage.setItem('pf_token', token);
        set({ token });
    },

    logout: () => {
        localStorage.removeItem('pf_token');
        localStorage.removeItem('pf_user');
        set({ user: null, token: null });
    },
}));

export const clearStoredSession = () => {
    localStorage.removeItem('pf_token');
    localStorage.removeItem('pf_user');
    useAuthStore.setState({ user: null, token: null });
};

export default useAuthStore;
