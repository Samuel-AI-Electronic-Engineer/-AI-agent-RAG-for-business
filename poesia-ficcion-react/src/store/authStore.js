import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('pf_user')) || null,
    token: localStorage.getItem('pf_token') || null,

    login: (user, token) => {
        localStorage.setItem('pf_token', token);
        localStorage.setItem('pf_user', JSON.stringify(user));
        set({ user, token });
    },

    logout: () => {
        localStorage.removeItem('pf_token');
        localStorage.removeItem('pf_user');
        set({ user: null, token: null });
    },
}));

export default useAuthStore;
