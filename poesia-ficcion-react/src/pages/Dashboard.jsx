import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../services/authService';
import useAuthStore from '../store/authStore';

function Dashboard() {
    const storedUser = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const { data: user = storedUser } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: getCurrentUser,
        staleTime: 60_000,
    });

    useEffect(() => {
        if (user && user !== storedUser) {
            setUser(user);
        }
    }, [setUser, storedUser, user]);

    if (!user) {
        return null;
    }

    return (
        <main className="page page-dashboard">
            <section className="dashboard-card">
                <h1>Dashboard</h1>
                <p>Hola, <strong>{user.full_name || user.username}</strong>.</p>
                <p>Desde aquí podrás ver tus publicaciones y gestionar tu contenido.</p>
            </section>
        </main>
    );
}

export default Dashboard;
